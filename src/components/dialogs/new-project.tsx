"use client";
import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Dialog, Button, inputCls } from "../dialog";
import { closeDialog } from "@/lib/ui";
import { createProject } from "@/lib/store";

export function NewProjectDialog({ open }: { open: boolean }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      title={<span className="flex items-center gap-2"><FolderOpen size={16} /> New project</span>}
      footer={
        <>
          <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              createProject({ name: name.trim(), description: description.trim(), instructions: instructions.trim() });
              setName(""); setDescription(""); setInstructions("");
              closeDialog();
            }}
          >
            Create project
          </Button>
        </>
      }
    >
      <div className="mb-3 text-[13px] text-ink-2">A project keeps related chats, files and standing instructions together. Every chat inside it starts with that context.</div>
      <div className="space-y-2.5">
        <input autoFocus className={inputCls} placeholder="Name your project" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} placeholder="What is this project about? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <textarea className={inputCls} rows={5} placeholder="Instructions the assistant should follow in every chat here (optional). You can edit these later." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </div>
    </Dialog>
  );
}
