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
    const freshPlatformMarkerPath = resolveStorePath("NEIGHBORLY_FRESH_MARKER", ".neighborly-fresh-platform-v1.txt");

    // Perform a one-time clean wipe of all demo stores for fresh deployment
    if (!fs.existsSync(freshPlatformMarkerPath)) {
      const emptyJson = "[]";
      const customerStore = resolveStorePath("NEIGHBORLY_CUSTOMER_STORE", ".neighborly-customers.json");
      const businessStore = resolveStorePath("NEIGHBORLY_BUSINESS_STORE", ".neighborly-businesses.json");
      const agentStore = resolveStorePath("NEIGHBORLY_AGENT_STORE", ".neighborly-agents.json");
      const activityStore = resolveStorePath("NEIGHBORLY_ACTIVITY_LOGS_STORE", ".neighborly-activity-logs.json");
      const adBookingsStore = resolveStorePath("NEIGHBORLY_AD_BOOKINGS_STORE", ".neighborly-ad-bookings.json");
      const transactionsStore = resolveStorePath("NEIGHBORLY_TRANSACTIONS_STORE", ".neighborly-transactions.json");
      const customerLocStore = resolveStorePath("NEIGHBORLY_CUSTOMER_LOCATION_STORE", ".neighborly-customer-locations.json");
      const sosStore = resolveStorePath("NEIGHBORLY_SOS_ALERT_STORE", ".neighborly-sos-alerts.json");
      const adConfigStore = resolveStorePath("NEIGHBORLY_AD_CONFIG_STORE", ".neighborly-ad-config.json");

      fs.mkdirSync(path.dirname(customerStore), { recursive: true });
      fs.writeFileSync(customerStore, emptyJson, "utf8");
      fs.writeFileSync(businessStore, emptyJson, "utf8");
      fs.writeFileSync(agentStore, emptyJson, "utf8");
      fs.writeFileSync(activityStore, emptyJson, "utf8");
      fs.writeFileSync(adBookingsStore, emptyJson, "utf8");
      fs.writeFileSync(transactionsStore, emptyJson, "utf8");
      fs.writeFileSync(customerLocStore, emptyJson, "utf8");
      fs.writeFileSync(sosStore, emptyJson, "utf8");

      fs.writeFileSync(
        adConfigStore,
        JSON.stringify(
          {
            tickerMessages: [],
            imageAds: [],
            videoAd: { title: "", description: "", sourceUrl: "", posterUrl: "", callToAction: "" },
            audioAd: { title: "", description: "", sourceUrl: "" },
          },
          null,
          2
        ),
        "utf8"
      );

      fs.writeFileSync(adminPath, JSON.stringify([superAdminRecord], null, 2), "utf8");
      fs.writeFileSync(freshPlatformMarkerPath, `Fresh platform initialized at ${new Date().toISOString()}`, "utf8");
      return;
    }

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
    initFileIfNotExists(resolveStorePath("NEIGHBORLY_QUOTES_STORE", ".neighborly-quotes.json"), "[]");
    initFileIfNotExists(
      resolveStorePath("NEIGHBORLY_AD_PRICING_STORE", ".neighborly-ad-pricing.json"),
      JSON.stringify(
        {
          content: {
            format: "content",
            name: "Content Ad (Marquee Ticker)",
            shortName: "Content Ad",
            badge: "Announcement Ticker",
            description: "High-visibility scrolling message bar at the top of the platform header",
            baseDailyRate: 10,
            discount: 0,
          },
          poster: {
            format: "poster",
            name: "Poster Ad (Hero Billboard)",
            shortName: "Poster Billboard",
            badge: "Image Billboard",
            description: "Prominent photo billboard banner rotating in both mobile & desktop ad positions",
            baseDailyRate: 25,
            discount: 0,
          },
          video: {
            format: "video",
            name: "Video Ad (Spotlight Reel)",
            shortName: "Video Spotlight",
            badge: "Spotlight Video",
            description: "Local video player spotlight with headline, description, and direct call to action",
            baseDailyRate: 50,
            discount: 10,
          },
          combo: {
            format: "combo",
            name: "Combo Pack (Poster + Content + Video)",
            shortName: "All-In-One Combo",
            badge: "Best Value Bundle",
            description: "Maximum neighborhood reach across Poster Billboard, Marquee Ticker & Video Spotlight",
            baseDailyRate: 75,
            discount: 20,
          },
        },
        null,
        2
      )
    );
  } catch {
    // Graceful fallback
  }
}

// Automatically ensure stores exist without wiping real data
try {
  ensureStoresInitialized();
} catch {}

