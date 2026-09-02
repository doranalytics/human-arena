"use client";
import { Check, X, Swords } from "lucide-react";
import { Dialog, Button } from "../dialog";
import { getChallenge, CHALLENGES } from "@/lib/arena/challenges";
import { BADGES } from "@/lib/arena/types";
import { useStore } from "@/lib/store";
import { closeDialog, openDialog } from "@/lib/ui";
import { fmtClock } from "@/lib/utils";

export function ResultDialog({ open, slug }: { open: boolean; slug: string }) {
  const c = getChallenge(slug);
  const r = useStore((s) => s.results[slug]);
  const results = useStore((s) => s.results);
  if (!c) return null;
  // The next challenge in order that has not been passed yet, starting after this one and wrapping.
  const ordered = [...CHALLENGES].sort((a, b) => a.order - b.order);
  const i = ordered.findIndex((x) => x.slug === slug);
  const next = [...ordered.slice(i + 1), ...ordered.slice(0, i)].find((x) => !results[x.slug]?.passed) ?? null;
  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      title={<span className="flex items-center gap-2"><Swords size={16} className="text-clay" /> {c.title}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={() => openDialog({ kind: "challenges" })}>All challenges</Button>
          {!r?.passed && <Button variant="outline" onClick={() => openDialog({ kind: "brief", slug })}>Try again</Button>}
          {r?.passed && next ? (
            <Button onClick={() => openDialog({ kind: "brief", slug: next.slug })}>Next challenge</Button>
          ) : r?.passed ? (
            <Button onClick={() => openDialog({ kind: "leaderboard" })}>See the board</Button>
          ) : (
            <Button onClick={closeDialog}>Done</Button>
          )}
        </>
      }
    >
      {!r ? (
        <div className="text-ink-2">No result recorded for this challenge yet.</div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${r.passed ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}>{r.passed ? <Check size={28} /> : <X size={28} />}</div>
            <div>
              <div className="font-serif text-[24px]">{r.passed ? `+${r.points} points` : "Not this time"}</div>
              <div className="text-[13px] text-ink-2">
                {fmtClock(r.seconds)} of {c.minutes}:00 · speed x{r.speedMult.toFixed(2)} · {r.hintsUsed} hint{r.hintsUsed === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-bg-2 px-3.5 py-3 text-[14px] leading-relaxed">{r.feedback}</div>
          {r.badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.badges.map((b) => (
                <span key={b} className="rounded-lg border border-line bg-bg px-2.5 py-1 text-[12.5px]">{BADGES[b]?.emoji} {BADGES[b]?.name} unlocked</span>
              ))}
            </div>
          )}
          <Section title="What the arena saw you do">
            {r.behaviors.map((b) => (
              <Row key={b.id} ok={b.pass} label={b.label} />
            ))}
          </Section>
          <Section title="What the reply needed">
            {r.checks.map((k) => (
              <Row key={k.id} ok={k.verdict === "pass"} label={c.checks.find((x) => x.id === k.id)?.label ?? k.id} sub={k.evidence} />
            ))}
          </Section>
        </>
      )}
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-[12px] font-medium text-ink-3">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ ok, label, sub }: { ok: boolean; label: string; sub?: string }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-line px-3 py-2">
      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"}`}>{ok ? <Check size={11} /> : <X size={11} />}</span>
      <div className="min-w-0">
        <div className="text-[13.5px]">{label}</div>
        {sub && <div className="text-[12.5px] text-ink-3">{sub}</div>}
      </div>
    </div>
  );
}
