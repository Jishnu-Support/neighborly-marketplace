import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";

export type PortalRole = "Account" | "Business" | "Agent" | "Company";
export type CompanyAccessLevel = "Admin" | "Super Admin";
export type AuthSession = { role: PortalRole; identity: string; expiresAt: number; accessLevel?: CompanyAccessLevel };
export type CompanyAdmin = { id: string; name: string; email: string; active: boolean; createdAt: string };
type StoredAdmin = CompanyAdmin & { salt: string; passwordHash: string };

export const AUTH_COOKIE = "neighborly_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;
const validRoles: PortalRole[] = ["Account", "Business", "Agent", "Company"];
const validCompanyAccessLevels: CompanyAccessLevel[] = ["Admin", "Super Admin"];
const demoAccounts: Record<Exclude<PortalRole, "Company">, { identity: string; password: string }> = {
  Account: { identity: "customer@neighborly.demo", password: "Neighbor123!" },
  Business: { identity: "business@neighborly.demo", password: "Business123!" },
  Agent: { identity: "agent@neighborly.demo", password: "Agent123!" },
};
const adminStorePath = process.env.NEIGHBORLY_ADMIN_STORE || path.join(process.cwd(), ".neighborly-admins.json");

function signingSecret() {
  if (process.env.NEIGHBORLY_AUTH_SECRET) return process.env.NEIGHBORLY_AUTH_SECRET;
  if (process.env.NODE_ENV !== "production") return "neighborly-local-demo-secret-change-before-deploy";
  throw new Error("NEIGHBORLY_AUTH_SECRET must be configured before enabling authentication in production.");
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function passwordsMatch(password: string, salt: string, expectedHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function writeAdminRecords(admins: StoredAdmin[]) {
  await mkdir(path.dirname(adminStorePath), { recursive: true });
  const temporaryPath = `${adminStorePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(admins, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, adminStorePath);
}

async function createStoredAdmin(name: string, email: string, password: string, id: string = randomUUID()): Promise<StoredAdmin> {
  const salt = randomBytes(16).toString("hex");
  return { id, name, email, active: true, createdAt: new Date().toISOString(), salt, passwordHash: hashPassword(password, salt) };
}

async function readAdminRecords(): Promise<StoredAdmin[]> {
  try {
    const parsed = JSON.parse(await readFile(adminStorePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("The local Admin account store has an invalid format.");
    return parsed as StoredAdmin[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const demoAdmin = await createStoredAdmin("Demo Admin", "manager@neighborly.demo", "Manager123!", "demo-admin");
    const admins = [demoAdmin];
    await writeAdminRecords(admins);
    return admins;
  }
}

export function isPortalRole(value: unknown): value is PortalRole {
  return typeof value === "string" && validRoles.includes(value as PortalRole);
}

export function isCompanyAccessLevel(value: unknown): value is CompanyAccessLevel {
  return typeof value === "string" && validCompanyAccessLevels.includes(value as CompanyAccessLevel);
}

export async function verifyCredentials(role: PortalRole, identity: string, password: string, accessLevel?: CompanyAccessLevel) {
  const normalizedIdentity = identity.trim().toLowerCase();
  if (role === "Company") {
    if (accessLevel === "Super Admin") {
      const adminEmail = (process.env.NEIGHBORLY_SUPER_ADMIN_EMAIL || "superadmin@neighborly.demo").trim().toLowerCase();
      const adminPassword = process.env.NEIGHBORLY_SUPER_ADMIN_PASSWORD || "SuperAdmin123!";
      return normalizedIdentity === adminEmail && password === adminPassword;
    }
    if (accessLevel !== "Admin") return false;
    const admin = (await readAdminRecords()).find((item) => item.email === normalizedIdentity && item.active);
    return Boolean(admin && passwordsMatch(password, admin.salt, admin.passwordHash));
  }
  const account = demoAccounts[role];
  return normalizedIdentity === account.identity && password === account.password;
}

export function createSessionToken(role: PortalRole, identity: string, accessLevel?: CompanyAccessLevel) {
  const payload = Buffer.from(JSON.stringify({ role, identity, expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000, ...(role === "Company" ? { accessLevel } : {}) } satisfies AuthSession)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): AuthSession | null {
  if (!token) return null;
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthSession;
    if (!isPortalRole(session.role) || typeof session.identity !== "string" || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
    if (session.role === "Company" ? !isCompanyAccessLevel(session.accessLevel) : session.accessLevel !== undefined) return null;
    return session;
  } catch {
    return null;
  }
}

export async function listCompanyAdmins(): Promise<CompanyAdmin[]> {
  const admins = await readAdminRecords();
  return admins.map(({ id, name, email, active, createdAt }) => ({ id, name, email, active, createdAt }));
}

export async function registerCompanyAdmin(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const admins = await readAdminRecords();
  if (normalizedEmail === (process.env.NEIGHBORLY_SUPER_ADMIN_EMAIL || "superadmin@neighborly.demo").trim().toLowerCase() || admins.some((admin) => admin.email === normalizedEmail)) {
    throw new Error("An account already exists with that email.");
  }
  const admin = await createStoredAdmin(name.trim(), normalizedEmail, password);
  await writeAdminRecords([admin, ...admins]);
  const { salt: _salt, passwordHash: _hash, ...publicAdmin } = admin;
  return publicAdmin;
}

export async function setCompanyAdminStatus(id: string, active: boolean) {
  const admins = await readAdminRecords();
  const selectedAdmin = admins.find((admin) => admin.id === id);
  if (!selectedAdmin) return null;
  selectedAdmin.active = active;
  await writeAdminRecords(admins);
  const { salt: _salt, passwordHash: _hash, ...publicAdmin } = selectedAdmin;
  return publicAdmin;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role === "Company" && session.accessLevel === "Admin") {
    const account = (await readAdminRecords()).find((admin) => admin.email === session.identity && admin.active);
    if (!account) return null;
  }
  return session;
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};