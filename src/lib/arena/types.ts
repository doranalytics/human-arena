import type { ArenaEventType } from "../types";

/** A behavior the environment can verify from the event log, no LLM needed. */
export interface Behavior {
  id: string;
  /** learner-facing after the fact: "Turned on web search" */
  label: string;
  event: ArenaEventType;
  /** optional required detail (e.g. connector id, model choice) */
  detail?: string;
}

/** A check the grader judges from the transcript against the hidden key. */
export interface Check {
  id: string;
  label: string;
}

/** Material the challenge puts on the stage above the composer. The learner drags it into the chat. */
export type Material =
  | { kind: "file"; id: string; filename: string; title: string; body?: string; url?: string; mediaType: string }
  | { kind: "text"; id: string; title: string; body: string }
  | { kind: "table"; id: string; title: string; columns: string[]; rows: (string | number)[][] };

export interface Hint {
  text: string;
}

export interface ChallengeDef {
  slug: string;
  title: string;
  /** the transferable lesson, one line: what you learn, not what you do */
  hook: string;
  /** what this teaches, one line, shown on the card */
  teaches: string;
  /** skill ids (badges) unlocked on a pass */
  badges: string[];
  minutes: number;
  points: number;
  /** markdown. The scenario and the ask. Shown before Start. */
  brief: string;
  /** what "done" means, one line */
  deliverable: string;
  behaviors: Behavior[];
  checks: Check[];
  /** what the stage shows once the clock starts: files, text, data */
  materials?: Material[];
  hints: Hint[];
  /** order in the list */
  order: number;
}

/** Server-only answer key for the grader. */
export interface ChallengeKey {
  slug: string;
  key: string;
}

export { SKILLS as BADGES } from "./skills";

/** Speed: full credit to 75% of the box, then linear to 0.7 at 100%, floor 0.6 after. */
export function speedMultiplier(secondsUsed: number, minutes: number): number {
  const frac = secondsUsed / (minutes * 60);
  if (frac <= 0.75) return 1;
  if (frac >= 1) return 0.6;
  return 1 - (frac - 0.75) * 1.2;
}

/** Each hint used costs 15% of the base. */
export const HINT_COST = 0.15;

export function computePoints(base: number, passed: boolean, speedMult: number, hintsUsed: number): number {
  if (!passed) return 0;
  const hintMult = Math.max(0.4, 1 - hintsUsed * HINT_COST);
  return Math.round(base * speedMult * hintMult);
}
