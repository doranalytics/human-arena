import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { circleConfig, syncCircleMembers } from "@/lib/circle/service";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || auth.length !== expected.length || !timingSafeEqual(auth, expected)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!circleConfig()) return NextResponse.json({ status: "not_configured", message: "Circle API credentials have not been configured" });
  try { return NextResponse.json({ status: "complete", ...await syncCircleMembers() }); }
  catch (error) {
    console.error("[circle-sync] Import failed; see circle_sync_runs");
    return NextResponse.json({ error: error instanceof Error ? error.message : "Circle import failed" }, { status: 503 });
  }
}
