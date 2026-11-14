import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";
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

// Built-in system seeds for business renewals, ad statistics, agent referral deadlines, and customer search suggestions
const MANDATORY_SYSTEM_NOTIFICATIONS: MarketplaceNotification[] = [
  // 1. Business Portal - Subscription Renewal Notice
  {
    id: "notif-sys-renewal-tarun",
    title: "⏳ Subscription Renewal Notice: Pro Plan",
    message: "Your Pro Annual membership for Tarun Motors Hero expires in 5 days (19/11/2026). Renew now to preserve #1 top ranking in Automobiles, Verified Shield, and priority direct booking leads.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: "plan",
    read: false,
    targetRole: "Business",
    targetIdentity: "Tarun Motors Hero",
    linkText: "Renew Plan Now",
    action: { type: "portal", payload: "Business", tab: "plans" },
  },
  {
    id: "notif-sys-renewal-velan",
    title: "⏳ Subscription Renewal Deadline: Growth Plan",
    message: "Velan Honda's Growth subscription renewal deadline is in 8 days. Renew on time to keep active customer booking calls, WhatsApp lead tracking, and catalog visibility.",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    type: "plan",
    read: false,
    targetRole: "Business",
    targetIdentity: "Velan Honda",
    linkText: "Renew Plan Now",
    action: { type: "portal", payload: "Business", tab: "plans" },
  },
  // 2. Business Portal - Ad Views & Performance Details
  {
    id: "notif-sys-adview-tarun",
    title: "📈 Ad Performance Alert: 485+ Impressions",
    message: "Your Bizearch Discover Video Spotlight ad for Tarun Motors Hero achieved 485 verified views and 42 customer dialer / WhatsApp leads this week across Hosur!",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    type: "ad",
    read: false,
    targetRole: "Business",
    targetIdentity: "Tarun Motors Hero",
    linkText: "View Ad Performance",
    action: { type: "portal", payload: "Business", tab: "ads" },
  },
  {
    id: "notif-sys-adview-velan",
    title: "📊 Spotlight Banner Performance: 310 Views",
    message: "Your rotating banner ad on the Bizearch Discover page had 310 views with a 14% direct click-to-WhatsApp conversion rate this week.",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    type: "ad",
    read: false,
    targetRole: "Business",
    targetIdentity: "Velan Honda",
    linkText: "View Ad Analytics",
    action: { type: "portal", payload: "Business", tab: "ads" },
  },
  // 3. Agent Portal - Referral Subscription Renewal Deadlines
  {
    id: "notif-sys-agent-renewal-tarun",
    title: "⏰ Referral Renewal Deadline: Tarun Motors Hero",
    message: "Subscription for your referred merchant 'Tarun Motors Hero' expires in 5 days. Follow up with the business owner to assist their renewal and secure your 20% recurring commission (₹600)!",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    type: "agent",
    read: false,
    targetRole: "Agent",
    targetIdentity: "JIT",
    linkText: "View Referral",
    action: { type: "portal", payload: "Agent", tab: "referrals" },
  },
  {
    id: "notif-sys-agent-renewal-velan",
    title: "⏰ Referral Renewal Deadline: Velan Honda",
    message: "Subscription for your referred business 'Velan Honda' has a renewal deadline in 8 days. Ensure plan continuity to retain your active monthly referral bonus!",
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    type: "agent",
    read: false,
    targetRole: "Agent",
    targetIdentity: "JIT",
    linkText: "View Referral",
    action: { type: "portal", payload: "Agent", tab: "referrals" },
  },
  // 4. Customer Portal - Order Details & Suggestions Related to Search
  {
    id: "notif-sys-cust-order-placed",
    title: "✅ Order #ORD-84210 Confirmed",
    message: "Your order from Muneer Bakery (Plum Cake & Butter Cookies) has been accepted and is being freshly prepared 👨‍🍳. Estimated delivery: 25-30 mins.",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    type: "order",
    read: false,
    targetRole: "Account",
    targetIdentity: "Customer",
    linkText: "Track Order",
    action: { type: "portal", payload: "Account", tab: "Orders" },
  },
  {
    id: "notif-sys-cust-suggest-auto",
    title: "💡 Smart Suggestion: Verified Two-Wheeler Care",
    message: "Looking for bike service or test rides in Hosur? Velan Honda (Denkanikotta Rd) and Tarun Motors Hero (Mathigiri) offer 4.6★ service packages with instant appointment booking!",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: "offer",
    read: false,
    targetRole: "Account",
    targetIdentity: "Customer",
    linkText: "Explore Two-Wheeler Services",
    action: { type: "search", payload: "service" },
  },
  {
    id: "notif-sys-cust-suggest-elec",
    title: "💡 Smart Suggestion: Top Electronics Deals",
    message: "Searching for appliances or smartphones? Reliance Digital and Samsung Experience Store on Bagalur Road offer genuine warranties, 0% EMI, and doorstep setup in Hosur.",
    timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
    type: "offer",
    read: false,
    targetRole: "Account",
    targetIdentity: "Customer",
    linkText: "Explore Electronics",
    action: { type: "search", payload: "electronics" },
  },
];

export async function ensureSystemGeneratedNotifications(): Promise<MarketplaceNotification[]> {
  try {
    const existing = await readAllNotifications();
    const existingIds = new Set(existing.map((n) => n.id));
    const toAdd = MANDATORY_SYSTEM_NOTIFICATIONS.filter((sn) => !existingIds.has(sn.id));

    if (toAdd.length > 0) {
      const merged = [...existing, ...toAdd];
      await saveAllNotifications(merged);
      return merged;
    }
    return existing;
  } catch {
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
