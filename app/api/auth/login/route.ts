import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  authCookieOptions,
  createSessionToken,
  getCustomerByIdentity,
  isCompanyAccessLevel,
  isPortalRole,
  isSuperAdminIdentity,
  PortalRole,
  verifyCredentials,
} from "@/app/lib/auth";
import { getBusinessByIdentity } from "@/app/lib/businesses";
import { getAgentByIdentity } from "@/app/lib/agents";

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

    let matchedRole: PortalRole | null = null;
    let matchedAccessLevel: "Admin" | "Super Admin" | undefined = accessLevel;

    if (await verifyCredentials(body.role, body.identity, body.password, accessLevel)) {
      matchedRole = body.role;
      matchedAccessLevel = accessLevel;
    } else {
      // Auto-detect portal if user submitted credentials on a different portal tab:
      // 1. Check Business
      if (body.role !== "Business" && (await verifyCredentials("Business", body.identity, body.password))) {
        matchedRole = "Business";
        matchedAccessLevel = undefined;
      }
      // 2. Check Agent
      else if (body.role !== "Agent" && (await verifyCredentials("Agent", body.identity, body.password))) {
        matchedRole = "Agent";
        matchedAccessLevel = undefined;
      }
      // 3. Check Customer (Account)
      else if (body.role !== "Account" && (await verifyCredentials("Account", body.identity, body.password))) {
        matchedRole = "Account";
        matchedAccessLevel = undefined;
      }
      // 4. Check Company
      else if (body.role !== "Company") {
        if (await verifyCredentials("Company", body.identity, body.password, "Super Admin")) {
          matchedRole = "Company";
          matchedAccessLevel = "Super Admin";
        } else if (await verifyCredentials("Company", body.identity, body.password, "Admin")) {
          matchedRole = "Company";
          matchedAccessLevel = "Admin";
        }
      }
    }

    if (!matchedRole) {
      return NextResponse.json({ error: "Email or password is incorrect, or this account is inactive." }, { status: 401 });
    }

    let identity = body.identity.trim().toLowerCase();
    if (matchedRole === "Business") {
      const biz = await getBusinessByIdentity(body.identity);
      if (biz) identity = biz.phone || biz.email || identity;
    } else if (matchedRole === "Account") {
      const cust = await getCustomerByIdentity(body.identity);
      if (cust) identity = cust.phone || cust.email || identity;
    } else if (matchedRole === "Agent") {
      const ag = await getAgentByIdentity(body.identity);
      if (ag) identity = ag.phone || ag.email || identity;
    }

    const redirectUrl =
      matchedRole === "Company"
        ? "/?portal=Company"
        : matchedRole === "Account"
        ? "/"
        : `/?portal=${matchedRole}`;

    const response = NextResponse.json({
      session: {
        role: matchedRole,
        identity,
        ...(matchedAccessLevel ? { accessLevel: matchedAccessLevel } : {}),
      },
      redirectPortal: matchedRole,
      redirectUrl,
    });
    response.cookies.set(
      AUTH_COOKIE,
      createSessionToken(matchedRole, identity, matchedAccessLevel),
      authCookieOptions
    );
    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
