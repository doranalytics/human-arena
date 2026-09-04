import { Lightbulb } from "lucide-react";

/** The lesson, one quiet line under the instructions: clay bulb, small label, serif sentence. No box. */
export function LearnCard({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`flex items-baseline gap-2 text-ink-2 ${className}`}>
      <Lightbulb size={13} className="relative top-0.5 shrink-0 text-clay" />
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">You&rsquo;ll learn</span>
      <span className="font-serif text-[15px] italic leading-snug">{text}</span>
    </div>
  );
}
