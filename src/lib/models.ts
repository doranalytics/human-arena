/**
 * Model and effort selection, in learner terms. Behind the labels we pick whatever
 * has the best price/performance today, from whichever provider.
 * Fast = OpenAI GPT-5.6 Luna (cheap, quick). Smart = Claude. Grading always runs on Claude.
 */
export type ModelChoice = "fast" | "smart";
export type Effort = "low" | "medium" | "high";
export type Provider = "openai" | "anthropic";

export const MODELS: Record<ModelChoice, { label: string; blurb: string; provider: Provider; id: string }> = {
  fast: { label: "Fast", blurb: "Quick answers for everyday tasks", provider: "openai", id: "gpt-5.6-luna" },
  smart: { label: "Smart", blurb: "Slower, deeper reasoning for hard problems", provider: "anthropic", id: "claude-haiku-4-5" },
};

/** If the Fast provider has no key, this Claude model stands in. */
export const FAST_FALLBACK = "claude-haiku-4-5";

export const EFFORTS: Record<Effort, { label: string; blurb: string; thinkingBudget: number | null; openaiEffort: "none" | "low" | "high" }> = {
  low: { label: "Low", blurb: "Answers straight away", thinkingBudget: null, openaiEffort: "none" },
  medium: { label: "Medium", blurb: "Thinks a little first", thinkingBudget: 2048, openaiEffort: "low" },
  high: { label: "High", blurb: "Thinks hard before answering", thinkingBudget: 8000, openaiEffort: "high" },
};

export function isModelChoice(v: unknown): v is ModelChoice {
  return v === "fast" || v === "smart";
}
export function isEffort(v: unknown): v is Effort {
  return v === "low" || v === "medium" || v === "high";
}
