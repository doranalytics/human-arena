import { NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, stepCountIs, streamText, type ToolSet, type UIMessage } from "ai";
import { EFFORTS, MODELS, isEffort, isModelChoice } from "@/lib/models";
import { connectorTools } from "@/lib/connector-tools";
import { isConnectorId, type ConnectorId } from "@/lib/connectors";
import { BUILTIN_SKILLS } from "@/lib/skills";
import { COMPANY, PEOPLE, personaBlurb } from "@/lib/company/world";

export const maxDuration = 120;

interface Body {
  messages: UIMessage[];
  model?: string;
  effort?: string;
  webSearch?: boolean;
  research?: boolean;
  connectors?: string[];
  skill?: { name: string; prompt: string } | null;
  project?: { name: string; instructions: string; files: { name: string; text: string }[] } | null;
  userName?: string;
}

function systemPrompt(b: Body, connected: ConnectorId[]) {
  const name = (b.userName || "the user").trim();
  const parts = [
    `You are Claude, a helpful AI assistant inside Human Arena, a training environment that looks and behaves like a modern chat assistant. Be warm, direct and concise. Use markdown when it helps (headings, lists, tables); never pad.`,
    `Context: ${personaBlurb(name)} ${COMPANY.name} is a ${COMPANY.headcount}-person outdoor gear company in ${COMPANY.hq}. The COO is ${PEOPLE.priya.name}, the CFO is ${PEOPLE.marcus.name}. Treat this workplace as real; do not call it fictional. If the user asks about company facts you have no tool for, say what you would need connected.`,
    connected.length
      ? `Connected sources: ${connected.join(", ")}. Use their tools whenever the question is about the company's mail, files, data or calendar, and cite what you read (file name, email subject, table).`
      : `No data sources are connected. If the user asks about their inbox, files, company numbers or calendar, tell them you cannot see those until a connector is connected (Connectors are in the sidebar).`,
  ];
  if (b.webSearch && !b.research) parts.push(`Web search is on. Search when the question needs current information, and cite sources with links and dates.`);
  if (b.research)
    parts.push(
      `RESEARCH MODE. Work like a research assistant: run several searches from different angles (at least four), read enough to be sure, then write a structured report: a title, a two-sentence summary, three or more headed sections, and a Sources list with links. Prefer recent, primary sources. State the date of each finding.`,
    );
  if (b.project) {
    parts.push(`PROJECT: ${b.project.name}\nProject instructions (follow them in every reply):\n${b.project.instructions || "(none)"}`);
    if (b.project.files.length)
      parts.push(`Project files:\n` + b.project.files.map((f) => `--- ${f.name} ---\n${f.text.slice(0, 20000)}`).join("\n\n"));
  }
  if (b.skill) parts.push(`SKILL /${b.skill.name} is active for this reply. Follow it exactly:\n${b.skill.prompt}`);
  return parts.join("\n\n");
}

/** Text-like attachments become inline text; images and PDFs go through as files. */
function inlineTextFiles(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => ({
    ...m,
    parts: m.parts.map((p) => {
      if (p.type !== "file") return p;
      const isText = p.mediaType.startsWith("text/") || /json|csv|markdown|xml/.test(p.mediaType) || /\.(txt|md|csv|json|tsv|log)$/i.test(p.filename ?? "");
      if (!isText || !p.url.startsWith("data:")) return p;
      try {
        const b64 = p.url.split(",")[1] ?? "";
        const text = Buffer.from(b64, "base64").toString("utf8");
        return { type: "text" as const, text: `<attached_file name="${p.filename ?? "file"}">\n${text.slice(0, 60000)}\n</attached_file>` };
      } catch {
        return p;
      }
    }),
  }));
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b || !Array.isArray(b.messages)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const model = isModelChoice(b.model) ? b.model : "fast";
  const effort = isEffort(b.effort) ? b.effort : "medium";
  const connected = (b.connectors ?? []).filter(isConnectorId);
  if (b.skill && !b.skill.prompt) {
    const s = BUILTIN_SKILLS.find((x) => x.name === b.skill!.name);
    if (s) b.skill = { name: s.name, prompt: s.prompt };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return demoResponse(b);

  const anthropic = createAnthropic({ apiKey });
  const tools: ToolSet = { ...connectorTools(connected) };
  if (b.webSearch || b.research) tools.web_search = anthropic.tools.webSearch_20250305({ maxUses: b.research ? 10 : 4 });
  const budget = EFFORTS[effort].thinkingBudget;

  const result = streamText({
    model: anthropic(MODELS[model].id),
    system: systemPrompt(b, connected),
    messages: await convertToModelMessages(inlineTextFiles(b.messages)),
    tools,
    stopWhen: stepCountIs(b.research ? 16 : 8),
    maxOutputTokens: b.research ? 8000 : 4000,
    providerOptions: budget ? { anthropic: { thinking: { type: "enabled", budgetTokens: budget } } } : undefined,
    onError: ({ error }) => console.error("[chat]", error instanceof Error ? error.message : error),
  });
  return result.toUIMessageStreamResponse({ sendReasoning: false, sendSources: true });
}

/** No key: a canned, streamed reply so the whole UI can be exercised. */
function demoResponse(b: Body) {
  const last = b.messages[b.messages.length - 1];
  const asked = last?.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join(" ") ?? "";
  const text = `**Demo mode.** No \`ANTHROPIC_API_KEY\` is set, so this is a canned reply.\n\nYou said: "${asked.slice(0, 200)}"\n\nSettings that reached the server: model **${b.model ?? "fast"}**, effort **${b.effort ?? "medium"}**, web search **${b.webSearch ? "on" : "off"}**, research **${b.research ? "on" : "off"}**, connectors **${(b.connectors ?? []).join(", ") || "none"}**${b.skill ? `, skill **/${b.skill.name}**` : ""}${b.project ? `, project **${b.project.name}**` : ""}.`;
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const id = "demo";
      writer.write({ type: "text-start", id });
      for (const word of text.split(/(\s+)/)) {
        writer.write({ type: "text-delta", id, delta: word });
        await new Promise((r) => setTimeout(r, 12));
      }
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
