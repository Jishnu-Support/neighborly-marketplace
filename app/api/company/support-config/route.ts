import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readSupportConfig, updateSupportConfig } from "@/app/lib/support-config";

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
    };

    if (!body.phone || typeof body.phone !== "string" || body.phone.trim().length < 6) {
      return NextResponse.json(
        { error: "Enter a valid customer care phone number." },
        { status: 400 }
      );
    }

    const updated = await updateSupportConfig(
      {
        phone: body.phone.trim(),
        email: body.email?.trim() || "support@bizearch.in",
        hours: body.hours?.trim() || "8:00 AM - 9:00 PM (All Days)",
        label: body.label?.trim() || "Bizearch Customer Care (Hosur)",
        whatsapp: body.whatsapp?.trim() || body.phone.trim(),
      },
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
