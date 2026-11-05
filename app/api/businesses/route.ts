import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { listRegisteredBusinesses, updateBusinessProfile } from "@/app/lib/businesses";

export async function GET() {
  const businesses = await listRegisteredBusinesses();
  return NextResponse.json({ businesses }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const session = await getCurrentSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required to update business." }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const identity = (session.role === "Company" && body.businessId) ? body.businessId : (body.id || body.phone || body.name || session.identity);
  if (!identity) {
    return NextResponse.json({ error: "Business identity is required." }, { status: 400 });
  }

  try {
    const updated = await updateBusinessProfile(identity, body);
    return NextResponse.json({ success: true, business: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update business.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
