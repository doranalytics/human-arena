import test from "node:test";
import assert from "node:assert/strict";
import { LEARNING_PATH, recommendedLesson, stopState } from "../src/lib/learning/path";
import { LESSONS, type LessonId, type LessonRun } from "../src/lib/learning/catalog";
const run = (id: LessonId, step: number, completed = false): LessonRun => ({ lesson_id: id, step, turns: [], completed_at: completed ? "2026-09-09" : null, feedback: "", last_pass: true, last_request: null, revision: step });

test("path stops cover every existing exercise once, with no new scoring units", () => {
  for (const lesson of LESSONS) {
    const path = LEARNING_PATH.find((p) => p.id === lesson.id)!;
    const indices = path.stops.flatMap((s) => Array.from({length:s.to-s.from},(_,i)=>s.from+i));
    assert.deepEqual(indices, lesson.exercises.map((_,i)=>i));
    assert.equal(path.stops.length, 4);
  }
});
test("path completion follows saved exercises, with one current stop per unfinished lesson", () => {
  for (const path of LEARNING_PATH) {
    for (let step=0;step<10;step++) {
      assert.equal(path.stops.filter((s)=>stopState(s,step)==="current").length,1);
      for (const stop of path.stops) if (stopState(stop,step)==="complete") assert.ok(step>=stop.to);
    }
    assert.ok(path.stops.every((s)=>stopState(s,10)==="complete"));
  }
});
test("recommendation honors the higher starting point and resumes unfinished work", () => {
  assert.equal(recommendedLesson([],"better-context"),"better-context");
  assert.equal(recommendedLesson([run("shape-answers",0)],"better-context"),"shape-answers");
  assert.equal(recommendedLesson([run("shape-answers",3)],"better-context"),"shape-answers");
  assert.equal(recommendedLesson([run("better-context",10,true)],"better-context"),"shape-answers");
  assert.equal(recommendedLesson([run("shape-answers",10,true),run("better-context",10,true)],"shape-answers"),undefined);
});
