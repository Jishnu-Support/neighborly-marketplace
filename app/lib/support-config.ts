import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { saveActivityLog } from "./activity-logs";
import { type SupportConfig, defaultSupportConfig } from "./support-config.shared";
export { type SupportConfig, defaultSupportConfig };

const supportConfigStorePath =
  process.env.NEIGHBORLY_SUPPORT_CONFIG_STORE ||
  path.join(process.cwd(), ".neighborly-support-config.json");

export async function readSupportConfig(): Promise<SupportConfig> {
  try {
    const raw = await readFile(supportConfigStorePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SupportConfig>;
    if (parsed && typeof parsed.phone === "string") {
      return {
        ...defaultSupportConfig,
        ...parsed,
      };
    }
    return defaultSupportConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Error reading support config:", error);
    }
    return defaultSupportConfig;
  }
}

export async function updateSupportConfig(
  patch: Partial<SupportConfig>,
  actorName: string,
  actorRole: "Admin" | "Super Admin" = "Admin"
): Promise<SupportConfig> {
  const current = await readSupportConfig();
  const updated: SupportConfig = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy: actorName || "Company Admin",
  };

  await mkdir(path.dirname(supportConfigStorePath), { recursive: true });
  const temporaryPath = `${supportConfigStorePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(updated, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, supportConfigStorePath);

  // Record audit activity log for customer care updates
  try {
    await saveActivityLog({
      action: `Customer Care Updated: ${updated.phone}`,
      category: "Admin",
      actorName: actorName || "Company Admin",
      actorRole,
      locality: "Hosur",
      details: `Customer care phone updated to ${updated.phone}. Hours: ${updated.hours}. Email: ${updated.email}.`,
      metadata: {
        previousPhone: current.phone,
        newPhone: updated.phone,
        hours: updated.hours,
        email: updated.email,
      },
    });
  } catch (err) {
    console.error("Failed to log support update activity:", err);
  }

  return updated;
}
