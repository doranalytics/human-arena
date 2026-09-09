"use client";
import { useState } from "react";
import { useElapsed } from "@/lib/use-elapsed";
import { PanelLeft, Swords, Trophy, Settings, Lightbulb, Flag, X, FolderPlus, Zap, ChevronDown } from "lucide-react";
import { useStore, useHint, endAttempt, attemptChats, getState, newChat, setChatProject, createSkill, track, setState } from "@/lib/store";
import { openDialog, toggleSidebar, useUI, toast } from "@/lib/ui";
import { getChallenge } from "@/lib/arena/challenges";
import { HINT_COST } from "@/lib/arena/types";
import { fmtClock, cn } from "@/lib/utils";
import type { ArenaResult } from "@/lib/types";
import { ChallengePointer } from "./challenge-pointer";
import { setSession } from "@/lib/session";
import type { PracticeSummary } from "@/lib/practice";

export function TopBar({ title }: { title: string }) {
  const savedAttempt = useStore((s) => s.attempt);
  const page = useUI((s) => s.page);
  const attempt = page === "learning" ? null : savedAttempt;
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const mobileSidebarOpen = useUI((s) => s.mobileSidebarOpen);
  const c = attempt ? attempt.definition ?? getChallenge(attempt.slug) : null;
  const elapsed = useElapsed(attempt?.startedAt);
  const [hintOpen, setHintOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = useStore((s) => s.busyChatIds.length > 0);

  async function submit() {
    if (!attempt || !c || submitting || busy) return;
    setSubmitting(true);
    setState({ grading: true });
    const st = getState();
    const chats = attemptChats();
    try {
      const r = await fetch("/api/arena/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: attempt.slug, serverId: attempt.serverId ?? null, startedAt: attempt.startedAt, hintsUsed: attempt.hintsUsed, events: attempt.events, chats, version: attempt.version, workspace: { projects: st.projects, skills: st.skills, groups: st.groups, schedules: st.schedules } }),
      });
      const j = (await r.json()) as { result?: ArenaResult; practice?: PracticeSummary | null; error?: string; detail?: string };
      if (!r.ok || !j.result) {
        toast({ title: "Could not grade that", body: j.detail ?? j.error ?? "Try again in a moment.", tone: "bad" });
        return;
      }
      if (!endAttempt(j.result, attempt.id)) return;
      setSession({ practice: j.practice });
      newChat(null);
      openDialog({ kind: "result", slug: attempt.slug });
    } catch {
      toast({ title: "Network problem", body: "Your attempt is still running. Try Submit again.", tone: "bad" });
    } finally {
      setSubmitting(false);
      if (getState().attempt?.id === attempt.id) setState({ grading: false });
    }
  }

  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-1.5 border-b border-line/70 px-2 py-1 xl:h-12 xl:flex-nowrap md:gap-2 md:px-3 xl:py-0">
        <button onClick={toggleSidebar} className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-bg-3 md:h-auto md:w-auto md:p-1.5", sidebarOpen && "md:hidden")} title="Open sidebar" aria-expanded={mobileSidebarOpen} aria-controls="mobile-navigation">
          <PanelLeft size={17} />
        </button>
      <div className="min-w-0 flex-1 basis-0 truncate text-[13.5px] text-ink-2">{title}</div>
      {!page && <ThreadActions />}

      {attempt && c ? (
        <div className="order-last flex w-full min-w-0 items-center gap-1.5 pb-1 xl:order-none xl:w-auto xl:pb-0">
          <button onClick={() => openDialog({ kind: "brief", slug: attempt.slug })} title="Show the challenge brief" className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line-2 px-2.5 py-1 text-[13px] hover:bg-bg-2 md:h-auto md:flex-none">
            <Swords size={14} className="shrink-0 text-clay" />
            <span className="truncate font-medium md:max-w-[180px]">{c.title}</span>
            <span className="ml-auto shrink-0 tabular-nums text-ink-2">
              {fmtClock(elapsed)}
            </span>
          </button>
          <div className="relative">
            <button onClick={() => setHintOpen((v) => !v)} className="flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-2 hover:bg-bg-3 md:h-8" title="Reveal a hint">
              <Lightbulb size={15} /> <span className="sr-only sm:not-sr-only">Hint</span> {attempt.hintsUsed > 0 && <span className="text-ink-3">({attempt.hintsUsed})</span>}
            </button>
            {hintOpen && (
              <div className="mobile-popover fade-up absolute right-0 top-9 z-40 w-80 rounded-xl border border-line bg-bg p-3.5 shadow-lg shadow-black/10">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium">Hints</div>
                  <button onClick={() => setHintOpen(false)} aria-label="Close hints" className="rounded p-2 text-ink-3 hover:bg-bg-3 md:p-1">
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
          <button onClick={submit} disabled={submitting || busy} className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-medium text-bg hover:bg-black disabled:opacity-60 md:h-8">
            <Flag size={14} /> {submitting ? "Grading…" : "Submit"}
          </button>
          <button disabled={submitting} onClick={() => openDialog({ kind: "quit" })} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-bg-3 hover:text-ink md:h-auto md:w-auto md:p-1.5" title="Quit challenge">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={() => openDialog({ kind: "leaderboard" })} className="flex h-10 items-center gap-1.5 rounded-lg border border-line-2 px-2.5 text-[13px] font-medium text-ink hover:bg-bg-2 md:h-8" title="Leaderboard">
            <Trophy size={14} className="text-clay" /> <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <div className="relative">
          <button onClick={() => openDialog({ kind: "challenges" })} className="flex h-10 items-center gap-1.5 rounded-lg bg-clay px-3 text-[13px] font-semibold text-white shadow-sm shadow-clay/30 hover:bg-clay-dark md:h-8">
            <Swords size={14} /> Challenges
          </button>
          <ChallengePointer />
          </div>
          <button onClick={() => openDialog({ kind: "settings", section: "account" })} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-2 hover:bg-bg-3 md:h-auto md:w-auto md:p-1.5" title="Your profile and settings">
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
  const busy = useStore((s) => s.busyChatIds.includes(chat?.id ?? ""));
  const [open, setOpen] = useState(false);
  if (!chat || chat.messages.length === 0) return null;
  const firstPrompt = chat.messages.filter((m) => m.role === "user").flatMap((m) => m.parts.filter((p) => p.type === "text").map((p) => p.text)).join("\n\n");
  const canSkill = !!chat.cowork && !busy && chat.messages.some((m) => m.role === "assistant") && firstPrompt.trim().length > 0;
  return (
    <div className="mr-1 flex shrink-0 items-center gap-1">
      {!chat.projectId && (
        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="flex h-10 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-2 hover:bg-bg-3 md:h-8" title="Add this chat to a project">
            <FolderPlus size={16} /> <span className="hidden md:inline">Add to project</span> <ChevronDown size={12} className="hidden text-ink-3 md:inline" />
          </button>
          {open && (
            <div className="mobile-popover fade-up absolute right-0 top-9 z-40 w-60 rounded-xl border border-line bg-bg p-1 shadow-lg shadow-black/10" onMouseLeave={() => setOpen(false)}>
              <button onClick={() => setOpen(false)} className="ml-auto flex h-10 items-center px-3 text-[13px] md:hidden">Close</button>
              {projects.length === 0 && <div className="px-2.5 py-2 text-[12.5px] text-ink-3">No projects yet.</div>}
              {projects.map((p) => (
                <button key={p.id} onClick={() => { setChatProject(chat.id, p.id); track("added_to_project", p.id); toast({ title: `Added to ${p.name}`, tone: "ok" }, 2500); setOpen(false); }} className="w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-bg-2">{p.name}</button>
              ))}
              <div className="my-1 border-t border-line" />
              <button onClick={() => { setOpen(false); openDialog({ kind: "new-project", chatId: chat.id }); }} className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:bg-bg-2">New project…</button>
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
          className="flex h-10 items-center gap-1.5 rounded-lg px-2 text-[12.5px] text-ink-2 hover:bg-bg-3 md:h-8"
          title="Turn this Cowork task into a slash command"
        >
          <Zap size={16} /> <span className="hidden md:inline">Save as skill</span>
        </button>
      )}
    </div>
  );
}
