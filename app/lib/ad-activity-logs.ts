import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";

export type AdActivityType =
  | "Booking"
  | "Payment"
  | "Approval"
  | "Rejection"
  | "Impression"
  | "Click"
  | "Update"
  | "General";

export interface AdActivityLogRecord {
  id: string;
  adBookingId?: string;
  campaignTitle: string;
  businessName: string;
  action: string;
  type: AdActivityType;
  surface?: string;
  actorName: string;
  actorPhone?: string;
  actorRole: string;
  locality?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type NewAdActivityLog = Omit<AdActivityLogRecord, "id" | "timestamp"> & {
  timestamp?: string;
};

export const AD_LOG_SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000; // 180 days (6 months) retention
export const AD_LOG_ONE_YEAR_MS = AD_LOG_SIX_MONTHS_MS;

const adActivityLogsStorePath = resolveStorePath(
  "NEIGHBORLY_AD_ACTIVITY_LOGS_STORE",
  ".neighborly-ad-activity-logs.json"
);

export async function readAdActivityLogs(): Promise<AdActivityLogRecord[]> {
  try {
    const raw = await readFile(adActivityLogsStorePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const cutoff = Date.now() - AD_LOG_SIX_MONTHS_MS;
      // Retain 6 months of records
      const valid = (parsed as AdActivityLogRecord[]).filter((r) => {
        if (!r || !r.action) return false;
        const t = new Date(r.timestamp).getTime();
        return !isNaN(t) && t >= cutoff;
      });
      return valid;
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    return [];
  }
}

async function writeAdActivityLogs(records: AdActivityLogRecord[]): Promise<void> {
  await mkdir(path.dirname(adActivityLogsStorePath), { recursive: true });
  const temporaryPath = `${adActivityLogsStorePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(records, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, adActivityLogsStorePath);
}

export async function saveAdActivityLog(input: NewAdActivityLog): Promise<AdActivityLogRecord> {
  const records = await readAdActivityLogs();
  const nowMs = Date.now();

  // Guard against rapid duplicate impressions/clicks from same actor within 5 seconds
  const recentDuplicate = records.slice(0, 10).find((r) => {
    if (r.action !== input.action || r.type !== input.type) return false;
    const sameAd = r.adBookingId === input.adBookingId || r.campaignTitle === input.campaignTitle;
    if (!sameAd) return false;
    const sameActor = (r.actorPhone && r.actorPhone === input.actorPhone) || r.actorName === input.actorName;
    if (!sameActor) return false;
    const diff = Math.abs(nowMs - new Date(r.timestamp).getTime());
    return diff < 5 * 1000;
  });

  if (recentDuplicate) {
    return recentDuplicate;
  }

  const record: AdActivityLogRecord = {
    id: `adact-${Date.now()}-${randomUUID().slice(0, 8)}`,
    adBookingId: input.adBookingId,
    campaignTitle: input.campaignTitle || "Advertisement Campaign",
    businessName: input.businessName || "Local Business",
    action: input.action,
    type: input.type || "General",
    surface: input.surface || "Mobile & Desktop Banner",
    actorName: input.actorName || "Shopper / User",
    actorPhone: input.actorPhone,
    actorRole: input.actorRole || "Customer",
    locality: input.locality || "Hosur",
    details: input.details,
    metadata: input.metadata,
    timestamp: input.timestamp || new Date().toISOString(),
  };

  const cutoff = nowMs - AD_LOG_SIX_MONTHS_MS;
  const retained = records.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return !isNaN(t) && t >= cutoff;
  });

  const updated = [record, ...retained].slice(0, 100000);
  try {
    await writeAdActivityLogs(updated);
  } catch {
    // Graceful fallback
  }
  return record;
}

export async function clearAllAdActivityLogs(): Promise<void> {
  await writeAdActivityLogs([]);
}

export async function listAdActivityLogs(filter?: {
  type?: string;
  surface?: string;
  query?: string;
  limit?: number;
}): Promise<{ logs: AdActivityLogRecord[]; stats: Record<string, number> }> {
  const allLogs = await readAdActivityLogs();

  const stats = {
    total: allLogs.length,
    bookings: allLogs.filter((l) => l.type === "Booking").length,
    payments: allLogs.filter((l) => l.type === "Payment").length,
    approvals: allLogs.filter((l) => l.type === "Approval").length,
    rejections: allLogs.filter((l) => l.type === "Rejection").length,
    impressions: allLogs.filter((l) => l.type === "Impression").length,
    clicks: allLogs.filter((l) => l.type === "Click").length,
  };

  let filtered = allLogs;

  if (filter?.type && filter.type !== "All") {
    filtered = filtered.filter((l) => l.type.toLowerCase() === filter.type?.toLowerCase());
  }

  if (filter?.surface && filter.surface !== "All") {
    filtered = filtered.filter((l) => l.surface?.toLowerCase().includes(filter.surface!.toLowerCase()));
  }

  if (filter?.query && filter.query.trim()) {
    const q = filter.query.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.campaignTitle.toLowerCase().includes(q) ||
        l.businessName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        (l.actorPhone && l.actorPhone.includes(q)) ||
        (l.locality && l.locality.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q))
    );
  }

  if (filter?.limit && filter.limit > 0) {
    filtered = filtered.slice(0, filter.limit);
  }

  return { logs: filtered, stats };
}
