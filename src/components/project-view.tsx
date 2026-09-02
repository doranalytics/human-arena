"use client";
import { useMemo, useRef, useState } from "react";
import { FolderOpen, Plus, FileText, Trash2, MessageSquare } from "lucide-react";
import type { Project } from "@/lib/types";
import { useStore, updateProject, addProjectFile, newChat, openChat, deleteProject } from "@/lib/store";
import { Button, inputCls } from "./dialog";
import { toast } from "@/lib/ui";
import { relTime } from "@/lib/utils";

export function ProjectView({ project }: { project: Project }) {
  const allChats = useStore((s) => s.chats);
  const chats = useMemo(() => allChats.filter((c) => c.projectId === project.id), [allChats, project.id]);
  const [instr, setInstr] = useState(project.instructions);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = instr !== project.instructions;

  async function onFiles(list: FileList | null) {
    if (!list) return;
    for (const f of Array.from(list)) {
      if (f.size > 400_000) {
        toast({ title: `${f.name} is too big`, body: "Project files are text, up to 400 KB in v0.", tone: "bad" });
        continue;
      }
      const text = await f.text();
      addProjectFile(project.id, f.name, text);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-ink-3"><FolderOpen size={13} /> Project</div>
          <h1 className="mt-1 font-serif text-[32px] leading-tight">{project.name}</h1>
          {project.description && <div className="mt-1 text-[14px] text-ink-2">{project.description}</div>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" onClick={() => { if (confirm("Delete this project? Its chats stay, outside the project.")) deleteProject(project.id); }}>Delete</Button>
          <Button onClick={() => newChat(project.id)}><Plus size={15} /> New chat</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-2 text-[12px] font-medium text-ink-3">Chats in this project</div>
          {chats.length === 0 ? (
            <button onClick={() => newChat(project.id)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line-2 px-4 py-6 text-[13.5px] text-ink-2 hover:bg-bg-2">
              <MessageSquare size={16} /> Start the first chat. It will follow the instructions on the right.
            </button>
          ) : (
            <div className="divide-y divide-line rounded-xl border border-line">
              {chats.map((c) => (
                <button key={c.id} onClick={() => openChat(c.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] hover:bg-bg-2">
                  <MessageSquare size={14} className="text-ink-3" />
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="text-[12px] text-ink-3">{relTime(c.updatedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-[12px] font-medium text-ink-3">Instructions</div>
              {dirty && <button onClick={() => { updateProject(project.id, { instructions: instr }); toast({ title: "Instructions saved", tone: "ok" }, 2000); }} className="text-[12px] font-medium text-clay-dark">Save</button>}
            </div>
            <textarea className={inputCls} rows={7} value={instr} onChange={(e) => setInstr(e.target.value)} placeholder="Standing instructions for every chat in this project. Who you are, what format you want, what to avoid." />
          </section>
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-[12px] font-medium text-ink-3">Files</div>
              <button onClick={() => fileInput.current?.click()} className="text-[12px] font-medium text-clay-dark">Add</button>
              <input ref={fileInput} type="file" multiple hidden accept=".txt,.md,.csv,.json" onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
            </div>
            {project.files.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-2 px-3 py-3 text-[12.5px] text-ink-3">Text, markdown or CSV files the assistant should always know about.</div>
            ) : (
              <div className="space-y-1">
                {project.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px]">
                    <FileText size={13} className="text-ink-3" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="text-ink-3">{Math.ceil(f.size / 1024)} KB</span>
                    <button onClick={() => updateProject(project.id, { files: project.files.filter((x) => x.id !== f.id) })} className="text-ink-3 hover:text-bad"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
