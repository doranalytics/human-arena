import type { Exercise } from "./catalog";
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
