"use client";
import { useState } from "react";
import { useElapsed } from "@/lib/use-elapsed";
import { PanelLeft, Swords, Trophy, Settings, Lightbulb, Flag, X, FolderPlus, Zap, ChevronDown } from "lucide-react";
import { useStore, useHint, endAttempt, attemptChats, getState, newChat, setChatProject, createSkill, track } from "@/lib/store";
import { openDialog, toggleSidebar, useUI, toast } from "@/lib/ui";
import { getChallenge } from "@/lib/arena/challenges";
import { HINT_COST } from "@/lib/arena/types";
import { fmtClock, cn } from "@/lib/utils";
import type { ArenaResult } from "@/lib/types";

export function TopBar({ title }: { title: string }) {
  const attempt = useStore((s) => s.attempt);
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const c = attempt ? getChallenge(attempt.slug) : null;
  const elapsed = useElapsed(attempt?.startedAt);
  const [hintOpen, setHintOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const over = c ? elapsed > c.minutes * 60 : false;

  async function submit() {
    if (!attempt || !c || submitting) return;
    setSubmitting(true);
    const st = getState();
    const chats = attemptChats().map((ch) => {
      const p = ch.projectId ? st.projects.find((x) => x.id === ch.projectId) : null;
      return { title: ch.title, projectName: p?.name, projectInstructions: p?.instructions, customInstructions: st.settings.instructions || undefined, memories: st.settings.memories, messages: ch.messages };
    });
    try {
      const r = await fetch("/api/arena/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: attempt.slug, serverId: attempt.serverId ?? null, startedAt: attempt.startedAt, hintsUsed: attempt.hintsUsed, events: attempt.events, chats }),
      });
      const j = (await r.json()) as { result?: ArenaResult; error?: string; detail?: string };
      if (!r.ok || !j.result) {
        toast({ title: "Could not grade that", body: j.detail ?? j.error ?? "Try again in a moment.", tone: "bad" });
        return;
      }
      endAttempt(j.result);
      newChat(null);
      toast({ title: j.result.passed ? `Challenge complete: +${j.result.points} points` : "Not quite", body: j.result.passed ? c.title : "See what the arena saw.", tone: j.result.passed ? "ok" : "bad" }, 6000);
      openDialog({ kind: "result", slug: attempt.slug });
    } catch {
      toast({ title: "Network problem", body: "Your attempt is still running. Try Submit again.", tone: "bad" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line/70 px-3">
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="rounded-lg p-1.5 text-ink-2 hover:bg-bg-3" title="Open sidebar">
          <PanelLeft size={17} />
        </button>
      )}
      <div className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">{title}</div>
      <ThreadActions />

      {attempt && c ? (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openDialog({ kind: "brief", slug: attempt.slug })} title="Show the challenge brief" className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[13px] hover:bg-bg-2", over ? "border-bad/40 text-bad" : "border-line-2")}>
            <Swords size={14} className="text-clay" />
            <span className="max-w-[180px] truncate font-medium">{c.title}</span>
            <span className="tabular-nums text-ink-2">
              {fmtClock(elapsed)}
            </span>
          </button>
          <div className="relative">
            <button onClick={() => setHintOpen((v) => !v)} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-2 hover:bg-bg-3" title="Reveal a hint">
              <Lightbulb size={15} /> Hint {attempt.hintsUsed > 0 && <span className="text-ink-3">({attempt.hintsUsed})</span>}
            </button>
            {hintOpen && (
              <div className="fade-up absolute right-0 top-9 z-40 w-80 rounded-xl border border-line bg-bg p-3.5 shadow-lg shadow-black/10">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium">Hints</div>
                  <button onClick={() => setHintOpen(false)} className="rounded p-1 text-ink-3 hover:bg-bg-3">
                    <X size={13} />
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {c.hints.slice(0, attempt.hintsUsed).map((h, i) => (
                    <div key={i} className="rounded-lg bg-bg-2 px-3 py-2 text-[13px] text-ink-2">
                      <span className="mr-1 font-medium text-ink">{i + 1}.</span> {h.text}
                    </div>
                  ))}
                </div>
                {attempt.hintsUsed < c.hints.length ? (
                  <button onClick={useHint} className="mt-2.5 h-8 w-full rounded-lg border border-line-2 text-[13px] hover:bg-bg-2">
                    Reveal hint {attempt.hintsUsed + 1} of {c.hints.length} <span className="text-ink-3">(costs {Math.round(HINT_COST * 100)}% of the points)</span>
                  </button>
                ) : (
                  <div className="mt-2 text-[12.5px] text-ink-3">No more hints for this one.</div>
                )}
              </div>
            )}
          </div>
          <button onClick={submit} disabled={submitting} className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-medium text-bg hover:bg-black disabled:opacity-60">
            <Flag size={14} /> {submitting ? "Grading…" : "Submit"}
          </button>
          <button onClick={() => openDialog({ kind: "quit" })} className="rounded-lg p-1.5 text-ink-3 hover:bg-bg-3 hover:text-ink" title="Quit challenge">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openDialog({ kind: "leaderboard" })} className="flex h-8 items-center gap-1.5 rounded-lg border border-line-2 px-2.5 text-[13px] font-medium text-ink hover:bg-bg-2" title="Leaderboard">
            <Trophy size={14} className="text-clay" /> <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button onClick={() => openDialog({ kind: "challenges" })} className="flex h-8 items-center gap-1.5 rounded-lg bg-clay px-3 text-[13px] font-semibold text-white shadow-sm shadow-clay/30 hover:bg-clay-dark">
            <Swords size={14} /> Challenges
          </button>
          <button onClick={() => openDialog({ kind: "settings", section: "account" })} className="rounded-lg p-1.5 text-ink-2 hover:bg-bg-3" title="Your profile and settings">
            <Settings size={17} />
          </button>
        </div>
      )}
    </header>
  );
}


/** Add to project (any thread) and Save as skill (a Cowork thread that has run). */
function ThreadActions() {
  const chat = useStore((s) => s.chats.find((c) => c.id === s.activeChatId) ?? null);
  const projects = useStore((s) => s.projects);
  const skills = useStore((s) => s.skills);
  const [open, setOpen] = useState(false);
  if (!chat || chat.messages.length === 0) return null;
  const firstPrompt = chat.messages.find((m) => m.role === "user")?.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join(" ") ?? "";
  const canSkill = !!chat.cowork && firstPrompt.trim().length > 0;
  return (
    <div className="mr-1 flex items-center gap-1">
      {!chat.projectId && (
        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-2 hover:bg-bg-3" title="Add this chat to a project">
            <FolderPlus size={14} /> Add to project <ChevronDown size={12} className="text-ink-3" />
          </button>
          {open && (
            <div className="fade-up absolute right-0 top-9 z-40 w-60 rounded-xl border border-line bg-bg p-1 shadow-lg shadow-black/10" onMouseLeave={() => setOpen(false)}>
              {projects.length === 0 && <div className="px-2.5 py-2 text-[12.5px] text-ink-3">No projects yet.</div>}
              {projects.map((p) => (
                <button key={p.id} onClick={() => { setChatProject(chat.id, p.id); track("added_to_project", p.id); toast({ title: `Added to ${p.name}`, tone: "ok" }, 2500); setOpen(false); }} className="w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-bg-2">{p.name}</button>
              ))}
              <div className="my-1 border-t border-line" />
              <button onClick={() => { setOpen(false); openDialog({ kind: "new-project" }); }} className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:bg-bg-2">New project…</button>
            </div>
          )}
        </div>
      )}
      {canSkill && (
        <button
          onClick={() => {
            const base = chat.title.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "task";
            let name = base;
            let n = 2;
            while (skills.some((s) => s.name === name)) name = `${base}-${n++}`;
            createSkill({ name, description: `From a Cowork task: ${chat.title}`, prompt: firstPrompt });
            track("skill_from_cowork", name);
            toast({ title: `/${name} saved`, body: "Type it in any chat to run this task again.", tone: "ok" }, 4000);
          }}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-2 hover:bg-bg-3"
          title="Turn this Cowork task into a slash command"
        >
          <Zap size={14} /> Save as skill
        </button>
      )}
    </div>
  );
}
