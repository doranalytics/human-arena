import { NextResponse } from "next/server";
import type { UIMessage } from "ai";
import { getMember } from "@/lib/auth";
import { adminClient, adminConfigured } from "@/lib/supabase/admin";
import { getChallenge } from "@/lib/arena/challenges";
import { computePoints, speedMultiplier } from "@/lib/arena/types";
import { gradeAttempt } from "@/lib/arena/grader";
import { transcriptOf } from "@/lib/transcript";
import type { ArenaEvent, ArenaResult } from "@/lib/types";

export const maxDuration = 60;

interface Body {
  slug: string;
  serverId?: string | null;
  startedAt: string;
  hintsUsed: number;
  events: ArenaEvent[];
  chats: { title: string; projectName?: string; projectInstructions?: string; messages: UIMessage[] }[];
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Body | null;
  const c = b && getChallenge(b.slug);
  if (!b || !c) return NextResponse.json({ error: "Unknown challenge" }, { status: 400 });

  const member = await getMember();
  const now = new Date();
  let startedAt = new Date(b.startedAt);
  let attemptId: string | null = null;
  if (member && b.serverId) {
    const { data } = await adminClient().from("attempts").select("id,started_at,submitted_at").eq("id", b.serverId).eq("member_id", member.id).maybeSingle();
    if (data && !data.submitted_at) {
      startedAt = new Date(data.started_at);
      attemptId = data.id;
      await adminClient().from("attempts").update({ submitted_at: now.toISOString() }).eq("id", data.id);
    }
  }
  const seconds = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 1000));

  // 1. Behaviors: verified from the event log, no model needed.
  const events = Array.isArray(b.events) ? b.events : [];
  const behaviors = c.behaviors.map((bh) => ({
    id: bh.id,
    label: bh.label,
    pass: events.some((e) => e.type === bh.event && (!bh.detail || e.detail === bh.detail)),
  }));

  // 2. Checks: the grader reads the transcript against the key.
  const transcript = transcriptOf(b.chats ?? []);
  let checks: ArenaResult["checks"] = [];
  let feedback = "";
  let model = "none";
  try {
    const g = await gradeAttempt(c, transcript, startedAt.toISOString().slice(0, 10));
    checks = g.checks;
    feedback = g.feedback;
    model = g.model;
  } catch (e) {
    console.error("[submit] grader failed", e instanceof Error ? e.message : e);
    checks = c.checks.map((k) => ({ id: k.id, verdict: "fail", evidence: "The grader was unavailable. Try submitting again." }));
    feedback = "The grader could not run. Nothing was recorded; try again in a moment.";
    return NextResponse.json({ error: "grader", result: null, detail: feedback }, { status: 503 });
  }

  const passed = behaviors.every((x) => x.pass) && checks.every((k) => k.verdict === "pass");
  const missing = behaviors.filter((x) => !x.pass);
  if (missing.length) feedback = `The environment did not see you ${missing.map((m) => m.label.toLowerCase()).join(" or ")}. ${feedback}`;
  const speedMult = speedMultiplier(seconds, c.minutes);
  const hintsUsed = Math.max(0, Number(b.hintsUsed) || 0);
  const points = computePoints(c.points, passed, speedMult, hintsUsed);
  const result: ArenaResult = {
    slug: c.slug,
    points,
    maxPoints: c.points,
    passed,
    seconds,
    speedMult,
    hintsUsed,
    behaviors,
    checks,
    feedback,
    badges: passed ? c.badges : [],
    at: now.toISOString(),
  };

  if (member && adminConfigured()) {
    await adminClient()
      .from("results")
      .insert({ member_id: member.id, attempt_id: attemptId, slug: c.slug, points, passed, seconds, hints_used: hintsUsed, grade: { behaviors, checks, feedback, model, events } });
  }
  return NextResponse.json({ result });
}
