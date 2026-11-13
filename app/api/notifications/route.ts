import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import {
  createServerNotification,
  listNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsReadForUser,
  clearNotificationsForUser,
  type NotificationType,
  type NotificationTargetRole,
} from "@/app/lib/notifications";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const url = new URL(request.url);
    const queryRole = url.searchParams.get("role") || session?.role || "Discover";
    const queryIdentity = url.searchParams.get("identity") || session?.identity || "";

    const notifications = await listNotificationsForUser(queryRole, queryIdentity);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json(
      {
        notifications,
        unreadCount,
        count: notifications.length,
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { headers: noStoreHeaders });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      message?: string;
      type?: NotificationType;
      targetRole?: NotificationTargetRole;
      targetIdentity?: string;
      linkText?: string;
      action?: {
        type: "search" | "business" | "role" | "category" | "sos" | "order" | "portal";
        payload: string;
        tab?: string;
      };
    };

    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: "Notification title and message are required." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const created = await createServerNotification({
      title: body.title,
      message: body.message,
      type: body.type,
      targetRole: body.targetRole,
      targetIdentity: body.targetIdentity,
      linkText: body.linkText,
      action: body.action,
    });

    return NextResponse.json({ success: true, notification: created }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch notification." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const body = (await request.json()) as {
      id?: string;
      all?: boolean;
      role?: string;
      identity?: string;
    };

    const effectiveRole = body.role || session?.role || "Discover";
    const effectiveIdentity = body.identity || session?.identity || "";

    if (body.all) {
      const count = await markAllNotificationsAsReadForUser(effectiveRole, effectiveIdentity);
      return NextResponse.json({ success: true, count }, { headers: noStoreHeaders });
    }

    if (body.id) {
      const ok = await markNotificationAsRead(body.id, effectiveIdentity);
      return NextResponse.json({ success: ok }, { headers: noStoreHeaders });
    }

    return NextResponse.json({ error: "Missing id or all: true flag." }, { status: 400, headers: noStoreHeaders });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to update notification status." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const url = new URL(request.url);
    const role = url.searchParams.get("role") || session?.role || "Discover";
    const identity = url.searchParams.get("identity") || session?.identity || "";

    await clearNotificationsForUser(role, identity);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
