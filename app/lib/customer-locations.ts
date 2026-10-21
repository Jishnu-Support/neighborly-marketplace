import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type CustomerRegistrationLocation = {
  id: string;
  name: string;
  phoneLast4: string;
  locationStatus: "shared" | "denied" | "unavailable";
  latitude: number | null;
  longitude: number | null;
  registeredAt: string;
  verificationStatus: "Demo request · Mobile verified; account inactive";
};

type NewCustomerRegistrationLocation = Omit<CustomerRegistrationLocation, "id" | "registeredAt" | "verificationStatus">;
const recordsPath = process.env.NEIGHBORLY_CUSTOMER_LOCATION_STORE || path.join(process.cwd(), ".neighborly-customer-locations.json");

async function readRecords(): Promise<CustomerRegistrationLocation[]> {
  try {
    const parsed = JSON.parse(await readFile(recordsPath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Customer registration location store has an invalid format.");
    return parsed as CustomerRegistrationLocation[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function saveCustomerRegistrationLocation(input: NewCustomerRegistrationLocation) {
  const records = await readRecords();
  const record: CustomerRegistrationLocation = {
    ...input,
    id: randomUUID(),
    registeredAt: new Date().toISOString(),
    verificationStatus: "Demo request · Mobile verified; account inactive",
  };
  await mkdir(path.dirname(recordsPath), { recursive: true });
  const temporaryPath = `${recordsPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify([record, ...records], null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, recordsPath);
  return record;
}

export async function listCustomerRegistrationLocations() {
  return readRecords();
}
