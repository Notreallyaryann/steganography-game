/**
 * WAV (16-bit PCM) support. The low byte of every sample is exposed to the
 * LSB engine as the "r" channel of a 1-pixel-high image, so audio reuses the
 * exact same embed/extract code as images.
 */
import type { Carrier } from "./studio.ts";

export interface WavInfo {
  dataOffset: number;
  dataLength: number;
  numChannels: number;
  sampleRate: number;
}

export function parseWav(buf: Uint8Array): WavInfo {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const tag = (o: number) => String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
  if (buf.length < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("Not a WAV file");

  let fmt: { format: number; ch: number; rate: number; bits: number } | null = null;
  let pos = 12;
  while (pos + 8 <= buf.length) {
    const id = tag(pos);
    const size = v.getUint32(pos + 4, true);
    if (id === "fmt " && pos + 24 <= buf.length) {
      fmt = {
        format: v.getUint16(pos + 8, true),
        ch: v.getUint16(pos + 10, true),
        rate: v.getUint32(pos + 12, true),
        bits: v.getUint16(pos + 22, true),
      };
    } else if (id === "data") {
      if (!fmt) throw new Error("WAV has no fmt chunk before data");
      if ((fmt.format !== 1 && fmt.format !== 0xfffe) || fmt.bits !== 16) {
        throw new Error("Only 16-bit PCM WAV files are supported");
      }
      const dataOffset = pos + 8;
      const dataLength = Math.min(size, buf.length - dataOffset) & ~1;
      return { dataOffset, dataLength, numChannels: fmt.ch, sampleRate: fmt.rate };
    }
    pos += 8 + size + (size & 1);
  }
  throw new Error("WAV has no data chunk");
}

export function wavToCarrier(buf: Uint8Array): { carrier: Carrier; info: WavInfo } {
  const info = parseWav(buf);
  const n = info.dataLength / 2;
  const pixels = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) pixels[i * 4] = buf[info.dataOffset + i * 2];
  return { carrier: { pixels, width: n, height: 1, channels: ["r"] }, info };
}

export function carrierToWav(buf: Uint8Array, info: WavInfo, pixels: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(buf);
  const n = info.dataLength / 2;
  for (let i = 0; i < n; i++) out[info.dataOffset + i * 2] = pixels[i * 4];
  return out;
}
