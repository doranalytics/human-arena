export type Tier = "Analog" | "Tourist" | "Newcomer" | "Resident" | "Citizen" | "AI-Native";

export const TIERS: { tier: Exclude<Tier, "Analog">; min: number; blurb: string }[] = [
  { tier: "Tourist", min: 1, blurb: "Visits AI now and then." },
  { tier: "Newcomer", min: 150, blurb: "Moved in. Still learning the streets." },
  { tier: "Resident", min: 400, blurb: "Uses it every working day." },
  { tier: "Citizen", min: 750, blurb: "Could teach the locals." },
  { tier: "AI-Native", min: 1200, blurb: "Born here." },
];

export function tierFor(points: number): Tier {
  let t: Tier = "Analog";
  for (const x of TIERS) if (points >= x.min) t = x.tier;
  return t;
}
