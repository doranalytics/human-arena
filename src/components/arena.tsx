"use client";
import { useEffect } from "react";
import { useStore, hydrate, importResults, newChat } from "@/lib/store";
import { useUI, closeDialog, toast } from "@/lib/ui";
import { setSession } from "@/lib/session";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { ChatView } from "./chat-view";
import { ProjectView } from "./project-view";
import { Toasts } from "./toasts";
import { ChallengesDialog, BriefDialog } from "./dialogs/challenges";
import { ResultDialog } from "./dialogs/result";
import { LeaderboardDialog } from "./dialogs/leaderboard";
import { SettingsDialog } from "./dialogs/settings";
import { ConnectorsDialog } from "./dialogs/connectors";
import { SkillsDialog } from "./dialogs/skills";
import { NewProjectDialog } from "./dialogs/new-project";
import type { ArenaResult } from "@/lib/types";

export function Arena() {
  const hydrated = useStore((s) => s.hydrated);
  const activeChatId = useStore((s) => s.activeChatId);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const chat = useStore((s) => s.chats.find((c) => c.id === s.activeChatId) ?? null);
  const project = useStore((s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null);
  const dialog = useUI((s) => s.dialog);
  const sidebarOpen = useUI((s) => s.sidebarOpen);

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

  const title = chat ? (chat.projectId ? `${project?.name ?? "Project"} / ${chat.title}` : chat.title) : project ? project.name : "";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      {sidebarOpen && <Sidebar />}
      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!hydrated ? null : chat ? <ChatView key={chat.id} chat={chat} /> : project ? <ProjectView key={project.id} project={project} /> : null}
        </div>
      </main>
      <Toasts />
      <ChallengesDialog open={dialog?.kind === "challenges"} />
      {dialog?.kind === "brief" && <BriefDialog open slug={dialog.slug} />}
      {dialog?.kind === "result" && <ResultDialog open slug={dialog.slug} />}
      <LeaderboardDialog open={dialog?.kind === "leaderboard"} />
      <SettingsDialog open={dialog?.kind === "settings"} />
      <ConnectorsDialog open={dialog?.kind === "connectors"} />
      <SkillsDialog open={dialog?.kind === "skills"} />
      <NewProjectDialog open={dialog?.kind === "new-project"} />
      {dialog?.kind === "customize" && <SettingsDialog open />}
      <span hidden onClick={closeDialog} />
    </div>
  );
}
