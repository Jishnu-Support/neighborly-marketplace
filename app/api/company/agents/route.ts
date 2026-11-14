import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/app/lib/auth";
import { approveAgentPartner, createAgentPartner, listAgentPartners, rejectAgentPartner, toggleAgentActive, updateAgentRatings } from "@/app/lib/agents";
import { saveActivityLog } from "@/app/lib/activity-logs";
import { createServerNotification } from "@/app/lib/notifications";

const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate" };

async function getCompanyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE)?.value;
  const session = verifySessionToken(sessionToken);
  if (!session || session.role !== "Company") return null;
  return session;
}

export async function GET() {
  try {
    const session = await getCompanyAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Only Company Admins can access agent partner records." }, { status: 403, headers: noStore });
    }

    const agents = await listAgentPartners();
    return NextResponse.json({ agents, count: agents.length }, { headers: noStore });
  } catch (error) {
    console.error("GET /api/company/agents error:", error);
    return NextResponse.json({ error: "Could not load agent partner records." }, { status: 500, headers: noStore });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCompanyAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Only Company Admins can manage agent partner records." }, { status: 403, headers: noStore });
    }

    const body = await request.json() as {
      action?: string;
      id?: string;
      active?: boolean;
      reason?: string;
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      referralCode?: string;
      ratings?: {
        businessFeedback: number;
        registrationsCount: number;
        registrationRenewal: number;
        feedbackNote?: string;
        registrationsNote?: string;
        renewalNote?: string;
      };
    };

    if (body.action === "update_ratings" && typeof body.id === "string" && body.ratings) {
      const adminIdentity = `${session.accessLevel || "Admin"}: ${session.identity}`;
      const updated = await updateAgentRatings(body.id, body.ratings, adminIdentity);
      if (!updated) {
        return NextResponse.json({ error: "Agent partner not found." }, { status: 404, headers: noStore });
      }

      try {
        await saveActivityLog({
          action: `Agent ratings updated: ${updated.name} (Overall: ${updated.ratings?.overall}%)`,
          category: "Admin",
          actorName: session.identity || "Super Admin",
          actorRole: session.accessLevel || "Super Admin",
          details: `Field agent ratings updated: Business Feedback: ${updated.ratings?.businessFeedback}%, Registrations Count: ${updated.ratings?.registrationsCount}%, Renewal: ${updated.ratings?.registrationRenewal}%. Overall score: ${updated.ratings?.overall}%.`,
        });
      } catch {}

      try {
        await createServerNotification({
          title: `⭐ Agent Performance Rating: ${updated.ratings?.overall}%`,
          message: `Your agent performance ratings have been evaluated by Super Admin. Business Feedback: ${updated.ratings?.businessFeedback}%, Registrations: ${updated.ratings?.registrationsCount}%, Renewal: ${updated.ratings?.registrationRenewal}%.`,
          type: "agent",
          targetRole: "Agent",
          targetIdentity: updated.referralCode || updated.phone,
          linkText: "View My Ratings",
          action: {
            type: "portal",
            payload: "Agent",
            tab: "Overview",
          },
        });
      } catch {}

      const agents = await listAgentPartners();
      return NextResponse.json({ success: true, agent: updated, agents, count: agents.length }, { headers: noStore });
    }

    if (body.action === "approve" && typeof body.id === "string") {
      const adminIdentity = `${session.accessLevel || "Admin"}: ${session.identity}`;
      const approved = await approveAgentPartner(body.id, adminIdentity);
      if (!approved) return NextResponse.json({ error: "Agent partner not found." }, { status: 404, headers: noStore });

      try {
        await saveActivityLog({
          action: `Agent partner approved: ${approved.name} (Code: ${approved.referralCode})`,
          category: "Approval",
          actorName: session.identity || "Admin",
          actorRole: session.accessLevel || "Admin",
          details: `Field agent application approved by ${session.accessLevel || "Admin"} (${session.identity}). Account is now activated with referral code ${approved.referralCode}.`,
        });
      } catch {}

      try {
        await createServerNotification({
          title: "✓ Agent Account Approved!",
          message: `Congratulations ${approved.name}! Your agent account (${approved.referralCode || approved.id}) is approved and active.`,
          type: "agent",
          targetRole: "Agent",
          targetIdentity: approved.referralCode || approved.phone,
          linkText: "Open Agent Portal",
          action: {
            type: "portal",
            payload: "Agent",
            tab: "Overview",
          },
        });
      } catch {}

      const agents = await listAgentPartners();
      return NextResponse.json({ success: true, agent: approved, agents, count: agents.length }, { headers: noStore });
    }

    if (body.action === "reject" && typeof body.id === "string") {
      const adminIdentity = `${session.accessLevel || "Admin"}: ${session.identity}`;
      const reason = typeof body.reason === "string" ? body.reason : undefined;
      const rejected = await rejectAgentPartner(body.id, adminIdentity, reason);
      if (!rejected) return NextResponse.json({ error: "Agent partner not found." }, { status: 404, headers: noStore });

      try {
        await saveActivityLog({
          action: `Agent partner application rejected: ${rejected.name}`,
          category: "Approval",
          actorName: session.identity || "Admin",
          actorRole: session.accessLevel || "Admin",
          details: `Field agent application rejected by ${session.accessLevel || "Admin"} (${session.identity}).${reason ? ` Reason: ${reason}` : ""}`,
        });
      } catch {}

      const agents = await listAgentPartners();
      return NextResponse.json({ success: true, agent: rejected, agents, count: agents.length }, { headers: noStore });
    }

    if (body.action === "toggle" && typeof body.id === "string" && typeof body.active === "boolean") {
      if (session.accessLevel !== "Super Admin") {
        return NextResponse.json({ error: "Only Super Admins can disable or activate agent accounts." }, { status: 403, headers: noStore });
      }
      const agentsBefore = await listAgentPartners();
      const targetAgent = agentsBefore.find((a) => a.id === body.id);
      const ok = await toggleAgentActive(body.id, body.active);
      if (!ok) return NextResponse.json({ error: "Agent partner not found." }, { status: 404, headers: noStore });

      try {
        await saveActivityLog({
          action: `Agent partner ${body.active ? "activated" : "disabled"} by Super Admin`,
          category: "Admin",
          actorName: session.identity || "Super Admin",
          actorRole: "Super Admin",
          details: `Agent ${targetAgent ? targetAgent.name : body.id} status changed to ${body.active ? "Active" : "Disabled"}.`,
        });
      } catch {}

      const agents = await listAgentPartners();
      return NextResponse.json({ success: true, agents, count: agents.length }, { headers: noStore });
    }

    if (body.name && body.phone) {
      const agent = await createAgentPartner({
        name: body.name,
        phone: body.phone,
        email: body.email,
        password: body.password,
        referralCode: body.referralCode,
        approvalStatus: "Approved",
        active: true,
      });

      try {
        await saveActivityLog({
          action: `Agent partner registered: ${agent.name} (Code: ${agent.referralCode})`,
          category: "Registration",
          actorName: agent.name,
          actorPhone: agent.phone,
          actorRole: "Agent",
          details: `Field agent provisioned by ${session.accessLevel || "Admin"} (${session.identity}). Referral code: ${agent.referralCode}.`,
        });
      } catch {}

      const agents = await listAgentPartners();
      return NextResponse.json({ success: true, agent, agents, count: agents.length }, { status: 201, headers: noStore });
    }

    return NextResponse.json({ error: "Invalid agent partner payload." }, { status: 400, headers: noStore });
  } catch (error) {
    console.error("POST /api/company/agents error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update agent partner." }, { status: 400, headers: noStore });
  }
}
