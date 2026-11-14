export type AgentCommissionPricing = {
  registrationPercentage: number; // Commission for business registration (%)
  firstRenewalPercentage: number; // Commission for 1st renewal (%)
  secondRenewalPercentage: number; // Commission for 2nd renewal (%)
  subsequentRenewalPercentage: number; // Commission for 3rd and subsequent renewals (%)
  customNotes?: string;
  lastUpdated?: string;
  updatedBy?: string;
};

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
