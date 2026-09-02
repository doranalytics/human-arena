"use client";
import { useState } from "react";
import { Dialog, Button, inputCls } from "../dialog";
import { closeDialog, toast } from "@/lib/ui";
import { useStore, updateSettings, setState, totalPoints } from "@/lib/store";
import { useSession } from "@/lib/session";
import { BADGES } from "@/lib/arena/types";
import { TIERS, tierFor } from "@/lib/tiers";
import { cn } from "@/lib/utils";

export function SettingsDialog({ open }: { open: boolean }) {
  const settings = useStore((s) => s.settings);
  const results = useStore((s) => s.results);
  const session = useSession();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const earned = new Set(Object.values(results).flatMap((r) => r.badges));
  const pts = totalPoints(results);
  const tier = tierFor(pts);
  const next = TIERS.find((t) => t.min > pts);

  async function saveName(name: string) {
    updateSettings({ name });
    if (session.me) await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }).catch(() => null);
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
    <Dialog open={open} onClose={closeDialog} title="Customize">
      <div className="space-y-6">
        <section>
          <Label>Your name</Label>
          <input className={inputCls} defaultValue={session.me?.name || settings.name} placeholder="How you appear on the board" onBlur={(e) => void saveName(e.target.value.trim())} />
          <div className="mt-1 text-[12px] text-ink-3">You enter the arena as yourself, working at Halden Outdoor Co.</div>
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
          <Label>Badges</Label>
          <div className="mb-2 text-[13px] text-ink-2">
            <span className="font-medium text-ink">{tier}</span> · {pts} points{next ? ` · ${next.min - pts} to ${next.tier}` : " · top tier"}
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {Object.entries(BADGES).map(([id, b]) => (
              <div key={id} className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px]", earned.has(id) ? "border-line bg-bg" : "border-dashed border-line text-ink-3 opacity-70")}>
                <span className={cn("text-[16px]", !earned.has(id) && "grayscale")}>{b.emoji}</span> {b.name}
              </div>
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
