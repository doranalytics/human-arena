import test from "node:test";
import assert from "node:assert/strict";
import { chatPreferences } from "../src/lib/chat-preferences";
import { surfaceCopy } from "../src/lib/surface-copy";
import { getState, setState, saveGPT, openGPT } from "../src/lib/store";

test("GPT instructions are scoped to the chosen assistant, not all future chats", () => {
  const s = { ...getState().settings, instructions: "Be concise", memories: ["Own memory"] };
  const gpt = { id: "g", name: "Coach", description: "", instructions: "Ask one question at a time" };
  assert.equal(chatPreferences(s, gpt, true).customInstructions, "Be concise\n\nAsk one question at a time");
  assert.equal(chatPreferences(s, undefined, true).customInstructions, "Be concise");
  assert.deepEqual(chatPreferences({ ...s, memoryEnabled: false }, gpt, true, ["Project memory"]), { customInstructions: "Be concise\n\nAsk one question at a time", memories: [], memoryOff: true });
  assert.equal(chatPreferences(s, gpt, false).memoryOff, true);
});
test("creating and using a GPT does not count as creating a skill or project", () => {
  const before = getState();
  try {
    setState({ attempt: null, gpts: [], chats: [] });
    const gpt = saveGPT({ name: "Coach", description: "A test", instructions: "Ask questions" });
    openGPT(gpt.id);
    assert.equal(getState().chats[0].gptId, gpt.id);
    assert.equal(getState().chats[0].draft, true);
    assert.equal(getState().skills, before.skills);
    assert.equal(getState().projects, before.projects);
    setState({ attempt: { id: "test", slug: "ten-words", startedAt: new Date().toISOString(), events: [], hintsUsed: 0, chatIds: [] } });
    openGPT(gpt.id);
    assert.equal(getState().chats[0].title, "Constraints");
    assert.equal(getState().chats[0].attemptId, "test");
  } finally { setState(before); }
});
test("surface labels change without changing the instructional requirement", () => {
  const instruction = "Connect Gmail in Customize > Connectors. Switch to Cowork.";
  assert.equal(surfaceCopy(instruction, "claude"), instruction);
  assert.equal(surfaceCopy(instruction, "chatgpt"), "Connect Gmail in Settings > Apps. Switch to Agent mode.");
});
