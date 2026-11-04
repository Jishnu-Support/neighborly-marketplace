import { NextResponse } from "next/server";
import { saveActivityLog, ActivityLogCategory, ActivityActorRole } from "@/app/lib/activity-logs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: unknown;
      category?: unknown;
      actorName?: unknown;
      actorPhone?: unknown;
      actorRole?: unknown;
      locality?: unknown;
      details?: unknown;
      metadata?: unknown;
    };

    if (typeof body.action !== "string" || !body.action.trim()) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    const record = await saveActivityLog({
      action: body.action.trim(),
      category: (typeof body.category === "string" ? body.category : "General") as ActivityLogCategory,
      actorName: typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "Guest User",
      actorPhone: typeof body.actorPhone === "string" ? body.actorPhone.trim() : undefined,
      actorRole: (typeof body.actorRole === "string" ? body.actorRole : "Customer") as ActivityActorRole,
      locality: typeof body.locality === "string" ? body.locality.trim() : "Hosur",
      details: typeof body.details === "string" ? body.details.trim() : undefined,
      metadata: typeof body.metadata === "object" && body.metadata !== null ? (body.metadata as Record<string, unknown>) : undefined,
    });

    return NextResponse.json({ success: true, log: record }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record activity log.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
