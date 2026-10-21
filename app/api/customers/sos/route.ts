import { NextResponse } from "next/server";
import { createSosAlert } from "@/app/lib/sos-alerts";

const recentRequests = new Map<string, number[]>();
const serviceNumbers = { police: "100", medical: "108", fire: "101", "women-safety": "112", general: "112" } as const;
const digits = (value: unknown) => typeof value === "string" ? value.replace(/\D/g, "") : "";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (recentRequests.get(forwarded) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 5) return NextResponse.json({ error: "Please wait before sending another SOS alert." }, { status: 429 });
  recentRequests.set(forwarded, [...recent, now]);
  try {
    const body = await request.json() as Record<string, unknown>;
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerPhone = digits(body.customerPhone);
    const profileRole = body.profileRole;
    const emergencyType = body.emergencyType;
    const serviceNumber = typeof emergencyType === "string" && emergencyType in serviceNumbers ? serviceNumbers[emergencyType as keyof typeof serviceNumbers] : "";
    const emergencyPhones = Array.isArray(body.emergencyPhones) ? body.emergencyPhones.map(digits) : [];
    const locationStatus = body.locationStatus;
    const hasCoords = typeof body.latitude === "number" && Number.isFinite(body.latitude) && body.latitude >= -90 && body.latitude <= 90 &&
      typeof body.longitude === "number" && Number.isFinite(body.longitude) && body.longitude >= -180 && body.longitude <= 180;
    const validAccuracy = body.accuracyMeters === null || (typeof body.accuracyMeters === "number" && Number.isFinite(body.accuracyMeters) && body.accuracyMeters >= 0 && body.accuracyMeters <= 100_000);
    if (!serviceNumber || (profileRole !== "Account" && profileRole !== "Business" && profileRole !== "Agent" && profileRole !== "Company") || !customerName || customerName.length > 100 || customerPhone.length < 8 || customerPhone.length > 15 ||
      emergencyPhones.length !== 2 || emergencyPhones.some((phone) => phone.length < 8 || phone.length > 15) || emergencyPhones[0] === emergencyPhones[1] ||
      (locationStatus !== "shared" && locationStatus !== "unavailable") || (locationStatus === "shared" && !hasCoords) || !validAccuracy) {
      return NextResponse.json({ error: "Enter the customer details and two different emergency numbers. Allow location access to include exact coordinates." }, { status: 400 });
    }
    const alert = await createSosAlert({
      customerName,
      profileRole,
      emergencyType: emergencyType as keyof typeof serviceNumbers,
      serviceNumber,
      customerPhoneLast4: customerPhone.slice(-4),
      emergencyPhones: emergencyPhones as [string, string],
      latitude: hasCoords ? body.latitude as number : null,
      longitude: hasCoords ? body.longitude as number : null,
      accuracyMeters: hasCoords && typeof body.accuracyMeters === "number" ? body.accuracyMeters : null,
      locationStatus,
    });
    return NextResponse.json({ alert: { id: alert.id, locationStatus: alert.locationStatus, createdAt: alert.createdAt, serviceNumber: alert.serviceNumber } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not record the SOS alert. Use your phone to call emergency services now." }, { status: 500 });
  }
}
