"use client";
/** Stage materials travel to the composer two ways: dragged (custom MIME) or clicked (window event). */
import type { Material } from "./arena/types";

export const MATERIAL_MIME = "application/x-arena-material";

export function materialText(m: Material): string {
  if (m.kind === "text") return m.body;
  if (m.kind === "table") return [m.columns.join(" | "), m.columns.map(() => "---").join(" | "), ...m.rows.map((r) => r.join(" | "))].map((l) => `| ${l} |`).join("\n");
  return "";
}

export async function materialFile(m: Material): Promise<File | null> {
  if (m.kind !== "file") return null;
  if (m.url) {
    const r = await fetch(m.url);
    const blob = await r.blob();
    return new File([blob], m.filename, { type: m.mediaType || blob.type });
  }
  return new File([m.body ?? ""], m.filename, { type: m.mediaType || "text/plain" });
}

/** Click-to-use: the stage asks the composer to take a material. */
export function sendToComposer(m: Material) {
  window.dispatchEvent(new CustomEvent<Material>("arena:material", { detail: m }));
}
