"use client";
import { Cable, Mail, HardDrive, Database, Calendar } from "lucide-react";
import { Dialog, Button } from "../dialog";
import { closeDialog, toast } from "@/lib/ui";
import { useStore, setConnector } from "@/lib/store";
import { CONNECTORS, type ConnectorId } from "@/lib/connectors";

const ICON: Record<ConnectorId, React.ReactNode> = { gmail: <Mail size={18} />, drive: <HardDrive size={18} />, warehouse: <Database size={18} />, calendar: <Calendar size={18} /> };

export function ConnectorsDialog({ open }: { open: boolean }) {
  const on = useStore((s) => s.connectors);
  return (
    <Dialog open={open} onClose={closeDialog} title={<span className="flex items-center gap-2"><Cable size={16} /> Connectors</span>}>
      <div className="mb-3 text-[13px] text-ink-2">Give the assistant access to your work at Halden. Everything here is simulated: connecting cannot email anyone, delete anything, or touch your real accounts.</div>
      <div className="space-y-2">
        {CONNECTORS.map((c) => {
          const active = on.includes(c.id);
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-3 text-ink-2">{ICON[c.id]}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium">{c.name} <span className="text-[12px] font-normal text-ink-3">· {c.vendor}</span></div>
                <div className="text-[12.5px] text-ink-2">{c.blurb}</div>
                <div className="mt-0.5 text-[11.5px] text-ink-3">Tools: {c.tools.join(", ")}</div>
              </div>
              <Button
                variant={active ? "outline" : "primary"}
                onClick={() => {
                  setConnector(c.id, !active);
                  toast({ title: active ? `${c.name} disconnected` : `${c.name} connected`, body: active ? undefined : "The assistant can use it in your next message.", tone: "ok" }, 3000);
                }}
              >
                {active ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
