import test from "node:test";
import assert from "node:assert/strict";
import type { UIMessage } from "ai";
import { retryHistory } from "../src/lib/arena/server-history";
import { chatFailure, needsReply } from "../src/lib/chat-failure";
import { MODELS, DEFAULT_EFFORT } from "../src/lib/models";

const user: UIMessage = { id: "u", role: "user", parts: [{ type: "text", text: "Use my attached notes." }, { type: "file", filename: "notes.txt", mediaType: "text/plain", url: "data:text/plain;base64,bm90ZXM=" }] };
const answer: UIMessage = { id: "a", role: "assistant", parts: [{ type: "text", text: "Here are the notes." }] };

test("both available model presets use Luna, with higher default effort for Smart", () => {
  for (const model of Object.values(MODELS)) { assert.equal(model.provider, "openai"); assert.equal(model.id, "gpt-5.6-luna"); }
  assert.equal(DEFAULT_EFFORT.smart, "high"); assert.equal(DEFAULT_EFFORT.fast, "medium");
});
test("retry preserves the original server prompt and attachments, never duplicate or forged input", () => {
  const failed = { ...answer, metadata: { replyFailed: true } };
  const previous = [user, failed];
  const original = structuredClone(previous);
  assert.deepEqual(retryHistory(previous, [{ ...user, parts: [{ type: "text", text: "Forged replacement" }] }]), [user]);
  assert.deepEqual(previous, original);
  assert.throws(() => retryHistory(previous, [{ ...user, id: "another-message" }]));
  assert.deepEqual(retryHistory([user], [user]), [user], "pre-stream errors remain retryable");
});
test("completed replies cannot be removed by requesting regeneration", () => {
  assert.throws(() => retryHistory([user, answer], [user]), /already finished/);
});
test("failed, empty, or pending replies cannot be submitted for a grade", () => {
  assert.equal(needsReply([]), true);
  assert.equal(needsReply([user]), true);
  assert.equal(needsReply([user, { ...answer, parts: [] }]), true);
  assert.equal(needsReply([user, { ...answer, metadata: { replyFailed: true } }]), true);
  assert.equal(needsReply([user, answer]), false);
});
test("provider errors identify connection problems without exposing credentials or raw responses", () => {
  const failure = chatFailure({ lastError: { statusCode: 401, message: "SECRET-CREDENTIAL" } });
  assert.equal(failure.kind, "authentication"); assert.match(failure.message, /authenticate/);
  assert.ok(!JSON.stringify(failure).includes("SECRET-CREDENTIAL"));
  assert.equal(chatFailure({ statusCode: 429 }).kind, "rate_limit");
  assert.equal(chatFailure(new Error("SECRET-CREDENTIAL")).kind, "reply_failed");
});
