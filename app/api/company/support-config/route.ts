import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readSupportConfig, updateSupportConfig, type EmergencyNumberItem } from "@/app/lib/support-config";

export async function GET() {
  const session = await getCurrentSession();
  if (
    session?.role !== "Company" ||
    (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")
  ) {
    return NextResponse.json(
      { error: "Company Admin or Super Admin access is required." },
      { status: 403 }
    );
  }

  const config = await readSupportConfig();
  return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (
    session?.role !== "Company" ||
    (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")
  ) {
    return NextResponse.json(
      { error: "Company Admin or Super Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      phone?: string;
      email?: string;
      hours?: string;
      label?: string;
      whatsapp?: string;
      emergencyNumbers?: EmergencyNumberItem[];
    };

    // If emergency numbers are being modified, require Super Admin access
    if (body.emergencyNumbers !== undefined && session.accessLevel !== "Super Admin") {
      return NextResponse.json(
        { error: "Super Admin privileges are required to update emergency numbers." },
        { status: 403 }
      );
    }

    const current = await readSupportConfig();

    const patch: Parameters<typeof updateSupportConfig>[0] = {};

    if (body.phone && typeof body.phone === "string" && body.phone.trim().length >= 6) {
      patch.phone = body.phone.trim();
    }
    if (body.email !== undefined) {
      patch.email = body.email.trim();
    }
    if (body.hours !== undefined) {
      patch.hours = body.hours.trim();
    }
    if (body.label !== undefined) {
      patch.label = body.label.trim();
    }
    if (body.whatsapp !== undefined) {
      patch.whatsapp = body.whatsapp.trim();
    }
    if (body.emergencyNumbers !== undefined && Array.isArray(body.emergencyNumbers)) {
      patch.emergencyNumbers = body.emergencyNumbers.map((item, idx) => ({
        id: item.id || `em-${idx}`,
        title: item.title?.trim() || "Emergency Helpline",
        displayNumber: item.displayNumber?.trim() || item.dialNumber?.trim() || "112",
        dialNumber: item.dialNumber?.trim() || "112",
        icon: item.icon?.trim() || "🚨",
        active: item.active !== false,
        category: item.category,
      }));
    }

    const updated = await updateSupportConfig(
      patch,
      session.identity,
      session.accessLevel
    );

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update support details" },
      { status: 500 }
    );
  }
}
