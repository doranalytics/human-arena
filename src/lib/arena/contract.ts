import type { ChallengeDef } from "./types";
import type { CheckResult } from "../types";

/** The visible criteria ARE the rubric. Private references contain facts, never extra requirements. */
export function criteriaFor(c: ChallengeDef) {
  return [...c.behaviors.map((b) => ({ id: b.id, label: b.label, kind: "action" as const })),
    ...c.checks.map((k) => ({ ...k, kind: "answer" as const }))];
}

/** Changes to any instruction, criterion, material or score produce a new version. */
export function challengeVersion(c: ChallengeDef): string {
  const text = JSON.stringify(c);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `2-${(hash >>> 0).toString(16)}`;
}

/** Never award a different check's verdict by array position. Malformed reviews are retryable. */
export function validateReview(c: ChallengeDef, returned: CheckResult[]): CheckResult[] {
  const ids = new Set(returned.map((x) => x.id));
  if (ids.size !== returned.length || returned.length !== c.checks.length ||
      c.checks.some((k) => !ids.has(k.id))) throw new Error("Grader returned an incomplete or invalid rubric");
  return c.checks.map((k) => returned.find((x) => x.id === k.id)!);
}
