"use client";
import { useState } from "react";
import { Plus, FolderOpen, SlidersHorizontal, Search, MessageSquare, ChevronDown, PanelLeft, Trash2, Pin, PinOff, Swords, Pencil, FolderInput, Clock, Check } from "lucide-react";
import { useStore, newChat, openChat, openProject, deleteChat, togglePin, renameChat, moveChatToGroup, createGroup } from "@/lib/store";
import { openDialog, toggleSidebar, setPage, useUI } from "@/lib/ui";
import { useSession } from "@/lib/session";
import { tierFor } from "@/lib/tiers";
import { Avatar } from "./avatar";
import { TierBadge } from "./icons";
import { totalPoints } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Chat } from "@/lib/types";

function NavItem({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13.5px] text-ink hover:bg-bg-3", active && "bg-bg-3")}>
      <span className="text-ink-2">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function ChatRow({ c, active, onOpen }: { c: Chat; active: boolean; onOpen: () => void }) {
  const groups = useStore((s) => s.groups);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c.title);
  const [grouping, setGrouping] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  function commit() {
    const t = name.trim();
    if (t && t !== c.title) renameChat(c.id, t);
    setEditing(false);
  }
  return (
    <div className="relative">
      <div className={cn("group flex h-8 items-center rounded-lg pr-1 hover:bg-bg-3", active && "bg-bg-3")}>
        {editing ? (
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }} className="mx-1 h-6 min-w-0 flex-1 rounded border border-line bg-bg px-1.5 text-[13px] outline-none" />
        ) : (
          <button onClick={onOpen} onDoubleClick={() => { setName(c.title); setEditing(true); }} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 text-left text-[13.5px]">
            {c.closed ? <Check size={14} className="shrink-0 text-ok" /> : <MessageSquare size={14} className="shrink-0 text-ink-3" />}
            <span className={cn("truncate", c.closed && "text-ink-2")}>{c.title}</span>
          </button>
        )}
        {!editing && (
          <>
            <button onClick={() => { setName(c.title); setEditing(true); }} className="hidden rounded p-1 text-ink-3 hover:text-ink group-hover:block" title="Rename"><Pencil size={13} /></button>
            <button onClick={() => togglePin(c.id)} className="hidden rounded p-1 text-ink-3 hover:text-ink group-hover:block" title={c.pinned ? "Unpin" : "Pin"}>{c.pinned ? <PinOff size={13} /> : <Pin size={13} />}</button>
            <button onClick={() => setGrouping((v) => !v)} className="hidden rounded p-1 text-ink-3 hover:text-ink group-hover:block" title="Move to group"><FolderInput size={13} /></button>
            <button onClick={() => deleteChat(c.id)} className="hidden rounded p-1 text-ink-3 hover:text-bad group-hover:block" title="Delete chat"><Trash2 size={13} /></button>
          </>
        )}
      </div>
      {grouping && (
        <div className="fade-up absolute left-2 right-2 top-8 z-30 rounded-xl border border-line bg-bg p-1 shadow-lg shadow-black/10">
          <div className="px-2 py-1 text-[11px] font-medium text-ink-3">Move to group</div>
          {groups.map((g) => (
            <button key={g.id} onClick={() => { moveChatToGroup(c.id, g.id); setGrouping(false); }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-bg-2">{g.name} {c.groupId === g.id && <Check size={13} />}</button>
          ))}
          {c.groupId && <button onClick={() => { moveChatToGroup(c.id, null); setGrouping(false); }} className="w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-bg-2">No group</button>}
          <form className="mt-1 flex gap-1 border-t border-line pt-1" onSubmit={(e) => { e.preventDefault(); if (!newGroup.trim()) return; const g = createGroup(newGroup); moveChatToGroup(c.id, g.id); setNewGroup(""); setGrouping(false); }}>
            <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="New group…" className="h-7 min-w-0 flex-1 rounded border border-line bg-bg px-1.5 text-[12.5px] outline-none" />
            <button type="submit" className="h-7 rounded bg-ink px-2 text-[12px] text-bg">Add</button>
          </form>
        </div>
      )}
    </div>
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
  const tier = tierFor(pts);
  const list = chats.filter((c) => !c.draft && (!q || c.title.toLowerCase().includes(q.toLowerCase())));
  const groups = useStore((s) => s.groups);
  const pinned = list.filter((c) => c.pinned);
  const rest = list.filter((c) => !c.pinned && !c.groupId);
  const grouped = groups.map((g) => ({ g, chats: list.filter((c) => !c.pinned && c.groupId === g.id) })).filter((x) => x.chats.length);
  const open = (id: string) => {
    setPage(null);
    openChat(id);
  };

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-line bg-side">
      <div className="flex h-12 items-center px-4">
        <button onClick={() => { setPage(null); newChat(activeProjectId); }} className="font-serif text-[22px] font-medium tracking-tight hover:text-clay-dark" title="Home">Human Arena</button>
      </div>

      <div className="px-2.5 pt-1">
        <NavItem icon={<Plus size={16} />} label="New" onClick={() => { setPage(null); newChat(activeProjectId); }} active={!page && !activeChatId && !activeProjectId && !attempt} />
        <NavItem icon={<Swords size={16} className="text-clay" />} label="Challenges" onClick={() => openDialog({ kind: "challenges" })} />
        <NavItem icon={<FolderOpen size={16} />} label="Projects" onClick={() => setPage("projects")} active={page === "projects"} />
        <NavItem icon={<Clock size={16} />} label="Scheduled" onClick={() => setPage("scheduled")} active={page === "scheduled"} />
        <NavItem icon={<SlidersHorizontal size={16} />} label="Customize" onClick={() => openDialog({ kind: "settings", section: "skills" })} />
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

        {pinned.length > 0 && (
          <>
            <div className="mb-1 mt-5 px-2 text-[12px] font-medium text-ink-3">Pinned</div>
            {pinned.map((c) => (
              <ChatRow key={c.id} c={c} active={!page && activeChatId === c.id} onOpen={() => open(c.id)} />
            ))}
          </>
        )}

        {grouped.map(({ g, chats: gc }) => (
          <div key={g.id}>
            <div className="mb-1 mt-5 px-2 text-[12px] font-medium text-ink-3">{g.name}</div>
            {gc.map((c) => (
              <ChatRow key={c.id} c={c} active={!page && activeChatId === c.id} onOpen={() => open(c.id)} />
            ))}
          </div>
        ))}

        <div className="mb-1 mt-5 flex items-center justify-between px-2">
          <span className="text-[12px] font-medium text-ink-3">Chats and tasks</span>
          <button onClick={() => setSearching((v) => !v)} className="rounded p-0.5 text-ink-3 hover:bg-bg-3 hover:text-ink" title="Search chats">
            <Search size={14} />
          </button>
        </div>
        {searching && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" className="mb-1 h-8 w-full rounded-lg border border-line bg-bg px-2 text-[13px] outline-none" />}
        {rest.length === 0 && <div className="px-2 py-1 text-[12.5px] text-ink-3">{q ? "No matches" : "Your chats will show up here"}</div>}
        {rest.map((c) => (
          <ChatRow key={c.id} c={c} active={!page && activeChatId === c.id} onOpen={() => open(c.id)} />
        ))}
      </div>

      <div className="flex items-center gap-1 border-t border-line px-2.5 py-2">
        <button onClick={() => openDialog({ kind: "settings", section: "account" })} className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 hover:bg-bg-3" title="Settings">
          <Avatar name={name} src={avatar} size={28} />
          <span className="min-w-0 flex-1 truncate text-left text-[13.5px]">
            {name}{" "}
            <span className="inline-flex items-center gap-1 text-ink-3">
              · {tier !== "Analog" && <TierBadge tier={tier as Exclude<ReturnType<typeof tierFor>, "Analog">} size={12} />}
              {tier}
            </span>
          </span>
          <ChevronDown size={14} className="text-ink-3" />
        </button>
        <button onClick={toggleSidebar} className="rounded-lg border border-line-2 p-1.5 text-ink-2 hover:bg-bg-3" title="Collapse sidebar">
          <PanelLeft size={16} />
        </button>
      </div>
    </aside>
  );
}
