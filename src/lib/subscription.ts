/** All purchases and subscription management stay on Ruben's Substack. */
export const SUBSCRIBE_URL = "https://ruben.substack.com/subscribe";
export const SUBSCRIPTION_SETTINGS_URL = "https://ruben.substack.com/account";
export const WEEKLY_WINNER_COPY = "Each week, the winner gets featured in front of a million people on Ruben’s LinkedIn and Substack.";
export function accountAccess(paid: boolean) {
  return { plan: paid ? "premium" as const : "standard" as const, weeklyWinnerEligible: paid };
}
export interface SubscriptionStatus {
  paid: boolean;
  plan: "standard" | "premium";
  weeklyWinnerEligible: boolean;
  sources?: ("substack" | "circle")[];
  checkedAt: string | null;
  available: boolean;
  checks?: { circle: boolean; substack: boolean };
}
