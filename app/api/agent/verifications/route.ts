import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { getAgentByIdentity } from "@/app/lib/agents";
import { listBusinessesForAgentVerification, submitAgentVerification } from "@/app/lib/businesses";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || (session.role !== "Agent" && session.role !== "Company")) {
    return NextResponse.json({ error: "Agent authentication required." }, { status: 401 });
  }

  const businesses = await listBusinessesForAgentVerification(session.identity);
  return NextResponse.json({ businesses }, { headers: { "Cache-Control": "no-store" } });
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
  if (!businessId) {
    return NextResponse.json({ error: "Business ID is required." }, { status: 400 });
  }

  const uploadedImages = Array.isArray(body.uploadedImages)
    ? (body.uploadedImages as string[]).filter((url) => typeof url === "string" && url.trim())
    : [];

  if (uploadedImages.length === 0) {
    return NextResponse.json({ error: "Please upload at least one storefront / business photo." }, { status: 400 });
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const verifiedGps =
    typeof body.verifiedGps === "object" && body.verifiedGps !== null
      ? (body.verifiedGps as { latitude: number; longitude: number })
      : null;

  try {
    const agent = await getAgentByIdentity(session.identity);
    const updated = await submitAgentVerification({
      businessId,
      agentId: agent?.id || session.identity,
      agentName: agent?.name || (session.role === "Company" ? "Admin Reviewer" : "Field Agent"),
      agentPhone: agent?.phone || session.identity,
      agentReferralCode: agent?.referralCode || "",
      uploadedImages,
      notes,
      verifiedGps,
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record agent verification.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
