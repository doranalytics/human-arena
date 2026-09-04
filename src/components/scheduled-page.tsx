"use client";
import { Clock, Play, Trash2, Workflow } from "lucide-react";
import { useStore, runSchedule, deleteSchedule, openChat } from "@/lib/store";
import { setPage } from "@/lib/ui";
import { relTime } from "@/lib/utils";

const CADENCE = { hourly: "Every hour", daily: "Every day", weekly: "Every week" } as const;

/** Scheduled Cowork tasks and their runs. Runs happen when you press Run now (the arena does not run clocks in the background). */
export function ScheduledPage() {
  const schedules = useStore((s) => s.schedules);
  const chats = useStore((s) => s.chats);
  return (
    <div className="mx-auto w-full max-w-[900px] px-8 py-10">
      <h1 className="font-serif text-[34px] font-normal tracking-tight">Scheduled</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">Cowork tasks that run on a schedule. In the arena they run when you press Run now.</p>
      {schedules.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-3 text-ink-2"><Clock size={20} /></span>
          <div className="mt-3 font-serif text-[22px]">Nothing scheduled yet.</div>
          <div className="mt-1 max-w-[44ch] text-[13.5px] text-ink-2">Switch the composer to Cowork, type a task, and use Schedule to run it hourly, daily or weekly.</div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {schedules.map((sc) => (
            <div key={sc.id} className="rounded-2xl border border-line bg-bg p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-3 text-ink-2"><Workflow size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium">{sc.name}</div>
                  <div className="mt-0.5 text-[12.5px] text-ink-3">{CADENCE[sc.cadence]} · {sc.runs.length} run{sc.runs.length === 1 ? "" : "s"}</div>
                  <div className="mt-2 rounded-lg bg-bg-2 px-3 py-2 text-[13px] text-ink-2">{sc.prompt}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => { const c = runSchedule(sc.id); if (c) { setPage(null); openChat(c.id); } }} className="flex h-8 items-center gap-1.5 rounded-lg bg-ink px-3 text-[12.5px] font-medium text-bg hover:bg-black"><Play size={13} /> Run now</button>
                  <button onClick={() => deleteSchedule(sc.id)} className="rounded-lg p-1.5 text-ink-3 hover:bg-bg-3 hover:text-bad" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              {sc.runs.length > 0 && (
                <div className="mt-3 divide-y divide-line border-t border-line">
                  {sc.runs.slice(0, 5).map((r) => {
                    const c = chats.find((x) => x.id === r.chatId);
                    return (
                      <button key={r.at} onClick={() => { if (c) { setPage(null); openChat(c.id); } }} className="flex w-full items-center gap-3 py-2 text-left text-[13px] hover:bg-bg-2/60">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-ok" />
                        <span className="min-w-0 flex-1 truncate">{c ? c.title : "Run"}</span>
                        <span className="text-ink-3">{relTime(r.at)} ago</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
