import { SESSION_REQUIRED } from "@/lib/testing-mode";
import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { OnboardingSchema, ONBOARDING_VERSION } from "@/lib/onboarding";
import { subscriberStatus } from "@/lib/subscriber-status";
export async function POST(request: Request) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: SESSION_REQUIRED }, { status: 401 });
  const parsed = OnboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose an answer for each question." }, { status: 400 });
  const completedAt = member.onboarded_at ?? new Date().toISOString();
  const onboarding = { ...parsed.data, version: ONBOARDING_VERSION };
  const { error } = await adminClient().from("members").update({ onboarding, product: parsed.data.product, onboarded_at: completedAt }).eq("id", member.id);
  if (error) return NextResponse.json({ error: "Could not save your setup. Please try again." }, { status: 503 });
  return NextResponse.json({ onboarding, onboardedAt: completedAt, subscription: await subscriberStatus(member) });
}

/** Remember that this member found (or dismissed the pointer to) Challenges. */
export async function PATCH(request: Request) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: SESSION_REQUIRED }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.action !== "guide_seen") return NextResponse.json({ error: "Unknown onboarding action." }, { status: 400 });
  const guideSeenAt = member.challenge_guide_seen_at ?? new Date().toISOString();
  const { error } = await adminClient().from("members").update({ challenge_guide_seen_at: guideSeenAt }).eq("id", member.id);
  return error ? NextResponse.json({ error: "Could not save this step." }, { status: 503 }) : NextResponse.json({ guideSeenAt });
}
