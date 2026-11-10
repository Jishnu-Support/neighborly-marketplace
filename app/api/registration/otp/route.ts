import { NextResponse } from "next/server";
import { consumeVerifiedRegistrationOtp, issueRegistrationOtp, normalizeRegistrationIdentity, validRegistrationRole, verifyRegistrationOtp } from "@/app/lib/registration-otp";

const digits = (value: unknown) => typeof value === "string" ? value.replace(/\D/g, "") : "";

async function sendRealSms(phone: string, code: string): Promise<"twilio" | "msg91" | null> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_FROM?.trim();

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const formattedTo = phone.startsWith("+") ? phone : `+${phone}`;
      const form = new URLSearchParams({
        To: formattedTo,
        From: twilioFrom,
        Body: `Your Bizearch verification code is ${code}. It expires in 5 minutes.`,
      });
      const basic = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          authorization: `Basic ${basic}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: form,
      });
      if (res.ok) return "twilio";
      console.error("Twilio SMS send failed:", await res.text());
    } catch (err) {
      console.error("Twilio request error:", err);
    }
  }

  const msg91Auth = process.env.MSG91_AUTH_KEY?.trim();
  const msg91Template = process.env.MSG91_TEMPLATE_ID?.trim();
  const msg91Sender = process.env.MSG91_SENDER_ID?.trim();

  if (msg91Auth && msg91Template && msg91Sender) {
    try {
      const cleanMobile = phone.replace(/^\+/, "");
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          authkey: msg91Auth,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          template_id: msg91Template,
          sender: msg91Sender,
          recipients: [{ mobiles: cleanMobile, otp: code }],
        }),
      });
      if (res.ok) return "msg91";
      console.error("MSG91 SMS send failed:", await res.text());
    } catch (err) {
      console.error("MSG91 request error:", err);
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: unknown; role?: unknown; phone?: unknown; identity?: unknown; email?: unknown; code?: unknown };
    if (!validRegistrationRole(body.role)) return NextResponse.json({ error: "Choose a valid registration type." }, { status: 400 });

    const rawInput = String(body.identity || body.phone || body.email || "").trim();
    const isEmail = rawInput.includes("@");
    const cleanPhone = digits(rawInput);

    if (isEmail) {
      if (rawInput.length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInput)) {
        return NextResponse.json({ error: "Enter a valid email address as your username." }, { status: 400 });
      }
    } else {
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return NextResponse.json({ error: "Enter a valid mobile number or email address as your username." }, { status: 400 });
      }
    }

    const identifier = normalizeRegistrationIdentity(rawInput);

    if (body.action === "send") {
      const code = issueRegistrationOtp(body.role, identifier);
      let deliveryProvider: "twilio" | "msg91" | null = null;
      if (!isEmail) {
        deliveryProvider = await sendRealSms(cleanPhone, code);
      }

      if (deliveryProvider) {
        return NextResponse.json(
          { sent: true, provider: deliveryProvider, expiresInSeconds: 300 },
          { headers: { "Cache-Control": "no-store" } }
        );
      }

      // If no external SMS gateway is configured (or if email), provide the instant OTP code
      return NextResponse.json(
        {
          sent: true,
          demoCode: code,
          demoOnly: true,
          expiresInSeconds: 300,
          notice: isEmail
            ? `Verification code for ${identifier}`
            : "SMS Gateway not configured; using instant verification code.",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (body.action === "verify") {
      const code = typeof body.code === "string" ? body.code.trim() : "";
      if (!/^\d{6}$/.test(code) || !verifyRegistrationOtp(body.role, identifier, code)) {
        return NextResponse.json({ error: "That OTP is incorrect or expired. Request a new code and try again." }, { status: 400 });
      }
      return NextResponse.json({ verified: true, expiresInSeconds: 600, message: "Username verified successfully." }, { headers: { "Cache-Control": "no-store" } });
    }

    if (body.action === "consume") {
      if (!consumeVerifiedRegistrationOtp(body.role, identifier)) {
        return NextResponse.json({ error: "Verify your mobile number or email username before submitting registration." }, { status: 400 });
      }
      return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ error: "Choose send, verify or consume." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process OTP request." }, { status: 429 });
  }
}
