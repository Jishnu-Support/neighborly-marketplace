import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import {
  readPlatformTransactions,
  recordPlatformTransaction,
} from "@/app/lib/transactions";
import { calculateTransactionsSummary } from "@/app/lib/transactions.shared";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (
      session?.role !== "Company" ||
      (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")
    ) {
      return NextResponse.json(
        { error: "Authorized Company Admin access is required to view transactions." },
        { status: 403 }
      );
    }

    const transactions = await readPlatformTransactions();
    const summary = calculateTransactionsSummary(transactions);

    return NextResponse.json(
      { transactions, summary },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load transactions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (
      session?.role !== "Company" ||
      (session.accessLevel !== "Admin" && session.accessLevel !== "Super Admin")
    ) {
      return NextResponse.json(
        { error: "Authorized Company Admin access is required to record transactions." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      businessName,
      customerName,
      customerPhone,
      itemSummary,
      grossAmount,
      paymentMethod,
      referenceId,
      status,
      notes,
    } = body;

    if (!businessName || !grossAmount) {
      return NextResponse.json(
        { error: "Business name and gross amount are required." },
        { status: 400 }
      );
    }

    const recorded = await recordPlatformTransaction({
      type,
      businessName: String(businessName).trim(),
      customerName: customerName ? String(customerName).trim() : undefined,
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      itemSummary: itemSummary ? String(itemSummary).trim() : undefined,
      grossAmount: Number(grossAmount),
      paymentMethod: paymentMethod ? String(paymentMethod).trim() : undefined,
      referenceId: referenceId ? String(referenceId).trim() : undefined,
      status: status || "Paid",
      notes: notes ? String(notes).trim() : undefined,
      recordedBy: session.identity || (session.accessLevel ? `${session.accessLevel} (Admin)` : "Company Admin"),
    });

    const allTxns = await readPlatformTransactions();
    const summary = calculateTransactionsSummary(allTxns);

    return NextResponse.json(
      { success: true, transaction: recorded, summary },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record transaction." },
      { status: 500 }
    );
  }
}
