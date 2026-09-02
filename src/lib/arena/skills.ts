/**
 * The skill map. A skill is a transferable AI capability: a feature you can operate
 * (web search, connectors, PDFs) or a prompting move you can make (constraints, make it
 * ask first, iteration). Challenges exercise one to four skills; passing unlocks them.
 *
 * 46 come from How to AI Games. Model choice and Skills are new: the arena can watch
 * them, the old app could not. "later" skills are on the wall but nothing grades them yet.
 */
export type SkillGroup = "Prompting moves" | "Input" | "Retrieval and agents" | "Creation" | "Setup and tools";
export type SkillStatus = "ready" | "later";

export interface SkillDef {
  emoji: string;
  name: string;
  group: SkillGroup;
  status: SkillStatus;
}

const s = (emoji: string, name: string, group: SkillGroup, status: SkillStatus = "ready"): SkillDef => ({ emoji, name, group, status });

export const SKILLS: Record<string, SkillDef> = {
  // prompting moves
  constraints: s("📏", "Constraints", "Prompting moves"),
  interviewing: s("❓", "Make it ask first", "Prompting moves"),
  iteration: s("🔁", "Iteration", "Prompting moves"),
  verification: s("✅", "Verify the output", "Prompting moves"),
  audience: s("🎓", "Audience switching", "Prompting moves"),
  steelman: s("⚖️", "Steelman", "Prompting moves"),
  roleplay: s("🎭", "Roleplay", "Prompting moves"),
  brainstorming: s("💡", "Brainstorming", "Prompting moves"),
  comparisons: s("🧮", "Comparisons", "Prompting moves"),
  tutoring: s("🎯", "Tutor mode", "Prompting moves"),
  "style-training": s("🪞", "Style training", "Prompting moves"),
  drafting: s("💬", "Drafting", "Prompting moves"),
  summarizing: s("📝", "Summarizing", "Prompting moves"),
  extraction: s("⛏️", "Data extraction", "Prompting moves"),
  "tool-choice": s("🧰", "Tool sense", "Prompting moves"),
  // input
  "file-upload": s("📎", "File upload", "Input"),
  pdf: s("📕", "PDF reading", "Input"),
  camera: s("📸", "Camera input", "Input"),
  ocr: s("📄", "Image to text", "Input"),
  screenshot: s("🖥️", "Screenshot input", "Input"),
  translation: s("🌍", "Translation", "Input"),
  "url-reading": s("🔗", "Link reading", "Input"),
  dictation: s("🗣️", "Voice dictation", "Input"),
  "voice-chat": s("🎙️", "Voice chat", "Input", "later"),
  // retrieval and agents
  "web-search": s("📰", "Live search", "Retrieval and agents"),
  "deep-research": s("🔬", "Deep research", "Retrieval and agents"),
  connectors: s("📬", "Connectors", "Retrieval and agents"),
  automations: s("⏰", "Automations", "Retrieval and agents", "later"),
  "browser-agent": s("🤖", "Browser agent", "Retrieval and agents", "later"),
  "computer-files": s("🧹", "File agent", "Retrieval and agents", "later"),
  extension: s("🌐", "Browser extension", "Retrieval and agents", "later"),
  "agent-building": s("🛠️", "Agent building", "Retrieval and agents", "later"),
  // creation
  "image-gen": s("🎨", "Image generation", "Creation", "later"),
  "image-edit": s("🪄", "Image editing", "Creation", "later"),
  artifacts: s("🧩", "Artifacts", "Creation", "later"),
  charts: s("📈", "Charts", "Creation", "later"),
  diagrams: s("🗺️", "Diagrams", "Creation", "later"),
  design: s("🖌️", "Claude Design", "Creation", "later"),
  "file-export": s("📦", "File export", "Creation", "later"),
  ics: s("📅", "Calendar files", "Creation", "later"),
  qr: s("🔳", "QR codes", "Creation", "later"),
  // setup and tools
  projects: s("🗂️", "Projects", "Setup and tools"),
  "custom-instructions": s("📋", "Custom instructions", "Setup and tools"),
  personalization: s("🏷️", "Personalization", "Setup and tools"),
  memory: s("🧠", "Memory", "Setup and tools"),
  "model-choice": s("🎛️", "Model choice", "Setup and tools"),
  skills: s("⚡", "Skills", "Setup and tools"),
};

export const SKILL_GROUPS: SkillGroup[] = ["Prompting moves", "Input", "Retrieval and agents", "Creation", "Setup and tools"];

export function skillFor(id: string): SkillDef {
  return SKILLS[id] ?? { emoji: "🏅", name: id, group: "Setup and tools", status: "ready" };
}

/** Tool sense is earned by passing five feature challenges rather than one of its own. */
export const TOOL_SENSE_THRESHOLD = 5;
