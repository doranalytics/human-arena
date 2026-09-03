"use client";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Search, X, Lock, Medal } from "lucide-react";
import { ProgressPanel } from "../progress-panel";
import { Dialog } from "../dialog";
import { Avatar } from "../avatar";
import { TierBadge, IconLinkedIn, IconX, type BadgeTier } from "../icons";
import { closeDialog } from "@/lib/ui";
import { useStore, totalPoints } from "@/lib/store";
import { useSession } from "@/lib/session";
import { tierFor, type Tier } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface Row { id: string; name: string; avatar?: string | null; linkedin?: string | null; x?: string | null; paid?: boolean; seed?: boolean; points: number; challenges: number; rank: number; you?: boolean }

/* Same pill palette as the How to AI Games board. */
const TIER_PILL: Record<string, string> = {
  Tourist: "bg-[#FFF1E8] text-[#B8410B]",
  Newcomer: "bg-[#FFE4D3] text-[#B8410B]",
  Resident: "bg-[#F4D6C4] text-[#7A2A05]",
  Citizen: "bg-[#E7E5E4] text-[#1C1917]",
  "AI-Native": "bg-[#FFF0CC] text-[#7A5A10]",
};

function TierPill({ tier, className }: { tier: Tier; className?: string }) {
  if (tier === "Analog") return <span className={cn("w-28 shrink-0", className)} />;
  return (
    <span className={cn("flex w-28 shrink-0 justify-end", className)}>
      <span className={cn("inline-flex items-center gap-1 rounded-full py-0.5 pl-1 pr-2 text-[11.5px] font-semibold", TIER_PILL[tier])}>
        <TierBadge tier={tier as BadgeTier} size={16} />
        {tier}
      </span>
    </span>
  );
}

/** Sort by points, then challenges; ties share a rank. */
function rankRows(rows: Omit<Row, "rank">[]): Row[] {
  const sorted = [...rows].sort((a, b) => b.points - a.points || b.challenges - a.challenges);
  let rank = 0, prevPts = -1, prevCh = -1;
  return sorted.map((r, i) => {
    if (r.points !== prevPts || r.challenges !== prevCh) { rank = i + 1; prevPts = r.points; prevCh = r.challenges; }
    return { ...r, rank };
  });
}

function Socials({ row, size = 5 }: { row: Row; size?: number }) {
  if ((!row.paid && !row.you) || (!row.linkedin && !row.x)) return null;
  const cls = `flex h-${size} w-${size} items-center justify-center rounded-full text-white opacity-85 transition-opacity hover:opacity-100`;
  return (
    <span className="ml-1 hidden shrink-0 items-center gap-1 sm:flex" onClick={(e) => e.stopPropagation()}>
      {row.linkedin && <a href={row.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${row.name} on LinkedIn`} className={cn(cls, "bg-[#0A66C2]")}><IconLinkedIn size={10} /></a>}
      {row.x && <a href={row.x} target="_blank" rel="noopener noreferrer" aria-label={`${row.name} on X`} className={cn(cls, "bg-ink")}><IconX size={9} /></a>}
    </span>
  );
}

function MemberCard({ row, onClose }: { row: Row; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  const tier = tierFor(row.points);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal className="fade-up relative w-full max-w-sm rounded-2xl border border-line bg-bg p-6 text-center shadow-2xl shadow-black/10">
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-2 hover:bg-bg-3"><X size={16} /></button>
        <div className="flex justify-center">
          {row.you && !row.avatar ? (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-clay font-serif text-3xl font-bold text-bg">{row.name.charAt(0).toUpperCase()}</span>
          ) : row.paid || row.you ? (
            <Avatar name={row.name} src={row.avatar} size={96} />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-bg-3 text-ink-3"><Lock size={28} /></span>
          )}
        </div>
        <p className="mt-4 font-serif text-2xl font-bold">{row.name}</p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-ink-2">
          {tier !== "Analog" && <TierBadge tier={tier as BadgeTier} size={20} />}
          {tier}
        </p>
        {(row.paid || row.you) && (row.linkedin || row.x) ? (
          <div className="mt-4 flex justify-center gap-2">
            {row.linkedin && <a href={row.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0A66C2] px-3 text-[12.5px] font-medium text-white hover:bg-[#004182]"><IconLinkedIn size={12} /> LinkedIn</a>}
            {row.x && <a href={row.x} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-[12.5px] font-medium text-bg hover:bg-black"><IconX size={11} /> X</a>}
          </div>
        ) : (
          <p className="mt-4 text-[12.5px] text-ink-3">{row.you ? "Add your links under Account." : "Photo and links show for paying members."}</p>
        )}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {([[`#${row.rank}`, "rank"], [row.points, "pts"], [row.challenges, "done"]] as const).map(([n, l]) => (
            <div key={l} className="rounded-xl bg-bg-2 py-3">
              <p className="font-serif text-2xl font-bold tabular-nums leading-none">{n}</p>
              <p className="mt-1 text-[11.5px] text-ink-3">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardDialog({ open }: { open: boolean }) {
  const [board, setBoard] = useState<"all" | "week">("week");
  const [tab, setTab] = useState<"board" | "progress">("board");
  const [q, setQ] = useState("");
  const [openRow, setOpenRow] = useState<Row | null>(null);
  const [data, setData] = useState<{ board: string; rows: Row[]; live: boolean; at: number } | null>(null);
  const live = data?.live ?? false;
  const results = useStore((s) => s.results);
  const settings = useStore((s) => s.settings);
  const session = useSession();

  useEffect(() => {
    if (!open) return;
    fetch(`/api/leaderboard?board=${board}`)
      .then((r) => r.json())
      .then((j: { rows: Row[]; live: boolean }) => setData({ board, rows: j.rows, live: j.live, at: Date.now() }))
      .catch(() => setData({ board, rows: [], live: false, at: Date.now() }));
  }, [open, board]);

  // Guest: merge yourself in from local progress. Signed in: the server already marks your row.
  const rows = useMemo(() => {
    if (!data || data.board !== board) return null;
    if (data.live && session.me) return data.rows;
    const mine = Object.values(results).filter((r) => board === "all" || data.at - new Date(r.at).getTime() < 7 * 86400000);
    const pts = totalPoints(Object.fromEntries(mine.map((r) => [r.slug, r])));
    if (pts <= 0) return data.rows;
    const you: Omit<Row, "rank"> = { id: "you", name: session.me?.name || settings.name || "You", avatar: session.me?.avatar || settings.avatar, linkedin: session.me?.linkedin || settings.linkedin, x: session.me?.x || settings.x, paid: true, points: pts, challenges: mine.filter((r) => r.passed).length, you: true };
    return rankRows([...data.rows.filter((r) => !r.you), you]);
  }, [data, board, results, settings.name, settings.avatar, settings.linkedin, settings.x, session.me]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => r.name.toLowerCase().includes(s)) : rows;
  }, [rows, q]);

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      wide
      title={
        <span className="flex items-center gap-1">
          {(["board", "progress"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[14px]", tab === t ? "bg-bg-3 font-medium" : "text-ink-2 hover:text-ink")}>
              {t === "board" ? <Trophy size={15} className="text-clay" /> : <Medal size={15} className="text-clay" />} {t === "board" ? "Leaderboard" : "Your progress"}
            </button>
          ))}
        </span>
      }
    >
      {tab === "progress" ? <ProgressPanel /> : (<>
      <div className="mb-3 rounded-lg bg-bg-2 px-3.5 py-2.5 text-[13px] text-ink-2"><span className="font-medium text-ink">Every week has a winner.</span> Top of the weekly board goes in front of a million people on Ruben&rsquo;s LinkedIn.</div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-bg-2 p-1">
          {(["week", "all"] as const).map((b) => (
            <button key={b} onClick={() => setBoard(b)} className={cn("rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors", board === b ? "bg-ink text-bg" : "text-ink-2 hover:text-ink")}>
              {b === "week" ? "This week" : "All time"}
            </button>
          ))}
        </div>
        <label className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name" className="w-44 rounded-full border border-line bg-bg py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-ink-3 focus:border-clay" />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3 border-b border-line pb-2 text-[11.5px] font-medium text-ink-3 sm:gap-4">
        <span className="w-9 shrink-0">#</span>
        <span className="flex-1 pl-12">Member</span>
        <span className="hidden w-28 shrink-0 text-right sm:block">Level</span>
        <span className="w-14 shrink-0 text-right">Points</span>
      </div>

      {filtered === null ? (
        <div className="py-10 text-center text-[13px] text-ink-3">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-ink-2">{rows && rows.length ? "No match." : "No one yet. Finish a challenge to open the board."}</div>
      ) : (
        <ol className="divide-y divide-line">
          {filtered.map((row) => {
            const tier = tierFor(row.points);
            return (
              <li
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenRow(row)}
                onKeyDown={(e) => e.key === "Enter" && setOpenRow(row)}
                className={cn("flex cursor-pointer items-center gap-3 py-2.5 transition-colors hover:bg-bg-2/60 sm:gap-4", row.you && "-mx-3 rounded-2xl bg-clay/5 px-3")}
              >
                <span className={cn("w-9 shrink-0 font-serif text-[22px] font-bold tabular-nums", row.rank <= 3 ? "text-clay" : "text-ink-3")}>{row.rank}</span>
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  {row.you && !row.avatar ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay font-serif text-[14px] font-bold text-bg">{row.name.charAt(0).toUpperCase()}</span>
                  ) : row.paid || row.you ? (
                    <Avatar name={row.name} src={row.avatar} size={36} />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-3 text-ink-3"><Lock size={14} /></span>
                  )}
                  <span className={cn("min-w-0 truncate text-[14px] font-medium", row.paid || row.you ? "text-ink" : "text-ink-3")}>
                    {row.name}
                    {row.you && <span className="ml-1 text-[12.5px] font-normal text-ink-3">· you</span>}
                  </span>
                  <Socials row={row} />
                </span>
                <TierPill tier={tier} className="hidden sm:flex" />
                <span className="w-14 shrink-0 text-right font-serif text-[22px] font-bold tabular-nums">{row.points}</span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="mt-3 text-[12px] text-ink-3">{live ? "Sign in under Account to be ranked." : "Sample board."} Weeks run Monday to Sunday, UTC.</div>
      {openRow && <MemberCard row={openRow} onClose={() => setOpenRow(null)} />}
      </>)}
    </Dialog>
  );
}
