import type { Settings, PracticeGPT } from "./types";

/** The same explicit context is recorded for grading and sent to the assistant. */
export function chatPreferences(settings: Settings, gpt: PracticeGPT | undefined, memoryOn: boolean, projectMemories: string[] = []) {
  const useMemory = memoryOn && settings.memoryEnabled !== false;
  return {
    customInstructions: [settings.instructions, gpt?.instructions].filter(Boolean).join("\n\n"),
    memories: useMemory ? [...(settings.memories ?? []), ...projectMemories] : [],
    memoryOff: !useMemory,
  };
}
