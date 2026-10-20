import assert from "node:assert/strict";
import { checkUsername, claimUser, recordScore, getLeaderboard, sanitizeUsername } from "../lib/db.server.ts";

console.log("Testing Neon DB operations...");

// 1. Sanitize
assert.equal(sanitizeUsername("  Agent_Falcon  "), "agent_falcon");

// 2. Format validation
const invalidCheck = await checkUsername("a");
assert.equal(invalidCheck.available, false);

// 3. Unique test user
const testUser = "test_agent_" + Date.now();
const availCheck = await checkUsername(testUser);
assert.equal(availCheck.available, true);

// 4. Claim user
const claimRes = await claimUser(testUser);
assert.equal(claimRes.ok, true);
assert.equal(claimRes.username, testUser);

// 5. Check taken
const takenCheck = await checkUsername(testUser);
assert.equal(takenCheck.available, false);

// 6. Record score
const scoreRes = await recordScore(testUser, "mission-01", 125, 45, 0);
assert.equal(scoreRes.ok, true);
assert.equal(scoreRes.totalScore, 125);

// 7. Get leaderboard
const lb = await getLeaderboard(5);
assert.ok(Array.isArray(lb));
const entry = lb.find((e) => e.username === testUser);
assert.ok(entry);
assert.equal(entry.totalScore, 125);

// 8. Clean up test user
import { getDb } from "../lib/db.server.ts";
const sql = getDb();
await sql`DELETE FROM users WHERE username = ${testUser};`;

console.log("All Neon database tests passed successfully!");
