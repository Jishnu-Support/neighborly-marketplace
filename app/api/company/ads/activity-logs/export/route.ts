import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { readAdActivityLogs } from "@/app/lib/ad-activity-logs";
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
  const typeFilter = searchParams.get("type");
  const surfaceFilter = searchParams.get("surface");

  let logs = await readAdActivityLogs();
  if (typeFilter && typeFilter !== "All") {
    logs = logs.filter((l) => l.type.toLowerCase() === typeFilter.toLowerCase());
  }
  if (surfaceFilter && surfaceFilter !== "All") {
    logs = logs.filter((l) => l.surface?.toLowerCase().includes(surfaceFilter.toLowerCase()));
  }

  const exportRows = logs.map((l, index) => ({
    "S.No": index + 1,
    "Event ID": l.id,
    "Date & Time": new Date(l.timestamp).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }),
    "Event Type": l.type,
    "Campaign / Business": l.businessName,
    "Campaign Title": l.campaignTitle,
    "Action Summary": l.action,
    "Surface / Placement": l.surface || "Banner",
    "Actor / Lead": l.actorName,
    "Phone / Contact": l.actorPhone || "N/A",
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
    doc.setTextColor(194, 65, 12); // Rust / Warm Amber
    doc.text("BIZEARCH.IN · Advertisement Activity Logs", 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 105);
    const filterDesc = `Event Type: ${typeFilter || "All"} | Surface: ${surfaceFilter || "All"} | Total Ad Records: ${logs.length} | Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
    doc.text(filterDesc, 14, 21);

    const tableHeaders = [
      ["#", "Date & Time", "Type", "Business", "Campaign", "Surface", "Lead / Actor", "Phone", "Action Summary"],
    ];

    const tableBody = exportRows.map((r) => [
      r["S.No"],
      r["Date & Time"],
      r["Event Type"],
      r["Campaign / Business"],
      r["Campaign Title"],
      r["Surface / Placement"],
      r["Actor / Lead"],
      r["Phone / Contact"],
      r["Action Summary"],
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
        fillColor: [194, 65, 12],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [255, 251, 235],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },  // #
        1: { cellWidth: 28 }, // Date & Time
        2: { cellWidth: 20 }, // Type
        3: { cellWidth: 32 }, // Business
        4: { cellWidth: 35 }, // Campaign
        5: { cellWidth: 28 }, // Surface
        6: { cellWidth: 26 }, // Lead / Actor
        7: { cellWidth: 24 }, // Phone
        8: { cellWidth: "auto" }, // Action Summary
      },
      didDrawPage: (data) => {
        const pageCount = (doc.internal as any).getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(140, 150, 145);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount} — Bizearch Advertisement Performance Audit Log`,
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
        "Content-Disposition": `attachment; filename="bizearch-ads-activity-logs-${Date.now()}.pdf"`,
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
        "Content-Disposition": `attachment; filename="bizearch-ads-activity-logs-${Date.now()}.csv"`,
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
    { wch: 15 }, // Event Type
    { wch: 25 }, // Campaign / Business
    { wch: 25 }, // Campaign Title
    { wch: 40 }, // Action Summary
    { wch: 25 }, // Surface / Placement
    { wch: 20 }, // Actor / Lead
    { wch: 18 }, // Phone / Contact
    { wch: 20 }, // Locality
    { wch: 45 }, // Details
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Ads Activity Logs");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bizearch-ads-activity-logs-${Date.now()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
