import type { Exercise, LessonTurn } from "./catalog";
/** Answers live on the server, never accepted from submitted completion flags. */
const answers: Record<string, Record<number, number>> = {
  "shape-answers": { 0: 1, 2: 1, 4: 1 },
  "better-context": { 0: 1, 2: 0 },
};
export function assessChoice(
  id: string,
  step: number,
  choice: number,
  exercise: Exercise,
) {
  return (
    !!exercise.choices &&
    Number.isInteger(choice) &&
    answers[id]?.[step] === choice
  );
}

/** Prompting lessons assess learner decisions, not model compliance. */
export function learnerEvidence(turns: LessonTurn[], group: string) {
 return turns.filter(t => t.group === group && t.role === "user").map(t => ({ step: t.step, request: t.content }));
}
