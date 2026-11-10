import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readRemovalRequests, reviewRemovalRequest } from "@/app/lib/removal-requests";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") {
    return NextResponse.json({ error: "Company admin authentication required." }, { status: 401 });
  }

  const requests = await readRemovalRequests();
  return NextResponse.json({ requests }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") {
    return NextResponse.json({ error: "Company admin authentication required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  const action = body.action === "Approved" ? "Approved" : body.action === "Rejected" ? "Rejected" : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (!requestId || !action) {
    return NextResponse.json({ error: "Request ID and action (Approved/Rejected) are required." }, { status: 400 });
  }

  const reviewerRole = session.accessLevel === "Super Admin" ? "Super Admin" : "Admin";

  try {
    const result = await reviewRemovalRequest({
      requestId,
      action,
      reviewerName: session.identity || (reviewerRole === "Super Admin" ? "Super Admin" : "Admin"),
      reviewerRole,
      notes,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to review removal request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
