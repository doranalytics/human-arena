import { test } from "node:test";
import assert from "node:assert/strict";
import { convertToModelMessages, type UIMessage } from "ai";
import { repairChatHistory } from "../src/lib/chat-history";

test("legacy Luna text and tool calls can be replayed without orphaned reasoning references", async () => {
  const messages: UIMessage[] = [{ id: "reply", role: "assistant", parts: [
    { type: "text", text: "Here are your notes.", providerMetadata: { openai: { itemId: "msg_orphan", phase: "final_answer" } } },
    { type: "tool-remember", toolCallId: "call_1", state: "output-available", input: { fact: "Keep answers short" }, output: { saved: true }, callProviderMetadata: { openai: { itemId: "fc_orphan" } } },
  ] }];
  const original = structuredClone(messages);
  const converted = await convertToModelMessages(repairChatHistory(messages));
  assert.ok(!JSON.stringify(converted).includes("orphan"));
  assert.ok(JSON.stringify(converted).includes("Here are your notes."));
  assert.ok(JSON.stringify(converted).includes("call_1"));
  assert.ok(JSON.stringify(converted).includes("final_answer"));
  assert.deepEqual(messages, original, "do not alter the authoritative grading transcript");
});

test("paired reasoning and Anthropic metadata are preserved", () => {
  const messages: UIMessage[] = [{ id: "reply", role: "assistant", parts: [
    { type: "reasoning", text: "", providerMetadata: { openai: { itemId: "rs_paired" } } },
    { type: "text", text: "Done", providerMetadata: { openai: { itemId: "msg_paired" } } },
  ] }, { id: "claude", role: "assistant", parts: [{ type: "text", text: "Hello", providerMetadata: { anthropic: { cacheControl: "ephemeral" } } }] }];
  assert.deepEqual(repairChatHistory(messages), messages);
});
