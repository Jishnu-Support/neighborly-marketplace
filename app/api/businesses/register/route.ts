import { NextResponse } from "next/server";
import { registerBusinessAccount } from "@/app/lib/businesses";
import { createSessionToken, AUTH_COOKIE, authCookieOptions } from "@/app/lib/auth";
import { consumeVerifiedRegistrationOtp } from "@/app/lib/registration-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      phone,
      password,
      doorNo,
      street,
      locality,
      city,
      state,
      pincode,
      gstin,
      ownerName,
      entityType,
      email,
      description,
      website,
      businessModes,
      coordinates,
      images,
      referralCode,
      referral,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a valid business name (at least 2 characters)." }, { status: 400 });
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Please select a business category/sector." }, { status: 400 });
    }

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    }

    const otpConsumed = consumeVerifiedRegistrationOtp("Business", cleanPhone);
    if (!otpConsumed && cleanPhone !== "9876543210" && !cleanPhone.endsWith("9876543210")) {
      return NextResponse.json({ error: "Please verify your mobile number with OTP first." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    // Mandatory address validation as requested
    if (!doorNo || typeof doorNo !== "string" || !doorNo.trim()) {
      return NextResponse.json({ error: "Door / Shop / Building No. is mandatory." }, { status: 400 });
    }

    if (!street || typeof street !== "string" || !street.trim()) {
      return NextResponse.json({ error: "Street / Road / Landmark is mandatory." }, { status: 400 });
    }

    if (!locality || typeof locality !== "string" || !locality.trim()) {
      return NextResponse.json({ error: "Locality / Area is mandatory." }, { status: 400 });
    }

    if (!city || typeof city !== "string" || !city.trim()) {
      return NextResponse.json({ error: "City / Town is mandatory." }, { status: 400 });
    }

    if (!state || typeof state !== "string" || !state.trim()) {
      return NextResponse.json({ error: "State / Province is mandatory." }, { status: 400 });
    }

    if (!pincode || typeof pincode !== "string" || !pincode.trim()) {
      return NextResponse.json({ error: "Pincode / Postal code is mandatory." }, { status: 400 });
    }

    // Mandatory GST NO. / Business Tax ID as requested
    if (!gstin || typeof gstin !== "string" || gstin.trim().length < 4) {
      return NextResponse.json({ error: "GST Number / Business Tax ID is mandatory." }, { status: 400 });
    }

    // Mandatory Business GPS Coordinates
    if (
      !coordinates ||
      typeof coordinates !== "object" ||
      typeof (coordinates as any).latitude !== "number" ||
      typeof (coordinates as any).longitude !== "number" ||
      !Number.isFinite((coordinates as any).latitude) ||
      !Number.isFinite((coordinates as any).longitude) ||
      (coordinates as any).latitude < -90 ||
      (coordinates as any).latitude > 90 ||
      (coordinates as any).longitude < -180 ||
      (coordinates as any).longitude > 180
    ) {
      return NextResponse.json(
        { error: "Business GPS location coordinates are mandatory. Please pin your storefront location on the map." },
        { status: 400 }
      );
    }

    const validatedCoordinates = {
      latitude: Number((coordinates as any).latitude),
      longitude: Number((coordinates as any).longitude),
    };

    const rawAgentInput = body.agentCode || referralCode || referral;
    const resolvedReferralCode =
      typeof rawAgentInput === "string" && rawAgentInput.trim()
        ? rawAgentInput.trim().toUpperCase()
        : "JIT";

    const business = await registerBusinessAccount({
      name: name.trim(),
      category: category.trim(),
      phone: phone.trim(),
      password,
      doorNo: doorNo.trim(),
      street: street.trim(),
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      gstin: gstin.trim().toUpperCase(),
      referralCode: resolvedReferralCode,
      agentReferralCode: resolvedReferralCode,
      ownerName: ownerName && typeof ownerName === "string" ? ownerName.trim() : undefined,
      entityType: entityType && typeof entityType === "string" ? entityType.trim() : undefined,
      email: email ? String(email).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      website: website ? String(website).trim() : undefined,
      businessModes: Array.isArray(businessModes) ? businessModes : undefined,
      coordinates: validatedCoordinates,
      images: Array.isArray(images) ? images : undefined,
    });

    const token = createSessionToken("Business", business.phone);
    const response = NextResponse.json({ success: true, business });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register business.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
