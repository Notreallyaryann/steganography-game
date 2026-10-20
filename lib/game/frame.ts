/** Game payload frame: "SGM1" + u16 length (big-endian) + bytes. */

const MAGIC = [0x53, 0x47, 0x4d, 0x31];
export const FRAME_HEADER = 6;

export function frame(msg: Uint8Array): Uint8Array {
  const out = new Uint8Array(FRAME_HEADER + msg.length);
  out.set(MAGIC, 0);
  out[4] = (msg.length >> 8) & 0xff;
  out[5] = msg.length & 0xff;
  out.set(msg, FRAME_HEADER);
  return out;
}

/** Returns the message length if `head` starts with a valid frame header, else null. */
export function parseFrameLength(head: Uint8Array): number | null {
  if (head.length < FRAME_HEADER) return null;
  for (let i = 0; i < 4; i++) if (head[i] !== MAGIC[i]) return null;
  return (head[4] << 8) | head[5];
}
