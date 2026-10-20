import { NextResponse } from "next/server";
import { recordScore } from "@/lib/db.server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const missionId = typeof body?.missionId === "string" ? body.missionId.trim() : "";
  const score = typeof body?.score === "number" ? Math.max(0, body.score) : 0;
  const elapsedSec = typeof body?.elapsedSec === "number" ? Math.max(0, body.elapsedSec) : 0;
  const hintsUsed = typeof body?.hintsUsed === "number" ? Math.max(0, body.hintsUsed) : 0;

  if (!username) {
    return NextResponse.json({ ok: false, error: "Username is required." }, { status: 400 });
  }
  if (!missionId) {
    return NextResponse.json({ ok: false, error: "Mission ID is required." }, { status: 400 });
  }

  const result = await recordScore(username, missionId, score, elapsedSec, hintsUsed);
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
