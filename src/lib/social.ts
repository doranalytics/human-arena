/** Pulls a handle out of whatever was typed: "@ruben", "x.com/ruben", a full URL. Same rules as How to AI Games. */
export function xHandle(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const m = /(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})/i.exec(v);
  const h = m ? m[1] : v.replace(/^@/, "");
  return /^[A-Za-z0-9_]{1,15}$/.test(h) ? h : null;
}
export function linkedinSlug(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const m = /linkedin\.com\/in\/([^/?#\s]+)/i.exec(v);
  const s = (m ? m[1] : v.replace(/^\/+|\/+$/g, "")).replace(/\/+$/, "");
  return /^[A-Za-z0-9\-_%.]{3,100}$/.test(s) ? s : null;
}
export const xUrl = (h: string) => `https://x.com/${h}`;
export const linkedinUrl = (s: string) => `https://www.linkedin.com/in/${s}`;
