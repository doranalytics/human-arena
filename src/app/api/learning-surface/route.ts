import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
export async function POST(req: Request) {
  const m = await getMember();
  if (!m)
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!["claude", "chatgpt"].includes(b?.product))
    return NextResponse.json({ error: "Choose an app" }, { status: 400 });
  const { error } = await adminClient()
    .from("members")
    .update({
      product: b.product,
      onboarding: { ...m.onboarding, product: b.product },
    })
    .eq("id", m.id);
  return NextResponse.json(
    error ? { error: "Could not save app choice" } : { ok: true },
    { status: error ? 503 : 200 },
  );
}
