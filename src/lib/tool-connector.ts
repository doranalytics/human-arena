import type { ConnectorId } from "./connectors";
/** Client-safe copy of the tool → connector map (no server-only import). */
export const TOOL_CONNECTOR: Record<string, ConnectorId> = {
  search_gmail: "gmail",
  read_email: "gmail",
  send_email: "gmail",
  search_drive: "drive",
  read_drive_file: "drive",
  list_tables: "warehouse",
  read_table: "warehouse",
  list_events: "calendar",
};
