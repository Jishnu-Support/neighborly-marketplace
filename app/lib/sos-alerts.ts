import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type SosEmergencyType = "police" | "medical" | "fire" | "women-safety" | "general";

export type SosAlert = {
  id: string;
  customerName: string;
  profileRole: "Account" | "Business" | "Agent" | "Company";
  emergencyType: SosEmergencyType;
  serviceNumber: string;
  customerPhoneLast4: string;
  emergencyPhones: [string, string];
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  locationStatus: "shared" | "unavailable";
  createdAt: string;
  deliveryStatus: "Recorded by Neighborly demo; no emergency call was placed";
};

type NewSosAlert = Omit<SosAlert, "id" | "createdAt" | "deliveryStatus">;
const storePath = process.env.NEIGHBORLY_SOS_ALERT_STORE || path.join(process.cwd(), ".neighborly-sos-alerts.json");

async function readAlerts(): Promise<SosAlert[]> {
  try {
    const parsed = JSON.parse(await readFile(storePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("The local SOS alert store has an invalid format.");
    return parsed as SosAlert[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function createSosAlert(input: NewSosAlert) {
  const alerts = await readAlerts();
  const alert: SosAlert = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    deliveryStatus: "Recorded by Neighborly demo; no emergency call was placed",
  };
  await mkdir(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify([alert, ...alerts].slice(0, 500), null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, storePath);
  return alert;
}

export async function listSosAlerts() {
  return readAlerts();
}
