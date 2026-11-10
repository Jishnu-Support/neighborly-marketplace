import { NextResponse } from "next/server";
import { saveActivityLog, ActivityActorRole } from "@/app/lib/activity-logs";

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

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record call log" },
      { status: 500 }
    );
  }
}
