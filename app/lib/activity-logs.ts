import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";

export type ActivityLogCategory =
  | "Approval"
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
  | "Review"
  | "Removal Request"
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

// Activity logs are stored on disk for 6 months (180 days) until an administrator manually clears them
export const SIX_MONTHS_RETENTION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days retention (6 calendar months)
export const ONE_YEAR_RETENTION_MS = SIX_MONTHS_RETENTION_MS; // Backwards-compatible alias

export function getDefaultSeedActivityLogs(): ActivityLogRecord[] {
  // All demo activity records removed per real-world production clean state.
  return [];
}

export function sanitizeActivityLogs(records: ActivityLogRecord[]): { logs: ActivityLogRecord[]; changed: boolean } {
  if (!Array.isArray(records) || records.length === 0) {
    return { logs: [], changed: false };
  }

  const cutoff = Date.now() - SIX_MONTHS_RETENTION_MS;

  // Retain all genuine activity logs within the 6-month retention window
  const valid = records.filter((r) => {
    if (!r || !r.action) return false;
    // Strip artificial seed IDs
    if (r.id && r.id.startsWith("act-seed-")) return false;
    // Check 6-month retention
    const timeMs = new Date(r.timestamp).getTime();
    if (isNaN(timeMs) || timeMs < cutoff) return false;
    return true;
  });

  // Light deduplication: prevent identical rapid microsecond duplicate spam
  const deduped: ActivityLogRecord[] = [];
  const seenSeconds = new Set<string>();

  for (const r of valid) {
    // Sanitize any legacy [object Object] address strings if present
    if (r.details && r.details.includes("[object Object]")) {
      r.details = r.details.replace("[object Object]", r.locality || "Registered Storefront");
    }

    const timeMs = new Date(r.timestamp).getTime();
    // 10-second deduplication bucket per action and actor
    const bucket = Math.floor(timeMs / 10000);
    const actorKey = r.actorPhone || r.actorName || "anon";
    const key = `${r.action}:::${actorKey}:::${bucket}`;

    if (seenSeconds.has(key)) {
      continue;
    }
    seenSeconds.add(key);
    deduped.push(r);
  }

  // Keep full 6-month history (up to 100,000 events)
  return { logs: deduped.slice(0, 100000), changed: deduped.length !== records.length };
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

export async function clearAllActivityLogs(): Promise<ActivityLogRecord[]> {
  await writeActivityLogs([]);
  return [];
}

export async function clearOlderActivityLogs(days = 180): Promise<{ removed: number; remaining: number }> {
  const records = await readActivityLogs();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const kept = records.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return !isNaN(t) && t >= cutoff;
  });
  await writeActivityLogs(kept);
  return { removed: records.length - kept.length, remaining: kept.length };
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

  // Guard against rapid duplicate clicks (within 10 seconds for exact identical action + actor)
  const recentDuplicate = records.slice(0, 10).find((r) => {
    if (r.action !== input.action) return false;
    const sameActor = (r.actorPhone && r.actorPhone === input.actorPhone) || (r.actorName === input.actorName);
    if (!sameActor) return false;
    const diff = Math.abs(nowMs - new Date(r.timestamp).getTime());
    return diff < 10 * 1000;
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

  // Keep full 6-month history (records within 180 days, up to 100,000 items)
  const cutoff = nowMs - SIX_MONTHS_RETENTION_MS;
  const retainedRecords = records.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return !isNaN(t) && t >= cutoff;
  });
  const updated = [record, ...retainedRecords].slice(0, 100000);

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
