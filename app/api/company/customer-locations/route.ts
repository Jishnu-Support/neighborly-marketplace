import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { listCustomerRegistrationLocations } from "@/app/lib/customer-locations";

export async function GET() {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")) {
    return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  }
  const registrations = await listCustomerRegistrationLocations();
  return NextResponse.json({ registrations }, { headers: { "Cache-Control": "no-store" } });
}
