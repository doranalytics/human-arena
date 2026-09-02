"use client";
import { useRef, useState } from "react";
import { Camera, Check, Trash2 } from "lucide-react";
import { Dialog, Button, inputCls } from "../dialog";
import { Avatar } from "../avatar";
import { TierBadge, TIER_STYLE, type BadgeTier } from "../icons";
import { closeDialog, toast } from "@/lib/ui";
import { useStore, updateSettings, setState, totalPoints } from "@/lib/store";
import { useSession, setSession } from "@/lib/session";
import { BADGES } from "@/lib/arena/types";
import { TIERS, tierFor } from "@/lib/tiers";
import { cn } from "@/lib/utils";

/** Shrinks a picked image to a small square JPEG data URL so it fits in localStorage and a members row. */
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

/** Mounts the form fresh on every open so the draft always starts from what is saved. */
export function SettingsDialog({ open }: { open: boolean }) {
  if (!open) return null;
  return <SettingsForm />;
}

function SettingsForm() {
  const open = true;
  const settings = useStore((s) => s.settings);
  const results = useStore((s) => s.results);
  const session = useSession();
  const savedName = session.me?.name || settings.name || "";
  const savedAvatar = session.me?.avatar || settings.avatar || null;

  const [name, setName] = useState(savedName);
  const [avatar, setAvatar] = useState<string | null>(savedAvatar);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const dirty = name.trim() !== savedName.trim() || (avatar ?? null) !== (savedAvatar ?? null);
  const earned = new Set(Object.values(results).flatMap((r) => r.badges));
  const pts = totalPoints(results);
  const tier = tierFor(pts);
  const current = TIERS.find((t) => t.tier === tier) ?? null;
  const next = TIERS.find((t) => t.min > pts) ?? null;
  const floor = current?.min ?? 0;
  const progress = next ? Math.min(1, Math.max(0, (pts - floor) / (next.min - floor))) : 1;

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
    const n = name.trim().slice(0, 80);
    setSaving(true);
    updateSettings({ name: n, avatar });
    if (session.me) {
      const r = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: n, avatar }) }).catch(() => null);
      if (!r || !r.ok) {
        setSaving(false);
        return toast({ title: "Saved here, not on the board", body: "Could not reach the server. Try again in a moment.", tone: "bad" });
      }
      setSession({ me: { ...session.me, name: n || session.me.name, avatar } });
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
    <Dialog
      open={open}
      onClose={closeDialog}
      title="Customize"
      footer={
        <>
          <Button variant="ghost" onClick={closeDialog}>{dirty ? "Cancel" : "Close"}</Button>
          <Button onClick={save} disabled={!dirty || saving}>
            <Check size={14} /> {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        <section>
          <Label>Profile</Label>
          <div className="flex items-start gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} className="group relative shrink-0 rounded-full" title="Change photo">
              <Avatar name={name || savedName || "?"} src={avatar} size={72} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-bg opacity-0 transition group-hover:opacity-100">
                <Camera size={18} />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <input className={inputCls} value={name} placeholder="How you appear on the board" maxLength={80} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && dirty && void save()} />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Button variant="outline" className="h-8 px-3 text-[12.5px]" onClick={() => fileRef.current?.click()}>
                  <Camera size={13} /> {avatar ? "Change photo" : "Add a photo"}
                </Button>
                {avatar && (
                  <Button variant="ghost" className="h-8 px-2.5 text-[12.5px]" onClick={() => setAvatar(null)}>
                    <Trash2 size={13} /> Remove
                  </Button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0]).then(() => { if (fileRef.current) fileRef.current.value = ""; })} />
              </div>
              <div className="mt-1.5 text-[12px] text-ink-3">You enter the arena as yourself, working at Halden Outdoor Co. Photos are cropped square and stay small.</div>
            </div>
          </div>
        </section>

        <section>
          <Label>Level</Label>
          <div className="rounded-xl border border-line bg-bg-2/60 p-4">
            <div className="flex items-center gap-3">
              {tier === "Analog" ? <TierBadge tier="Tourist" locked size={44} /> : <TierBadge tier={tier as BadgeTier} size={44} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-[20px] font-semibold leading-none">{tier}</span>
                  <span className="text-[13px] tabular-nums text-ink-2">{pts} pts</span>
                </div>
                <div className="mt-1 text-[12.5px] text-ink-3">
                  {tier === "Analog" ? "Finish one challenge to become a Tourist." : current?.blurb}
                </div>
              </div>
              {next && (
                <div className="shrink-0 text-right">
                  <div className="text-[17px] font-semibold tabular-nums leading-none">{next.min - pts}</div>
                  <div className="mt-0.5 text-[11.5px] text-ink-3">to {next.tier}</div>
                </div>
              )}
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%`, background: TIER_STYLE[(next?.tier ?? "AI-Native") as BadgeTier].fill }} />
            </div>

            <ol className="mt-4 grid grid-cols-5 gap-1">
              {TIERS.map((t) => {
                const unlocked = pts >= t.min;
                const active = t.tier === tier;
                return (
                  <li key={t.tier} className="flex flex-col items-center text-center" title={t.blurb}>
                    <span className={cn("rounded-full bg-bg p-0.5", active && "ring-2 ring-clay ring-offset-2 ring-offset-bg-2")}>
                      <TierBadge tier={t.tier} locked={!unlocked} size={34} />
                    </span>
                    <span className={cn("mt-1.5 text-[11.5px] font-medium leading-tight", !unlocked && "text-ink-3")}>{t.tier}</span>
                    <span className={cn("text-[10.5px] tabular-nums", unlocked ? "text-ink-2" : "text-ink-3")}>{t.min === 1 ? "1st pt" : `${t.min}`}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section>
          <Label>Badges <span className="font-normal">· {[...earned].filter((id) => id in BADGES).length} of {Object.keys(BADGES).length}</span></Label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {Object.entries(BADGES).map(([id, b]) => {
              const has = earned.has(id);
              return (
                <div key={id} className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px]", has ? "border-line bg-bg" : "border-dashed border-line text-ink-3")}>
                  <span className={cn("text-[16px]", !has && "opacity-50 grayscale")}>{b.emoji}</span>
                  <span className="truncate">{b.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <Label>Which assistant do you normally use?</Label>
          <div className="flex gap-2">
            {(["claude", "chatgpt"] as const).map((p) => (
              <button key={p} disabled={p === "chatgpt"} onClick={() => updateSettings({ product: p })} className={cn("flex-1 rounded-lg border px-3 py-2 text-left text-[13.5px] disabled:opacity-50", settings.product === p ? "border-ink" : "border-line")}>
                <div className="font-medium">{p === "claude" ? "Claude" : "ChatGPT"}</div>
                <div className="text-[12px] text-ink-3">{p === "claude" ? "The arena looks like Claude" : "Skin coming next"}</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <Label>Account</Label>
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
            <div className="flex gap-2">
              <input className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={signIn} disabled={busy || !email}>Email me a link</Button>
            </div>
          )}
        </section>

        <section>
          <Label>Local data</Label>
          <Button
            variant="danger"
            onClick={() => {
              if (!confirm("Clear chats, projects, skills and local results in this browser?")) return;
              setState({ chats: [], projects: [], skills: [], connectors: [], attempt: null, results: {}, activeChatId: null, activeProjectId: null });
              toast({ title: "Cleared", tone: "info" });
            }}
          >
            Clear everything in this browser
          </Button>
        </section>
      </div>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[12px] font-medium text-ink-3">{children}</div>;
}
