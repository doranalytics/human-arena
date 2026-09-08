"use client";
/** Tiny UI store: which dialog is open, toasts. Separate from the persisted store. */
import { useSyncExternalStore } from "react";
import { dismissChallengeGuide } from "./session";

export type DialogKind =
  | { kind: "challenges" }
  | { kind: "brief"; slug: string }
  | { kind: "result"; slug: string }
  | { kind: "leaderboard"; tab?: "board" | "progress" }
  | { kind: "settings"; section?: SettingsSection }
  | { kind: "new-project"; chatId?: string }
  | { kind: "quit" };

export type SettingsSection = "general" | "account" | "instructions" | "skills" | "connectors" | "memory";

export interface Toast {
  id: number;
  title: string;
  body?: string;
  tone?: "ok" | "info" | "bad";
}

export type Page = "projects" | "scheduled" | null;

interface UIState {
  dialog: DialogKind | null;
  toasts: Toast[];
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  /** full-screen pages that replace the chat area */
  page: Page;
}

let ui: UIState = { dialog: null, toasts: [], sidebarOpen: true, mobileSidebarOpen: false, page: null };
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());
const sub = (l: () => void) => (ls.add(l), () => void ls.delete(l));
const server: UIState = { dialog: null, toasts: [], sidebarOpen: true, mobileSidebarOpen: false, page: null };

export function useUI<T>(sel: (s: UIState) => T): T {
  return useSyncExternalStore(sub, () => sel(ui), () => sel(server));
}
export function openDialog(d: DialogKind) {
  if (d.kind === "challenges") void dismissChallengeGuide();
  ui = { ...ui, dialog: d, mobileSidebarOpen: false };
  emit();
}
export function setPage(page: Page) {
  ui = { ...ui, page, mobileSidebarOpen: false };
  emit();
}
export function closeDialog() {
  ui = { ...ui, dialog: null };
  emit();
}
export function toggleSidebar() {
  ui = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
    ? { ...ui, mobileSidebarOpen: !ui.mobileSidebarOpen }
    : { ...ui, sidebarOpen: !ui.sidebarOpen };
  emit();
}
export function closeMobileSidebar() {
  if (!ui.mobileSidebarOpen) return;
  ui = { ...ui, mobileSidebarOpen: false };
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
