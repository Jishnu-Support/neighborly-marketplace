import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";
import { readBusinessRecords } from "./businesses";
import { readOrdersFile } from "./orders";
import {
  type MarketplaceNotification,
  type NotificationType,
  type NotificationTargetRole,
  type NotificationAction,
} from "./notifications.shared";

export * from "./notifications.shared";

const notificationsFilePath = resolveStorePath(
  "NEIGHBORLY_NOTIFICATIONS_STORE",
  ".neighborly-notifications.json"
);

export async function readAllNotifications(): Promise<MarketplaceNotification[]> {
  try {
    const raw = await readFile(notificationsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveAllNotifications(
  notifications: MarketplaceNotification[]
): Promise<MarketplaceNotification[]> {
  await mkdir(path.dirname(notificationsFilePath), { recursive: true });
  const temporaryPath = `${notificationsFilePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(notifications, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, notificationsFilePath);
  return notifications;
}

export async function createServerNotification(params: {
  id?: string;
  title: string;
  message: string;
  type?: NotificationType;
  targetRole?: NotificationTargetRole;
  targetIdentity?: string;
  linkText?: string;
  action?: NotificationAction;
}): Promise<MarketplaceNotification> {
  const notif: MarketplaceNotification = {
    id: params.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: params.title,
    message: params.message,
    timestamp: new Date().toISOString(),
    type: params.type || "system",
    read: false,
    targetRole: params.targetRole || "all",
    targetIdentity: params.targetIdentity?.trim() || undefined,
    readBy: [],
    linkText: params.linkText || "View details",
    action: params.action,
  };

  try {
    const existing = await readAllNotifications();
    // Cap stored notifications to latest 300 items
    const updated = [notif, ...existing.filter((n) => n.id !== notif.id)].slice(0, 300);
    await saveAllNotifications(updated);
  } catch (error) {
    console.error("Failed to persist server notification:", error);
  }

  return notif;
}

// Known fake/unreal business names and legacy fake notification IDs to purge permanently
const UNREAL_BUSINESS_KEYWORDS = [
  "tarun motors",
  "velan honda",
  "muneer bakery",
  "reliance digital",
  "samsung experience store",
  "ord-84210",
  "ord-test-1794642165978",
];

const UNREAL_NOTIFICATION_PREFIXES = [
  "notif-sys-renewal-tarun",
  "notif-sys-renewal-velan",
  "notif-sys-adview-tarun",
  "notif-sys-adview-velan",
  "notif-sys-agent-renewal-tarun",
  "notif-sys-agent-renewal-velan",
  "notif-sys-cust-order-placed",
  "notif-sys-cust-suggest-auto",
  "notif-sys-cust-suggest-elec",
];

export async function ensureSystemGeneratedNotifications(): Promise<MarketplaceNotification[]> {
  try {
    const existing = await readAllNotifications();

    // 1. Purge any legacy unreal/fake notifications completely
    const cleanedExisting = existing.filter((n) => {
      if (UNREAL_NOTIFICATION_PREFIXES.includes(n.id)) return false;
      const titleLower = (n.title || "").toLowerCase();
      const messageLower = (n.message || "").toLowerCase();
      const identityLower = (n.targetIdentity || "").toLowerCase();
      for (const fake of UNREAL_BUSINESS_KEYWORDS) {
        if (
          titleLower.includes(fake) ||
          messageLower.includes(fake) ||
          identityLower.includes(fake)
        ) {
          return false;
        }
      }
      return true;
    });

    // 2. Query strictly registered platform data only
    const [businesses, orders] = await Promise.all([
      readBusinessRecords().catch(() => []),
      readOrdersFile().catch(() => []),
    ]);

    const existingIds = new Set(cleanedExisting.map((n) => n.id));
    const dynamicNotifications: MarketplaceNotification[] = [];

    // Process only verified/active businesses registered on our platform
    for (const biz of businesses) {
      if (!biz || !biz.name) continue;
      const bizName = biz.name.trim();
      const bizSlug = (biz.id || bizName).toLowerCase().replace(/[^a-z0-9]/g, "-");

      // A. Business Portal: Subscription renewal & plan status
      const planNotifId = `notif-biz-plan-${bizSlug}`;
      if (!existingIds.has(planNotifId)) {
        dynamicNotifications.push({
          id: planNotifId,
          title: `⏳ Subscription Plan Active: ${bizName}`,
          message: `Your business listing for "${bizName}" is active on Bizearch. Check renewal status, update your product catalog, and monitor customer leads in your Business Portal.`,
          timestamp: biz.createdAt || new Date().toISOString(),
          type: "plan",
          read: false,
          targetRole: "Business",
          targetIdentity: bizName,
          linkText: "Manage Plan",
          action: { type: "portal", payload: "Business", tab: "plans" },
        });
        existingIds.add(planNotifId);
      }

      // B. Business Portal: Ad views & customer impression performance
      const views = (biz.profileViews || 0) + (biz.searchAppearances || 0);
      if (views > 0) {
        const viewsNotifId = `notif-biz-views-${bizSlug}`;
        if (!existingIds.has(viewsNotifId)) {
          dynamicNotifications.push({
            id: viewsNotifId,
            title: `📈 Performance Alert: ${views} Customer Views`,
            message: `Your listing "${bizName}" has received ${views} verified customer impressions on Bizearch!`,
            timestamp: new Date().toISOString(),
            type: "ad",
            read: false,
            targetRole: "Business",
            targetIdentity: bizName,
            linkText: "View Performance",
            action: { type: "portal", payload: "Business", tab: "analytics" },
          });
          existingIds.add(viewsNotifId);
        }
      }

      // C. Agent Portal: Referral subscription renewal & merchant tracking
      const agentTarget = biz.assignedAgentName || biz.agentVerification?.agentName || (biz.agentReferralCode ? "JIT" : null);
      if (agentTarget) {
        const agentNotifId = `notif-agent-renewal-${bizSlug}`;
        if (!existingIds.has(agentNotifId)) {
          dynamicNotifications.push({
            id: agentNotifId,
            title: `⏰ Merchant Listing Active: ${bizName}`,
            message: `Your referred merchant "${bizName}" is active on the platform. Keep in touch with the business owner to ensure smooth renewals and retain recurring benefits.`,
            timestamp: biz.createdAt || new Date().toISOString(),
            type: "agent",
            read: false,
            targetRole: "Agent",
            targetIdentity: agentTarget,
            linkText: "View Referral",
            action: { type: "portal", payload: "Agent", tab: "referrals" },
          });
          existingIds.add(agentNotifId);
        }
      }

      // D. Customer Portal: Genuine smart suggestions based ONLY on registered products & businesses
      if (biz.active !== false && Array.isArray(biz.products) && biz.products.length > 0) {
        const firstProd = biz.products[0];
        const suggestNotifId = `notif-cust-suggest-${bizSlug}`;
        if (!existingIds.has(suggestNotifId)) {
          const area = biz.address?.area || biz.address?.cityTown || "Hosur";
          dynamicNotifications.push({
            id: suggestNotifId,
            title: `💡 Local Suggestion: ${firstProd.name}`,
            message: `Looking for ${firstProd.name}? Available now from verified local business "${bizName}" in ${area}!`,
            timestamp: new Date().toISOString(),
            type: "offer",
            read: false,
            targetRole: "Account",
            targetIdentity: "Customer",
            linkText: `Explore ${bizName}`,
            action: { type: "search", payload: bizName },
          });
          existingIds.add(suggestNotifId);
        }
      }
    }

    // E. Customer Portal: Genuine order status updates for registered businesses
    for (const order of orders) {
      if (!order || !order.id) continue;
      // Do not process orders referencing non-registered or test businesses
      const orderBizLower = (order.businessName || "").toLowerCase();
      if (UNREAL_BUSINESS_KEYWORDS.some((fake) => orderBizLower.includes(fake))) continue;

      const orderNotifId = `notif-order-${order.id}`;
      if (!existingIds.has(orderNotifId)) {
        const statusDisplay = order.status === "placed" ? "Confirmed" : order.status === "cancelled" ? "Cancelled" : order.status.toUpperCase();
        dynamicNotifications.push({
          id: orderNotifId,
          title: `Order #${order.id} ${statusDisplay}`,
          message: `Your order from "${order.businessName}" (Total: ₹${order.totalAmount}) is ${order.status}.`,
          timestamp: order.createdAt || new Date().toISOString(),
          type: "order",
          read: false,
          targetRole: "Account",
          targetIdentity: order.customerPhone || "Customer",
          linkText: "Track Order",
          action: { type: "portal", payload: "Account", tab: "Orders" },
        });
        existingIds.add(orderNotifId);
      }
    }

    const merged = [...cleanedExisting, ...dynamicNotifications];
    if (merged.length !== existing.length || dynamicNotifications.length > 0) {
      await saveAllNotifications(merged);
    }
    return merged;
  } catch (err) {
    console.error("ensureSystemGeneratedNotifications error:", err);
    return [];
  }
}

export async function listNotificationsForUser(
  role?: string,
  identity?: string
): Promise<MarketplaceNotification[]> {
  // Ensure default system renewal, ads, and suggestion notifications are present
  const all = await ensureSystemGeneratedNotifications();
  const cleanRole = role || "Discover";
  const cleanId = (identity || "").trim().toLowerCase();

  return all.filter((n) => {
    // If targetRole is "all", it reaches everyone
    if (!n.targetRole || n.targetRole === "all") return true;

    // Company Admin / Super Admin receives Company notifications and all notifications
    if (cleanRole === "Company") {
      return n.targetRole === "Company";
    }

    // Business role
    if (cleanRole === "Business" && n.targetRole === "Business") {
      if (!n.targetIdentity) return true;
      const target = n.targetIdentity.toLowerCase();
      // Match exact name, substring, or handle default/demo business logins
      if (!cleanId || cleanId === "business" || cleanId.includes("admin")) return true;
      return cleanId === target || cleanId.includes(target) || target.includes(cleanId);
    }

    // Agent role
    if (cleanRole === "Agent" && n.targetRole === "Agent") {
      if (!n.targetIdentity) return true;
      const target = n.targetIdentity.toLowerCase();
      if (!cleanId || cleanId === "agent" || cleanId === "jit" || target === "jit") return true;
      return cleanId === target || cleanId.includes(target) || target.includes(cleanId);
    }

    // Customer Account
    if (cleanRole === "Account" && n.targetRole === "Account") {
      if (!n.targetIdentity) return true;
      const target = n.targetIdentity.toLowerCase();
      if (!cleanId || cleanId === "account" || cleanId === "customer" || target === "customer") return true;
      if (cleanId === target || cleanId.includes(target) || target.includes(cleanId)) return true;
      
      const targetDigits = n.targetIdentity.replace(/\D/g, "");
      const userDigits = cleanId.replace(/\D/g, "");
      if (targetDigits.length >= 7 && userDigits.length >= 7) {
        return userDigits.includes(targetDigits) || targetDigits.includes(userDigits);
      }
      return false;
    }

    // Discover page visitors (can see public suggestions and announcements)
    if (cleanRole === "Discover") {
      return n.type === "offer";
    }

    return false;
  }).map((n) => {
    const isRead = n.read || (cleanId && Array.isArray(n.readBy) && n.readBy.includes(cleanId));
    return {
      ...n,
      read: Boolean(isRead),
    };
  });
}

export async function markNotificationAsRead(
  id: string,
  userIdentity?: string
): Promise<boolean> {
  const all = await readAllNotifications();
  let found = false;
  const cleanId = (userIdentity || "").trim().toLowerCase();

  const updated = all.map((n) => {
    if (n.id === id) {
      found = true;
      const readBy = Array.isArray(n.readBy) ? [...n.readBy] : [];
      if (cleanId && !readBy.includes(cleanId)) {
        readBy.push(cleanId);
      }
      return { ...n, read: true, readBy };
    }
    return n;
  });

  if (found) {
    await saveAllNotifications(updated);
  }
  return found;
}

export async function markAllNotificationsAsReadForUser(
  role?: string,
  identity?: string
): Promise<number> {
  const all = await readAllNotifications();
  const cleanId = (identity || "").trim().toLowerCase();
  let count = 0;

  const userNotifIds = new Set((await listNotificationsForUser(role, identity)).map((n) => n.id));

  const updated = all.map((n) => {
    if (userNotifIds.has(n.id)) {
      count++;
      const readBy = Array.isArray(n.readBy) ? [...n.readBy] : [];
      if (cleanId && !readBy.includes(cleanId)) {
        readBy.push(cleanId);
      }
      return { ...n, read: true, readBy };
    }
    return n;
  });

  if (count > 0) {
    await saveAllNotifications(updated);
  }
  return count;
}

export async function clearNotificationsForUser(
  role?: string,
  identity?: string
): Promise<boolean> {
  const all = await readAllNotifications();
  const userNotifIds = new Set((await listNotificationsForUser(role, identity)).map((n) => n.id));
  const remaining = all.filter((n) => !userNotifIds.has(n.id));
  await saveAllNotifications(remaining);
  return true;
}
