import type { Surface } from "./learning/catalog";

/** UI terminology only. Challenge ids, events and grading contracts stay shared. */
export function surfaceCopy(text: string, surface: Surface) {
  if (surface !== "chatgpt") return text;
  return text.replace(/\bCowork\b/gi, "Agent mode")
    .replace(/\bCustomize\b/g, "Settings")
    .replace(/\bConnectors\b/g, "Apps")
    .replace(/\bconnectors\b/g, "apps");
}
