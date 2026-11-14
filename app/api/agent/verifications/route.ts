import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { getAgentByIdentity, isJunkRating } from "@/app/lib/agents";
import { listBusinessesForAgentVerification, submitAgentVerification } from "@/app/lib/businesses";
import { getFeedbacksForAgent } from "@/app/lib/agent-feedback";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || (session.role !== "Agent" && session.role !== "Company")) {
    return NextResponse.json({ error: "Agent authentication required." }, { status: 401 });
  }

  const agent = await getAgentByIdentity(session.identity);
  const businesses = await listBusinessesForAgentVerification(session.identity);
  const code = agent?.referralCode || "JIT";
  const feedbacks = await getFeedbacksForAgent(code, agent?.id);

  const referredBiz = businesses.filter((b) => {
    const bCode = (b as any).agentReferralCode || b.agentVerification?.agentReferralCode || (b as any).referredBy;
    return bCode && bCode.toUpperCase() === code.toUpperCase();
  });
  const referredCount = referredBiz.length;
  const activeRenewals = referredBiz.filter((b) => b.subscribed).length;
  const totalFeedbackCount = feedbacks.length;
  const averageFeedbackStars = totalFeedbackCount
    ? Number((feedbacks.reduce((a, f) => a + f.rating, 0) / totalFeedbackCount).toFixed(1))
    : null;

  return NextResponse.json(
    {
      businesses,
      agent: agent
        ? {
            id: agent.id,
            name: agent.name,
            phone: agent.phone,
            referralCode: agent.referralCode || "JIT",
            ratings: agent.ratings && !isJunkRating(agent.ratings) ? agent.ratings : null,
            stats: {
              referredCount,
              activeRenewals,
              feedbackCount: totalFeedbackCount,
              averageFeedbackStars,
              feedbacks: feedbacks.slice(0, 5),
            },
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const session = await getCurrentSession(request);
  if (!session || (session.role !== "Agent" && session.role !== "Company")) {
    return NextResponse.json({ error: "Agent authentication required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  if (!businessId) {
    return NextResponse.json({ error: "Business ID is required." }, { status: 400 });
  }

  const uploadedImages = Array.isArray(body.uploadedImages)
    ? (body.uploadedImages as string[]).filter((url) => typeof url === "string" && url.trim())
    : [];

  if (uploadedImages.length === 0) {
    return NextResponse.json({ error: "Please upload at least one storefront / business photo." }, { status: 400 });
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const verifiedGps =
    typeof body.verifiedGps === "object" && body.verifiedGps !== null
      ? (body.verifiedGps as { latitude: number; longitude: number })
      : null;

  try {
    const agent = await getAgentByIdentity(session.identity);
    const updated = await submitAgentVerification({
      businessId,
      agentId: agent?.id || session.identity,
      agentName: agent?.name || (session.role === "Company" ? "Admin Reviewer" : "Field Agent"),
      agentPhone: agent?.phone || session.identity,
      agentReferralCode: agent?.referralCode || "",
      uploadedImages,
      notes,
      verifiedGps,
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record agent verification.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
