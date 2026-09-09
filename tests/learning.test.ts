import test from "node:test";
import assert from "node:assert/strict";
import { LESSONS, learningPromise } from "../src/lib/learning/catalog";
import { assessChoice, learnerEvidence } from "../src/lib/learning/assessment";
import { OnboardingSchema, onboardingGoals } from "../src/lib/onboarding";

test("two independently accessible lessons have ten explicit contracts", () => {
  assert.equal(LESSONS.length, 2);
  for (const l of LESSONS) {
    assert.equal(l.exercises.length, 10);
    for (const e of l.exercises) {
      assert.ok(e.criterion.length > 15);
      assert.ok(e.instruction);
      assert.ok(e.group);
    }
    assert.equal(l.exercises[9].concept, "Your turn");
  }
  assert.ok(LESSONS[1].points > LESSONS[0].points);
});
test("recognition questions have one server-side answer and reject other choices", () => {
  for (const l of LESSONS)
    for (const [i, e] of l.exercises.entries())
      if (e.choices) {
        assert.equal(
          e.choices.filter((_, c) => assessChoice(l.id, i, c, e)).length,
          1,
        );
        assert.equal(assessChoice(l.id, i, 99, e), false);
        assert.equal(assessChoice(l.id, i, -1, e), false);
        assert.equal(assessChoice("unknown", i, 0, e), false);
      }
});
test("independent final scenario does not inherit previous answers", () => {
  for (const l of LESSONS) {
    assert.notEqual(l.exercises[9].group, l.exercises[8].group);
    assert.ok(l.exercises[9].source);
  }
  assert.equal(LESSONS[0].exercises[7].group, LESSONS[0].exercises[8].group);
});
test("onboarding accepts both surfaces and both starts, rejects invented ones", () => {
  for (const product of ["claude", "chatgpt"])
    for (const start of ["shape-answers", "better-context"])
      assert.equal(
        OnboardingSchema.safeParse({
          level: "connected",
          goal: "work",
          product,
          start,
        }).success,
        true,
      );
  assert.equal(
    OnboardingSchema.safeParse({
      level: "daily",
      goal: "work",
      product: "other",
    }).success,
    false,
  );
});
test("learning projection follows interests without calendar guarantees", () => {
  assert.ok(learningPromise(["Automation"]).join(" ").includes("inbox"));
  assert.ok(learningPromise(["Visuals"]).join(" ").includes("visual"));
  assert.ok(learningPromise(["Research"]).join(" ").includes("sources"));
});

test("onboarding saves multiple goals and accepts old single-goal drafts and requests", () => {
  const goals = ["Save time", "Improve my work", "Create something"];
  const base = { level: "daily", goal: "work" };
  assert.deepEqual(OnboardingSchema.parse({ ...base, motivation: goals }).motivation, goals);
  assert.deepEqual(OnboardingSchema.parse({ ...base, motivation: "Save time" }).motivation, ["Save time"]);
  assert.deepEqual(onboardingGoals(JSON.parse(JSON.stringify(goals))), goals);
  assert.deepEqual(onboardingGoals("Improve my work"), ["Improve my work"]);
  assert.deepEqual(onboardingGoals(undefined), []);
  assert.equal(OnboardingSchema.safeParse({ ...base, motivation: [] }).success, false);
});

test("technique grading never receives assistant output or unrelated exercises", () => {
 assert.deepEqual(learnerEvidence([{role:"user",content:"Pick by least travel",step:7,group:"a"},{role:"assistant",content:"I cannot decide",step:7,group:"a"},{role:"user",content:"Other lesson",step:0,group:"b"}],"a"),[{step:7,request:"Pick by least travel"}]);
});
