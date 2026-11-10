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
import { saveActivityLog } from "@/app/lib/activity-logs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { role?: unknown; accessLevel?: unknown; identity?: unknown; password?: unknown };
    if (!isPortalRole(body.role) || typeof body.identity !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Enter a valid portal, email/mobile and password." }, { status: 400 });
    }

    let matchedRole: PortalRole | null = null;
    let matchedAccessLevel: "Admin" | "Super Admin" | undefined = undefined;

    if (body.role === "Company") {
      const requestedLevel =
        body.accessLevel === "Super Admin" || body.accessLevel === "Admin"
          ? (body.accessLevel as "Admin" | "Super Admin")
          : undefined;

      if (requestedLevel === "Admin") {
        // Enforce: Super Admin credentials cannot sign in under Admin role tab
        const isSuper = await verifyCredentials("Company", body.identity, body.password, "Super Admin");
        if (isSuper) {
          return NextResponse.json(
            {
              error:
                "These credentials belong to a Super Admin account. Please switch to the 'Super Admin' tab above to sign in.",
            },
            { status: 400 }
          );
        }

        const isAdmin = await verifyCredentials("Company", body.identity, body.password, "Admin");
        if (isAdmin) {
          matchedRole = "Company";
          matchedAccessLevel = "Admin";
        } else {
          return NextResponse.json(
            { error: "Invalid Admin work email or password." },
            { status: 401 }
          );
        }
      } else if (requestedLevel === "Super Admin") {
        // Enforce: regular Admin credentials cannot sign in under Super Admin role tab
        const isAdmin = await verifyCredentials("Company", body.identity, body.password, "Admin");
        if (isAdmin) {
          return NextResponse.json(
            {
              error:
                "These credentials belong to a regular Admin account. Please switch to the 'Admin' tab above to sign in.",
            },
            { status: 400 }
          );
        }

        const isSuper = await verifyCredentials("Company", body.identity, body.password, "Super Admin");
        if (isSuper) {
          matchedRole = "Company";
          matchedAccessLevel = "Super Admin";
        } else {
          return NextResponse.json(
            { error: "Invalid Super Admin work email or password." },
            { status: 401 }
          );
        }
      } else {
        // Fallback when accessLevel is not explicitly passed
        if (await verifyCredentials("Company", body.identity, body.password, "Super Admin")) {
          matchedRole = "Company";
          matchedAccessLevel = "Super Admin";
        } else if (await verifyCredentials("Company", body.identity, body.password, "Admin")) {
          matchedRole = "Company";
          matchedAccessLevel = "Admin";
        }
      }
    } else if (await verifyCredentials(body.role, body.identity, body.password)) {
      matchedRole = body.role;
      matchedAccessLevel = undefined;
    }

    if (!matchedRole) {
      // Credentials did not match the portal the user is signing into.
      // Check which portal these credentials belong to, and provide an exact, helpful guidance message
      // rather than auto-redirecting to an unintended portal:
      const isSuperAdmin = await verifyCredentials("Company", body.identity, body.password, "Super Admin");
      const isAdmin = !isSuperAdmin && (await verifyCredentials("Company", body.identity, body.password, "Admin"));
      if (isSuperAdmin || isAdmin) {
        return NextResponse.json(
          {
            error: "These credentials belong to a Company Admin account. The Customer portal accepts Customer / User accounts only. Please use the Company portal below to sign in.",
          },
          { status: 401 }
        );
      }

      if (body.role !== "Business" && (await verifyCredentials("Business", body.identity, body.password))) {
        return NextResponse.json(
          {
            error: "These credentials belong to a Business Partner account. Please switch to the Business portal below to sign in.",
          },
          { status: 401 }
        );
      }

      if (body.role !== "Agent" && (await verifyCredentials("Agent", body.identity, body.password))) {
        return NextResponse.json(
          {
            error: "These credentials belong to a Neighborhood Agent account. Please switch to the Agent portal below to sign in.",
          },
          { status: 401 }
        );
      }

      if (body.role !== "Account" && (await verifyCredentials("Account", body.identity, body.password))) {
        return NextResponse.json(
          {
            error: "These credentials belong to a Customer account. Please switch to the Customer portal below to sign in.",
          },
          { status: 401 }
        );
      }

      const portalLabel = body.role === "Account" ? "customer" : body.role.toLowerCase();
      return NextResponse.json(
        {
          error: `Invalid ${portalLabel} credentials. Please check your mobile or email, or click 'Create an account' to register.`,
        },
        { status: 401 }
      );
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

    // Record persistent login audit activity
    try {
      const displayRole = matchedRole === "Account" ? "Customer" : matchedRole === "Company" ? (matchedAccessLevel || "Admin") : matchedRole;
      await saveActivityLog({
        action: `${displayRole} login: ${identity}`,
        category: "Login",
        actorName: identity,
        actorRole: (matchedRole === "Account" ? "Customer" : matchedRole === "Company" ? (matchedAccessLevel === "Super Admin" ? "Super Admin" : "Admin") : matchedRole) as any,
        locality: "Hosur",
        details: `Successful sign-in to ${displayRole} Portal.`,
      });
    } catch {
      // Non-blocking log
    }

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
