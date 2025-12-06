/**
 * BlackRoad Telemetry Billing Module
 * "All roads lead to BlackRoad"
 *
 * Pricing tiers for the New Internet Radar service.
 * Usage-based metering with Stripe integration.
 *
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  events_included: number;
  overage_per_1k: number;
  features: string[];
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Explorer",
    description: "For indie hackers discovering the new internet",
    price_monthly: 0,
    price_yearly: 0,
    events_included: 10_000,
    overage_per_1k: 0, // No overage on free - just stops
    features: [
      "10,000 events/month",
      "7-day data retention",
      "Basic radar dashboard",
      "1 API key",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Navigator",
    description: "For serious builders mapping the new internet",
    price_monthly: 29,
    price_yearly: 290, // ~2 months free
    events_included: 100_000,
    overage_per_1k: 0.50,
    features: [
      "100,000 events/month",
      "30-day data retention",
      "Full radar dashboard",
      "5 API keys",
      "Webhook alerts",
      "Export to CSV/JSON",
      "Email support",
    ],
  },
  {
    id: "business",
    name: "Cartographer",
    description: "For teams charting new territories",
    price_monthly: 99,
    price_yearly: 990, // ~2 months free
    events_included: 500_000,
    overage_per_1k: 0.25,
    features: [
      "500,000 events/month",
      "90-day data retention",
      "Advanced analytics",
      "Unlimited API keys",
      "Real-time webhooks",
      "Custom dashboards",
      "Team collaboration",
      "Priority support",
      "SLA 99.9%",
    ],
  },
  {
    id: "enterprise",
    name: "Sovereign",
    description: "For organizations building the future",
    price_monthly: 499,
    price_yearly: 4990, // ~2 months free
    events_included: 5_000_000,
    overage_per_1k: 0.10,
    features: [
      "5,000,000 events/month",
      "1-year data retention",
      "Full API access",
      "Custom integrations",
      "Dedicated infrastructure",
      "White-label option",
      "24/7 support",
      "Custom SLA",
      "On-call engineering",
    ],
  },
];

export interface UsageRecord {
  org_id: string;
  tier: string;
  period_start: number; // Unix timestamp
  period_end: number;
  events_used: number;
  events_limit: number;
  overage_events: number;
  overage_cost: number;
}

export interface APIKey {
  key: string;
  org_id: string;
  name: string;
  created_at: number;
  last_used_at?: number;
  events_count: number;
  enabled: boolean;
}

/**
 * Get tier by ID
 */
export function getTier(tierId: string): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.id === tierId);
}

/**
 * Calculate overage for a usage period
 */
export function calculateOverage(tier: PricingTier, eventsUsed: number): { overage: number; cost: number } {
  if (eventsUsed <= tier.events_included) {
    return { overage: 0, cost: 0 };
  }

  const overage = eventsUsed - tier.events_included;
  const cost = (overage / 1000) * tier.overage_per_1k;

  return { overage, cost: Math.round(cost * 100) / 100 };
}

/**
 * Generate a secure API key
 */
export function generateAPIKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'br_radar_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Validate an API key format
 */
export function isValidAPIKeyFormat(key: string): boolean {
  return key.startsWith('br_radar_') && key.length === 41;
}

/**
 * Get recommended tier based on expected usage
 */
export function recommendTier(expectedEventsPerMonth: number): PricingTier {
  for (const tier of PRICING_TIERS) {
    if (expectedEventsPerMonth <= tier.events_included) {
      return tier;
    }
  }
  return PRICING_TIERS[PRICING_TIERS.length - 1]; // Enterprise
}
