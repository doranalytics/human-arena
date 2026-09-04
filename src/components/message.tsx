"use client";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { FileText, Globe, Loader2, ListChecks, Copy, Download } from "lucide-react";
import { useState } from "react";
import { Spark } from "./icons";
import { TOOL_CONNECTOR } from "@/lib/tool-connector";
import { ConnectorLogo } from "./connector-logos";

const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noreferrer" /> }}>
        {text}
      </ReactMarkdown>
    </div>
  );
});

const TOOL_LABEL: Record<string, string> = {
  web_search: "Searched the web",
  search_gmail: "Searched Gmail",
  read_email: "Read an email",
  search_drive: "Searched Drive",
  read_drive_file: "Read a Drive file",
  list_tables: "Listed warehouse tables",
  read_table: "Read a warehouse table",
  list_events: "Checked the calendar",
  read_link: "Read a link",
  send_email: "Sent an email",
  ask_user: "Asked you",
  remember: "Saved to memory",
};
function ToolIcon({ name }: { name: string }) {
  const c = TOOL_CONNECTOR[name];
  const cls = "shrink-0";
  if (name === "web_search") return <Globe size={13} className={cls} />;
  if (c) return <ConnectorLogo id={c} size={14} />;
  return <FileText size={13} className={cls} />;
}

function toolSummary(name: string, input: unknown): string {
  const i = (input ?? {}) as Record<string, unknown>;
  if (typeof i.query === "string" && i.query) return `“${i.query}”`;
  if (typeof i.url === "string") return i.url.replace(/^https?:\/\//, "").slice(0, 60);
  if (typeof i.fact === "string") return `“${i.fact.slice(0, 60)}”`;
  if (typeof i.subject === "string") return `“${i.subject.slice(0, 60)}”`;
  if (typeof i.table === "string") return i.table + (i.contains ? ` · ${i.contains}` : "");
  if (typeof i.id === "string") return i.id;
  return "";
}

export function Message({ m, streaming, onToolOutput, onExport }: { m: UIMessage; streaming?: boolean; onToolOutput?: (toolCallId: string, output: string) => void; onExport?: () => void }) {
  if (m.role === "user") {
    const files = m.parts.filter((p) => p.type === "file");
    const text = m.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    return (
      <div className="fade-up flex justify-end">
        <div className="max-w-[80%]">
          {files.length > 0 && (
            <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
              {files.map((f, i) =>
                f.mediaType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={f.url} alt={f.filename ?? "image"} className="max-h-48 rounded-xl border border-line object-cover" />
                ) : (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-2 px-2.5 py-1.5 text-[12.5px]">
                    <FileText size={13} /> {f.filename ?? "file"}
                  </span>
                ),
              )}
            </div>
          )}
          {text && <div className="whitespace-pre-wrap rounded-2xl bg-user px-4 py-2.5 text-[15px] leading-relaxed">{text}</div>}
        </div>
      </div>
    );
  }
  const hasText = m.parts.some((p) => p.type === "text" && p.text.trim());
  return (
    <div className="group fade-up flex gap-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-clay">
        <Spark size={18} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {m.parts.map((p, i) => {
          if (p.type === "text") return p.text.trim() ? <Markdown key={i} text={p.text} /> : null;
          if (isToolUIPart(p) && getToolName(p) === "ask_user") {
            const input = ("input" in p ? p.input : undefined) as { question?: string; options?: string[]; allowOther?: boolean } | undefined;
            const output = "output" in p ? (p.output as string | undefined) : undefined;
            if (!input?.question) return null;
            return <AskCard key={i} question={input.question} options={input.options ?? []} allowOther={!!input.allowOther} answer={output} onPick={(v) => onToolOutput?.(("toolCallId" in p ? p.toolCallId : "") as string, v)} />;
          }
          if (isToolUIPart(p)) {
            const name = getToolName(p);
            const done = p.state === "output-available" || p.state === "output-error";
            return (
              <div key={i} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-bg-2 px-2.5 py-1.5 text-[12.5px] text-ink-2">
                {done ? <ToolIcon name={name} /> : <Loader2 size={13} className="animate-spin" />}
                <span className="truncate">
                  {TOOL_LABEL[name] ?? name} {toolSummary(name, "input" in p ? p.input : undefined)}
                </span>
              </div>
            );
          }
          return null;
        })}
        {!streaming && hasText && (
          <div className="flex items-center gap-1 pt-0.5 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={() => {
                const md = m.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n\n");
                void navigator.clipboard?.writeText(md);
                onExport?.();
              }}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] text-ink-3 hover:bg-bg-3 hover:text-ink"
              title="Copy as Markdown"
            >
              <Copy size={12} /> Copy
            </button>
            <button
              onClick={() => {
                const md = m.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n\n");
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
                a.download = "reply.md";
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                onExport?.();
              }}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] text-ink-3 hover:bg-bg-3 hover:text-ink"
              title="Download as a Markdown file"
            >
              <Download size={12} /> Export
            </button>
          </div>
        )}
        {streaming && !hasText && (
          <div className="flex items-center gap-1 py-1 text-ink-3">
            <span className="dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="dot h-1.5 w-1.5 rounded-full bg-current" />
          </div>
        )}
      </div>
    </div>
  );
}


/** Claude-style question card: one question, a few options, pick one (or type). */
function AskCard({ question, options, allowOther, answer, onPick }: { question: string; options: string[]; allowOther: boolean; answer?: string; onPick: (v: string) => void }) {
  const [other, setOther] = useState("");
  if (answer !== undefined)
    return (
      <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-bg-2 px-2.5 py-1.5 text-[12.5px] text-ink-2">
        <ListChecks size={13} /> <span className="truncate">{question}</span> <span className="font-medium text-ink">{answer}</span>
      </div>
    );
  return (
    <div className="max-w-[520px] rounded-xl border border-line bg-bg p-3.5 shadow-sm">
      <div className="text-[14px] font-medium">{question}</div>
      <div className="mt-2.5 space-y-1">
        {options.map((o, i) => (
          <button key={o} onClick={() => onPick(o)} className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2 text-left text-[13.5px] transition hover:border-ink hover:bg-bg-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-bg-3 text-[11px] font-semibold text-ink-2">{i + 1}</span>
            <span>{o}</span>
          </button>
        ))}
      </div>
      {allowOther && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (other.trim()) onPick(other.trim());
          }}
        >
          <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Something else…" className="h-9 flex-1 rounded-lg border border-line bg-bg px-3 text-[13px] outline-none placeholder:text-ink-3 focus:border-ink-3" />
          <button type="submit" disabled={!other.trim()} className="h-9 rounded-lg bg-ink px-3 text-[13px] font-medium text-bg disabled:opacity-40">Send</button>
        </form>
      )}
    </div>
  );
}
