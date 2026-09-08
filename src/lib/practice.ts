import { CHALLENGES } from "./arena/challenges";
import type { ChallengeDef } from "./arena/types";
import type { ArenaResult } from "./types";

export interface PracticeSummary {
  timezone: string;
  today: string;
  todayDone: boolean;
  current: number;
  best: number;
  days: { date: string; complete: boolean }[];
}

export function practiceTimezone(value: unknown): string {
  try {
    if (typeof value === "string" && value.length <= 100) {
      return new Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions().timeZone;
    }
  } catch { /* Invalid browser input uses UTC. */ }
  return "UTC";
}

export function practiceDate(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Calendar arithmetic, not 24-hour intervals in a timezone (DST days vary). */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function summarizePractice(dates: string[], timezone: string, now = new Date()): PracticeSummary {
  const today = practiceDate(now, timezone);
  const completed = new Set(dates.filter((d) => d <= today));
  const ordered = [...completed].sort();
  let best = 0, run = 0, previous = "";
  for (const date of ordered) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  // Yesterday's run remains active until the learner has had all of today.
  let current = 0;
  for (let day = completed.has(today) ? today : shiftDate(today, -1); completed.has(day); day = shiftDate(day, -1)) current++;
  return { timezone, today, todayDone: completed.has(today), current, best,
    days: Array.from({ length: 7 }, (_, i) => {
      const date = shiftDate(today, i - 6);
      return { date, complete: completed.has(date) };
    }) };
}

/** New capabilities first; estimates and replay scores do not decide the order. */
export function recommendPractice(results: Record<string, ArenaResult>, challenges: readonly ChallengeDef[] = CHALLENGES): ChallengeDef | null {
  const earned = new Set(Object.values(results).filter((r) => r.passed).flatMap((r) => r.badges));
  const remaining = [...challenges].filter((c) => !results[c.slug]?.passed).sort((a, b) => a.order - b.order);
  return remaining.find((c) => c.badges.some((b) => !earned.has(b))) ?? remaining[0] ?? null;
}
