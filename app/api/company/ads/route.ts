import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readAdConfig, saveAdConfig, validateAdConfig } from "@/app/lib/ad-config";

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
    const body = await request.json() as { config?: unknown };
    if (!validateAdConfig(body.config)) return NextResponse.json({ error: "Review the ticker, image ads and video fields. URLs must use HTTPS and each list must stay within its limits." }, { status: 400 });
    const config = await saveAdConfig(body.config);
    return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not save advertising settings." }, { status: 500 });
  }
}
