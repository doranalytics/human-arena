import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { experimental_transcribe as transcribe } from "ai";

export const maxDuration = 60;

const MODEL = "gpt-4o-transcribe";

/** Whether hosted transcription is available on this deployment. */
export async function GET() {
  return NextResponse.json({ enabled: !!process.env.OPENAI_API_KEY, model: MODEL });
}

/** Transcribes one recorded clip (multipart field "audio"). */
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Transcription is not configured." }, { status: 503 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No audio." }, { status: 400 });
  if (file.size > 20_000_000) return NextResponse.json({ error: "Clip too long." }, { status: 413 });
  try {
    const openai = createOpenAI({ apiKey });
    const audio = new Uint8Array(await file.arrayBuffer());
    const result = await transcribe({ model: openai.transcription(MODEL), audio, providerOptions: { openai: { language: "en" } } });
    return NextResponse.json({ text: result.text, model: MODEL });
  } catch (e) {
    console.error("[transcribe]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not transcribe that clip." }, { status: 502 });
  }
}
