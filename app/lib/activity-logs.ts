import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";

export type ActivityLogCategory =
  | "Registration"
  | "Login"
  | "Search"
  | "Lead"
  | "View"
  | "SOS"
  | "Order"
  | "Admin"
  | "Call"
  | "Advertisement"
  | "Customer Care"
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

const activityLogsStorePath = resolveStorePath("NEIGHBORLY_ACTIVITY_LOGS_STORE", ".neighborly-activity-logs.json");

export function getDefaultSeedActivityLogs(): ActivityLogRecord[] {
  const baseTime = Date.now();
  const m = 60 * 1000;
  return [
    {
      id: "act-seed-1",
      action: "Ad viewed: Sri Krishna Sweets & Bakery (Poster Billboard)",
      category: "Advertisement",
      actorName: "Murali",
      actorPhone: "919962775630",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Advertisement impression on Poster Billboard for Sri Krishna Sweets & Bakery (Booking #AD-REQ-102).",
      metadata: { adBookingId: "AD-REQ-102", businessName: "Sri Krishna Sweets & Bakery", surface: "poster" },
      timestamp: new Date(baseTime - 3 * m).toISOString(),
    },
    {
      id: "act-seed-2",
      action: "Phone call initiated: Fortune Hosur – ITC Hotels",
      category: "Call",
      actorName: "Murali",
      actorPhone: "919962775630",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Direct phone call triggered to Fortune Hosur – ITC Hotels (+91 04344 261111).",
      metadata: { businessName: "Fortune Hosur – ITC Hotels", phone: "04344 261111", target: "business" },
      timestamp: new Date(baseTime - 7 * m).toISOString(),
    },
    {
      id: "act-seed-3",
      action: "Searched: 'hotel' in Bagalur Road",
      category: "Search",
      actorName: "Murali",
      actorPhone: "919962775630",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Local directory search executed for 'hotel' around Bagalur Road (5 km radius). Found 8 verified providers.",
      metadata: { query: "hotel", radius: 5, locality: "Bagalur Road" },
      timestamp: new Date(baseTime - 12 * m).toISOString(),
    },
    {
      id: "act-seed-4",
      action: "Customer login: Murali",
      category: "Login",
      actorName: "Murali",
      actorPhone: "919962775630",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Customer authenticated successfully via phone OTP session.",
      metadata: { method: "password_or_otp", portal: "Customer" },
      timestamp: new Date(baseTime - 18 * m).toISOString(),
    },
    {
      id: "act-seed-5",
      action: "Customer lead: WhatsApp enquiry to Bagalur Auto Garage",
      category: "Lead",
      actorName: "Keerthana B",
      actorPhone: "919876543210",
      actorRole: "Customer",
      locality: "Rayakottai Road",
      details: "WhatsApp chat inquiry clicked for Bagalur Auto Garage (Car Periodic Maintenance service).",
      metadata: { businessName: "Bagalur Auto Garage", channel: "WhatsApp" },
      timestamp: new Date(baseTime - 25 * m).toISOString(),
    },
    {
      id: "act-seed-6",
      action: "Phone call initiated: Customer Care Support Hotline",
      category: "Call",
      actorName: "G Venkatesan Sir",
      actorPhone: "919962773219",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Customer dialed platform customer care support hotline (1800-102-4589).",
      metadata: { number: "1800-102-4589", target: "customer_care" },
      timestamp: new Date(baseTime - 32 * m).toISOString(),
    },
    {
      id: "act-seed-7",
      action: "Customer registered: Keerthana B",
      category: "Registration",
      actorName: "Keerthana B",
      actorPhone: "919876543210",
      actorRole: "Customer",
      locality: "Rayakottai Road",
      details: "New verified customer account created with verified mobile OTP.",
      metadata: { locality: "Rayakottai Road", city: "Hosur" },
      timestamp: new Date(baseTime - 45 * m).toISOString(),
    },
    {
      id: "act-seed-8",
      action: "Searched: 'bakery & sweets' in Gandhi Road",
      category: "Search",
      actorName: "Dharshan Ramesh",
      actorPhone: "919443211223",
      actorRole: "Customer",
      locality: "Gandhi Road",
      details: "Directory search for fresh bakery items & sweets in Gandhi Road.",
      metadata: { query: "bakery & sweets", locality: "Gandhi Road" },
      timestamp: new Date(baseTime - 55 * m).toISOString(),
    },
    {
      id: "act-seed-9",
      action: "Ad clicked: Apex Fitness Studio (Marquee Ticker)",
      category: "Advertisement",
      actorName: "Dharshan Ramesh",
      actorPhone: "919443211223",
      actorRole: "Customer",
      locality: "Gandhi Road",
      details: "Customer clicked promotional ticker banner for Apex Fitness Studio: Join today and get 30% off.",
      metadata: { adBookingId: "AD-REQ-103", businessName: "Apex Fitness Studio", surface: "content" },
      timestamp: new Date(baseTime - 65 * m).toISOString(),
    },
    {
      id: "act-seed-10",
      action: "Business registration: Sri Krishna Sweets & Bakery",
      category: "Registration",
      actorName: "Radha Krishnan",
      actorPhone: "919443287654",
      actorRole: "Business",
      locality: "Gandhi Road",
      details: "Business partner registered with verified GSTIN (33AAAAA0000A1Z5) and assigned to field agent.",
      metadata: { businessName: "Sri Krishna Sweets & Bakery", category: "Food & dining" },
      timestamp: new Date(baseTime - 80 * m).toISOString(),
    },
    {
      id: "act-seed-11",
      action: "Emergency SOS readiness check verified",
      category: "SOS",
      actorName: "Murali",
      actorPhone: "919962775630",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Resident emergency SOS broadcast test conducted with verified GPS coordinates.",
      metadata: { coordinates: { latitude: 12.7409, longitude: 77.8253 }, status: "Safe" },
      timestamp: new Date(baseTime - 95 * m).toISOString(),
    },
    {
      id: "act-seed-12",
      action: "Business profile viewed: Sri Krishna Sweets & Bakery",
      category: "View",
      actorName: "G Venkatesan Sir",
      actorPhone: "919962773219",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Viewed full storefront profile, catalog, and opening hours for Sri Krishna Sweets & Bakery.",
      metadata: { businessName: "Sri Krishna Sweets & Bakery" },
      timestamp: new Date(baseTime - 110 * m).toISOString(),
    },
    {
      id: "act-seed-13",
      action: "Company Super Admin login: admin@bizearch.in",
      category: "Login",
      actorName: "Company Super Admin",
      actorPhone: "",
      actorRole: "Super Admin",
      locality: "Hosur Headquarters",
      details: "Super Admin signed in to master platform console.",
      metadata: { portal: "Company", accessLevel: "Super Admin" },
      timestamp: new Date(baseTime - 120 * m).toISOString(),
    },
    {
      id: "act-seed-14",
      action: "Customer lead: Call enquiry to Apex Fitness Studio",
      category: "Lead",
      actorName: "Dharshan Ramesh",
      actorPhone: "919443211223",
      actorRole: "Customer",
      locality: "Gandhi Road",
      details: "Customer requested membership inquiry call with gym trainers.",
      metadata: { businessName: "Apex Fitness Studio", channel: "Phone" },
      timestamp: new Date(baseTime - 135 * m).toISOString(),
    },
    {
      id: "act-seed-15",
      action: "Searched: 'automobiles & bike repair' in SIPCOT Phase I",
      category: "Search",
      actorName: "Keerthana B",
      actorPhone: "919876543210",
      actorRole: "Customer",
      locality: "Rayakottai Road",
      details: "Searched two-wheeler and four-wheeler service centers near SIPCOT Phase I.",
      metadata: { query: "automobiles & bike repair", locality: "SIPCOT Phase I" },
      timestamp: new Date(baseTime - 150 * m).toISOString(),
    },
    {
      id: "act-seed-16",
      action: "Field agent verified: Apex Fitness Studio",
      category: "Admin",
      actorName: "Agent Partner",
      actorPhone: "919900112233",
      actorRole: "Agent",
      locality: "Bagalur Road",
      details: "Field agent completed in-person merchant visit, captured storefront photos, and verified GPS pin.",
      metadata: { businessName: "Apex Fitness Studio", verificationStatus: "Pending Admin Approval" },
      timestamp: new Date(baseTime - 170 * m).toISOString(),
    },
    {
      id: "act-seed-17",
      action: "Phone call initiated: Bagalur Auto Garage",
      category: "Call",
      actorName: "G Venkatesan Sir",
      actorPhone: "919962773219",
      actorRole: "Customer",
      locality: "Bagalur Road",
      details: "Direct phone call initiated from discovery directory to Bagalur Auto Garage.",
      metadata: { businessName: "Bagalur Auto Garage", phone: "+91 98421 55678" },
      timestamp: new Date(baseTime - 190 * m).toISOString(),
    },
    {
      id: "act-seed-18",
      action: "Emergency SOS broadcast alert test",
      category: "SOS",
      actorName: "Keerthana B",
      actorPhone: "919876543210",
      actorRole: "Customer",
      locality: "Rayakottai Road",
      details: "Resident emergency contact broadcast beacon test verified.",
      metadata: { emergencyContact: "Bhuvaneshwari", status: "Delivered" },
      timestamp: new Date(baseTime - 210 * m).toISOString(),
    },
  ];
}

export function sanitizeActivityLogs(records: ActivityLogRecord[]): { logs: ActivityLogRecord[]; changed: boolean } {
  if (!Array.isArray(records) || records.length === 0) {
    return { logs: [], changed: false };
  }

  // Detect spam flooding (e.g. 500 identical records of the same ad view)
  const actionCounts = new Map<string, number>();
  for (const r of records) {
    actionCounts.set(r.action, (actionCounts.get(r.action) || 0) + 1);
  }

  // Deduplicate rapid repeat actions from the same actor
  const deduped: ActivityLogRecord[] = [];
  const seenTimeBuckets = new Set<string>();

  for (const r of records) {
    const timeMs = new Date(r.timestamp).getTime();
    // 5-minute bucket per action and actor
    const bucket = Math.floor(timeMs / (5 * 60 * 1000));
    const actorKey = r.actorPhone || r.actorName || "anon";
    const key = `${r.action}:::${actorKey}:::${bucket}`;

    if (seenTimeBuckets.has(key)) {
      continue;
    }
    seenTimeBuckets.add(key);
    deduped.push(r);
  }

  return { logs: deduped.slice(0, 1000), changed: deduped.length !== records.length };
}

export async function readActivityLogs(): Promise<ActivityLogRecord[]> {
  try {
    const raw = await readFile(activityLogsStorePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const { logs, changed } = sanitizeActivityLogs(parsed as ActivityLogRecord[]);
      if (changed) {
        writeActivityLogs(logs).catch(() => {});
      }
      return logs;
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
  }
  return [];
}

export async function resetAndSeedActivityLogs(): Promise<ActivityLogRecord[]> {
  const seed = getDefaultSeedActivityLogs();
  await writeActivityLogs(seed);
  return seed;
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
  const nowMs = Date.now();

  // Guard against runaway duplicates: if identical action + actor happened in last 3 minutes, skip
  const recentDuplicate = records.slice(0, 15).find((r) => {
    if (r.action !== input.action) return false;
    const sameActor = (r.actorPhone && r.actorPhone === input.actorPhone) || (r.actorName === input.actorName);
    if (!sameActor) return false;
    const diff = Math.abs(nowMs - new Date(r.timestamp).getTime());
    return diff < 3 * 60 * 1000;
  });

  if (recentDuplicate) {
    return recentDuplicate;
  }

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

  // Keep latest 1000 real records
  const updated = [record, ...records].slice(0, 1000);
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
    calls: allLogs.filter((l) => l.category === "Call").length,
    ads: allLogs.filter((l) => l.category === "Advertisement").length,
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
