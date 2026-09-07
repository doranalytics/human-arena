import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const origin = process.env.VERIFY_ORIGIN ?? "http://localhost:3218";
if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(origin) && origin !== "https://howto-ai-games.vercel.app") throw new Error("Use this app's local or production origin");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const email = `arena-account-qa-${randomUUID()}@example.com`, password = randomUUID() + randomUUID();
let uid: string | undefined, unverifiedId: string | undefined, memberId: string | undefined, cookie = "";
async function request(path: string, method = "GET", body?: unknown, authenticated = true) {
  const r = await fetch(origin + path, { method, headers: { ...(authenticated ? { cookie } : {}), "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json() };
}
async function main() {
try {
  for (const path of ["/api/arena/start", "/api/arena/submit", "/api/chat", "/api/transcribe", "/api/onboarding"]) assert.equal((await request(path, "POST", {}, false)).status, 401);
  assert.equal((await request("/api/auth/signin", "POST", { email: "invalid" }, false)).status, 400);
  const unverified = await db.auth.admin.createUser({ email: `unverified-${email}`, password, email_confirm: false });
  if (unverified.error) throw unverified.error; unverifiedId = unverified.data.user.id;
  const anon = createClient(url, key, { auth: { persistSession: false } });
  assert.ok((await anon.auth.signInWithPassword({ email: `unverified-${email}`, password })).error, "Unverified email must not sign in");
  console.log("PASS anonymous gameplay blocked; malformed email rejected; unverified account cannot sign in");
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error; uid = created.data.user.id;
  const auth = createServerClient(url, key, { cookies: { getAll: () => [], setAll: rows => { cookie = rows.map(x => `${x.name}=${x.value}`).join("; "); } } });
  const signed = await auth.auth.signInWithPassword({ email, password }); if (signed.error) throw signed.error;
  const claimed = await auth.rpc("claim_member"); if (claimed.error) throw claimed.error; memberId = claimed.data.id;
  let saved = await request("/api/onboarding", "POST", { level: "casual", goal: "work", is_paid: true, plan: "premium" });
  assert.equal(saved.status, 200); assert.equal(saved.data.onboarding.version, 2);
  let profile = (await request("/api/profile")).data;
  assert.equal(profile.member.emailVerified, true); assert.equal(profile.subscription.plan, "standard"); assert.equal(profile.subscription.weeklyWinnerEligible, false);
  const { data: standard } = await db.from("members").select("account_tier").eq("id", memberId).single(); assert.equal(standard?.account_tier, "standard");
  const { count: attempts } = await db.from("attempts").select("id", { count: "exact", head: true }).eq("member_id", memberId); assert.equal(attempts, 0);
  assert.equal(profile.guideSeenAt, null);
  const seen = await request("/api/onboarding", "PATCH", { action: "guide_seen", is_paid: true }); assert.equal(seen.status, 200);
  saved = await request("/api/onboarding", "POST", { level: "casual", goal: "work" });
  profile = (await request("/api/profile")).data; assert.equal(Date.parse(profile.guideSeenAt), Date.parse(seen.data.guideSeenAt)); assert.ok(profile.onboardedAt);
  console.log("PASS verified profile and Standard plan persist; onboarding creates no attempt; pointer dismissal persists; client cannot choose Premium");
  const { error: cacheError } = await db.from("circle_memberships").insert({ email, community_id: Number(process.env.CIRCLE_COMMUNITY_ID) || 987321123, active: true, checked_at: new Date().toISOString() });
  if (cacheError) throw cacheError;
  profile = (await request("/api/profile")).data;
  assert.equal(profile.subscription.plan, "premium"); assert.equal(profile.subscription.weeklyWinnerEligible, true); assert.ok(profile.subscription.sources.includes("circle"));
  const { data: premium } = await db.from("members").select("account_tier").eq("id", memberId).single(); assert.equal(premium?.account_tier, "premium");
  const other = createClient(url, key, { auth: { persistSession: false } });
  const { data: visible } = await other.from("members").select("id").eq("id", memberId); assert.equal(visible?.length, 0);
  console.log("PASS Circle access grants Premium independently of Substack; database plan agrees; anonymous clients cannot read the account");
} finally {
  const cache = await db.from("circle_memberships").delete().eq("email", email); if (cache.error) throw cache.error;
  if (memberId) { const r = await db.from("members").delete().eq("id", memberId); if (r.error) throw r.error; }
  for (const id of [uid, unverifiedId]) if (id) { const r = await db.auth.admin.deleteUser(id); if (r.error) throw r.error; }
  console.log("Temporary account verification rows removed; no emails sent");
}
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Account verification failed"); process.exitCode = 1; });
