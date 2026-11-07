import { NextResponse } from "next/server";
import { recordAdImpression, readAdBookings } from "@/app/lib/ad-bookings";
import { recordPlatformAdImpression } from "@/app/lib/ad-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adBookingId,
      adId,
      adTitle,
      businessName,
      surface = "poster",
      customerId,
      viewerName,
      viewerPhone,
      viewerRole,
      viewedDate,
      viewedTime,
      locality,
      device,
    } = body;

    const targetSurface: "poster" | "content" | "video" =
      surface === "video" ? "video" : surface === "content" ? "content" : "poster";

    const viewerDetails = {
      customerId: customerId ? String(customerId) : undefined,
      viewerName: viewerName ? String(viewerName) : undefined,
      viewerPhone: viewerPhone ? String(viewerPhone) : undefined,
      viewerRole: viewerRole ? String(viewerRole) : undefined,
      viewedDate: viewedDate ? String(viewedDate) : undefined,
      viewedTime: viewedTime ? String(viewedTime) : undefined,
      locality: locality ? String(locality) : undefined,
      device: device ? String(device) : undefined,
    };

    // 1. If adBookingId is given, check if it exists in booked ads
    if (adBookingId) {
      const bookings = await readAdBookings();
      const existing = bookings.find((b) => b.id === String(adBookingId));
      if (existing) {
        const result = await recordAdImpression(String(adBookingId), targetSurface, viewerDetails);
        if (result) {
          return NextResponse.json(result);
        }
      }
    }

    // 2. Otherwise, record as platform ad impression
    const platformResult = await recordPlatformAdImpression({
      adId: adId ? String(adId) : adBookingId ? String(adBookingId) : undefined,
      adTitle: adTitle ? String(adTitle) : undefined,
      businessName: businessName ? String(businessName) : undefined,
      surface: targetSurface,
      viewerDetails,
    });

    return NextResponse.json(platformResult);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record impression" },
      { status: 500 }
    );
  }
}
