import { Lightbulb } from "lucide-react";

/** The lesson, set as a card: clay wash, a lit bulb in a disc, the capability in serif. */
export function LearnCard({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-clay/40 bg-gradient-to-br from-[#fbe9df] to-[#f6d9c9] px-4 py-3.5 shadow-sm">
      <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-clay/15" />
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay text-bg shadow-sm shadow-clay/40"><Lightbulb size={17} /></span>
        <div className="min-w-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-clay-dark">You&rsquo;ll learn</div>
          <div className="mt-0.5 font-serif text-[18px] leading-snug text-ink">{text}</div>
        </div>
      </div>
    </div>
  );
}
