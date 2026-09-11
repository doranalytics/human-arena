import { isToolUIPart, getToolName, type UIMessage } from "ai";
import { needsReply } from "../chat-failure";

/** Retry only the latest failed turn, reusing the server's original user message. */
export function retryHistory(previous: UIMessage[], incoming: UIMessage[]): UIMessage[] {
  const index = previous.findLastIndex((m) => m.role === "user");
  const last = incoming.at(-1);
  if (index < 0 || last?.role !== "user" || last.id !== previous[index].id) throw new Error("The message to retry was not found. Send a new message.");
  if (!needsReply(previous)) throw new Error("This reply already finished. Send a new message to continue.");
  return previous.slice(0, index + 1);
}

/** Reuse server replies verbatim. Only a new user message or an answer to a pending question may be added. */
export function advanceHistory(previous: UIMessage[], incoming: UIMessage[]): UIMessage[] {
  const last = incoming.at(-1);
  if (!last) throw new Error("Send a message first");
  if (last.role === "user") {
    if (previous.some((m) => m.id === last.id)) throw new Error("This message was already processed");
    return [...previous, last];
  }
  const pending = previous.at(-1);
  if (!pending || pending.role !== "assistant" || last.id !== pending.id) throw new Error("Invalid conversation continuation");
  let answered = false;
  const parts = pending.parts.map((p) => {
    if (!isToolUIPart(p) || getToolName(p) !== "ask_user" || p.state !== "input-available") return p;
    const candidate = last.parts.find((x) => isToolUIPart(x) && x.toolCallId === p.toolCallId);
    if (!candidate || !isToolUIPart(candidate) || candidate.state !== "output-available") return p;
    const input = p.input as { options?: string[]; allowOther?: boolean };
    if (typeof candidate.output !== "string" || candidate.output.length > 1000 || (!input.allowOther && !input.options?.includes(candidate.output))) throw new Error("Invalid question answer");
    answered = true;
    return { ...p, state: "output-available" as const, output: candidate.output };
  });
  if (!answered) throw new Error("No pending question was answered");
  return [...previous.slice(0, -1), { ...pending, parts }];
}
