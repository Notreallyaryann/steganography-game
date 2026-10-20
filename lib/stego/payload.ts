/** What the Studio hides: either a text message or a whole file. */

export type Payload =
  | { kind: "text"; text: string }
  | { kind: "file"; name: string; data: Uint8Array };

const enc = new TextEncoder();
const dec = new TextDecoder();

export function encodePayload(p: Payload): Uint8Array {
  if (p.kind === "text") {
    const body = enc.encode(p.text);
    const out = new Uint8Array(1 + body.length);
    out[0] = 0;
    out.set(body, 1);
    return out;
  }
  const name = enc.encode(p.name).slice(0, 255);
  const out = new Uint8Array(1 + 2 + name.length + p.data.length);
  out[0] = 1;
  out[1] = (name.length >> 8) & 0xff;
  out[2] = name.length & 0xff;
  out.set(name, 3);
  out.set(p.data, 3 + name.length);
  return out;
}

export function decodePayload(bytes: Uint8Array): Payload | null {
  if (bytes.length < 1) return null;
  if (bytes[0] === 0) return { kind: "text", text: dec.decode(bytes.slice(1)) };
  if (bytes[0] === 1 && bytes.length >= 3) {
    const n = (bytes[1] << 8) | bytes[2];
    if (bytes.length < 3 + n) return null;
    return { kind: "file", name: dec.decode(bytes.slice(3, 3 + n)), data: bytes.slice(3 + n) };
  }
  return null;
}
