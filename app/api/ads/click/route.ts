import { NextResponse } from "next/server";
import { recordAdClick, readAdBookings } from "@/app/lib/ad-bookings";
import { recordPlatformAdClick } from "@/app/lib/ad-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adBookingId,
      adId,
      adTitle,
      businessName,
      action,
      customerId,
      viewerName,
      viewerPhone,
      locality,
      device,
    } = body;

    const validAction: "call" | "whatsapp" | "view_store" | "navigate" =
      action === "whatsapp" || action === "call" || action === "navigate"
        ? action
        : "view_store";

    const viewerDetails = {
      customerId: customerId ? String(customerId) : undefined,
      viewerName: viewerName ? String(viewerName) : undefined,
      viewerPhone: viewerPhone ? String(viewerPhone) : undefined,
      locality: locality ? String(locality) : undefined,
      device: device ? String(device) : undefined,
    };

    if (adBookingId) {
      const bookings = await readAdBookings();
      const existing = bookings.find((b) => b.id === String(adBookingId));
      if (existing) {
        const result = await recordAdClick(String(adBookingId), validAction, viewerDetails);
        if (result) {
          return NextResponse.json(result);
        }
      }
    }

    const platformResult = await recordPlatformAdClick({
      adId: adId ? String(adId) : adBookingId ? String(adBookingId) : undefined,
      adTitle: adTitle ? String(adTitle) : undefined,
      businessName: businessName ? String(businessName) : undefined,
      action: validAction,
      viewerDetails,
    });

    return NextResponse.json(platformResult);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record ad click" },
      { status: 500 }
    );
  }
}
