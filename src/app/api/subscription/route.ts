import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { subscriberStatus } from "@/lib/subscriber-status";
export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Sign in with your Substack email first." }, { status: 401 });
  return NextResponse.json({ subscription: await subscriberStatus(member) }, { headers: { "Cache-Control": "no-store" } });
}
