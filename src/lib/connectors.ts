/**
 * Synthetic connectors. Each looks like a real integration in the UI and, once
 * "connected", exposes tools to the model that read Halden's fictional data.
 */
export interface ConnectorDef {
  id: ConnectorId;
  name: string;
  vendor: string;
  blurb: string;
  /** what the model can do once connected; shown in the dialog */
  tools: string[];
}
export type ConnectorId = "gmail" | "drive" | "warehouse" | "calendar";

export const CONNECTORS: ConnectorDef[] = [
  { id: "gmail", name: "Gmail", vendor: "Google", blurb: "Search and read your inbox.", tools: ["search_gmail", "read_email"] },
  { id: "drive", name: "Google Drive", vendor: "Google", blurb: "Find and read documents, sheets and decks.", tools: ["search_drive", "read_drive_file"] },
  { id: "warehouse", name: "Data warehouse", vendor: "", blurb: "Query the company's financial and sales tables.", tools: ["list_tables", "read_table"] },
  { id: "calendar", name: "Google Calendar", vendor: "Google", blurb: "See upcoming meetings and deadlines.", tools: ["list_events"] },
];

export function isConnectorId(v: unknown): v is ConnectorId {
  return CONNECTORS.some((c) => c.id === v);
}
