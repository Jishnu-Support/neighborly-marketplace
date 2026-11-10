import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import {
  listAdActivityLogs,
  clearAllAdActivityLogs,
} from "@/app/lib/ad-activity-logs";

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
  const type = searchParams.get("type") || undefined;
  const surface = searchParams.get("surface") || undefined;
  const query = searchParams.get("query") || undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

  const result = await listAdActivityLogs({ type, surface, query, limit });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (session?.role !== "Company" || session.accessLevel !== "Super Admin") {
    return NextResponse.json(
      { error: "Super Admin authorization required to manage ad activity logs." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === "clear") {
      await clearAllAdActivityLogs();
      const result = await listAdActivityLogs();
      return NextResponse.json({ message: "All ad activity logs cleared successfully.", ...result });
    }
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request." },
      { status: 500 }
    );
  }
}
