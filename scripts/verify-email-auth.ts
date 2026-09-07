import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const origin = process.env.VERIFY_ORIGIN ?? "http://localhost:3218";
if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(origin) && origin !== "https://howto-ai-games.vercel.app") throw new Error("Use this app's local or production origin");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const email = `arena-email-qa-${randomUUID()}@example.com`;
let userId: string | undefined;

// Each jar represents a separate browser, with no PKCE cookie or shared state.
function browser() {
  const jar = new Map<string, string>();
  return async (path: string, body?: unknown) => {
    const r = await fetch(origin + path, { method: body ? "POST" : "GET", redirect: "manual", headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    for (const entry of r.headers.getSetCookie()) {
      const pair = entry.split(";")[0], index = pair.indexOf("=");
      jar.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return { status: r.status, location: r.headers.get("location"), data: r.headers.get("content-type")?.includes("json") ? await r.json() : null };
  };
}

async function main() {
try {
  const first = browser(), separate = browser();
  for (const body of [{ email: "invalid", token: "123456" }, { email, token: "abc123" }, { email, token: "12345" }, { email, verified: true }]) {
    assert.equal((await first("/api/auth/verify", body)).status, 400);
  }
  const legacy = await separate("/auth/callback?code=unused-code-from-another-browser");
  assert.equal(legacy.status, 307);
  assert.equal(new URL(legacy.location!).searchParams.get("auth_error"), "link_failed");
  assert.equal((await first("/api/profile")).data.member, null);
  console.log("PASS malformed codes cannot sign in; legacy links without browser verifier recover to code signup");

  // Admin generates a real Supabase email OTP without delivering mail. The
  // application verifies it through the same public endpoint as the UI.
  const signup = await db.auth.admin.generateLink({ type: "signup", email, password: randomUUID() + randomUUID() });
  if (signup.error) throw signup.error;
  userId = signup.data.user.id;
  assert.ok(!signup.data.user.email_confirmed_at);
  const token = signup.data.properties.email_otp;
  assert.match(token, /^\d{6}$/);
  const wrong = token === "000000" ? "111111" : "000000";
  assert.equal((await first("/api/auth/verify", { email, token: wrong })).status, 400);
  assert.equal((await first("/api/auth/verify", { email: `wrong-${email}`, token })).status, 400);
  assert.equal((await first("/api/profile")).data.member, null);
  assert.equal((await first("/api/arena/start", {})).status, 401);
  assert.equal((await first("/api/auth/verify", { email: email.toUpperCase(), token, is_paid: true })).status, 200);
  const profile = (await first("/api/profile")).data;
  assert.equal(profile.member.email, email);
  assert.equal(profile.member.emailVerified, true);
  assert.equal(profile.subscription.plan, "standard");
  assert.equal(profile.onboardedAt, null);
  assert.equal((await separate("/api/profile")).data.member, null);
  assert.equal((await separate("/api/auth/verify", { email, token })).status, 400);
  // Same-session retries after a lost response are safe and idempotent.
  assert.equal((await first("/api/auth/verify", { email, token })).status, 200);
  console.log("PASS real signup code creates a verified cookie session; wrong email/code and cross-browser replay fail; client cannot grant membership");

  assert.equal((await first("/api/onboarding", { level: "daily", goal: "automations" })).status, 200);
  const returning = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (returning.error) throw returning.error;
  assert.equal((await separate("/api/auth/verify", { email, token: returning.data.properties.email_otp })).status, 200);
  const restored = (await separate("/api/profile")).data;
  assert.equal(restored.member.id, profile.member.id);
  assert.equal(restored.onboarding.level, "daily");
  assert.equal(restored.onboarding.goal, "automations");
  assert.equal(restored.onboarding.version, 2);
  assert.ok(restored.onboardedAt);
  const { count, error } = await db.from("attempts").select("id", { count: "exact", head: true }).eq("member_id", profile.member.id);
  if (error) throw error;
  assert.equal(count, 0);
  console.log("PASS signing into a second browser restores the same account and completed onboarding; no challenge starts automatically");
} finally {
  const deleted = await db.from("members").delete().eq("email", email);
  if (deleted.error) throw deleted.error;
  if (userId) { const removed = await db.auth.admin.deleteUser(userId); if (removed.error) throw removed.error; }
  console.log("Disposable email-auth fixtures removed; no emails sent");
}
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Email auth verification failed"); process.exitCode = 1; });
