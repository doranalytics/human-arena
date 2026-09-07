import { getToolName, isToolUIPart } from "ai";
import type { ChallengeDef } from "./types";
import type { ArenaEvent, Chat, Project, CustomSkill, Schedule, ChatGroup } from "../types";
import { TOOL_CONNECTOR } from "../tool-connector";

export interface WorkspaceEvidence {
  chats: Chat[];
  projects: Project[];
  skills: CustomSkill[];
  schedules: Schedule[];
  groups: ChatGroup[];
}

/** UI events prove gestures; actual messages and final object state prove what they acted on. */
export function gradeBehaviors(c: ChallengeDef, events: ArenaEvent[], w: WorkspaceEvidence) {
  const contexts = w.chats.flatMap((ch) => ch.contexts ?? []);
  const users = w.chats.flatMap((ch) => ch.messages.filter((m) => m.role === "user"));
  const tools = w.chats.flatMap((ch) => ch.messages.flatMap((m) => m.parts.flatMap((p) => {
    if (!isToolUIPart(p) || p.state !== "output-available") return [];
    const output = p.output as Record<string, unknown> | null;
    if (!output || (typeof output === "object" && output.error)) return [];
    return [{ name: getToolName(p), output, chat: ch, part: p }];
  })));
  const matches = (type: ArenaEvent["type"], detail?: string) => events.filter((e) => e.type === type && (!detail || e.detail === detail));
  const pairedSkill = (type: ArenaEvent["type"]) => matches(type).some((e) => contexts.some((x) => x.skill === e.detail) && w.skills.some((s) => s.name === e.detail));
  return c.behaviors.map((b) => {
    let count = matches(b.event, b.detail).length;
    switch (b.event) {
      case "message_sent": count = users.length; break;
      case "model_selected": count = contexts.filter((x) => x.model === b.detail).length; break;
      case "web_search_on": count = contexts.filter((x) => x.webSearch || x.research).length; break;
      case "research_on": count = contexts.filter((x) => x.research).length; break;
      case "cowork_on": count = contexts.filter((x) => x.cowork).length; break;
      case "memory_off": count = contexts.filter((x) => x.memoryOff).length; break;
      case "skill_invoked": count = contexts.filter((x) => x.skill && (!b.detail || x.skill === b.detail)).length;
        if (c.slug === "browse-skills") count = pairedSkill("skill_added") ? count : 0;
        if (c.slug === "cowork-to-skill") count = pairedSkill("skill_from_cowork") ? count : 0;
        break;
      case "skill_created": count = matches(b.event, b.detail).filter((e) => w.skills.some((s) => s.name === e.detail && /three.*(short )?lines/i.test(s.prompt))).length; break;
      case "connector_used": count = tools.filter((t) => TOOL_CONNECTOR[t.name] === b.detail).length; break;
      case "link_read": count = tools.filter((t) => t.name === "read_link").length; break;
      case "ask_user_used": count = tools.filter((t) => t.name === "ask_user").length; break;
      case "email_sent": count = tools.filter((t) => t.name === "send_email" && t.output.sent === true).length; break;
      case "file_attached": case "image_attached":
        count = users.flatMap((m) => m.parts).filter((p) => p.type === "file" && (b.event === "image_attached" ? p.mediaType.startsWith("image/") : !p.mediaType.startsWith("image/")) && (c.materials ?? []).some((m) => m.kind === "file" && m.filename === p.filename)).length;
        break;
      case "memory_saved": count = tools.filter((t) => t.name === "remember" && t.output.saved === true && (c.slug !== "project-memory" || (t.chat.contexts?.some((x) => x.projectId) && /friday/i.test(String(t.output.fact)) && w.projects.some((p) => p.id === t.chat.projectId && p.memories?.includes(String(t.output.fact)))))).length; break;
      case "instructions_set": count = matches(b.event).length && contexts.some((x) => /captain/i.test(x.customInstructions)) ? 1 : 0; break;
      case "chat_in_project": count = contexts.filter((x) => x.projectId && w.projects.some((p) => p.id === x.projectId)).length; break;
      case "project_created": count = matches(b.event).filter((e) => w.projects.some((p) => p.id === e.detail) && contexts.some((x) => x.projectId === e.detail)).length; break;
      case "chat_pinned": case "chat_renamed": count = w.chats.filter((ch) => ch.pinned && ch.title === "Keep" && matches("chat_pinned", ch.id).length && matches("chat_renamed", ch.id).length).length; break;
      case "chat_grouped": count = w.chats.filter((ch) => w.groups.some((g) => g.id === ch.groupId && g.name === "Trips") && matches(b.event, ch.groupId ?? "").some((e) => e.chatId === ch.id)).length; break;
      case "added_to_project": count = w.chats.filter((ch) => ch.messages.some((m) => m.role === "user") && w.projects.some((p) => p.id === ch.projectId) && matches(b.event, ch.projectId ?? "").some((e) => e.chatId === ch.id)).length; break;
      case "exported": count = matches(b.event).filter((e) => w.chats.some((ch) => ch.id === e.chatId && ch.messages.some((m) => m.role === "assistant" && m.parts.some((p) => p.type === "text" && p.text.trim())))).length; break;
      case "schedule_created": case "schedule_run": count = w.schedules.filter((s) => s.cadence === "daily" && matches("schedule_created", s.id).length && (b.event === "schedule_created" || s.runs.some((r) => matches("schedule_run", s.id).some((e) => e.chatId === r.chatId) && w.chats.some((ch) => ch.id === r.chatId && ch.contexts?.some((x) => x.cowork) && ch.messages.some((m) => m.role === "assistant" && m.parts.some((p) => p.type === "text" && p.text.trim())))))).length; break;
    }
    return { id: b.id, label: b.label, pass: count >= (b.minCount ?? 1) };
  });
}
