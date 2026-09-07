/** All purchases and subscription management stay on Ruben's Substack. */
export const SUBSCRIBE_URL = "https://ruben.substack.com/subscribe";
export const SUBSCRIPTION_SETTINGS_URL = "https://ruben.substack.com/account";
export interface SubscriptionStatus {
  paid: boolean;
  sources?: ("substack" | "circle")[];
  checkedAt: string | null;
  available: boolean;
  checks?: { circle: boolean; substack: boolean };
}
