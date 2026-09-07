import { z } from "zod";

// Bound payloads and reject malformed dates/negative times instead of silently awarding speed points.
export const SubmissionSchema = z.object({
  slug: z.string().min(1).max(80), serverId: z.string().uuid().nullish(), version: z.string().optional(),
  startedAt: z.string().datetime({ offset: true }), hintsUsed: z.number().int().min(0).max(100),
  events: z.array(z.object({ type: z.string().max(60), at: z.string().datetime({ offset: true }), detail: z.string().max(500).optional(), chatId: z.string().max(100).optional() })).max(1000),
  chats: z.array(z.object({ id: z.string().max(100), title: z.string().max(200), projectId: z.string().nullable(),
    messages: z.array(z.object({ id: z.string(), role: z.enum(["user", "assistant", "system"]), parts: z.array(z.record(z.string(), z.unknown())) })).max(150),
    contexts: z.array(z.record(z.string(), z.unknown())).max(150).optional(),
    pinned: z.boolean().optional(), groupId: z.string().nullable().optional(),
  }).passthrough()).max(30),
  workspace: z.object({ projects: z.array(z.record(z.string(), z.unknown())).max(100), skills: z.array(z.record(z.string(), z.unknown())).max(200), schedules: z.array(z.record(z.string(), z.unknown())).max(100), groups: z.array(z.record(z.string(), z.unknown())).max(100) }),
});
