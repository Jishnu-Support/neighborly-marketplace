import { NextResponse } from "next/server";
import { getCurrentSession, isSuperAdminIdentity, listCompanyAdmins, registerCompanyAdmin, updateCompanyAdmin } from "@/app/lib/auth";

async function isAuthorizedAdmin(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || session.role !== "Company") return false;
  return session.accessLevel === "Super Admin" || session.accessLevel === "Admin" || isSuperAdminIdentity(session.identity);
}

export async function GET(request: Request) {
  if (!await isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Only Company Admins can manage Admin accounts." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ admins: await listCompanyAdmins() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Only Company Admins can register Admin accounts." }, { status: 403 });
  }
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
  if (!await isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Only Company Admins can manage Admin accounts." }, { status: 403 });
  }
  try {
    const body = await request.json() as {
      id?: unknown;
      active?: unknown;
      name?: unknown;
      email?: unknown;
      password?: unknown;
    };
    if (typeof body.id !== "string") {
      return NextResponse.json({ error: "Provide an Admin ID." }, { status: 400 });
    }
    const admin = await updateCompanyAdmin({
      id: body.id,
      name: typeof body.name === "string" ? body.name : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      password: typeof body.password === "string" ? body.password : undefined,
    });
    if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    return NextResponse.json({ admin });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update Admin account." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}
