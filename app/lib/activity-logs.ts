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

export async function readActivityLogs(): Promise<ActivityLogRecord[]> {
  try {
    const raw = await readFile(activityLogsStorePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as ActivityLogRecord[];
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    return [];
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

  // Keep latest 500 real records
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
