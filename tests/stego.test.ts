import assert from "node:assert/strict";
import { embed, extract, capacityBytes, type LsbParams } from "../lib/stego/lsb.ts";
import { hide, reveal, studioCapacity, type Carrier } from "../lib/stego/studio.ts";
import { encodePayload, decodePayload } from "../lib/stego/payload.ts";
import { parseWav, wavToCarrier, carrierToWav } from "../lib/stego/wav.ts";
import { fromBase64, toBase64, fromHex, toHex, xorKey } from "../lib/stego/layers.ts";
import { scatterPermutation } from "../lib/stego/scatter.ts";
import { psnr } from "../lib/stego/metrics.ts";
import { frame, parseFrameLength } from "../lib/game/frame.ts";
import { computeScore } from "../lib/game/scoring.ts";
import { checkAnswer } from "../lib/game/verify.server.ts";
import { HINTS } from "../lib/game/hints.server.ts";
import { MISSIONS } from "../lib/game/missions.ts";

let passed = 0;
const t = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  passed++;
  console.log("ok  " + name);
};

function randomPixels(w: number, h: number): Uint8ClampedArray {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < px.length; i++) px[i] = i % 4 === 3 ? 255 : Math.floor(Math.random() * 256);
  return px;
}
const carrier = (w = 64, h = 64): Carrier => ({ pixels: randomPixels(w, h), width: w, height: h, channels: ["r", "g", "b"] });
const enc = new TextEncoder();
const dec = new TextDecoder();

await t("LSB round-trip across all parameter combinations", () => {
  const w = 40, h = 30;
  const msg = enc.encode("hello, steganography!");
  for (const plane of [1, 2, 3, 8])
    for (const channels of [["r"], ["g", "b"], ["r", "g", "b"]] as const)
      for (const bitOrder of ["msb-first", "lsb-first"] as const)
        for (const direction of ["row", "col"] as const) {
          const p: LsbParams = { plane, channels: [...channels], bitOrder, direction };
          const px = randomPixels(w, h);
          const out = embed(px, w, h, msg, p);
          assert.deepEqual(extract(out, w, h, msg.length, p), msg);
        }
});

await t("embed never mutates its input and only changes the chosen plane", () => {
  const px = randomPixels(32, 32);
  const copy = new Uint8ClampedArray(px);
  const out = embed(px, 32, 32, enc.encode("abc"), { plane: 1, channels: ["r"], bitOrder: "msb-first", direction: "row" });
  assert.deepEqual(px, copy);
  for (let i = 0; i < px.length; i++) assert.ok(Math.abs(out[i] - px[i]) <= 1);
  for (let i = 0; i < px.length; i += 4) { assert.equal(out[i + 1], px[i + 1]); assert.equal(out[i + 3], px[i + 3]); }
});

await t("wrong parameters give gibberish, not the message", () => {
  const msg = enc.encode("secret secret secret");
  const out = embed(randomPixels(40, 30), 40, 30, msg, { plane: 1, channels: ["r", "g", "b"], bitOrder: "msb-first", direction: "row" });
  const wrong = extract(out, 40, 30, msg.length, { plane: 2, channels: ["r", "g", "b"], bitOrder: "msb-first", direction: "row" });
  assert.notDeepEqual(wrong, msg);
});

await t("capacity and too-large payload", () => {
  const p: LsbParams = { plane: 1, channels: ["r", "g", "b"], bitOrder: "msb-first", direction: "row" };
  assert.equal(capacityBytes(10, 10, p), 37);
  assert.throws(() => embed(randomPixels(10, 10), 10, 10, new Uint8Array(38), p), /too large/);
});

await t("scatter: distinct slots, header identity, deterministic", () => {
  const seed = new Uint8Array(16).map((_, i) => i * 7 + 1);
  const a = scatterPermutation(256, 800, 5000, seed);
  const b = scatterPermutation(256, 800, 5000, seed);
  assert.deepEqual(a, b);
  for (let i = 0; i < 256; i++) assert.equal(a[i], i);
  const body = Array.from(a.slice(256));
  assert.equal(new Set(body).size, body.length);
  assert.ok(body.every((s) => s >= 256 && s < 5000));
});

await t("Studio: hide/reveal round-trip (text)", async () => {
  const c = carrier();
  const plain = encodePayload({ kind: "text", text: "meet at dawn \u2603" });
  const out = await hide(c, plain, "correct horse");
  const got = await reveal({ ...c, pixels: out }, "correct horse");
  assert.ok(got);
  const p = decodePayload(got!);
  assert.deepEqual(p, { kind: "text", text: "meet at dawn \u2603" });
  assert.ok(psnr(c.pixels, out) > 50);
});

await t("Studio: file payload round-trip", async () => {
  const c = carrier(96, 96);
  const data = new Uint8Array(500).map((_, i) => i % 251);
  const out = await hide(c, encodePayload({ kind: "file", name: "note.bin", data }), "pw");
  const p = decodePayload((await reveal({ ...c, pixels: out }, "pw"))!);
  assert.deepEqual(p, { kind: "file", name: "note.bin", data });
});

await t("Studio: wrong password and unmodified image both give null", async () => {
  const c = carrier();
  const out = await hide(c, encodePayload({ kind: "text", text: "x" }), "right");
  assert.equal(await reveal({ ...c, pixels: out }, "wrong"), null);
  assert.equal(await reveal(c, "right"), null);
  assert.equal(await reveal({ ...c, pixels: out }, ""), null);
});

await t("Studio: capacity enforcement", async () => {
  const c = carrier(20, 20);
  const cap = studioCapacity(c);
  assert.ok(cap > 0);
  await hide(c, new Uint8Array(cap), "pw");
  await assert.rejects(hide(c, new Uint8Array(cap + 1), "pw"), /too large/);
  await assert.rejects(hide(c, new Uint8Array(1), ""), /password/i);
});

await t("WAV: hide/reveal in audio", async () => {
  const samples = 20000;
  const buf = new Uint8Array(44 + samples * 2);
  const v = new DataView(buf.buffer);
  const tag = (o: number, s: string) => [...s].forEach((ch, i) => (buf[o + i] = ch.charCodeAt(0)));
  tag(0, "RIFF"); v.setUint32(4, 36 + samples * 2, true); tag(8, "WAVE"); tag(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  tag(36, "data"); v.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) v.setInt16(44 + i * 2, Math.round(8000 * Math.sin(i / 20)), true);

  assert.equal(parseWav(buf).sampleRate, 44100);
  const { carrier: c, info } = wavToCarrier(buf);
  const out = await hide(c, encodePayload({ kind: "text", text: "audio secret" }), "pw");
  const wav2 = carrierToWav(buf, info, out);
  assert.equal(wav2.length, buf.length);
  const { carrier: c2 } = wavToCarrier(wav2);
  assert.deepEqual(decodePayload((await reveal(c2, "pw"))!), { kind: "text", text: "audio secret" });
  assert.equal(await reveal(c2, "nope"), null);
  assert.throws(() => parseWav(new Uint8Array(100)), /Not a WAV/);
});

await t("layers: base64, hex, xor", () => {
  const data = enc.encode("layered");
  assert.deepEqual(fromBase64(toBase64(data)), data);
  assert.deepEqual(fromHex(toHex(data)), data);
  assert.deepEqual(xorKey(xorKey(data, enc.encode("K")), enc.encode("K")), data);
  assert.throws(() => fromBase64("***"));
  assert.throws(() => fromHex("zz"));
});

await t("game frame + scoring", () => {
  const f = frame(enc.encode("hi"));
  assert.equal(parseFrameLength(f.slice(0, 6)), 2);
  assert.equal(parseFrameLength(new Uint8Array(6)), null);
  const base = { tier: 1, parSec: 300, hintsUsed: 0, hintCosts: [50, 100, 200], wrong: 0 };
  assert.equal(computeScore({ ...base, elapsedSec: 100 }), 150);
  assert.equal(computeScore({ ...base, elapsedSec: 900 }), 100);
  assert.equal(computeScore({ ...base, elapsedSec: 100, hintsUsed: 2, wrong: 1 }), 0);
  assert.equal(computeScore({ ...base, tier: 2, elapsedSec: 10, hintsUsed: 1, wrong: 2 }), 375 - 50 - 50);
});

await t("server answer check: normalised, salted, no plaintext shipped", async () => {
  assert.equal(checkAnswer("mission-01", "  NightHawk "), true);
  assert.equal(checkAnswer("mission-01", "copperfield"), false);
  assert.equal(checkAnswer("mission-04", "IRONCLAD"), true);
  assert.equal(checkAnswer("nope", "x"), null);
  const { readFileSync } = await import("node:fs");
  const answers = readFileSync(new URL("../lib/game/answers.server.ts", import.meta.url), "utf8");
  for (const w of ["nighthawk", "copperfield", "marble", "ironclad"]) assert.ok(!answers.toLowerCase().includes(w));
  const pub = JSON.stringify(MISSIONS);
  assert.ok(!/sha256|salt|params|permutation|nighthawk|copperfield|marble|ironclad/i.test(pub), "public mission data must not leak solutions");
  for (const m of MISSIONS) assert.equal(HINTS[m.id].length, m.hintCosts.length);
});

console.log(`\n${passed} tests passed`);
