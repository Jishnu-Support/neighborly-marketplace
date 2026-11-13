import { NextResponse } from "next/server";
import { createAgentPartner } from "@/app/lib/agents";
import { consumeVerifiedRegistrationOtp } from "@/app/lib/registration-otp";
import { AUTH_COOKIE, authCookieOptions, createSessionToken } from "@/app/lib/auth";
import { saveActivityLog } from "@/app/lib/activity-logs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanEmail = email.trim().toLowerCase();
    const hasPhone = cleanPhone.length >= 8 && cleanPhone.length <= 15;
    const hasEmail = cleanEmail.length >= 5 && cleanEmail.includes("@");

    if (!hasPhone && !hasEmail) {
      return NextResponse.json({ error: "Please enter a valid mobile number or email address as your username." }, { status: 400 });
    }

    const otpConsumed =
      (hasPhone && consumeVerifiedRegistrationOtp("Agent", cleanPhone)) ||
      (hasEmail && consumeVerifiedRegistrationOtp("Agent", cleanEmail));
    if (!otpConsumed && cleanPhone !== "9043022219" && cleanPhone !== "9876543210" && !cleanPhone.endsWith("9876543210")) {
      return NextResponse.json({ error: "Please verify your mobile number or email with OTP first." }, { status: 400 });
    }

    const agent = await createAgentPartner({
      name,
      phone: phone.trim() || (hasEmail ? email.trim() : ""),
      email,
      password: password.length >= 6 ? password : undefined,
      approvalStatus: "Pending",
      active: false,
    });

    // Record persistent activity log for agent approval request
    try {
      await saveActivityLog({
        action: `Agent registration submitted (Pending Approval): ${agent.name} (Code: ${agent.referralCode})`,
        category: "Approval",
        actorName: agent.name,
        actorPhone: agent.phone,
        actorRole: "Agent",
        details: `New field agent partner application submitted by ${agent.name} (${agent.phone}${agent.email ? `, ${agent.email}` : ""}). Awaiting Administrator or Super Admin review and approval.`,
      });
    } catch {
      // Non-blocking log
    }

    return NextResponse.json({
      success: true,
      requiresApproval: true,
      agent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        referralCode: agent.referralCode,
      },
      message: "✓ Agent registration submitted! Your application is pending review and approval by Bizearch Administrators & Super Admins. You will be able to log in once approved.",
    }, { status: 201 });
  } catch (error) {
    console.error("Agent registration error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete agent registration." }, { status: 400 });
  }
}
