import { NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions, createSessionToken, isCompanyAccessLevel, isPortalRole, isSuperAdminIdentity, verifyCredentials } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { role?: unknown; accessLevel?: unknown; identity?: unknown; password?: unknown };
    if (!isPortalRole(body.role) || typeof body.identity !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Enter a valid portal, email and password." }, { status: 400 });
    }
    if (body.role === "Company" ? (!isCompanyAccessLevel(body.accessLevel) && !isSuperAdminIdentity(body.identity)) : body.accessLevel !== undefined) {
      return NextResponse.json({ error: "Choose a valid company account type." }, { status: 400 });
    }
    let accessLevel = body.role === "Company" ? (body.accessLevel as "Admin" | "Super Admin" || "Admin") : undefined;
    if (body.role === "Company" && isSuperAdminIdentity(body.identity)) {
      accessLevel = "Super Admin";
    }
    if (!await verifyCredentials(body.role, body.identity, body.password, accessLevel)) {
      return NextResponse.json({ error: "Email or password is incorrect, or this account is inactive." }, { status: 401 });
    }
    const identity = body.identity.trim().toLowerCase();
    const response = NextResponse.json({ session: { role: body.role, identity, ...(accessLevel ? { accessLevel } : {}) } });
    response.cookies.set(AUTH_COOKIE, createSessionToken(body.role, identity, accessLevel), authCookieOptions);
    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
