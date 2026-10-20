/** Decoding layers used by the game: base64, hex, XOR, gzip, plus viewers. */

export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) {
    throw new Error("Not valid base64");
  }
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function toBase64(data: Uint8Array): string {
  let s = "";
  for (const b of data) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromHex(s: string): Uint8Array {
  const clean = s.replace(/[\s:]/g, "");
  if (!/^([0-9a-fA-F]{2})*$/.test(clean)) throw new Error("Not valid hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function toHex(data: Uint8Array): string {
  return Array.from(data, (b) => b.toString(16).padStart(2, "0")).join(" ");
}

export function xorKey(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length === 0) throw new Error("Key is empty");
  return data.map((b, i) => b ^ key[i % key.length]);
}

export async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Printable preview: non-printable bytes become a middle dot. */
export function printable(data: Uint8Array, max = 160): string {
  let s = "";
  for (let i = 0; i < Math.min(data.length, max); i++) {
    const b = data[i];
    s += b >= 32 && b <= 126 ? String.fromCharCode(b) : "\u00b7";
  }
  return s + (data.length > max ? "\u2026" : "");
}

export function asciiString(data: Uint8Array): string {
  let s = "";
  for (const b of data) s += String.fromCharCode(b);
  return s;
}
