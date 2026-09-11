"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getPractice } from "@/lib/playground";
import { MaterialCard } from "../challenge-stage";
import { cn } from "@/lib/utils";

export function PracticeMaterials() {
  const state = useStore((s) => s);
  const exercise = state.attempt ? getPractice(state.attempt.slug) : null;
  if (!exercise?.materials?.length) return null;
  return <div className="mb-2 flex flex-wrap gap-1.5" aria-label="Practice materials">{exercise.materials.map((m) => <MaterialCard key={m.id} m={m} compact />)}</div>;
}

export function PromptChips({ disabled }: { disabled?: boolean }) {
  const [format, setFormat] = useState("a checklist");
  const [audience, setAudience] = useState("someone trying AI for the first time");
  const request = `Explain how to get useful help from AI as ${format}, for ${audience}.`;
  return <div className="mb-2 rounded-xl border border-line bg-bg-2/40 px-2.5 py-2" aria-label="Build a prompt">
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-[11px] font-medium text-ink-3">Format</span>
      {["a checklist", "a short explanation", "a table"].map((x) => <button key={x} disabled={disabled} aria-pressed={format === x} onClick={() => setFormat(x)} className={cn("min-h-8 rounded-full border px-2.5 text-[11.5px]", format === x ? "border-clay/40 bg-clay/10 text-clay-dark" : "border-line bg-bg text-ink-2")}>{x}</button>)}
      <span className="ml-1 mr-0.5 text-[11px] font-medium text-ink-3">Audience</span>
      {[["someone trying AI for the first time", "Beginner"], ["someone who uses AI every day", "Experienced"]].map(([value, label]) => <button key={value} disabled={disabled} aria-pressed={audience === value} onClick={() => setAudience(value)} className={cn("min-h-8 rounded-full border px-2.5 text-[11.5px]", audience === value ? "border-clay/40 bg-clay/10 text-clay-dark" : "border-line bg-bg text-ink-2")}>{label}</button>)}
    </div>
    <div className="mt-2 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">Explain how to get useful help from AI as <strong className="text-ink">{format}</strong>, for <strong className="text-ink">{audience}</strong>.</p><button disabled={disabled} className="min-h-8 shrink-0 rounded-lg bg-ink px-3 text-[11.5px] font-medium text-bg disabled:opacity-50" onClick={() => window.dispatchEvent(new CustomEvent("playground:prompt", { detail: request }))}>Try it</button></div>
  </div>;
}
