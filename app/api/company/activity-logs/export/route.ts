import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readActivityLogs } from "@/app/lib/activity-logs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  // PDF Export
  if (format === "pdf") {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Header Branding
    doc.setFontSize(16);
    doc.setTextColor(21, 67, 38); // Forest Green
    doc.text("BIZEARCH.IN · Platform Activity Logs", 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 105);
    const filterDesc = `Filter Category: ${categoryFilter || "All"} | Filter Role: ${roleFilter || "All"} | Total Events: ${logs.length} | Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
    doc.text(filterDesc, 14, 21);

    const tableHeaders = [
      ["#", "Date & Time", "Category", "Action Summary", "Actor", "Role", "Phone", "Locality", "Details"],
    ];

    const tableBody = exportRows.map((r) => [
      r["S.No"],
      r["Date & Time"],
      r["Category"],
      r["Action Summary"],
      r["Actor Name"],
      r["Actor Role"],
      r["Actor Phone"],
      r["Locality"],
      r["Details"],
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableBody,
      startY: 25,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [21, 67, 38],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 248],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },  // #
        1: { cellWidth: 28 }, // Date & Time
        2: { cellWidth: 22 }, // Category
        3: { cellWidth: 50 }, // Action Summary
        4: { cellWidth: 26 }, // Actor Name
        5: { cellWidth: 18 }, // Actor Role
        6: { cellWidth: 24 }, // Actor Phone
        7: { cellWidth: 22 }, // Locality
        8: { cellWidth: "auto" }, // Details
      },
      didDrawPage: (data) => {
        // Footer with page number
        const pageCount = (doc.internal as any).getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(140, 150, 145);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount} — Bizearch Confidential Audit Log`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      },
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bizearch-activity-logs-${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // CSV Export
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

  // Default Excel (.xlsx) Export
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
