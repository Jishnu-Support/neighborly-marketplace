import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { listRegisteredBusinesses, updateBusinessProfile, deleteBusinessRecord, readBusinessRecords } from "@/app/lib/businesses";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  const isCompany = session && session.role === "Company";
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("all") === "true" || isCompany;

  if (includeAll) {
    const records = await readBusinessRecords();
    const businesses = records.map(({ salt, passwordHash, ...pub }) => pub);
    return NextResponse.json({ businesses }, { headers: { "Cache-Control": "no-store" } });
  }

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

export async function DELETE(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") {
    return NextResponse.json({ error: "Only Company administrators can delete businesses." }, { status: 403 });
  }

  if (session.accessLevel !== "Super Admin") {
    return NextResponse.json({
      error: "Only Super Administrators can permanently delete businesses. Admins can disable businesses instead.",
    }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const idOrName = searchParams.get("id") || searchParams.get("name");
  if (!idOrName) {
    return NextResponse.json({ error: "Business ID or Name is required to delete." }, { status: 400 });
  }

  try {
    const deleted = await deleteBusinessRecord(idOrName);
    return NextResponse.json({ success: true, deleted, idOrName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete business.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
