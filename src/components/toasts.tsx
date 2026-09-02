"use client";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={cn("fade-up pointer-events-auto flex gap-2.5 rounded-xl border bg-bg px-3.5 py-3 shadow-lg shadow-black/10", t.tone === "ok" ? "border-ok/40" : t.tone === "bad" ? "border-bad/40" : "border-line")}>
          {t.tone === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" /> : t.tone === "bad" ? <XCircle size={18} className="mt-0.5 shrink-0 text-bad" /> : <Info size={18} className="mt-0.5 shrink-0 text-ink-2" />}
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium">{t.title}</div>
            {t.body && <div className="mt-0.5 text-[12.5px] text-ink-2">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
