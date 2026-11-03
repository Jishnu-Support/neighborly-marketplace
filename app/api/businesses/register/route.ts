import { NextResponse } from "next/server";
import { registerBusinessAccount } from "@/app/lib/businesses";
import { createSessionToken, AUTH_COOKIE, authCookieOptions } from "@/app/lib/auth";
import { consumeVerifiedRegistrationOtp } from "@/app/lib/registration-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, phone, password, locality, email, doorNo, street, pincode, description, website, gstin } = body;

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

    if (!consumeVerifiedRegistrationOtp("Business", cleanPhone)) {
      return NextResponse.json({ error: "Please verify your mobile number with OTP first." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    if (!locality || typeof locality !== "string" || !locality.trim()) {
      return NextResponse.json({ error: "Please provide your business locality / area in Hosur." }, { status: 400 });
    }

    const business = await registerBusinessAccount({
      name: name.trim(),
      category: category.trim(),
      phone: phone.trim(),
      password,
      locality: locality.trim(),
      email: email ? String(email).trim() : undefined,
      doorNo: doorNo ? String(doorNo).trim() : undefined,
      street: street ? String(street).trim() : undefined,
      pincode: pincode ? String(pincode).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      website: website ? String(website).trim() : undefined,
      gstin: gstin ? String(gstin).trim() : undefined,
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
