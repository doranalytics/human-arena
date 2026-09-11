"use client";
import { useState } from "react";
import { useElapsed } from "@/lib/use-elapsed";
import { PanelLeft, Swords, Trophy, Lightbulb, Flag, X, FolderPlus, Zap, ChevronDown, Compass, Check } from "lucide-react";
import { useStore, useHint, endAttempt, attemptChats, getState, setChatProject, createSkill, track, setState, finishPractice } from "@/lib/store";
import { openDialog, toggleSidebar, useUI, toast, setPage, setPracticeHints } from "@/lib/ui";
import { getChallenge } from "@/lib/arena/challenges";
import { getPractice, practiceChecks } from "@/lib/playground";
import { HINT_COST } from "@/lib/arena/types";
import { fmtClock, cn } from "@/lib/utils";
import type { ArenaResult } from "@/lib/types";
import { setSession } from "@/lib/session";
import type { PracticeSummary } from "@/lib/practice";
import { ModeSwitch } from "./mode-switch";

export function TopBar({ title }: { title: string }) {
  const state = useStore((s) => s);
  const page = useUI((s) => s.page);
  const attempt = state.attempt;
  const activeChat = state.chats.find((chat) => chat.id === state.activeChatId);
  const practice = attempt?.mode === "playground" ? getPractice(attempt.slug) : activeChat?.practiceSlug ? getPractice(activeChat.practiceSlug) : null;
  const ready = !!practice && !!attempt && practiceChecks(practice, attempt.events, state).every((c) => c.pass);
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const mobileSidebarOpen = useUI((s) => s.mobileSidebarOpen);
  const hints = useUI((s) => s.practiceHints);
  const c = attempt ? attempt.definition ?? getChallenge(attempt.slug) : null;
  const elapsed = useElapsed(attempt && !practice ? attempt.startedAt : undefined);
  const [hintOpen, setHintOpen] = useState(false), [submitting, setSubmitting] = useState(false);
  const busy = state.busyChatIds.length > 0 || state.grading;
  async function submit() {
    if (!attempt || !c || practice || submitting || busy || state.gameMode !== "arena") return;
    setSubmitting(true); setState({ grading: true });
    const st = getState();
    try {
      const r = await fetch("/api/arena/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: attempt.slug, serverId: attempt.serverId ?? null, startedAt: attempt.startedAt, hintsUsed: attempt.hintsUsed, events: attempt.events, chats: attemptChats(), version: attempt.version, workspace: { projects: st.projects, skills: st.skills, groups: st.groups, schedules: st.schedules } }) });
      const j = await r.json() as { result?: ArenaResult; practice?: PracticeSummary | null; error?: string; detail?: string };
      if (!r.ok || !j.result) { toast({ title: "Could not grade that", body: j.detail ?? j.error ?? "Try again in a moment.", tone: "bad" }); return; }
      if (!endAttempt(j.result, attempt.id)) return;
      setSession({ practice: j.practice }); setPage("learning"); openDialog({ kind: "result", slug: attempt.slug });
    } catch { toast({ title: "Network problem", body: "Your attempt is still running. Try Submit again.", tone: "bad" }); }
    finally { setSubmitting(false); if (getState().attempt?.id === attempt.id) setState({ grading: false }); }
  }
  return <header className={cn("games-topbar flex shrink-0 flex-wrap items-center gap-2 border-b border-line/70 px-2 py-2 md:px-3", practice && "min-h-12 py-1.5")}>
    <button data-guide="navigation" onClick={toggleSidebar} className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-bg-3 md:h-9 md:w-9", sidebarOpen && "md:hidden")} title="Open sidebar" aria-expanded={mobileSidebarOpen} aria-controls="mobile-navigation"><PanelLeft size={18} /></button>
    {!practice && <ModeSwitch />}
    <div className={cn("hidden min-w-0 flex-1 truncate px-2 text-[13px] text-ink-3 lg:block", practice && "lg:hidden")}>{title}</div>
    <div className="ml-auto flex items-center gap-1.5">
      {state.gameMode === "arena" && <button onClick={() => openDialog({ kind: "leaderboard" })} className="flex h-10 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[13px] hover:bg-bg-2" title="Leaderboard"><Trophy size={15} className="text-clay" /><span className="hidden sm:inline">Leaderboard</span></button>}
      {!attempt && !practice && <button onClick={() => state.gameMode === "arena" ? openDialog({ kind: "challenges" }) : setPage("learning")} className="flex h-10 items-center gap-1.5 rounded-lg bg-clay px-2.5 text-[13px] font-medium text-white">{state.gameMode === "arena" ? <Swords size={15} /> : <Compass size={15} />}<span className="hidden sm:inline">{state.gameMode === "arena" ? "Challenges" : "Exercises"}</span><span className="sr-only sm:hidden">{state.gameMode === "arena" ? "Challenges" : "Exercises"}</span></button>}
    </div>
    {attempt && c && <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5", practice ? "ml-auto" : "w-full border-t border-line/60 pt-2")}>
      {!practice && <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{c.title}</span>}
      {practice ? <>
        <button onClick={() => setPracticeHints(!hints)} aria-pressed={hints} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-bg-3", hints && "bg-bg-3 text-clay-dark")} title={hints ? "Hide pointers" : "Show pointers"}><Lightbulb size={15} /><span className="sr-only">Pointers</span></button>
        <button disabled={!ready || busy} title={ready ? "Save this practice as completed" : "Complete the practice first"} onClick={() => { if (finishPractice()) { setPage("learning"); toast({ title: "Practice complete", body: "Your progress is saved.", tone: "ok" }); } }} className="flex h-9 items-center gap-1.5 rounded-lg bg-ink px-2.5 text-[11.5px] font-medium text-bg disabled:opacity-40"><Check size={14} /> Finish</button>
        <button disabled={busy} onClick={() => { endAttempt(); setPage("learning"); }} title="Leave practice" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-3 hover:bg-bg-3"><X size={16} /></button>
      </> : <>
        <span className="px-2 text-sm tabular-nums text-clay-dark" aria-label="Elapsed time">{fmtClock(elapsed)}</span>
        <div className="relative"><button onClick={() => setHintOpen(!hintOpen)} title="Reveal a hint" className="flex h-10 items-center gap-1 rounded-lg px-2 text-xs text-ink-2 hover:bg-bg-3"><Lightbulb size={15} /><span className="hidden sm:inline">Hint</span></button>
          {hintOpen && <div className="mobile-popover absolute right-0 top-full z-40 w-72 rounded-xl border border-line bg-bg p-4 shadow-lg"><div className="flex items-center justify-between text-sm font-medium">Hints<button aria-label="Close hints" onClick={() => setHintOpen(false)} className="p-2"><X size={14} /></button></div>{c.hints.slice(0, attempt.hintsUsed).map((h, i) => <p key={i} className="mt-2 text-sm text-ink-2">{h.text}</p>)}{attempt.hintsUsed < c.hints.length ? <button onClick={useHint} className="mt-3 min-h-10 rounded-lg border border-line px-3 text-xs">Reveal hint · costs {Math.round(HINT_COST * 100)}% of points</button> : <p className="mt-2 text-xs text-ink-3">No more hints.</p>}</div>}
        </div>
        <button onClick={() => void submit()} disabled={submitting || busy} className="flex h-10 items-center gap-1.5 rounded-lg bg-clay px-3 text-xs font-medium text-white disabled:opacity-50"><Flag size={14} />{submitting ? "Grading…" : "Submit"}</button>
        <button disabled={submitting || busy} onClick={() => openDialog({ kind: "quit" })} title="Quit challenge" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-3 hover:bg-bg-3"><X size={16} /></button>
      </>}
    </div>}
    {!page && !practice && <ThreadActions />}
  </header>;
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
          data-guide="save-skill" title="Turn this Cowork task into a slash command"
        >
          <Zap size={16} /> <span className="hidden md:inline">Save as skill</span>
        </button>
      )}
    </div>
  );
}
