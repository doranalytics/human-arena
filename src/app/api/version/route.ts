import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** The build currently serving. The client compares it with the one it was built from. */
export async function GET() {
  return NextResponse.json({ version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || "dev" }, { headers: { "cache-control": "no-store" } });
}
