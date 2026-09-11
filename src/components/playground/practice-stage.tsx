"use client";
import { useState } from "react";
import { Check, ChevronDown, Compass } from "lucide-react";
import { useStore } from "@/lib/store";
import { getPractice, practiceChecks } from "@/lib/playground";
import { BriefBody } from "../dialogs/challenges";
import { MaterialCard } from "../challenge-stage";
import { cn } from "@/lib/utils";

export function PracticeStage({ compact = false }: { compact?: boolean }) {
  const state = useStore((s) => s);
  const [expanded, setExpanded] = useState(false);
  const exercise = state.attempt ? getPractice(state.attempt.slug) : null;
  if (!exercise || !state.attempt) return null;
  const checks = practiceChecks(exercise, state.attempt.events, state);
  return <section aria-label="Practice instructions" className={cn("w-full", compact ? "max-h-[35%] shrink-0 overflow-auto border-b border-line bg-bg px-4 py-2" : "max-w-[760px]")}>
    <div className="mx-auto max-w-[760px]">
      {compact ? <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="flex min-h-10 w-full items-center gap-2 text-left text-sm"><Compass size={16} className="text-clay" /><span className="flex-1 font-medium">{exercise.title}</span><span className="text-xs text-ink-3">{checks.filter((c) => c.pass).length}/{checks.length}</span><ChevronDown size={16} className={cn(expanded && "rotate-180")} /></button> : <><p className="mb-2 text-xs font-medium uppercase tracking-wide text-clay">Playground · {exercise.category}</p><h1 className="mb-2 font-serif text-[28px] leading-tight md:text-[34px]">{exercise.title}</h1><p className="mb-4 text-sm text-ink-2">{exercise.hook}</p></>}
      {(!compact || expanded) && <><BriefBody brief={exercise.brief} />{exercise.materials?.length ? <div className="mt-4 flex flex-wrap gap-2">{exercise.materials.map((m) => <MaterialCard key={m.id} m={m} compact={compact} />)}</div> : null}<div className="mt-4 flex flex-wrap gap-2 pb-1">{checks.map((c) => <span key={c.id} className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs", c.pass ? "border-ok/30 bg-ok/5 text-ok" : "border-line text-ink-3")}><Check size={12} className={c.pass ? "opacity-100" : "opacity-30"} />{c.label}</span>)}</div></>}
    </div>
  </section>;
}

export function PromptChips({ disabled }: { disabled?: boolean }) {
  const [format, setFormat] = useState("a checklist");
  const [audience, setAudience] = useState("someone trying AI for the first time");
  const request = `Explain how to get useful help from AI as ${format}, for ${audience}.`;
  return <div className="mb-3 rounded-xl border border-line bg-bg-2/50 p-3" aria-label="Build a prompt">
    <div className="mb-2 text-xs font-medium text-ink-2">Try a format and an audience</div>
    <div className="flex flex-wrap gap-1.5">{["a checklist", "a short explanation", "a table"].map((x) => <button key={x} disabled={disabled} aria-pressed={format === x} onClick={() => setFormat(x)} className={cn("min-h-9 rounded-full border px-3 text-xs", format === x ? "border-clay/40 bg-clay/10 text-clay-dark" : "border-line bg-bg text-ink-2")}>{x}</button>)}</div>
    <div className="mt-2 flex flex-wrap gap-1.5">{[["someone trying AI for the first time", "A beginner"], ["someone who uses AI every day", "An experienced user"]].map(([value, label]) => <button key={value} disabled={disabled} aria-pressed={audience === value} onClick={() => setAudience(value)} className={cn("min-h-9 rounded-full border px-3 text-xs", audience === value ? "border-clay/40 bg-clay/10 text-clay-dark" : "border-line bg-bg text-ink-2")}>{label}</button>)}</div>
    <div className="mt-3 flex flex-wrap items-center gap-3"><p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-2">{request}</p><button disabled={disabled} className="min-h-9 rounded-lg bg-ink px-3 text-xs font-medium text-bg disabled:opacity-50" onClick={() => window.dispatchEvent(new CustomEvent("playground:prompt", { detail: request }))}>Use this prompt</button></div>
  </div>;
}
