import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readActivityLogs } from "@/app/lib/activity-logs";
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
  const categoryFilter = searchParams.get("category");
  const roleFilter = searchParams.get("role");

  let logs = await readActivityLogs();
  if (categoryFilter && categoryFilter !== "All") {
    logs = logs.filter((l) => l.category.toLowerCase() === categoryFilter.toLowerCase());
  }
  if (roleFilter && roleFilter !== "All") {
    logs = logs.filter((l) => l.actorRole.toLowerCase() === roleFilter.toLowerCase());
  }

  const exportRows = logs.map((l, index) => ({
    "S.No": index + 1,
    "Event ID": l.id,
    "Date & Time": new Date(l.timestamp).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }),
    "Category": l.category,
    "Action Summary": l.action,
    "Actor Name": l.actorName,
    "Actor Role": l.actorRole,
    "Actor Phone": l.actorPhone || "N/A",
    "Locality": l.locality || "Hosur",
    "Details": l.details || "",
  }));

  if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bizearch-activity-logs-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);

  ws["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Event ID
    { wch: 22 }, // Date & Time
    { wch: 15 }, // Category
    { wch: 45 }, // Action Summary
    { wch: 22 }, // Actor Name
    { wch: 15 }, // Actor Role
    { wch: 18 }, // Actor Phone
    { wch: 20 }, // Locality
    { wch: 55 }, // Details
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bizearch-activity-logs-${Date.now()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
