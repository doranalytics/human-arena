"use client";
import { Compass, Swords } from "lucide-react";
import { useStore } from "@/lib/store";
import { enterMode } from "@/lib/ui";
import { MODE_COPY } from "@/lib/game-mode";
import { cn } from "@/lib/utils";
export function ModeSwitch() {
  const mode = useStore((s) => s.gameMode);
  const busy = useStore((s) => s.busyChatIds.length > 0 || s.grading);
  return <nav aria-label="Workspace mode" className="flex shrink-0 items-center gap-0.5 rounded-xl border border-line bg-bg-2 p-1">
    {(["playground", "arena"] as const).map((m) => { const Icon = m === "playground" ? Compass : Swords; return <button key={m} type="button" aria-pressed={mode === m} disabled={busy} onClick={() => enterMode(m)} className={cn("flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition disabled:opacity-50 md:min-h-8", mode === m ? m === "arena" ? "bg-clay text-white shadow-sm" : "bg-bg text-ink shadow-sm" : "text-ink-3 hover:text-ink")}><Icon size={15} /><span>{MODE_COPY[m].title}</span></button>; })}
  </nav>;
}
