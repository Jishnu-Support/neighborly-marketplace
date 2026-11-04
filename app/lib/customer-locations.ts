import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { saveActivityLog } from "./activity-logs";

export type CustomerRegistrationLocation = {
  id: string;
  name: string;
  phone: string;
  phoneLast4: string;
  email?: string;
  doorNo?: string;
  street?: string;
  locality: string;
  city: string;
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

const recordsPath =
  process.env.NEIGHBORLY_CUSTOMER_LOCATION_STORE ||
  path.join(process.cwd(), ".neighborly-customer-locations.json");

const SEED_CUSTOMER_REGISTRATIONS: CustomerRegistrationLocation[] = [
  {
    id: "cust-hsr-201",
    name: "Priya Sundaram",
    phone: "+91 94432 10101",
    phoneLast4: "0101",
    email: "priya.sundaram@gmail.com",
    doorNo: "Plot 42",
    street: "Surya Nagar Main Road",
    locality: "Avalapalli HUDCO",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635109",
    address: "Plot 42, Surya Nagar Main Road, Avalapalli HUDCO, Hosur - 635109",
    emergencyPhones: ["+91 94432 10102", "+91 94432 10103"],
    emergencyNames: ["Sundaram (Father)", "Kavitha (Sister)"],
    locationStatus: "shared",
    latitude: 12.73891,
    longitude: 77.83212,
    registeredAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
  {
    id: "cust-hsr-202",
    name: "Ramesh Kumar",
    phone: "+91 98421 23456",
    phoneLast4: "3456",
    email: "ramesh.k.hosur@outlook.com",
    doorNo: "No. 18/B",
    street: "Teachers Colony 2nd Cross",
    locality: "Bagalur Road",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635109",
    address: "No. 18/B, Teachers Colony 2nd Cross, Bagalur Road, Hosur - 635109",
    emergencyPhones: ["+91 98421 23457", "+91 98421 23458"],
    emergencyNames: ["Meena Kumar (Spouse)", "Arun (Brother)"],
    locationStatus: "shared",
    latitude: 12.7412,
    longitude: 77.8354,
    registeredAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
  {
    id: "cust-hsr-203",
    name: "Sneha Krishnan",
    phone: "+91 97890 12345",
    phoneLast4: "2345",
    email: "sneha.krishnan@yahoo.com",
    doorNo: "Flat 302",
    street: "CSI Church Lane",
    locality: "Shanthi Nagar",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635109",
    address: "Flat 302, CSI Church Lane, Shanthi Nagar, Hosur - 635109",
    emergencyPhones: ["+91 97890 12346", "+91 97890 12347"],
    emergencyNames: ["Krishnan (Father)", "Deepa (Mother)"],
    locationStatus: "denied",
    latitude: null,
    longitude: null,
    registeredAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
  {
    id: "cust-hsr-204",
    name: "Karthik Raja",
    phone: "+91 99440 98765",
    phoneLast4: "8765",
    email: "karthik.raja92@gmail.com",
    doorNo: "No. 88",
    street: "SIPCOT Housing Colony 4th Street",
    locality: "Mookandapalli (SIPCOT Phase 1)",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635126",
    address: "No. 88, SIPCOT Housing Colony 4th Street, Mookandapalli, Hosur - 635126",
    emergencyPhones: ["+91 99440 98766", "+91 99440 98767"],
    emergencyNames: ["Rajagopal (Father)", "Lakshmi (Mother)"],
    locationStatus: "shared",
    latitude: 12.7265,
    longitude: 77.848,
    registeredAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
  {
    id: "cust-hsr-205",
    name: "Ananya Patel",
    phone: "+91 97500 54321",
    phoneLast4: "4321",
    email: "ananya.patel@gmail.com",
    doorNo: "D-14",
    street: "New Dinnur Main Road",
    locality: "Rajeev Nagar",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635109",
    address: "D-14, New Dinnur Main Road, Rajeev Nagar, Hosur - 635109",
    emergencyPhones: ["+91 97500 54322", "+91 97500 54323"],
    emergencyNames: ["Bhavik Patel (Brother)", "Geeta Patel (Mother)"],
    locationStatus: "unavailable",
    latitude: null,
    longitude: null,
    registeredAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
  {
    id: "cust-hsr-206",
    name: "Dr. Arvind Swamy",
    phone: "+91 94420 33445",
    phoneLast4: "3445",
    email: "dr.arvindswamy@gmail.com",
    doorNo: "No. 5",
    street: "Old Rayakottah HUDCO Road",
    locality: "Denkanikottai Road",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635109",
    address: "No. 5, Old Rayakottah HUDCO Road, Denkanikottai Road, Hosur - 635109",
    emergencyPhones: ["+91 94420 33446", "+91 94420 33447"],
    emergencyNames: ["Dr. Radhika (Spouse)", "Clinic Reception Desk"],
    locationStatus: "shared",
    latitude: 12.7215,
    longitude: 77.8289,
    registeredAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
  {
    id: "cust-hsr-207",
    name: "Meenakshi Sundaresan",
    phone: "+91 96291 87654",
    phoneLast4: "7654",
    email: "meenakshi.s@gmail.com",
    doorNo: "Plot 12",
    street: "Station Road, Near Railway Station",
    locality: "Kamaraj Colony",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635109",
    address: "Plot 12, Station Road, Near Railway Station, Kamaraj Colony, Hosur - 635109",
    emergencyPhones: ["+91 96291 87655", "+91 96291 87656"],
    emergencyNames: ["Sundaresan (Spouse)", "Ganesh (Son)"],
    locationStatus: "shared",
    latitude: 12.7301,
    longitude: 77.8245,
    registeredAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
  {
    id: "cust-hsr-208",
    name: "Vigneshwaran S.",
    phone: "+91 98940 76543",
    phoneLast4: "6543",
    email: "vicky.s@hotmail.com",
    doorNo: "No. 29",
    street: "Temple View Avenue",
    locality: "Mathigiri",
    city: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: "635110",
    address: "No. 29, Temple View Avenue, Mathigiri, Hosur - 635110",
    emergencyPhones: ["+91 98940 76544", "+91 98940 76545"],
    emergencyNames: ["Selvam (Father)", "Revathi (Sister)"],
    locationStatus: "denied",
    latitude: null,
    longitude: null,
    registeredAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    verificationStatus: "Active · Mobile OTP verified",
    registrationMethod: "Mobile + OTP Verification & Password",
  },
];

async function readRecords(): Promise<CustomerRegistrationLocation[]> {
  try {
    const raw = await readFile(recordsPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as CustomerRegistrationLocation[];
    }
    await writeRecords(SEED_CUSTOMER_REGISTRATIONS);
    return SEED_CUSTOMER_REGISTRATIONS;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      try {
        await writeRecords(SEED_CUSTOMER_REGISTRATIONS);
      } catch {
        // Fallback
      }
      return SEED_CUSTOMER_REGISTRATIONS;
    }
    return SEED_CUSTOMER_REGISTRATIONS;
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
