import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Magic-link landing: turns the code into a session cookie, claims the member row, then goes home. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();
  const fail = (m: string) => NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(m)}`, url.origin));
  let error: { message: string } | null = null;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "magiclink" | "email" }));
  else return fail("The link is missing its code. Ask for a new one.");
  if (error) return fail(error.message);
  const { error: claimErr } = await supabase.rpc("claim_member");
  if (claimErr) console.error("[auth] claim_member failed", claimErr.message);
  return NextResponse.redirect(new URL("/?signed_in=1", url.origin));
}
