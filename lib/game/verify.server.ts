/** SERVER ONLY. Constant-time check of a submitted answer. */
import { timingSafeEqual } from "node:crypto";
import { ANSWERS } from "./answers.server.ts";
import { hashAnswer } from "./hash.server.ts";

export function checkAnswer(missionId: string, answer: string): boolean | null {
  const rec = ANSWERS[missionId];
  if (!rec) return null;
  const a = Buffer.from(hashAnswer(rec.salt, answer), "hex");
  const b = Buffer.from(rec.sha256, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
