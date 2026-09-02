import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";

export interface ChatForGrading {
  title: string;
  projectName?: string;
  projectInstructions?: string;
  customInstructions?: string;
  memories?: string[];
  messages: UIMessage[];
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + " …[truncated]" : s);

/** Flattens UI messages, including tool calls and file markers, into text the grader can read. */
export function transcriptOf(chats: ChatForGrading[]): string {
  return chats
    .map((c) => {
      const head = [`=== CHAT: ${c.title} ===`];
      if (c.projectName) head.push(`Project: ${c.projectName}`);
      if (c.projectInstructions) head.push(`Project instructions in force:\n${c.projectInstructions}`);
      if (c.customInstructions) head.push(`Custom instructions in force:\n${c.customInstructions}`);
      if (c.memories?.length) head.push(`Memories in force:\n${c.memories.map((m) => `- ${m}`).join("\n")}`);
      const body = c.messages.map((m) => {
        const lines: string[] = [];
        for (const p of m.parts) {
          if (p.type === "text") lines.push(p.text);
          else if (p.type === "file") lines.push(`[attached file: ${p.filename ?? "file"} (${p.mediaType})]`);
          else if (isToolUIPart(p)) {
            const name = getToolName(p);
            const input = "input" in p && p.input !== undefined ? JSON.stringify(p.input) : "";
            const output = "output" in p && p.output !== undefined ? JSON.stringify(p.output) : "";
            lines.push(`[tool call: ${name} input=${clip(input, 300)}]`);
            if (output) lines.push(`[tool result: ${clip(output, 1600)}]`);
          }
        }
        return `${m.role.toUpperCase()}:\n${lines.join("\n")}`;
      });
      return [...head, ...body].join("\n\n");
    })
    .join("\n\n");
}
