"use client";
import { useLearning } from "@/lib/learning/client";
import { surfaceCopy } from "@/lib/surface-copy";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Lock, Swords, FileText, Quote, Table2 } from "lucide-react";
import { Dialog, Button } from "../dialog";
import { CHALLENGES, getChallenge } from "@/lib/arena/challenges";
import { HINT_COST } from "@/lib/arena/types";
import { ChallengeCriteria } from "../challenge-criteria";
import { SkillIcon } from "../skill-icon";
import { LearnCard } from "../learn-card";
import { useStore, startAttempt, newChat } from "@/lib/store";
import { openDialog, closeDialog, setPage, toast } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { isArenaChallenge } from "@/lib/game-mode";

export function ChallengesDialog({ open }: { open: boolean }) {
  const results = useStore((s) => s.results);
  const challenges = CHALLENGES.filter((c) => isArenaChallenge(c.slug));
  return <Dialog open={open} onClose={closeDialog} wide title={<span className="flex items-center gap-2"><Swords size={17} className="text-clay" /> Arena challenges</span>}>
    <p className="mb-4 text-sm text-ink-2">Choose any challenge. Your timer starts when you press Start.</p>
    <div className="grid gap-2 sm:grid-cols-2">{challenges.map((c) => <button key={c.slug} onClick={() => openDialog({ kind: "brief", slug: c.slug })} className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:border-clay/50 hover:bg-bg-2"><span className="text-clay">{results[c.slug]?.passed ? <Check size={18} /> : <SkillIcon id={c.badges[0]} size={18} />}</span><span className="min-w-0 flex-1 text-[15px] font-medium">{c.title}</span><span className="shrink-0 text-xs text-ink-3">{c.points} pts</span></button>)}</div>
    <p className="mt-4 text-xs text-ink-3">Faster completion earns more points. Each hint costs {Math.round(HINT_COST * 100)}%.</p>
  </Dialog>;
}

export function BriefDialog({ open, slug }: { open: boolean; slug: string }) {
  const attempt = useStore((s) => s.attempt);
  const c = attempt?.slug === slug ? attempt.definition ?? getChallenge(slug) : getChallenge(slug);
  const [starting, setStarting] = useState(false);
  if (!c || !isArenaChallenge(c.slug)) return null;
  const blocked = attempt && attempt.slug !== slug;

  async function start() {
    if (!c || starting) return;
    setStarting(true);
    try {
      const r = await fetch("/api/arena/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: c.slug, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
      const j = await r.json() as { serverId?: string; startedAt: string; version: string; challenge: import("@/lib/arena/types").ChallengeDef; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Could not start the challenge");
      startAttempt(c.slug, j.serverId, j.startedAt, j.version, j.challenge);
    } catch (e) {
      toast({ title: "Could not start", body: e instanceof Error ? e.message : "Please try again.", tone: "bad" });
      setStarting(false); return;
    }
    newChat(null, c.title);
    setPage(null);
    closeDialog();
    toast({ title: "Challenge started", body: "Submit from the top bar when you are done.", tone: "info" });
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
            <Button onClick={start} disabled={starting} className="bg-clay hover:bg-clay-dark">{starting ? "Starting…" : <>Start <span className="ml-1 font-normal text-white/75">· {c.points} pts</span></>}</Button>
          )}
        </>
      }
    >
      <LearnCard text={c.hook} className="mb-3 border-b border-line pb-3" />
      <BriefBody brief={c.brief} />
      <ChallengeCriteria challenge={c} />
      {c.materials && c.materials.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
          <span>You get</span>
          {c.materials.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1 rounded-md border border-line bg-bg-2 px-2 py-0.5 text-[12px] text-ink-2">
              {m.kind === "table" ? <Table2 size={12} /> : m.kind === "text" ? <Quote size={12} /> : <FileText size={12} />} {m.title}
            </span>
          ))}
          <span>when you start</span>
        </div>
      )}
    </Dialog>
  );
}

/** Briefs are short markdown. Paragraphs become numbered steps, quotes become sample cards, bare links become chips. */
export function BriefBody({ brief }: { brief: string }) {
  const surface = useLearning().surface;
  const blocks = surfaceCopy(brief, surface).split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
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
