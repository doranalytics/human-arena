import type { TurnContext } from "./types";
import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";

export interface ChatForGrading {
  title: string;
  projectName?: string;
  projectInstructions?: string;
  customInstructions?: string;
  memories?: string[];
  messages: UIMessage[];
  contexts?: TurnContext[];
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + " …[truncated]" : s);

/** Flattens UI messages, including tool calls and file markers, into text the grader can read. */
export function transcriptOf(chats: ChatForGrading[]): string {
  return chats
    .map((c) => {
      const head = [`=== CHAT: ${c.title} ===`];
      const body = c.messages.map((m) => {
        const lines: string[] = [];
        const ctx = c.contexts?.find((x) => x.messageId === m.id);
        const settings = ctx ? `SYSTEM SETTINGS (not user-written text):\n${JSON.stringify(ctx)}\n\n` : "";
        for (const p of m.parts) {
          if (p.type === "text") lines.push(p.text);
          else if (p.type === "file") {
            lines.push(`[attached file: ${p.filename ?? "file"} (${p.mediaType})]`);
            if (p.mediaType.startsWith("text/") && p.url.startsWith("data:")) {
              try { lines.push(clip(Buffer.from(p.url.split(",")[1], "base64").toString("utf8"), 24000)); } catch { /* file marker still available */ }
            }
          }
          else if (p.type === "source-url") lines.push(`[source: ${p.title ?? ""} ${p.url}]`);
          else if (isToolUIPart(p)) {
            const name = getToolName(p);
            const input = "input" in p && p.input !== undefined ? JSON.stringify(p.input) : "";
            const output = "output" in p && p.output !== undefined ? JSON.stringify(p.output) : "";
            lines.push(`[tool call: ${name} input=${clip(input, 16000)}]`);
            if (p.state === "output-error") lines.push(`[tool error: ${p.errorText}]`);
            if (output) lines.push(`[tool result: ${clip(output, 24000)}]`);
          }
        }
        return `${settings}${m.role.toUpperCase()}:\n${lines.join("\n")}`;
      });
      return [...head, ...body].join("\n\n");
    })
    .join("\n\n");
}
