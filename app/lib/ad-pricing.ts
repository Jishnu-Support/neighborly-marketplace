import fs from "node:fs/promises";
import { resolveStorePath } from "./storage-paths";
import { AdFormatPricing, DEFAULT_AD_FORMAT_PRICING } from "./ad-pricing.shared";
import { saveActivityLog } from "./activity-logs";

const storePath = resolveStorePath("NEIGHBORLY_AD_PRICING_STORE", ".neighborly-ad-pricing.json");

export async function readAdPricingRecords(): Promise<Record<string, AdFormatPricing>> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
      return { ...DEFAULT_AD_FORMAT_PRICING, ...parsed };
    }
  } catch {
    // If not found or error, return default
  }
  return { ...DEFAULT_AD_FORMAT_PRICING };
}

export async function writeAdPricingRecords(records: Record<string, AdFormatPricing>): Promise<void> {
  await fs.writeFile(storePath, JSON.stringify(records, null, 2), "utf8");
}

export async function saveAdPricingOption(
  option: AdFormatPricing,
  actorName = "Super Admin"
): Promise<AdFormatPricing> {
  const records = await readAdPricingRecords();
  const formatKey = option.format.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const isUpdate = Boolean(records[formatKey]);

  records[formatKey] = {
    format: formatKey,
    name: option.name.trim(),
    shortName: (option.shortName || option.name).trim(),
    badge: (option.badge || "Ad Format").trim(),
    description: option.description.trim(),
    baseDailyRate: Math.max(1, Number(option.baseDailyRate) || 299),
  };

  await writeAdPricingRecords(records);

  try {
    await saveActivityLog({
      action: isUpdate ? "Ad Pricing Updated" : "Ad Pricing Option Added",
      category: "Advertisement",
      actorRole: "Super Admin",
      actorName,
      details: `${isUpdate ? "Updated" : "Added"} ad format rate card: ${records[formatKey].name} at ₹${records[formatKey].baseDailyRate}/day base rate.`,
      metadata: { format: formatKey, baseDailyRate: records[formatKey].baseDailyRate },
    });
  } catch {}

  return records[formatKey];
}

export async function deleteAdPricingOption(
  formatKey: string,
  actorName = "Super Admin"
): Promise<boolean> {
  const records = await readAdPricingRecords();
  const key = formatKey.trim().toLowerCase();
  if (!records[key]) return false;

  const deleted = records[key];
  delete records[key];
  await writeAdPricingRecords(records);

  try {
    await saveActivityLog({
      action: "Ad Pricing Option Removed",
      category: "Advertisement",
      actorRole: "Super Admin",
      actorName,
      details: `Removed ad format rate card: ${deleted.name} (${key}).`,
      metadata: { format: key, deletedName: deleted.name },
    });
  } catch {}

  return true;
}
