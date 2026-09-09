"use client";
import { TESTING_MODE } from "@/lib/testing-mode";
import { SubscriptionCard } from "../subscription-card";
import { EmailSignIn } from "../email-signin";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Trash2, X, Settings as Gear, CircleUser, Zap, Cable, Brain, Plus, SlidersHorizontal } from "lucide-react";
import { Button, inputCls } from "../dialog";
import { Avatar } from "../avatar";
import { ConnectorLogo } from "../connector-logos";
import { IconLinkedIn, IconX } from "../icons";
import { closeDialog, openDialog, toast, type SettingsSection } from "@/lib/ui";
import { useStore, updateSettings, clearWorkspace, removeMemory, track, createSkill, deleteSkill, setConnector } from "@/lib/store";
import { useSession, setSession } from "@/lib/session";
import { BUILTIN_SKILLS, SKILL_CATALOGUE } from "@/lib/skills";
import { CONNECTORS } from "@/lib/connectors";
import { xHandle, linkedinSlug, xUrl, linkedinUrl } from "@/lib/social";
import { cn } from "@/lib/utils";

/** Three windows share one component: Settings (personal), Customize (what the assistant can do), Progress (standalone). */
const NAV: { group: string; items: { id: SettingsSection; label: string; icon: React.ReactNode }[] }[] = [
  {
    group: "Settings",
    items: [
      { id: "account", label: "Account", icon: <CircleUser size={16} /> },
      { id: "general", label: "General", icon: <Gear size={16} /> },
    ],
  },
  {
    group: "Customize",
    items: [
      { id: "instructions", label: "Instructions", icon: <SlidersHorizontal size={16} /> },
      { id: "skills", label: "Skills", icon: <Zap size={16} /> },
      { id: "connectors", label: "Connectors", icon: <Cable size={16} /> },
      { id: "memory", label: "Memory", icon: <Brain size={16} /> },
    ],
  },
];
const groupOf = (section: SettingsSection) => NAV.find((g) => g.items.some((i) => i.id === section)) ?? NAV[0];
const TITLE: Record<SettingsSection, string> = { general: "General", account: "Account", instructions: "Instructions", skills: "Skills", connectors: "Connectors", memory: "Memory" };

/** Two-pane settings window in the desktop-app style: Settings on top, Customize below. */
export function SettingsDialog({ section }: { section: SettingsSection }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDialog();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const group = groupOf(section);
  const items = group.items;
  const single = group.items.length === 1;
  return (
    <div className="viewport-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 md:p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && closeDialog()}>
      <div role="dialog" aria-modal className={cn("fade-up flex h-full md:h-[84%] w-full overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl shadow-black/10", single ? "max-w-2xl" : "max-w-4xl")}>
        {!single && (
          <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-line bg-side p-3">
            <div className="mb-1 px-2 text-[11.5px] font-medium text-ink-3">{group.group}</div>
            {items.map((i) => (
              <button key={i.id} onClick={() => openDialog({ kind: "settings", section: i.id })} className={cn("flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13.5px] hover:bg-bg-3", section === i.id && "bg-bg-3 font-medium")}>
                <span className="text-ink-2">{i.icon}</span> {i.label}
              </button>
            ))}
          </aside>
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2 md:px-6 md:py-4">
            <div className="text-[16px] font-medium">{TITLE[section]}</div>
            <button onClick={closeDialog} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-bg-3 md:h-7 md:w-7" aria-label="Close"><X size={16} /></button>
          </div>
          <nav aria-label={group.group} className="mb-4 flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 md:hidden">
            {items.map((i) => <button key={i.id} aria-current={section === i.id ? "page" : undefined} onClick={() => openDialog({ kind: "settings", section: i.id })} className={cn("min-h-11 shrink-0 border-b-2 px-2 text-[13px]", section === i.id ? "border-clay font-medium text-ink" : "border-transparent text-ink-2")}>{i.label}</button>)}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-6">
            {section === "general" && <General />}
            {section === "instructions" && <Instructions />}
            {section === "account" && <Account />}
            {section === "skills" && <Skills />}
            {section === "connectors" && <Connectors />}
            {section === "memory" && <Memory />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-medium text-ink-3">{children}</div>;
}

/* ------------------------------------------------------------------ general */
function General() {
  const [confirming, setConfirming] = useState<"chats" | "workspace" | null>(null);
  const busy = useStore((s) => s.busyChatIds.length > 0 || s.grading);
  const chatCount = useStore((s) => s.chats.filter((c) => !c.draft).length);
  return (
    <div className="space-y-7">
      <section>
        <Label>Onboarding</Label>
        <p className="mb-3 text-sm leading-relaxed text-ink-2">Review your choices or walk through the introduction again. Your lesson progress stays saved.</p>
        <Button variant="outline" onClick={() => openDialog({ kind: "onboarding" })}>Review onboarding</Button>
      </section>
      <section>
        <Label>Chats and tasks in this browser</Label>
        <p className="mb-3 text-sm leading-relaxed text-ink-2">Clear old conversations and stop the running challenge. Your account, lesson progress, scores, and streaks stay saved.</p>
        <Button variant="outline" disabled={busy} onClick={() => setConfirming("chats")}><Trash2 size={15} /> Clear chats and tasks{chatCount > 0 ? ` (${chatCount})` : ""}</Button>
      </section>
      <section>
        <Label>Reset practice workspace</Label>
        <p className="mb-3 text-sm leading-relaxed text-ink-2">Also remove projects, groups, schedules, custom skills, connector selections, instructions, and memories from this browser. Your account and earned progress stay saved.</p>
        <Button variant="outline" disabled={busy} onClick={() => setConfirming("workspace")}>Reset practice workspace</Button>
      </section>
      {busy && <p role="status" className="text-sm text-ink-2">Wait for the current response or grading to finish before clearing.</p>}
      {confirming && <section className="rounded-xl border border-line-2 bg-bg-2 p-4" aria-label="Confirm clearing browser data">
        <p className="font-medium">{confirming === "chats" ? "Clear chats and tasks?" : "Reset this practice workspace?"}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{confirming === "chats" ? "These conversations will be removed from this browser. The running challenge will end without a score." : "The browser workspace listed above will be removed, including its conversations. This cannot be undone."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="danger" disabled={busy} onClick={() => {
            if (!clearWorkspace(confirming)) return;
            setConfirming(null);
            toast({ title: confirming === "chats" ? "Chats and tasks cleared" : "Practice workspace reset", body: "Your account and earned progress are still saved.", tone: "ok" });
          }}>Clear now</Button>
          <Button variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
        </div>
      </section>}
    </div>
  );
}

/* ------------------------------------------------------------ instructions */
function Instructions() {
  const settings = useStore((s) => s.settings);
  const saved = settings.instructions || "";
  const [instructions, setInstructions] = useState(saved);
  const dirty = instructions.trim() !== saved.trim();
  function save() {
    const ins = instructions.trim().slice(0, 2000);
    updateSettings({ instructions: ins });
    if (ins) track("instructions_set");
    toast({ title: "Saved", tone: "info" });
  }
  return (
    <div className="space-y-4">
      <div className="text-[13px] text-ink-2">Standing rules the assistant follows in every chat: what to call you, how long to be, what to always or never do.</div>
      <textarea className={cn(inputCls, "min-h-[120px] resize-y leading-relaxed")} value={instructions} maxLength={2000} placeholder={"For example: call me Captain. Keep answers short. End each reply with a question."} onChange={(e) => setInstructions(e.target.value)} />
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-ink-3">Applied on top of any project instructions.</div>
        <Button onClick={save} disabled={!dirty}><Check size={14} /> Save</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ account */
function shrink(file: File, px = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = px;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, px, px);
      URL.revokeObjectURL(url);
      try {
        resolve(c.toDataURL("image/jpeg", 0.82));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = url;
  });
}

function Account() {
  const settings = useStore((s) => s.settings);
  const session = useSession();
  const savedName = session.me?.name || settings.name || "";
  const savedAvatar = session.me?.avatar || settings.avatar || null;
  const savedLinkedin = session.me?.linkedin || settings.linkedin || "";
  const savedX = session.me?.x || settings.x || "";
  const [name, setName] = useState(savedName);
  const [avatar, setAvatar] = useState<string | null>(savedAvatar);
  const [linkedin, setLinkedin] = useState(savedLinkedin);
  const [x, setX] = useState(savedX);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const liSlug = linkedinSlug(linkedin);
  const xH = xHandle(x);
  const liBad = linkedin.trim() !== "" && !liSlug;
  const xBad = x.trim() !== "" && !xH;
  const liFinal = liSlug ? linkedinUrl(liSlug) : "";
  const xFinal = xH ? xUrl(xH) : "";
  const dirty = name.trim() !== savedName.trim() || (avatar ?? null) !== (savedAvatar ?? null) || liFinal !== savedLinkedin || xFinal !== savedX;

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast({ title: "Pick an image file", tone: "bad" });
    try {
      setAvatar(await shrink(file));
    } catch {
      toast({ title: "Could not read that image", tone: "bad" });
    }
  }
  async function save() {
    if (liBad || xBad) return toast({ title: liBad ? "That LinkedIn link does not look right" : "That X handle does not look right", body: liBad ? "Paste your profile URL, like linkedin.com/in/you." : "Letters, numbers and underscores, up to 15.", tone: "bad" });
    const n = name.trim().slice(0, 80);
    setSaving(true);
    updateSettings({ name: n, avatar, linkedin: liFinal || undefined, x: xFinal || undefined });
    if (session.me) {
      const r = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: n, avatar, linkedin: liFinal || null, x: xFinal || null }) }).catch(() => null);
      if (!r || !r.ok) {
        setSaving(false);
        return toast({ title: "Saved here, not on the board", body: "Could not reach the server. Try again in a moment.", tone: "bad" });
      }
      setSession({ me: { ...session.me, name: n || session.me.name, avatar, linkedin: liFinal || null, x: xFinal || null } });
    }
    setSaving(false);
    toast({ title: "Profile saved", tone: "info" });
  }


  return (
    <div className="space-y-7">
      <section>
        <Label>Profile</Label>
        <div className="flex items-start gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="group relative shrink-0 rounded-full" title="Change photo">
            <Avatar name={name || savedName || "?"} src={avatar} size={72} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-bg opacity-0 transition group-hover:opacity-100"><Camera size={18} /></span>
          </button>
          <div className="min-w-0 flex-1">
            <input className={inputCls} value={name} placeholder="How you appear on the board" maxLength={80} onChange={(e) => setName(e.target.value)} />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Button variant="outline" className="h-8 px-3 text-[12.5px]" onClick={() => fileRef.current?.click()}><Camera size={13} /> {avatar ? "Change photo" : "Add a photo"}</Button>
              {avatar && <Button variant="ghost" className="h-8 px-2.5 text-[12.5px]" onClick={() => setAvatar(null)}><Trash2 size={13} /> Remove</Button>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0]).then(() => { if (fileRef.current) fileRef.current.value = ""; })} />
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#0A66C2] text-white"><IconLinkedIn size={10} /></span>
            <input className={cn(inputCls, "pl-10", liBad && "border-bad")} value={linkedin} placeholder="linkedin.com/in/you" onChange={(e) => setLinkedin(e.target.value)} />
          </label>
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-bg"><IconX size={9} /></span>
            <input className={cn(inputCls, "pl-10", xBad && "border-bad")} value={x} placeholder="@handle" onChange={(e) => setX(e.target.value)} />
          </label>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-[12px] text-ink-3">Links show next to your name on the leaderboard. Paste a URL or a handle.</div>
          <Button onClick={save} disabled={!dirty || saving}><Check size={14} /> {saving ? "Saving…" : "Save"}</Button>
        </div>
      </section>
      <section>
        <Label>{TESTING_MODE ? "Testing session" : "Sign-in"}</Label>
        {TESTING_MODE ? <p className="rounded-lg border border-line bg-bg-2 px-3 py-3 text-[13px] leading-relaxed text-ink-2">No signup needed while we’re testing. {session.me?.guest ? "Your scores and streaks are saved for this browser. Use the same browser to keep your progress." : "Your existing account and progress are still saved."}</p> : session.me ? (
          <div className="flex flex-col items-start justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[13.5px] md:flex-row md:items-center">
            <span className="min-w-0">Signed in as <span className="break-all font-medium">{session.me.email}</span>. Scores are saved to the board.</span>
            <form action="/auth/signout" method="post"><Button type="submit" variant="ghost">Sign out</Button></form>
          </div>
        ) : !session.configured ? (
          <div className="rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2">Sign-in is off on this deployment. Your progress lives in this browser.</div>
        ) : <EmailSignIn />}
      </section>
      <SubscriptionCard />
    </div>
  );
}

/* ------------------------------------------------------------------- skills */
function fmtShort(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

function Skills() {
  const custom = useStore((s) => s.skills);
  const [creating, setCreating] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [prompt, setPrompt] = useState("");
  const slug = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const taken = [...BUILTIN_SKILLS, ...custom].some((s) => s.name === slug);
  const rows = [
    ...custom.map((s) => ({ id: s.id, name: s.name, desc: s.description, prompt: s.prompt, date: fmtShort(s.createdAt), author: "You", custom: true })),
    ...BUILTIN_SKILLS.map((s) => ({ id: s.id, name: s.name, desc: s.description, prompt: s.prompt, date: "9/2/26", author: "How to AI Games", custom: false })),
  ];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] text-ink-2">Type <span className="rounded bg-bg-3 px-1 font-mono text-[12px]">/name</span> in the message box to use one.</div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" onClick={() => { setBrowsing((v) => !v); setCreating(false); }}>Browse</Button>
          <Button variant="outline" onClick={() => { setCreating((v) => !v); setBrowsing(false); }}><Plus size={14} /> Add</Button>
        </div>
      </div>
      {browsing && (
        <div className="mb-4 rounded-xl border border-line p-3">
          <div className="mb-2 text-[13px] font-medium">Catalogue</div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {SKILL_CATALOGUE.map((k) => {
              const have = [...BUILTIN_SKILLS, ...custom].some((s) => s.name === k.name);
              return (
                <div key={k.name} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2">
                  <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-medium">/{k.name}</div><div className="truncate text-[12px] text-ink-3">{k.description}</div></div>
                  <Button variant={have ? "ghost" : "outline"} className="h-7 px-2.5 text-[12px]" onClick={() => { if (!have) createSkill({ name: k.name, description: k.description, prompt: k.prompt }); track("skill_added", k.name); toast({ title: `/${k.name} added`, body: "Type it in the message box to use it.", tone: "ok" }, 3000); }}>{have ? "Use this skill" : "Add"}</Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {creating && (
        <div className="mb-4 space-y-2 rounded-xl border border-line p-3">
          <div className="text-[13px] font-medium">New skill</div>
          <input autoFocus className={inputCls} placeholder="Name, e.g. weekly-summary" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputCls} placeholder="One line: what it is for" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <textarea className={inputCls} rows={5} placeholder="The instructions the assistant follows when you invoke it" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <div className="flex items-center justify-end gap-2">
            {taken && <span className="mr-auto text-[12px] text-bad">That name is taken.</span>}
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
        </div>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_32px] md:grid-cols-[minmax(0,1fr)_90px_110px_32px] items-center gap-2 border-b border-line pb-2 text-[12.5px] text-ink-3">
        <span>Skill</span><span className="hidden md:block">Last updated</span><span className="hidden md:block">Author</span><span />
      </div>
      {rows.map((r) => (
        <div key={r.id} className="border-b border-line">
          <div role="button" tabIndex={0} onClick={() => setOpenId(openId === r.id ? null : r.id)} onKeyDown={(e) => e.key === "Enter" && setOpenId(openId === r.id ? null : r.id)} className="grid cursor-pointer grid-cols-[minmax(0,1fr)_32px] md:grid-cols-[minmax(0,1fr)_90px_110px_32px] items-center gap-2 py-3 text-[14px] hover:bg-bg-2/60">
            <div className="min-w-0"><div className="truncate font-medium">/{r.name}</div><div className="truncate text-[12.5px] text-ink-3">{r.desc}</div></div>
            <span className="hidden text-ink-2 tabular-nums md:block">{r.date}</span>
            <span className="hidden text-ink-2 md:block">{r.author}</span>
            {r.custom ? <button onClick={(e) => { e.stopPropagation(); deleteSkill(r.id); }} className="justify-self-end rounded p-1 text-ink-3 hover:bg-bg-3 hover:text-bad" title="Delete"><Trash2 size={14} /></button> : <span />}
          </div>
          {openId === r.id && (
            <div className="mb-3 rounded-lg bg-bg-2 px-3.5 py-3 text-[13px] leading-relaxed text-ink-2">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-3">What it tells the assistant</div>
              {r.prompt}
              <div className="mt-2 text-[12px] text-ink-3">Use it by typing <span className="rounded bg-bg-3 px-1 font-mono">/{r.name}</span> in the message box.</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- connectors */
function Connectors() {
  const on = useStore((s) => s.connectors);
  return (
    <div>
      <div className="mb-3 text-[13px] text-ink-2">Practice connecting sample inboxes, files and data. These connectors use training data and never access your real accounts.</div>
      <div className="space-y-2">
        {CONNECTORS.map((c) => {
          const active = on.includes(c.id);
          return (
            <div key={c.id} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-line px-3.5 py-3 md:flex">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white"><ConnectorLogo id={c.id} size={24} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium">{c.name}{c.vendor && <span className="text-[12px] font-normal text-ink-3"> · {c.vendor}</span>}</div>
                <div className="text-[12.5px] text-ink-2">{c.blurb}</div>
              </div>
              <Button
                className="col-start-2 justify-self-start"
                variant={active ? "outline" : "primary"}
                onClick={() => {
                  setConnector(c.id, !active);
                  toast({ title: active ? `${c.name} disconnected` : `${c.name} connected`, body: active ? undefined : "The assistant can use it in your next message.", tone: "ok" }, 3000);
                }}
              >
                {active ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- memory */
function Memory() {
  const memories = useStore((s) => s.settings.memories) ?? [];
  return (
    <div>
      <div className="mb-3 text-[13px] text-ink-2">Facts the assistant has been told to remember. Every new chat starts knowing them.</div>
      {memories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-4 py-5 text-center"><Brain size={22} className="mx-auto text-ink-3" /><div className="mt-2 text-[14px] font-medium">Nothing remembered yet</div><div className="mx-auto mt-1 max-w-[36ch] text-[13px] text-ink-2">In any chat, say &ldquo;remember that my favourite trail is the Timberline Trail.&rdquo; It lands here, and every new chat knows it.</div></div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {memories.map((m) => (
            <li key={m} className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
              <span className="min-w-0 flex-1">{m}</span>
              <button onClick={() => removeMemory(m)} className="rounded p-1 text-ink-3 hover:bg-bg-3 hover:text-bad" title="Forget"><X size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
