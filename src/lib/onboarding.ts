import { z } from "zod";
export const ONBOARDING_VERSION = 3;
export const ONBOARDING_DRAFT_KEY = "howto-ai:onboarding:v2";
export const OnboardingSchema = z.object({
  level: z.enum(["starting", "casual", "daily", "connected", "native"]),
  product: z.enum(["claude", "chatgpt"]).default("claude"),
  interests: z.array(z.string().max(60)).max(8).default([]),
  motivation: z.string().max(80).default("Explore"),
  commitment: z.enum(["daily", "own-pace"]).default("own-pace"),
  start: z.enum(["shape-answers", "better-context"]).default("shape-answers"),
  goal: z.enum(["everyday", "work", "automations"]),
});
export const ONBOARDING_QUESTIONS = [
  { id: "level", title: "How much do you use AI today?", options: [
    { id: "starting", label: "I’m just getting started" }, { id: "casual", label: "Sometimes, for quick questions" },
    { id: "daily", label: "Most days" }, { id: "native", label: "Constantly; I want to improve" },
  ] },
  { id: "goal", title: "What would you like AI to help with?", options: [
    { id: "everyday", label: "Everyday questions and decisions" }, { id: "work", label: "Writing, research and work" },
    { id: "automations", label: "Tasks I can hand off" },
  ] },
] as const;
