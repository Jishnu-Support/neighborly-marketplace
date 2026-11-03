import { NextResponse } from "next/server";
import { createAgentPartner } from "@/app/lib/agents";
import { consumeVerifiedRegistrationOtp } from "@/app/lib/registration-otp";

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
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    }

    if (!consumeVerifiedRegistrationOtp("Agent", cleanPhone)) {
      return NextResponse.json({ error: "Please verify your mobile number with OTP first." }, { status: 400 });
    }

    const agent = await createAgentPartner({
      name,
      phone,
      email,
      password: password.length >= 6 ? password : undefined,
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        referralCode: agent.referralCode,
      },
      message: `✓ Agent application approved! Your referral code is ${agent.referralCode}.`,
    }, { status: 201 });
  } catch (error) {
    console.error("Agent registration error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete agent registration." }, { status: 400 });
  }
}
