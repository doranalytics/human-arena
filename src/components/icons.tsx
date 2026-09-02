/** Claude's asterisk mark, drawn to match the greeting. */
export function Spark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path
        d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49M21 9.5l22 45M43 9.5l-22 45M9.5 21l45 22M9.5 43l45-22"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 12-lobe rosette, ported from ai-certified-next (same geometry as its favicon). viewBox 0 0 100 100.
const ROSETTE_PATH =
  "M97.5 50.0L96.4 52.4L93.5 54.6L89.8 56.3L86.7 57.8L85.3 59.4L85.7 61.6L87.6 64.4L89.9 67.8L91.4 71.1L91.1 73.8L89.0 75.3L85.4 75.7L81.3 75.4L77.9 75.1L75.8 75.8L75.1 77.9L75.4 81.3L75.7 85.4L75.3 89.0L73.8 91.1L71.1 91.4L67.8 89.9L64.4 87.6L61.6 85.7L59.4 85.3L57.8 86.7L56.3 89.8L54.6 93.5L52.4 96.4L50.0 97.5L47.6 96.4L45.4 93.5L43.7 89.8L42.2 86.7L40.6 85.3L38.4 85.7L35.6 87.6L32.2 89.9L28.9 91.4L26.3 91.1L24.7 89.0L24.3 85.4L24.6 81.3L24.9 77.9L24.2 75.8L22.1 75.1L18.7 75.4L14.6 75.7L11.0 75.3L8.9 73.8L8.6 71.1L10.1 67.8L12.4 64.4L14.3 61.6L14.7 59.4L13.3 57.8L10.2 56.3L6.5 54.6L3.6 52.4L2.5 50.0L3.6 47.6L6.5 45.4L10.2 43.7L13.3 42.2L14.7 40.6L14.3 38.4L12.4 35.6L10.1 32.2L8.6 28.9L8.9 26.2L11.0 24.7L14.6 24.3L18.7 24.6L22.1 24.9L24.2 24.2L24.9 22.1L24.6 18.7L24.3 14.6L24.7 11.0L26.2 8.9L28.9 8.6L32.2 10.1L35.6 12.4L38.4 14.3L40.6 14.7L42.2 13.3L43.7 10.2L45.4 6.5L47.6 3.6L50.0 2.5L52.4 3.6L54.6 6.5L56.3 10.2L57.8 13.3L59.4 14.7L61.6 14.3L64.4 12.4L67.8 10.1L71.1 8.6L73.8 8.9L75.3 11.0L75.7 14.6L75.4 18.7L75.1 22.1L75.8 24.2L77.9 24.9L81.3 24.6L85.4 24.3L89.0 24.7L91.1 26.2L91.4 28.9L89.9 32.2L87.6 35.6L85.7 38.4L85.3 40.6L86.7 42.2L89.8 43.7L93.5 45.4L96.4 47.6Z";

/** Tier colours. Same palette as the How to AI Games board so the two products read as one family. */
export const TIER_STYLE = {
  Tourist: { fill: "#FFA26B", ring: "#FFF4EC" },
  Newcomer: { fill: "#F0570F", ring: "#FBF3E4" },
  Resident: { fill: "#B8410B", ring: "#FBF3E4" },
  Citizen: { fill: "#1C1917", ring: "#FBF3E4" },
  "AI-Native": { fill: "#D4A13C", ring: "#FFF8E6" },
} as const;
export type BadgeTier = keyof typeof TIER_STYLE;

/** Tier badge: the rosette in the tier's colour. Locked tiers are a hollow dashed outline. */
export function TierBadge({ tier, locked, size = 64, className = "" }: { tier: BadgeTier; locked?: boolean; size?: number; className?: string }) {
  const c = TIER_STYLE[tier];
  if (locked) {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className={`shrink-0 ${className}`}>
        <path d={ROSETTE_PATH} fill="none" stroke="#D6D3D1" strokeWidth="2.5" strokeDasharray="4 3" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="#D6D3D1" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d={ROSETTE_PATH} fill={c.fill} />
      <circle cx="50" cy="50" r="27" fill={c.ring} />
      <circle cx="50" cy="50" r="21" fill={c.fill} />
      <circle cx="50" cy="50" r="15" fill={c.ring} />
    </svg>
  );
}

export function IconLinkedIn({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** The Human Arena mark: crossed swords. Bare (clay strokes) for light or dark grounds; tile for icons. */
export function Logo({ size = 18, className = "", tile = false }: { size?: number; className?: string; tile?: boolean }) {
  if (tile)
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden>
        <rect width="64" height="64" rx="14" fill="#d97757" />
        <g transform="translate(10 10) scale(1.8333)" fill="none" stroke="#faf9f5" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="m13 19 6-6" /><path d="M14.5 17.5 3.586 6.586A2 2 0 0 1 3 5.172V3h2.172a2 2 0 0 1 1.414.586L17.5 14.5" /><path d="m14.828 6.172 2.586-2.586A2 2 0 0 1 18.828 3H21v2.172a2 2 0 0 1-.586 1.414l-2.586 2.586" /><path d="m16 16 4 4" /><path d="m19 21 2-2" /><path d="m5 14 4 4" /><path d="m5 21-2-2" /><path d="M7.5 16.5 4 20" /></g>
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="#d97757" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m13 19 6-6" /><path d="M14.5 17.5 3.586 6.586A2 2 0 0 1 3 5.172V3h2.172a2 2 0 0 1 1.414.586L17.5 14.5" /><path d="m14.828 6.172 2.586-2.586A2 2 0 0 1 18.828 3H21v2.172a2 2 0 0 1-.586 1.414l-2.586 2.586" /><path d="m16 16 4 4" /><path d="m19 21 2-2" /><path d="m5 14 4 4" /><path d="m5 21-2-2" /><path d="M7.5 16.5 4 20" />
    </svg>
  );
}
