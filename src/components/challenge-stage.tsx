"use client";
import { FileText, Image as ImageIcon, GripVertical, Table2, Quote, Swords, Flag } from "lucide-react";
import { LearnCard } from "./learn-card";
import type { ChallengeDef, Material } from "@/lib/arena/types";
import type { Attempt } from "@/lib/types";
import { MATERIAL_MIME, sendToComposer } from "@/lib/materials";
import { cn } from "@/lib/utils";
import { SkillPill } from "./skill-pill";

function Card({ m, compact }: { m: Material; compact?: boolean }) {
  const icon = m.kind === "table" ? <Table2 size={15} /> : m.kind === "text" ? <Quote size={15} /> : m.mediaType.startsWith("image/") ? <ImageIcon size={15} /> : <FileText size={15} />;
  const hint = m.kind === "file" ? "Drag into the message box" : "Drag or click to drop in";
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(MATERIAL_MIME, JSON.stringify(m));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => sendToComposer(m)}
      title={hint}
      className={cn("group flex cursor-grab select-none items-start gap-2.5 rounded-xl border border-line bg-bg text-left shadow-sm transition hover:border-clay/60 hover:shadow-md active:cursor-grabbing", compact ? "px-2.5 py-1.5" : "w-[260px] px-3.5 py-3")}
    >
      <span className={cn("flex shrink-0 items-center justify-center rounded-lg bg-bg-3 text-ink-2", compact ? "h-6 w-6" : "h-9 w-9")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate font-medium", compact ? "text-[12.5px]" : "text-[13.5px]")}>{m.title}</div>
        {!compact && m.kind === "file" && <div className="truncate text-[12px] text-ink-3">{m.filename}</div>}
        {!compact && m.kind === "text" && <div className="mt-1 line-clamp-3 text-[12px] leading-snug text-ink-2">{m.body}</div>}
        {!compact && m.kind === "table" && (
          <div className="mt-1.5 overflow-hidden rounded-md border border-line text-[11px]">
            <table className="w-full">
              <thead className="bg-bg-2 text-ink-3"><tr>{m.columns.slice(0, 3).map((c) => <th key={c} className="px-1.5 py-0.5 text-left font-medium">{c}</th>)}</tr></thead>
              <tbody>{m.rows.slice(0, 3).map((r, i) => <tr key={i} className="border-t border-line">{r.slice(0, 3).map((c, j) => <td key={j} className="px-1.5 py-0.5 tabular-nums">{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        {!compact && <div className="mt-1.5 text-[11px] text-ink-3 opacity-0 transition group-hover:opacity-100">{hint}</div>}
      </div>
      <GripVertical size={14} className="mt-0.5 shrink-0 text-ink-3 opacity-40" />
    </div>
  );
}

/** Full stage: shown in place of the greeting while the chat is empty and a challenge is running. */
export function ChallengeStage({ c }: { c: ChallengeDef; attempt: Attempt }) {
  const materials = c.materials ?? [];
  return (
    <div className="w-full max-w-[760px]">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-[12px] font-medium text-ink-3"><Swords size={13} className="text-clay" /> Challenge {c.order}</div>
        <h1 className="mt-1 font-serif text-[34px] leading-tight tracking-tight text-ink">{c.title}</h1>
        <div className="mt-3"><LearnCard text={c.hook} /></div>
      </div>
      <div className="px-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-3">Your move</div>
        <div className="prose-chat mt-0.5 text-[16px]">{c.brief.split(/\n\s*\n/).map((p, i) => <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>") }} />)}</div>
      </div>
      {materials.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[11.5px] font-medium uppercase tracking-wide text-ink-3">What you have</div>
          <div className="flex flex-wrap gap-2.5">{materials.map((m) => <Card key={m.id} m={m} />)}</div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
        <Flag size={12} /> Done when {c.deliverable.replace(/\.$/, "").toLowerCase()} · unlocks {c.badges.map((b) => <SkillPill key={b} id={b} />)}
      </div>
    </div>
  );
}

/** Collapsed strip: sits above the messages once the conversation has started. The rules, minimal, plus the material. No clock (the top bar has one). */
export function ChallengeStrip({ c }: { c: ChallengeDef; attempt: Attempt }) {
  const materials = c.materials ?? [];
  const steps = c.brief
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith(">") && !/^https?:\/\/\S+$/.test(b))
    .map((b) => b.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1"));
  return (
    <div className="sticky top-0 z-10 border-b border-line bg-bg/95 px-5 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-[760px] items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-clay-dark">{c.title}</div>
          <ol className="mt-0.5 space-y-0.5">
            {steps.map((t, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink-2">
                {steps.length > 1 && <span className="shrink-0 tabular-nums text-ink-3">{i + 1}.</span>}
                <span className="min-w-0">{t}</span>
              </li>
            ))}
          </ol>
        </div>
        {materials.length > 0 && <div className="flex shrink-0 flex-wrap justify-end gap-1.5 pt-1">{materials.map((m) => <Card key={m.id} m={m} compact />)}</div>}
      </div>
    </div>
  );
}
