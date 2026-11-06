import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readAdConfig, saveAdConfig, normalizeAdConfig } from "@/app/lib/ad-config";

async function hasCompanyAccess() {
  const session = await getCurrentSession();
  return session?.role === "Company" && (session.accessLevel === "Admin" || session.accessLevel === "Super Admin");
}

export async function GET() {
  if (!await hasCompanyAccess()) return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  return NextResponse.json({ config: await readAdConfig() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!await hasCompanyAccess()) return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  try {
    const body = (await request.json()) as { config?: unknown };
    if (!body || typeof body !== "object" || !body.config) {
      return NextResponse.json({ error: "Invalid advertising configuration." }, { status: 400 });
    }
    const normalized = normalizeAdConfig(body.config);
    const config = await saveAdConfig(normalized);
    return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error saving advertising settings:", error);
    return NextResponse.json({ error: "Could not save advertising settings." }, { status: 500 });
  }
}
