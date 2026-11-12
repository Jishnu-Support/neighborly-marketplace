import { NextResponse } from "next/server";
import { listRegisteredBusinesses } from "@/app/lib/businesses";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessParam = searchParams.get("business") || searchParams.get("name") || "";
  const idParam = searchParams.get("id") || "";

  let businesses: any[] = [];
  try {
    businesses = await listRegisteredBusinesses();
  } catch {
    businesses = [];
  }

  let found: any = null;
  if (idParam) {
    found = businesses.find((b) => b.id === idParam);
  }
  if (!found && businessParam) {
    found =
      businesses.find((b) => b.name?.toLowerCase() === businessParam.toLowerCase()) ||
      businesses.find((b) => b.name?.toLowerCase().includes(businessParam.toLowerCase()));
  }

  const name = found?.name || businessParam || "Jishnu Infotech Private Limited";
  const sector = found?.category || searchParams.get("category") || "IT & Software Solutions";
  const address =
    (found?.address
      ? typeof found.address === "string"
        ? found.address
        : Object.values(found.address).filter(Boolean).join(", ")
      : searchParams.get("address")) || "NGGO's Colony, Hosur";
  const phone = found?.phone || searchParams.get("phone") || "+91 90430 22219";
  const agentName =
    searchParams.get("agent") ||
    found?.assignedAgentName ||
    found?.agentVerification?.agentName ||
    "JIT";

  // Deterministic certificate number
  const num = Math.abs(
    name.split("").reduce((acc: number, c: string) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  const certNumber =
    searchParams.get("certId") ||
    `BZR-JIT-2026-${String(1 + (num % 9999)).padStart(5, "0")}`;

  const certPayload = {
    certificate: {
      title: "Certificate of Verification",
      program: "Bizearch Business Accreditation",
      certificate_number: certNumber,
      status: "Verified Business",
      issued_by: "Jishnu Infotech Private Limited",
      platform: "Bizearch.in",
      business: {
        name,
        sector,
        address,
        phone,
      },
      verification: {
        type: "On-Ground Physical Audit",
        scope: [
          "Physical premises verification",
          "Business identity validation",
          "Service assessment",
        ],
        status: "Successfully Verified",
        date: "2026-11-12",
        valid_until: "2027-03-31",
        jurisdiction: "Hosur Division, Tamil Nadu",
      },
      recognition: {
        badge: "Bizearch Verified Business",
        description:
          "Official recognition of a business verified through the Bizearch.in verification process.",
      },
      signatories: [
        {
          name: agentName,
          designation: "Agent",
          organization: "Bizearch.in",
        },
        {
          name: "G. Venkatesan",
          designation: "Director - Trust & Verification",
          organization: "Bizearch.in",
        },
      ],
      verification_qr: {
        enabled: true,
        url: "https://bizearch.in/verify",
        purpose: "View business profile and certificate verification details",
      },
      design: {
        orientation: "Landscape",
        background: "Ivory Cream",
        primary_color: "Navy Blue",
        secondary_color: "Gold",
        border: "Double Decorative Gold and Navy Border",
        seal: "Bizearch Verified Business Gold Seal",
      },
    },
  };

  return NextResponse.json(certPayload, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
