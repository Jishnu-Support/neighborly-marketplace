import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolveStorePath } from "./storage-paths";

export type AgentFeedbackRecord = {
  id: string;
  agentId?: string;
  agentReferralCode: string;
  businessName: string;
  rating: number; // 1 - 5 stars
  feedback?: string;
  createdAt: string;
};

const feedbackPath = resolveStorePath("NEIGHBORLY_AGENT_FEEDBACK_STORE", ".neighborly-agent-feedback.json");

export async function readAgentFeedbacks(): Promise<AgentFeedbackRecord[]> {
  try {
    const raw = await readFile(feedbackPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AgentFeedbackRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    return [];
  }
}

export async function saveAgentFeedback(input: {
  agentId?: string;
  agentReferralCode: string;
  businessName: string;
  rating: number;
  feedback?: string;
}): Promise<AgentFeedbackRecord> {
  const records = await readAgentFeedbacks();
  const cleanCode = (input.agentReferralCode || "JIT").trim().toUpperCase();
  const newRecord: AgentFeedbackRecord = {
    id: randomUUID(),
    agentId: input.agentId,
    agentReferralCode: cleanCode,
    businessName: input.businessName || "Local Merchant",
    rating: Math.max(1, Math.min(5, Math.round(Number(input.rating) || 5))),
    feedback: (input.feedback || "").trim(),
    createdAt: new Date().toISOString(),
  };

  records.unshift(newRecord);
  await mkdir(path.dirname(feedbackPath), { recursive: true });
  await writeFile(feedbackPath, JSON.stringify(records, null, 2), "utf8");
  return newRecord;
}

export async function getFeedbacksForAgent(agentReferralCode: string, agentId?: string): Promise<AgentFeedbackRecord[]> {
  const all = await readAgentFeedbacks();
  const code = (agentReferralCode || "").trim().toUpperCase();
  return all.filter((f) => {
    if (f.agentReferralCode && f.agentReferralCode.toUpperCase() === code) return true;
    if (agentId && f.agentId === agentId) return true;
    return false;
  });
}
