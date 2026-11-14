import { NextResponse } from "next/server";
import { getCurrentSession, isSuperAdminIdentity, listCompanyAdmins, registerCompanyAdmin, updateCompanyAdmin } from "@/app/lib/auth";
import { saveActivityLog } from "@/app/lib/activity-logs";

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
    const body = await request.json() as { name?: unknown; email?: unknown; password?: unknown; accessLevel?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const accessLevel = body.accessLevel === "Super Admin" ? "Super Admin" : "Admin";
    if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      return NextResponse.json({ error: "Enter a name, valid email and password of at least 6 characters." }, { status: 400 });
    }
    const admin = await registerCompanyAdmin(name, email, password, accessLevel);
    try {
      await saveActivityLog({
        action: `${accessLevel === "Super Admin" ? "Super Admin" : "Admin"} account provisioned: ${admin.name} (${admin.email})`,
        category: "Registration",
        actorName: admin.name,
        actorRole: accessLevel,
        details: `Company ${accessLevel} account provisioned. Email: ${admin.email}.`,
      });
    } catch {}
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
      accessLevel?: unknown;
    };
    if (typeof body.id !== "string") {
      return NextResponse.json({ error: "Provide an Admin ID." }, { status: 400 });
    }
    const accessLevel = body.accessLevel === "Super Admin" || body.accessLevel === "Admin" ? body.accessLevel : undefined;
    const admin = await updateCompanyAdmin({
      id: body.id,
      name: typeof body.name === "string" ? body.name : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      password: typeof body.password === "string" ? body.password : undefined,
      accessLevel,
    });
    if (!admin) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });

    try {
      if (body.accessLevel) {
        await saveActivityLog({
          action: `Admin access level updated: ${admin.name} → ${admin.accessLevel}`,
          category: "Admin",
          actorName: "Super Admin",
          actorRole: "Super Admin",
          details: `Admin ${admin.name} (${admin.email}) access level changed to ${admin.accessLevel}.`,
        });
      }
      if (typeof body.active === "boolean") {
        await saveActivityLog({
          action: `Admin account ${admin.active ? "activated" : "disabled"}: ${admin.name}`,
          category: "Admin",
          actorName: "Super Admin",
          actorRole: "Super Admin",
          details: `Admin account ${admin.name} (${admin.email}) was ${admin.active ? "enabled" : "disabled"} by Super Admin.`,
        });
      }
    } catch {}

    return NextResponse.json({ admin });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update Admin account." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}
