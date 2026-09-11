"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type FileUIPart, type UIMessage, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { ArrowUp, Square } from "lucide-react";
import type { Chat } from "@/lib/types";
import { useStore, saveMessages, track, getState, addMemory, newChat, freeTurnsLeft, consumeFreeTurn, markCowork, clearPendingPrompt, setState, recordContext, setChatBusy, finishScheduleRun } from "@/lib/store";
import { Message } from "./message";
import { chatPreferences } from "@/lib/chat-preferences";
import { cn } from "@/lib/utils";
import { useLearning } from "@/lib/learning/client";
import { Composer, type ComposerSubmit } from "./composer";
import { Spark } from "./icons";
import { TOOL_CONNECTOR } from "@/lib/tool-connector";
import { BUILTIN_SKILLS } from "@/lib/skills";
import { getChallenge } from "@/lib/arena/challenges";
import { PracticeStage, PromptChips } from "./playground/practice-stage";
import { ChallengeStage, ChallengeStrip } from "./challenge-stage";
import { CoworkPanel } from "./cowork-panel";
import { toast } from "@/lib/ui";
import { useSession } from "@/lib/session";

function greeting(name: string) {
  const h = new Date().getHours();
  const first = name.split(/\s+/)[0];
  const opts = first
    ? [h < 12 ? `Good morning, ${first}` : h < 18 ? `Good afternoon, ${first}` : `Good evening, ${first}`, `Back at it, ${first}?`, `Ready to practice, ${first}?`]
    : ["Ready to practice?", "What are we working on?", "How can I help you today?"];
  return opts[Math.floor(Date.now() / 3600000) % opts.length];
}

async function toFileParts(files: File[]): Promise<FileUIPart[]> {
  return Promise.all(
    files.map(
      (f) =>
        new Promise<FileUIPart>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res({ type: "file", mediaType: f.type || (f.name.endsWith(".md") ? "text/markdown" : "application/octet-stream"), filename: f.name, url: String(r.result) });
          r.onerror = () => rej(r.error);
          r.readAsDataURL(f);
        }),
    ),
  );
}

export function ChatView({ chat }: { chat: Chat }) {
  const chatgpt = useLearning().surface === "chatgpt";
  const gpt = useStore((s) => s.gpts.find((g) => g.id === chat.gptId));
  const settings = useStore((s) => s.settings);
  const project = useStore((s) => (chat.projectId ? s.projects.find((p) => p.id === chat.projectId) ?? null : null));
  const customSkills = useStore((s) => s.skills);
  const session = useSession();
  const attempt = useStore((s) => s.attempt);
  const gameMode = useStore((s) => s.gameMode);
  const practicing = attempt?.mode === "playground";
  const challenge = attempt ? attempt.definition ?? getChallenge(attempt.slug) : null;
  const freeLeft = useStore((s) => freeTurnsLeft(s));
  const name = session.me?.name || settings.name;

  const transport = useMemo(() => new DefaultChatTransport<UIMessage>({ api: "/api/chat", body: () => getState().chats.find((c) => c.id === chat.id)?.request ?? {},
    prepareSendMessagesRequest: ({ messages, id, trigger, messageId, body }) => {
      const b = { ...(getState().chats.find((c) => c.id === id)?.request ?? {}), ...body };
      const lastUser = messages.findLast((m) => m.role === "user");
      if (lastUser && b.context) recordContext(id, { ...(b.context as import("@/lib/types").TurnContext), messageId: lastUser.id });
      return { body: { ...b, messages, id, trigger, messageId } };
    },
  }), [chat.id]);
  const { messages, sendMessage, status, stop, error, addToolOutput } = useChat({ id: chat.id, messages: chat.messages, transport, sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls });
  const busy = status === "submitted" || status === "streaming";
  const bottomRef = useRef<HTMLDivElement>(null);
  const trackedTools = useRef<Set<string>>(new Set(chat.messages.flatMap((m) => m.parts.filter(isToolUIPart).filter((p) => p.state === "output-available").map((p) => p.toolCallId))));
  const [webSearch, setWebSearch] = useState(chat.contexts?.at(-1)?.webSearch ?? false);
  const [research, setResearch] = useState(chat.contexts?.at(-1)?.research ?? false);
  const [cowork, setCowork] = useState(!!chat.cowork);
  const [chatMemoryOn, setMemoryOn] = useState(!chat.contexts?.at(-1)?.memoryOff);
  const memoryOn = chatMemoryOn && settings.memoryEnabled !== false;

  useEffect(() => {
    setChatBusy(chat.id, busy);
    return () => setChatBusy(chat.id, false);
  }, [chat.id, busy]);
  useEffect(() => {
    if (!busy && !error && messages.some((m) => m.role === "assistant" && m.parts.some((p) => p.type === "text" && p.text.trim()))) finishScheduleRun(chat.id);
  }, [busy, error, messages, chat.id]);

  // Persist and observe. Connector use is read off the assistant's tool parts.
  useEffect(() => {
    if (messages.length) saveMessages(chat.id, messages);
    if (getState().attempt && chat.attemptId !== getState().attempt?.id) return;
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const p of m.parts) {
        if (!isToolUIPart(p) || !("toolCallId" in p) || trackedTools.current.has(p.toolCallId)) continue;
        if (p.state !== "output-available") continue;
        trackedTools.current.add(p.toolCallId);
        if (p.output && typeof p.output === "object" && "error" in p.output) continue;
        const name = getToolName(p);
        const c = TOOL_CONNECTOR[name];
        if (c) track("connector_used", c);
        if (name === "read_link") track("link_read");
        if (name === "ask_user") track("ask_user_used");
        if (name === "send_email") track("email_sent");
        if (name === "remember") {
          const out = (p as { output?: { saved?: boolean; fact?: string } }).output;
          if (out?.saved && out.fact) {
            addMemory(out.fact, chat.projectId);
            track("memory_saved");
          }
        }
      }
    }
  }, [messages, chat.id, chat.projectId, chat.attemptId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const onSubmit = useCallback<ComposerSubmit>(
    async ({ text, files, skill, dictated }) => {
      const st = getState();
      if (st.grading || chat.closed || (st.attempt && chat.attemptId !== st.attempt.id)) return;
      setChatBusy(chat.id, true);
      let fileParts: FileUIPart[];
      try { fileParts = files.length ? await toFileParts(files) : []; } catch { setChatBusy(chat.id, false); toast({ title: "Could not read that file", tone: "bad" }); return; }
      for (const f of files) track(f.type.startsWith("image/") ? "image_attached" : "file_attached", f.name);
      if (webSearch) track("web_search_on");
      if (research) track("research_on");
      if (cowork) {
        track("cowork_on");
        markCowork(chat.id);
      }
      if (skill) track("skill_invoked", skill);
      if (dictated) track("dictation_used");
      track("message_sent");
      if (!st.attempt && st.gameMode === "arena") consumeFreeTurn();
      const sk = skill ? (BUILTIN_SKILLS.find((s) => s.name === skill) ?? customSkills.find((s) => s.name === skill)) : null;
      const context = {
        messageId: "", at: new Date().toISOString(), model: st.settings.model, webSearch, research, cowork,
        ...chatPreferences(st.settings, gpt, memoryOn, project?.memories), projectName: project?.name, projectId: project?.id, projectInstructions: project?.instructions,
        skill: sk?.name,
      };
      const requestBody = {
        model: context.model, effort: st.settings.effort, webSearch, research, cowork,
        approval: cowork ? (st.settings.coworkApproval ?? "auto") : undefined,
        connectors: st.connectors, skill: sk ? { name: sk.name, prompt: sk.prompt } : null,
        project: project ? { id: project.id, name: project.name, instructions: project.instructions, files: project.files.map((f) => ({ name: f.name, text: f.text })) } : null,
        userName: name, instructions: context.customInstructions, memories: context.memories, memoryOff: !memoryOn,
        context, attemptId: st.attempt?.serverId, challengeSlug: st.attempt?.mode === "playground" ? undefined : st.attempt?.slug,
      };
      setState((s) => ({ chats: s.chats.map((c) => c.id === chat.id ? { ...c, request: requestBody } : c) }));
      try { await sendMessage({ text, files: fileParts }); }
      catch { toast({ title: "Could not send", body: "Please try again.", tone: "bad" }); }
      finally { setChatBusy(chat.id, false); }
    },
    [sendMessage, webSearch, research, cowork, memoryOn, project, customSkills, gpt, name, chat.id, chat.attemptId, chat.closed],
  );

  // Scheduled runs open with a prompt to send on their own.
  const pendingSent = useRef(false);
  useEffect(() => {
    if (!chat.pendingPrompt || pendingSent.current) return;
    pendingSent.current = true;
    const prompt = chat.pendingPrompt;
    clearPendingPrompt(chat.id);
    void onSubmit({ text: prompt, files: [], skill: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id, chat.pendingPrompt]);

  const empty = messages.length === 0;
  const grading = useStore((s) => s.grading);
  const historical = !!attempt && chat.attemptId !== attempt.id;
  const composer = chat.closed || historical ? (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ok/40 bg-ok/[0.06] px-4 py-3 text-[13.5px]">
      <span>{historical ? "This saved thread belongs to a different session." : "This session is complete. Your thread is saved."}</span>
      <button onClick={() => newChat(null)} className="rounded-lg bg-ink px-3 py-1.5 text-[13px] font-medium text-bg hover:bg-black">New chat</button>
    </div>
  ) : (
    <Composer onSubmit={onSubmit} busy={busy} grading={grading} onStop={stop} webSearch={webSearch} setWebSearch={setWebSearch} research={research} setResearch={setResearch} cowork={cowork} setCowork={setCowork} memoryOn={memoryOn} setMemoryOn={(v) => { setMemoryOn(v); if (!v) track("memory_off"); }} projectName={project?.name ?? null} locked={gameMode === "arena" && !attempt && freeLeft <= 0} freeLeft={gameMode === "playground" || attempt ? null : freeLeft} clearOn={attempt?.id ?? "none"} menusDown={messages.length === 0 && !chatgpt} />
  );

  if (empty && attempt && challenge)
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-6 md:px-6 md:py-8">
        {practicing ? <PracticeStage /> : <ChallengeStage c={challenge} attempt={attempt} />}
        <div className="mt-5 w-full max-w-[760px]">{attempt?.slug === "practice-prompting" && <PromptChips disabled={busy} />}{composer}{cowork && <CoworkPanel chat={chat} />}</div>
      </div>
    );

  if (empty)
    return (
      <div className={cn("flex min-h-full flex-col items-center px-4 py-8 md:px-6", chatgpt ? "justify-end" : "justify-center md:pb-24")}>
        <div className={cn("mb-6 flex max-w-full items-center gap-3 text-clay md:mb-8", chatgpt && "my-auto py-12 md:my-auto")}>
          {!chatgpt && <Spark size={30} className="spark-in shrink-0" />}
          <h1 className="min-w-0 break-words font-serif text-[30px] font-normal leading-tight tracking-tight text-ink md:text-[40px]">{gpt?.name ?? (chatgpt ? "What can I help with?" : greeting(name))}</h1>
        </div>
        <div className="w-full max-w-[760px]">{composer}</div>
        {cowork ? <CoworkPanel chat={chat} /> : project && <div className="mt-3 text-[12.5px] text-ink-3">In project {project.name}. Its instructions apply to this chat.</div>}

      </div>
    );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      {attempt && challenge && (practicing ? <PracticeStage compact /> : <ChallengeStrip c={challenge} attempt={attempt} />)}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[760px] space-y-6 px-4 py-5 md:space-y-7 md:px-6 md:py-8">
          {messages.map((m, i) => (
            <Message key={m.id} m={m} onExport={() => track("exported", undefined, chat.id)} onToolOutput={(toolCallId, output) => addToolOutput({ tool: "ask_user", toolCallId, output })} streaming={busy && i === messages.length - 1 && m.role === "assistant"} />
          ))}
          {busy && messages[messages.length - 1]?.role === "user" && <Message m={{ id: "pending", role: "assistant", parts: [] }} streaming />}
          {error && <div className="rounded-lg border border-bad/30 bg-red-50 px-3 py-2 text-[13px] text-bad">Something went wrong: {error.message}</div>}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[760px] shrink-0 px-3 pb-3 md:px-6 md:pb-4">
        {attempt?.slug === "practice-prompting" && <PromptChips disabled={busy} />}
        {composer}
        {cowork && !chat.closed && <CoworkPanel chat={chat} compact />}
      </div>
    </div>
  );
}

export function StopOrSend({ busy, canSend, onStop }: { busy: boolean; canSend: boolean; onStop: () => void }) {
  if (busy)
    return (
      <button type="button" onClick={onStop} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-bg md:h-8 md:w-8" title="Stop">
        <Square size={12} fill="currentColor" />
      </button>
    );
  return (
    <button type="submit" disabled={!canSend} className="flex h-10 w-10 items-center justify-center rounded-full bg-clay text-white transition disabled:bg-bg-3 disabled:text-ink-3 md:h-8 md:w-8" title="Send">
      <ArrowUp size={16} strokeWidth={2.5} />
    </button>
  );
}
