import { NextResponse } from "next/server";
import { getCurrentSession, listCompanyAdmins, registerCompanyAdmin, setCompanyAdminStatus } from "@/app/lib/auth";

async function requireSuperAdmin() {
  const session = await getCurrentSession();
  return session?.role === "Company" && session.accessLevel === "Super Admin";
}

export async function GET() {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Only the Super Admin can manage Admin accounts." }, { status: 403 });
  return NextResponse.json({ admins: await listCompanyAdmins() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Only the Super Admin can register Admin accounts." }, { status: 403 });
  try {
    const body = await request.json() as { name?: unknown; email?: unknown; password?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
      return NextResponse.json({ error: "Enter a name, valid email and password of at least 10 characters." }, { status: 400 });
    }
    const admin = await registerCompanyAdmin(name, email, password);
    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not register Admin." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: "Only the Super Admin can manage Admin accounts." }, { status: 403 });
  const body = await request.json() as { id?: unknown; active?: unknown };
  if (typeof body.id !== "string" || typeof body.active !== "boolean") return NextResponse.json({ error: "Provide an Admin ID and active status." }, { status: 400 });
  const admin = await setCompanyAdminStatus(body.id, body.active);
  if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
  return NextResponse.json({ admin });
}