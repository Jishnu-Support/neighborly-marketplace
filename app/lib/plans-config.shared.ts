export interface SubscriptionPlan {
  id: string; // e.g. "starter", "growth", "spotlight"
  name: string; // "Starter", "Growth", "Spotlight"
  monthlyPrice: number; // 499, 999, 1999
  yearlyPrice: number; // 4790, 9590, 19190
  tagline: string; // "A great place to start.", etc.
  desc: string;
  perks: string[];
  isPopular?: boolean;
  badge?: string; // "MOST POPULAR"
  enabled: boolean;
}

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 499,
    yearlyPrice: 4790,
    tagline: "A great place to start.",
    desc: "Essential local presence for emerging neighborhood vendors.",
    perks: [
      "✓ Local search priority",
      "✓ Verified Business profile",
      "— Basic profile views",
      "— Standard placement",
    ],
    enabled: true,
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 999,
    yearlyPrice: 9590,
    tagline: "More visibility where it matters.",
    desc: "Top choice for established local stores & service providers.",
    isPopular: true,
    badge: "MOST POPULAR",
    perks: [
      "✓ Local search priority",
      "✓ Verified Business profile",
      "✓ Customer enquiry & order alerts",
      "✓ Category spotlight",
    ],
    enabled: true,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    monthlyPrice: 1999,
    yearlyPrice: 19190,
    tagline: "Stand out across your neighborhood.",
    desc: "Maximum reach with prime homepage spotlight & multi-language promotion.",
    perks: [
      "✓ Local search priority",
      "✓ Verified Business profile",
      "✓ Customer enquiry & order alerts",
      "✓ Featured top placement & SEO badge",
    ],
    enabled: true,
  },
];
