"use client";
import { useState } from "react";
import { Box, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore, saveGPT, deleteGPT, openGPT } from "@/lib/store";
import { setPage } from "@/lib/ui";
import type { PracticeGPT } from "@/lib/types";
import { Dialog, Button, inputCls } from "./dialog";

export function GPTsPage() {
  const gpts = useStore((s) => s.gpts);
  const [editing, setEditing] = useState<Partial<PracticeGPT> | null>(null);
  const [deleting, setDeleting] = useState<PracticeGPT | null>(null);
  return <div className="mx-auto max-w-4xl px-5 py-8 md:px-10">
    <div className="flex items-center justify-between gap-4"><h1 className="text-3xl font-semibold">GPTs</h1><Button onClick={() => setEditing({ name: "", description: "", instructions: "" })}><Plus size={16} /> Create</Button></div>
    <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2">Create an assistant with its own instructions. These practice GPTs stay in How to AI Games.</p>
    {gpts.length === 0 ? <div className="mt-12 rounded-2xl border border-dashed border-line-2 p-8 text-center"><Box size={30} className="mx-auto text-ink-3" /><h2 className="mt-4 font-semibold">Make your first GPT</h2><p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">Give it a job and instructions it can use in every conversation.</p><Button className="mt-5" onClick={() => setEditing({ name: "", description: "", instructions: "" })}>Create a GPT</Button></div> : <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {gpts.map((g) => <article key={g.id} className="rounded-2xl border border-line p-5"><Box size={25} /><h2 className="mt-3 font-semibold">{g.name}</h2><p className="mt-1 text-sm text-ink-2">{g.description}</p><div className="mt-5 flex items-center gap-2"><Button onClick={() => { openGPT(g.id); setPage(null); }}>Start chat</Button><Button variant="ghost" title={`Edit ${g.name}`} onClick={() => setEditing(g)}><Pencil size={16} /></Button><Button variant="ghost" title={`Delete ${g.name}`} onClick={() => setDeleting(g)}><Trash2 size={16} /></Button></div></article>)}
    </div>}
    <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit GPT" : "Create a GPT"}>
      {editing && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!editing.name?.trim() || !editing.instructions?.trim()) return; saveGPT({ id: editing.id, name: editing.name.trim(), description: editing.description?.trim() ?? "", instructions: editing.instructions.trim() }); setEditing(null); }}>
        <label className="block text-sm font-medium">Name<input required maxLength={60} className={`${inputCls} mt-1.5`} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Writing coach" /></label>
        <label className="block text-sm font-medium">Description<input maxLength={240} className={`${inputCls} mt-1.5`} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="What does it help with?" /></label>
        <label className="block text-sm font-medium">Instructions<textarea required maxLength={6000} rows={6} className={`${inputCls} mt-1.5`} value={editing.instructions ?? ""} onChange={(e) => setEditing({ ...editing, instructions: e.target.value })} placeholder="What should it do? How should it respond?" /></label>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={!editing.name?.trim() || !editing.instructions?.trim()}>Save GPT</Button></div>
      </form>}
    </Dialog>
    <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete GPT?" footer={<><Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button><Button onClick={() => { if (deleting) deleteGPT(deleting.id); setDeleting(null); }}>Delete</Button></>}><p className="text-sm">Remove {deleting?.name}? Its existing conversations will stay saved.</p></Dialog>
  </div>;
}
