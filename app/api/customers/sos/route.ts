import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { createSosAlert, findSosAlertByRequestKey, type SosEmergencyType } from "@/app/lib/sos-alerts";
import { createServerNotification } from "@/app/lib/notifications";

const recentRequests = new Map<string, number[]>();
const serviceNumbers: Record<SosEmergencyType, string> = {
  police: "100",
  medical: "108",
  fire: "101",
  "women-safety": "112",
  general: "112",
};
const validEmergencyTypes = new Set<string>(Object.keys(serviceNumbers));
const digits = (value: unknown) => (typeof value === "string" ? value.replace(/\D/g, "") : "");
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
  if (recent.length >= 8) return false;
  recentRequests.set(identity, [...recent, now]);
  return true;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  const identity = session?.identity || `guest-${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "mobile"}`;
  const profileRole = session?.role || "Account";

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 25_000) return NextResponse.json({ error: "The SOS request is too large." }, { status: 413, headers: noStore });
  let body: Record<string, unknown>;
  try {
    const parsed = (await request.json()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Enter valid SOS alert details." }, { status: 400, headers: noStore });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Enter valid SOS alert details." }, { status: 400, headers: noStore });
  }

  let customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
  if (!customerName) customerName = "Hosur Resident / Mobile Visitor";

  let customerPhone = digits(body.customerPhone);
  if (!customerPhone || customerPhone.length < 8) {
    customerPhone = "18001024589";
  }

  const rawType = typeof body.emergencyType === "string" ? body.emergencyType.toLowerCase() : "general";
  const emergencyType: SosEmergencyType = validEmergencyTypes.has(rawType)
    ? (rawType as SosEmergencyType)
    : "general";

  let emergencyPhones = Array.isArray(body.emergencyPhones) ? body.emergencyPhones.map(digits).filter(Boolean) : [];
  if (emergencyPhones.length === 0) {
    emergencyPhones = ["112", serviceNumbers[emergencyType] || "108"];
  } else if (emergencyPhones.length === 1) {
    emergencyPhones = [emergencyPhones[0], "112"];
  }

  const locationStatus = body.locationStatus === "shared" ? "shared" : "unavailable";
  const hasCoordinates = isCoordinate(body.latitude, -90, 90) && isCoordinate(body.longitude, -180, 180);
  const hasAccuracy =
    typeof body.accuracyMeters === "number" &&
    Number.isFinite(body.accuracyMeters) &&
    body.accuracyMeters >= 0 &&
    body.accuracyMeters <= 100_000;
  const isGpsValid = locationStatus === "shared" && hasCoordinates && hasAccuracy;

  const requestKey = isRequestKey(body.requestKey) ? body.requestKey : randomUUID();

  try {
    const priorAlert = await findSosAlertByRequestKey(identity, requestKey);
    if (priorAlert) {
      return NextResponse.json({ alert: priorAlert, duplicate: true }, { status: 200, headers: noStore });
    }
    if (!consumeRateLimit(identity)) {
      return NextResponse.json({ error: "Please wait before sending another SOS alert." }, { status: 429, headers: noStore });
    }

    const result = await createSosAlert(
      {
        customerName,
        profileRole,
        identity,
        emergencyType,
        serviceNumber: serviceNumbers[emergencyType],
        customerPhone,
        customerPhoneLast4: customerPhone.slice(-4),
        emergencyPhones: [emergencyPhones[0], emergencyPhones[1] || "112"],
        latitude: isGpsValid ? (body.latitude as number) : null,
        longitude: isGpsValid ? (body.longitude as number) : null,
        accuracyMeters: isGpsValid ? (body.accuracyMeters as number) : null,
        locationStatus: isGpsValid ? "shared" : "unavailable",
      },
      requestKey
    );

    return NextResponse.json({ alert: result.alert, duplicate: !result.created }, { status: result.created ? 201 : 200, headers: noStore });
  } catch {
    return NextResponse.json({ error: "Could not record the SOS alert. Please use your phone to call emergency services directly." }, { status: 500, headers: noStore });
  }
}
