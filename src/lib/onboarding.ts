import { z } from "zod";
export const OnboardingSchema = z.object({
  level: z.enum(["starting", "casual", "daily", "native"]),
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
