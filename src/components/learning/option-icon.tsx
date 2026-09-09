import { BookOpen, BriefcaseBusiness, Cable, CalendarCheck, Compass, Feather, Flame, GraduationCap, House, Layers, Lightbulb, MessageCircle, Palette, Rocket, Search, SlidersHorizontal, Sparkles, Sprout, Target, Timer, WandSparkles, Workflow, Wrench, type LucideIcon } from "lucide-react";

type Tone = "blue" | "violet" | "peach" | "gold" | "teal" | "rose";
const icons: Record<string, [LucideIcon, Tone]> = {
  ChatGPT: [MessageCircle, "teal"], Claude: [Sparkles, "peach"],
  "Better answers": [SlidersHorizontal, "violet"],
  Writing: [Feather, "violet"], Research: [Search, "blue"],
  Learning: [BookOpen, "gold"], Visuals: [Palette, "rose"],
  Automation: [Workflow, "teal"], "Connected information": [Cable, "blue"],
  "Building tools": [Wrench, "peach"], Exploring: [Compass, "gold"],
  "Save time": [Timer, "blue"], "Improve my work": [WandSparkles, "violet"],
  "Advance my career": [BriefcaseBusiness, "peach"], "Create something": [Palette, "rose"],
  "Manage everyday life": [House, "teal"], "Feel more confident": [Target, "gold"],
  "Satisfy my curiosity": [Lightbulb, "violet"],
  "I’ve barely tried AI": [Sprout, "teal"], "I ask basic questions": [MessageCircle, "blue"],
  "I regularly refine answers": [SlidersHorizontal, "violet"],
  "I use files and connected tools": [Cable, "peach"],
  "I build reusable workflows": [Workflow, "gold"],
  "I’ll aim for one a day": [CalendarCheck, "peach"],
  "I’ll practice at my own pace": [Compass, "blue"],
  "Start with the basics": [Sprout, "teal"],
  "Try a harder starting lesson": [Rocket, "violet"],
  Practice: [MessageCircle, "blue"], Combine: [Layers, "violet"], Create: [Target, "peach"],
  Streak: [Flame, "peach"], Progress: [GraduationCap, "gold"],
};

/** Decorative SVG icons: labels carry the meaning, so color is never required. */
export function OptionIcon({ label }: { label: string }) {
  const [Icon, tone] = icons[label] ?? [Sparkles, "violet"];
  return <span className={`learn-option-icon learn-icon-${tone}`} aria-hidden="true"><Icon size={24} strokeWidth={1.9} /></span>;
}
