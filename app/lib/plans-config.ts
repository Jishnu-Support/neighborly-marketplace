import fs from "node:fs/promises";
import { resolveStorePath } from "./storage-paths";
import { SubscriptionPlan, DEFAULT_SUBSCRIPTION_PLANS } from "./plans-config.shared";
import { saveActivityLog } from "./activity-logs";

const storePath = resolveStorePath("NEIGHBORLY_PLANS_STORE", ".neighborly-plans.json");

export async function readSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Return default if error or file not found
  }
  return [...DEFAULT_SUBSCRIPTION_PLANS];
}

export async function writeSubscriptionPlans(plans: SubscriptionPlan[]): Promise<void> {
  await fs.writeFile(storePath, JSON.stringify(plans, null, 2), "utf8");
}

export async function saveSubscriptionPlan(
  plan: SubscriptionPlan,
  actorName = "Super Admin"
): Promise<SubscriptionPlan> {
  const plans = await readSubscriptionPlans();
  const planId = plan.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const index = plans.findIndex((p) => p.id === planId);
  const isUpdate = index !== -1;

  const newPlan: SubscriptionPlan = {
    id: planId,
    name: plan.name.trim(),
    monthlyPrice: Math.max(0, Number(plan.monthlyPrice) || 499),
    yearlyPrice: Math.max(0, Number(plan.yearlyPrice) || Math.round(Number(plan.monthlyPrice) * 9.6)),
    tagline: (plan.tagline || "").trim(),
    desc: (plan.desc || "").trim(),
    perks: Array.isArray(plan.perks) ? plan.perks.filter(Boolean) : [],
    isPopular: Boolean(plan.isPopular),
    badge: plan.badge?.trim() || (plan.isPopular ? "MOST POPULAR" : undefined),
    enabled: plan.enabled !== false,
  };

  if (isUpdate) {
    plans[index] = newPlan;
  } else {
    plans.push(newPlan);
  }

  await writeSubscriptionPlans(plans);

  try {
    await saveActivityLog({
      action: isUpdate ? "Subscription Plan Updated" : "Subscription Plan Added",
      category: "Admin",
      actorRole: "Super Admin",
      actorName,
      details: `${isUpdate ? "Updated" : "Added"} membership plan: ${newPlan.name} at ₹${newPlan.monthlyPrice}/month (₹${newPlan.yearlyPrice}/year).`,
      metadata: { planId, monthlyPrice: newPlan.monthlyPrice, yearlyPrice: newPlan.yearlyPrice },
    });
  } catch {}

  return newPlan;
}

export async function deleteSubscriptionPlan(
  planId: string,
  actorName = "Super Admin"
): Promise<boolean> {
  const plans = await readSubscriptionPlans();
  const id = planId.trim().toLowerCase();
  const index = plans.findIndex((p) => p.id === id);
  if (index === -1) return false;

  const deleted = plans.splice(index, 1)[0];
  await writeSubscriptionPlans(plans);

  try {
    await saveActivityLog({
      action: "Subscription Plan Removed",
      category: "Admin",
      actorRole: "Super Admin",
      actorName,
      details: `Removed subscription plan: ${deleted.name} (${id}).`,
      metadata: { planId: id, name: deleted.name },
    });
  } catch {}

  return true;
}
