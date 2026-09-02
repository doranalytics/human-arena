import type { UIMessage } from "ai";
import type { Effort, ModelChoice } from "./models";

export interface ProjectFile {
  id: string;
  name: string;
  /** text content (v0 keeps project knowledge as text) */
  text: string;
  size: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  files: ProjectFile[];
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  projectId: string | null;
  messages: UIMessage[];
  createdAt: string;
  updatedAt: string;
  /** set while a challenge attempt is running so its chats can be collected at submit */
  attemptId?: string;
}

export interface CustomSkill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  createdAt?: string;
}

export interface Settings {
  name: string;
  /** small square data URL (or https URL) for the profile photo */
  avatar?: string | null;
  product: "claude" | "chatgpt";
  /** custom instructions the assistant follows in every chat */
  instructions?: string;
  /** facts the assistant has been told to remember, carried across chats */
  memories?: string[];
  linkedin?: string;
  x?: string;
  model: ModelChoice;
  effort: Effort;
}

/** Everything the environment can observe. Challenges are graded against these. */
export type ArenaEventType =
  | "message_sent"
  | "model_selected"
  | "effort_selected"
  | "web_search_on"
  | "research_on"
  | "file_attached"
  | "image_attached"
  | "connector_connected"
  | "connector_used"
  | "skill_invoked"
  | "skill_created"
  | "project_created"
  | "chat_in_project"
  | "project_file_added"
  | "hint_used"
  | "link_read"
  | "memory_saved"
  | "instructions_set";

export interface ArenaEvent {
  type: ArenaEventType;
  at: string;
  /** e.g. connector id, skill id, model choice */
  detail?: string;
}

export interface Attempt {
  id: string;
  slug: string;
  startedAt: string;
  /** server attempt id when signed in (server-side clock) */
  serverId?: string;
  events: ArenaEvent[];
  hintsUsed: number;
  /** snapshot of state at start so behaviors must happen during the attempt */
  chatIds: string[];
}

export interface CheckResult {
  id: string;
  verdict: "pass" | "fail";
  evidence: string;
}

export interface ArenaResult {
  slug: string;
  points: number;
  maxPoints: number;
  passed: boolean;
  seconds: number;
  speedMult: number;
  hintsUsed: number;
  behaviors: { id: string; label: string; pass: boolean }[];
  checks: CheckResult[];
  feedback: string;
  badges: string[];
  at: string;
}
