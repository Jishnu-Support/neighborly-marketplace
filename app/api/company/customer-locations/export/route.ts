import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { listCustomerRegistrationLocations } from "@/app/lib/customer-locations";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const session = await getCurrentSession();
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

  const registrations = await listCustomerRegistrationLocations();

  const exportRows = registrations.map((r, index) => ({
    "S.No": index + 1,
    "Customer ID": r.id,
    "Customer Name": r.name,
    "Mobile Number": r.phone || (r.phoneLast4 ? `Ending ${r.phoneLast4}` : ""),
    "Email Address": r.email || "N/A",
    "Registration Status": r.verificationStatus,
    "Registration Method": r.registrationMethod || "Mobile OTP + Password",
    "Registration Date & Time": new Date(r.registeredAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }),
    "Door No / Flat": r.doorNo || "",
    "Street / Area": r.street || "",
    "Locality": r.locality,
    "City": r.city || "Hosur",
    "PIN Code": r.pincode || "635109",
    "Full Address": r.address || `${r.locality}, Hosur`,
    "Location Consent Status": r.locationStatus === "shared"
      ? "Location Shared (GPS Coordinates Captured)"
      : r.locationStatus === "denied"
      ? "Location Denied by Customer"
      : "GPS Unavailable",
    "GPS Latitude": r.latitude !== null ? r.latitude : "N/A",
    "GPS Longitude": r.longitude !== null ? r.longitude : "N/A",
    "Google Maps Link": r.latitude !== null && r.longitude !== null
      ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}`
      : "N/A",
    "Emergency Contact 1": (r.emergencyPhones && r.emergencyPhones[0])
      ? `${(r.emergencyNames && r.emergencyNames[0]) || "Contact 1"}: ${r.emergencyPhones[0]}`
      : "N/A",
    "Emergency Contact 2": (r.emergencyPhones && r.emergencyPhones[1])
      ? `${(r.emergencyNames && r.emergencyNames[1]) || "Contact 2"}: ${r.emergencyPhones[1]}`
      : "N/A",
  }));

  if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bizearch-registered-customers-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);

  ws["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Customer ID
    { wch: 22 }, // Customer Name
    { wch: 18 }, // Mobile Number
    { wch: 25 }, // Email
    { wch: 26 }, // Registration Status
    { wch: 32 }, // Registration Method
    { wch: 24 }, // Registered At
    { wch: 15 }, // Door No
    { wch: 25 }, // Street
    { wch: 20 }, // Locality
    { wch: 12 }, // City
    { wch: 12 }, // PIN
    { wch: 45 }, // Full Address
    { wch: 35 }, // Location Status
    { wch: 15 }, // Lat
    { wch: 15 }, // Lng
    { wch: 40 }, // Google Maps Link
    { wch: 30 }, // Emergency 1
    { wch: 30 }, // Emergency 2
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Registered Customers");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bizearch-registered-customers-${Date.now()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
