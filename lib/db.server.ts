import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlInstance: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  if (!sqlInstance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is missing");
    }
    sqlInstance = neon(url);
  }
  return sqlInstance;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{2,30}$/;

export function sanitizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: "Username must be at least 2 characters." };
  }
  if (trimmed.length > 30) {
    return { valid: false, error: "Username cannot exceed 30 characters." };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: "Only letters, numbers, hyphens, and underscores are allowed." };
  }
  return { valid: true };
}

/** Check if a username is available (case-insensitive) */
export async function checkUsername(username: string): Promise<{
  available: boolean;
  cleanUsername: string;
  reason?: string;
}> {
  const format = validateUsernameFormat(username);
  const clean = sanitizeUsername(username);

  if (!format.valid) {
    return { available: false, cleanUsername: clean, reason: format.error };
  }

  const sql = getDb();
  const existing = await sql`
    SELECT id, username FROM users WHERE LOWER(username) = ${clean} LIMIT 1;
  `;

  if (existing.length > 0) {
    return { available: false, cleanUsername: clean, reason: "That username is already taken." };
  }

  return { available: true, cleanUsername: clean };
}

/** Claim a unique username (no auth required) */
export async function claimUser(username: string): Promise<{
  ok: boolean;
  username?: string;
  totalScore?: number;
  error?: string;
}> {
  const format = validateUsernameFormat(username);
  if (!format.valid) {
    return { ok: false, error: format.error };
  }

  const clean = sanitizeUsername(username);
  const sql = getDb();

  try {
    const rows = await sql`
      INSERT INTO users (username)
      VALUES (${clean})
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, total_score;
    `;

    if (rows.length === 0) {
      // Username exists: return current info
      const existing = await sql`
        SELECT username, total_score FROM users WHERE LOWER(username) = ${clean} LIMIT 1;
      `;
      if (existing.length > 0) {
        return {
          ok: true,
          username: existing[0].username as string,
          totalScore: Number(existing[0].total_score ?? 0),
        };
      }
      return { ok: false, error: "Username is already taken." };
    }

    return {
      ok: true,
      username: rows[0].username as string,
      totalScore: Number(rows[0].total_score ?? 0),
    };
  } catch (err: unknown) {
    console.error("claimUser error:", err);
    return { ok: false, error: "Failed to claim username. Please try again." };
  }
}

/** Upsert a mission score and update the user's aggregate total score */
export async function recordScore(
  username: string,
  missionId: string,
  score: number,
  elapsedSec: number = 0,
  hintsUsed: number = 0
): Promise<{ ok: boolean; totalScore: number; error?: string }> {
  const clean = sanitizeUsername(username);
  const sql = getDb();

  try {
    // Ensure user exists
    await sql`
      INSERT INTO users (username) VALUES (${clean})
      ON CONFLICT (username) DO NOTHING;
    `;

    // Record / update mission score (keep best score)
    await sql`
      INSERT INTO mission_scores (username, mission_id, score, elapsed_sec, hints_used, solved_at)
      VALUES (${clean}, ${missionId}, ${score}, ${elapsedSec}, ${hintsUsed}, NOW())
      ON CONFLICT (username, mission_id)
      DO UPDATE SET
        score = GREATEST(mission_scores.score, EXCLUDED.score),
        elapsed_sec = LEAST(mission_scores.elapsed_sec, EXCLUDED.elapsed_sec),
        solved_at = NOW();
    `;

    // Update aggregate on users table
    const updated = await sql`
      UPDATE users SET
        total_score = (SELECT COALESCE(SUM(score), 0) FROM mission_scores WHERE username = ${clean}),
        missions_completed = (SELECT COUNT(*) FROM mission_scores WHERE username = ${clean}),
        last_active = NOW()
      WHERE username = ${clean}
      RETURNING total_score;
    `;

    const total = Number(updated[0]?.total_score ?? score);
    return { ok: true, totalScore: total };
  } catch (err: unknown) {
    console.error("recordScore error:", err);
    return { ok: false, totalScore: 0, error: "Failed to record score." };
  }
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  totalScore: number;
  missionsCompleted: number;
  lastActive: string;
}

/** Get top players on the leaderboard */
export async function getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      username,
      total_score,
      missions_completed,
      last_active
    FROM users
    WHERE total_score > 0 OR missions_completed > 0
    ORDER BY total_score DESC, last_active ASC
    LIMIT ${limit};
  `;

  return rows.map((r, i) => ({
    rank: i + 1,
    username: String(r.username),
    totalScore: Number(r.total_score ?? 0),
    missionsCompleted: Number(r.missions_completed ?? 0),
    lastActive: r.last_active ? new Date(String(r.last_active)).toISOString() : new Date().toISOString(),
  }));
}
