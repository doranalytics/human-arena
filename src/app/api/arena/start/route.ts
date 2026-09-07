import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getChallenge } from "@/lib/arena/challenges";
import { challengeVersion } from "@/lib/arena/contract";
import { getKey } from "@/lib/arena/keys";

export async function POST(req: Request) {
  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  const c = slug && getChallenge(slug);
  if (!c) return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });
  const version = challengeVersion(c);
  const member = await getMember();
  if (!member) return NextResponse.json({ serverId: null, startedAt: new Date().toISOString(), version, challenge: c });
  const { data, error } = await adminClient().from("attempts").insert({ member_id: member.id, slug, version, contract: { challenge: c, reference: getKey(c.slug).key } }).select("id,started_at").single();
  if (error) return NextResponse.json({ error: "Could not save the start. Please try again." }, { status: 503 });
  return NextResponse.json({ serverId: data.id, startedAt: data.started_at, version, challenge: c });
}
