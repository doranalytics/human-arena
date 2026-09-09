import { mergeLearningGuest } from "@/lib/learning/merge-guest";
import { NextResponse } from "next/server";
import { EmailVerifySchema } from "@/lib/email-auth";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

const reply = (body: { ok?: boolean; error?: string }, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Supabase verifies the code, then writes the session into this browser. */
export async function POST(request: Request) {
  if (!supabaseConfigured()) return reply({ error: "Sign-in is temporarily unavailable." }, 503);
  const parsed = EmailVerifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ error: "Enter your email and the six-digit code from your latest email." }, 400);
  const { email, token } = parsed.data;
  try {
    const supabase = await createClient();
    // A response can be lost after verification. Let a confirmed session retry
    // claiming its own profile without consuming the same one-time code twice.
    const { data: { user: current } } = await supabase.auth.getUser();
    if (!current?.email_confirmed_at || current.is_anonymous || current.email?.toLowerCase() !== email) {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error?.status === 429) return reply({ error: "Too many attempts. Please wait a few minutes before trying again." }, 429);
      if (error && error.status && error.status >= 500) return reply({ error: "Could not verify your code right now. Please try again." }, 503);
      if (error || !data.session || !data.user?.email_confirmed_at || data.user.is_anonymous) return reply({ error: "That code is incorrect or has expired. Use the code from your latest email, or request a new one." }, 400);
    }
    const { error } = await supabase.rpc("claim_member");
    if (error) return reply({ error: "Your email is verified, but we could not finish setting up your account. Please try again." }, 503);
    await mergeLearningGuest();
    return reply({ ok: true });
  } catch {
    return reply({ error: "Could not verify your code right now. Please try again." }, 503);
  }
}
