/**
 * Core LSB engine. Pure functions: no DOM, no framing, no crypto.
 * Works on RGBA pixel data (e.g. canvas ImageData.data), so it runs
 * equally well on the main thread or inside a Web Worker.
 */

export type Channel = "r" | "g" | "b";
export type BitOrder = "msb-first" | "lsb-first";
export type Direction = "row" | "col";

export interface LsbParams {
  /** Bit plane 1..8. 1 = least significant bit (least visible). */
  plane: number;
  /** Which colour channels carry data, e.g. ["r","g","b"]. */
  channels: Channel[];
  /** Order in which a byte's bits are written. */
  bitOrder: BitOrder;
  /** Pixel scan direction. */
  direction: Direction;
  /**
   * Optional permutation mapping logical slot -> physical slot.
   * Used for password-based scattering. It only needs to cover the
   * slots actually used (payload bits), not the whole image.
   */
  permutation?: Uint32Array;
}

export const DEFAULT_PARAMS: LsbParams = {
  plane: 1,
  channels: ["r", "g", "b"],
  bitOrder: "msb-first",
  direction: "row",
};

const CHANNEL_OFFSET: Record<Channel, number> = { r: 0, g: 1, b: 2 };

function validate(params: LsbParams): void {
  if (!Number.isInteger(params.plane) || params.plane < 1 || params.plane > 8) {
    throw new Error("plane must be an integer from 1 to 8");
  }
  if (params.channels.length === 0) {
    throw new Error("at least one channel is required");
  }
}

/** Total number of bit slots available in the image. */
export function slotCount(width: number, height: number, params: LsbParams): number {
  return width * height * params.channels.length;
}

/** How many payload bytes fit in the image with these params. */
export function capacityBytes(width: number, height: number, params: LsbParams): number {
  validate(params);
  return Math.floor(slotCount(width, height, params) / 8);
}

/** Maps a logical slot number to an index in the RGBA byte array. */
function slotToDataIndex(
  slot: number,
  width: number,
  height: number,
  params: LsbParams
): number {
  let physical = slot;
  if (params.permutation) {
    if (slot >= params.permutation.length) throw new Error("permutation too short");
    physical = params.permutation[slot];
  }
  const nc = params.channels.length;
  const pixelOrdinal = Math.floor(physical / nc);
  const channel = params.channels[physical % nc];

  let pixelIndex: number;
  if (params.direction === "row") {
    pixelIndex = pixelOrdinal;
  } else {
    // column-major: walk down each column, then move right
    const x = Math.floor(pixelOrdinal / height);
    const y = pixelOrdinal % height;
    pixelIndex = y * width + x;
  }
  return pixelIndex * 4 + CHANNEL_OFFSET[channel];
}

function bitOf(byte: number, j: number, order: BitOrder): number {
  return order === "msb-first" ? (byte >> (7 - j)) & 1 : (byte >> j) & 1;
}

/**
 * Embed `payload` into a copy of `pixels`. Returns the new pixel array.
 * Throws if the payload does not fit.
 */
export function embed(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  payload: Uint8Array,
  params: LsbParams = DEFAULT_PARAMS
): Uint8ClampedArray {
  validate(params);
  if (payload.length > capacityBytes(width, height, params)) {
    throw new Error("Payload too large for this image");
  }

  const out = new Uint8ClampedArray(pixels); // copy, never mutate the input
  const bit = params.plane - 1;
  const clearMask = ~(1 << bit) & 0xff;

  let slot = 0;
  for (let i = 0; i < payload.length; i++) {
    for (let j = 0; j < 8; j++, slot++) {
      const idx = slotToDataIndex(slot, width, height, params);
      out[idx] = (out[idx] & clearMask) | (bitOf(payload[i], j, params.bitOrder) << bit);
    }
  }
  return out;
}

/**
 * Extract `byteCount` bytes from `pixels`.
 * Wrong params still return bytes; they will just be gibberish.
 */
export function extract(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  byteCount: number,
  params: LsbParams = DEFAULT_PARAMS
): Uint8Array {
  validate(params);
  if (byteCount > capacityBytes(width, height, params)) {
    throw new Error("Requested more bytes than the image can hold");
  }

  const out = new Uint8Array(byteCount);
  const bit = params.plane - 1;

  let slot = 0;
  for (let i = 0; i < byteCount; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++, slot++) {
      const idx = slotToDataIndex(slot, width, height, params);
      const b = (pixels[idx] >> bit) & 1;
      byte |= params.bitOrder === "msb-first" ? b << (7 - j) : b << j;
    }
    out[i] = byte;
  }
  return out;
}
