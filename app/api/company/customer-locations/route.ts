import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { listCustomerRegistrationLocations, deleteCustomerRegistrationLocation } from "@/app/lib/customer-locations";

export async function GET() {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")) {
    return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  }
  const registrations = await listCustomerRegistrationLocations();
  return NextResponse.json({ registrations }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || session.accessLevel !== "Super Admin") {
    return NextResponse.json({ error: "Company Super Admin access is required to delete customer records." }, { status: 403 });
  }
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Customer registration ID is required." }, { status: 400 });
    }
    const success = await deleteCustomerRegistrationLocation(id);
    if (!success) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Customer registration deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete record." }, { status: 500 });
  }
}
