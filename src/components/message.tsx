"use client";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { FileText, Globe, Mail, HardDrive, Database, Calendar, Loader2 } from "lucide-react";
import { Spark } from "./icons";
import { TOOL_CONNECTOR } from "@/lib/tool-connector";

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
  remember: "Saved to memory",
};
function ToolIcon({ name }: { name: string }) {
  const c = TOOL_CONNECTOR[name];
  const cls = "shrink-0";
  if (name === "web_search") return <Globe size={13} className={cls} />;
  if (c === "gmail") return <Mail size={13} className={cls} />;
  if (c === "drive") return <HardDrive size={13} className={cls} />;
  if (c === "warehouse") return <Database size={13} className={cls} />;
  if (c === "calendar") return <Calendar size={13} className={cls} />;
  return <FileText size={13} className={cls} />;
}

function toolSummary(name: string, input: unknown): string {
  const i = (input ?? {}) as Record<string, unknown>;
  if (typeof i.query === "string" && i.query) return `“${i.query}”`;
  if (typeof i.url === "string") return i.url.replace(/^https?:\/\//, "").slice(0, 60);
  if (typeof i.fact === "string") return `“${i.fact.slice(0, 60)}”`;
  if (typeof i.table === "string") return i.table + (i.contains ? ` · ${i.contains}` : "");
  if (typeof i.id === "string") return i.id;
  return "";
}

export function Message({ m, streaming }: { m: UIMessage; streaming?: boolean }) {
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
    <div className="fade-up flex gap-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-clay">
        <Spark size={18} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {m.parts.map((p, i) => {
          if (p.type === "text") return p.text.trim() ? <Markdown key={i} text={p.text} /> : null;
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
