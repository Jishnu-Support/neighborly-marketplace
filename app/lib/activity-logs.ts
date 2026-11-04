import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type ActivityLogCategory =
  | "Registration"
  | "Login"
  | "Search"
  | "Lead"
  | "View"
  | "SOS"
  | "Order"
  | "Admin"
  | "General";

export type ActivityActorRole =
  | "Customer"
  | "Business"
  | "Agent"
  | "Admin"
  | "Super Admin"
  | "Guest";

export type ActivityLogRecord = {
  id: string;
  action: string;
  category: ActivityLogCategory;
  actorName: string;
  actorPhone?: string;
  actorRole: ActivityActorRole;
  locality?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

export type NewActivityLog = Omit<ActivityLogRecord, "id" | "timestamp"> & {
  timestamp?: string;
};

const activityLogsStorePath =
  process.env.NEIGHBORLY_ACTIVITY_LOGS_STORE ||
  path.join(process.cwd(), ".neighborly-activity-logs.json");

const SEED_ACTIVITY_LOGS: ActivityLogRecord[] = [
  {
    id: "act-hsr-101",
    action: "Customer registered account: Priya Sundaram (+91 94432 10101)",
    category: "Registration",
    actorName: "Priya Sundaram",
    actorPhone: "+91 94432 10101",
    actorRole: "Customer",
    locality: "Avalapalli HUDCO",
    details: "New customer registered with OTP verification. Consented to browser location sharing.",
    metadata: { locationStatus: "shared", latitude: 12.7389, longitude: 77.8321 },
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-102",
    action: "WhatsApp Lead initiated: Adyar Ananda Bhavan (A2B)",
    category: "Lead",
    actorName: "Ramesh Kumar",
    actorPhone: "+91 98421 23456",
    actorRole: "Customer",
    locality: "Bagalur Road",
    details: "Customer clicked WhatsApp chat button for Adyar Ananda Bhavan (A2B) to enquire on restaurant hours and orders.",
    metadata: { businessName: "Adyar Ananda Bhavan (A2B)", channel: "WhatsApp" },
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-103",
    action: 'Customer search performed: "Kauvery Hospital"',
    category: "Search",
    actorName: "Sneha Krishnan",
    actorPhone: "+91 97890 12345",
    actorRole: "Customer",
    locality: "Shanthi Nagar",
    details: 'Searched for "Kauvery Hospital" in Hospitals & Healthcare sector.',
    metadata: { query: "Kauvery Hospital", sector: "Healthcare" },
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-104",
    action: "Phone call initiated: Kauvery Hospital (+91 4344 272727)",
    category: "Lead",
    actorName: "Sneha Krishnan",
    actorPhone: "+91 97890 12345",
    actorRole: "Customer",
    locality: "Shanthi Nagar",
    details: "Direct telephone call initiated to Kauvery Hospital emergency reception desk.",
    metadata: { businessName: "Kauvery Hospital", phone: "+91 4344 272727" },
    timestamp: new Date(Date.now() - 27 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-105",
    action: "Customer login: Ramesh Kumar (+91 98421 23456)",
    category: "Login",
    actorName: "Ramesh Kumar",
    actorPhone: "+91 98421 23456",
    actorRole: "Customer",
    locality: "Bagalur Road",
    details: "Signed into customer account via mobile credentials.",
    metadata: { portal: "Customer" },
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-106",
    action: "Store profile viewed: Croma - Bagalur Road",
    category: "View",
    actorName: "Guest Visitor",
    actorRole: "Guest",
    locality: "Hosur Central",
    details: "Viewed electronics product catalogue, store hours, and physical address for Croma Hosur.",
    metadata: { businessName: "Croma" },
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-107",
    action: "WhatsApp Lead initiated: Croma (+91 94421 88771)",
    category: "Lead",
    actorName: "Guest Visitor",
    actorRole: "Guest",
    locality: "Hosur Central",
    details: "Sent Jishnu Infotech verification query to Croma Hosur WhatsApp contact.",
    metadata: { businessName: "Croma", phone: "+91 94421 88771" },
    timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-108",
    action: 'Customer search performed: "Car repair and water wash near SIPCOT"',
    category: "Search",
    actorName: "Karthik Raja",
    actorPhone: "+91 99440 98765",
    actorRole: "Customer",
    locality: "SIPCOT Phase 1",
    details: "Filtered results by Automobile Services and Open Now.",
    metadata: { query: "Car repair", sector: "Automobile" },
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-109",
    action: "Customer registered account: Karthik Raja (+91 99440 98765)",
    category: "Registration",
    actorName: "Karthik Raja",
    actorPhone: "+91 99440 98765",
    actorRole: "Customer",
    locality: "SIPCOT Phase 1",
    details: "Completed registration with address at Mookandapalli, SIPCOT Phase 1. Location permission denied.",
    metadata: { locationStatus: "denied" },
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-110",
    action: "Super Admin audit: Admin directory updated",
    category: "Admin",
    actorName: "Company Super Admin",
    actorPhone: "+91 98765 43210",
    actorRole: "Super Admin",
    locality: "Hosur Municipal Office Road",
    details: "Reviewed registered business accounts and verified physical address directory coordinates.",
    metadata: { portal: "Company" },
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-111",
    action: "WhatsApp Lead initiated: GRT Jewellers (+91 4344 220005)",
    category: "Lead",
    actorName: "Ananya Patel",
    actorPhone: "+91 97500 54321",
    actorRole: "Customer",
    locality: "Rajeev Nagar",
    details: "Customer requested gold rate enquiry and showroom timings from GRT Jewellers.",
    metadata: { businessName: "GRT Jewellers" },
    timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
  },
  {
    id: "act-hsr-112",
    action: "Customer SOS Alert Check-in: Avalapalli HUDCO",
    category: "SOS",
    actorName: "Priya Sundaram",
    actorPhone: "+91 94432 10101",
    actorRole: "Customer",
    locality: "Avalapalli HUDCO",
    details: "Safety test notification broadcast with verified emergency contact phones.",
    metadata: { serviceNumber: "112", emergencyType: "police" },
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

export async function readActivityLogs(): Promise<ActivityLogRecord[]> {
  try {
    const raw = await readFile(activityLogsStorePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ActivityLogRecord[];
    }
    // Pre-populate if empty
    await writeActivityLogs(SEED_ACTIVITY_LOGS);
    return SEED_ACTIVITY_LOGS;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      try {
        await writeActivityLogs(SEED_ACTIVITY_LOGS);
      } catch {
        // If write fails during initial build, return seeds
      }
      return SEED_ACTIVITY_LOGS;
    }
    return SEED_ACTIVITY_LOGS;
  }
}

async function writeActivityLogs(records: ActivityLogRecord[]): Promise<void> {
  await mkdir(path.dirname(activityLogsStorePath), { recursive: true });
  const temporaryPath = `${activityLogsStorePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(records, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, activityLogsStorePath);
}

export async function saveActivityLog(input: NewActivityLog): Promise<ActivityLogRecord> {
  const records = await readActivityLogs();
  const record: ActivityLogRecord = {
    id: `act-${Date.now()}-${randomUUID().slice(0, 8)}`,
    action: input.action,
    category: input.category || "General",
    actorName: input.actorName || "Guest User",
    actorPhone: input.actorPhone,
    actorRole: input.actorRole || "Customer",
    locality: input.locality || "Hosur",
    details: input.details,
    metadata: input.metadata,
    timestamp: input.timestamp || new Date().toISOString(),
  };

  // Keep latest 500 records
  const updated = [record, ...records].slice(0, 500);
  try {
    await writeActivityLogs(updated);
  } catch {
    // Graceful fallback
  }
  return record;
}

export async function listActivityLogs(filter?: {
  category?: string;
  role?: string;
  query?: string;
  limit?: number;
}): Promise<{ logs: ActivityLogRecord[]; stats: Record<string, number> }> {
  const allLogs = await readActivityLogs();

  const stats = {
    total: allLogs.length,
    leads: allLogs.filter((l) => l.category === "Lead").length,
    searches: allLogs.filter((l) => l.category === "Search").length,
    registrations: allLogs.filter((l) => l.category === "Registration").length,
    logins: allLogs.filter((l) => l.category === "Login").length,
    sos: allLogs.filter((l) => l.category === "SOS").length,
    views: allLogs.filter((l) => l.category === "View").length,
  };

  let filtered = allLogs;

  if (filter?.category && filter.category !== "All") {
    filtered = filtered.filter(
      (l) => l.category.toLowerCase() === filter.category!.toLowerCase()
    );
  }

  if (filter?.role && filter.role !== "All") {
    filtered = filtered.filter(
      (l) => l.actorRole.toLowerCase() === filter.role!.toLowerCase()
    );
  }

  if (filter?.query && filter.query.trim()) {
    const q = filter.query.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        (l.actorPhone && l.actorPhone.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.locality && l.locality.toLowerCase().includes(q))
    );
  }

  const limit = filter?.limit || 200;
  return { logs: filtered.slice(0, limit), stats };
}
