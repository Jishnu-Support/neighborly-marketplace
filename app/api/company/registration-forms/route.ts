import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readRegistrationFormConfig, saveRegistrationFormConfig, validateRegistrationFormConfig } from "@/app/lib/registration-form-config";

async function isSuperAdmin() { const session = await getCurrentSession(); return session?.role === "Company" && session.accessLevel === "Super Admin"; }
export async function GET() {
  if (!await isSuperAdmin()) return NextResponse.json({ error: "Super Admin access is required." }, { status: 403 });
  return NextResponse.json({ config: await readRegistrationFormConfig() }, { headers: { "Cache-Control": "no-store" } });
}
export async function PUT(request: Request) {
  if (!await isSuperAdmin()) return NextResponse.json({ error: "Super Admin access is required." }, { status: 403 });
  try {
    const body = await request.json() as { config?: unknown };
    if (!validateRegistrationFormConfig(body.config)) return NextResponse.json({ error: "Registration form settings are invalid. Check required names and choices." }, { status: 400 });
    const config = await saveRegistrationFormConfig(body.config);
    return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Could not save registration form settings." }, { status: 500 }); }
}
