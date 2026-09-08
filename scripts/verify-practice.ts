/** Disposable fixtures exercise persistence and grading; no emails are sent. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { practiceDate, shiftDate } from "../src/lib/practice";

const origin = process.env.VERIFY_ORIGIN ?? "https://howto-ai-games.vercel.app";
if (!/^https:\/\/howto-ai-games(?:-[a-z0-9]+-doranalytics)?\.vercel\.app$/.test(origin)) throw new Error("Use a How to AI Games deployment");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!url.includes("woisfoqzbdxdnugctwpk")) throw new Error("Use the games database, never the parent app");
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const email = `practice-qa-${randomUUID()}@example.com`, password = randomUUID() + randomUUID();
let uid: string | undefined, memberId: string | undefined, cookie = "";
const zone = "America/Los_Angeles";
async function request(path: string, body?: unknown, signedIn = true) {
  const r = await fetch(origin + path, { method: body ? "POST" : "GET", headers: { ...(signedIn ? { cookie } : {}), "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json() };
}
async function rows() {
  const r = await db.from("practice_days").select("local_date,timezone,attempt_id").eq("member_id", memberId!);
  if (r.error) throw r.error;
  return r.data;
}
async function attempt(pass: boolean, timezone = zone, slow = false) {
  const started = await request("/api/arena/start", { slug: "pin-it", timezone });
  assert.equal(started.status, 200);
  const a = started.data, id = randomUUID(), at = new Date().toISOString();
  const fixture = await db.from("attempt_chats").insert({ attempt_id: a.serverId, chat_id: id, title: "Pin and rename", messages: [
    { id: "u", role: "user", parts: [{ type: "text", text: "Hello" }] },
    { id: "a", role: "assistant", parts: [{ type: "text", text: "Ready" }] },
  ], contexts: [], pending: false });
  if (fixture.error) throw fixture.error;
  if (slow) {
    const updated = await db.from("attempts").update({ started_at: new Date(Date.now() - 2_000_000).toISOString() }).eq("id", a.serverId);
    if (updated.error) throw updated.error;
  }
  return { ...a, slug: "pin-it", hintsUsed: slow ? 1 : 0,
    events: pass ? ["chat_pinned", "chat_renamed"].map((type) => ({ type, detail: id, chatId: id, at })) : [],
    chats: [{ id, title: pass ? "Keep" : "Pin and rename", projectId: null, pinned: pass, messages: [] }],
    workspace: { projects: [], skills: [], groups: [], schedules: [] },
  };
}

async function main() {
  try {
    assert.equal((await request("/api/practice", undefined, false)).status, 401);
    const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error; uid = created.data.user.id;
    const auth = createServerClient(url, key, { cookies: { getAll: () => [], setAll: (cookies) => { cookie = cookies.map((c) => `${c.name}=${c.value}`).join("; "); } } });
    const signed = await auth.auth.signInWithPassword({ email, password }); if (signed.error) throw signed.error;
    const claimed = await auth.rpc("claim_member"); if (claimed.error) throw claimed.error; memberId = claimed.data.id;
    assert.equal((await request("/api/practice")).data.practice.current, 0);
    assert.equal((await rows()).length, 0, "Visiting the app must not create a practice day");
    const failed = await request("/api/arena/submit", await attempt(false));
    assert.equal(failed.status, 200); assert.equal(failed.data.result.passed, false);
    assert.equal((await rows()).length, 0, "A failed grade must not count");
    console.log("PASS authenticated practice; visits and incomplete challenges earn no streak");

    const first = await attempt(true, zone, true);
    const graded = await request("/api/arena/submit", first);
    assert.equal(graded.status, 200); assert.equal(graded.data.result.passed, true);
    assert.equal(graded.data.result.hintsUsed, 1); assert.ok(graded.data.result.seconds >= 2000);
    assert.equal(graded.data.practice.current, 1); assert.equal(graded.data.practice.todayDone, true);
    assert.equal(graded.data.practice.timezone, zone);
    const duplicate = await request("/api/arena/submit", first);
    assert.deepEqual(duplicate.data.result, graded.data.result);
    const { count } = await db.from("results").select("id", { count: "exact", head: true }).eq("attempt_id", first.serverId);
    assert.equal(count, 1);
    const concurrent = await Promise.all([attempt(true, "Pacific/Kiritimati"), attempt(true, "UTC")]);
    const completions = await Promise.all(concurrent.map((a) => request("/api/arena/submit", a)));
    assert.ok(completions.every((r) => r.status === 200 && r.data.result.passed));
    const days = await rows(); assert.equal(days.length, 1); assert.equal(days[0].timezone, zone);
    assert.equal(days[0].local_date, practiceDate(new Date(), zone));
    assert.equal(days[0].attempt_id, first.serverId);
    const denied = await auth.from("practice_days").insert({ member_id: memberId, local_date: "2099-01-01", timezone: "UTC" });
    assert.ok(denied.error, "A player must not write streak days");
    assert.ok((await auth.from("members").update({ practice_timezone: "UTC" }).eq("id", memberId!)).error || (await db.from("members").select("practice_timezone").eq("id", memberId!).single()).data?.practice_timezone === zone);
    const stranger = createClient(url, key, { auth: { persistSession: false } });
    assert.ok((await stranger.from("practice_days").select("*").eq("member_id", memberId!)).error, "Anonymous practice data stays private");
    assert.equal((await auth.from("practice_days").select("local_date")).data?.length, 1);
    console.log("PASS slow/hinted completion counts; concurrent replays and retries count one day; timezone is stable; ledger is protected");

    // Known historical practice fixtures test summary restoration independently
    // of today's award. They are never backfilled for real accounts.
    const today = days[0].local_date;
    const seeded = await db.from("practice_days").insert([-1, -2, -3].map((d) => ({ member_id: memberId, local_date: shiftDate(today, d), timezone: zone })));
    if (seeded.error) throw seeded.error;
    const profile = (await request("/api/profile")).data;
    assert.equal(profile.practice.current, 4); assert.equal(profile.practice.best, 4);
    assert.equal(profile.practice.days.filter((d: { complete: boolean }) => d.complete).length, 4);
    const best = await db.from("member_points").select("points,challenges").eq("member_id", memberId!).single();
    assert.equal(best.data?.points, 25); assert.equal(best.data?.challenges, 1, "Replaying one challenge does not earn more skills");
    const historical = await db.from("results").insert({ member_id: memberId, slug: "qa-historical", passed: true, points: 500, seconds: 60, submitted_at: "2026-01-01T00:00:00Z" });
    if (historical.error) throw historical.error;
    const board = await request("/api/leaderboard?board=week");
    assert.equal(board.status, 200); assert.ok(board.data.rows.every((r: { seed?: boolean }) => !r.seed));
    const mine = board.data.rows.find((r: { id: string }) => r.id === memberId);
    assert.equal(mine.points, 25); assert.equal(mine.lifetimePoints, 525);
    assert.equal(mine.challenges, 1); assert.equal(mine.lifetimeChallenges, 2);
    console.log("PASS profile restores practice history; replay points do not accumulate; weekly scores retain lifetime proficiency; live board has no sample rows");
  } finally {
    if (memberId) { const r = await db.from("members").delete().eq("id", memberId); if (r.error) throw r.error; }
    if (uid) { const r = await db.auth.admin.deleteUser(uid); if (r.error) throw r.error; }
    console.log("Temporary practice fixtures removed; no emails sent");
  }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Practice verification failed"); process.exitCode = 1; });
