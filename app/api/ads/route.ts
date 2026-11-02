import { NextResponse } from "next/server";
import { readAdConfig } from "@/app/lib/ad-config";
import { readAdBookings, resolveScheduledAds } from "@/app/lib/ad-bookings";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hourParam = searchParams.get("hour");
    const simulatedHour = hourParam !== null ? parseInt(hourParam, 10) : undefined;

    const [rawConfig, bookings] = await Promise.all([
      readAdConfig(),
      readAdBookings(),
    ]);

    const activeResolvedConfig = resolveScheduledAds(
      rawConfig,
      bookings,
      new Date(),
      simulatedHour
    );

    return NextResponse.json(
      {
        config: activeResolvedConfig,
        rawConfig,
        bookings,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error in GET /api/ads:", error);
    const fallback = await readAdConfig();
    return NextResponse.json({ config: fallback }, { headers: { "Cache-Control": "no-store" } });
  }
}
