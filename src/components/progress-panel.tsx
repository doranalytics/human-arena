"use client";
import { Check } from "lucide-react";
import { useStore, totalPoints } from "@/lib/store";
import { openDialog, closeDialog } from "@/lib/ui";
import { TierBadge, TIER_STYLE, type BadgeTier } from "./icons";
import { SkillIcon } from "./skill-icon";
import { SKILLS, SKILL_GROUPS } from "@/lib/arena/skills";
import { CHALLENGES } from "@/lib/arena/challenges";
import { TIERS, tierFor } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import { isArenaChallenge } from "@/lib/game-mode";
const currentChallenges = CHALLENGES.filter((c) => isArenaChallenge(c.slug));
const currentSkills = new Set(currentChallenges.flatMap((c) => c.badges));

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-medium text-ink-3">{children}</div>;
}

/* ----------------------------------------------------------------- progress */
export function ProgressPanel() {
  const results = useStore((s) => s.results);
  const earned = new Set(Object.values(results).filter((r) => r.passed).flatMap((r) => r.badges));
  const pts = totalPoints(results);
  const tier = tierFor(pts, Object.values(results).filter((r) => r.passed).length);
  const current = TIERS.find((t) => t.tier === tier) ?? null;
  const next = tier === "AI-Native" ? null : TIERS.find((t) => t.min > pts) ?? null;
  const floor = current?.min ?? 0;
  const progress = next ? Math.min(1, Math.max(0, (pts - floor) / (next.min - floor))) : 1;
  const gradable = currentSkills.size;
  return (
    <div className="space-y-7">
      <section>
        <Label>Lifetime progress</Label>
        <div className="rounded-xl border border-line bg-bg-2/60 p-4">
          <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 md:flex md:gap-3">
            {tier === "Analog" ? <TierBadge tier="Tourist" locked size={44} /> : <TierBadge tier={tier as BadgeTier} size={44} />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="font-serif text-[20px] font-semibold leading-none">{tier}</span><span className="text-[13px] tabular-nums text-ink-2">{pts} pts</span></div>
              <div className="mt-1 text-[12.5px] text-ink-3">{tier === "Analog" ? "Finish one challenge to become a Tourist." : current?.blurb}</div>
            </div>
            {next && <div className="col-start-2 flex items-baseline gap-1.5 md:block md:shrink-0 md:text-right"><div className="text-[17px] font-semibold tabular-nums leading-none">{next.min - pts}</div><div className="mt-0.5 text-[11.5px] text-ink-3">to {next.tier}</div></div>}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%`, background: TIER_STYLE[(next?.tier ?? "AI-Native") as BadgeTier].fill }} /></div>
          <ol className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-5 sm:gap-1">
            {TIERS.map((t) => {
              const unlocked = TIERS.findIndex((x) => x.tier === t.tier) <= TIERS.findIndex((x) => x.tier === tier);
              return (
                <li key={t.tier} className="flex min-w-0 flex-col items-center text-center" title={t.blurb}>
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
        <Label>Skills earned <span className="font-normal">· {[...earned].filter((id) => currentSkills.has(id)).length} of {gradable}</span></Label>
        <div className="space-y-3">
          {SKILL_GROUPS.filter((g) => Object.entries(SKILLS).some(([id, s]) => s.group === g && currentSkills.has(id))).map((g) => (
            <div key={g}>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-3">{g}</div>
              <div className="grid grid-cols-1 gap-1.5 min-[380px]:grid-cols-2 sm:grid-cols-3">
                {Object.entries(SKILLS).filter(([id, s]) => s.group === g && currentSkills.has(id)).map(([id, s]) => {
                  const has = earned.has(id);
                  const later = s.status === "later";
                  return later ? (
                      <div key={id} title="The arena cannot grade this yet" className="flex items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-1.5 text-[12.5px] text-ink-3 opacity-60">
                        <SkillIcon id={id} size={15} className="text-ink-3" />
                        <span className="min-w-0 flex-1 truncate">{s.name}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-3">soon</span>
                      </div>
                    ) : (
                      <button key={id} onClick={() => { const c = currentChallenges.find((x) => x.badges.includes(id)); if (c) { closeDialog(); openDialog({ kind: "brief", slug: c.slug }); } }} title={has ? "Earned. Open the challenge again" : "Open the challenge that teaches it"} className={cn("flex min-h-10 items-center gap-2 rounded-lg border px-2.5 md:min-h-0 py-1.5 text-left text-[12.5px] transition hover:border-line-2", has ? "border-ok/50 bg-ok/10 font-medium text-ink shadow-sm shadow-ok/10" : "border-line bg-bg text-ink-2 hover:bg-bg-2")}>
                        <SkillIcon id={id} size={15} className={has ? "text-ok" : "text-ink-3"} />
                        <span className="min-w-0 flex-1 truncate">{s.name}</span>
                        {has && <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok text-bg"><Check size={10} strokeWidth={3} /></span>}
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
