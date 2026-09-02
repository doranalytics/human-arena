import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient, adminConfigured } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/server";
import type { ArenaResult } from "@/lib/types";

/** Who am I, plus my scored results so a fresh browser can catch up. */
export async function GET() {
  const configured = supabaseConfigured() && adminConfigured();
  const member = await getMember();
  if (!member) return NextResponse.json({ configured, member: null, results: [] });
  const { data } = await adminClient().from("results").select("slug,points,passed,seconds,hints_used,grade,submitted_at").eq("member_id", member.id);
  const results: ArenaResult[] = (data ?? []).map((r) => {
    const g = (r.grade ?? {}) as Partial<ArenaResult>;
    return {
      slug: r.slug,
      points: r.points,
      maxPoints: 0,
      passed: r.passed,
      seconds: r.seconds,
      speedMult: 1,
      hintsUsed: r.hints_used,
      behaviors: g.behaviors ?? [],
      checks: g.checks ?? [],
      feedback: g.feedback ?? "",
      badges: [],
      at: r.submitted_at,
    };
  });
  return NextResponse.json({ configured, member: { id: member.id, email: member.email, name: member.display_name || member.pseudonym, avatar: member.avatar_url }, results });
}

export async function PATCH(request: Request) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const b = (await request.json().catch(() => ({}))) as { name?: string; product?: string; avatar?: string | null };
  const patch: Record<string, unknown> = {};
  if ("name" in b) patch.display_name = String(b.name ?? "").trim().slice(0, 80) || null;
  if ("avatar" in b) {
    const a = String(b.avatar ?? "");
    patch.avatar_url = a.startsWith("data:image/") && a.length < 60_000 ? a : a.startsWith("https://") ? a.slice(0, 500) : null;
  }
  if (b.product === "claude" || b.product === "chatgpt") patch.product = b.product;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true });
  const { error } = await adminClient().from("members").update(patch).eq("id", member.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
