import "server-only";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ChallengeDef } from "./types";
import { getKey } from "./keys";
import type { CheckResult } from "../types";

const ReviewSchema = z.object({
  checks: z.array(
    z.object({
      id: z.string(),
      evidence: z.string().describe("Work first, rule second: quote or count what you found in the transcript. One short sentence. Plain text."),
      verdict: z.enum(["pass", "fail"]).describe("Must follow from the evidence."),
    }),
  ),
  feedback: z.string().describe("One to three short sentences to the learner: what they missed and the single best improvement. On a clean pass, one warm sentence. Second person, plain text, no em dashes."),
});

const SYSTEM = `You are the grader for Human Arena, a training environment shaped like a chat assistant where people learn to use AI by completing challenges. You receive the challenge brief, a hidden answer key, the gate checks, and a transcript of everything the learner did in the environment during the attempt: their messages, the assistant's replies, files attached, tools the assistant called (web search, Gmail, Drive, warehouse, calendar) with their inputs and outputs, and the project instructions in force.

Rules:
1. Judge every check from the transcript against the key. "pass" only when the transcript clearly satisfies it. If the material needed is absent, the verdict is "fail" and the evidence says what is missing.
2. Judge each check by its key definition alone. Never invent requirements the key does not state.
3. You cannot see images. An attached image appears as a file marker; treat the marker as the image having been sent.
4. Tool calls in the transcript are ground truth for what was searched or read. A number or a link with no supporting tool call, when the key demands one, fails.
5. Never reward length or key-matching words without substance. Fabricated numbers, names or sources fail the relevant check.
6. Return one verdict per check id, in the order given. Evidence before verdict.
7. Be brief and plain. No markdown, no em dashes.`;

export interface Grade {
  checks: CheckResult[];
  feedback: string;
  model: string;
}

export async function gradeAttempt(c: ChallengeDef, transcript: string, attemptDate: string): Promise<Grade> {
  const key = getKey(c.slug);
  if (!key) throw new Error(`No answer key for ${c.slug}`);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Demo mode: pass everything so the loop can be exercised end to end.
    return { checks: c.checks.map((k) => ({ id: k.id, verdict: "pass", evidence: "Demo mode, no grader key set." })), feedback: "Demo mode: set ANTHROPIC_API_KEY to grade for real.", model: "demo" };
  }
  const anthropic = createAnthropic({ apiKey });
  const prompt = `# CHALLENGE: ${c.title}
Attempt date: ${attemptDate}

## BRIEF
${c.brief}

## ANSWER KEY (secret)
${key.key}

## GATE CHECKS (all must pass)
${c.checks.map((k, i) => `${i + 1}. id="${k.id}": ${k.label}`).join("\n")}

## TRANSCRIPT OF THE ATTEMPT
${transcript || "(empty: the learner sent nothing)"}

Grade it now.`;

  const { object } = await generateObject({ model: anthropic("claude-haiku-4-5"), schema: ReviewSchema, system: SYSTEM, prompt, maxRetries: 1 });
  const checks: CheckResult[] = c.checks.map((k, i) => {
    const f = object.checks.find((x) => x.id === k.id) ?? object.checks[i];
    return { id: k.id, verdict: f?.verdict ?? "fail", evidence: f?.evidence ?? "Not returned by the grader." };
  });
  return { checks, feedback: object.feedback, model: "claude-haiku-4-5" };
}
