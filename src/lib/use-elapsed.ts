"use client";
import { useEffect, useState } from "react";

/** Seconds since startedAt, ticking twice a second while set. */
export function useElapsed(startedAt: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startedAt]);
  return startedAt ? (now - new Date(startedAt).getTime()) / 1000 : 0;
}
