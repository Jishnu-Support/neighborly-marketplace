export type AgentCommissionConfig = {
  referralPercentage: number; // e.g. 20 for 20%
  minimumPayoutAmount: number; // e.g. 500
  payoutCycle: "Instant" | "Weekly" | "Monthly";
  termsSummary?: string;
  lastUpdated?: string;
  updatedBy?: string;
};

export const DEFAULT_AGENT_COMMISSION_CONFIG: AgentCommissionConfig = {
  referralPercentage: 20,
  minimumPayoutAmount: 500,
  payoutCycle: "Instant",
  termsSummary: "Agents receive standard referral percentage commission upon every business onboarding and plan renewal.",
  lastUpdated: new Date().toISOString(),
  updatedBy: "Super Admin",
};
