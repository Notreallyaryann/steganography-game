export const TIER_POINTS: Record<number, number> = { 1: 100, 2: 250, 3: 500, 4: 1000 };
export const WRONG_PENALTY = 25;

export interface ScoreInput {
  tier: number;
  elapsedSec: number;
  parSec: number;
  hintsUsed: number;
  hintCosts: number[];
  wrong: number;
}

/** Base + speed bonus (up to +50% under par, decaying to 0 at 3x par) - hints - wrong guesses. */
export function computeScore(i: ScoreInput): number {
  const base = TIER_POINTS[i.tier] ?? 100;
  let bonus = 0;
  if (i.elapsedSec <= i.parSec) bonus = 0.5;
  else if (i.elapsedSec < i.parSec * 3) bonus = 0.5 * (1 - (i.elapsedSec - i.parSec) / (i.parSec * 2));
  const hints = i.hintCosts.slice(0, i.hintsUsed).reduce((a, b) => a + b, 0);
  return Math.max(0, Math.round(base * (1 + bonus) - hints - WRONG_PENALTY * i.wrong));
}
