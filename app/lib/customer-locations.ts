import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { saveActivityLog } from "./activity-logs";
import { resolveStorePath } from "./storage-paths";

export type CustomerRegistrationLocation = {
  id: string;
  name: string;
  phone?: string;
  phoneLast4: string;
  email?: string;
  doorNo?: string;
  street?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  address?: string;
  emergencyPhones?: [string, string];
  emergencyNames?: [string, string];
  locationStatus: "shared" | "denied" | "unavailable";
  latitude: number | null;
  longitude: number | null;
  registeredAt: string;
  verificationStatus: string;
  registrationMethod?: string;
};

export type NewCustomerRegistrationLocation = {
  name: string;
  phone?: string;
  phoneLast4?: string;
  email?: string;
  doorNo?: string;
  street?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  address?: string;
  emergencyPhones?: [string, string];
  emergencyNames?: [string, string];
  locationStatus: "shared" | "denied" | "unavailable";
  latitude: number | null;
  longitude: number | null;
  verificationStatus?: string;
  registrationMethod?: string;
};

const recordsPath = resolveStorePath("NEIGHBORLY_CUSTOMER_LOCATION_STORE", ".neighborly-customer-locations.json");

async function readRecords(): Promise<CustomerRegistrationLocation[]> {
  try {
    const raw = await readFile(recordsPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as CustomerRegistrationLocation[];
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    return [];
  }
}

async function writeRecords(records: CustomerRegistrationLocation[]): Promise<void> {
  await mkdir(path.dirname(recordsPath), { recursive: true });
  const temporaryPath = `${recordsPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(records, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, recordsPath);
}

export async function saveCustomerRegistrationLocation(input: NewCustomerRegistrationLocation): Promise<CustomerRegistrationLocation> {
  const records = await readRecords();
  const phone = input.phone || "";
  const phoneClean = phone.replace(/\D/g, "");
  const phoneLast4 = input.phoneLast4 || (phoneClean.length >= 4 ? phoneClean.slice(-4) : "0000");

  const locality = input.locality?.trim() || "Bagalur Road";
  const city = input.city?.trim() || "Hosur";
  const pincode = input.pincode?.trim() || "635109";
  const address =
    input.address?.trim() ||
    [input.doorNo, input.street, locality, pincode ? `${city} - ${pincode}` : city]
      .filter(Boolean)
      .join(", ");

  const record: CustomerRegistrationLocation = {
    id: `cust-${Date.now()}-${randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    phone: phone.trim() || `+91 ${phoneLast4}`,
    phoneLast4,
    email: input.email?.trim() || "",
    doorNo: input.doorNo?.trim() || "",
    street: input.street?.trim() || "",
    locality,
    city,
    district: input.district?.trim() || "Krishnagiri",
    state: input.state?.trim() || "Tamil Nadu",
    pincode,
    address,
    emergencyPhones: input.emergencyPhones || ["", ""],
    emergencyNames: input.emergencyNames || ["", ""],
    locationStatus: input.locationStatus,
    latitude: input.latitude,
    longitude: input.longitude,
    registeredAt: new Date().toISOString(),
    verificationStatus: input.verificationStatus || "Active · Mobile OTP verified",
    registrationMethod: input.registrationMethod || "Mobile + OTP Verification & Password",
  };

  await writeRecords([record, ...records]);

  // Record persistent activity log
  try {
    await saveActivityLog({
      action: `Customer registered account: ${record.name} (${record.phone})`,
      category: "Registration",
      actorName: record.name,
      actorPhone: record.phone,
      actorRole: "Customer",
      locality: record.locality,
      details: `New customer registered. Locality: ${record.locality}. Address: ${record.address}. Location consent: ${record.locationStatus}${
        record.locationStatus === "shared" && record.latitude && record.longitude
          ? ` (Lat: ${record.latitude.toFixed(5)}, Lng: ${record.longitude.toFixed(5)})`
          : ""
      }.`,
    });
  } catch {
    // Non-blocking log
  }

  return record;
}

export async function listCustomerRegistrationLocations(): Promise<CustomerRegistrationLocation[]> {
  return readRecords();
}
