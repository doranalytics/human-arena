import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { getChallenge } from "@/lib/arena/challenges";
import { computePoints, speedMultiplier, type ChallengeDef } from "@/lib/arena/types";
import { gradeAttempt } from "@/lib/arena/grader";
import { challengeVersion } from "@/lib/arena/contract";
import { gradeBehaviors, type WorkspaceEvidence } from "@/lib/arena/evidence";
import { SubmissionSchema } from "@/lib/arena/submission";
import { transcriptOf } from "@/lib/transcript";
import type { ArenaEvent, ArenaResult, Chat, TurnContext } from "@/lib/types";
import { readPractice } from "@/lib/practice-server";
export const maxDuration = 60;

export async function POST(req: Request) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Sign in and verify your email to submit a challenge." }, { status: 401 });
  const raw = await req.text();
  if (raw.length > 4_000_000) return NextResponse.json({ error: "Attempt too large" }, { status: 413 });
  let json: unknown; try { json = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = SubmissionSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid attempt. Reopen this challenge and try again." }, { status: 400 });
  const b = parsed.data;
  let c = getChallenge(b.slug);
  if (!c) return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });
  const now = new Date();
  let startedAt = new Date(b.startedAt);
  let reference: string | undefined;
  let version = challengeVersion(c);
  let token: string | undefined;
  let chats = b.chats as unknown as Chat[];
  const fail = (error: string, status = 503) => NextResponse.json({ error }, { status });
  if (member) {
    if (!b.serverId) return fail("Start a new challenge while signed in to save its score.", 409);
    const db = adminClient();
    const { data: a, error } = await db.from("attempts").select("*").eq("id", b.serverId).eq("member_id", member.id).eq("slug", b.slug).maybeSingle();
    if (error) return fail("Could not load this attempt. Try again.");
    if (!a) return fail("Attempt not found for this account and challenge.", 404);
    if (a.result) return NextResponse.json({ result: a.result, practice: await readPractice(member) });
    if (a.submitted_at || !a.contract) return fail("This attempt predates the updated rules. Please start it again.", 409);
    const frozen = a.contract as { challenge: ChallengeDef; reference: string };
    c = frozen.challenge; reference = frozen.reference; version = a.version; startedAt = new Date(a.started_at);
    const { data: saved, error: chatError } = await db.from("attempt_chats").select("*").eq("attempt_id", a.id);
    if (chatError) return fail("Could not load the saved conversation. Try again.");
    if (saved?.some((ch) => ch.pending)) return fail("Wait for the assistant to finish before submitting.", 409);
    // The content grader uses server-recorded conversations, not client-reported assistant replies.
    chats = (saved ?? []).map((ch) => {
      const workspaceChat = chats.find((x) => x.id === ch.chat_id);
      return { ...workspaceChat, id: ch.chat_id, title: workspaceChat?.title ?? ch.title,
        projectId: workspaceChat?.projectId ?? (ch.contexts as TurnContext[])?.at(-1)?.projectId ?? null,
        messages: ch.messages, contexts: ch.contexts } as Chat;
    });
    token = randomUUID();
    const expired = new Date(now.getTime() - 3 * 60_000).toISOString();
    const { data: claimed, error: claimError } = await db.from("attempts").update({ grading_token: token, grading_started_at: now.toISOString() })
      .eq("id", a.id).is("submitted_at", null).or(`grading_token.is.null,grading_started_at.lt.${expired}`).select("id").maybeSingle();
    if (claimError) return fail("Could not begin grading. Try again.");
    if (!claimed) return fail("This attempt is already being graded. Please wait, then retry.", 409);
  }

  const release = async () => { if (member && token) await adminClient().from("attempts").update({ grading_token: null, grading_started_at: null }).eq("id", b.serverId!).eq("grading_token", token); };
  if (startedAt.getTime() > now.getTime()) { await release(); return fail("Invalid start time. Please start a new attempt.", 400); }
  try {
    const seconds = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 1000));
    // Browser and database clocks differ. These gestures belong to the submitted
    // attempt; validate their target and outcome rather than comparing clock strings.
    const events = b.events as ArenaEvent[];
    const workspace = { ...b.workspace, chats } as unknown as WorkspaceEvidence;
    const behaviors = gradeBehaviors(c, events, workspace);
    const transcript = transcriptOf(chats);
    const latestChat = chats.filter((ch) => ch.messages.some((m) => m.role === "assistant")).sort((a, b) => (b.contexts?.at(-1)?.at ?? "").localeCompare(a.contexts?.at(-1)?.at ?? ""))[0];
    const finalAnswer = latestChat?.messages.findLast((m) => m.role === "assistant")?.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n") ?? "";
    const grade = c.checks.length ? await gradeAttempt(c, transcript, startedAt.toISOString().slice(0, 10), reference, finalAnswer) : { checks: [], feedback: "You completed the actions in the instructions.", model: "actions" };
    const passed = behaviors.every((x) => x.pass) && grade.checks.every((x) => x.verdict === "pass");
    const missing = behaviors.filter((x) => !x.pass);
    const feedback = missing.length ? `Still to do: ${missing.map((x) => x.label).join("; ")}.` : grade.feedback;
    const speedMult = speedMultiplier(seconds, c.minutes);
    const hintsUsed = Math.min(c.hints.length, Math.max(b.hintsUsed, events.filter((e) => e.type === "hint_used").length));
    const result: ArenaResult = { slug: c.slug, version, checkLabels: Object.fromEntries(c.checks.map((k) => [k.id, k.label])),
      points: computePoints(c.points, passed, speedMult, hintsUsed), maxPoints: c.points, passed, seconds, speedMult, hintsUsed,
      behaviors, checks: grade.checks, feedback, badges: passed ? c.badges : [], at: now.toISOString() };
    if (member && token) {
      const { error } = await adminClient().rpc("finish_arena_attempt", { p_id: b.serverId, p_member: member.id, p_token: token, p_result: result,
        p_grade: { ...result, model: grade.model, events, transcript } });
      if (error) throw new Error("Could not save grade");
    }
    return NextResponse.json({ result, practice: await readPractice(member) });
  } catch (e) {
    console.error("[submit]", e instanceof Error ? e.message : "Grading failed");
    await release();
    return fail("Grading or saving was unavailable. Your attempt is still open; try Submit again.");
  }
}
