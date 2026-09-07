/** Temporary fixtures only; refuses a full-snapshot test once real Circle data exists. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const community = 987321123;
const suffix = randomUUID();
const emails = [`circle-a-${suffix}@example.com`,`circle-b-${suffix}@example.com`,`circle-c-${suffix}@example.com`];
const runIds: string[] = [];
const person = (id: number, index: number, active = true) => ({ id, email: emails[index], community_id: community, name: "Circle test", avatar_url: null, active });
async function rpc(name: string, args: Record<string, unknown>) { const r = await db.rpc(name, args); if (r.error) throw r.error; return r.data; }
async function run() {
  const r = await db.from("circle_sync_runs").insert({ community_id: community, status: "running" }).select("id").single();
  if (r.error) throw r.error; runIds.push(r.data.id); return r.data.id;
}
async function main() {
  const { count, error } = await db.from("circle_memberships").select("email", { head: true, count: "exact" });
  if (error) throw error;
  if (count) throw new Error("Real Circle data exists: do not run snapshot fixtures against it");
  try {
    const initial = await db.from("members").insert({ email: emails[0], pseudonym: "QA", display_name: "Keep my profile", substack_paid: true, is_paid: true }).select("id").single();
    if (initial.error) throw initial.error;
    const id = initial.data.id;
    const first = await rpc("apply_circle_snapshot", { p_run: await run(), p_community: community, p_members: [person(1,0),person(2,1)] });
    assert.equal(first.records, 2); assert.equal(first.createdProfiles, 1);
    const existing = await db.from("members").select("display_name,is_paid,auth_id").eq("id",id).single();
    assert.equal(existing.data?.display_name, "Keep my profile"); assert.equal(existing.data?.auth_id, null);
    let access = await rpc("refresh_member_access", { p_member: id, p_substack_paid: false });
    assert.equal(access.paid, true); assert.equal(access.circle, true); assert.equal(access.substack, false);
    await rpc("refresh_member_access", { p_member: id, p_substack_paid: true });
    const incomplete = await run();
    const failed = await db.rpc("apply_circle_snapshot", { p_run: incomplete, p_community: community, p_members: [person(3,2),person(4,2)] });
    assert.ok(failed.error, "duplicates must abort atomically");
    const absent = await db.from("members").select("id").eq("email",emails[2]); assert.equal(absent.data?.length,0);
    await rpc("apply_circle_snapshot", { p_run: await run(), p_community: community, p_members: [person(2,1)] });
    access = await rpc("refresh_member_access", { p_member: id, p_substack_paid: null });
    assert.equal(access.circle, false); assert.equal(access.paid, true); assert.equal(access.substack, true);
    const pending = await run();
    await rpc("record_circle_lookup", { p_community: community, p_email: emails[0], p_record: person(1,0) });
    await rpc("apply_circle_snapshot", { p_run: pending, p_community: community, p_members: [person(2,1)] });
    access = await rpc("refresh_member_access", { p_member: id, p_substack_paid: false }); assert.equal(access.paid, true, "newer email lookup wins over older snapshot");
    await rpc("record_circle_lookup", { p_community: community, p_email: emails[2], p_record: person(1,2) });
    access = await rpc("refresh_member_access", { p_member: id, p_substack_paid: null }); assert.equal(access.paid,false,"email change revokes old Circle email");
    await rpc("record_circle_lookup", { p_community: community, p_email: emails[2], p_record: null });
    console.log("PASS complete import, new profiles without auth/email, profile preservation, source independence, atomic rollback, removals, fresh lookup precedence and email changes");
  } finally {
    for (const [table, column, values] of [["circle_sync_runs","id",runIds],["circle_memberships","email",emails],["members","email",emails]] as const) {
      if (!values.length) continue; const { error } = await db.from(table).delete().in(column,values); if(error) throw error;
    }
    console.log("All Circle QA rows removed");
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode=1; });
