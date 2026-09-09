/** Production smoke test with isolated guest fixtures. Does not send email. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { guestEmail } from "../src/lib/guest-cookie";
const origin = process.env.VERIFY_ORIGIN ?? "https://howto-ai-games.vercel.app";
assert.match(
  origin,
  /^https:\/\/howto-ai-games(?:-[a-z0-9]+-doranalytics)?\.vercel\.app$/,
);
assert.ok(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("woisfoqzbdxdnugctwpk"),
);
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
const ids: string[] = [];
let authId: string | undefined, accountId: string | undefined;
function visitor() {
  const jar = new Map<string, string>();
  return {
    jar,
    async req(path: string, body?: unknown, method = body ? "POST" : "GET") {
      const r = await fetch(origin + path, {
        method,
        headers: {
          cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
          "content-type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      for (const c of r.headers.getSetCookie()) {
        const [part] = c.split(";");
        const i = part.indexOf("=");
        if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
      }
      const j = await r.json();
      return { ...j, reviewState: j.status, status: r.status };
    },
  };
}
const a = visitor(),
  b = visitor();
async function answer(id: string, run: import("../src/lib/learning/catalog").LessonRun, content: string | number) {
  const body = {
    lesson: id,
    action: "answer",
    revision: run.revision,
    requestId: randomUUID(),
    ...(typeof content === "number" ? { choice: content } : { text: content }),
  };
  const j = await a.req("/api/learning", body);
  assert.equal(j.status, 200, j.error);
  return { run: j.run, body };
}
async function main() {
  try {
    for (const v of [a, b]) {
      const j = await v.req("/api/profile");
      assert.equal(j.status, 200);
      ids.push(j.member.id);
    }
    const setup = await a.req("/api/onboarding", {
      level: "daily",
      goal: "work",
      product: "chatgpt",
      interests: ["Automation"],
      motivation: "Save time",
      commitment: "daily",
      start: "better-context",
    });
    assert.equal(setup.status, 200);
    assert.equal((await a.req("/api/membership-review", {})).status, 401);
    assert.equal(
      (await a.req("/api/auth/signin", { email: "not-an-email" })).status,
      400,
    );
    assert.equal(
      (
        await a.req("/api/learning", {
          lesson: "shape-answers",
          action: "answer",
          revision: 0,
          requestId: randomUUID(),
          choice: 1,
        })
      ).status,
      404,
    );
    const cases: Record<string, (string | number | string[])[]> = {
      "shape-answers": [
        1,
        "Shorten the rainbow explanation to one concise sentence.",
        1,
        "Explain why the moon looks different during the month to a five-year-old.",
        1,
        "Turn the laundry instructions into a checklist I can check off.",
        "Explain evaporation briefly for a beginner.",
        "Make a short checklist from the laundry instructions.",
        "Adapt that checklist for someone who has never done laundry before.",
        "Using the plant-care notes, make a short beginner-friendly checklist for my friend who has never cared for a plant.",
      ],
      "better-context": [
        1,
        "Suggest weekend ideas: I enjoy outdoors, have $30, Saturday afternoon free, and use public transport.",
        0,
        "Help me plan a weekend activity. Interview me one question at a time, waiting for my answer before recommending anything.",
        "I enjoy outdoors, have a $30 budget, Saturday afternoon free, and use public transport. Any other details are flexible.",
        "My friend needs step-free access. Include this requirement alongside the preferences we discussed.",
        "Now suggest activity options using all my preferences and the step-free requirement.",
        "From those options choose the one requiring least travel. Explain your reasoning, but do not invent travel times; ask for missing location details if needed.",
        "Rain is forecast. Adapt your recommendation for indoors while keeping the $30 budget and step-free access.",
        [
          "Help choose a hobby. Interview me one question at a time and wait for my answers before recommending anything.",
          "It is for a beginner with 30 minutes in the evenings, a $25 budget, and a preference for creative hobbies at home. Anything else is flexible.",
          "Now recommend a hobby based on those answers, prioritizing the lowest starting cost.",
        ],
      ],
    };
    for (const [id, inputs] of Object.entries(cases)) {
      const started = await a.req("/api/learning", {
        lesson: id,
        action: "start",
      });
      assert.equal(started.status, 200);
      let run = started.run;
      const denied = await b.req("/api/learning", {
        lesson: id,
        action: "answer",
        revision: run.revision,
        requestId: randomUUID(),
        choice: 1,
      });
      assert.equal(denied.status, 404);
      const wrong = await answer(id, run, 0);
      assert.equal(wrong.run.step, 0);
      run = wrong.run;
      for (let i = 0; i < inputs.length; i++) {
        const messages = Array.isArray(inputs[i])
          ? (inputs[i] as string[])
          : [inputs[i] as string | number];
        for (const content of messages) {
          const result = await answer(id, run, content);
          run = result.run;
          const repeated = await a.req("/api/learning", result.body);
          assert.equal(repeated.run.revision, run.revision);
        }
        assert.equal(run.step, i + 1, `${id} step ${i}: ${run.feedback}`);
        console.log(`PASS ${id} ${i + 1}/10`);
      }
      assert.ok(run.completed_at);
      const restarted = await a.req("/api/learning", {
        lesson: id,
        action: "start",
      });
      assert.equal(restarted.run.step, 10);
    }
    const p = await a.req("/api/profile");
    assert.equal(
      p.results.filter((r: {slug: string}) => r.slug.startsWith("lesson-")).length,
      2,
    );
    assert.equal(
      p.results.reduce((n: number, r: {points: number}) => n + r.points, 0),
      160,
    );
    assert.equal(p.practice.current, 1);
    assert.equal((await b.req("/api/learning")).runs.length, 0);
    console.log(
      "PASS both lessons, automatic assessment, reload, one-time points, streak and ownership isolation",
    );
    // Verify guest transfer using a disposable confirmed account. No mail delivery.
    const email = `learning-qa-${randomUUID()}@example.com`,
      password = `QA-${randomUUID()}-aA1!`;
    const created = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    authId = created.data.user.id;
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [...a.jar].map(([name, value]) => ({ name, value })),
          setAll: (values) => {
            for (const c of values) a.jar.set(c.name, c.value);
          },
        },
      },
    );
    const signed = await auth.auth.signInWithPassword({ email, password });
    if (signed.error) throw signed.error;
    const verified = await a.req("/api/auth/verify", {
      email,
      token: "000000",
    });
    assert.equal(verified.status, 200, verified.error);
    const owned = await a.req("/api/profile");
    accountId = owned.member.id;
    assert.equal(owned.member.guest, false);
    assert.equal(owned.results.length, 2);
    assert.equal(owned.onboarding.product, "chatgpt");
    assert.equal((await a.req("/api/learning")).runs.length, 2);
    const review = await a.req("/api/membership-review", {});
    assert.equal(review.status, 200);
    assert.equal(review.reviewState, "pending");
    assert.equal((await b.req("/api/learning")).runs.length, 0);
    console.log(
      "PASS verified account keeps guest lessons, points, streak and onboarding; membership review grants no paid access",
    );
  } finally {
    for (const id of ids)
      await db
        .from("members")
        .delete()
        .eq("id", id)
        .eq("email", guestEmail(id))
        .is("auth_id", null);
    if (authId && !accountId) {
      const { data } = await db
        .from("members")
        .select("id")
        .eq("auth_id", authId)
        .maybeSingle();
      accountId = data?.id;
    }
    if (accountId) await db.from("members").delete().eq("id", accountId);
    if (authId) await db.auth.admin.deleteUser(authId);
    console.log("QA fixtures removed");
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
