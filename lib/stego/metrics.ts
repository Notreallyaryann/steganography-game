/** Peak signal-to-noise ratio between two RGBA buffers (alpha ignored), in dB. */
export function psnr(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    if ((i & 3) === 3) continue;
    const d = a[i] - b[i];
    sum += d * d;
    n++;
  }
  if (sum === 0) return Infinity;
  return 10 * Math.log10((255 * 255) / (sum / n));
}
