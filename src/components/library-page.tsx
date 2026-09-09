"use client";
import { useState } from "react";
import { FileText, Library, Search } from "lucide-react";
import { useStore, openChat, openProject } from "@/lib/store";
import { setPage } from "@/lib/ui";

export function LibraryPage() {
  const chats = useStore((s) => s.chats);
  const projects = useStore((s) => s.projects);
  const [query, setQuery] = useState("");
  const files = [
    ...chats.flatMap((c) => c.messages.flatMap((m) => m.parts.filter((p) => p.type === "file").map((f, i) => ({ id: `${c.id}:${m.id}:${i}`, name: f.filename ?? "Attachment", source: c.title, kind: f.mediaType.startsWith("image/") ? "Image" : "File", open: () => { openChat(c.id); setPage(null); } })))),
    ...projects.flatMap((p) => p.files.map((f) => ({ id: `${p.id}:${f.id}`, name: f.name, source: p.name, kind: "Project file", open: () => { openProject(p.id); setPage(null); } }))),
  ];
  const shown = files.filter((f) => `${f.name} ${f.source}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="mx-auto max-w-4xl px-5 py-8 md:px-10">
    <h1 className="text-3xl font-semibold">Library</h1><p className="mt-3 text-sm text-ink-2">Files and images from your practice chats and projects.</p>
    <label className="mt-6 flex items-center gap-3 rounded-xl border border-line-2 px-4 py-3 text-ink-3"><Search size={18} /><input aria-label="Search library" className="w-full min-w-0 bg-transparent text-sm text-ink outline-none" placeholder="Search files" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
    {shown.length === 0 ? <div className="py-16 text-center"><Library size={30} className="mx-auto text-ink-3" /><h2 className="mt-4 font-semibold">{files.length ? "No matching files" : "Your files will appear here"}</h2><p className="mt-2 text-sm text-ink-2">{files.length ? "Try another search." : "Attach a file in a chat or add one to a project."}</p></div> : <div className="mt-6 divide-y divide-line">
      {shown.map((f) => <button key={f.id} onClick={f.open} className="flex w-full items-center gap-3 rounded-lg px-2 py-4 text-left hover:bg-bg-2"><FileText size={22} className="shrink-0 text-ink-2" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{f.name}</span><span className="block truncate text-xs text-ink-3">{f.source}</span></span><span className="text-xs text-ink-3">{f.kind}</span></button>)}
    </div>}
  </div>;
}
