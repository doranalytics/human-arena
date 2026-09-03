import { skillFor } from "@/lib/arena/skills";
import { SkillIcon } from "./skill-icon";
import { cn } from "@/lib/utils";

/** The one way a skill is shown anywhere: its icon and name in a pill. `iconOnly` for tight rows (name in the tooltip). */
export function SkillPill({ id, size = "sm", earned, iconOnly, className }: { id: string; size?: "sm" | "md"; earned?: boolean; iconOnly?: boolean; className?: string }) {
  const s = skillFor(id);
  return (
    <span title={s.name} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border", iconOnly ? "h-6 w-6 justify-center px-0" : size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-[12.5px]", earned ? "border-ok/50 bg-ok/10 font-medium text-ink" : "border-line bg-bg-2 text-ink-2", className)}>
      <SkillIcon id={id} size={size === "sm" ? 12 : 14} className={earned ? "text-ok" : "text-ink-2"} />
      {!iconOnly && s.name}
    </span>
  );
}
