"use client";
import { Check } from "lucide-react";
import { useStore, totalPoints } from "@/lib/store";
import { openDialog } from "@/lib/ui";
import { TierBadge, TIER_STYLE, type BadgeTier } from "./icons";
import { SkillIcon } from "./skill-icon";
import { SKILLS, SKILL_GROUPS, TOOL_SENSE_THRESHOLD } from "@/lib/arena/skills";
import { FEATURE_SLUGS, CHALLENGES } from "@/lib/arena/challenges";
import { TIERS, tierFor } from "@/lib/tiers";
import { cn } from "@/lib/utils";

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-medium text-ink-3">{children}</div>;
}

/* ----------------------------------------------------------------- progress */
export function ProgressPanel() {
  const results = useStore((s) => s.results);
  const earned = new Set(Object.values(results).filter((r) => r.passed).flatMap((r) => r.badges));
  const featurePasses = Object.values(results).filter((r) => r.passed && FEATURE_SLUGS.has(r.slug)).length;
  if (featurePasses >= TOOL_SENSE_THRESHOLD) earned.add("tool-choice");
  const pts = totalPoints(results);
  const tier = tierFor(pts);
  const current = TIERS.find((t) => t.tier === tier) ?? null;
  const next = TIERS.find((t) => t.min > pts) ?? null;
  const floor = current?.min ?? 0;
  const progress = next ? Math.min(1, Math.max(0, (pts - floor) / (next.min - floor))) : 1;
  const gradable = Object.values(SKILLS).filter((s) => s.status === "ready").length;
  return (
    <div className="space-y-7">
      <section>
        <Label>Level</Label>
        <div className="rounded-xl border border-line bg-bg-2/60 p-4">
          <div className="flex items-center gap-3">
            {tier === "Analog" ? <TierBadge tier="Tourist" locked size={44} /> : <TierBadge tier={tier as BadgeTier} size={44} />}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2"><span className="font-serif text-[20px] font-semibold leading-none">{tier}</span><span className="text-[13px] tabular-nums text-ink-2">{pts} pts</span></div>
              <div className="mt-1 text-[12.5px] text-ink-3">{tier === "Analog" ? "Finish one challenge to become a Tourist." : current?.blurb}</div>
            </div>
            {next && <div className="shrink-0 text-right"><div className="text-[17px] font-semibold tabular-nums leading-none">{next.min - pts}</div><div className="mt-0.5 text-[11.5px] text-ink-3">to {next.tier}</div></div>}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%`, background: TIER_STYLE[(next?.tier ?? "AI-Native") as BadgeTier].fill }} /></div>
          <ol className="mt-4 grid grid-cols-5 gap-1">
            {TIERS.map((t) => {
              const unlocked = pts >= t.min;
              return (
                <li key={t.tier} className="flex flex-col items-center text-center" title={t.blurb}>
                  <span className={cn("rounded-full bg-bg p-0.5", t.tier === tier && "ring-2 ring-clay ring-offset-2 ring-offset-bg-2")}><TierBadge tier={t.tier} locked={!unlocked} size={34} /></span>
                  <span className={cn("mt-1.5 text-[11.5px] font-medium leading-tight", !unlocked && "text-ink-3")}>{t.tier}</span>
                  <span className={cn("text-[10.5px] tabular-nums", unlocked ? "text-ink-2" : "text-ink-3")}>{t.min === 1 ? "1st pt" : `${t.min}`}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      <section>
        <Label>Skills earned <span className="font-normal">· {[...earned].filter((id) => id in SKILLS).length} of {gradable} · {Object.keys(SKILLS).length - gradable} coming</span></Label>
        <div className="space-y-3">
          {SKILL_GROUPS.map((g) => (
            <div key={g}>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-3">{g}</div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {Object.entries(SKILLS).filter(([, s]) => s.group === g).map(([id, s]) => {
                  const has = earned.has(id);
                  const later = s.status === "later";
                  return (
                    <button key={id} onClick={() => { const c = CHALLENGES.find((x) => x.badges.includes(id)); if (c) openDialog({ kind: "brief", slug: c.slug }); }} title={later ? "The arena cannot grade this yet" : id === "tool-choice" ? `Earned after ${TOOL_SENSE_THRESHOLD} feature challenges` : "Open the challenge that teaches it"} className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[12.5px] transition hover:border-line-2", has ? "border-ok/50 bg-ok/10 font-medium text-ink shadow-sm shadow-ok/10" : "border-dashed border-line text-ink-3", later && "opacity-60")}>
                      <SkillIcon id={id} size={15} className={has ? "text-ok" : "text-ink-3"} />
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      {has && <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok text-bg"><Check size={10} strokeWidth={3} /></span>}
                      {later && <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-3">soon</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

