"use client";
import { useState } from "react";
import { Zap, Trash2 } from "lucide-react";
import { Dialog, Button, inputCls } from "../dialog";
import { closeDialog, toast } from "@/lib/ui";
import { useStore, createSkill, deleteSkill } from "@/lib/store";
import { BUILTIN_SKILLS } from "@/lib/skills";

export function SkillsDialog({ open }: { open: boolean }) {
  const custom = useStore((s) => s.skills);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const slug = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const taken = [...BUILTIN_SKILLS, ...custom].some((s) => s.name === slug);

  return (
    <Dialog open={open} onClose={closeDialog} title={<span className="flex items-center gap-2"><Zap size={16} /> Skills</span>}>
      <div className="mb-3 text-[13px] text-ink-2">A skill is a saved set of instructions. Type <span className="rounded bg-bg-3 px-1 font-mono text-[12px]">/name</span> in the message box to use one instead of explaining the format every time.</div>
      <div className="space-y-1.5">
        {BUILTIN_SKILLS.map((s) => (
          <Row key={s.id} name={s.name} desc={s.description} />
        ))}
        {custom.map((s) => (
          <Row key={s.id} name={s.name} desc={s.description} onDelete={() => deleteSkill(s.id)} />
        ))}
      </div>
      {creating ? (
        <div className="mt-4 space-y-2 rounded-xl border border-line p-3">
          <div className="text-[13px] font-medium">New skill</div>
          <input className={inputCls} placeholder="Name, e.g. weekly-summary" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputCls} placeholder="One line: what it is for" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <textarea className={inputCls} rows={5} placeholder="The instructions the assistant follows when you invoke it" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              disabled={!slug || taken || !prompt.trim()}
              onClick={() => {
                createSkill({ name: slug, description: desc.trim() || "Custom skill", prompt: prompt.trim() });
                toast({ title: `/${slug} created`, body: "Type it in the message box to use it.", tone: "ok" });
                setName(""); setDesc(""); setPrompt(""); setCreating(false);
              }}
            >
              Save /{slug || "name"}
            </Button>
          </div>
          {taken && <div className="text-[12px] text-bad">That name is taken.</div>}
        </div>
      ) : (
        <Button variant="outline" className="mt-4" onClick={() => setCreating(true)}>Create a skill</Button>
      )}
    </Dialog>
  );
}

function Row({ name, desc, onDelete }: { name: string; desc: string; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
      <span className="font-mono text-[13px]">/{name}</span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-2">{desc}</span>
      {onDelete ? <button onClick={onDelete} className="text-ink-3 hover:text-bad" title="Delete"><Trash2 size={14} /></button> : <span className="text-[11px] text-ink-3">built in</span>}
    </div>
  );
}
