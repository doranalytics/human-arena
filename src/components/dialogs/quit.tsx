"use client";
import { Flag, X } from "lucide-react";
import { Dialog, Button } from "../dialog";
import { closeDialog, toast } from "@/lib/ui";
import { useStore, endAttempt } from "@/lib/store";
import { getChallenge } from "@/lib/arena/challenges";

/** Quit the running challenge. Nothing is scored; the chats stay. */
export function QuitDialog() {
  const attempt = useStore((s) => s.attempt);
  const c = attempt ? getChallenge(attempt.slug) : null;
  if (!attempt || !c) return null;
  return (
    <Dialog
      open
      onClose={closeDialog}
      footer={
        <>
          <Button variant="ghost" onClick={closeDialog}>Keep going</Button>
          <Button
            className="bg-bad text-white hover:bg-[#a83a0a]"
            onClick={() => {
              endAttempt();
              closeDialog();
              toast({ title: "Challenge quit", body: `${c.title} was not scored. Start it again any time.`, tone: "info" }, 4000);
            }}
          >
            <X size={14} /> Quit challenge
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bad/10 text-bad"><Flag size={20} /></span>
        <div>
          <div className="font-serif text-[22px] leading-tight">Quit {c.title}?</div>
          <div className="mt-2 text-[14px] leading-relaxed text-ink-2">The clock stops and nothing is scored. Your chats stay where they are, and you can start this challenge again whenever you like.</div>
          <div className="mt-3 text-[12.5px] text-ink-3">Stuck instead? Use a Hint from the top bar. Each one costs 15 percent of the points, quitting costs all of them.</div>
        </div>
      </div>
    </Dialog>
  );
}
