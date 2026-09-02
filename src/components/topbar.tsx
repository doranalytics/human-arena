"use client";
import { useEffect, useState } from "react";
import { PanelLeft, Swords, Trophy, Settings, Lightbulb, Flag, X } from "lucide-react";
import { useStore, useHint, endAttempt, attemptChats, getState } from "@/lib/store";
import { openDialog, toggleSidebar, useUI, toast } from "@/lib/ui";
import { getChallenge } from "@/lib/arena/challenges";
import { HINT_COST } from "@/lib/arena/types";
import { fmtClock, cn } from "@/lib/utils";
import type { ArenaResult } from "@/lib/types";
import { Spark } from "./icons";

function useElapsed(startedAt: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startedAt]);
  return startedAt ? (now - new Date(startedAt).getTime()) / 1000 : 0;
}

export function TopBar({ title }: { title: string }) {
  const attempt = useStore((s) => s.attempt);
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const c = attempt ? getChallenge(attempt.slug) : null;
  const elapsed = useElapsed(attempt?.startedAt);
  const [hintOpen, setHintOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const over = c ? elapsed > c.minutes * 60 : false;

  async function submit() {
    if (!attempt || !c || submitting) return;
    setSubmitting(true);
    const st = getState();
    const chats = attemptChats().map((ch) => {
      const p = ch.projectId ? st.projects.find((x) => x.id === ch.projectId) : null;
      return { title: ch.title, projectName: p?.name, projectInstructions: p?.instructions, messages: ch.messages };
    });
    try {
      const r = await fetch("/api/arena/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: attempt.slug, serverId: attempt.serverId ?? null, startedAt: attempt.startedAt, hintsUsed: attempt.hintsUsed, events: attempt.events, chats }),
      });
      const j = (await r.json()) as { result?: ArenaResult; error?: string; detail?: string };
      if (!r.ok || !j.result) {
        toast({ title: "Could not grade that", body: j.detail ?? j.error ?? "Try again in a moment.", tone: "bad" });
        return;
      }
      endAttempt(j.result);
      toast({ title: j.result.passed ? `Challenge complete: +${j.result.points} points` : "Not quite", body: j.result.passed ? c.title : "See what the arena saw.", tone: j.result.passed ? "ok" : "bad" }, 6000);
      openDialog({ kind: "result", slug: attempt.slug });
    } catch {
      toast({ title: "Network problem", body: "Your attempt is still running. Try Submit again.", tone: "bad" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line/70 px-3">
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="rounded-lg p-1.5 text-ink-2 hover:bg-bg-3" title="Open sidebar">
          <PanelLeft size={17} />
        </button>
      )}
      <div className="flex shrink-0 items-center gap-2 pr-3">
        <Spark size={20} className="text-clay" />
        <span className="font-serif text-[16px] font-semibold tracking-tight">Human Arena</span>
      </div>
      <div className="hidden h-5 w-px shrink-0 bg-line sm:block" />
      <div className="min-w-0 flex-1 truncate pl-1 text-[13.5px] text-ink-2">{title}</div>

      {attempt && c ? (
        <div className="flex items-center gap-1.5">
          <div className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[13px]", over ? "border-bad/40 text-bad" : "border-line-2")}>
            <Swords size={14} className="text-clay" />
            <span className="max-w-[180px] truncate font-medium">{c.title}</span>
            <span className="tabular-nums text-ink-2">
              {fmtClock(elapsed)} <span className="text-ink-3">/ {c.minutes}:00</span>
            </span>
          </div>
          <div className="relative">
            <button onClick={() => setHintOpen((v) => !v)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-2 hover:bg-bg-3" title="Reveal a hint">
              <Lightbulb size={15} /> Hint {attempt.hintsUsed > 0 && <span className="text-ink-3">({attempt.hintsUsed})</span>}
            </button>
            {hintOpen && (
              <div className="fade-up absolute right-0 top-9 z-40 w-80 rounded-xl border border-line bg-bg p-3.5 shadow-lg shadow-black/10">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium">Hints</div>
                  <button onClick={() => setHintOpen(false)} className="rounded p-1 text-ink-3 hover:bg-bg-3">
                    <X size={13} />
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {c.hints.slice(0, attempt.hintsUsed).map((h, i) => (
                    <div key={i} className="rounded-lg bg-bg-2 px-3 py-2 text-[13px] text-ink-2">
                      <span className="mr-1 font-medium text-ink">{i + 1}.</span> {h.text}
                    </div>
                  ))}
                </div>
                {attempt.hintsUsed < c.hints.length ? (
                  <button onClick={useHint} className="mt-2.5 h-8 w-full rounded-lg border border-line-2 text-[13px] hover:bg-bg-2">
                    Reveal hint {attempt.hintsUsed + 1} of {c.hints.length} <span className="text-ink-3">(costs {Math.round(HINT_COST * 100)}% of the points)</span>
                  </button>
                ) : (
                  <div className="mt-2 text-[12.5px] text-ink-3">No more hints for this one.</div>
                )}
              </div>
            )}
          </div>
          <button onClick={submit} disabled={submitting} className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-medium text-bg hover:bg-black disabled:opacity-60">
            <Flag size={14} /> {submitting ? "Grading…" : "Submit"}
          </button>
          <button
            onClick={() => {
              if (confirm("Quit this challenge? Nothing is scored.")) endAttempt();
            }}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-bg-3 hover:text-ink"
            title="Quit challenge"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openDialog({ kind: "leaderboard" })} className="flex h-8 items-center gap-1.5 rounded-lg border border-line-2 px-2.5 text-[13px] font-medium text-ink hover:bg-bg-2" title="Leaderboard">
            <Trophy size={14} className="text-clay" /> <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button onClick={() => openDialog({ kind: "challenges" })} className="flex h-8 items-center gap-1.5 rounded-lg bg-clay px-3 text-[13px] font-semibold text-white shadow-sm shadow-clay/30 hover:bg-clay-dark">
            <Swords size={14} /> Arena
          </button>
          <button onClick={() => openDialog({ kind: "settings" })} className="rounded-lg p-1.5 text-ink-2 hover:bg-bg-3" title="Settings and badges">
            <Settings size={17} />
          </button>
        </div>
      )}
    </header>
  );
}
