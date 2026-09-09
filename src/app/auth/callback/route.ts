import { mergeLearningGuest } from "@/lib/learning/merge-guest";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Compatibility for links already sent before switching to in-window codes. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();
  const fail = () => NextResponse.redirect(new URL("/?auth_error=link_failed", url.origin));
  let error: { message: string } | null = null;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined));
  else if (tokenHash && (type === "email" || type === "magiclink" || type === "signup")) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  else return fail();
  if (error) return fail();
  const { error: claimErr } = await supabase.rpc("claim_member");
  if (claimErr) {
    console.error("[auth] Could not claim verified member profile");
    return fail();
  }
  await mergeLearningGuest();
  return NextResponse.redirect(new URL("/?signed_in=1", url.origin));
}
