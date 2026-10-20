/**
 * Studio engine: password-protected hide/reveal.
 *
 * Layout inside the carrier (all bits in plane 1):
 *   [salt 16][iv 12][masked length 4]   -> first 32 bytes, sequential
 *   [AES-GCM ciphertext + tag]          -> scattered by a password-derived permutation
 *
 * Nothing in the data is recognisable: salt and iv are random, the length is
 * XOR-masked with a key-derived value, and the ciphertext looks random.
 * A wrong password and "nothing hidden" both produce null.
 */
import { embed, extract, capacityBytes, slotCount, type Channel, type LsbParams } from "./lsb.ts";
import { deriveKeys, encrypt, decrypt, randomBytes } from "./crypto.ts";
import { scatterPermutation } from "./scatter.ts";

export const HEADER_BYTES = 32;
const TAG_BYTES = 16;

/** Pixel-like carrier. Audio is adapted to this shape by wav.ts. */
export interface Carrier {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  channels: Channel[];
}

function baseParams(c: Carrier, permutation?: Uint32Array): LsbParams {
  return { plane: 1, channels: c.channels, bitOrder: "msb-first", direction: "row", permutation };
}

/** Largest plaintext (in bytes) that can be hidden in this carrier. */
export function studioCapacity(c: Carrier): number {
  return Math.max(0, capacityBytes(c.width, c.height, baseParams(c)) - HEADER_BYTES - TAG_BYTES);
}

export async function hide(
  c: Carrier,
  plaintext: Uint8Array,
  password: string
): Promise<Uint8ClampedArray> {
  if (!password) throw new Error("A password is required");
  if (plaintext.length > studioCapacity(c)) throw new Error("Message is too large for this file");

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const keys = await deriveKeys(password, salt);
  const cipher = await encrypt(plaintext, keys.aesKey, iv);

  const bytes = new Uint8Array(HEADER_BYTES + cipher.length);
  bytes.set(salt, 0);
  bytes.set(iv, 16);
  const mask = new DataView(keys.lenMask.buffer, keys.lenMask.byteOffset, 4).getUint32(0);
  new DataView(bytes.buffer).setUint32(28, (cipher.length ^ mask) >>> 0);
  bytes.set(cipher, HEADER_BYTES);

  const total = slotCount(c.width, c.height, baseParams(c));
  const perm = scatterPermutation(HEADER_BYTES * 8, cipher.length * 8, total, keys.seed);
  return embed(c.pixels, c.width, c.height, bytes, baseParams(c, perm));
}

/** Returns the plaintext, or null if nothing is found / wrong password. */
export async function reveal(c: Carrier, password: string): Promise<Uint8Array | null> {
  const cap = capacityBytes(c.width, c.height, baseParams(c));
  if (!password || cap < HEADER_BYTES + TAG_BYTES) return null;

  const head = extract(c.pixels, c.width, c.height, HEADER_BYTES, baseParams(c));
  const salt = head.slice(0, 16);
  const iv = head.slice(16, 28);
  const keys = await deriveKeys(password, salt);
  const mask = new DataView(keys.lenMask.buffer, keys.lenMask.byteOffset, 4).getUint32(0);
  const len = (new DataView(head.buffer).getUint32(28) ^ mask) >>> 0;
  if (len < TAG_BYTES || len > cap - HEADER_BYTES) return null;

  const total = slotCount(c.width, c.height, baseParams(c));
  const perm = scatterPermutation(HEADER_BYTES * 8, len * 8, total, keys.seed);
  const all = extract(c.pixels, c.width, c.height, HEADER_BYTES + len, baseParams(c, perm));
  return decrypt(all.slice(HEADER_BYTES), keys.aesKey, iv);
}
