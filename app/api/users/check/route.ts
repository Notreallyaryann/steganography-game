import { NextResponse } from "next/server";
import { checkUsername } from "@/lib/db.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("username") ?? "";

  if (!raw.trim()) {
    return NextResponse.json({ available: false, reason: "Please enter a username." });
  }

  const result = await checkUsername(raw);
  return NextResponse.json(result);
}
