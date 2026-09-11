"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUI, setPracticeHints } from "@/lib/ui";
import { getPractice, practiceChecks } from "@/lib/playground";

export function PracticeGuide() {
  const state = useStore((s) => s);
  const enabled = useUI((s) => s.practiceHints);
  const dialog = useUI((s) => s.dialog);
  const page = useUI((s) => s.page);
  const mobileOpen = useUI((s) => s.mobileSidebarOpen);
  const [position, setPosition] = useState<{ left: number; top: number; arrow: number; above: boolean; navigation: boolean } | null>(null);
  const exercise = state.attempt?.mode === "playground" ? getPractice(state.attempt.slug) : null;
  const checks = exercise && state.attempt ? practiceChecks(exercise, state.attempt.events, state) : [];
  const done = checks.length > 0 && checks.every((c) => c.pass);
  const guide = exercise?.guide.findLast((g) => !g.after || checks.some((c) => c.id === g.after && c.pass));
  const target = guide?.target;
  const show = enabled && !!target && !dialog && !done && page !== "learning";
  useEffect(() => {
    if (!show || !target) return;
    let highlighted: HTMLElement | null = null;
    let frame = 0;
    const visible = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector)).find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight; });
    const update = () => {
      const direct = visible(`[data-guide="${target}"]`);
      const fallback = !direct && ["customize", "projects", "new-project", "scheduled"].includes(target) ? visible('[data-guide="navigation"]') : undefined;
      const el = direct ?? fallback;
      if (highlighted !== el) { highlighted?.classList.remove("practice-target"); highlighted = el ?? null; highlighted?.classList.add("practice-target"); }
      if (!el) { setPosition(null); return; }
      // The desktop workspace uses root zoom; fixed offsets are still CSS pixels.
      const zoom = Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const rect = el.getBoundingClientRect();
      const r = { left: rect.left / zoom, top: rect.top / zoom, bottom: rect.bottom / zoom, width: rect.width / zoom };
      const width = Math.min(280, window.innerWidth / zoom - 24);
      const left = Math.max(12, Math.min(window.innerWidth / zoom - width - 12, r.left));
      const above = r.bottom + 150 > window.innerHeight / zoom;
      const next = { left, top: above ? Math.max(12, r.top - 146) : r.bottom + 7, arrow: Math.max(16, Math.min(width - 34, r.left + Math.min(r.width / 2, 40) - left)), above, navigation: !!fallback };
      setPosition((p) => p && Object.keys(next).every((k) => p[k as keyof typeof next] === next[k as keyof typeof next]) ? p : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const observer = new ResizeObserver(schedule); observer.observe(document.body);
    return () => { cancelAnimationFrame(frame); highlighted?.classList.remove("practice-target"); observer.disconnect(); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true); };
  }, [show, target, mobileOpen, page, state.activeChatId, state.attempt?.events.length]);
  if (!show || !position || !guide) return null;
  const Arrow = position.above ? ArrowDown : ArrowUp;
  return <aside aria-label="Practice pointer" className="practice-guide pointer-events-none fixed z-[45] w-[280px] max-w-[calc(100vw-24px)]" style={{ left: position.left, top: position.top }}>
    {!position.above && <Arrow className="practice-guide-arrow text-clay" size={24} style={{ marginLeft: position.arrow }} aria-hidden="true" />}
    <div className="rounded-xl border border-clay/30 bg-bg p-3 shadow-lg"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-clay-dark">Try it here</span><button aria-label="Hide practice pointers" onClick={() => setPracticeHints(false)} className="pointer-events-auto -m-1 flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-bg-3"><X size={14} /></button></div><p className="mt-1 text-[13px] leading-relaxed text-ink-2">{position.navigation ? "Open the sidebar to find this feature." : guide.text}</p></div>
    {position.above && <Arrow className="practice-guide-arrow text-clay" size={24} style={{ marginLeft: position.arrow }} aria-hidden="true" />}
  </aside>;
}
