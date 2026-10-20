/** Local progress (localStorage). A backend would replace this later. */

export interface MissionProgress {
  startedAt: number;
  wrong: number;
  hintsUsed: number;
  solved?: { score: number; at: number };
}
export type ProgressMap = Record<string, MissionProgress>;

const KEY = "stegame:v1";

export function loadProgress(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as ProgressMap;
  } catch {
    return {};
  }
}

export function saveProgress(p: ProgressMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress simply won't persist */
  }
}
