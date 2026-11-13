export type NotificationType =
  | "order"
  | "enquiry"
  | "agent"
  | "business"
  | "ad"
  | "sos"
  | "system"
  | "offer"
  | "favorite"
  | "plan";

export type NotificationTargetRole = "all" | "Business" | "Company" | "Agent" | "Account";

export interface NotificationAction {
  type: "search" | "business" | "role" | "category" | "sos" | "order" | "portal";
  payload: string;
  tab?: string;
}

export interface MarketplaceNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string or human string
  type: NotificationType;
  read: boolean;
  targetRole?: NotificationTargetRole;
  targetIdentity?: string; // businessName, customerPhone, or agentId
  readBy?: string[];
  linkText?: string;
  action?: NotificationAction;
}
