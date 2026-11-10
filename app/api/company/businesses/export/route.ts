import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readBusinessRecords } from "@/app/lib/businesses";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const session = await getCurrentSession(request);
  if (
    session?.role !== "Company" ||
    (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")
  ) {
    return NextResponse.json(
      { error: "Company Admin or Super Admin access is required." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "xlsx").toLowerCase();

  const allRecords = await readBusinessRecords();
  // Filter active approved businesses
  const liveBusinesses = allRecords.filter(
    (b) => b.active && (b.verificationStatus === "Approved" || !b.verificationStatus)
  );

  const exportRows = liveBusinesses.map((b, index) => {
    const addr = b.address || ({} as any);
    const fullAddress = [
      addr.doorNumber,
      addr.street,
      addr.area,
      addr.cityTown,
      addr.district,
      addr.state,
      addr.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      "S.No": index + 1,
      "Business ID": b.id,
      "Business Name": b.name,
      "Primary Sector": b.category,
      "Mobile / Phone": b.phone || "N/A",
      "Emergency Contact": b.emergencyPhone || "N/A",
      "Email Address": b.email || "N/A",
      "Owner / Contact Person": b.ownerName || "N/A",
      "GSTIN / Tax ID": b.gstin || "N/A",
      "Entity Type": b.entityType || "Sole Proprietorship",
      "Verification Status": b.verificationStatus || "Approved",
      "Assigned Agent": b.assignedAgentName || "Company Direct",
      "Catalogue Products Count": (b.products || []).length,
      "Door / Shop No": addr.doorNumber || "",
      "Street / Road": addr.street || "",
      "Locality / Area": addr.area || "",
      "City": addr.cityTown || "Hosur",
      "PIN Code": addr.pincode || "635109",
      "Full Address": fullAddress || "Hosur, Tamil Nadu",
      "GPS Latitude": b.coordinates?.latitude ?? "N/A",
      "GPS Longitude": b.coordinates?.longitude ?? "N/A",
      "Google Maps Link":
        b.coordinates?.latitude && b.coordinates?.longitude
          ? `https://www.google.com/maps?q=${b.coordinates.latitude},${b.coordinates.longitude}`
          : "N/A",
      "Website": b.website || "N/A",
      "Registration Date": b.createdAt
        ? new Date(b.createdAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "N/A",
    };
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const count = liveBusinesses.length;

  if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bizearch-registered-businesses-${count}-records-${timestamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);

  ws["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Business ID
    { wch: 30 }, // Business Name
    { wch: 25 }, // Sector
    { wch: 18 }, // Phone
    { wch: 18 }, // Emergency
    { wch: 25 }, // Email
    { wch: 22 }, // Owner Name
    { wch: 20 }, // GSTIN
    { wch: 20 }, // Entity Type
    { wch: 18 }, // Status
    { wch: 22 }, // Agent
    { wch: 12 }, // Products
    { wch: 15 }, // Door No
    { wch: 25 }, // Street
    { wch: 20 }, // Locality
    { wch: 14 }, // City
    { wch: 12 }, // PIN
    { wch: 45 }, // Full Address
    { wch: 15 }, // Lat
    { wch: 15 }, // Lng
    { wch: 40 }, // Google Maps Link
    { wch: 25 }, // Website
    { wch: 22 }, // Registered At
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Registered Businesses");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bizearch-registered-businesses-${count}-records-${timestamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
