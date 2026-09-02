"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered modal in the desktop-app style: soft cream card, thin border, no heavy shadow. */
export function Dialog({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal className={cn("fade-up flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl shadow-black/10", wide ? "max-w-3xl" : "max-w-xl")}>
        {title !== undefined && (
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
            <div className="text-[15px] font-medium">{title}</div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-2 hover:bg-bg-3" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", className, disabled, type = "button", title }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline" | "danger"; className?: string; disabled?: boolean; type?: "button" | "submit"; title?: string }) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-bg hover:bg-black",
        variant === "ghost" && "text-ink-2 hover:bg-bg-3 hover:text-ink",
        variant === "outline" && "border border-line-2 bg-bg hover:bg-bg-2",
        variant === "danger" && "text-bad hover:bg-red-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export const inputCls = "w-full rounded-lg border border-line-2 bg-bg px-3 py-2 text-[14px] outline-none placeholder:text-ink-3 focus:border-ink-3";
