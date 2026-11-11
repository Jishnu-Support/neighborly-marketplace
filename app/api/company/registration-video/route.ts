import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import {
  readRegistrationVideoConfig,
  saveRegistrationVideoConfig,
  validateRegistrationVideoConfig,
} from "@/app/lib/registration-video";
import { defaultRegistrationVideoConfig } from "@/app/lib/registration-video.shared";

export const dynamic = "force-dynamic";

async function isSuperAdmin() {
  const session = await getCurrentSession();
  return (
    session?.role === "Company" &&
    (session.accessLevel === "Super Admin" || session.accessLevel === "Admin")
  );
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json(
      { error: "Super Admin or Company Admin access is required." },
      { status: 403 }
    );
  }
  const config = await readRegistrationVideoConfig();
  return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json(
      { error: "Super Admin or Company Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { config?: unknown };
    if (!validateRegistrationVideoConfig(body.config)) {
      return NextResponse.json(
        { error: "Invalid registration video configuration." },
        { status: 400 }
      );
    }
    const updated = await saveRegistrationVideoConfig(body.config);
    return NextResponse.json(
      { config: updated, message: "Registration video settings saved." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save registration video configuration." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json(
      { error: "Super Admin or Company Admin access is required." },
      { status: 403 }
    );
  }

  try {
    const reset = await saveRegistrationVideoConfig({
      ...defaultRegistrationVideoConfig,
      videoUrl: "",
      fileName: "",
      fileSize: undefined,
    });
    return NextResponse.json(
      { config: reset, message: "Registration video removed successfully." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not remove registration video." },
      { status: 500 }
    );
  }
}
