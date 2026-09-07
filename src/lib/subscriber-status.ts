import "server-only";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "./supabase/admin";
import type { Member } from "./auth";
import type { SubscriptionStatus } from "./subscription";

/** AI Certified's Substack import is the existing source of truth. Match the signed-in email only. */
export async function subscriberStatus(member: Member): Promise<SubscriptionStatus> {
  const url = process.env.SUBSTACK_MEMBERS_SUPABASE_URL;
  const key = process.env.SUBSTACK_MEMBERS_SERVICE_ROLE_KEY;
  const previous = { paid: member.is_paid, checkedAt: member.subscription_checked_at, available: false };
  if (!url || !key) return previous;
  try {
    const source = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000), cache: "no-store" }) } });
    const { data, error } = await source.from("members").select("is_paid").eq("email", member.email.trim().toLowerCase()).maybeSingle();
    if (error) return previous;
    const status = { paid: data?.is_paid === true, checkedAt: new Date().toISOString(), available: true };
    const { error: saveError } = await adminClient().from("members").update({ is_paid: status.paid, subscription_checked_at: status.checkedAt }).eq("id", member.id);
    if (saveError) return previous;
    return status;
  } catch { return previous; }
}
