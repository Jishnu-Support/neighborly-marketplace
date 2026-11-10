import { NextResponse } from "next/server";
import { getCurrentSession, toggleCustomerActive } from "@/app/lib/auth";
import {
  listCustomerRegistrationLocations,
  deleteCustomerRegistrationLocation,
  toggleCustomerRegistrationActive,
} from "@/app/lib/customer-locations";
import { saveActivityLog } from "@/app/lib/activity-logs";

export async function GET() {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")) {
    return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  }
  const registrations = await listCustomerRegistrationLocations();
  return NextResponse.json({ registrations }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || session.accessLevel !== "Super Admin") {
    return NextResponse.json({ error: "Only Super Admins can disable or activate customer accounts." }, { status: 403 });
  }
  try {
    const body = (await request.json()) as { id?: string; active?: boolean };
    if (typeof body.id !== "string" || typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Customer ID and active status are required." }, { status: 400 });
    }

    const updated = await toggleCustomerRegistrationActive(body.id, body.active);
    if (!updated) {
      return NextResponse.json({ error: "Customer record not found." }, { status: 404 });
    }

    // Also sync the underlying customer login credentials
    await toggleCustomerActive(body.id, body.active);
    if (updated.phone) await toggleCustomerActive(updated.phone, body.active);
    if (updated.email) await toggleCustomerActive(updated.email, body.active);

    // Record persistent activity log
    try {
      await saveActivityLog({
        action: `Customer account ${body.active ? "activated" : "disabled"} by Super Admin`,
        category: "Admin",
        actorName: session.identity || "Super Admin",
        actorRole: "Super Admin",
        locality: updated.locality,
        details: `Customer ${updated.name} (${updated.phone || updated.email}) status changed to ${
          body.active ? "Active" : "Disabled"
        }.`,
      });
    } catch {}

    const registrations = await listCustomerRegistrationLocations();
    return NextResponse.json({ success: true, customer: updated, registrations });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update customer status." }, { status: 500 });
  }
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

    // Record activity log
    try {
      await saveActivityLog({
        action: `Customer registration record deleted by Super Admin`,
        category: "Admin",
        actorName: session.identity || "Super Admin",
        actorRole: "Super Admin",
        details: `Deleted customer record ID: ${id}.`,
      });
    } catch {}

    return NextResponse.json({ success: true, message: "Customer registration deleted successfully." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete record." }, { status: 500 });
  }
}
