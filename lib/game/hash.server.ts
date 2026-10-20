/** SERVER ONLY (also used by the build script). Salted answer hashing. */
import { createHash } from "node:crypto";

export function normalize(answer: string): string {
  return answer.trim().toLowerCase();
}

export function hashAnswer(salt: string, answer: string): string {
  return createHash("sha256").update(`${salt}:${normalize(answer)}`).digest("hex");
}
