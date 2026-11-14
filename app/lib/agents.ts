import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";

export type AgentApprovalStatus = "Pending" | "Approved" | "Rejected";

export type AgentRatingBreakdown = {
  businessFeedback: number; // 0 - 100 (%)
  registrationsCount: number; // 0 - 100 (%)
  registrationRenewal: number; // 0 - 100 (%)
  overall: number; // 0 - 100 (%)
  feedbackNote?: string;
  registrationsNote?: string;
  renewalNote?: string;
  lastUpdated?: string;
  updatedBy?: string;
};

export type AgentPartner = {
  id: string;
  name: string;
  phone: string;
  emergencyPhone?: string;
  email?: string;
  referralCode: string;
  active: boolean;
  createdAt: string;
  referredCount: number;
  approvalStatus?: AgentApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  ratings?: AgentRatingBreakdown;
};

export type StoredAgentPartner = AgentPartner & {
  salt: string;
  passwordHash: string;
};

const storePath = resolveStorePath("NEIGHBORLY_AGENT_STORE", ".neighborly-agents.json");

export const DEFAULT_JIT_AGENT_ID = "agent-jit-default";
export const DEFAULT_JIT_REFERRAL_CODE = "JIT";
export const DEFAULT_JIT_USERNAME = "JIT";
export const DEFAULT_JIT_PASSWORD = "JIT@123";

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function passwordsMatch(password: string, salt: string, expectedHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isJunkRating(r: unknown): boolean {
  if (!r || typeof r !== "object") return true;
  const rating = r as Record<string, unknown>;
  const feedbackNote = typeof rating.feedbackNote === "string" ? rating.feedbackNote : "";
  const registrationsNote = typeof rating.registrationsNote === "string" ? rating.registrationsNote : "";
  const renewalNote = typeof rating.renewalNote === "string" ? rating.renewalNote : "";
  const lastUpdated = typeof rating.lastUpdated === "string" ? rating.lastUpdated : "";

  return (
    feedbackNote.includes("Positive merchant feedback") ||
    feedbackNote.includes("High merchant satisfaction") ||
    registrationsNote.includes("Consistent onboarding performance") ||
    registrationsNote.includes("Exceeded monthly onboarding") ||
    renewalNote.includes("Solid retention on merchant") ||
    renewalNote.includes("98% on-time subscription renewals") ||
    lastUpdated.startsWith("2026-01-01") ||
    (rating.overall === 98 && rating.businessFeedback === 98 && rating.registrationsCount === 95 && rating.registrationRenewal === 100)
  );
}

export function createDefaultJitAgent(): StoredAgentPartner {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(DEFAULT_JIT_PASSWORD, salt);
  return {
    id: DEFAULT_JIT_AGENT_ID,
    name: "JIT",
    phone: "9043022219",
    email: "jit@bizearch.in",
    referralCode: DEFAULT_JIT_REFERRAL_CODE,
    active: true,
    approvalStatus: "Approved",
    createdAt: "2026-01-01T00:00:00.000Z",
    referredCount: 0,
    salt,
    passwordHash,
  };
}

export async function readAgentRecords(): Promise<StoredAgentPartner[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const records = Array.isArray(parsed) ? (parsed as StoredAgentPartner[]) : [];

    let modified = false;
    let foundJit = false;

    for (const a of records) {
      const isJit =
        a.id === DEFAULT_JIT_AGENT_ID ||
        (a.name && a.name.trim().toUpperCase() === "JIT") ||
        (a.email && a.email.trim().toLowerCase() === "jit@bizearch.in") ||
        (a.phone && a.phone.replace(/\D/g, "") === "9043022219");

      if (isJit) {
        foundJit = true;
        if (a.referralCode !== DEFAULT_JIT_REFERRAL_CODE) {
          a.referralCode = DEFAULT_JIT_REFERRAL_CODE;
          modified = true;
        }
        if (a.name !== "JIT") {
          a.name = "JIT";
          modified = true;
        }
        if (!a.phone || a.phone.replace(/\D/g, "") !== "9043022219") {
          a.phone = "9043022219";
          modified = true;
        }
        if (!a.email) {
          a.email = "jit@bizearch.in";
          modified = true;
        }
        if (!a.active) {
          a.active = true;
          modified = true;
        }
        if (a.approvalStatus !== "Approved") {
          a.approvalStatus = "Approved";
          modified = true;
        }
      }

      if (!a.approvalStatus) {
        a.approvalStatus = a.active ? "Approved" : "Pending";
        modified = true;
      }

      // Strictly purge any legacy mock/junk ratings from disk
      if (a.ratings && isJunkRating(a.ratings)) {
        delete a.ratings;
        modified = true;
      }
    }

    if (!foundJit) {
      const jitAgent = createDefaultJitAgent();
      records.unshift(jitAgent);
      modified = true;
    }

    if (modified) {
      try {
        await writeAgentRecords(records);
      } catch {}
    }

    return records;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const jitAgent = createDefaultJitAgent();
      try {
        await writeAgentRecords([jitAgent]);
      } catch {}
      return [jitAgent];
    }
    throw error;
  }
}

export async function writeAgentRecords(agents: StoredAgentPartner[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(agents, null, 2), { encoding: "utf8" });
}

export async function listAgentPartners(): Promise<AgentPartner[]> {
  const records = await readAgentRecords();
  return records.map(({ salt, passwordHash, ...agent }) => agent);
}

export async function createAgentPartner(input: {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  referralCode?: string;
  approvalStatus?: AgentApprovalStatus;
  active?: boolean;
}): Promise<AgentPartner> {
  const existing = await readAgentRecords();
  const cleanPhone = (input.phone || "").replace(/\D/g, "");
  const normalizedEmail = (input.email || "").trim().toLowerCase();

  const duplicate = existing.find((a) => {
    const p = (a.phone || "").replace(/\D/g, "");
    if (cleanPhone.length >= 8 && (p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p))) return true;
    if (normalizedEmail && a.email && a.email.toLowerCase() === normalizedEmail) return true;
    return false;
  });

  if (duplicate) {
    throw new Error("An agent partner with this mobile number or email already exists.");
  }

  const salt = randomBytes(16).toString("hex");
  const password = input.password || (cleanPhone ? `Agent@${cleanPhone.slice(-4)}` : "Agent@2026");
  const passwordHash = hashPassword(password, salt);

  const cleanName = input.name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "AGNT";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referralCode =
    input.name.trim().toUpperCase() === "JIT" || cleanPhone === "9043022219"
      ? DEFAULT_JIT_REFERRAL_CODE
      : input.referralCode?.trim().toUpperCase() || `BIZ-${cleanName}-${randomSuffix}`;

  const approvalStatus: AgentApprovalStatus = input.approvalStatus ?? "Pending";
  const active = input.active !== undefined ? input.active : approvalStatus === "Approved";

  const newRecord: StoredAgentPartner = {
    id: randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim().toLowerCase() || "",
    referralCode,
    active,
    approvalStatus,
    createdAt: new Date().toISOString(),
    referredCount: 0,
    salt,
    passwordHash,
  };

  await writeAgentRecords([newRecord, ...existing]);

  const { salt: _s, passwordHash: _p, ...publicAgent } = newRecord;
  return publicAgent;
}

export async function verifyAgentCredentials(identity: string, password: string): Promise<AgentPartner | null> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalizedIdentity = identity.trim().toLowerCase();

  // Fast direct check for default agent JIT with password JIT@123
  if (
    (normalizedIdentity === "jit" || normalizedIdentity === "jit@bizearch.in" || cleanDigits === "9043022219") &&
    password === DEFAULT_JIT_PASSWORD
  ) {
    const agents = await readAgentRecords();
    const jit = agents.find(
      (a) =>
        (a.referralCode || "").trim().toUpperCase() === "JIT" ||
        (a.name || "").trim().toUpperCase() === "JIT" ||
        (a.phone && a.phone.replace(/\D/g, "") === "9043022219")
    );
    if (jit) {
      jit.referralCode = DEFAULT_JIT_REFERRAL_CODE;
      const { salt: _s, passwordHash: _p, ...publicAgent } = jit;
      return publicAgent;
    }
    const createdJit = createDefaultJitAgent();
    const { salt: _s, passwordHash: _p, ...publicAgent } = createdJit;
    return publicAgent;
  }

  const agents = await readAgentRecords();

  const agent = agents.find((a) => {
    if (!a.active) return false;
    if (a.approvalStatus && a.approvalStatus !== "Approved") return false;
    if (a.email && a.email.toLowerCase() === normalizedIdentity) return true;
    if (a.name && a.name.toLowerCase() === normalizedIdentity) return true;
    if (a.referralCode && a.referralCode.toLowerCase() === normalizedIdentity) return true;
    const aDigits = a.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (aDigits === cleanDigits || aDigits.endsWith(cleanDigits) || cleanDigits.endsWith(aDigits))) {
      return true;
    }
    return a.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (!agent) return null;
  if (!passwordsMatch(password, agent.salt, agent.passwordHash)) return null;

  const { salt: _s, passwordHash: _p, ...publicAgent } = agent;
  return publicAgent;
}

export async function updateAgentRatings(
  agentId: string,
  ratings: {
    businessFeedback: number;
    registrationsCount: number;
    registrationRenewal: number;
    feedbackNote?: string;
    registrationsNote?: string;
    renewalNote?: string;
  },
  updatedBy: string
): Promise<AgentPartner | null> {
  const records = await readAgentRecords();
  const agent = records.find((a) => a.id === agentId || a.referralCode === agentId);
  if (!agent) return null;

  const bf = Math.max(0, Math.min(100, Math.round(Number(ratings.businessFeedback) || 0)));
  const rc = Math.max(0, Math.min(100, Math.round(Number(ratings.registrationsCount) || 0)));
  const rr = Math.max(0, Math.min(100, Math.round(Number(ratings.registrationRenewal) || 0)));
  const overall = Math.round((bf + rc + rr) / 3);

  agent.ratings = {
    businessFeedback: bf,
    registrationsCount: rc,
    registrationRenewal: rr,
    overall,
    feedbackNote: ratings.feedbackNote || agent.ratings?.feedbackNote || "",
    registrationsNote: ratings.registrationsNote || agent.ratings?.registrationsNote || "",
    renewalNote: ratings.renewalNote || agent.ratings?.renewalNote || "",
    lastUpdated: new Date().toISOString(),
    updatedBy: updatedBy || "Super Admin",
  };

  await writeAgentRecords(records);
  const { salt, passwordHash, ...publicAgent } = agent;
  return publicAgent;
}

export async function toggleAgentActive(id: string, active: boolean): Promise<boolean> {
  const agents = await readAgentRecords();
  const index = agents.findIndex((a) => a.id === id);
  if (index === -1) return false;
  agents[index].active = active;
  await writeAgentRecords(agents);
  return true;
}

export async function isAgentPartnerDisabled(identity: string, password?: string): Promise<boolean> {
  const agents = await readAgentRecords();
  const normalized = identity.trim().toLowerCase();
  const cleanDigits = normalized.replace(/\D/g, "");
  const agent = agents.find((a) => {
    if (a.email && a.email.toLowerCase() === normalized) return true;
    if (a.referralCode && a.referralCode.toLowerCase() === normalized) return true;
    if (cleanDigits.length >= 8 && a.phone) {
      const aDigits = a.phone.replace(/\D/g, "");
      if (aDigits === cleanDigits || (aDigits.length >= 10 && cleanDigits.length >= 10 && aDigits.slice(-10) === cleanDigits.slice(-10))) {
        return true;
      }
    }
    return false;
  });
  if (!agent) return false;
  if (password && !passwordsMatch(password, agent.salt, agent.passwordHash)) return false;
  return agent.active === false;
}

export async function getAgentByIdentity(identity: string): Promise<AgentPartner | null> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalizedIdentity = identity.trim().toLowerCase();

  if (
    normalizedIdentity === "jit" ||
    normalizedIdentity === "jit@bizearch.in" ||
    cleanDigits === "9043022219"
  ) {
    const agents = await readAgentRecords();
    const jit = agents.find(
      (a) =>
        (a.referralCode || "").trim().toUpperCase() === "JIT" ||
        (a.name || "").trim().toUpperCase() === "JIT" ||
        (a.phone && a.phone.replace(/\D/g, "") === "9043022219")
    );
    if (jit) {
      jit.referralCode = DEFAULT_JIT_REFERRAL_CODE;
      const { salt: _s, passwordHash: _p, ...publicAgent } = jit;
      return publicAgent;
    }
    const createdJit = createDefaultJitAgent();
    const { salt: _s, passwordHash: _p, ...publicAgent } = createdJit;
    return publicAgent;
  }

  const agents = await readAgentRecords();

  const agent = agents.find((a) => {
    if (a.id === identity) return true;
    if (a.email && a.email.toLowerCase() === normalizedIdentity) return true;
    if (a.name && a.name.toLowerCase() === normalizedIdentity) return true;
    if (a.referralCode && a.referralCode.toLowerCase() === normalizedIdentity) return true;
    const aDigits = a.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (aDigits === cleanDigits || aDigits.endsWith(cleanDigits) || cleanDigits.endsWith(aDigits))) {
      return true;
    }
    return a.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (!agent) return null;
  const { salt: _s, passwordHash: _p, ...publicAgent } = agent;
  return publicAgent;
}

export async function updateAgentProfile(identity: string, updates: Partial<{ name: string; phone: string; email: string; emergencyPhone?: string }>): Promise<AgentPartner | null> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalizedIdentity = identity.trim().toLowerCase();
  const agents = await readAgentRecords();

  const index = agents.findIndex((a) => {
    if (a.id === identity) return true;
    if (a.email && a.email.toLowerCase() === normalizedIdentity) return true;
    if (a.referralCode && a.referralCode.toLowerCase() === normalizedIdentity) return true;
    const aDigits = a.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (aDigits === cleanDigits || aDigits.endsWith(cleanDigits) || cleanDigits.endsWith(aDigits))) {
      return true;
    }
    return a.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (index === -1) return null;

  if (updates.name) agents[index].name = updates.name.trim();
  if (updates.phone) agents[index].phone = updates.phone.trim();
  if (updates.email !== undefined) agents[index].email = updates.email.trim().toLowerCase();
  if (updates.emergencyPhone !== undefined) agents[index].emergencyPhone = updates.emergencyPhone.trim();

  await writeAgentRecords(agents);
  const { salt: _s, passwordHash: _p, ...publicAgent } = agents[index];
  return publicAgent;
}

export async function resetAgentPassword(identity: string, newPassword: string): Promise<boolean> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalized = identity.trim().toLowerCase();
  const agents = await readAgentRecords();
  const index = agents.findIndex((a) => {
    if (a.id === identity) return true;
    if (a.email && a.email.toLowerCase() === normalized) return true;
    if (a.referralCode && a.referralCode.toLowerCase() === normalized) return true;
    const aDigits = a.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (aDigits === cleanDigits || aDigits.endsWith(cleanDigits) || cleanDigits.endsWith(aDigits))) return true;
    return a.phone.trim().toLowerCase() === normalized;
  });
  if (index === -1) return false;
  const salt = randomBytes(16).toString("hex");
  agents[index].salt = salt;
  agents[index].passwordHash = hashPassword(newPassword, salt);
  await writeAgentRecords(agents);
  return true;
}

export async function approveAgentPartner(id: string, adminIdentity?: string): Promise<AgentPartner | null> {
  const agents = await readAgentRecords();
  const index = agents.findIndex((a) => a.id === id);
  if (index === -1) return null;
  agents[index].active = true;
  agents[index].approvalStatus = "Approved";
  agents[index].approvedAt = new Date().toISOString();
  if (adminIdentity) {
    agents[index].approvedBy = adminIdentity;
  }
  delete agents[index].rejectedAt;
  delete agents[index].rejectedBy;
  delete agents[index].rejectionReason;
  await writeAgentRecords(agents);
  const { salt: _s, passwordHash: _p, ...publicAgent } = agents[index];
  return publicAgent;
}

export async function rejectAgentPartner(id: string, adminIdentity?: string, reason?: string): Promise<AgentPartner | null> {
  const agents = await readAgentRecords();
  const index = agents.findIndex((a) => a.id === id);
  if (index === -1) return null;
  agents[index].active = false;
  agents[index].approvalStatus = "Rejected";
  agents[index].rejectedAt = new Date().toISOString();
  if (adminIdentity) {
    agents[index].rejectedBy = adminIdentity;
  }
  if (reason) {
    agents[index].rejectionReason = reason.trim();
  }
  await writeAgentRecords(agents);
  const { salt: _s, passwordHash: _p, ...publicAgent } = agents[index];
  return publicAgent;
}

export async function getAgentLoginCheck(
  identity: string,
  password?: string
): Promise<{
  canLogin: boolean;
  status: AgentApprovalStatus | "Disabled" | "NotFound" | "InvalidPassword";
  message?: string;
  agent?: AgentPartner;
}> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalized = identity.trim().toLowerCase();

  if (
    normalized === "jit" ||
    normalized === "jit@bizearch.in" ||
    cleanDigits === "9043022219"
  ) {
    if (password && password !== DEFAULT_JIT_PASSWORD) {
      return { canLogin: false, status: "InvalidPassword", message: "Incorrect password for Agent JIT." };
    }
    const createdJit = createDefaultJitAgent();
    const { salt: _s, passwordHash: _p, ...publicAgent } = createdJit;
    return { canLogin: true, status: "Approved", agent: publicAgent };
  }

  const agents = await readAgentRecords();
  const agent = agents.find((a) => {
    if (a.email && a.email.toLowerCase() === normalized) return true;
    if (a.referralCode && a.referralCode.toLowerCase() === normalized) return true;
    if (a.name && a.name.toLowerCase() === normalized) return true;
    if (cleanDigits.length >= 8 && a.phone) {
      const aDigits = a.phone.replace(/\D/g, "");
      if (
        aDigits === cleanDigits ||
        (aDigits.length >= 10 && cleanDigits.length >= 10 && aDigits.slice(-10) === cleanDigits.slice(-10))
      ) {
        return true;
      }
    }
    return false;
  });

  if (!agent) {
    return { canLogin: false, status: "NotFound", message: "No agent account found for this mobile number or email." };
  }

  if (password && !passwordsMatch(password, agent.salt, agent.passwordHash)) {
    return { canLogin: false, status: "InvalidPassword", message: "Incorrect password." };
  }

  const { salt: _s, passwordHash: _p, ...publicAgent } = agent;

  if (agent.approvalStatus === "Pending") {
    return {
      canLogin: false,
      status: "Pending",
      message:
        "Your Agent Partner registration is pending approval by Bizearch Administrators & Super Admins. Please wait for authorization before logging in.",
      agent: publicAgent,
    };
  }

  if (agent.approvalStatus === "Rejected") {
    return {
      canLogin: false,
      status: "Rejected",
      message: `Your Agent Partner registration was rejected by company administration.${
        agent.rejectionReason ? ` Reason: ${agent.rejectionReason}` : ""
      }`,
      agent: publicAgent,
    };
  }

  if (!agent.active) {
    return {
      canLogin: false,
      status: "Disabled",
      message: "This Agent Partner account has been deactivated by company administration. Please contact support.",
      agent: publicAgent,
    };
  }

  return { canLogin: true, status: "Approved", agent: publicAgent };
}
