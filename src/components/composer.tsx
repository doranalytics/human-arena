"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { useDictation } from "@/lib/dictation";
import { Plus, Paperclip, Image as ImageIcon, Globe, Telescope, Zap, Cable, ChevronDown, X, FileText, Check, Mic, Loader2 } from "lucide-react";
import { useStore, updateSettings } from "@/lib/store";
import { openDialog } from "@/lib/ui";
import { BUILTIN_SKILLS } from "@/lib/skills";
import { MODELS, EFFORTS, type ModelChoice, type Effort } from "@/lib/models";
import { cn } from "@/lib/utils";
import { StopOrSend } from "./chat-view";

export type ComposerSubmit = (args: { text: string; files: File[]; skill: string | null; dictated?: boolean })  => Promise<void>;

interface Props {
  onSubmit: ComposerSubmit;
  busy: boolean;
  onStop: () => void;
  webSearch: boolean;
  setWebSearch: (v: boolean) => void;
  research: boolean;
  setResearch: (v: boolean) => void;
  cowork: boolean;
  setCowork: (v: boolean) => void;
  projectName: string | null;
}

export function Composer({ onSubmit, busy, onStop, webSearch, setWebSearch, research, setResearch, cowork, setCowork, projectName }: Props) {
  const [text, setText] = useState("");
  const dictated = useRef(false);
  const dictation = useDictation((t) => { dictated.current = true; setText((cur) => (cur ? cur.replace(/\s*$/, " ") : "") + t); });
  const [files, setFiles] = useState<File[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const settings = useStore((s) => s.settings);
  const connectors = useStore((s) => s.connectors);
  const customSkills = useStore((s) => s.skills);
  const skills = [...BUILTIN_SKILLS, ...customSkills];

  const slashMatch = /^\/(\S*)$/.exec(text);
  const slashList = slashMatch ? skills.filter((s) => s.name.startsWith(slashMatch[1].toLowerCase())) : [];
  const showSlash = slashMatch !== null && slashList.length > 0;

  useEffect(() => {
    const close = () => {
      setPlusOpen(false);
      setModelOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list)].slice(0, 6));
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }
  const canSend = !busy && (text.trim().length > 0 || files.length > 0);

  async function submit() {
    if (!canSend) return;
    const m = /^\/(\S+)\s*([\s\S]*)$/.exec(text.trim());
    const skill = m && skills.some((s) => s.name === m[1]) ? m[1] : null;
    const t = text.trim();
    const f = files;
    setText("");
    const viaVoice = dictated.current;
    dictated.current = false;
    if (dictation.listening) dictation.stop();
    setFiles([]);
    await onSubmit({ text: t, files: f, skill, dictated: viaVoice });
    ta.current?.focus();
  }

  const modelLabel = `${MODELS[settings.model].label} ${EFFORTS[settings.effort].label}`;

  return (
    <div className="relative">
      {showSlash && (
        <div className="fade-up absolute bottom-full left-0 z-30 mb-2 w-80 rounded-xl border border-line bg-bg p-1.5 shadow-lg shadow-black/10">
          <div className="px-2 py-1 text-[11.5px] font-medium text-ink-3">Skills</div>
          {slashList.map((s, i) => (
            <button
              key={s.id}
              onMouseDown={(e) => {
                e.preventDefault();
                setText(`/${s.name} `);
              }}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left", i === slashIdx && "bg-bg-3")}
            >
              <Zap size={14} className="shrink-0 text-ink-3" />
              <div className="min-w-0">
                <div className="text-[13px] font-medium">/{s.name}</div>
                <div className="truncate text-[12px] text-ink-3">{s.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn("rounded-2xl border bg-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition", dragging ? "border-clay bg-[#fff6f1]" : "border-line-2 focus-within:border-ink-3")}
      >
        {(files.length > 0 || projectName) && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {projectName && <span className="inline-flex items-center gap-1 rounded-md bg-bg-3 px-2 py-1 text-[12px] text-ink-2">Project · {projectName}</span>}
            {files.map((f, i) => (
              <span key={i} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-line bg-bg-2 px-2 py-1 text-[12px]">
                {f.type.startsWith("image/") ? <ImageIcon size={12} /> : <FileText size={12} />}
                <span className="truncate">{f.name}</span>
                <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="text-ink-3 hover:text-ink">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={ta}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSlashIdx(0);
          }}
          onKeyDown={(e) => {
            if (showSlash && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              setSlashIdx((i) => (i + (e.key === "ArrowDown" ? 1 : slashList.length - 1)) % slashList.length);
              return;
            }
            if (showSlash && (e.key === "Tab" || e.key === "Enter")) {
              e.preventDefault();
              setText(`/${slashList[slashIdx].name} `);
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          onPaste={(e) => {
            const fs = Array.from(e.clipboardData.files);
            if (fs.length) addFiles(fs);
          }}
          rows={1}
          placeholder={cowork ? "What should I get done?" : "How can I help you today?"}
          className="max-h-60 w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-[16px] leading-6 outline-none placeholder:text-ink-3"
        />
        <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPlusOpen((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-bg-3" title="Add files and tools">
              <Plus size={18} />
            </button>
            {plusOpen && (
              <div className="fade-up absolute bottom-10 left-0 z-30 w-64 rounded-xl border border-line bg-bg p-1.5 shadow-lg shadow-black/10">
                <MenuItem icon={<Paperclip size={15} />} label="Upload a file" onClick={() => fileInput.current?.click()} />
                <MenuItem icon={<ImageIcon size={15} />} label="Add a photo or screenshot" onClick={() => imageInput.current?.click()} />
                <div className="my-1 border-t border-line" />
                <MenuItem icon={<Globe size={15} />} label="Web search" checked={webSearch} onClick={() => setWebSearch(!webSearch)} />
                <MenuItem icon={<Telescope size={15} />} label="Research" hint="Longer, sourced report" checked={research} onClick={() => setResearch(!research)} />
                <div className="my-1 border-t border-line" />
                <MenuItem icon={<Zap size={15} />} label="Use a skill" hint="or type /" onClick={() => { setText("/"); ta.current?.focus(); }} />
                <MenuItem icon={<Cable size={15} />} label={connectors.length ? `Connectors (${connectors.length} on)` : "Connectors"} onClick={() => openDialog({ kind: "settings", section: "connectors" })} />
              </div>
            )}
          </div>
          <div className="flex items-center rounded-lg border border-line p-0.5 text-[13px]">
            <button type="button" onClick={() => setCowork(false)} className={cn("rounded-md px-2.5 py-1", !cowork ? "bg-bg-3 font-medium" : "text-ink-3 hover:text-ink")}>Chat</button>
            <button type="button" onClick={() => setCowork(true)} title="Hand it a task. It plans the steps and works through them with your connectors." className={cn("rounded-md px-2.5 py-1", cowork ? "bg-bg-3 font-medium" : "text-ink-3 hover:text-ink")}>Cowork</button>
          </div>
          {webSearch && !research && <Chip icon={<Globe size={12} />} label="Web search" onRemove={() => setWebSearch(false)} />}
          {research && <Chip icon={<Telescope size={12} />} label="Research" onRemove={() => setResearch(false)} />}
          <div className="flex-1" />
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setModelOpen((v) => !v)} className="flex h-8 items-center gap-1 rounded-lg border border-line px-2.5 text-[13px] hover:bg-bg-2" title="Model and effort">
              <span className="font-medium">{MODELS[settings.model].label}</span>
              <span className="text-ink-3">{EFFORTS[settings.effort].label}</span>
              <ChevronDown size={13} className="text-ink-3" />
            </button>
            {modelOpen && (
              <div className="fade-up absolute bottom-10 right-0 z-30 w-72 rounded-xl border border-line bg-bg p-1.5 shadow-lg shadow-black/10">
                <div className="px-2 py-1 text-[11.5px] font-medium text-ink-3">Model</div>
                {(Object.keys(MODELS) as ModelChoice[]).map((k) => (
                  <MenuItem key={k} label={MODELS[k].label} hint={MODELS[k].blurb} checked={settings.model === k} onClick={() => updateSettings({ model: k })} keep />
                ))}
                <div className="my-1 border-t border-line" />
                <div className="px-2 py-1 text-[11.5px] font-medium text-ink-3">Effort</div>
                {(Object.keys(EFFORTS) as Effort[]).map((k) => (
                  <MenuItem key={k} label={EFFORTS[k].label} hint={EFFORTS[k].blurb} checked={settings.effort === k} onClick={() => updateSettings({ effort: k })} keep />
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
            disabled={!dictation.supported || dictation.transcribing}
            title={!dictation.supported ? "Dictation needs a microphone" : dictation.transcribing ? "Transcribing…" : dictation.listening ? "Stop and transcribe" : "Dictate"}
            className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition", dictation.listening ? "bg-bad/10 text-bad animate-pulse" : dictation.transcribing ? "text-clay" : "text-ink-3 hover:bg-bg-3 hover:text-ink disabled:opacity-40")}
          >
            {dictation.transcribing ? <Loader2 size={17} className="animate-spin" /> : <Mic size={17} />}
          </button>
          <StopOrSend busy={busy} canSend={canSend} onStop={onStop} />
        </div>
        <input ref={fileInput} type="file" multiple hidden accept=".txt,.md,.csv,.json,.pdf,image/*" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <input ref={imageInput} type="file" multiple hidden accept="image/*" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </form>
      <span className="sr-only">{modelLabel}</span>
    </div>
  );
}

function MenuItem({ icon, label, hint, onClick, checked, keep }: { icon?: React.ReactNode; label: string; hint?: string; onClick: () => void; checked?: boolean; keep?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        if (keep) e.stopPropagation();
        onClick();
      }}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-bg-3"
    >
      {icon && <span className="shrink-0 text-ink-2">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {hint && <span className="block text-[11.5px] text-ink-3">{hint}</span>}
      </span>
      {checked !== undefined && <span className={cn("flex h-4 w-4 items-center justify-center", checked ? "text-clay" : "text-transparent")}><Check size={14} /></span>}
    </button>
  );
}

function Chip({ icon, label, onRemove }: { icon: React.ReactNode; label: string; onRemove: () => void }) {
  return (
    <span className="ml-1 inline-flex items-center gap-1 rounded-lg border border-clay/40 bg-[#fbeee7] px-2 py-1 text-[12.5px] text-clay-dark">
      {icon} {label}
      <button type="button" onClick={onRemove} className="ml-0.5 hover:text-ink">
        <X size={12} />
      </button>
    </span>
  );
}
