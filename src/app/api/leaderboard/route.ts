import { NextResponse } from "next/server";
import { adminClient, adminConfigured } from "@/lib/supabase/admin";
import { getMember } from "@/lib/auth";

export interface BoardRow {
  id: string;
  name: string;
  avatar?: string | null;
  points: number;
  challenges: number;
  rank: number;
  you?: boolean;
}

/** Seed rows so the board is never empty before the first real members arrive. */
const SEED: Omit<BoardRow, "rank">[] = [
  { id: "s1", name: "Cobalt Heron 17", points: 290, challenges: 8 },
  { id: "s2", name: "Quiet Otter 42", points: 245, challenges: 7 },
  { id: "s3", name: "Nimble Lynx 63", points: 190, challenges: 6 },
  { id: "s4", name: "Amber Puffin 28", points: 140, challenges: 4 },
  { id: "s5", name: "Steady Marmot 81", points: 95, challenges: 3 },
  { id: "s6", name: "Vivid Comet 12", points: 60, challenges: 2 },
];

export async function GET(req: Request) {
  const board = new URL(req.url).searchParams.get("board") === "week" ? "week" : "all";
  if (!adminConfigured()) {
    const rows = SEED.map((r, i) => ({ ...r, rank: i + 1, points: board === "week" ? Math.round(r.points * 0.4) : r.points }));
    return NextResponse.json({ rows, live: false, me: null });
  }
  const member = await getMember();
  const { data, error } = await adminClient().rpc("leaderboard", { p_board: board });
  if (error) return NextResponse.json({ rows: [], live: true, me: member?.id ?? null, error: error.message });
  const rows: BoardRow[] = (data as { id: string; display_name: string | null; pseudonym: string; avatar_url: string | null; points: number; challenges: number; rank: number }[]).map((r) => ({
    id: r.id,
    name: r.display_name || r.pseudonym,
    avatar: r.avatar_url,
    points: Number(r.points),
    challenges: Number(r.challenges),
    rank: Number(r.rank),
    you: member?.id === r.id,
  }));
  return NextResponse.json({ rows, live: true, me: member?.id ?? null });
}
