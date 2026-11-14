import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readAgentRecords, updateAgentRatings } from "@/app/lib/agents";
import { saveAgentFeedback, getFeedbacksForAgent } from "@/app/lib/agent-feedback";
import { saveActivityLog } from "@/app/lib/activity-logs";
import { createServerNotification } from "@/app/lib/notifications";

export async function POST(request: Request) {
  const session = await getCurrentSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { agentId, agentReferralCode, rating, feedback, businessName } = body as {
    agentId?: string;
    agentReferralCode?: string;
    rating?: number;
    feedback?: string;
    businessName?: string;
  };

  const score = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
  const code = (agentReferralCode || "JIT").trim().toUpperCase();

  const records = await readAgentRecords();
  const agent = records.find(
    (a) => (agentId && a.id === agentId) || (a.referralCode && a.referralCode.toUpperCase() === code) || a.referralCode === "JIT"
  );

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  // Save the genuine feedback record
  await saveAgentFeedback({
    agentId: agent.id,
    agentReferralCode: agent.referralCode,
    businessName: businessName || session.identity || "Local Merchant",
    rating: score,
    feedback: feedback || "",
  });

  // Calculate real average from all submitted feedbacks for this agent
  const allFeedbacks = await getFeedbacksForAgent(agent.referralCode, agent.id);
  const totalStars = allFeedbacks.reduce((acc, f) => acc + f.rating, 0);
  const avgStars = totalStars / allFeedbacks.length;
  const genuinePercentage = Math.round((avgStars / 5) * 100);

  const updatedRatings = {
    businessFeedback: genuinePercentage,
    registrationsCount: agent.ratings?.registrationsCount ?? 0,
    registrationRenewal: agent.ratings?.registrationRenewal ?? 0,
    feedbackNote: feedback ? `Merchant review from ${businessName || "Verified Merchant"}: "${feedback}" (${score}★)` : (agent.ratings?.feedbackNote || `Average ${avgStars.toFixed(1)}★ across ${allFeedbacks.length} verified review${allFeedbacks.length > 1 ? "s" : ""}`),
    registrationsNote: agent.ratings?.registrationsNote,
    renewalNote: agent.ratings?.renewalNote,
  };

  const updated = await updateAgentRatings(agent.id, updatedRatings, `Merchant: ${businessName || session.identity}`);

  try {
    await saveActivityLog({
      action: `Agent feedback submitted: ${agent.name} (${score}★) by ${businessName || session.identity}`,
      category: "Review",
      actorName: businessName || session.identity,
      actorRole: "Business",
      details: `Merchant ${businessName || session.identity} rated field agent ${agent.name} ${score}/5 stars. Feedback: "${feedback || "No remarks"}". Business feedback score updated to ${genuinePercentage}%.`,
    });
  } catch {}

  try {
    await createServerNotification({
      title: `⭐ New Merchant Rating for ${agent.name}: ${score}★`,
      message: `${businessName || "A merchant"} submitted a ${score}-star rating for field agent ${agent.name}: "${feedback || "Great onboarding service!"}".`,
      type: "agent",
      targetRole: "Company",
      targetIdentity: "Company",
      linkText: "View Agents Directory",
      action: {
        type: "portal",
        payload: "Company",
        tab: "Agents",
      },
    });
  } catch {}

  return NextResponse.json({ success: true, agent: updated });
}
