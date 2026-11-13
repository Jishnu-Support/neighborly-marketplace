import { NextResponse } from "next/server";
import { markAdBookingPaid } from "@/app/lib/ad-bookings";
import { recordPlatformTransaction } from "@/app/lib/transactions";
import { createServerNotification } from "@/app/lib/notifications";

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

    // Automatically record in company platform transactions
    try {
      await recordPlatformTransaction({
        id: `TXN-${updated.id}`,
        type: "ad_booking",
        typeLabel: "Ad Campaign Booking",
        businessName: updated.businessName,
        customerName: updated.contactName,
        customerPhone: updated.contactPhone,
        itemSummary: `${updated.format.toUpperCase()} Ad (${updated.slotLabel || updated.slotTiming}, ${updated.durationDays} Days)`,
        grossAmount: updated.totalAmount,
        taxAmount: updated.gstAmount,
        netAmount: updated.subtotal,
        platformFee: updated.totalAmount,
        status: "Paid",
        paymentMethod: updated.paymentMethod || paymentMethod || "UPI",
        referenceId: updated.transactionId || transactionId,
        notes: `Ad booking payment confirmed and campaign activated: ${updated.id}`,
        recordedBy: "Automated Gateway (Ad Checkout)",
        receiptNumber: `INV-${updated.id}`,
      });
    } catch (e) {
      console.warn("Could not log ad payment transaction:", e);
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process ad payment" },
      { status: 500 }
    );
  }
}
