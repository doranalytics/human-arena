import { createHmac, timingSafeEqual } from "node:crypto";

export const GUEST_COOKIE = "howto_ai_guest_v1";
export const GUEST_MAX_AGE = 90 * 24 * 60 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`howto-ai-games:guest-session:v1:${payload}`).digest("base64url");
}

export function guestCookie(id: string, secret: string, now = Date.now()) {
  if (!UUID.test(id) || !secret) throw new Error("Cannot create testing session");
  const payload = `${id}.${Math.floor(now / 1000) + GUEST_MAX_AGE}`;
  return `${payload}.${signature(payload, secret)}`;
}

/** Member IDs from the public leaderboard are never sufficient to claim a session. */
export function guestId(value: string | undefined, secret: string, now = Date.now()): string | null {
  if (!value || !secret || value.length > 160) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [id, expires, mac] = parts;
  if (!UUID.test(id) || !/^\d{10}$/.test(expires) || Number(expires) <= Math.floor(now / 1000)) return null;
  const expected = Buffer.from(signature(`${id}.${expires}`, secret));
  const received = Buffer.from(mac);
  return expected.length === received.length && timingSafeEqual(expected, received) ? id : null;
}

export const guestEmail = (id: string) => `guest-${id}@guests.howto-ai.invalid`;
