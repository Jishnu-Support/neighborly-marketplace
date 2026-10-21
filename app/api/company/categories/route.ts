import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readCategoryConfig, saveCategoryConfig, validateCategoryConfig } from "@/app/lib/category-config";

async function hasCompanyAccess() {
  const session = await getCurrentSession();
  return session?.role === "Company" && (session.accessLevel === "Admin" || session.accessLevel === "Super Admin");
}

export async function GET() {
  if (!await hasCompanyAccess()) return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  return NextResponse.json({ config: await readCategoryConfig() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!await hasCompanyAccess()) return NextResponse.json({ error: "Company Admin access is required." }, { status: 403 });
  try {
    const body = await request.json() as { config?: unknown };
    if (!validateCategoryConfig(body.config)) return NextResponse.json({ error: "Check sector names, symbols, and category paths. Each path can have up to five levels, six options in the first two levels, and 100 options in deeper levels." }, { status: 400 });
    const config = await saveCategoryConfig(body.config);
    return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not save category settings." }, { status: 500 });
  }
}
