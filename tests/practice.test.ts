import { test } from "node:test";
import assert from "node:assert/strict";
import { practiceDate, practiceTimezone, recommendPractice, summarizePractice, shiftDate } from "../src/lib/practice";
import { CHALLENGES } from "../src/lib/arena/challenges";
import { tierFor } from "../src/lib/tiers";
import type { ArenaResult } from "../src/lib/types";

const result = (slug: string, badges: string[], passed = true): ArenaResult => ({ slug, badges, passed, points: passed ? 1 : 0, maxPoints: 25, seconds: 900, hintsUsed: 2, speedMult: .5, behaviors: [], checks: [], feedback: "", at: "2026-09-08T12:00:00Z" });

test("practice follows local midnight, including both sides of the date line", () => {
  const now = new Date("2026-09-08T06:59:59Z");
  assert.equal(practiceDate(now, "America/Los_Angeles"), "2026-09-07");
  assert.equal(practiceDate(new Date("2026-09-08T07:00:00Z"), "America/Los_Angeles"), "2026-09-08");
  assert.equal(practiceDate(now, "Pacific/Kiritimati"), "2026-09-08");
  assert.equal(practiceDate(now, "Pacific/Honolulu"), "2026-09-07");
  assert.equal(practiceTimezone("not/a-zone"), "UTC");
  assert.equal(practiceTimezone(null), "UTC");
});

test("calendar streaks survive daylight saving, leap day and year boundaries", () => {
  for (const [days, time] of [
    [["2026-03-07", "2026-03-08", "2026-03-09"], "2026-03-10T06:00:00Z"],
    [["2026-10-31", "2026-11-01", "2026-11-02"], "2026-11-03T07:00:00Z"],
    [["2024-02-28", "2024-02-29", "2024-03-01"], "2024-03-02T07:00:00Z"],
    [["2025-12-30", "2025-12-31", "2026-01-01"], "2026-01-02T07:00:00Z"],
  ] as const) {
    const s = summarizePractice([...days], "America/Los_Angeles", new Date(time));
    assert.equal(s.current, 3); assert.equal(s.best, 3); assert.equal(s.todayDone, true);
  }
});

test("yesterday counts until today ends; gaps reset only the current streak", () => {
  const dates = ["2026-09-01", "2026-09-02", "2026-09-03"];
  const stillActive = summarizePractice(dates, "UTC", new Date("2026-09-04T23:59:59Z"));
  assert.equal(stillActive.current, 3); assert.equal(stillActive.todayDone, false);
  const afterGap = summarizePractice(dates, "UTC", new Date("2026-09-05T00:00:00Z"));
  assert.equal(afterGap.current, 0); assert.equal(afterGap.best, 3);
  const restarted = summarizePractice([...dates, "2026-09-05"], "UTC", new Date("2026-09-05T23:00:00Z"));
  assert.equal(restarted.current, 1); assert.equal(restarted.best, 3);
});

test("duplicate days, unsorted input and future records cannot inflate streaks", () => {
  const s = summarizePractice(["2026-09-08", "2026-09-07", "2026-09-08", "2026-09-09"], "UTC", new Date("2026-09-08T12:00:00Z"));
  assert.equal(s.current, 2); assert.equal(s.best, 2);
  assert.equal(s.days.length, 7); assert.equal(s.days.filter((d) => d.complete).length, 2);
  assert.equal(summarizePractice([], "UTC").current, 0);
  const long = Array.from({ length: 1100 }, (_, i) => shiftDate("2023-01-01", i));
  assert.equal(summarizePractice(long, "UTC", new Date("2026-09-08T12:00:00Z")).best, 1100);
});

test("recommendations prefer new skills, ignore time estimates and never require replays", () => {
  const base = CHALLENGES[0];
  const catalogue = [
    { ...base, slug: "done", order: 1, badges: ["constraints"] },
    { ...base, slug: "familiar", order: 2, minutes: 1, badges: ["constraints"] },
    { ...base, slug: "new", order: 3, minutes: 10, badges: ["interview"] },
  ];
  const results = { done: result("done", ["constraints"]) };
  assert.equal(recommendPractice(results, catalogue)?.slug, "new");
  assert.equal(recommendPractice({ ...results, new: result("new", [], false) }, catalogue)?.slug, "new");
  const more = { ...results, new: result("new", ["interview"]) };
  assert.equal(recommendPractice(more, catalogue)?.slug, "familiar");
  assert.equal(recommendPractice({ ...more, familiar: result("familiar", ["constraints"]) }, catalogue), null);
});

test("habit never supplies level points; all completed challenges still guarantee AI-Native", () => {
  const results = Object.fromEntries(CHALLENGES.map((c) => [c.slug, result(c.slug, c.badges)]));
  assert.equal(recommendPractice(results), null);
  assert.equal(tierFor(0), "Analog");
  assert.equal(tierFor(CHALLENGES.length, CHALLENGES.length), "AI-Native");
  // Replay badges are a set; a passed challenge with hints is still completed.
  assert.equal(recommendPractice(results), null);
});
