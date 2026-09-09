"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { useDictation } from "@/lib/dictation";
import { ConnectorLogo } from "./connector-logos";
import { CONNECTORS } from "@/lib/connectors";
import { MATERIAL_MIME, materialFile, materialText } from "@/lib/materials";
import type { Material } from "@/lib/arena/types";
import { Plus, Paperclip, Image as ImageIcon, Globe, Telescope, Zap, Cable, Bot, X, FileText, Check, Mic, Loader2, Lock, Brain } from "lucide-react";
import { useStore, setConnector } from "@/lib/store";
import { openDialog } from "@/lib/ui";
import { BUILTIN_SKILLS } from "@/lib/skills";
import { ModelPicker } from "./model-picker";
import { useLearning } from "@/lib/learning/client";
import { cn } from "@/lib/utils";
import { StopOrSend } from "./chat-view";

export type ComposerSubmit = (args: { text: string; files: File[]; skill: string | null; dictated?: boolean })  => Promise<void>;

interface Props {
  onSubmit: ComposerSubmit;
  busy: boolean;
  grading?: boolean;
  onStop: () => void;
  webSearch: boolean;
  setWebSearch: (v: boolean) => void;
  research: boolean;
  setResearch: (v: boolean) => void;
  cowork: boolean;
  setCowork: (v: boolean) => void;
  memoryOn: boolean;
  setMemoryOn: (v: boolean) => void;
  projectName: string | null;
  /** no challenge running: chatting is locked until one starts */
  locked?: boolean;
  /** free messages left today outside a challenge; null while a challenge runs */
  freeLeft?: number | null;
  /** changes when an attempt starts or ends; the draft is cleared */
  clearOn?: string;
  /** menus open downward when the composer sits mid-screen (empty chat) */
  menusDown?: boolean;
}

export function Composer({ onSubmit, busy, grading, onStop, webSearch, setWebSearch, research, setResearch, cowork, setCowork, memoryOn, setMemoryOn, projectName, locked, freeLeft, clearOn, menusDown }: Props) {
  const [text, setText] = useState("");
  const dictated = useRef(false);
  const dictation = useDictation((t) => { dictated.current = true; setText((cur) => (cur ? cur.replace(/\s*$/, " ") : "") + t); });
  const [files, setFiles] = useState<File[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const lastClear = useRef(clearOn);
  useEffect(() => {
    if (lastClear.current === clearOn) return;
    lastClear.current = clearOn;
    setText("");
    setFiles([]);
  }, [clearOn]);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const chatgpt = useLearning().surface === "chatgpt";
  const connectors = useStore((s) => s.connectors);
  const customSkills = useStore((s) => s.skills);
  const skills = [...BUILTIN_SKILLS, ...customSkills];

  const slashMatch = /^\/(\S*)$/.exec(text);
  const slashList = slashMatch ? skills.filter((s) => s.name.startsWith(slashMatch[1].toLowerCase())) : [];
  const showSlash = slashMatch !== null && slashList.length > 0;
  const activeSkill = (() => { const m = /^\/([a-z0-9-]+)\s/.exec(text); return m && skills.some((k) => k.name === m[1]) ? m[1] : null; })();

  useEffect(() => {
    const close = () => {
      setPlusOpen(false);
      setAppsOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list)].slice(0, 6));
  }
  async function takeMaterial(m: Material) {
    if (m.kind === "file") {
      const f = await materialFile(m);
      if (f) addFiles([f]);
    } else {
      const t = materialText(m);
      setText((cur) => (cur.trim() ? cur.replace(/\s*$/, "\n\n") : "") + t + "\n\n");
      ta.current?.focus();
    }
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const raw = e.dataTransfer.getData(MATERIAL_MIME);
    if (raw) {
      try {
        void takeMaterial(JSON.parse(raw) as Material);
      } catch {
        /* not ours */
      }
      return;
    }
    addFiles(e.dataTransfer.files);
  }
  useEffect(() => {
    const on = (e: Event) => void takeMaterial((e as CustomEvent<Material>).detail);
    window.addEventListener("arena:material", on);
    return () => window.removeEventListener("arena:material", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const canSend = !busy && !grading && (text.trim().length > 0 || files.length > 0);

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



  return (
    <div className="relative">
      {showSlash && (
        <div className="mobile-popover fade-up absolute bottom-full left-0 z-30 mb-2 w-80 rounded-xl border border-line bg-bg p-1.5 shadow-lg shadow-black/10">
          <div className="px-2 py-1 text-[11.5px] font-medium text-ink-3">Skills</div>
          {slashList.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setText(`/${s.name} `); ta.current?.focus(); }}
              onMouseDown={(e) => {
                e.preventDefault();
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
        className={cn("chat-composer relative rounded-2xl border bg-white/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition", dragging ? "border-clay bg-[#fff6f1]" : "border-line-2 focus-within:border-ink-3")}
      >
        {(files.length > 0 || projectName) && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {projectName && <span className="inline-flex max-w-full break-words items-center gap-1 rounded-md bg-bg-3 px-2 py-1 text-[12px] text-ink-2">Project · {projectName}</span>}
            {files.map((f, i) => (
              <span key={i} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-line bg-bg-2 px-2 py-1 text-[12px]">
                {f.type.startsWith("image/") ? <ImageIcon size={12} /> : <FileText size={12} />}
                <span className="truncate">{f.name}</span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-3 hover:text-ink md:h-auto md:w-auto">
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
          placeholder={chatgpt ? "Ask ChatGPT" : cowork ? "What should I get done?" : "How can I help you today?"}
          className="max-h-[min(15rem,30dvh)] w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-[16px] leading-6 outline-none placeholder:text-ink-3"
        />
        {(activeSkill || webSearch || research) && <div className="flex flex-wrap gap-1.5 px-3 py-1 md:hidden">
          {activeSkill && <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#e8f0fe] px-2 py-1 text-[12.5px] font-medium text-[#1a56db]"><Zap size={12} className="shrink-0" /><span className="truncate">/{activeSkill}</span></span>}
          {webSearch && !research && <Chip icon={<Globe size={12} />} label={chatgpt ? "Search" : "Web search"} onRemove={() => setWebSearch(false)} />}
          {research && <Chip icon={<Telescope size={12} />} label={chatgpt ? "Deep research" : "Research"} onRemove={() => setResearch(false)} />}
        </div>}
        <div className="flex flex-wrap items-center gap-1 px-2 pb-2 pt-1 md:px-2.5 md:pb-2.5">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { setPlusOpen((v) => !v); }} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-2 hover:bg-bg-3 md:h-8 md:w-8" title="Add files and tools">
              <Plus size={18} />
            </button>
            {plusOpen && (
              <div className={cn("mobile-popover fade-up absolute left-0 z-30 w-64 rounded-xl border border-line bg-bg p-1.5 shadow-lg shadow-black/10", menusDown ? "top-10" : "bottom-10")}>
                <button type="button" onClick={() => setPlusOpen(false)} className="ml-auto flex h-10 items-center px-3 text-[13px] md:hidden">Close tools</button>
                <MenuItem icon={<Paperclip size={15} />} label="Upload a file" onClick={() => fileInput.current?.click()} />
                <MenuItem icon={<ImageIcon size={15} />} label="Add a photo or screenshot" onClick={() => imageInput.current?.click()} />
                <div className="my-1 border-t border-line" />
                <MenuItem icon={<Globe size={15} />} label="Web search" checked={webSearch} onClick={() => setWebSearch(!webSearch)} />
                <MenuItem icon={<Telescope size={15} />} label={chatgpt ? "Deep research" : "Research"} hint="Longer, sourced report" checked={research} onClick={() => setResearch(!research)} />
                <div className="my-1 border-t border-line" />
                <MenuItem icon={<Zap size={15} />} label="Use a skill" hint="or type /" onClick={() => { setPlusOpen(false); setText("/"); ta.current?.focus(); }} />
                {chatgpt ? <MenuItem icon={<Bot size={15} />} label="Agent mode" checked={cowork} onClick={() => { setCowork(!cowork); setPlusOpen(false); }} /> : <MenuItem icon={<Brain size={15} />} label="Memory" hint={memoryOn ? "on" : "off for this chat"} checked={memoryOn} onClick={() => setMemoryOn(!memoryOn)} keep />}
                <div className="my-1 border-t border-line" />
                <div className="px-2 py-1 text-[11.5px] font-medium text-ink-3">{chatgpt ? "Apps" : "Connectors"}</div>
                {CONNECTORS.map((c) => (
                  <MenuItem key={c.id} icon={<ConnectorLogo id={c.id} size={15} />} label={c.name} checked={connectors.includes(c.id)} onClick={() => setConnector(c.id, !connectors.includes(c.id))} keep />
                ))}
                <MenuItem icon={<Cable size={15} />} label={chatgpt ? "Connect more apps" : "Manage connectors"} onClick={() => openDialog({ kind: "settings", section: "connectors" })} />
              </div>
            )}
          </div>
          {chatgpt ? <>
            <button type="button" title="Search the web" aria-pressed={webSearch} onClick={() => setWebSearch(!webSearch)} className={cn("flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-bg-3 md:h-8 md:w-8", webSearch && "bg-bg-3 text-ink")}><Globe size={19} /></button>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button type="button" title="Apps" aria-expanded={appsOpen} onClick={() => { setAppsOpen(!appsOpen); setPlusOpen(false); }} className="flex h-10 items-center gap-1 rounded-full px-2 text-ink-2 hover:bg-bg-3 md:h-8"><Cable size={19} />{connectors.length > 0 && <span className="text-xs">{connectors.length}</span>}</button>
              {appsOpen && <div className={cn("mobile-popover absolute left-0 z-30 w-64 rounded-2xl border border-line bg-bg p-2 shadow-lg", menusDown ? "top-10" : "bottom-10")}>
                <div className="flex items-center justify-between px-2 py-1 text-sm font-medium">Apps<button type="button" aria-label="Close apps" onClick={() => setAppsOpen(false)} className="p-1"><X size={15} /></button></div>
                {CONNECTORS.map((c) => <MenuItem key={c.id} icon={<ConnectorLogo id={c.id} size={16} />} label={c.name} checked={connectors.includes(c.id)} onClick={() => setConnector(c.id, !connectors.includes(c.id))} keep />)}
                <div className="my-1 border-t border-line" /><MenuItem label="Connect more apps" onClick={() => { setAppsOpen(false); openDialog({ kind: "settings", section: "connectors" }); }} />
              </div>}
            </div>
            {cowork && <Chip icon={<Bot size={13} />} label="Agent mode" onRemove={() => setCowork(false)} />}
          </> : <div className="flex shrink-0 items-center rounded-lg border border-line p-0.5 text-[13px]">
            <button type="button" onClick={() => setCowork(false)} className={cn("min-h-9 rounded-md px-2 py-1 md:min-h-0 md:px-2.5", !cowork ? "bg-bg-3 font-medium" : "text-ink-3 hover:text-ink")}>Chat</button>
            <button type="button" onClick={() => setCowork(true)} title="Hand it a task. It plans the steps and works through them with your connectors." className={cn("min-h-9 rounded-md px-2 py-1 md:min-h-0 md:px-2.5", cowork ? "bg-bg-3 font-medium" : "text-ink-3 hover:text-ink")}>Cowork</button>
          </div>}
          <div className="hidden md:contents">
            {activeSkill && <span className="ml-1 rounded-md bg-[#e8f0fe] px-2 py-1 text-[12.5px] font-medium text-[#1a56db]">/{activeSkill}</span>}
            {webSearch && !research && <Chip icon={<Globe size={12} />} label={chatgpt ? "Search" : "Web search"} onRemove={() => setWebSearch(false)} />}
            {research && <Chip icon={<Telescope size={12} />} label={chatgpt ? "Deep research" : "Research"} onRemove={() => setResearch(false)} />}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
          {!chatgpt && <ModelPicker menusDown={menusDown} />}
          <button
            type="button"
            onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
            disabled={!dictation.supported || dictation.transcribing}
            title={!dictation.supported ? "Dictation needs a microphone" : dictation.transcribing ? "Transcribing…" : dictation.listening ? "Stop and transcribe" : "Dictate"}
            className={cn("flex h-10 items-center justify-center gap-1.5 rounded-lg transition md:h-8", dictation.listening ? "bg-[#1a56db] px-2.5 text-white" : dictation.transcribing ? "w-10 text-clay md:w-8" : "w-10 text-ink-3 hover:bg-bg-3 hover:text-ink disabled:opacity-40 md:w-8")}
          >
            {dictation.transcribing ? <Loader2 size={17} className="animate-spin" /> : dictation.listening ? <><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-white" /></span><span className="text-[12.5px] font-medium">Stop</span></> : <Mic size={17} />}
          </button>
          {grading ? <span className="px-2 text-[12px] text-ink-3">Grading…</span> : <StopOrSend busy={busy} canSend={canSend} onStop={onStop} />}
          </div>
        </div>
        {locked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-bg/85 backdrop-blur-[1px]">
            <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-center text-[13px] shadow-sm md:flex-nowrap md:gap-3 md:px-4 md:py-2.5 md:text-left md:text-[13.5px]">
              <Lock size={15} className="text-ink-3" />
              <span className="text-ink-2">Free messages are used up for today. Challenges are unlimited.</span>
              <button type="button" onClick={() => openDialog({ kind: "challenges" })} className="rounded-lg bg-clay px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-clay-dark">Pick a challenge</button>
            </div>
          </div>
        )}
        <input ref={fileInput} type="file" multiple hidden accept=".txt,.md,.csv,.json,.pdf,image/*" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        <input ref={imageInput} type="file" multiple hidden accept="image/*" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </form>
      {typeof freeLeft === "number" && !locked && <div className="mt-1.5 text-center text-[12px] text-ink-3">{freeLeft} free message{freeLeft === 1 ? "" : "s"} left today outside challenges. Challenges are unlimited.</div>}

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
    <span className="ml-1 inline-flex items-center gap-1 rounded-lg border border-clay/40 bg-bg-2 px-2 py-1 text-[12.5px] text-clay-dark">
      {icon} {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="ml-0.5 flex h-7 w-7 items-center justify-center hover:text-ink md:h-auto md:w-auto">
        <X size={12} />
      </button>
    </span>
  );
}
