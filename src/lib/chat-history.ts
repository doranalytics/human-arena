import { isToolUIPart, type UIMessage } from "ai";

/** Older clients saved OpenAI output references but discarded their paired reasoning. */
export function repairChatHistory(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => {
    if (message.role !== "assistant" || message.parts.some((p) => p.type === "reasoning" && p.providerMetadata?.openai?.itemId)) return message;
    return { ...message, parts: message.parts.map((p) => {
      if (p.type === "text" && p.providerMetadata?.openai?.itemId) {
        const openai = { ...p.providerMetadata.openai }; delete openai.itemId;
        return { ...p, providerMetadata: { ...p.providerMetadata, openai } };
      }
      if (isToolUIPart(p) && !p.providerExecuted && p.callProviderMetadata?.openai?.itemId) {
        const openai = { ...p.callProviderMetadata.openai }; delete openai.itemId;
        return { ...p, callProviderMetadata: { ...p.callProviderMetadata, openai } };
      }
      return p;
    }) };
  });
}
