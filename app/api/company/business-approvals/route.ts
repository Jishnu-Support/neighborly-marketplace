import { NextResponse } from "next/server";
import { getCurrentSession, getCompanyAdminByIdentity } from "@/app/lib/auth";
import { listBusinessesForAdminApproval, submitAdminBusinessApproval, assignBusinessAgent } from "@/app/lib/businesses";
import { listAgentPartners } from "@/app/lib/agents";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") {
    return NextResponse.json({ error: "Company Administrator access required." }, { status: 403 });
  }

  const businesses = await listBusinessesForAdminApproval();
  const agents = await listAgentPartners();
  return NextResponse.json({ businesses, agents }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") {
    return NextResponse.json({ error: "Company Administrator access required." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  const action = typeof body.action === "string" ? body.action : "approve";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!businessId) {
    return NextResponse.json({ error: "Business ID is required." }, { status: 400 });
  }

  try {
    const admin = await getCompanyAdminByIdentity(session.identity);
    const adminName = admin?.name || (session.identity === "admin@bizearch.in" ? "Super Admin" : "Company Administrator");

    if (action === "assign_agent" || action === "transfer_agent") {
      const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
      if (!agentId) {
        return NextResponse.json({ error: "Please select an agent partner to assign or transfer." }, { status: 400 });
      }

      const updated = await assignBusinessAgent({
        businessId,
        agentId,
        adminName,
        adminEmail: session.identity,
      });

      return NextResponse.json({ success: true, business: updated, message: "✓ Business successfully assigned / transferred to agent." });
    }

    const updated = await submitAdminBusinessApproval({
      businessId,
      adminEmail: session.identity,
      adminName,
      action: action === "reject" ? "reject" : "approve",
      notes,
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process business approval.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
