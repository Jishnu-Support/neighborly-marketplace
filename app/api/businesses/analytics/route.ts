import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import {
  incrementBusinessViews,
  incrementSearchAppearances,
  getBusinessAnalytics,
  getBusinessByIdentity,
} from "@/app/lib/businesses";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      businessName?: string;
      businessNames?: string[];
      type?: "view" | "search";
    };

    if (body.type === "view" && body.businessName) {
      const stats = await incrementBusinessViews(body.businessName);
      return NextResponse.json({ success: true, ...stats }, { headers: noStoreHeaders });
    }

    if (body.type === "search" && Array.isArray(body.businessNames) && body.businessNames.length > 0) {
      await incrementSearchAppearances(body.businessNames);
      return NextResponse.json({ success: true, count: body.businessNames.length }, { headers: noStoreHeaders });
    }

    return NextResponse.json({ error: "Invalid analytics event payload." }, { status: 400, headers: noStoreHeaders });
  } catch (error) {
    console.error("POST /api/businesses/analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record analytics." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const url = new URL(request.url);
    let name = url.searchParams.get("name") || url.searchParams.get("businessName") || "";

    if (!name && session?.role === "Business" && session.identity) {
      const biz = await getBusinessByIdentity(session.identity);
      if (biz) name = biz.name;
      else name = session.identity;
    }

    if (!name) {
      return NextResponse.json({ profileViews: 0, searchAppearances: 0 }, { headers: noStoreHeaders });
    }

    const stats = await getBusinessAnalytics(name);
    return NextResponse.json(stats, { headers: noStoreHeaders });
  } catch (error) {
    console.error("GET /api/businesses/analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get analytics." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
