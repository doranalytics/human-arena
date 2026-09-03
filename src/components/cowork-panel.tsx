"use client";
import { useState } from "react";
import { ChevronDown, Hand, FastForward, TriangleAlert, ListChecks, Check, FolderOpen } from "lucide-react";
import { useStore, updateSettings, setChatProject, openChat } from "@/lib/store";
import { openDialog, setPage } from "@/lib/ui";
import { relTime, cn } from "@/lib/utils";
import type { Chat } from "@/lib/types";

const MODES = [
  { id: "manual", label: "Manually approve", icon: <Hand size={16} /> },
  { id: "auto", label: "Automatically approve", icon: <FastForward size={16} /> },
  { id: "skip", label: "Skip all approvals", icon: <TriangleAlert size={16} /> },
] as const;

/** Under the composer in Cowork mode: which project it works in, how much it asks, and the active Cowork threads. */
export function CoworkPanel({ chat }: { chat: Chat }) {
  const projects = useStore((s) => s.projects);
  const chats = useStore((s) => s.chats);
  const mode = useStore((s) => s.settings.coworkApproval ?? "auto");
  const [open, setOpen] = useState<"project" | "mode" | null>(null);
  const [more, setMore] = useState(false);
  const project = projects.find((p) => p.id === chat.projectId) ?? null;
  const active = chats.filter((c) => c.cowork && !c.draft && c.id !== chat.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const shown = more ? active : active.slice(0, 5);
  return (
    <div className="mt-3 w-full max-w-[760px]" onClick={() => open && setOpen(null)}>
      <div className="flex items-center gap-1 text-[14px]">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setOpen(open === "project" ? null : "project")} className={cn("flex items-center gap-1 rounded-md px-2 py-1 hover:bg-bg-3", open === "project" && "bg-bg-3")}>
            {project ? <><FolderOpen size={14} className="text-ink-3" /> {project.name}</> : "Project"} <ChevronDown size={13} className="text-ink-3" />
          </button>
          {open === "project" && (
            <div className="fade-up absolute left-0 top-9 z-30 w-64 rounded-xl border border-line bg-bg p-1 shadow-lg shadow-black/10">
              {projects.length === 0 && <div className="px-2.5 py-2 text-[13px] text-ink-3">No projects yet.</div>}
              {projects.map((p) => (
                <button key={p.id} onClick={() => { setChatProject(chat.id, p.id); setOpen(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] hover:bg-bg-2">
                  <FolderOpen size={14} className="text-ink-3" /> <span className="min-w-0 flex-1 truncate">{p.name}</span> {chat.projectId === p.id && <Check size={14} />}
                </button>
              ))}
              {project && <button onClick={() => { setChatProject(chat.id, null); setOpen(null); }} className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:bg-bg-2">No project</button>}
              <div className="my-1 border-t border-line" />
              <button onClick={() => { setOpen(null); openDialog({ kind: "new-project" }); }} className="w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:bg-bg-2">New project…</button>
            </div>
          )}
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setOpen(open === "mode" ? null : "mode")} className={cn("flex items-center gap-1 rounded-md px-2 py-1 hover:bg-bg-3", open === "mode" && "bg-bg-3")}>
            {mode === "manual" ? "Manual" : mode === "skip" ? "Skip approvals" : "Auto"} <ChevronDown size={13} className="text-ink-3" />
          </button>
          {open === "mode" && (
            <div className="fade-up absolute left-0 top-9 z-30 w-64 rounded-xl border border-line bg-bg p-1 shadow-lg shadow-black/10">
              {MODES.map((m) => (
                <button key={m.id} onClick={() => { updateSettings({ coworkApproval: m.id }); setOpen(null); }} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[14px] hover:bg-bg-2">
                  <span className="text-ink-2">{m.icon}</span> <span className="flex-1">{m.label}</span> {mode === m.id && <Check size={15} className="text-[#1a56db]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {active.length > 0 && (
        <div className="mt-6">
          <div className="mb-1 text-[13px] text-ink-3">Active</div>
          <div className="divide-y divide-line">
            {shown.map((c) => (
              <button key={c.id} onClick={() => { setPage(null); openChat(c.id); }} className="flex w-full items-center gap-4 py-3 text-left hover:bg-bg-2/60">
                <span className="relative text-ink-2"><ListChecks size={20} /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#1a56db]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{c.title}</span>
                  <span className="block text-[12.5px] text-ink-3">{relTime(c.updatedAt)} ago</span>
                </span>
              </button>
            ))}
          </div>
          {active.length > 5 && !more && <button onClick={() => setMore(true)} className="mt-2 text-[13.5px] text-ink-3 hover:text-ink">Show more</button>}
        </div>
      )}
    </div>
  );
}
