import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { getAgentByIdentity } from "@/app/lib/agents";
import { createRemovalRequest, readRemovalRequests, type RemovalRequestType } from "@/app/lib/removal-requests";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || (session.role !== "Agent" && session.role !== "Company")) {
    return NextResponse.json({ error: "Agent or Company authentication required." }, { status: 401 });
  }

  const all = await readRemovalRequests();
  if (session.role === "Agent") {
    const agent = await getAgentByIdentity(session.identity);
    const agentId = agent?.id || session.identity;
    const filtered = all.filter((r) => r.agentId === agentId || r.agentPhone === session.identity);
    return NextResponse.json({ requests: filtered }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ requests: all }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || (session.role !== "Agent" && session.role !== "Company")) {
    return NextResponse.json({ error: "Agent authentication required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : undefined;
  const requestType = (body.requestType === "Delete" ? "Delete" : "Disable") as RemovalRequestType;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const remarks = typeof body.remarks === "string" ? body.remarks.trim() : "";

  if (!businessId && !businessName) {
    return NextResponse.json({ error: "Business ID or Name is required." }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "A proper reason category must be selected." }, { status: 400 });
  }
  if (!remarks || remarks.length < 5) {
    return NextResponse.json({ error: "Please provide detailed remarks/explanation (at least 5 characters)." }, { status: 400 });
  }

  const agent = await getAgentByIdentity(session.identity);
  const agentName = agent?.name || (session.role === "Company" ? "Company Admin" : "Field Agent");
  const agentPhone = agent?.phone || session.identity;

  try {
    const newReq = await createRemovalRequest({
      businessId,
      businessName,
      agentId: agent?.id || session.identity,
      agentName,
      agentPhone,
      agentReferralCode: agent?.referralCode,
      requestType,
      reason,
      remarks,
    });

    return NextResponse.json({ success: true, request: newReq });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit removal request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
