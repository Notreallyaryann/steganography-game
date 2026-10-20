import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = await getLeaderboard(100);
    return NextResponse.json({ leaderboard });
  } catch (err: unknown) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
  }
}
