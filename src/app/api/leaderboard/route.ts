import { NextResponse } from "next/server";
import { adminClient, adminConfigured } from "@/lib/supabase/admin";
import { getMember } from "@/lib/auth";

export interface BoardRow {
  id: string;
  name: string;
  avatar?: string | null;
  linkedin?: string | null;
  x?: string | null;
  /** paying member: name, photo and links are shown. Otherwise greyed first name plus initial. */
  paid?: boolean;
  points: number;
  challenges: number;
  lifetimePoints: number;
  lifetimeChallenges: number;
  rank: number;
  you?: boolean;
}

function rank(rows: Omit<BoardRow, "rank">[]): BoardRow[] {
  const sorted = [...rows].sort((a, b) => b.points - a.points || b.challenges - a.challenges);
  let r = 0, pp = -1, pc = -1;
  return sorted.map((x, i) => {
    if (x.points !== pp || x.challenges !== pc) { r = i + 1; pp = x.points; pc = x.challenges; }
    return { ...x, rank: r };
  });
}

export async function GET(req: Request) {
  const board = new URL(req.url).searchParams.get("board") === "week" ? "week" : "all";
  const headers = { "Cache-Control": "no-store" };
  const unavailable = () => NextResponse.json({ rows: [], live: false, error: "The leaderboard is temporarily unavailable." }, { status: 503, headers });
  if (!adminConfigured()) return unavailable();
  const member = await getMember();
  const { data, error } = await adminClient().rpc("leaderboard", { p_board: board });
  if (error || !data) return unavailable();
  const ids = (data as { id: string }[]).map((r) => r.id);
  const [subscriptions, lifetime] = ids.length ? await Promise.all([
    adminClient().from("members").select("id,is_paid").in("id", ids),
    adminClient().from("member_points").select("member_id,points,challenges").in("member_id", ids),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (subscriptions.error || lifetime.error) return unavailable();
  const paidMembers = new Set((subscriptions.data ?? []).filter((m) => m.is_paid).map((m) => m.id));
  const lifetimeByMember = new Map((lifetime.data ?? []).map((r) => [r.member_id, r]));
  const live: Omit<BoardRow, "rank">[] = (data as { id: string; display_name: string | null; pseudonym: string; avatar_url: string | null; linkedin_url: string | null; x_url: string | null; points: number; challenges: number }[]).map((r) => ({
    id: r.id,
    name: r.display_name || r.pseudonym,
    avatar: r.avatar_url,
    linkedin: r.linkedin_url,
    x: r.x_url,
    paid: paidMembers.has(r.id),
    points: Number(r.points),
    challenges: Number(r.challenges),
    lifetimePoints: Number(lifetimeByMember.get(r.id)?.points ?? r.points),
    lifetimeChallenges: Number(lifetimeByMember.get(r.id)?.challenges ?? r.challenges),
    you: member?.id === r.id,
  }));
  return NextResponse.json({ rows: rank(live), live: true, me: member?.id ?? null }, { headers });
}
