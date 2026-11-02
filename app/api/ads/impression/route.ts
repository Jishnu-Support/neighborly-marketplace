import { NextResponse } from "next/server";
import { recordAdImpression } from "@/app/lib/ad-bookings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adBookingId, surface } = body;

    if (!adBookingId || !surface) {
      return NextResponse.json(
        { error: "adBookingId and surface are required." },
        { status: 400 }
      );
    }

    const result = await recordAdImpression(
      String(adBookingId),
      surface === "video" ? "video" : surface === "content" ? "content" : "poster"
    );

    if (!result) {
      return NextResponse.json(
        { error: "Ad booking not found or could not be updated." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record impression" },
      { status: 500 }
    );
  }
}
