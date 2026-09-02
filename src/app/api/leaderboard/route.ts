import { NextResponse } from "next/server";
import { adminClient, adminConfigured } from "@/lib/supabase/admin";
import { getMember } from "@/lib/auth";
import { SEED_MEMBERS } from "@/lib/seed-board";

export interface BoardRow {
  id: string;
  name: string;
  avatar?: string | null;
  linkedin?: string | null;
  x?: string | null;
  /** paying member: name, photo and links are shown. Otherwise greyed first name plus initial. */
  paid?: boolean;
  seed?: boolean;
  points: number;
  challenges: number;
  rank: number;
  you?: boolean;
}

/** Seeds keep the board alive before real members arrive; live members merge in on top. */
function seedRows(board: "all" | "week"): Omit<BoardRow, "rank">[] {
  return SEED_MEMBERS.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar, linkedin: m.linkedin, x: m.x, paid: m.paid, seed: true, points: board === "week" ? m.weekPoints : m.points, challenges: board === "week" ? Math.max(1, Math.round(m.challenges * 0.3)) : m.challenges })).filter((r) => r.points > 0);
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
  if (!adminConfigured()) return NextResponse.json({ rows: rank(seedRows(board)), live: false, me: null });
  const member = await getMember();
  const { data, error } = await adminClient().rpc("leaderboard", { p_board: board });
  if (error) return NextResponse.json({ rows: rank(seedRows(board)), live: true, me: member?.id ?? null, error: error.message });
  const live: Omit<BoardRow, "rank">[] = (data as { id: string; display_name: string | null; pseudonym: string; avatar_url: string | null; linkedin_url: string | null; x_url: string | null; points: number; challenges: number }[]).map((r) => ({
    id: r.id,
    name: r.display_name || r.pseudonym,
    avatar: r.avatar_url,
    linkedin: r.linkedin_url,
    x: r.x_url,
    // Real members are shown in full once they have set a name.
    paid: !!r.display_name,
    points: Number(r.points),
    challenges: Number(r.challenges),
    you: member?.id === r.id,
  }));
  return NextResponse.json({ rows: rank([...live, ...seedRows(board)]), live: true, me: member?.id ?? null });
}
