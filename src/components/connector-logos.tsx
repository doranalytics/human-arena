import type { ConnectorId } from "@/lib/connectors";

/** Brand marks for the synthetic connectors, drawn inline so they never depend on a network image. */
export function ConnectorLogo({ id, size = 22 }: { id: ConnectorId; size?: number }) {
  if (id === "gmail")
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <path fill="#fff" d="M8 36V14l16 12 16-12v22z" />
        <path fill="#4285f4" d="M6 38h6V20L6 15.5z" />
        <path fill="#34a853" d="M36 38h6V15.5L36 20z" />
        <path fill="#fbbc04" d="M6 15.5V12a3 3 0 0 1 4.8-2.4L12 10.5V20z" />
        <path fill="#ea4335" d="M12 20V10.5L24 19.5l12-9V20L24 29z" />
        <path fill="#c5221f" d="M36 10.5l1.2-.9A3 3 0 0 1 42 12v3.5L36 20z" />
      </svg>
    );
  if (id === "drive")
    return (
      <svg width={size} height={size} viewBox="0 0 87.3 78" aria-hidden>
        <path fill="#0066da" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" />
        <path fill="#00ac47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" />
        <path fill="#ea4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 11.5z" />
        <path fill="#00832d" d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" />
        <path fill="#2684fc" d="M59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" />
        <path fill="#ffba00" d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" />
      </svg>
    );
  if (id === "calendar")
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <path fill="#fff" d="M12 12h24v24H12z" />
        <path fill="#1e88e5" d="M36 36h-24v6h24z" />
        <path fill="#1e88e5" d="M36 6H12v6h24z" />
        <path fill="#4285f4" d="M12 12H6v24h6z" />
        <path fill="#4285f4" d="M42 12h-6v24h6z" />
        <path fill="#1565c0" d="M36 36v6l6-6z" />
        <path fill="#e53935" d="M36 42h-6v-6h6z" opacity="0" />
        <path fill="#4285f4" d="M6 42h6v-6H6z" />
        <path fill="#1565c0" d="M42 6v6h-6V6z" opacity=".9" />
        <text x="24" y="31" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="18" fill="#1e88e5">31</text>
      </svg>
    );
  // Halden's warehouse is fictional: a stacked-disk mark in the company clay.
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <ellipse cx="24" cy="12" rx="15" ry="6" fill="#d97757" />
      <path d="M9 12v9c0 3.3 6.7 6 15 6s15-2.7 15-6v-9c0 3.3-6.7 6-15 6S9 15.3 9 12z" fill="#c4643f" />
      <path d="M9 23v9c0 3.3 6.7 6 15 6s15-2.7 15-6v-9c0 3.3-6.7 6-15 6S9 26.3 9 23z" fill="#a8532f" />
      <path d="M9 34v2c0 3.3 6.7 6 15 6s15-2.7 15-6v-2c0 3.3-6.7 6-15 6S9 37.3 9 34z" fill="#8e4527" />
    </svg>
  );
}
