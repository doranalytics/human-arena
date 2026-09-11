"use client";
import { Check, X, Swords } from "lucide-react";
import { Dialog, Button } from "../dialog";
import { CHALLENGES, getChallenge } from "@/lib/arena/challenges";
import { SkillPill } from "../skill-pill";
import { useStore } from "@/lib/store";
import { closeDialog, openDialog } from "@/lib/ui";
import { fmtClock } from "@/lib/utils";
import { isArenaChallenge } from "@/lib/game-mode";

// Public action labels describe completed work. Use the same requirement as
// an instruction on failure; preserve the original label in grading details.
function nextStep(label: string): string {
  const verbs: Record<string, string> = { Sent: "Send", Pinned: "Pin", Renamed: "Rename", Added: "Add", Attached: "Attach", Asked: "Ask", Used: "Use", Invoked: "Invoke", Created: "Create", Started: "Start", Saved: "Save", Dictated: "Dictate", Answered: "Answer", Turned: "Turn", Moved: "Move", Exported: "Export", Scheduled: "Schedule" };
  return label.replace(/^\w+/, (word) => verbs[word] ?? word);
}

export function ResultDialog({ open, slug }: { open: boolean; slug: string }) {
  const c = getChallenge(slug);
  const r = useStore((s) => s.latestResult?.slug === slug ? s.latestResult : s.results[slug]);
  const results = useStore((s) => s.results);
  if (!c) return null;
  const next = CHALLENGES.find((c) => isArenaChallenge(c.slug) && !results[c.slug]?.passed);
  const steps = r ? [
    ...r.behaviors.map((b) => ({ label: b.label, pass: b.pass, evidence: "" })),
    ...r.checks.map((k) => ({ label: r.checkLabels?.[k.id] ?? c.checks.find((x) => x.id === k.id)?.label ?? k.id, pass: k.verdict === "pass", evidence: k.evidence })),
  ] : [];
  const missing = steps.find((s) => !s.pass);
  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      title={<span className="flex items-center gap-2"><Swords size={16} className="text-clay" /> {c.title}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={() => openDialog({ kind: "challenges" })}>All challenges</Button>
          {r?.passed && next ? (
            <Button onClick={() => openDialog({ kind: "brief", slug: next.slug })}>Next challenge</Button>
          ) : r?.passed ? (
            <Button onClick={() => openDialog({ kind: "leaderboard" })}>See the board</Button>
          ) : (
            <Button onClick={() => openDialog({ kind: "brief", slug })}>Try again</Button>
          )}
        </>
      }
    >
      {!r ? (
        <div className="text-ink-2">No result recorded for this challenge yet.</div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${r.passed ? "practice-success bg-ok/10 text-ok" : "bg-bg-3 text-ink-2"}`}>{r.passed ? <Check size={20} /> : <Swords size={18} />}</div>
            <div>
              <div className="font-serif text-[22px]">{r.passed ? "Challenge complete" : `${steps.filter((s) => s.pass).length} of ${steps.length} steps complete`}</div>
              <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{r.passed ? c.hook : missing ? `Next: ${nextStep(missing.label)}` : r.feedback}</p>
              {!r.passed && missing?.evidence && <p className="mt-1 text-[13px] text-ink-3">{missing.evidence}</p>}
            </div>
          </div>
          {r.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills practised">
              {r.badges.map((b) => (
                <SkillPill key={b} id={b} size="md" earned onClick={() => openDialog({ kind: "leaderboard", tab: "progress" })} />
              ))}
            </div>
          )}
          <div className="mt-4 text-[12px] tabular-nums text-ink-3">
            {r.passed && <>{r.points} points · </>}{fmtClock(r.seconds)} elapsed · {r.hintsUsed} hint{r.hintsUsed === 1 ? "" : "s"}
          </div>
          <details className="mt-4 border-t border-line pt-3">
            <summary className="cursor-pointer text-[13px] text-ink-2">See grading details</summary>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{r.feedback}</p>
            {r.behaviors.length > 0 && <Section title="Actions checked">
            {r.behaviors.map((b) => (
              <Row key={b.id} ok={b.pass} label={b.label} />
            ))}
          </Section>}
          {r.checks.length > 0 && <Section title="Answer checked">
            {r.checks.map((k) => (
              <Row key={k.id} ok={k.verdict === "pass"} label={r.checkLabels?.[k.id] ?? c.checks.find((x) => x.id === k.id)?.label ?? k.id} sub={k.evidence} />
            ))}
          </Section>}
          </details>
        </>
      )}
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-[12px] font-medium text-ink-3">{title}</div>
      <div className="divide-y divide-line rounded-lg border border-line">{children}</div>
    </div>
  );
}
function Row({ ok, label, sub }: { ok: boolean; label: string; sub?: string }) {
  return (
    <div className="flex gap-2.5 px-3 py-2.5">
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}>{ok ? <Check size={11} /> : <X size={11} />}</span>
      <div className="min-w-0">
        <div className="text-[13.5px]">{label}</div>
        {sub && <div className="text-[12.5px] text-ink-3">{sub}</div>}
      </div>
    </div>
  );
}
