/** Exercise temporary guest mode using isolated cookies. Never sends email. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { GUEST_COOKIE, guestEmail } from "../src/lib/guest-cookie";

const origin = process.env.VERIFY_ORIGIN ?? "https://howto-ai-games.vercel.app";
if (!/^https:\/\/howto-ai-games(?:-[a-z0-9]+-doranalytics)?\.vercel\.app$/.test(origin)) throw new Error("Use a Games deployment");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!url.includes("woisfoqzbdxdnugctwpk")) throw new Error("Use the games database, never the parent app");
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const guestIds = new Set<string>();
let authId: string | undefined, verifiedMember: string | undefined;

function visitor(initial = "") {
  let cookie = initial;
  return {
    get cookie() { return cookie; },
    async request(path: string, body?: unknown, method = body ? "POST" : "GET") {
      const r = await fetch(origin + path, { method, headers: { cookie, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const next = r.headers.getSetCookie().filter((c) => c.startsWith(`${GUEST_COOKIE}=`));
      if (next.length) {
        cookie = next.map((c) => c.split(";")[0]).join("; ");
        const id = cookie.split("=")[1]?.split(".")[0];
        if (id) guestIds.add(id);
        assert.match(next[0], /HttpOnly/i); assert.match(next[0], /Secure/i); assert.match(next[0], /SameSite=lax/i);
      }
      const text = await r.text();
      let data; try { data = JSON.parse(text); } catch { data = null; }
      return { status: r.status, data, text };
    },
  };
}

async function main() {
  try {
    const a = visitor(), b = visitor();
    const one = await a.request("/api/profile");
    assert.equal(one.status, 200); assert.equal(one.data.member.guest, true);
    assert.equal(one.data.member.email, ""); assert.equal(one.data.member.emailVerified, false);
    assert.equal(one.data.subscription.paid, false);
    const two = await b.request("/api/profile");
    assert.equal(two.status, 200); assert.equal(two.data.member.guest, true);
    assert.notEqual(one.data.member.id, two.data.member.id);
    assert.equal((await a.request("/api/profile")).data.member.id, one.data.member.id);
    assert.equal((await a.request("/api/profile", { name: "Guest API QA" }, "PATCH")).status, 200);
    assert.notEqual((await b.request("/api/profile")).data.member.name, "Guest API QA");
    assert.equal((await a.request("/api/auth/signin", { email: "not-an-email" })).status, 403);
    assert.equal((await a.request("/api/auth/verify", { email: "not-an-email", token: "000000" })).status, 403);
    const forged = visitor(a.cookie.replace(one.data.member.id, two.data.member.id));
    assert.equal((await forged.request("/api/arena/start", { slug: "pin-it" })).status, 401);
    console.log("PASS automatic isolated guests, reload, private profile, forged-cookie rejection, signup disabled; no email sent");

    const started = await a.request("/api/arena/start", { slug: "pin-it", timezone: "America/Los_Angeles" });
    assert.equal(started.status, 200);
    const attempt = started.data, chatId = randomUUID();
    const body = { id: chatId, attemptId: attempt.serverId, challengeSlug: "pin-it", model: "fast", effort: "low", messages: [{ id: randomUUID(), role: "user", parts: [{ type: "text", text: "I am practicing organizing chats. Reply with Ready." }] }] };
    assert.equal((await b.request("/api/chat", body)).status, 409, "Another guest cannot use this attempt");
    const chat = await a.request("/api/chat", body);
    assert.equal(chat.status, 200); assert.match(chat.text, /text-delta/);
    const at = new Date().toISOString();
    const submission = { slug: "pin-it", serverId: attempt.serverId, startedAt: attempt.startedAt, version: attempt.version, hintsUsed: 0,
      events: ["chat_pinned", "chat_renamed"].map((type) => ({ type, detail: chatId, chatId, at })),
      chats: [{ id: chatId, title: "Keep", pinned: true, projectId: null, messages: [] }], workspace: { projects: [], skills: [], groups: [], schedules: [] } };
    assert.equal((await b.request("/api/arena/submit", submission)).status, 404);
    const grade = await a.request("/api/arena/submit", submission);
    assert.equal(grade.status, 200); assert.equal(grade.data.result.passed, true);
    assert.equal(grade.data.practice.current, 1);
    const restored = await a.request("/api/profile");
    assert.ok(restored.data.results.some((r: { slug: string; passed: boolean }) => r.slug === "pin-it" && r.passed));
    assert.equal((await b.request("/api/profile")).data.results.length, 0);
    assert.equal((await a.request("/api/practice")).data.practice.current, 1);
    const dictation = await fetch(origin + "/api/transcribe", { method: "POST", headers: { cookie: a.cookie }, body: new FormData() });
    assert.equal(dictation.status, 400, "Guest reaches audio validation rather than an auth gate");
    console.log("PASS real guest chat, server grading, saved score and streak, dictation access, cross-guest attempt denial");

    const email = `verified-guest-mode-qa-${randomUUID()}@example.com`, password = randomUUID() + randomUUID();
    const created = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (created.error) throw created.error;
    authId = created.data.user.id;
    let verifiedCookie = "";
    const auth = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => [], setAll: (items) => { verifiedCookie = items.map((c) => `${c.name}=${c.value}`).join("; "); } } });
    const signed = await auth.auth.signInWithPassword({ email, password }); if (signed.error) throw signed.error;
    const claimed = await auth.rpc("claim_member"); if (claimed.error) throw claimed.error;
    verifiedMember = claimed.data.id;
    const existing = await visitor(verifiedCookie).request("/api/profile");
    assert.equal(existing.status, 200); assert.equal(existing.data.member.id, verifiedMember);
    assert.equal(existing.data.member.guest, false); assert.equal(existing.data.member.emailVerified, true);
    console.log("PASS existing verified accounts keep their own identity in testing mode");
  } finally {
    for (const id of guestIds) {
      const r = await db.from("members").delete().eq("id", id).eq("email", guestEmail(id)).is("auth_id", null); if (r.error) throw r.error;
    }
    if (verifiedMember) { const r = await db.from("members").delete().eq("id", verifiedMember); if (r.error) throw r.error; }
    if (authId) { const r = await db.auth.admin.deleteUser(authId); if (r.error) throw r.error; }
    console.log("Disposable guest and verified-account fixtures removed");
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : "Guest verification failed"); process.exitCode = 1; });
