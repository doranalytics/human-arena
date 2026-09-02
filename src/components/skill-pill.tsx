import { skillFor } from "@/lib/arena/skills";
import { cn } from "@/lib/utils";

/** The one way a skill is shown anywhere: its mark and name in a pill. */
export function SkillPill({ id, size = "sm", earned, className }: { id: string; size?: "sm" | "md"; earned?: boolean; className?: string }) {
  const s = skillFor(id);
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md border", size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-[12.5px]", earned ? "border-ok/50 bg-ok/10 font-medium text-ink" : "border-line bg-bg-2 text-ink-2", className)}>
      <span className={size === "sm" ? "text-[11px]" : "text-[13px]"}>{s.emoji}</span>
      {s.name}
    </span>
  );
}
