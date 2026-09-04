/** Claude's asterisk mark, drawn to match the greeting. */
export function Spark({ size = 28, className = "" }: { size?: number; className?: string }) {
  // The Claude asterisk, from the Simple Icons set.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
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

/** The How to AI Games mark: the twelve-lobe rosette. Bare for the bar, tile for icons. */
export function Logo({ size = 18, className = "", tile = false }: { size?: number; className?: string; tile?: boolean }) {
  if (tile)
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden>
        <rect width="64" height="64" rx="14" fill="#d97757" />
        <g transform="translate(7 7) scale(0.5)">
          <path d={ROSETTE_PATH} fill="#faf9f5" />
          <circle cx="50" cy="50" r="27" fill="#d97757" />
          <circle cx="50" cy="50" r="21" fill="#faf9f5" />
          <circle cx="50" cy="50" r="15" fill="#d97757" />
        </g>
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`shrink-0 ${className}`} aria-hidden>
      <path d={ROSETTE_PATH} fill="#d97757" />
      <circle cx="50" cy="50" r="27" fill="#2c2b28" />
      <circle cx="50" cy="50" r="21" fill="#d97757" />
      <circle cx="50" cy="50" r="15" fill="#2c2b28" />
    </svg>
  );
}
