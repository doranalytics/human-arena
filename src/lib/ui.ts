"use client";
/** Tiny UI store: which dialog is open, toasts. Separate from the persisted store. */
import { useSyncExternalStore } from "react";

export type DialogKind =
  | { kind: "challenges" }
  | { kind: "brief"; slug: string }
  | { kind: "result"; slug: string }
  | { kind: "leaderboard" }
  | { kind: "settings" }
  | { kind: "connectors" }
  | { kind: "skills" }
  | { kind: "new-project" }
  | { kind: "customize" };

export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone?: "ok" | "info" | "bad";
}

interface UIState {
  dialog: DialogKind | null;
  toasts: Toast[];
  sidebarOpen: boolean;
}

let ui: UIState = { dialog: null, toasts: [], sidebarOpen: true };
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());
const sub = (l: () => void) => (ls.add(l), () => void ls.delete(l));
const server: UIState = { dialog: null, toasts: [], sidebarOpen: true };

export function useUI<T>(sel: (s: UIState) => T): T {
  return useSyncExternalStore(sub, () => sel(ui), () => sel(server));
}
export function openDialog(d: DialogKind) {
  ui = { ...ui, dialog: d };
  emit();
}
export function closeDialog() {
  ui = { ...ui, dialog: null };
  emit();
}
export function toggleSidebar() {
  ui = { ...ui, sidebarOpen: !ui.sidebarOpen };
  emit();
}
let toastId = 0;
export function toast(t: Omit<Toast, "id">, ms = 5000) {
  const id = ++toastId;
  ui = { ...ui, toasts: [...ui.toasts, { ...t, id }] };
  emit();
  setTimeout(() => {
    ui = { ...ui, toasts: ui.toasts.filter((x) => x.id !== id) };
    emit();
  }, ms);
}
