import { NextResponse } from "next/server";
import { getMission } from "@/lib/game/missions";
import { checkAnswer } from "@/lib/game/verify.server";

export const dynamic = "force-dynamic";

// In-memory limiter: fine for one server process. Use Redis or similar when you scale out.
const hits = new Map<string, number[]>();
const LIMIT = 10;
const WINDOW_MS = 60_000;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getMission(id)) return NextResponse.json({ error: "Unknown mission" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}:${id}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  recent.push(now);
  hits.set(key, recent);

  const body = await req.json().catch(() => null);
  const answer = typeof body?.answer === "string" ? body.answer.slice(0, 200) : "";
  return NextResponse.json({ correct: checkAnswer(id, answer) === true });
}
