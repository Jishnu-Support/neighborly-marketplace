import fs from "node:fs";
import path from "node:path";

/**
 * Resolves a persistent file storage path.
 * 1. Honors explicit environment variables if configured (e.g. NEIGHBORLY_BUSINESS_STORE).
 * 2. If running inside a Docker container with an attached persistent volume at /app/data
 *    or /var/lib/bizearch/data, automatically stores data there to ensure zero data loss across deployments.
 * 3. Falls back to process.cwd() for local development.
 */
export function resolveStorePath(envVarName: string, defaultFilename: string): string {
  const envVal = process.env[envVarName]?.trim();
  if (envVal) {
    return envVal;
  }

  const persistentDirs = ["/app/data", "/var/lib/bizearch/data"];
  for (const dir of persistentDirs) {
    try {
      if (fs.existsSync(dir)) {
        return path.join(dir, defaultFilename);
      }
    } catch {
      // Ignore and check next
    }
  }

  return path.join(process.cwd(), defaultFilename);
}

function initFileIfNotExists(filePath: string, defaultContent: string): void {
  try {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, defaultContent, "utf8");
    }
  } catch {
    // Graceful fallback
  }
}

export function ensureStoresInitialized(): void {
  try {
    // Super Admin record (admin@bizearch.in / SuperAdmin123!)
    const superAdminRecord = {
      id: "super-admin-bizearch",
      name: "Company Super Admin",
      email: "admin@bizearch.in",
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      salt: "00112233445566778899aabbccddeeff",
      passwordHash: "9d8729034e6821b84867b060b5f57d7bb539855645793cec8482e155fa84953a2130997e514bbc9f125d8aca4519811f2986b078f353470521aad175cf12fd12",
    };

    const adminPath = resolveStorePath("NEIGHBORLY_ADMIN_STORE", ".neighborly-admins.json");
    if (!fs.existsSync(adminPath)) {
      const dir = path.dirname(adminPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(adminPath, JSON.stringify([superAdminRecord], null, 2), "utf8");
    } else {
      try {
        const raw = fs.readFileSync(adminPath, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list) && !list.some((a: { email?: string }) => a.email?.toLowerCase() === "admin@bizearch.in")) {
          list.unshift(superAdminRecord);
          fs.writeFileSync(adminPath, JSON.stringify(list, null, 2), "utf8");
        }
      } catch {
        // Keep existing admin file
      }
    }

    // Only create data files if they do not exist yet, NEVER overwriting existing real data!
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_CUSTOMER_STORE", ".neighborly-customers.json"), "[]");
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_BUSINESS_STORE", ".neighborly-businesses.json"), "[]");
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_AGENT_STORE", ".neighborly-agents.json"), "[]");
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_ACTIVITY_LOGS_STORE", ".neighborly-activity-logs.json"), "[]");
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_AD_BOOKINGS_STORE", ".neighborly-ad-bookings.json"), "[]");
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_TRANSACTIONS_STORE", ".neighborly-transactions.json"), "[]");
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_CUSTOMER_LOCATION_STORE", ".neighborly-customer-locations.json"), "[]");
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_SOS_ALERT_STORE", ".neighborly-sos-alerts.json"), "[]");

    // Clean up any lingering demo / seed records from customer and location stores
    const customerPath = resolveStorePath("NEIGHBORLY_CUSTOMER_STORE", ".neighborly-customers.json");
    if (fs.existsSync(customerPath)) {
      try {
        const raw = fs.readFileSync(customerPath, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((c: { phone?: string; email?: string }) => {
            const phone = (c.phone || "").replace(/\D/g, "");
            const email = (c.email || "").toLowerCase();
            if (phone.includes("9043022219") || phone.includes("9876543210") || phone.includes("9962775630")) return false;
            if (email.includes("@neighborly.demo")) return false;
            return true;
          });
          if (filtered.length !== list.length) {
            fs.writeFileSync(customerPath, JSON.stringify(filtered, null, 2), "utf8");
          }
        }
      } catch {}
    }

    const customerLocPath = resolveStorePath("NEIGHBORLY_CUSTOMER_LOCATION_STORE", ".neighborly-customer-locations.json");
    if (fs.existsSync(customerLocPath)) {
      try {
        const raw = fs.readFileSync(customerLocPath, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((c: { phone?: string; email?: string }) => {
            const phone = (c.phone || "").replace(/\D/g, "");
            const email = (c.email || "").toLowerCase();
            if (phone.includes("9043022219") || phone.includes("9876543210") || phone.includes("9962775630")) return false;
            if (email.includes("@neighborly.demo")) return false;
            return true;
          });
          if (filtered.length !== list.length) {
            fs.writeFileSync(customerLocPath, JSON.stringify(filtered, null, 2), "utf8");
          }
        }
      } catch {}
    }

    // Clean up activity logs: purge all duplicate "Ad viewed:" flood & demo records
    const activityLogsPath = resolveStorePath("NEIGHBORLY_ACTIVITY_LOGS_STORE", ".neighborly-activity-logs.json");
    if (fs.existsSync(activityLogsPath)) {
      try {
        const raw = fs.readFileSync(activityLogsPath, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const demoPhones = ["9043022219", "9962773219", "9962775630", "9876543210", "9443211223", "9443287654", "9900112233", "9900122334"];
          const demoNames = ["Murali", "Keerthana B", "G Venkatesan Sir", "Dharshan Ramesh", "Radha Krishnan", "Agent Partner", "Karthik Raj"];
          const filtered = list.filter((r: { id?: string; action?: string; details?: string; actorName?: string; actorPhone?: string }) => {
            if (!r || !r.action) return false;
            if (r.action.startsWith("Ad viewed:")) return false;
            if (r.details?.includes("Advertisement impression on")) return false;
            if (r.id?.startsWith("act-seed-")) return false;
            if (r.actorName && demoNames.includes(r.actorName)) return false;
            if (r.actorPhone) {
              const clean = r.actorPhone.replace(/\D/g, "");
              if (demoPhones.some((p) => clean.includes(p))) return false;
            }
            return true;
          });
          if (filtered.length !== list.length) {
            fs.writeFileSync(activityLogsPath, JSON.stringify(filtered, null, 2), "utf8");
          }
        }
      } catch {}
    }

    // Clean up ad bookings: purge old demo sample bookings
    const adBookingsPath = resolveStorePath("NEIGHBORLY_AD_BOOKINGS_STORE", ".neighborly-ad-bookings.json");
    if (fs.existsSync(adBookingsPath)) {
      try {
        const raw = fs.readFileSync(adBookingsPath, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((b: { id?: string; businessName?: string }) => {
            if (b.id === "AD-REQ-101" || b.id === "AD-REQ-102" || b.id === "AD-REQ-103") return false;
            if (b.businessName?.includes("Sri Krishna Sweets") || b.businessName?.includes("Amman Motors")) return false;
            return true;
          });
          if (filtered.length !== list.length) {
            fs.writeFileSync(adBookingsPath, JSON.stringify(filtered, null, 2), "utf8");
          }
        }
      } catch {}
    }
  } catch {
    // Graceful fallback
  }
}

// Automatically ensure stores exist without wiping real data
try {
  ensureStoresInitialized();
} catch {}

