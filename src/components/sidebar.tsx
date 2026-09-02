"use client";
import { useState } from "react";
import { Plus, FolderOpen, Cable, Zap, Search, MessageSquare, ChevronDown, PanelLeft, Trash2 } from "lucide-react";
import { useStore, newChat, openChat, openProject, deleteChat } from "@/lib/store";
import { openDialog, toggleSidebar, setPage, useUI } from "@/lib/ui";
import { useSession } from "@/lib/session";
import { tierFor } from "@/lib/tiers";
import { Avatar } from "./avatar";
import { TierBadge } from "./icons";
import { totalPoints } from "@/lib/store";
import { cn } from "@/lib/utils";

function NavItem({ icon, label, onClick, active, badge }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; badge?: string }) {
  return (
    <button onClick={onClick} className={cn("flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13.5px] text-ink hover:bg-bg-3", active && "bg-bg-3")}>
      <span className="text-ink-2">{icon}</span>
      <span className="truncate">{label}</span>
      {badge && <span className="ml-1 rounded bg-[#e8e3d6] px-1.5 py-px text-[10.5px] font-medium text-ink-2">{badge}</span>}
    </button>
  );
}

export function Sidebar() {
  const chats = useStore((s) => s.chats);
  const projects = useStore((s) => s.projects);
  const activeChatId = useStore((s) => s.activeChatId);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const settings = useStore((s) => s.settings);
  const results = useStore((s) => s.results);
  const attempt = useStore((s) => s.attempt);
  const session = useSession();
  const page = useUI((s) => s.page);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);

  const name = session.me?.name || settings.name || "You";
  const avatar = session.me?.avatar || settings.avatar;
  const pts = totalPoints(results);
  const list = chats.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-line bg-side">
      <div className="flex h-12 items-center px-3">
        <button onClick={toggleSidebar} className="rounded-lg p-1.5 text-ink-2 hover:bg-bg-3" title="Collapse sidebar">
          <PanelLeft size={17} />
        </button>
      </div>

      <div className="px-2.5 pt-1">
        <NavItem icon={<Plus size={16} />} label="New" onClick={() => { setPage(null); newChat(activeProjectId); }} active={!page && !activeChatId && !activeProjectId && !attempt} />
        <NavItem icon={<FolderOpen size={16} />} label="Projects" onClick={() => setPage("projects")} active={page === "projects"} />
        <NavItem icon={<Cable size={16} />} label="Connectors" onClick={() => openDialog({ kind: "settings", section: "connectors" })} />
        <NavItem icon={<Zap size={16} />} label="Skills" onClick={() => openDialog({ kind: "settings", section: "skills" })} />
      </div>

      <div className="mt-4 flex-1 overflow-y-auto px-2.5 pb-2">
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-[12px] font-medium text-ink-3">Projects</span>
          <button onClick={() => openDialog({ kind: "new-project" })} className="rounded p-0.5 text-ink-3 hover:bg-bg-3 hover:text-ink" title="New project">
            <Plus size={14} />
          </button>
        </div>
        {projects.length === 0 && <div className="px-2 py-1 text-[12.5px] text-ink-3">No projects yet</div>}
        {projects.map((p) => (
          <button key={p.id} onClick={() => { setPage(null); openProject(p.id); }} className={cn("flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13.5px] hover:bg-bg-3", !page && activeProjectId === p.id && !activeChatId && "bg-bg-3")}>
            <FolderOpen size={15} className="shrink-0 text-ink-3" />
            <span className="truncate">{p.name}</span>
          </button>
        ))}

        <div className="mb-1 mt-5 flex items-center justify-between px-2">
          <span className="text-[12px] font-medium text-ink-3">Chats</span>
          <button onClick={() => setSearching((v) => !v)} className="rounded p-0.5 text-ink-3 hover:bg-bg-3 hover:text-ink" title="Search chats">
            <Search size={14} />
          </button>
        </div>
        {searching && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" className="mb-1 h-8 w-full rounded-lg border border-line bg-bg px-2 text-[13px] outline-none" />}
        {list.length === 0 && <div className="px-2 py-1 text-[12.5px] text-ink-3">{q ? "No matches" : "Your chats will show up here"}</div>}
        {list.map((c) => (
          <div key={c.id} className={cn("group flex h-8 items-center rounded-lg pr-1 hover:bg-bg-3", !page && activeChatId === c.id && "bg-bg-3")}>
            <button onClick={() => { setPage(null); openChat(c.id); }} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 text-left text-[13.5px]">
              <MessageSquare size={14} className="shrink-0 text-ink-3" />
              <span className="truncate">{c.title}</span>
            </button>
            <button onClick={() => deleteChat(c.id)} className="hidden rounded p-1 text-ink-3 hover:text-bad group-hover:block" title="Delete chat">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-line px-2.5 py-2">
        <button onClick={() => openDialog({ kind: "settings", section: "account" })} className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2 hover:bg-bg-3">
          <Avatar name={name} src={avatar} size={28} />
          <span className="min-w-0 flex-1 truncate text-left text-[13.5px]">
            {name}{" "}
            <span className="inline-flex items-center gap-1 text-ink-3">
              · {tierFor(pts) !== "Analog" && <TierBadge tier={tierFor(pts) as Exclude<ReturnType<typeof tierFor>, "Analog">} size={12} />}
              {tierFor(pts)}
            </span>
          </span>
          <ChevronDown size={14} className="text-ink-3" />
        </button>
      </div>
    </aside>
  );
}
