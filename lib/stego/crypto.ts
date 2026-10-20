/** Password -> keys, and AES-GCM encrypt/decrypt, via the Web Crypto API. */

const PBKDF2_ITERATIONS = 210_000;
const enc = new TextEncoder();

const bs = (u: Uint8Array) => u as unknown as BufferSource;

export interface DerivedKeys {
  aesKey: CryptoKey;
  /** 4 bytes used to mask the stored length. */
  lenMask: Uint8Array;
  /** 16 bytes seeding the pixel scatter. */
  seed: Uint8Array;
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

export async function deriveKeys(password: string, salt: Uint8Array): Promise<DerivedKeys> {
  const base = await crypto.subtle.importKey("raw", bs(enc.encode(password)), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: bs(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      base,
      8 * 52
    )
  );
  const aesKey = await crypto.subtle.importKey("raw", bs(bits.slice(0, 32)), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  return { aesKey, lenMask: bits.slice(32, 36), seed: bits.slice(36, 52) };
}

export async function encrypt(plain: Uint8Array, key: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: bs(iv) }, key, bs(plain)));
}

/** Returns null if the password is wrong or the data was tampered with. */
export async function decrypt(
  cipher: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, key, bs(cipher)));
  } catch {
    return null;
  }
}
