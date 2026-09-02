import { Lightbulb } from "lucide-react";

/** The lesson: a small bulb, the label above, the capability in serif below. */
export function LearnCard({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-clay/30 bg-clay/[0.08] px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay text-bg"><Lightbulb size={14} /></span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-clay-dark">You&rsquo;ll learn</div>
        <div className="font-serif text-[15px] leading-snug text-ink">{text}</div>
      </div>
    </div>
  );
}
