"use client";
import { useEffect, useRef } from "react";
import { closeMobileSidebar, useUI } from "@/lib/ui";
import { Sidebar } from "./sidebar";

export function MobileNavigation() {
  const open = useUI((s) => s.mobileSidebarOpen);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>('[aria-label="Close navigation"]')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeMobileSidebar(); }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]') ?? []).filter((el) => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="viewport-overlay mobile-drawer fixed inset-0 z-[45] md:hidden">
    <button className="absolute inset-0 bg-black/30" aria-label="Dismiss navigation" tabIndex={-1} onClick={closeMobileSidebar} />
    <div ref={panel} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Navigation" className="relative h-full w-[calc(100%_-_3rem)] max-w-80 shadow-xl">
      <Sidebar mobile />
    </div>
  </div>;
}
