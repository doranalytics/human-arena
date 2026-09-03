"use client";
import { useState } from "react";
import { Swords, Trophy, Timer, ArrowRight } from "lucide-react";
import { Button } from "../dialog";
import { updateSettings } from "@/lib/store";
import { openDialog } from "@/lib/ui";
import { Logo } from "../icons";

const SCREENS = [
  {
    icon: <Logo size={44} tile />,
    title: "Welcome to Human Arena",
    body: "A safe copy of a modern AI assistant where you learn by doing. Nothing here is real, so you can click anything, break nothing, and find out what these tools can actually do.",
  },
  {
    icon: <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay text-white"><Swords size={22} /></span>,
    title: "Challenges teach one skill each",
    body: "Pick a challenge, the clock starts, and everything you need appears above the message box. Make the move, and the arena checks what you did. Hints cost a little, quitting costs nothing.",
  },
  {
    icon: <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2c2b28] text-bg"><Trophy size={22} /></span>,
    title: "Points, levels, and a weekly winner",
    body: "Every pass earns points and unlocks a skill. Points move you from Tourist toward AI-Native. Top of the weekly board goes in front of a million people on Ruben\u2019s LinkedIn.",
  },
];

/** First visit: three screens, then straight into the first challenge. */
export function OnboardingDialog() {
  const [i, setI] = useState(0);
  const last = i === SCREENS.length - 1;
  const s = SCREENS[i];
  function finish(startFirst: boolean) {
    updateSettings({ onboarded: true });
    if (startFirst) openDialog({ kind: "brief", slug: "ten-words" });
    else openDialog({ kind: "challenges" });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-modal className="fade-up w-full max-w-md overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl shadow-black/20">
        <div className="px-7 pb-2 pt-8">
          {s.icon}
          <h1 className="mt-5 font-serif text-[28px] leading-tight">{s.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
        </div>
        <div className="flex items-center justify-between px-7 pb-6 pt-4">
          <div className="flex items-center gap-1.5">
            {SCREENS.map((_, k) => <span key={k} className={"h-1.5 rounded-full transition-all " + (k === i ? "w-5 bg-clay" : "w-1.5 bg-line-2")} />)}
          </div>
          <div className="flex items-center gap-2">
            {!last && <Button variant="ghost" onClick={() => finish(false)}>Skip</Button>}
            {last ? (
              <Button className="bg-clay hover:bg-clay-dark" onClick={() => finish(true)}><Timer size={14} /> Start your first challenge</Button>
            ) : (
              <Button onClick={() => setI(i + 1)}>Next <ArrowRight size={14} /></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
