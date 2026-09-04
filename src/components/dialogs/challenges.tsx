"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Clock, Lock, Swords, Trophy, FileText, Quote, Table2 } from "lucide-react";
import { Dialog, Button } from "../dialog";
import { CHALLENGES, getChallenge, TOTAL_POINTS } from "@/lib/arena/challenges";
import { HINT_COST } from "@/lib/arena/types";
import { SkillPill } from "../skill-pill";
import { SkillIcon } from "../skill-icon";
import { LearnCard } from "../learn-card";
import { useStore, startAttempt, newChat, totalPoints } from "@/lib/store";
import { openDialog, closeDialog, toast } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function ChallengesDialog({ open }: { open: boolean }) {
  const results = useStore((s) => s.results);
  const attempt = useStore((s) => s.attempt);
  const pts = totalPoints(results);
  const done = Object.values(results).filter((r) => r.passed).length;
  return (
    <Dialog open={open} onClose={closeDialog} wide title={<span className="flex items-center gap-2"><Swords size={16} className="text-clay" /> Challenges</span>}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="font-serif text-[20px]">Learn by doing. Timed, graded, no consequences.</div>
          <div className="mt-0.5 text-[12.5px] text-ink-2">Pick one. Everything you need appears when the clock starts.</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[22px] font-medium tabular-nums">{pts}<span className="text-[13px] text-ink-3"> / {TOTAL_POINTS}</span></div>
          <div className="text-[12px] text-ink-3">{done} of {CHALLENGES.length} done</div>
        </div>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {[...CHALLENGES].sort((a, b) => a.order - b.order).map((c) => {
          const r = results[c.slug];
          const running = attempt?.slug === c.slug;
          return (
            <button key={c.slug} onClick={() => openDialog({ kind: "brief", slug: c.slug })} className={cn("flex items-center gap-3 rounded-xl border border-line bg-bg px-3.5 py-3 text-left transition hover:border-line-2 hover:bg-bg-2", r?.passed && "border-ok/50 bg-ok/[0.06] hover:bg-ok/10", running && "border-clay")}>
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", r?.passed ? "bg-ok text-bg" : "bg-bg-3 text-ink-2")}>{r?.passed ? <Check size={16} strokeWidth={3} /> : <SkillIcon id={c.badges[0]} size={16} />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{c.title}</span>
                <span className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3">
                  <span className="flex items-center gap-1"><Clock size={11} /> {c.minutes} min</span>
                  <span className="flex items-center gap-1">{c.badges.map((b) => <SkillPill key={b} id={b} iconOnly />)}</span>
                </span>
              </span>
              {r?.passed ? <span className="shrink-0 text-[12.5px] font-semibold text-ok">{r.points} pts</span> : running ? <span className="shrink-0 rounded-md bg-clay/10 px-1.5 py-0.5 text-[11px] font-medium text-clay-dark">Running</span> : <span className="shrink-0 text-[12.5px] tabular-nums text-ink-3">{c.points} pts</span>}
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
    newChat(null, c.title);
    closeDialog();
    toast({ title: "Clock started", body: `${c.minutes} minutes. Submit from the top bar when you are done.`, tone: "info" });
    setStarting(false);
  }

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      title={<span className="flex items-center gap-2"><Swords size={16} className="text-clay" /> {c.title}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={() => openDialog({ kind: "challenges" })}>All challenges</Button>
          {blocked ? (
            <span className="text-[12.5px] text-ink-3"><Lock size={12} className="mr-1 inline" /> Finish the running challenge first</span>
          ) : attempt?.slug === slug ? (
            <Button onClick={closeDialog}>Back to it</Button>
          ) : (
            <Button onClick={start} disabled={starting} className="bg-clay hover:bg-clay-dark">{starting ? "Starting…" : "Start the clock"}</Button>
          )}
        </>
      }
    >
      <div className="mb-4"><LearnCard text={c.hook} /></div>
      <BriefBody brief={c.brief} />
      {c.materials && c.materials.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
          <span>You get</span>
          {c.materials.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1 rounded-md border border-line bg-bg-2 px-2 py-0.5 text-[12px] text-ink-2">
              {m.kind === "table" ? <Table2 size={12} /> : m.kind === "text" ? <Quote size={12} /> : <FileText size={12} />} {m.title}
            </span>
          ))}
          <span>once the clock starts</span>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-ink-3">
        <span className="flex items-center gap-1"><Clock size={12} /> {c.minutes} min</span>
        <span>·</span>
        <span>{c.points} pts</span>
        <span>·</span>
        {c.badges.map((b) => (
          <SkillPill key={b} id={b} size="md" />
        ))}
      </div>
    </Dialog>
  );
}

/** Briefs are short markdown. Paragraphs become numbered steps, quotes become sample cards, bare links become chips. */
function BriefBody({ brief }: { brief: string }) {
  const blocks = brief.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const steps = blocks.filter((b) => !b.startsWith(">") && !/^https?:\/\/\S+$/.test(b) && !/^Sample \d+:$/.test(b));
  const numbered: { text: string; step: number | null }[] = [];
  for (const b of blocks) {
    const isStep = steps.includes(b);
    numbered.push({ text: b, step: isStep ? numbered.filter((x) => x.step !== null).length + 1 : null });
  }
  if (steps.length <= 1) {
    return (
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <Block key={i} text={b} lead />
        ))}
      </div>
    );
  }
  return (
    <ol className="space-y-3">
      {numbered.map(({ text, step }, i) => (
        <li key={i} className={cn("flex gap-3", step === null && "pl-9")}>
          {step !== null && <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay font-serif text-[13px] font-semibold text-bg">{step}</span>}
          <div className="min-w-0 flex-1"><Block text={text} /></div>
        </li>
      ))}
    </ol>
  );
}

function Block({ text, lead }: { text: string; lead?: boolean }) {
  if (/^https?:\/\/\S+$/.test(text))
    return <a href={text} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-bg-2 px-2.5 py-1.5 font-mono text-[12.5px] text-ink-2 hover:bg-bg-3"><span className="truncate">{text.replace(/^https?:\/\//, "")}</span></a>;
  if (text.startsWith(">")) {
    const inner = text.split("\n").map((l) => l.replace(/^>\s?/, "")).join("\n");
    return <div className="rounded-lg border-l-2 border-clay/60 bg-bg-2 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-2"><ReactMarkdown>{inner}</ReactMarkdown></div>;
  }
  if (/^Sample \d+:$/.test(text)) return <div className="text-[11.5px] font-medium uppercase tracking-wide text-ink-3">{text.replace(":", "")}</div>;
  return <div className={cn("prose-chat leading-relaxed", lead ? "text-[17px]" : "text-[15px]")}><ReactMarkdown>{text}</ReactMarkdown></div>;
}
