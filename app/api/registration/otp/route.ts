import { NextResponse } from "next/server";
import { consumeVerifiedRegistrationOtp, issueRegistrationOtp, validRegistrationRole, verifyRegistrationOtp } from "@/app/lib/registration-otp";

const digits = (value: unknown) => typeof value === "string" ? value.replace(/\D/g, "") : "";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: unknown; role?: unknown; phone?: unknown; code?: unknown };
    if (!validRegistrationRole(body.role)) return NextResponse.json({ error: "Choose a valid registration type." }, { status: 400 });
    const phone = digits(body.phone);
    if (phone.length < 8 || phone.length > 15) return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });

    if (body.action === "send") {
      if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "SMS delivery is not configured. Contact the platform administrator." }, { status: 503 });
      const demoCode = issueRegistrationOtp(body.role, phone);
      return NextResponse.json({ sent: true, demoCode, demoOnly: true, expiresInSeconds: 300 }, { headers: { "Cache-Control": "no-store" } });
    }
    if (body.action === "verify") {
      const code = typeof body.code === "string" ? body.code.trim() : "";
      if (!/^\d{6}$/.test(code) || !verifyRegistrationOtp(body.role, phone, code)) {
        return NextResponse.json({ error: "That OTP is incorrect or expired. Request a new code and try again." }, { status: 400 });
      }
      return NextResponse.json({ verified: true, expiresInSeconds: 600 }, { headers: { "Cache-Control": "no-store" } });
    }
    if (body.action === "consume") {
      if (!consumeVerifiedRegistrationOtp(body.role, phone)) return NextResponse.json({ error: "Verify your mobile number before submitting registration." }, { status: 400 });
      return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ error: "Choose send, verify or consume." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process OTP request." }, { status: 429 });
  }
}
