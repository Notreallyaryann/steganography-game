/**
 * Password-seeded scattering. Instead of writing bits in pixel order, the body
 * of the message is written to pseudo-random slots chosen from the seed.
 */

/** sfc32: small, fast, seedable PRNG. Returns floats in [0, 1). */
export function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function rngFromSeed(seed: Uint8Array): () => number {
  if (seed.length < 16) throw new Error("seed must be at least 16 bytes");
  const v = new DataView(seed.buffer, seed.byteOffset, seed.byteLength);
  const rng = sfc32(v.getUint32(0), v.getUint32(4), v.getUint32(8), v.getUint32(12));
  for (let i = 0; i < 15; i++) rng(); // warm up
  return rng;
}

/**
 * Builds a slot permutation of length headerSlots + bodySlots.
 *  - the first headerSlots entries are identity (header stays sequential)
 *  - the remaining entries are distinct slots sampled from
 *    [headerSlots, totalSlots) using a sparse Fisher-Yates (O(bodySlots) memory)
 */
export function scatterPermutation(
  headerSlots: number,
  bodySlots: number,
  totalSlots: number,
  seed: Uint8Array
): Uint32Array {
  const pool = totalSlots - headerSlots;
  if (bodySlots > pool) throw new Error("not enough slots");
  const rng = rngFromSeed(seed);
  const out = new Uint32Array(headerSlots + bodySlots);
  for (let i = 0; i < headerSlots; i++) out[i] = i;

  const swapped = new Map<number, number>();
  for (let i = 0; i < bodySlots; i++) {
    const j = i + Math.floor(rng() * (pool - i));
    const vi = swapped.get(i) ?? i;
    const vj = swapped.get(j) ?? j;
    out[headerSlots + i] = headerSlots + vj;
    swapped.set(j, vi);
  }
  return out;
}
