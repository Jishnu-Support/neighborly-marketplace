import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readAgentRecords, updateAgentRatings } from "@/app/lib/agents";
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
  const percentageScore = score * 20;

  const records = await readAgentRecords();
  const agent = records.find(
    (a) => (agentId && a.id === agentId) || (agentReferralCode && a.referralCode === agentReferralCode) || a.referralCode === "JIT"
  );

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const currentBf = agent.ratings?.businessFeedback ?? 98;
  const newBf = Math.round((currentBf * 0.7) + (percentageScore * 0.3));

  const updatedRatings = {
    businessFeedback: newBf,
    registrationsCount: agent.ratings?.registrationsCount ?? 95,
    registrationRenewal: agent.ratings?.registrationRenewal ?? 100,
    feedbackNote: feedback ? `Merchant feedback from ${businessName || "Partner"}: "${feedback}" (${score}★)` : agent.ratings?.feedbackNote,
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
      details: `Merchant ${businessName || session.identity} rated field agent ${agent.name} ${score}/5 stars. Feedback: "${feedback || "No remarks"}". Business feedback score updated to ${newBf}%.`,
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
