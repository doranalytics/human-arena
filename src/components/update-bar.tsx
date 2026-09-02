"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const BUILT = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || "dev";

/** Polls the server build id; when it moves, offers a refresh so a stale tab never limps along on missing chunks. */
export function UpdateBar() {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (BUILT === "dev") return;
    let stop = false;
    const check = () =>
      fetch("/api/version", { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { version?: string }) => {
          if (!stop && j.version && j.version !== "dev" && j.version !== BUILT) setStale(true);
        })
        .catch(() => null);
    const t = setInterval(check, 90_000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      stop = true;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
  if (!stale) return null;
  return (
    <div className="flex h-8 shrink-0 items-center justify-center gap-3 bg-clay px-3 text-[12.5px] text-white">
      <span>Human Arena has been updated.</span>
      <button onClick={() => window.location.reload()} className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 font-medium hover:bg-white/25"><RefreshCw size={12} /> Refresh</button>
    </div>
  );
}
