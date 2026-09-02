"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type FileUIPart, type UIMessage } from "ai";
import { ArrowUp, Square } from "lucide-react";
import type { Chat } from "@/lib/types";
import { useStore, saveMessages, track, getState, addMemory } from "@/lib/store";
import { Message } from "./message";
import { Composer, type ComposerSubmit } from "./composer";
import { Spark } from "./icons";
import { TOOL_CONNECTOR } from "@/lib/tool-connector";
import { BUILTIN_SKILLS } from "@/lib/skills";
import { useSession } from "@/lib/session";

function greeting(name: string) {
  const h = new Date().getHours();
  const first = name.split(/\s+/)[0];
  const opts = first
    ? [h < 12 ? `Good morning, ${first}` : h < 18 ? `Good afternoon, ${first}` : `Good evening, ${first}`, `Back at it, ${first}?`, `Coffee and Claude time, ${first}?`]
    : ["Coffee and Claude time?", "What are we working on?", "How can I help you today?"];
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
  const settings = useStore((s) => s.settings);
  const project = useStore((s) => (chat.projectId ? s.projects.find((p) => p.id === chat.projectId) ?? null : null));
  const customSkills = useStore((s) => s.skills);
  const session = useSession();
  const name = session.me?.name || settings.name;

  const transport = useMemo(() => new DefaultChatTransport<UIMessage>({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({ id: chat.id, messages: chat.messages, transport });
  const busy = status === "submitted" || status === "streaming";
  const bottomRef = useRef<HTMLDivElement>(null);
  const trackedTools = useRef<Set<string>>(new Set());
  const [webSearch, setWebSearch] = useState(false);
  const [research, setResearch] = useState(false);

  // Persist and observe. Connector use is read off the assistant's tool parts.
  useEffect(() => {
    if (messages.length) saveMessages(chat.id, messages);
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const p of m.parts) {
        if (!isToolUIPart(p) || !("toolCallId" in p) || trackedTools.current.has(p.toolCallId)) continue;
        if (p.state !== "output-available") continue;
        trackedTools.current.add(p.toolCallId);
        const name = getToolName(p);
        const c = TOOL_CONNECTOR[name];
        if (c) track("connector_used", c);
        if (name === "read_link") track("link_read");
        if (name === "remember") {
          const out = (p as { output?: { saved?: boolean; fact?: string } }).output;
          if (out?.saved && out.fact) {
            addMemory(out.fact);
            track("memory_saved");
          }
        }
      }
    }
  }, [messages, chat.id]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const onSubmit = useCallback<ComposerSubmit>(
    async ({ text, files, skill }) => {
      const st = getState();
      const fileParts = files.length ? await toFileParts(files) : [];
      for (const f of files) track(f.type.startsWith("image/") ? "image_attached" : "file_attached", f.name);
      if (webSearch) track("web_search_on");
      if (research) track("research_on");
      if (skill) track("skill_invoked", skill);
      track("message_sent");
      const sk = skill ? (BUILTIN_SKILLS.find((s) => s.name === skill) ?? customSkills.find((s) => s.name === skill)) : null;
      await sendMessage(
        { text, files: fileParts },
        {
          body: {
            model: st.settings.model,
            effort: st.settings.effort,
            webSearch,
            research,
            connectors: st.connectors,
            skill: sk ? { name: sk.name, prompt: sk.prompt } : null,
            project: project ? { name: project.name, instructions: project.instructions, files: project.files.map((f) => ({ name: f.name, text: f.text })) } : null,
            userName: name,
            instructions: st.settings.instructions ?? "",
            memories: st.settings.memories ?? [],
          },
        },
      );
    },
    [sendMessage, webSearch, research, project, customSkills, name],
  );

  const empty = messages.length === 0;
  const composer = (
    <Composer onSubmit={onSubmit} busy={busy} onStop={stop} webSearch={webSearch} setWebSearch={setWebSearch} research={research} setResearch={setResearch} projectName={project?.name ?? null} />
  );

  if (empty)
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 pb-24">
        <div className="mb-8 flex items-center gap-3 text-clay">
          <Spark size={30} />
          <h1 className="font-serif text-[40px] font-normal tracking-tight text-ink">{greeting(name)}</h1>
        </div>
        <div className="w-full max-w-[760px]">{composer}</div>
        {project && <div className="mt-3 text-[12.5px] text-ink-3">In project {project.name}. Its instructions apply to this chat.</div>}
        <div className="mt-6 text-[12.5px] text-ink-3">
          Playing as yourself at Halden Outdoor Co. Press <span className="text-ink-2">/</span> for skills, <span className="text-ink-2">+</span> for files and tools.
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] space-y-7 px-6 pb-8 pt-8">
          {messages.map((m, i) => (
            <Message key={m.id} m={m} streaming={busy && i === messages.length - 1 && m.role === "assistant"} />
          ))}
          {busy && messages[messages.length - 1]?.role === "user" && <Message m={{ id: "pending", role: "assistant", parts: [] }} streaming />}
          {error && <div className="rounded-lg border border-bad/30 bg-red-50 px-3 py-2 text-[13px] text-bad">Something went wrong: {error.message}</div>}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[760px] px-6 pb-4">
        {composer}
        <div className="pt-2 text-center text-[11.5px] text-ink-3">Human Arena is a training environment. Nothing here is real, so click anything.</div>
      </div>
    </div>
  );
}

export function StopOrSend({ busy, canSend, onStop }: { busy: boolean; canSend: boolean; onStop: () => void }) {
  if (busy)
    return (
      <button type="button" onClick={onStop} className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bg" title="Stop">
        <Square size={12} fill="currentColor" />
      </button>
    );
  return (
    <button type="submit" disabled={!canSend} className="flex h-8 w-8 items-center justify-center rounded-full bg-clay text-white transition disabled:bg-bg-3 disabled:text-ink-3" title="Send">
      <ArrowUp size={16} strokeWidth={2.5} />
    </button>
  );
}
