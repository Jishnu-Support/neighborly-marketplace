import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { listSosAlerts } from "@/app/lib/sos-alerts";

export async function GET() {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || session.accessLevel !== "Super Admin") {
    return NextResponse.json({ error: "Super Admin access is required to view SOS alerts." }, { status: 403 });
  }
  return NextResponse.json({ alerts: await listSosAlerts() }, { headers: { "Cache-Control": "no-store" } });
}
