"use client";
import { Check, Flame } from "lucide-react";
import { useSession, refreshPractice } from "@/lib/session";
import { cn } from "@/lib/utils";

export function PracticeStatus({ compact = false }: { compact?: boolean }) {
  const { practice, me } = useSession();
  if (!me) return null;
  if (!practice) return <div className="text-[12px] text-ink-3">Practice history unavailable. <button className="underline" onClick={() => void refreshPractice()}>Retry</button></div>;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-[13px]">
          <Flame size={16} className={practice.current ? "text-clay" : "text-ink-3"} />
          <span className="font-medium tabular-nums">{practice.current ? `${practice.current} day streak` : "Start a streak"}</span>
          {!compact && <span className="text-ink-3">Best: {practice.best}</span>}
        </div>
        <ol aria-label="Last seven practice days" className={cn("flex max-w-full", compact ? "gap-1.5" : "w-full justify-between gap-1 md:w-auto md:gap-2")}>
          {practice.days.map(({ date, complete }) => (
            <li key={date} title={`${date}: ${complete ? "complete" : date === practice.today ? "not yet" : "no practice"}`} aria-label={`${date}: ${complete ? "complete" : date === practice.today ? "not yet" : "no practice"}`}>
              <span className={cn("flex items-center justify-center rounded-full border", compact ? "h-5 w-5" : "h-7 w-7", complete ? "border-ok bg-ok text-white" : "border-line bg-bg text-ink-3", date === practice.today && "ring-1 ring-ink-3 ring-offset-2 ring-offset-bg")}>
                {complete ? <Check size={compact ? 11 : 14} strokeWidth={2.5} /> : <span className="h-1 w-1 rounded-full bg-line-2" />}
              </span>
              {!compact && <span aria-hidden className="mt-1 block text-center text-[10px] text-ink-3">{new Intl.DateTimeFormat("en", { weekday: "narrow", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}</span>}
            </li>
          ))}
        </ol>
      </div>
      {!compact && <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">Complete one challenge a day. Hints are welcome. Missing a day never removes your skills.<span className="mt-1 block text-[11.5px]">Days follow {practice.timezone.replaceAll("_", " ")}.</span></p>}
    </div>
  );
}
