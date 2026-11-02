import { NextResponse } from "next/server";
import { saveCustomerRegistrationLocation } from "@/app/lib/customer-locations";
import { consumeVerifiedRegistrationOtp } from "@/app/lib/registration-otp";
import { AUTH_COOKIE, authCookieOptions, createSessionToken, registerCustomerAccount } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: unknown;
      phone?: unknown;
      password?: unknown;
      email?: unknown;
      locationStatus?: unknown;
      latitude?: unknown;
      longitude?: unknown;
    };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const locationStatus = body.locationStatus;
    const shared = locationStatus === "shared";
    const denied = locationStatus === "denied";
    const unavailable = locationStatus === "unavailable";
    const validCoordinates = typeof body.latitude === "number" && Number.isFinite(body.latitude) && body.latitude >= -90 && body.latitude <= 90 &&
      typeof body.longitude === "number" && Number.isFinite(body.longitude) && body.longitude >= -180 && body.longitude <= 180;
    if (!name || name.length > 100 || phone.length < 8 || phone.length > 15 || (!shared && !denied && !unavailable) || (shared && !validCoordinates)) {
      return NextResponse.json({ error: "Enter a valid name, mobile number and registration location status." }, { status: 400 });
    }
    if (!consumeVerifiedRegistrationOtp("Account", phone)) {
      return NextResponse.json({ error: "Verify your mobile number with the OTP before submitting registration." }, { status: 400 });
    }

    // Register and activate customer account credentials
    const customerAccount = await registerCustomerAccount({
      name,
      phone,
      password: password.length >= 6 ? password : "Neighbor123!",
      email,
    });

    const record = await saveCustomerRegistrationLocation({
      name,
      phoneLast4: phone.slice(-4),
      locationStatus: locationStatus as "shared" | "denied" | "unavailable",
      latitude: shared ? body.latitude as number : null,
      longitude: shared ? body.longitude as number : null,
      verificationStatus: "Active · Mobile verified",
    });

    const response = NextResponse.json({
      success: true,
      message: `Account activated! Welcome to Bizearch, ${name}.`,
      registration: { id: record.id, verificationStatus: record.verificationStatus },
      customer: customerAccount,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });

    // Set authenticated session cookie immediately
    response.cookies.set(AUTH_COOKIE, createSessionToken("Account", phone), authCookieOptions);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete registration. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
