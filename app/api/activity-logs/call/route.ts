import { NextResponse } from "next/server";
import { saveActivityLog, ActivityActorRole } from "@/app/lib/activity-logs";
import { createServerNotification } from "@/app/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      targetName?: string;
      targetPhone?: string;
      targetType?: "Business" | "Customer Care" | "Emergency" | "Customer";
      callerName?: string;
      callerPhone?: string;
      callerRole?: string;
      locality?: string;
      businessName?: string;
      businessId?: string;
    };

    const targetName = body.targetName?.trim() || "Local Business";
    const targetPhone = body.targetPhone?.trim() || "";
    const targetType = body.targetType || "Business";
    const callerName = body.callerName?.trim() || "Visitor";
    const callerPhone = body.callerPhone?.trim() || "";
    const callerRole: ActivityActorRole =
      body.callerRole === "Account" || body.callerRole === "Customer"
        ? "Customer"
        : body.callerRole === "Business"
        ? "Business"
        : body.callerRole === "Agent"
        ? "Agent"
        : body.callerRole === "Super Admin" || body.callerRole === "Admin"
        ? (body.callerRole as ActivityActorRole)
        : "Guest";

    const record = await saveActivityLog({
      action: `Phone Call: ${targetName} (${targetPhone || "Dialer"})`,
      category: "Call",
      actorName: callerName,
      actorPhone: callerPhone,
      actorRole: callerRole,
      locality: body.locality?.trim() || "Hosur",
      details: `User initiated direct telephone call to ${targetName} (${targetType}: ${targetPhone}) from platform.`,
      metadata: {
        targetName,
        targetPhone,
        targetType,
        device: "Dialer Pad",
      },
    });

    // Notify Business Portal if target is a merchant
    if (targetType === "Business" || body.businessName || body.targetName) {
      const bizName = body.businessName || targetName;
      try {
        await createServerNotification({
          title: `📞 Inbound Call Lead: ${callerName}`,
          message: `${callerName}${callerPhone ? ` (${callerPhone})` : ""} tapped to call your business phone (${targetPhone || "Direct"}) from Bizearch. Follow up if missed!`,
          type: "business",
          targetRole: "Business",
          targetIdentity: bizName,
          linkText: "View Call Logs",
          action: {
            type: "portal",
            payload: "Business",
            tab: "activity",
          },
        });
      } catch (notifErr) {
        console.warn("Failed to create call notification:", notifErr);
      }
    }

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record call log" },
      { status: 500 }
    );
  }
}
