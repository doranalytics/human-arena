import { NextResponse } from "next/server";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, stepCountIs, streamText, tool, type ToolSet, type UIMessage } from "ai";
import { z } from "zod";
import { EFFORTS, MODELS, FAST_FALLBACK, isEffort, isModelChoice } from "@/lib/models";
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
  /** Cowork: autonomous multi-step work with the connected tools */
  cowork?: boolean;
  connectors?: string[];
  skill?: { name: string; prompt: string } | null;
  project?: { name: string; instructions: string; files: { name: string; text: string }[] } | null;
  userName?: string;
  /** custom instructions from Customize */
  instructions?: string;
  /** facts saved with the remember tool */
  memories?: string[];
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
  if (b.cowork)
    parts.push(
      `COWORK MODE. The user handed you a task rather than a question. Work like a capable colleague: write a two-to-five step plan in one short line each, then carry it out using the tools you have (connectors, read_link, web search when on) without stopping to ask unless something is genuinely blocking. Chain as many tool calls as the task needs. Finish with the deliverable itself (the numbers, the draft, the list), then a two-line summary of what you did and anything you could not do.`,
    );
  if (b.project) {
    parts.push(`PROJECT: ${b.project.name}\nProject instructions (follow them in every reply):\n${b.project.instructions || "(none)"}`);
    if (b.project.files.length)
      parts.push(`Project files:\n` + b.project.files.map((f) => `--- ${f.name} ---\n${f.text.slice(0, 20000)}`).join("\n\n"));
  }
  if (b.skill) parts.push(`SKILL /${b.skill.name} is active for this reply. Follow it exactly:\n${b.skill.prompt}`);
  if (b.instructions?.trim()) parts.push(`CUSTOM INSTRUCTIONS from the user's settings (follow them in every reply):\n${b.instructions.trim().slice(0, 2000)}`);
  if (b.memories?.length) parts.push(`MEMORY. Facts the user asked you to remember in earlier chats:\n` + b.memories.slice(-30).map((m) => `- ${m}`).join("\n"));
  parts.push(`Tools always available: read_link fetches a web page the user pastes a URL for (use it whenever a message contains a URL and the user wants something from that page); remember saves a fact the user explicitly asks you to remember (call it, then confirm in one short sentence).`);
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) return demoResponse(b);

  // Fast runs on OpenAI (GPT-5.6 Luna) when its key is present, else Claude stands in. Smart is Claude.
  const wanted = MODELS[model];
  const useOpenAI = wanted.provider === "openai" && !!openaiKey;
  const tools: ToolSet = { ...connectorTools(connected), ...baseTools() };
  const search = b.webSearch || b.research;
  let languageModel;
  let providerOptions: Parameters<typeof streamText>[0]["providerOptions"];
  if (useOpenAI) {
    const openai = createOpenAI({ apiKey: openaiKey });
    languageModel = openai(wanted.id);
    if (search) tools.web_search = openai.tools.webSearch({ searchContextSize: b.research ? "high" : "medium" });
    providerOptions = { openai: { reasoningEffort: EFFORTS[effort].openaiEffort } };
  } else {
    if (!anthropicKey) return demoResponse(b);
    const anthropic = createAnthropic({ apiKey: anthropicKey });
    languageModel = anthropic(wanted.provider === "anthropic" ? wanted.id : FAST_FALLBACK);
    if (search) tools.web_search = anthropic.tools.webSearch_20250305({ maxUses: b.research ? 10 : 4 });
    const budget = EFFORTS[effort].thinkingBudget;
    providerOptions = budget ? { anthropic: { thinking: { type: "enabled", budgetTokens: budget } } } : undefined;
  }

  const result = streamText({
    model: languageModel,
    system: systemPrompt(b, connected),
    messages: await convertToModelMessages(inlineTextFiles(b.messages)),
    tools,
    stopWhen: stepCountIs(b.research || b.cowork ? 20 : 8),
    maxOutputTokens: b.research ? 8000 : 4000,
    providerOptions,
    onError: ({ error }) => console.error("[chat]", error instanceof Error ? error.message : error),
  });
  return result.toUIMessageStreamResponse({ sendReasoning: false, sendSources: true });
}

/** Tools every chat has: link reading and memory. */
function baseTools(): ToolSet {
  return {
    read_link: tool({
      description: "Fetch a web page by URL and return its readable text. Use when the user pastes a link and asks about it.",
      inputSchema: z.object({ url: z.string().url() }),
      execute: async ({ url }) => {
        try {
          const u = new URL(url);
          if (!/^https?:$/.test(u.protocol)) return { error: "Only http(s) links can be read." };
          const r = await fetch(u.toString(), { headers: { "user-agent": "Mozilla/5.0 (compatible; HumanArena/1.0)", accept: "text/html,application/xhtml+xml,text/plain" }, signal: AbortSignal.timeout(12000), redirect: "follow" });
          if (!r.ok) return { error: `The page answered ${r.status}.` };
          const html = await r.text();
          const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
          const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
          return { url: u.toString(), title, text: text.slice(0, 12000), truncated: text.length > 12000 };
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Could not fetch that page." };
        }
      },
    }),
    remember: tool({
      description: "Save one fact about the user to long-term memory so future chats know it. Only when the user asks you to remember something.",
      inputSchema: z.object({ fact: z.string().min(3).max(300).describe("The fact, in third person, e.g. 'Favourite trail is the Timberline Trail.'") }),
      execute: async ({ fact }) => ({ saved: true, fact }),
    }),
  };
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
