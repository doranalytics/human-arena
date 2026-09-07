import "server-only";
import { adminClient } from "../supabase/admin";
import { CircleAPI, type CircleConfig } from "./api";

export function circleConfig(): CircleConfig | null {
  const token = process.env.CIRCLE_API_TOKEN;
  const communityId = Number(process.env.CIRCLE_COMMUNITY_ID);
  return token && Number.isSafeInteger(communityId) && communityId > 0 ? { token, communityId } : null;
}

export async function refreshCircleEmail(email: string, force = false) {
  const db = adminClient(), config = circleConfig();
  const { data: cached, error } = await db.from("circle_memberships").select("active,checked_at,community_id").eq("email", email.toLowerCase()).maybeSingle();
  if (error) return { available: false };
  if (!config) return { available: false };
  const age = Date.now() - new Date(cached?.checked_at ?? 0).getTime();
  if (cached?.community_id === config.communityId && age < (force ? 60_000 : 6 * 60 * 60_000)) return { available: true };
  try {
    const member = await new CircleAPI(config).findByEmail(email);
    const { error: saveError } = await db.rpc("record_circle_lookup", { p_community: config.communityId, p_email: email.toLowerCase(), p_record: member });
    if (saveError) throw new Error("Could not save Circle membership");
    return { available: true };
  } catch {
    // API errors, plan restrictions and invalid payloads never become a non-member verdict.
    return { available: false };
  }
}

export async function syncCircleMembers() {
  const config = circleConfig();
  if (!config) throw new Error("Set CIRCLE_API_TOKEN and CIRCLE_COMMUNITY_ID to enable the Circle import");
  const db = adminClient();
  const { data: run, error } = await db.from("circle_sync_runs").insert({ community_id: config.communityId, status: "running" }).select("id").single();
  if (error || !run) throw new Error("Could not start Circle import");
  try {
    const members = await new CircleAPI(config).allMembers();
    const { data, error: applyError } = await db.rpc("apply_circle_snapshot", { p_run: run.id, p_community: config.communityId, p_members: members });
    if (applyError) throw new Error("Could not apply Circle import; existing access was preserved");
    return { runId: run.id, ...data } as { runId: string; records: number; activeMembers: number; createdProfiles: number };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Circle import failed";
    await db.from("circle_sync_runs").update({ status: "failed", finished_at: new Date().toISOString(), error: message.slice(0, 300) }).eq("id", run.id).eq("status", "running");
    throw new Error(message);
  }
}
