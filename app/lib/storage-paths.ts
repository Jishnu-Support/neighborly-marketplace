import fs from "node:fs";
import path from "node:path";

/**
 * Resolves a persistent file storage path.
 * 1. Honors explicit environment variables if configured (e.g. NEIGHBORLY_BUSINESS_STORE).
 * 2. If running inside a Docker container with an attached persistent volume at /app/data,
 *    automatically stores data in /app/data to ensure zero data loss across deployments.
 * 3. Falls back to process.cwd() for local development.
 */
export function resolveStorePath(envVarName: string, defaultFilename: string): string {
  const envVal = process.env[envVarName]?.trim();
  if (envVal) {
    return envVal;
  }

  const dockerPersistentDir = "/app/data";
  try {
    if (fs.existsSync(dockerPersistentDir)) {
      return path.join(dockerPersistentDir, defaultFilename);
    }
  } catch {
    // Ignore and fall back to local cwd
  }

  return path.join(process.cwd(), defaultFilename);
}

const CLEAN_VERSION = "2026-11-05-super-admin-only";

export function ensureStoresCleaned(): void {
  const versionPath = resolveStorePath("NEIGHBORLY_VERSION_STORE", ".neighborly-data-version.txt");
  try {
    const current = fs.existsSync(versionPath) ? fs.readFileSync(versionPath, "utf8").trim() : "";
    if (current === CLEAN_VERSION) {
      return;
    }

    const dir = path.dirname(versionPath);
    fs.mkdirSync(dir, { recursive: true });

    // Super Admin record (admin@bizearch.in / SuperAdmin123!)
    const superAdminRecord = [
      {
        id: "super-admin-bizearch",
        name: "Company Super Admin",
        email: "admin@bizearch.in",
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        salt: "00112233445566778899aabbccddeeff",
        passwordHash: "9d8729034e6821b84867b060b5f57d7bb539855645793cec8482e155fa84953a2130997e514bbc9f125d8aca4519811f2986b078f353470521aad175cf12fd12",
      },
    ];

    fs.writeFileSync(resolveStorePath("NEIGHBORLY_ADMIN_STORE", ".neighborly-admins.json"), JSON.stringify(superAdminRecord, null, 2), "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_CUSTOMER_STORE", ".neighborly-customers.json"), "[]", "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_BUSINESS_STORE", ".neighborly-businesses.json"), "[]", "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_AGENT_STORE", ".neighborly-agents.json"), "[]", "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_ACTIVITY_LOGS_STORE", ".neighborly-activity-logs.json"), "[]", "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_AD_BOOKINGS_STORE", ".neighborly-ad-bookings.json"), "[]", "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_TRANSACTIONS_STORE", ".neighborly-transactions.json"), "[]", "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_CUSTOMER_LOCATION_STORE", ".neighborly-customer-locations.json"), "[]", "utf8");
    fs.writeFileSync(resolveStorePath("NEIGHBORLY_SOS_ALERT_STORE", ".neighborly-sos-alerts.json"), "[]", "utf8");

    fs.writeFileSync(versionPath, CLEAN_VERSION, "utf8");
  } catch {
    // Graceful fallback
  }
}

// Automatically ensure clean state on startup
try {
  ensureStoresCleaned();
} catch {}

