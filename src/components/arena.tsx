"use client";
import { useEffect } from "react";
import { useStore, hydrate, newChat } from "@/lib/store";
import { Logo } from "./icons";
import { UpdateBar } from "./update-bar";
import { useUI, closeDialog, openDialog, toast } from "@/lib/ui";
import { useSession, refreshSession, refreshPractice, setSession } from "@/lib/session";
import { practiceDate } from "@/lib/practice";
import { OLD_LINK_NOTICE } from "@/lib/email-auth";
import { TESTING_MODE } from "@/lib/testing-mode";
import { ONBOARDING_VERSION } from "@/lib/onboarding";
import { Sidebar } from "./sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { useMobileViewport } from "@/lib/use-mobile-viewport";
import { TopBar } from "./topbar";
import { ChatView } from "./chat-view";
import { ProjectView } from "./project-view";
import { ProjectsPage } from "./projects-page";
import { ScheduledPage } from "./scheduled-page";
import { GPTsPage } from "./gpts-page";
import { LibraryPage } from "./library-page";
import { Toasts } from "./toasts";
import { ChallengesDialog, BriefDialog } from "./dialogs/challenges";
import { ResultDialog } from "./dialogs/result";
import { LeaderboardDialog } from "./dialogs/leaderboard";
import { SettingsDialog } from "./dialogs/settings";
import { NewProjectDialog } from "./dialogs/new-project";
import { QuitDialog } from "./dialogs/quit";
import { LearningOnboarding } from "./learning/onboarding";
import { LearningHome } from "./learning/home";
import { loadLearning, useLearning } from "@/lib/learning/client";
import { setPage } from "@/lib/ui";

export function Arena() {
  useMobileViewport();
  const session = useSession();
  const learning = useLearning();
  const memberId = session.me?.id;
  useEffect(() => { if(memberId) { void loadLearning(); setPage("learning"); } }, [memberId]);
  const hydrated = useStore((s) => s.hydrated);
  const activeChatId = useStore((s) => s.activeChatId);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const chat = useStore((s) => s.chats.find((c) => c.id === s.activeChatId) ?? null);
  const project = useStore((s) => s.projects.find((p) => p.id === s.activeProjectId) ?? null);
  const dialog = useUI((s) => s.dialog);
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const mobileSidebarOpen = useUI((s) => s.mobileSidebarOpen);
  const page = useUI((s) => s.page);
  const needsOnboarding = hydrated && session.loaded && !!session.me && (dialog?.kind === "onboarding" || !session.onboardedAt || (session.onboardingVersion ?? 0) < ONBOARDING_VERSION);

  useEffect(() => {
    hydrate();
    const u = new URL(window.location.href);
    if (u.searchParams.get("onboarding") === "restart") openDialog({ kind: "onboarding", restart: true });
    if (!TESTING_MODE && u.searchParams.get("signed_in")) toast({ title: "Email confirmed", body: "Your account is ready.", tone: "ok" });
    if (!TESTING_MODE && (u.searchParams.has("auth_error") || window.location.hash.includes("error="))) setSession({ authNotice: OLD_LINK_NOTICE });
    if (u.search || u.hash) window.history.replaceState({}, "", "/");
    void refreshSession().catch(() => {});
  }, []);

  useEffect(() => {
    if (!session.me) return;
    const refresh = () => { if (document.visibilityState === "visible") void refreshPractice(); };
    const timer = window.setInterval(() => {
      if (!session.practice || practiceDate(new Date(), session.practice.timezone) !== session.practice.today) refresh();
    }, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [session.me, session.practice]);

  // Only create a chat after the learner deliberately enters the chat workspace.
  useEffect(() => {
    if (!hydrated || !session.loaded || !session.me || page !== null) return;
    if ((!activeChatId && !activeProjectId) || (activeChatId && !chat)) newChat(null);
  }, [hydrated, session.loaded, session.me, page, activeChatId, activeProjectId, chat]);

  const title = page === "projects" ? "Projects" : page === "scheduled" ? "Scheduled" : chat ? (chat.projectId ? `${project?.name ?? "Project"} / ${chat.title}` : chat.title) : project ? project.name : "";

  return (
    <div data-surface={learning.surface} className="app-shell flex h-full w-full flex-col overflow-hidden bg-bg">
      <div className="relative flex h-8 shrink-0 items-center justify-center gap-2 overflow-hidden bg-[#2c2b28] px-3 text-[12px] text-bg">
        <Logo size={17} />
        <span className="shrink-0 font-serif text-[13px] font-semibold tracking-tight">How to AI Games</span>
        <span className="hidden text-bg/40 sm:inline">·</span>
        <span className="hidden text-bg/80 sm:inline">Safe training environment</span>
      </div>
      <UpdateBar />
      {TESTING_MODE && session.error && <div role="alert" className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-b border-line bg-bg-2 px-4 py-3 text-[13px]">
        <span>{session.error}</span><button onClick={() => void refreshSession().catch(() => {})} className="min-h-10 rounded-lg border border-line-2 px-3 font-medium hover:bg-bg-3">Retry connection</button>
      </div>}
      <div inert={needsOnboarding || !session.loaded || (TESTING_MODE && !session.me)} className="flex min-h-0 flex-1">
        {sidebarOpen && <div className="hidden h-full md:block"><Sidebar /></div>}
        <MobileNavigation />
        <main inert={mobileSidebarOpen} className="flex min-w-0 flex-1 flex-col">
          <TopBar title={page === "learning" ? `${learning.surface === "chatgpt" ? "ChatGPT" : "Claude"} · Learning workspace` : title} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!hydrated ? null : page === "learning" ? <LearningHome /> : page === "library" ? <LibraryPage /> : page === "gpts" ? <GPTsPage /> : page === "projects" ? <ProjectsPage /> : page === "scheduled" ? <ScheduledPage /> : chat ? <ChatView key={chat.id} chat={chat} /> : project ? <ProjectView key={project.id} project={project} /> : null}
          </div>
        </main>
      </div>
      <Toasts />
      {!needsOnboarding && <>
      <ChallengesDialog open={dialog?.kind === "challenges"} />
      {dialog?.kind === "brief" && <BriefDialog open slug={dialog.slug} />}
      {dialog?.kind === "result" && <ResultDialog open slug={dialog.slug} />}
      {dialog?.kind === "leaderboard" && <LeaderboardDialog open initialTab={dialog.tab} />}
      {dialog?.kind === "settings" && <SettingsDialog key={dialog.section ?? "general"} section={dialog.section ?? "general"} />}
      <NewProjectDialog open={dialog?.kind === "new-project"} chatId={dialog?.kind === "new-project" ? dialog.chatId : undefined} />
      {dialog?.kind === "quit" && <QuitDialog />}
      </>}
      {needsOnboarding && <LearningOnboarding replay={dialog?.kind === "onboarding"} restart={dialog?.kind === "onboarding" && dialog.restart} />}
      <span hidden onClick={closeDialog} />
    </div>
  );
}
