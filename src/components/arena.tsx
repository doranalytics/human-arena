"use client";
import { useEffect } from "react";
import { useStore, hydrate, importResults, newChat } from "@/lib/store";
import { useUI, closeDialog, toast } from "@/lib/ui";
import { setSession } from "@/lib/session";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { ChatView } from "./chat-view";
import { ProjectView } from "./project-view";
import { ProjectsPage } from "./projects-page";
import { Toasts } from "./toasts";
import { ChallengesDialog, BriefDialog } from "./dialogs/challenges";
import { ResultDialog } from "./dialogs/result";
import { LeaderboardDialog } from "./dialogs/leaderboard";
import { SettingsDialog } from "./dialogs/settings";
import { NewProjectDialog } from "./dialogs/new-project";
import { QuitDialog } from "./dialogs/quit";
import type { ArenaResult } from "@/lib/types";

export function Arena() {
  const hydrated = useStore((s) => s.hydrated);
  const activeChatId = useStore((s) => s.activeChatId);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const chat = useStore((s) => s.chats.find((c) => c.id === s.activeChatId) ?? null);
  const project = useStore((s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null);
  const dialog = useUI((s) => s.dialog);
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const page = useUI((s) => s.page);

  useEffect(() => {
    hydrate();
    const u = new URL(window.location.href);
    if (u.searchParams.get("signed_in")) toast({ title: "Signed in", body: "Your scores now save to the board.", tone: "ok" });
    if (u.searchParams.get("auth_error")) toast({ title: "Sign-in failed", body: u.searchParams.get("auth_error") ?? undefined, tone: "bad" });
    if (u.search) window.history.replaceState({}, "", "/");
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j: { configured: boolean; member: { id: string; email: string; name: string } | null; results: ArenaResult[] }) => {
        setSession({ loaded: true, configured: j.configured, me: j.member });
        if (j.results?.length) importResults(j.results);
      })
      .catch(() => setSession({ loaded: true }));
  }, []);

  // A fresh visit lands on a blank chat, like the desktop app.
  useEffect(() => {
    if (hydrated && !activeChatId && !activeProjectId) newChat(null);
  }, [hydrated, activeChatId, activeProjectId]);

  const title = page === "projects" ? "Projects" : chat ? (chat.projectId ? `${project?.name ?? "Project"} / ${chat.title}` : chat.title) : project ? project.name : "";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg">
      <div className="flex h-8 shrink-0 items-center justify-center gap-2 bg-[#2c2b28] px-3 text-[12px] text-bg">
        <span className="font-serif text-[13px] font-semibold tracking-tight">Human Arena</span>
        <span className="text-bg/40">·</span>
        <span className="text-bg/80">Safe training environment. Nothing here is real, so click anything.</span>
      </div>
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && <Sidebar />}
        <main className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!hydrated ? null : page === "projects" ? <ProjectsPage /> : chat ? <ChatView key={chat.id} chat={chat} /> : project ? <ProjectView key={project.id} project={project} /> : null}
          </div>
        </main>
      </div>
      <Toasts />
      <ChallengesDialog open={dialog?.kind === "challenges"} />
      {dialog?.kind === "brief" && <BriefDialog open slug={dialog.slug} />}
      {dialog?.kind === "result" && <ResultDialog open slug={dialog.slug} />}
      <LeaderboardDialog open={dialog?.kind === "leaderboard"} />
      {dialog?.kind === "settings" && <SettingsDialog key={dialog.section ?? "general"} section={dialog.section ?? "general"} />}
      <NewProjectDialog open={dialog?.kind === "new-project"} />
      {dialog?.kind === "quit" && <QuitDialog />}
      <span hidden onClick={closeDialog} />
    </div>
  );
}
