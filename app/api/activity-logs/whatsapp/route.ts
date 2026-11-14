import { NextResponse } from "next/server";
import { saveActivityLog, ActivityActorRole } from "@/app/lib/activity-logs";
import { createServerNotification } from "@/app/lib/notifications";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      businessName?: string;
      businessPhone?: string;
      productName?: string;
      callerName?: string;
      callerPhone?: string;
      callerRole?: string;
      locality?: string;
    };

    const businessName = body.businessName?.trim() || "Local Business";
    const businessPhone = body.businessPhone?.trim() || "";
    const productName = body.productName?.trim() || "";
    const callerName = body.callerName?.trim() || "Shopper";
    const callerPhone = body.callerPhone?.trim() || "";
    const callerRole: ActivityActorRole =
      body.callerRole === "Account" || body.callerRole === "Customer"
        ? "Customer"
        : body.callerRole === "Business"
        ? "Business"
        : body.callerRole === "Agent"
        ? "Agent"
        : "Guest";

    const record = await saveActivityLog({
      action: `WhatsApp Chat: ${businessName} (${businessPhone || "Direct"})`,
      category: "Lead",
      actorName: callerName,
      actorPhone: callerPhone,
      actorRole: callerRole,
      locality: body.locality?.trim() || "Hosur",
      details: `Customer initiated WhatsApp chat with ${businessName}${productName ? ` for "${productName}"` : ""} from Bizearch platform.`,
      metadata: {
        businessName,
        businessPhone,
        productName,
        channel: "WhatsApp",
      },
    });

    // Notify Business Portal in real-time
    try {
      await createServerNotification({
        title: `💬 New WhatsApp Lead: ${callerName}`,
        message: `${callerName}${callerPhone ? ` (${callerPhone})` : ""} initiated a WhatsApp inquiry${productName ? ` about "${productName}"` : ""}. Reply promptly on WhatsApp to close this lead!`,
        type: "business",
        targetRole: "Business",
        targetIdentity: businessName,
        linkText: "View Inquiries",
        action: {
          type: "portal",
          payload: "Business",
          tab: "activity",
        },
      });
    } catch (notifErr) {
      console.warn("Failed to create WhatsApp notification:", notifErr);
    }

    return NextResponse.json({ success: true, id: record.id }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record WhatsApp log" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
