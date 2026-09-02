"use client";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Dialog } from "../dialog";
import { closeDialog } from "@/lib/ui";
import { useStore, totalPoints } from "@/lib/store";
import { useSession } from "@/lib/session";
import { tierFor } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface Row { id: string; name: string; points: number; challenges: number; rank: number; you?: boolean }

export function LeaderboardDialog({ open }: { open: boolean }) {
  const [board, setBoard] = useState<"all" | "week">("all");
  const [data, setData] = useState<{ board: string; rows: Row[]; live: boolean } | null>(null);
  const rows = data?.board === board ? data.rows : null;
  const live = data?.live ?? false;
  const results = useStore((s) => s.results);
  const settings = useStore((s) => s.settings);
  const session = useSession();

  useEffect(() => {
    if (!open) return;
    fetch(`/api/leaderboard?board=${board}`)
      .then((r) => r.json())
      .then((j: { rows: Row[]; live: boolean }) => {
        let rs = j.rows;
        if (!j.live || !session.me) {
          // Guest: put yourself on the board from local progress.
          const mine = Object.values(results).filter((r) => board === "all" || Date.now() - new Date(r.at).getTime() < 7 * 86400000);
          const pts = totalPoints(Object.fromEntries(mine.map((r) => [r.slug, r])));
          if (pts > 0) {
            rs = [...rs.filter((r) => !r.you), { id: "you", name: (session.me?.name || settings.name || "You") + " (you)", points: pts, challenges: mine.filter((r) => r.passed).length, rank: 0, you: true }]
              .sort((a, b) => b.points - a.points || b.challenges - a.challenges)
              .map((r, i) => ({ ...r, rank: i + 1 }));
          }
        }
        setData({ board, rows: rs, live: j.live });
      })
      .catch(() => setData({ board, rows: [], live: false }));
  }, [open, board, results, settings.name, session.me]);

  return (
    <Dialog open={open} onClose={closeDialog} title={<span className="flex items-center gap-2"><Trophy size={16} className="text-clay" /> Leaderboard</span>}>
      <div className="mb-3 flex items-center gap-1 rounded-lg bg-bg-2 p-0.5 text-[13px]">
        {(["all", "week"] as const).map((b) => (
          <button key={b} onClick={() => setBoard(b)} className={cn("flex-1 rounded-md py-1.5", board === b ? "bg-bg font-medium shadow-sm" : "text-ink-2")}>{b === "all" ? "All time" : "This week"}</button>
        ))}
      </div>
      {rows === null ? (
        <div className="py-8 text-center text-[13px] text-ink-3">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-ink-3">Nobody on the board yet. Finish a challenge.</div>
      ) : (
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.id} className={cn("flex items-center gap-3 py-2 text-[13.5px]", r.you && "font-medium")}>
              <span className="w-6 text-right tabular-nums text-ink-3">{r.rank}</span>
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="text-[12px] text-ink-3">{tierFor(r.points)}</span>
              <span className="w-12 text-right tabular-nums">{r.points}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 text-[12px] text-ink-3">{live ? "Live board." : "Sample board. Sign in (Customize) to be ranked for real once the backend is connected."} Weeks run Monday to Sunday, UTC.</div>
    </Dialog>
  );
}
