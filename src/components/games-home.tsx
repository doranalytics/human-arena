"use client";
import { ArrowRight, Check, Compass, MessageCircle, Swords, Trophy, Wrench } from "lucide-react";
import { useStore, startPractice, newChat } from "@/lib/store";
import { openDialog, setPage } from "@/lib/ui";
import { PRACTICE_EXERCISES } from "@/lib/playground";
import { CHALLENGES } from "@/lib/arena/challenges";
import { isArenaChallenge, MODE_COPY } from "@/lib/game-mode";
import { SkillIcon } from "./skill-icon";

export function GamesHome() {
  const mode = useStore((s) => s.gameMode);
  const completed = useStore((s) => s.practiceCompleted);
  const results = useStore((s) => s.results);
  const attempt = useStore((s) => s.attempt);
  const Icon = mode === "playground" ? Compass : Swords;
  return <div className="mx-auto w-full max-w-4xl px-5 py-7 md:px-10 md:py-12">
    <div className="mb-7 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clay/10 text-clay"><Icon size={25} /></span><div><h1 className="font-serif text-3xl tracking-tight md:text-4xl">{MODE_COPY[mode].title}</h1><p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-2">{MODE_COPY[mode].description}</p></div></div>
    {attempt && <button className="mb-6 flex w-full items-center justify-between gap-3 rounded-xl border border-clay/40 bg-clay/5 p-4 text-left text-sm font-medium" onClick={() => setPage(null)}>Continue {attempt.definition?.title ?? "your session"}<ArrowRight size={18} /></button>}
    {mode === "playground" ? <>
      {(["prompting", "features"] as const).map((category) => { const CategoryIcon = category === "prompting" ? MessageCircle : Wrench; return <section key={category} className="mb-7" aria-label={category === "prompting" ? "Prompting practice" : "Feature practice"}>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CategoryIcon size={16} className="text-ink-3" />{category === "prompting" ? "Prompting" : "Features"}</h2>
        <div className="grid gap-2 md:grid-cols-2">{PRACTICE_EXERCISES.filter((e) => e.category === category).map((e) => <button key={e.slug} onClick={() => { if (startPractice(e.slug)) setPage(null); }} className="group flex items-center gap-3 rounded-xl border border-line bg-bg px-4 py-3.5 text-left transition hover:border-clay/40 hover:bg-bg-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-3 text-ink-2">{completed[e.slug] ? <Check size={18} className="text-ok" /> : <SkillIcon id={e.badges[0]} size={18} />}</span><span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{e.title}</span><span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-3">{e.hook}</span></span><ArrowRight size={15} className="shrink-0 text-ink-3 transition group-hover:translate-x-0.5" />
        </button>)}</div>
      </section>; })}
      <button className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink-2 hover:text-clay" onClick={() => { newChat(null); setPage(null); }}><MessageCircle size={17} /> Just explore the workspace <ArrowRight size={15} /></button>
    </> : <>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Choose a challenge</h2><span className="text-xs text-ink-3">The timer starts when you do.</span></div>
      <div className="grid gap-2 md:grid-cols-2">{CHALLENGES.filter((c) => isArenaChallenge(c.slug)).map((c) => <button key={c.slug} onClick={() => openDialog({ kind: "brief", slug: c.slug })} className="group flex items-center gap-3 rounded-xl border border-line bg-bg p-4 text-left transition hover:border-clay/50 hover:bg-clay/5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay">{results[c.slug]?.passed ? <Check size={19} /> : <SkillIcon id={c.badges[0]} size={19} />}</span><span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{c.title}</span><span className="mt-1 block text-xs text-ink-3">Up to {c.points} points</span></span><ArrowRight size={16} className="shrink-0 text-clay" /></button>)}</div>
      <button className="mt-6 flex min-h-11 items-center gap-2 text-sm font-medium text-clay-dark" onClick={() => openDialog({ kind: "leaderboard" })}><Trophy size={17} /> View leaderboard <ArrowRight size={15} /></button>
    </>}
    <footer className="mt-7 border-t border-line pt-3"><button className="min-h-11 text-xs text-ink-3 hover:text-ink" onClick={() => openDialog({ kind: "onboarding" })}>Review onboarding</button></footer>
  </div>;
}
