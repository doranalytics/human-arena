import "server-only";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { EMAILS } from "./company/gmail";
import { DRIVE } from "./company/drive";
import { TABLES, tableToCsv } from "./company/warehouse";
import { CALENDAR } from "./company/calendar";
import type { ConnectorId } from "./connectors";

const norm = (s: string) => s.toLowerCase();
const hit = (hay: string, q: string) => {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const h = norm(hay);
  return terms.length === 0 || terms.some((t) => h.includes(t));
};

/** Tools for the given connected connectors. Empty set when nothing is connected. */
export function connectorTools(connected: ConnectorId[]): ToolSet {
  const t: ToolSet = {};
  if (connected.includes("gmail")) {
    t.search_gmail = tool({
      description: "Search the user's Gmail inbox. Returns matching emails (id, from, subject, date, snippet). Use read_email for the full body.",
      inputSchema: z.object({ query: z.string().describe("Free-text search: sender, subject words, or topic. Empty string lists recent mail.") }),
      execute: async ({ query }) => {
        const rows = EMAILS.filter((e) => hit(`${e.fromName} ${e.from} ${e.subject} ${e.body}`, query))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10)
          .map((e) => ({ id: e.id, from: `${e.fromName} <${e.from}>`, subject: e.subject, date: e.date, unread: !!e.unread, snippet: e.body.slice(0, 110).replace(/\s+/g, " ") + "…" }));
        return { count: rows.length, emails: rows };
      },
    });
    t.read_email = tool({
      description: "Read one email in full by id.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const e = EMAILS.find((x) => x.id === id);
        if (!e) return { error: `No email with id ${id}` };
        return { id: e.id, from: `${e.fromName} <${e.from}>`, to: e.to, subject: e.subject, date: e.date, body: e.body };
      },
    });
  }
  if (connected.includes("drive")) {
    t.search_drive = tool({
      description: "Search the user's Google Drive by name or content. Returns id, name, kind, folder, modified date.",
      inputSchema: z.object({ query: z.string().describe("Words from the file name or its contents. Empty string lists everything.") }),
      execute: async ({ query }) => ({
        files: DRIVE.filter((f) => hit(`${f.name} ${f.folder} ${f.content}`, query)).map((f) => ({ id: f.id, name: f.name, kind: f.kind, folder: f.folder, modified: f.modified, owner: f.owner })),
      }),
    });
    t.read_drive_file = tool({
      description: "Read the full contents of a Drive file by id.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const f = DRIVE.find((x) => x.id === id);
        return f ? { name: f.name, kind: f.kind, content: f.content } : { error: `No file with id ${id}` };
      },
    });
  }
  if (connected.includes("warehouse")) {
    t.list_tables = tool({
      description: "List the tables in Halden's data warehouse with their columns.",
      inputSchema: z.object({}),
      execute: async () => ({ tables: TABLES.map((x) => ({ name: x.name, description: x.description, columns: x.columns, rows: x.rows.length })) }),
    });
    t.read_table = tool({
      description: "Read a warehouse table as CSV. Optionally filter rows to those containing a substring in any column.",
      inputSchema: z.object({ table: z.string(), contains: z.string().optional().describe("Substring filter, e.g. '2024-07' or 'Ridgeline'") }),
      execute: async ({ table, contains }) => {
        const x = TABLES.find((z) => z.name === table);
        if (!x) return { error: `No table named ${table}. Call list_tables first.` };
        const rows = contains ? x.rows.filter((r) => r.some((c) => String(c).toLowerCase().includes(contains.toLowerCase()))) : x.rows;
        return { table: x.name, csv: tableToCsv({ ...x, rows }) };
      },
    });
  }
  if (connected.includes("calendar")) {
    t.list_events = tool({
      description: "List the user's upcoming calendar events.",
      inputSchema: z.object({ query: z.string().optional().describe("Optional filter on title or attendee") }),
      execute: async ({ query }) => ({ events: CALENDAR.filter((e) => !query || hit(`${e.title} ${e.attendees.join(" ")} ${e.notes ?? ""}`, query)) }),
    });
  }
  return t;
}

/** Tool name → connector id, for event tracking in the UI. */
export const TOOL_CONNECTOR: Record<string, ConnectorId> = {
  search_gmail: "gmail",
  read_email: "gmail",
  search_drive: "drive",
  read_drive_file: "drive",
  list_tables: "warehouse",
  read_table: "warehouse",
  list_events: "calendar",
};
