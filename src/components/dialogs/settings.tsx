"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Trash2, X, Settings as Gear, CircleUser, Zap, Cable, Brain, Plus, SlidersHorizontal } from "lucide-react";
import { Button, inputCls } from "../dialog";
import { Avatar } from "../avatar";
import { ConnectorLogo } from "../connector-logos";
import { IconLinkedIn, IconX } from "../icons";
import { closeDialog, openDialog, toast, type SettingsSection } from "@/lib/ui";
import { useStore, updateSettings, setState, removeMemory, track, createSkill, deleteSkill, setConnector } from "@/lib/store";
import { useSession, setSession } from "@/lib/session";
import { BUILTIN_SKILLS } from "@/lib/skills";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && closeDialog()}>
      <div role="dialog" aria-modal className={cn("fade-up flex h-[86vh] w-full overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl shadow-black/10", single ? "max-w-2xl" : "max-w-4xl")}>
        {!single && (
          <aside className="flex w-[220px] shrink-0 flex-col border-r border-line bg-side p-3">
            <div className="mb-1 px-2 text-[11.5px] font-medium text-ink-3">{group.group}</div>
            {items.map((i) => (
              <button key={i.id} onClick={() => openDialog({ kind: "settings", section: i.id })} className={cn("flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13.5px] hover:bg-bg-3", section === i.id && "bg-bg-3 font-medium")}>
                <span className="text-ink-2">{i.icon}</span> {i.label}
              </button>
            ))}
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <div className="text-[16px] font-medium">{TITLE[section]}</div>
            <button onClick={closeDialog} className="rounded-lg p-1.5 text-ink-2 hover:bg-bg-3" aria-label="Close"><X size={16} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
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
  return (
    <div className="space-y-7">
      <section>
        <Label>Local data</Label>
        <div className="mb-2 text-[13px] text-ink-2">Chats, projects, skills, memories and results live in this browser until you sign in.</div>
        <Button
          variant="danger"
          onClick={() => {
            if (!confirm("Clear chats, projects, skills, memories and local results in this browser?")) return;
            setState((s) => ({ chats: [], projects: [], skills: [], connectors: [], attempt: null, results: {}, activeChatId: null, activeProjectId: null, settings: { ...s.settings, memories: [] } }));
            toast({ title: "Cleared", tone: "info" });
          }}
        >
          Clear everything in this browser
        </Button>
      </section>
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
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

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
  async function signIn() {
    setBusy(true);
    const r = await fetch("/api/auth/signin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const j = (await r.json()) as { error?: string };
    setBusy(false);
    if (!r.ok) return toast({ title: "Could not send the link", body: j.error, tone: "bad" });
    setSent(true);
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
        <Label>Sign-in</Label>
        {session.me ? (
          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13.5px]">
            <span>Signed in as <span className="font-medium">{session.me.email}</span>. Scores are saved to the board.</span>
            <form action="/auth/signout" method="post"><Button type="submit" variant="ghost">Sign out</Button></form>
          </div>
        ) : !session.configured ? (
          <div className="rounded-lg border border-line px-3 py-2 text-[13px] text-ink-2">Sign-in is off on this deployment. Your progress lives in this browser.</div>
        ) : sent ? (
          <div className="rounded-lg border border-ok/40 px-3 py-2 text-[13px]">Check {email} for a sign-in link.</div>
        ) : (
          <>
          <form
            className="flex items-stretch gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email && !busy) void signIn();
            }}
          >
            <input className={cn(inputCls, "h-10 flex-1")} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" className="h-10 shrink-0 whitespace-nowrap px-4" disabled={busy || !email}>{busy ? "Sending…" : "Email me a link"}</Button>
          </form>
          <div className="mt-1.5 text-[12px] text-ink-3">No password. We send a one-tap link, and your scores start saving to the board.</div>
          </>
        )}
      </section>
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
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [prompt, setPrompt] = useState("");
  const slug = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  const taken = [...BUILTIN_SKILLS, ...custom].some((s) => s.name === slug);
  const rows = [
    ...custom.map((s) => ({ id: s.id, name: s.name, desc: s.description, date: fmtShort(s.createdAt), author: "You", custom: true })),
    ...BUILTIN_SKILLS.map((s) => ({ id: s.id, name: s.name, desc: s.description, date: "9/2/26", author: "Human Arena", custom: false })),
  ];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-[13px] text-ink-2">Type <span className="rounded bg-bg-3 px-1 font-mono text-[12px]">/name</span> in the message box to use one.</div>
        <Button variant="outline" onClick={() => setCreating((v) => !v)}><Plus size={14} /> Add</Button>
      </div>
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
      <div className="grid grid-cols-[1fr_110px_120px_32px] items-center gap-2 border-b border-line pb-2 text-[12.5px] text-ink-3">
        <span>Skill</span><span>Last updated</span><span>Author</span><span />
      </div>
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-[1fr_110px_120px_32px] items-center gap-2 border-b border-line py-3 text-[14px]">
          <div className="min-w-0"><div className="truncate font-medium">{r.name}</div><div className="truncate text-[12.5px] text-ink-3">{r.desc}</div></div>
          <span className="text-ink-2 tabular-nums">{r.date}</span>
          <span className="text-ink-2">{r.author}</span>
          {r.custom ? <button onClick={() => deleteSkill(r.id)} className="justify-self-end rounded p-1 text-ink-3 hover:bg-bg-3 hover:text-bad" title="Delete"><Trash2 size={14} /></button> : <span />}
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
      <div className="mb-3 text-[13px] text-ink-2">Give the assistant access to your work at Halden. Everything here is simulated: connecting cannot email anyone, delete anything, or touch your real accounts.</div>
      <div className="space-y-2">
        {CONNECTORS.map((c) => {
          const active = on.includes(c.id);
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white"><ConnectorLogo id={c.id} size={24} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium">{c.name} <span className="text-[12px] font-normal text-ink-3">· {c.vendor}</span></div>
                <div className="text-[12.5px] text-ink-2">{c.blurb}</div>
              </div>
              <Button
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
  const memories = useStore((s) => s.settings.memories ?? []);
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
