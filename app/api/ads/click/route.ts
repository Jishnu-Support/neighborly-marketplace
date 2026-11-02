import { NextResponse } from "next/server";
import { recordAdClick } from "@/app/lib/ad-bookings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adBookingId,
      action,
      customerId,
      viewerName,
      viewerPhone,
      locality,
      device,
    } = body;

    if (!adBookingId) {
      return NextResponse.json(
        { error: "adBookingId is required." },
        { status: 400 }
      );
    }

    const validAction: "call" | "whatsapp" | "view_store" | "navigate" =
      action === "whatsapp" || action === "call" || action === "navigate"
        ? action
        : "view_store";

    const result = await recordAdClick(String(adBookingId), validAction, {
      customerId: customerId ? String(customerId) : undefined,
      viewerName: viewerName ? String(viewerName) : undefined,
      viewerPhone: viewerPhone ? String(viewerPhone) : undefined,
      locality: locality ? String(locality) : undefined,
      device: device ? String(device) : undefined,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Ad booking not found or could not record lead click." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record ad click" },
      { status: 500 }
    );
  }
}
