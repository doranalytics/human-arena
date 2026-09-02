/**
 * Model and effort selection, in learner terms. Behind the labels we pick whatever
 * has the best price/performance today. v0 plugs Haiku into both slots.
 */
export type ModelChoice = "fast" | "smart";
export type Effort = "low" | "medium" | "high";

export const MODELS: Record<ModelChoice, { label: string; blurb: string; id: string }> = {
  fast: { label: "Fast", blurb: "Quick answers for everyday tasks", id: "claude-haiku-4-5" },
  // TODO swap for a stronger model once the environment is dialled in.
  smart: { label: "Smart", blurb: "Slower, deeper reasoning for hard problems", id: "claude-haiku-4-5" },
};

export const EFFORTS: Record<Effort, { label: string; blurb: string; thinkingBudget: number | null }> = {
  low: { label: "Low", blurb: "Answers straight away", thinkingBudget: null },
  medium: { label: "Medium", blurb: "Thinks a little first", thinkingBudget: 2048 },
  high: { label: "High", blurb: "Thinks hard before answering", thinkingBudget: 8000 },
};

export function isModelChoice(v: unknown): v is ModelChoice {
  return v === "fast" || v === "smart";
}
export function isEffort(v: unknown): v is Effort {
  return v === "low" || v === "medium" || v === "high";
}
