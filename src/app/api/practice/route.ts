import { SESSION_REQUIRED } from "@/lib/testing-mode";
import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { readPractice } from "@/lib/practice-server";

export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: SESSION_REQUIRED }, { status: 401 });
  const practice = await readPractice(member);
  return NextResponse.json({ memberId: member.id, practice }, { status: practice ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
