"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Clock, Download, Lock, Swords, Trophy } from "lucide-react";
import { Dialog, Button } from "../dialog";
import { CHALLENGES, getChallenge, TOTAL_POINTS } from "@/lib/arena/challenges";
import { BADGES, HINT_COST } from "@/lib/arena/types";
import { useStore, startAttempt, newChat, totalPoints } from "@/lib/store";
import { openDialog, closeDialog, toast } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function ChallengesDialog({ open }: { open: boolean }) {
  const results = useStore((s) => s.results);
  const attempt = useStore((s) => s.attempt);
  const pts = totalPoints(results);
  const done = Object.values(results).filter((r) => r.passed).length;
  return (
    <Dialog open={open} onClose={closeDialog} wide title={<span className="flex items-center gap-2"><Swords size={16} className="text-clay" /> The Arena</span>}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="font-serif text-[22px]">Learn by doing. Timed, graded, no consequences.</div>
          <div className="mt-1 text-[13px] text-ink-2">You play as yourself at Halden Outdoor Co. Each challenge teaches one thing the assistant can do. The arena watches what you click, not just what you type.</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[22px] font-medium tabular-nums">{pts}<span className="text-[13px] text-ink-3"> / {TOTAL_POINTS}</span></div>
          <div className="text-[12px] text-ink-3">{done} of {CHALLENGES.length} done</div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[...CHALLENGES].sort((a, b) => a.order - b.order).map((c) => {
          const r = results[c.slug];
          const running = attempt?.slug === c.slug;
          return (
            <button key={c.slug} onClick={() => openDialog({ kind: "brief", slug: c.slug })} className={cn("flex flex-col rounded-xl border border-line bg-bg p-3.5 text-left transition hover:border-line-2 hover:bg-bg-2", r?.passed && "border-ok/30", running && "border-clay")}>
              <div className="flex w-full items-start justify-between gap-2">
                <div className="text-[14.5px] font-medium">{c.order}. {c.title}</div>
                {r?.passed ? <span className="flex items-center gap-1 rounded-md bg-ok/10 px-1.5 py-0.5 text-[11.5px] font-medium text-ok"><Check size={12} /> {r.points}</span> : running ? <span className="rounded-md bg-clay/10 px-1.5 py-0.5 text-[11.5px] font-medium text-clay-dark">Running</span> : <span className="text-[12px] text-ink-3">{c.points} pts</span>}
              </div>
              <div className="mt-0.5 text-[13px] text-ink-2">{c.hook}</div>
              <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-ink-3">
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap"><Clock size={11} /> {c.minutes} min</span>
                <span>{c.badges.map((b) => BADGES[b]?.emoji).join(" ")} {c.teaches}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-[12.5px] text-ink-3">
        <span>Speed counts: full points inside 75% of the time box, sliding to 60% after it. Each hint costs {Math.round(HINT_COST * 100)}%.</span>
        <button onClick={() => openDialog({ kind: "leaderboard" })} className="flex items-center gap-1 text-ink-2 hover:text-ink"><Trophy size={13} /> Leaderboard</button>
      </div>
    </Dialog>
  );
}

export function BriefDialog({ open, slug }: { open: boolean; slug: string }) {
  const c = getChallenge(slug);
  const attempt = useStore((s) => s.attempt);
  const result = useStore((s) => s.results[slug]);
  const [starting, setStarting] = useState(false);
  if (!c) return null;
  const blocked = attempt && attempt.slug !== slug;

  async function start() {
    if (!c || starting) return;
    setStarting(true);
    let serverId: string | undefined;
    try {
      const r = await fetch("/api/arena/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: c.slug }) });
      const j = (await r.json()) as { serverId?: string | null };
      serverId = j.serverId ?? undefined;
    } catch {
      /* guest clock */
    }
    startAttempt(c.slug, serverId);
    newChat(null);
    closeDialog();
    toast({ title: "Clock started", body: `${c.minutes} minutes. Submit from the top bar when you are done.`, tone: "info" });
    setStarting(false);
  }

  function download(name: string, body: string) {
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      title={<span className="flex items-center gap-2"><Swords size={16} className="text-clay" /> {c.title}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={() => openDialog({ kind: "challenges" })}>All challenges</Button>
          {result?.passed && <span className="mr-auto text-[12.5px] text-ink-3">Best: {result.points} pts. A better run replaces it.</span>}
          {blocked ? (
            <span className="text-[12.5px] text-ink-3"><Lock size={12} className="mr-1 inline" /> Finish the running challenge first</span>
          ) : attempt?.slug === slug ? (
            <Button onClick={closeDialog}>Back to it</Button>
          ) : (
            <Button onClick={start} disabled={starting}>{starting ? "Starting…" : "Start the clock"}</Button>
          )}
        </>
      }
    >
      <div className="text-[13px] text-ink-2">{c.hook}</div>
      <div className="prose-chat mt-3 text-[14.5px]"><ReactMarkdown>{c.brief}</ReactMarkdown></div>
      {c.fixtures?.map((f) => (
        <button key={f.filename} onClick={() => download(f.filename, f.body)} className="mt-3 flex items-center gap-2 rounded-lg border border-line-2 px-3 py-2 text-[13px] hover:bg-bg-2">
          <Download size={14} /> {f.title} <span className="text-ink-3">({f.filename})</span>
        </button>
      ))}
      <div className="mt-4 grid grid-cols-3 gap-2 text-[12.5px]">
        <Stat label="Time box" value={`${c.minutes} min`} />
        <Stat label="Points" value={String(c.points)} />
        <Stat label="Hints" value={`${c.hints.length}, ${Math.round(HINT_COST * 100)}% each`} />
      </div>
      <div className="mt-3 rounded-lg bg-bg-2 px-3 py-2.5 text-[12.5px] text-ink-2">
        <div className="font-medium text-ink">Done means</div>
        {c.deliverable}
        <div className="mt-1.5 text-ink-3">The arena checks {c.behaviors.length} thing{c.behaviors.length === 1 ? "" : "s"} you did and {c.checks.length} thing{c.checks.length === 1 ? "" : "s"} the reply contains. It tells you which after you submit.</div>
      </div>
      <div className="mt-2 text-[12px] text-ink-3">Unlocks: {c.badges.map((b) => `${BADGES[b]?.emoji} ${BADGES[b]?.name}`).join(", ")}</div>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <div className="text-ink-3">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
