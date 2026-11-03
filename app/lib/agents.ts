import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

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

const storePath = process.env.NEIGHBORLY_AGENT_STORE || path.join(process.cwd(), ".neighborly-agents.json");

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function passwordsMatch(password: string, salt: string, expectedHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function readAgentRecords(): Promise<StoredAgentPartner[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredAgentPartner[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAgentRecords(agents: StoredAgentPartner[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(agents, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, storePath);
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
  const referralCode = input.referralCode?.trim().toUpperCase() || `BIZ-${cleanName}-${randomSuffix}`;

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
  const agents = await readAgentRecords();

  const agent = agents.find((a) => {
    if (!a.active) return false;
    if (a.email && a.email.toLowerCase() === normalizedIdentity) return true;
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
