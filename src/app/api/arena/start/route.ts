import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getChallenge } from "@/lib/arena/challenges";
import { challengeVersion } from "@/lib/arena/contract";
import { getKey } from "@/lib/arena/keys";
import { practiceTimezone } from "@/lib/practice";

export async function POST(req: Request) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Sign in and verify your email to start a challenge." }, { status: 401 });
  const { slug, timezone } = (await req.json().catch(() => ({}))) as { slug?: string; timezone?: unknown };
  const c = slug && getChallenge(slug);
  if (!c) return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });
  if (!member.practice_timezone) {
    // Set once per account, not per request or device. Changing browser zones
    // cannot create additional practice days or erase an existing local day.
    const { error } = await adminClient().from("members").update({ practice_timezone: practiceTimezone(timezone) }).eq("id", member.id).is("practice_timezone", null);
    if (error) return NextResponse.json({ error: "Could not save the start. Please try again." }, { status: 503 });
  }
  const version = challengeVersion(c);
  const { data, error } = await adminClient().from("attempts").insert({ member_id: member.id, slug, version, contract: { challenge: c, reference: getKey(c.slug).key } }).select("id,started_at").single();
  if (error) return NextResponse.json({ error: "Could not save the start. Please try again." }, { status: 503 });
  return NextResponse.json({ serverId: data.id, startedAt: data.started_at, version, challenge: c });
}
