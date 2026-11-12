import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { saveActivityLog } from "./activity-logs";
import {
  type SupportConfig,
  type EmergencyNumberItem,
  defaultSupportConfig,
  defaultEmergencyNumbers,
} from "./support-config.shared";
import { resolveStorePath } from "./storage-paths";
export {
  type SupportConfig,
  type EmergencyNumberItem,
  defaultSupportConfig,
  defaultEmergencyNumbers,
};

const supportConfigStorePath = resolveStorePath("NEIGHBORLY_SUPPORT_CONFIG_STORE", ".neighborly-support-config.json");

export async function readSupportConfig(): Promise<SupportConfig> {
  try {
    const raw = await readFile(supportConfigStorePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SupportConfig>;
    if (parsed && typeof parsed.phone === "string") {
      return {
        ...defaultSupportConfig,
        ...parsed,
        emergencyNumbers: Array.isArray(parsed.emergencyNumbers) && parsed.emergencyNumbers.length > 0
          ? parsed.emergencyNumbers
          : defaultEmergencyNumbers,
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
    emergencyNumbers: patch.emergencyNumbers !== undefined
      ? patch.emergencyNumbers
      : (current.emergencyNumbers || defaultEmergencyNumbers),
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

  // Record audit activity log for customer care and emergency numbers updates
  try {
    const isEmergencyUpdate = Boolean(patch.emergencyNumbers);
    await saveActivityLog({
      action: isEmergencyUpdate
        ? `Emergency Numbers Updated: ${updated.emergencyNumbers?.length || 0} active contacts`
        : `Customer Care Updated: ${updated.phone}`,
      category: "Admin",
      actorName: actorName || "Company Admin",
      actorRole,
      locality: "Hosur",
      details: isEmergencyUpdate
        ? `Hosur Emergency Response Directory updated by ${actorRole}. Total ${updated.emergencyNumbers?.length || 0} numbers configured.`
        : `Customer care phone updated to ${updated.phone}. Hours: ${updated.hours}. Email: ${updated.email}.`,
      metadata: {
        previousPhone: current.phone,
        newPhone: updated.phone,
        hours: updated.hours,
        email: updated.email,
        emergencyNumbersCount: updated.emergencyNumbers?.length,
      },
    });
  } catch (err) {
    console.error("Failed to log support update activity:", err);
  }

  return updated;
}
