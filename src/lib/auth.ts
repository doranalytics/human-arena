import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { adminClient, adminConfigured } from "@/lib/supabase/admin";
import { TESTING_MODE } from "./testing-mode";
import { GUEST_COOKIE, GUEST_MAX_AGE, guestCookie, guestId, guestEmail } from "./guest-cookie";

export interface Member {
  id: string;
  email: string;
  pseudonym: string;
  display_name: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  onboarded_at: string | null;
  onboarding: { level?: string; goal?: string; version?: number; product?: "claude" | "chatgpt"; interests?: string[]; motivation?: string; commitment?: string; start?: string };
  challenge_guide_seen_at: string | null;
  is_paid: boolean;
  subscription_checked_at: string | null;
  practice_timezone: string | null;
  isGuest?: boolean;
}

const COLUMNS = "id,email,pseudonym,display_name,avatar_url,linkedin_url,x_url,onboarding,onboarded_at,challenge_guide_seen_at,is_paid,subscription_checked_at,practice_timezone";

export async function getUser() {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email_confirmed_at && !data.user.is_anonymous ? data.user : null;
  } catch {
    return null;
  }
}

/** Existing accounts keep their progress. Testing visitors get an isolated guest. */
export async function getMember({ createGuest = false } = {}): Promise<Member | null> {
  if (!adminConfigured()) return null;
  const user = await getUser();
  if (user) {
    const { data, error } = await adminClient().from("members").select(COLUMNS).eq("auth_id", user.id).maybeSingle();
    if (error) throw new Error("Could not load your saved progress");
    if (data) return data as Member;
  }
  if (!TESTING_MODE) return null;
  const jar = await cookies();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const id = guestId(jar.get(GUEST_COOKIE)?.value, secret);
  const db = adminClient();
  if (id) {
    const { data, error } = await db.from("members").select(COLUMNS).eq("id", id).eq("email", guestEmail(id)).is("auth_id", null).maybeSingle();
    if (error) throw new Error("Could not load your testing progress");
    if (data) return { ...data, isGuest: true } as Member;
  }
  // Only the initial profile request creates a visitor; other APIs require
  // its signed, HttpOnly cookie and keep all existing attempt ownership checks.
  if (!createGuest) return null;
  const newId = randomUUID();
  const { data, error } = await db.from("members").insert({ id: newId, email: guestEmail(newId), pseudonym: `Guest ${newId.slice(0, 6).toUpperCase()}` }).select(COLUMNS).single();
  if (error || !data) throw new Error("Could not start your testing session");
  jar.set(GUEST_COOKIE, guestCookie(newId, secret), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: GUEST_MAX_AGE });
  return { ...data, isGuest: true } as Member;
}
