import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type SosEmergencyType = "police" | "medical" | "fire" | "women-safety" | "general";

export type SosAlert = {
  id: string;
  customerName: string;
  profileRole: "Account" | "Business" | "Agent" | "Company";
  identity?: string;
  emergencyType: SosEmergencyType;
  serviceNumber: string;
  customerPhone?: string;
  customerPhoneLast4: string;
  emergencyPhones: [string, string];
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  locationStatus: "shared" | "unavailable";
  createdAt: string;
  deliveryStatus: "Recorded by Bizearch demo; no emergency call was placed";
};

type StoredSosAlert = SosAlert & { requestKey?: string };
type NewSosAlert = Omit<SosAlert, "id" | "createdAt" | "deliveryStatus">;
type CreateSosAlertResult = { alert: SosAlert; created: boolean };

const storePath = process.env.NEIGHBORLY_SOS_ALERT_STORE || path.join(process.cwd(), ".neighborly-sos-alerts.json");
const lockPath = `${storePath}.lock`;
const LOCK_TIMEOUT_MS = 5000;
const STALE_LOCK_MS = 30_000;

async function readAlerts(): Promise<StoredSosAlert[]> {
  try {
    const parsed = JSON.parse(await readFile(storePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("The local SOS alert store has an invalid format.");
    return parsed as StoredSosAlert[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function acquireStoreLock() {
  await mkdir(path.dirname(storePath), { recursive: true });
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const handle = await open(lockPath, "wx", 0o600);
      return async () => {
        await handle.close();
        await unlink(lockPath).catch(() => undefined);
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const lock = await stat(lockPath);
        if (Date.now() - lock.mtimeMs > STALE_LOCK_MS) await unlink(lockPath);
      } catch (statError) {
        if ((statError as NodeJS.ErrnoException).code !== "ENOENT") throw statError;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  throw new Error("The SOS alert store is busy. Please try again.");
}

async function writeAlerts(alerts: StoredSosAlert[]) {
  const temporaryPath = `${storePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(alerts, null, 2), { encoding: "utf8", mode: 0o600 });
    const handle = await open(temporaryPath, "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporaryPath, storePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function findSosAlertByRequestKey(identity: string, requestKey: string): Promise<SosAlert | null> {
  const alert = (await readAlerts()).find((item) => item.identity === identity && item.requestKey === requestKey);
  if (!alert) return null;
  const { requestKey: _requestKey, ...publicAlert } = alert;
  return publicAlert;
}

export async function createSosAlert(input: NewSosAlert, requestKey: string): Promise<CreateSosAlertResult> {
  const release = await acquireStoreLock();
  try {
    const alerts = await readAlerts();
    const existing = alerts.find((item) => item.identity === input.identity && item.requestKey === requestKey);
    if (existing) {
      const { requestKey: _requestKey, ...alert } = existing;
      return { alert, created: false };
    }
    const alert: StoredSosAlert = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      deliveryStatus: "Recorded by Bizearch demo; no emergency call was placed",
      requestKey,
    };
    await writeAlerts([...alerts, alert]);
    const { requestKey: _requestKey, ...publicAlert } = alert;
    return { alert: publicAlert, created: true };
  } finally {
    await release();
  }
}

export async function listSosAlerts(): Promise<SosAlert[]> {
  return (await readAlerts()).map(({ requestKey: _requestKey, ...alert }) => alert).reverse().slice(0, 100);
}
