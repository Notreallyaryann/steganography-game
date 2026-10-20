/** Browser-only helpers: File/URL <-> RGBA pixels <-> PNG. */

export interface Pixels {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Decode an image to RGBA. Transparent areas are flattened onto white so every
 * pixel is fully opaque; otherwise the browser's alpha premultiplication would
 * corrupt the hidden bits.
 */
export async function loadImageBlob(blob: Blob): Promise<Pixels> {
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp; // read before close(): a closed bitmap reports 0x0
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bmp, 0, 0);
  const data = ctx.getImageData(0, 0, width, height);
  bmp.close();
  return { pixels: data.data, width, height };
}

export async function loadImageUrl(url: string): Promise<Pixels> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load image");
  return loadImageBlob(await res.blob());
}

export function pixelsToPngBlob(p: Pixels): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = p.width;
  canvas.height = p.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas is not available"));
  ctx.putImageData(new ImageData(new Uint8ClampedArray(p.pixels), p.width, p.height), 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png")
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
