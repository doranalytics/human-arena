import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getChallenge } from "@/lib/arena/challenges";

/** Stamps a server-side start for signed-in members. Guests get a client clock. */
export async function POST(req: Request) {
  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!slug || !getChallenge(slug)) return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });
  const member = await getMember();
  if (!member) return NextResponse.json({ serverId: null, startedAt: new Date().toISOString() });
  const { data, error } = await adminClient().from("attempts").insert({ member_id: member.id, slug }).select("id,started_at").single();
  if (error) return NextResponse.json({ serverId: null, startedAt: new Date().toISOString() });
  return NextResponse.json({ serverId: data.id, startedAt: data.started_at });
}
