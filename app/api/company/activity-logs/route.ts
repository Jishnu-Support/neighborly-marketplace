import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { listActivityLogs } from "@/app/lib/activity-logs";

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
  const category = searchParams.get("category") || "All";
  const role = searchParams.get("role") || "All";
  const query = searchParams.get("query") || "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 250;

  const result = await listActivityLogs({ category, role, query, limit });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
