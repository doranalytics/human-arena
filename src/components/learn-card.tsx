import { Lightbulb } from "lucide-react";

/** The lesson, one compact line: clay wash, a small bulb, the capability in serif. */
export function LearnCard({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-clay/30 bg-clay/[0.08] px-3 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay text-bg"><Lightbulb size={13} /></span>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-clay-dark">You&rsquo;ll learn</span>
      <span className="min-w-0 font-serif text-[15px] leading-snug text-ink">{text}</span>
    </div>
  );
}
