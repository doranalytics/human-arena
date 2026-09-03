"use client";
import { useMemo, useState } from "react";
import { Search, ChevronDown, Pin } from "lucide-react";
import { useStore, openProject } from "@/lib/store";
import { openDialog, setPage } from "@/lib/ui";
import { cn } from "@/lib/utils";

type Sort = "updated" | "name" | "created";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const days = (Date.now() - d.getTime()) / 86400000;
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 7) return `${Math.floor(days)} days ago`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
}

/** Full-page project gallery in the desktop-app style: title, search, sort, New project, two-column cards. */
export function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const chats = useStore((s) => s.chats);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [sortOpen, setSortOpen] = useState(false);

  const rows = useMemo(() => {
    const withDates = projects.map((p) => {
      const latest = chats.filter((c) => c.projectId === p.id && !c.draft).reduce((m, c) => (c.updatedAt > m ? c.updatedAt : m), p.createdAt);
      return { ...p, updatedAt: latest };
    });
    const s = q.trim().toLowerCase();
    const list = s ? withDates.filter((p) => `${p.name} ${p.description} ${p.instructions}`.toLowerCase().includes(s)) : withDates;
    return [...list].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "created" ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt)));
  }, [projects, chats, q, sort]);

  const SORT_LABEL: Record<Sort, string> = { updated: "Last updated", name: "Name", created: "Date created" };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-[34px] font-normal tracking-tight">Projects</h1>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" className="h-10 w-44 rounded-xl border border-line bg-bg pl-9 pr-3 text-[13.5px] outline-none placeholder:text-ink-3 focus:border-line-2 focus:w-56 transition-all" />
          </label>
          <div className="relative">
            <button onClick={() => setSortOpen((v) => !v)} className="flex h-10 items-center gap-1.5 rounded-xl border border-line bg-bg px-3.5 text-[13.5px] hover:bg-bg-2">
              <span className="text-ink-3">Sort by</span> {SORT_LABEL[sort]} <ChevronDown size={14} className="text-ink-3" />
            </button>
            {sortOpen && (
              <div className="fade-up absolute right-0 top-11 z-30 w-44 rounded-xl border border-line bg-bg p-1 shadow-lg shadow-black/10">
                {(Object.keys(SORT_LABEL) as Sort[]).map((k) => (
                  <button key={k} onClick={() => { setSort(k); setSortOpen(false); }} className={cn("flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-[13.5px] hover:bg-bg-2", sort === k && "font-medium")}>{SORT_LABEL[k]}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => openDialog({ kind: "new-project" })} className="flex h-10 items-center rounded-xl bg-ink px-4 text-[13.5px] font-medium text-bg hover:bg-black">New project</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="font-serif text-[22px]">{q ? "No projects match." : "No projects yet."}</div>
          <div className="mt-1 max-w-[42ch] text-[13.5px] text-ink-2">A project keeps related chats, files and standing instructions together. Every chat inside it starts with that context.</div>
          {!q && <button onClick={() => openDialog({ kind: "new-project" })} className="mt-5 flex h-10 items-center rounded-xl bg-ink px-4 text-[13.5px] font-medium text-bg hover:bg-black">New project</button>}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {rows.map((p) => {
            const blurb = p.description || p.instructions;
            return (
              <button key={p.id} onClick={() => { setPage(null); openProject(p.id); }} className="group flex min-h-[200px] flex-col rounded-2xl border border-line bg-bg-2/40 p-6 text-left transition hover:border-line-2 hover:bg-bg-2">
                <div className="flex items-center gap-2">
                  <div className="text-[16px] font-semibold">{p.name}</div>
                  {p.files.length > 0 && <Pin size={13} className="text-ink-3 opacity-0 transition group-hover:opacity-100" />}
                </div>
                {blurb && <div className="mt-2 line-clamp-3 text-[14.5px] leading-relaxed text-ink-2">{blurb}</div>}
                <div className="mt-auto pt-6 text-[13px] text-ink-3">{fmtDate(p.updatedAt)}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
