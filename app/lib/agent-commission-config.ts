import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";
import { saveActivityLog } from "./activity-logs";
import { createServerNotification } from "./notifications";
import {
  type AgentCommissionConfig,
  DEFAULT_AGENT_COMMISSION_CONFIG,
} from "./agent-commission-config.shared";

export * from "./agent-commission-config.shared";

const storePath = resolveStorePath(
  "NEIGHBORLY_AGENT_COMMISSION_STORE",
  ".neighborly-agent-commission.json"
);

export async function readAgentCommissionConfig(): Promise<AgentCommissionConfig> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AgentCommissionConfig>;
    if (parsed && typeof parsed.referralPercentage === "number") {
      return {
        ...DEFAULT_AGENT_COMMISSION_CONFIG,
        ...parsed,
        referralPercentage: Math.max(0, Math.min(100, Math.round(parsed.referralPercentage * 100) / 100)),
        minimumPayoutAmount: Math.max(0, Number(parsed.minimumPayoutAmount) || DEFAULT_AGENT_COMMISSION_CONFIG.minimumPayoutAmount),
      };
    }
    return DEFAULT_AGENT_COMMISSION_CONFIG;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Error reading agent commission config:", error);
    }
    return DEFAULT_AGENT_COMMISSION_CONFIG;
  }
}

export async function updateAgentCommissionConfig(
  patch: Partial<AgentCommissionConfig>,
  actorName = "Super Admin",
  actorRole: "Admin" | "Super Admin" = "Super Admin"
): Promise<AgentCommissionConfig> {
  const current = await readAgentCommissionConfig();

  const newPercentage = typeof patch.referralPercentage === "number"
    ? Math.max(0, Math.min(100, Math.round(patch.referralPercentage * 100) / 100))
    : current.referralPercentage;

  const newMinPayout = typeof patch.minimumPayoutAmount === "number"
    ? Math.max(0, Math.round(patch.minimumPayoutAmount))
    : current.minimumPayoutAmount;

  const validCycles: Array<"Instant" | "Weekly" | "Monthly"> = ["Instant", "Weekly", "Monthly"];
  const newCycle = patch.payoutCycle && validCycles.includes(patch.payoutCycle)
    ? patch.payoutCycle
    : current.payoutCycle;

  const updated: AgentCommissionConfig = {
    ...current,
    referralPercentage: newPercentage,
    minimumPayoutAmount: newMinPayout,
    payoutCycle: newCycle,
    termsSummary: patch.termsSummary?.trim() || current.termsSummary,
    lastUpdated: new Date().toISOString(),
    updatedBy: actorName,
  };

  await mkdir(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(updated, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, storePath);

  try {
    await saveActivityLog({
      action: `Agent referral commission rate updated to ${updated.referralPercentage}%`,
      category: "Admin",
      actorName,
      actorRole: "Admin",
      locality: "Hosur",
      details: `${actorRole} ${actorName} set the agent referral commission percentage to ${updated.referralPercentage}% (Payout cycle: ${updated.payoutCycle}, Min payout: ₹${updated.minimumPayoutAmount}).`,
      metadata: {
        previousPercentage: current.referralPercentage,
        referralPercentage: updated.referralPercentage,
        payoutCycle: updated.payoutCycle,
        minimumPayoutAmount: updated.minimumPayoutAmount,
      },
    });
  } catch (err) {
    console.error("Failed to log commission rate update activity:", err);
  }

  // Notify agents in real-time about the updated referral rate
  if (current.referralPercentage !== updated.referralPercentage) {
    try {
      await createServerNotification({
        title: `📢 Agent Referral Commission: ${updated.referralPercentage}%`,
        message: `Super Admin configured the official agent referral commission to ${updated.referralPercentage}%. Earn ${updated.referralPercentage}% recurring commission on every merchant onboarded!`,
        type: "agent",
        targetRole: "Agent",
        targetIdentity: "all",
        linkText: "View Commission Details",
        action: {
          type: "portal",
          payload: "Agent",
          tab: "Referrals",
        },
      });
    } catch {}
  }

  return updated;
}
