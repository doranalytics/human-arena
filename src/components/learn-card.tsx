import { Lightbulb } from "lucide-react";

/** The lesson, one slim line on ink, under the instructions. */
export function LearnCard({ text }: { text: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-md bg-[#2c2b28] px-2.5 py-1.5 text-bg">
      <Lightbulb size={12} className="shrink-0 text-clay" />
      <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-bg/55">You&rsquo;ll learn</span>
      <span className="truncate font-serif text-[13.5px]">{text}</span>
    </div>
  );
}
