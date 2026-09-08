import "server-only";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "./supabase/admin";
import { refreshCircleEmail } from "./circle/service";
import type { Member } from "./auth";
import { accountAccess, type SubscriptionStatus } from "./subscription";

async function substackStatus(email: string): Promise<boolean | null> {
  const url = process.env.SUBSTACK_MEMBERS_SUPABASE_URL;
  const key = process.env.SUBSTACK_MEMBERS_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const source = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000), cache: "no-store" }) } });
    const { data, error } = await source.from("members").select("is_paid").eq("email", email.trim().toLowerCase()).maybeSingle();
    return error ? null : data?.is_paid === true;
  } catch { return null; }
}

/** Either confirmed source grants membership. A miss in one source never erases the other. */
export async function subscriberStatus(member: Member, forceCircle = false): Promise<SubscriptionStatus> {
  // Guest addresses are internal identifiers, never membership lookup emails.
  if (member.isGuest) return { paid: false, ...accountAccess(false), checkedAt: null, available: true, sources: [] };
  const [substack, circle] = await Promise.all([substackStatus(member.email), refreshCircleEmail(member.email, forceCircle)]);
  const { data, error } = await adminClient().rpc("refresh_member_access", { p_member: member.id, p_substack_paid: substack });
  if (error || !data) return { paid: member.is_paid, ...accountAccess(member.is_paid), checkedAt: member.subscription_checked_at, available: false };
  return {
    ...accountAccess(data.paid),
    paid: data.paid, sources: [data.substack ? "substack" : null, data.circle ? "circle" : null].filter(Boolean) as ("substack" | "circle")[],
    checkedAt: [data.circleCheckedAt, data.substackCheckedAt].filter(Boolean).sort().at(-1) ?? null,
    // Only report "not a member" after both sources were checked successfully.
    available: data.paid ? (data.substack && substack !== null) || (data.circle && circle.available) : substack !== null && circle.available,
    checks: { substack: substack !== null, circle: circle.available },
  };
}
