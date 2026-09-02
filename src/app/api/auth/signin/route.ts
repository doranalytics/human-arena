import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

/** Sends a magic link. */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Sign-in is not configured on this deployment." }, { status: 503 });
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const e = String(email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return NextResponse.json({ error: "That does not look like an email." }, { status: 400 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: e, options: { emailRedirectTo: `${origin}/auth/callback` } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
