import { SESSION_REQUIRED } from "@/lib/testing-mode";
import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { subscriberStatus } from "@/lib/subscriber-status";
export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: SESSION_REQUIRED }, { status: 401 });
  return NextResponse.json({ subscription: await subscriberStatus(member, true) }, { headers: { "Cache-Control": "no-store" } });
}
