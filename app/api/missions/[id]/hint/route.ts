import { NextResponse } from "next/server";
import { getMission } from "@/lib/game/missions";
import { HINTS } from "@/lib/game/hints.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getMission(id)) return NextResponse.json({ error: "Unknown mission" }, { status: 404 });
  const n = Number(new URL(req.url).searchParams.get("n"));
  const text = HINTS[id]?.[n];
  if (!Number.isInteger(n) || text === undefined) return NextResponse.json({ error: "No such hint" }, { status: 404 });
  return NextResponse.json({ text });
}
