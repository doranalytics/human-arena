import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

/** Sends a magic link. */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Sign-in is not configured on this deployment." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email;
  const e = String(email ?? "").trim().toLowerCase();
  if (e.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { emailRedirectTo: `${origin}/auth/callback` } });
    if (error?.code === "email_address_not_authorized") return NextResponse.json({ error: "Sign-up email delivery is not ready yet. Please try again later." }, { status: 503 });
    if (error?.status === 429) return NextResponse.json({ error: "Please wait a minute before requesting another link." }, { status: 429 });
    if (error) return NextResponse.json({ error: "Could not send your sign-in email. Please try again shortly." }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Email sign-in is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
