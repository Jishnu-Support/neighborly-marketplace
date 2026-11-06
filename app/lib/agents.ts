import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";

export type AgentPartner = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  referralCode: string;
  active: boolean;
  createdAt: string;
  referredCount: number;
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
}): Promise<AgentPartner> {
  const existing = await readAgentRecords();
  const cleanPhone = input.phone.replace(/\D/g, "");

  const duplicate = existing.find((a) => {
    const p = a.phone.replace(/\D/g, "");
    return cleanPhone.length >= 8 && (p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p));
  });

  if (duplicate) {
    throw new Error("An agent partner with this mobile number already exists.");
  }

  const salt = randomBytes(16).toString("hex");
  const password = input.password || `Agent@${cleanPhone.slice(-4)}`;
  const passwordHash = hashPassword(password, salt);

  const cleanName = input.name.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "AGNT";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referralCode =
    input.name.trim().toUpperCase() === "JIT" || cleanPhone === "9043022219"
      ? DEFAULT_JIT_REFERRAL_CODE
      : input.referralCode?.trim().toUpperCase() || `BIZ-${cleanName}-${randomSuffix}`;

  const newRecord: StoredAgentPartner = {
    id: randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim().toLowerCase() || "",
    referralCode,
    active: true,
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

export async function toggleAgentActive(id: string, active: boolean): Promise<boolean> {
  const agents = await readAgentRecords();
  const index = agents.findIndex((a) => a.id === id);
  if (index === -1) return false;
  agents[index].active = active;
  await writeAgentRecords(agents);
  return true;
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

export async function updateAgentProfile(identity: string, updates: Partial<{ name: string; phone: string; email: string }>): Promise<AgentPartner | null> {
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

  await writeAgentRecords(agents);
  const { salt: _s, passwordHash: _p, ...publicAgent } = agents[index];
  return publicAgent;
}
