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
  title: string;
  message: string;
  type?: NotificationType;
  targetRole?: NotificationTargetRole;
  targetIdentity?: string;
  linkText?: string;
  action?: NotificationAction;
}): Promise<MarketplaceNotification> {
  const notif: MarketplaceNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    // Cap stored notifications to the latest 250 items
    const updated = [notif, ...existing].slice(0, 250);
    await saveAllNotifications(updated);
  } catch (error) {
    console.error("Failed to persist server notification:", error);
  }

  return notif;
}

export async function listNotificationsForUser(
  role?: string,
  identity?: string
): Promise<MarketplaceNotification[]> {
  const all = await readAllNotifications();
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
      return cleanId === target || cleanId.includes(target) || target.includes(cleanId);
    }

    // Agent role
    if (cleanRole === "Agent" && n.targetRole === "Agent") {
      if (!n.targetIdentity) return true;
      const target = n.targetIdentity.toLowerCase();
      return cleanId === target || cleanId.includes(target) || target.includes(cleanId);
    }

    // Customer Account
    if (cleanRole === "Account" && n.targetRole === "Account") {
      if (!n.targetIdentity) return true;
      const target = n.targetIdentity.replace(/\D/g, "");
      const userDigits = cleanId.replace(/\D/g, "");
      return userDigits.length >= 7 && (userDigits.includes(target) || target.includes(userDigits));
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
