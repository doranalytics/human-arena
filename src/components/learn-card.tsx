import { Lightbulb } from "lucide-react";

/** The lesson on a dark card: ink ground, clay bulb, cream serif. Reads as a statement, not a warning. */
export function LearnCard({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#2c2b28] px-3.5 py-2.5 text-bg">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay text-bg"><Lightbulb size={14} /></span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bg/60">You&rsquo;ll learn</div>
        <div className="font-serif text-[15.5px] leading-snug">{text}</div>
      </div>
    </div>
  );
}
