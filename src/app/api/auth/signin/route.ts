import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase/server";
import { EmailSignInSchema } from "@/lib/email-auth";

/** Hosted confirmation and magic-link templates both send an email code. */
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Sign-in is not configured on this deployment." }, { status: 503 });
  const parsed = EmailSignInSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  // Sending a code needs no browser-specific PKCE verifier or redirect. Only
  // /api/auth/verify creates a session, in the browser that enters the code.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  try {
    const { error } = await supabase.auth.signInWithOtp({ email: parsed.data.email });
    if (error?.code === "email_address_not_authorized") return NextResponse.json({ error: "Sign-up email delivery is not ready yet. Please try again later." }, { status: 503 });
    if (error?.status === 429) return NextResponse.json({ error: "Too many email requests. Please wait a few minutes before trying again." }, { status: 429 });
    if (error) return NextResponse.json({ error: "Could not send your sign-in email. Please try again shortly." }, { status: 503 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Email sign-in is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
