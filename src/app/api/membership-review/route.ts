import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { subscriberStatus } from "@/lib/subscriber-status";
export async function POST() {
  const m = await getMember();
  if (!m || m.isGuest)
    return NextResponse.json(
      {
        error:
          "Verify your account email first so we can safely check membership.",
      },
      { status: 401 },
    );
  const subscription = await subscriberStatus(m, true);
  if (subscription.paid)
    return NextResponse.json({ status: "verified", subscription });
  const { error } = await adminClient()
    .from("membership_reviews")
    .upsert(
      { member_id: m.id, email: m.email },
      { onConflict: "member_id", ignoreDuplicates: true },
    );
  if (error)
    return NextResponse.json(
      { error: "Could not save your review request. Please retry." },
      { status: 503 },
    );
  const { data, error: readError } = await adminClient()
    .from("membership_reviews")
    .select("status")
    .eq("member_id", m.id)
    .single();
  if (readError)
    return NextResponse.json(
      { error: "Could not load your review request. Please retry." },
      { status: 503 },
    );
  return NextResponse.json(
    { status: data.status, subscription },
    { headers: { "Cache-Control": "no-store" } },
  );
}
