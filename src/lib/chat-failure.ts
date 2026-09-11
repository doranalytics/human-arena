import type { UIMessage } from "ai";

/** Safe to show publicly: never forward provider response bodies or credentials. */
export function chatFailure(error: unknown) {
  let e = error;
  for (let i = 0; i < 3 && e && typeof e === "object"; i++) {
    if ("statusCode" in e) break;
    if ("lastError" in e) e = e.lastError;
    else if ("cause" in e) e = e.cause;
    else break;
  }
  const status = e && typeof e === "object" && "statusCode" in e && typeof e.statusCode === "number" ? e.statusCode : undefined;
  if (status === 401 || status === 403) return { status, kind: "authentication", message: "The AI connection could not authenticate. Your message is saved. Please retry once the connection is restored." };
  if (status === 429) return { status, kind: "rate_limit", message: "The AI service is busy or temporarily limited. Your message is saved. Wait a moment, then retry." };
  return { status, kind: "reply_failed", message: "The AI reply could not finish. Your message is saved. Please retry." };
}

export function replyFailed(message: UIMessage) {
  return !!message.metadata && typeof message.metadata === "object" && "replyFailed" in message.metadata && message.metadata.replyFailed === true;
}

export function needsReply(messages: UIMessage[]) {
  const last = messages.at(-1);
  return !last || last.role !== "assistant" || replyFailed(last) || !last.parts.some((p) => p.type === "text" && p.text.trim());
}
