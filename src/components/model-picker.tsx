"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useStore, updateSettings } from "@/lib/store";
import { MODELS, EFFORTS, type ModelChoice, type Effort } from "@/lib/models";
import { cn } from "@/lib/utils";

export function ModelPicker({ header = false, menusDown = false }: { header?: boolean; menusDown?: boolean }) {
  const settings = useStore((s) => s.settings);
  const [modelOpen, setModelOpen] = useState(false);
  const [effortOpen, setEffortOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const click = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setModelOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setModelOpen(false); };
    document.addEventListener("pointerdown", click); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", click); document.removeEventListener("keydown", key); };
  }, []);
  const modelLabel = `${MODELS[settings.model].label} ${EFFORTS[settings.effort].label}`;
  return <div ref={root} className="min-w-0">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { setModelOpen((v) => !v); setEffortOpen(false); }} className={cn("flex h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] hover:bg-bg-2 md:h-9 md:px-3", modelOpen && "bg-bg-2")} title="Model and effort" aria-expanded={modelOpen} aria-label={`${modelLabel}: model and effort`}>
              <span className="font-medium">{header && "ChatGPT "}{MODELS[settings.model].label}</span>
              {header ? <ChevronDown size={15} /> : <span className="hidden text-ink-3 md:inline">{EFFORTS[settings.effort].label}</span>}
            </button>
            {modelOpen && (
              <div className={cn("mobile-popover fade-up absolute z-30 w-72 rounded-2xl border border-line bg-bg p-1.5 shadow-lg shadow-black/10", menusDown ? "top-11 left-0" : "bottom-11 right-0")}>
                <button type="button" onClick={() => setModelOpen(false)} className="ml-auto flex h-10 items-center px-3 text-[13px] md:hidden">Close models</button>
                {(Object.keys(MODELS) as ModelChoice[]).map((k) => (
                  <button key={k} type="button" onClick={() => { updateSettings({ model: k }); setModelOpen(false); }} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-bg-2">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{MODELS[k].label}</span>
                      <span className="block text-[13px] text-ink-3">{MODELS[k].blurb}</span>
                    </span>
                    {settings.model === k && <Check size={16} className="mt-1 shrink-0 text-clay" />}
                  </button>
                ))}
                <div className="my-1.5 border-t border-line" />
                <button type="button" onClick={() => setEffortOpen((v) => !v)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] hover:bg-bg-2">
                  <span>Effort</span>
                  <span className="flex items-center gap-1 text-ink-3">{EFFORTS[settings.effort].label} <ChevronDown size={15} className={cn("transition", effortOpen && "rotate-180")} /></span>
                </button>
                {effortOpen && (
                  <div className="pb-1">
                    {(Object.keys(EFFORTS) as Effort[]).map((k) => (
                      <button key={k} type="button" onClick={() => { updateSettings({ effort: k }); setModelOpen(false); setEffortOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-bg-2">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium">{EFFORTS[k].label}</span>
                          <span className="block text-[12.5px] text-ink-3">{EFFORTS[k].blurb}</span>
                        </span>
                        {settings.effort === k && <Check size={15} className="shrink-0 text-clay" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

</div>;
}
