import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import {
  readAgentCommissionConfig,
  updateAgentCommissionConfig,
  type AgentCommissionConfig,
} from "@/app/lib/agent-commission-config";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET() {
  try {
    const config = await readAgentCommissionConfig();
    return NextResponse.json({ success: true, config }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("GET /api/agent-commission error:", error);
    return NextResponse.json(
      { error: "Failed to load agent commission configuration." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request);

    // Require Company / Super Admin authorization
    if (!session || session.role !== "Company") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admins can define the agent referral commission percentage." },
        { status: 403, headers: noStoreHeaders }
      );
    }

    const body = (await request.json()) as Partial<AgentCommissionConfig>;

    if (body.referralPercentage !== undefined) {
      const pct = Number(body.referralPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json(
          { error: "Referral percentage must be a number between 0% and 100%." },
          { status: 400, headers: noStoreHeaders }
        );
      }
    }

    const actorName = session.identity || "Super Admin";
    const updated = await updateAgentCommissionConfig(body, actorName, "Super Admin");

    return NextResponse.json(
      {
        success: true,
        message: `Agent referral commission successfully updated to ${updated.referralPercentage}%.`,
        config: updated,
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("POST /api/agent-commission error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update agent commission configuration." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
