import { NextResponse } from "next/server";
import { claimUser } from "@/lib/db.server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";

  if (!username.trim()) {
    return NextResponse.json({ ok: false, error: "Username is required." }, { status: 400 });
  }

  const result = await claimUser(username);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
