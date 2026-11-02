import { NextResponse } from "next/server";
import { markAdBookingPaid } from "@/app/lib/ad-bookings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, paymentMethod, transactionId } = body;

    if (!id || !paymentMethod) {
      return NextResponse.json(
        { error: "Booking ID and paymentMethod are required." },
        { status: 400 }
      );
    }

    const updated = await markAdBookingPaid(id, {
      paymentMethod,
      transactionId,
    });

    if (!updated) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process ad payment" },
      { status: 500 }
    );
  }
}
