import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { createSosAlert, findSosAlertByRequestKey, type SosEmergencyType } from "@/app/lib/sos-alerts";

const recentRequests = new Map<string, number[]>();
const serviceNumbers: Record<SosEmergencyType, string> = {
  police: "100",
  medical: "108",
  fire: "101",
  "women-safety": "112",
  general: "112",
};
const validEmergencyTypes = new Set<string>(Object.keys(serviceNumbers));
const digits = (value: unknown) => typeof value === "string" ? value.replace(/\D/g, "") : "";
const isCoordinate = (value: unknown, minimum: number, maximum: number) =>
  typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
const noStore = { "Cache-Control": "no-store" };

function isRequestKey(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function consumeRateLimit(identity: string) {
  const now = Date.now();
  for (const [key, timestamps] of recentRequests) {
    const current = timestamps.filter((timestamp) => now - timestamp < 60_000);
    if (current.length) recentRequests.set(key, current);
    else recentRequests.delete(key);
  }
  if (recentRequests.size > 5000) recentRequests.clear();
  const recent = recentRequests.get(identity) || [];
  if (recent.length >= 5) return false;
  recentRequests.set(identity, [...recent, now]);
  return true;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Sign in before sending an SOS alert." }, { status: 401, headers: noStore });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 10_000) return NextResponse.json({ error: "The SOS request is too large." }, { status: 413, headers: noStore });
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json() as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter valid SOS alert details." }, { status: 400, headers: noStore });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Enter valid SOS alert details." }, { status: 400, headers: noStore });
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerPhone = digits(body.customerPhone);
  const emergencyType = typeof body.emergencyType === "string" && validEmergencyTypes.has(body.emergencyType)
    ? body.emergencyType as SosEmergencyType
    : null;
  const emergencyPhones = Array.isArray(body.emergencyPhones) ? body.emergencyPhones.map(digits) : [];
  const locationStatus = body.locationStatus;
  const hasCoordinates = isCoordinate(body.latitude, -90, 90) && isCoordinate(body.longitude, -180, 180);
  const hasAccuracy = typeof body.accuracyMeters === "number" && Number.isFinite(body.accuracyMeters) &&
    body.accuracyMeters >= 0 && body.accuracyMeters <= 100_000;
  const unavailableLocation = locationStatus === "unavailable" &&
    (body.latitude === null || body.latitude === undefined) &&
    (body.longitude === null || body.longitude === undefined) &&
    (body.accuracyMeters === null || body.accuracyMeters === undefined);
  const validLocation = locationStatus === "shared" ? hasCoordinates && hasAccuracy : unavailableLocation;

  if (!isRequestKey(body.requestKey) || !emergencyType || !customerName || customerName.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(customerName) || customerPhone.length < 8 || customerPhone.length > 15 ||
    emergencyPhones.length !== 2 || emergencyPhones.some((phone) => phone.length < 8 || phone.length > 15) ||
    emergencyPhones[0] === emergencyPhones[1] || !validLocation) {
    return NextResponse.json({
      error: "Enter your name and valid mobile number, two different emergency contacts, a valid emergency type, and a valid location result.",
    }, { status: 400, headers: noStore });
  }

  try {
    const priorAlert = await findSosAlertByRequestKey(session.identity, body.requestKey);
    if (priorAlert) {
      return NextResponse.json({ alert: priorAlert, duplicate: true }, { status: 200, headers: noStore });
    }
    if (!consumeRateLimit(session.identity)) {
      return NextResponse.json({ error: "Please wait before sending another SOS alert." }, { status: 429, headers: noStore });
    }

    const result = await createSosAlert({
      customerName,
      profileRole: session.role,
      identity: session.identity,
      emergencyType,
      serviceNumber: serviceNumbers[emergencyType],
      customerPhone,
      customerPhoneLast4: customerPhone.slice(-4),
      emergencyPhones: emergencyPhones as [string, string],
      latitude: locationStatus === "shared" ? body.latitude as number : null,
      longitude: locationStatus === "shared" ? body.longitude as number : null,
      accuracyMeters: locationStatus === "shared" ? body.accuracyMeters as number : null,
      locationStatus: locationStatus as "shared" | "unavailable",
    }, body.requestKey);
    return NextResponse.json({ alert: result.alert, duplicate: !result.created }, { status: result.created ? 201 : 200, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Could not record the SOS alert. Use your phone to call emergency services now." }, { status: 500, headers: noStore });
  }
}
