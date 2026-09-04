"use client";
import { useState } from "react";
import { Plus, FolderOpen, SlidersHorizontal, Search, MessageSquare, ChevronDown, ChevronRight, PanelLeft, Trash2, Pin, PinOff, Swords, Pencil, Folder, Clock, Check, MoreHorizontal, Archive, ArchiveRestore } from "lucide-react";
import { useStore, newChat, openChat, openProject, deleteChat, togglePin, renameChat, moveChatToGroup, createGroup, setChatProject, setArchived, track } from "@/lib/store";
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

function Item({ icon, label, onClick, danger, more, right }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; more?: boolean; right?: string }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-bg-2", danger ? "text-[#a33a1e]" : "text-ink")}>
      <span className={danger ? "text-[#a33a1e]" : "text-ink-2"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {more ? <ChevronRight size={14} className="text-ink-3" /> : right ? <span className="text-[12px] text-ink-3">{right}</span> : null}
    </button>
  );
}

function ChatRow({ c, active, onOpen }: { c: Chat; active: boolean; onOpen: () => void }) {
  const groups = useStore((s) => s.groups);
  const projects = useStore((s) => s.projects);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c.title);
  const [menu, setMenu] = useState<null | "root" | "project" | "group">(null);
  const [newGroup, setNewGroup] = useState("");
  function commit() {
    const t = name.trim();
    if (t && t !== c.title) renameChat(c.id, t);
    setEditing(false);
  }
  return (
    <div className="relative">
      <div className={cn("group flex h-8 items-center rounded-lg pr-1 hover:bg-bg-3", (active || menu) && "bg-bg-3")}>
        {editing ? (
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }} className="mx-1 h-6 min-w-0 flex-1 rounded border border-line bg-bg px-1.5 text-[13px] outline-none" />
        ) : (
          <button onClick={onOpen} onDoubleClick={() => { setName(c.title); setEditing(true); }} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 text-left text-[13.5px]">
            {c.closed ? <Check size={14} className="shrink-0 text-ok" /> : <MessageSquare size={14} className="shrink-0 text-ink-3" />}
            <span className={cn("truncate", c.closed && "text-ink-2")}>{c.title}</span>
          </button>
        )}
        {!editing && (
          <button onClick={() => setMenu(menu ? null : "root")} className={cn("rounded p-1 text-ink-3 hover:bg-bg-2 hover:text-ink", menu ? "block" : "hidden group-hover:block")} title="More">
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
      {menu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
          <div className="fade-up absolute right-1 top-8 z-40 w-60 rounded-xl border border-line bg-bg p-1.5 shadow-lg shadow-black/10">
            {menu === "root" && (
              <>
                <Item icon={c.pinned ? <PinOff size={15} /> : <Pin size={15} />} label={c.pinned ? "Unpin" : "Pin"} onClick={() => { togglePin(c.id); setMenu(null); }} />
                <Item icon={<Pencil size={15} />} label="Rename" onClick={() => { setName(c.title); setEditing(true); setMenu(null); }} />
                <Item icon={<FolderOpen size={15} />} label="Add to project" more onClick={() => setMenu("project")} />
                <Item icon={<Folder size={15} />} label="Move to group" more onClick={() => setMenu("group")} />
                <div className="my-1 border-t border-line" />
                <Item icon={c.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />} label={c.archived ? "Unarchive" : "Archive"} onClick={() => { setArchived(c.id, !c.archived); setMenu(null); }} />
                <Item icon={<Trash2 size={15} />} label="Delete" danger onClick={() => { deleteChat(c.id); setMenu(null); }} />
              </>
            )}
            {menu === "project" && (
              <>
                <button onClick={() => setMenu("root")} className="mb-1 flex w-full items-center gap-1 px-2 py-1 text-[12px] text-ink-3 hover:text-ink"><ChevronRight size={12} className="rotate-180" /> Add to project</button>
                {projects.length === 0 && <div className="px-2.5 py-1.5 text-[12.5px] text-ink-3">No projects yet.</div>}
                {projects.map((p) => (
                  <Item key={p.id} icon={<FolderOpen size={15} />} label={p.name} right={c.projectId === p.id ? "current" : undefined} onClick={() => { setChatProject(c.id, p.id); track("added_to_project", p.id); setMenu(null); }} />
                ))}
                {c.projectId && <Item icon={<MessageSquare size={15} />} label="Remove from project" onClick={() => { setChatProject(c.id, null); setMenu(null); }} />}
                <div className="my-1 border-t border-line" />
                <Item icon={<Plus size={15} />} label="New project…" onClick={() => { setMenu(null); openDialog({ kind: "new-project" }); }} />
              </>
            )}
            {menu === "group" && (
              <>
                <button onClick={() => setMenu("root")} className="mb-1 flex w-full items-center gap-1 px-2 py-1 text-[12px] text-ink-3 hover:text-ink"><ChevronRight size={12} className="rotate-180" /> Move to group</button>
                {groups.map((g) => (
                  <Item key={g.id} icon={<Folder size={15} />} label={g.name} right={c.groupId === g.id ? "current" : undefined} onClick={() => { moveChatToGroup(c.id, g.id); setMenu(null); }} />
                ))}
                {c.groupId && <Item icon={<MessageSquare size={15} />} label="No group" onClick={() => { moveChatToGroup(c.id, null); setMenu(null); }} />}
                <form className="mt-1 flex gap-1 border-t border-line pt-1.5" onSubmit={(e) => { e.preventDefault(); if (!newGroup.trim()) return; const g = createGroup(newGroup); moveChatToGroup(c.id, g.id); setNewGroup(""); setMenu(null); }}>
                  <input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="New group…" className="h-7 min-w-0 flex-1 rounded border border-line bg-bg px-1.5 text-[12.5px] outline-none" />
                  <button type="submit" className="h-7 rounded bg-ink px-2 text-[12px] text-bg">Add</button>
                </form>
              </>
            )}
          </div>
        </>
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
  const list = chats.filter((c) => !c.draft && !c.archived && (!q || c.title.toLowerCase().includes(q.toLowerCase())));
  const archived = chats.filter((c) => c.archived && !c.draft);
  const [showArchived, setShowArchived] = useState(false);
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
        <button onClick={() => { setPage(null); newChat(activeProjectId); }} className="font-serif text-[19px] font-medium tracking-tight hover:text-clay-dark" title="Home">How to AI Games</button>
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
        {archived.length > 0 && (
          <div className="mt-5">
            <button onClick={() => setShowArchived((v) => !v)} className="flex w-full items-center gap-1 px-2 text-[12px] font-medium text-ink-3 hover:text-ink"><ChevronRight size={12} className={cn("transition", showArchived && "rotate-90")} /> Archived · {archived.length}</button>
            {showArchived && archived.map((c) => <ChatRow key={c.id} c={c} active={!page && activeChatId === c.id} onOpen={() => open(c.id)} />)}
          </div>
        )}
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
