import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { OnboardingSchema } from "@/lib/onboarding";
export async function POST(request: Request) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Sign in to save your setup." }, { status: 401 });
  const parsed = OnboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose an answer for each question." }, { status: 400 });
  const completedAt = member.onboarded_at ?? new Date().toISOString();
  const { error } = await adminClient().from("members").update({ onboarding: { ...parsed.data, version: 1 }, onboarded_at: completedAt }).eq("id", member.id);
  if (error) return NextResponse.json({ error: "Could not save your setup. Please try again." }, { status: 503 });
  return NextResponse.json({ onboarding: parsed.data, onboardedAt: completedAt });
}
