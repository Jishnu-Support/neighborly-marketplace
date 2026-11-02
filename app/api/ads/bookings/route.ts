import { NextResponse } from "next/server";
import {
  createAdBooking,
  readAdBookings,
  updateAdBooking,
} from "@/app/lib/ad-bookings";
import { type AdFormat, type AdSlotTiming, AD_TIME_SLOTS } from "@/app/lib/ad-booking.shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessName = searchParams.get("businessName");
    const bookings = await readAdBookings();

    if (businessName) {
      const filtered = bookings.filter(
        (b) => b.businessName.toLowerCase() === businessName.toLowerCase()
      );
      return NextResponse.json({ bookings: filtered }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ bookings }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessName,
      contactName,
      contactPhone,
      format,
      slotTiming,
      customStartHour,
      customEndHour,
      startDate,
      endDate,
      durationDays,
      poster,
      content,
      video,
      paymentMethod,
      transactionId,
      status,
      notes,
    } = body;

    if (!businessName || !contactPhone || !format || !slotTiming || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required booking details (business, phone, format, slotTiming, dates)." },
        { status: 400 }
      );
    }

    const slotInfo = AD_TIME_SLOTS[slotTiming as AdSlotTiming] || AD_TIME_SLOTS.morning;
    const startHour =
      slotTiming === "custom" && typeof customStartHour === "number"
        ? customStartHour
        : slotInfo.startHour;
    const endHour =
      slotTiming === "custom" && typeof customEndHour === "number"
        ? customEndHour
        : slotInfo.endHour;

    const booking = await createAdBooking({
      businessName: String(businessName).trim(),
      contactName: String(contactName || "Business Owner").trim(),
      contactPhone: String(contactPhone).trim(),
      format: format as AdFormat,
      slotTiming: slotTiming as AdSlotTiming,
      slotLabel: slotTiming === "custom" ? `Custom (${startHour}:00 – ${endHour}:00)` : `${slotInfo.label} (${slotInfo.hours})`,
      customStartHour,
      customEndHour,
      startHour,
      endHour,
      startDate: String(startDate),
      endDate: String(endDate),
      durationDays: Number(durationDays) || 1,
      poster,
      content,
      video,
      paymentMethod,
      transactionId,
      status: status || (paymentMethod ? "Paid" : "Pending Payment"),
      notes,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create ad booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    const updated = await updateAdBooking(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update ad booking" },
      { status: 500 }
    );
  }
}
