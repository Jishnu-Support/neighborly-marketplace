import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type PlatformTransaction,
  type PlatformTransactionType,
  type PlatformPaymentStatus,
} from "./transactions.shared";
import { readAdBookings } from "./ad-bookings";

const transactionsFilePath =
  process.env.NEIGHBORLY_TRANSACTIONS_STORE ||
  path.join(process.cwd(), ".neighborly-transactions.json");

function getInitialSampleTransactions(): PlatformTransaction[] {
  const now = new Date();
  const todayDate = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const todayTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return [
    {
      id: "TXN-HSR-2026-8941",
      type: "ad_booking",
      typeLabel: "Ad Campaign Booking",
      businessName: "Greenway Auto Works",
      customerName: "Suresh Kumar",
      customerPhone: "+91 98450 12345",
      customerId: "CUST-HSR-12345",
      itemSummary: "All-In-One Combo Ad (Morning Peak 08:00 AM - 12:00 PM, 7 Days)",
      grossAmount: 15686,
      taxAmount: 2392.78,
      netAmount: 13293.22,
      platformFee: 15686,
      status: "Paid",
      paymentMethod: "UPI QR (Google Pay / PhonePe)",
      referenceId: "UPI/261102894101/greenway@axis",
      createdAt: new Date(now.getTime() - 42 * 60 * 1000).toISOString(),
      createdDate: todayDate,
      createdTime: todayTime,
      settledAt: new Date(now.getTime() - 41 * 60 * 1000).toISOString(),
      notes: "Ad active on Hosur morning peak rail. Payment verified via Axis Bank UPI gateway.",
      recordedBy: "Automated Gateway (Razorpay UPI)",
      receiptNumber: "INV-HSR-2026-041",
    },
    {
      id: "TXN-HSR-2026-8942",
      type: "ad_booking",
      typeLabel: "Ad Campaign Booking",
      businessName: "Star Electronics Hosur",
      customerName: "Ramesh Babu",
      customerPhone: "+91 98765 43210",
      customerId: "CUST-HSR-43210",
      itemSummary: "Poster Billboard Ad (All-Day 24/7 Priority, 1 Day)",
      grossAmount: 1443,
      taxAmount: 220.12,
      netAmount: 1222.88,
      platformFee: 1443,
      status: "Paid",
      paymentMethod: "UPI (ramesh@okaxis)",
      referenceId: "UPI/261102894202/star@okhdfc",
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      createdDate: todayDate,
      createdTime: "01:14:20 pm",
      settledAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 40000).toISOString(),
      notes: "Poster ad billboard slot booked and verified. High CTR performance.",
      recordedBy: "Automated Gateway (HDFC UPI)",
      receiptNumber: "INV-HSR-2026-042",
    },
    {
      id: "TXN-HSR-2026-8943",
      type: "ad_booking",
      typeLabel: "Ad Campaign Booking",
      businessName: "Sri Krishna Sweets & Bakery",
      customerName: "Venkatesh S.",
      customerPhone: "+91 94432 87654",
      customerId: "CUST-HSR-87654",
      itemSummary: "Poster Billboard Ad (Evening Rush 05:00 PM - 10:00 PM, 7 Days)",
      grossAmount: 5155,
      taxAmount: 786.36,
      netAmount: 4368.64,
      platformFee: 5155,
      status: "Paid",
      paymentMethod: "Credit Card (HDFC Visa)",
      referenceId: "CC-AUTH-87654-HDFC",
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      createdDate: todayDate,
      createdTime: "11:20:05 am",
      settledAt: new Date(now.getTime() - 4 * 60 * 60 * 1000 + 15000).toISOString(),
      notes: "Evening rush display slot confirmed for festival week promo.",
      recordedBy: "Automated Gateway (HDFC PG)",
      receiptNumber: "INV-HSR-2026-043",
    },
    {
      id: "TXN-HSR-2026-8944",
      type: "ad_booking",
      typeLabel: "Ad Campaign Booking",
      businessName: "Apex Fitness Studio",
      customerName: "Praveen Kumar",
      customerPhone: "+91 99001 22334",
      customerId: "CUST-HSR-22334",
      itemSummary: "Content Ad (All-Day 24/7 Priority, 7 Days)",
      grossAmount: 8645,
      taxAmount: 1318.73,
      netAmount: 7326.27,
      platformFee: 8645,
      status: "Paid",
      paymentMethod: "Net Banking (SBI)",
      referenceId: "SBI-NET-22334-098",
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      createdDate: todayDate,
      createdTime: "09:35:10 am",
      settledAt: new Date(now.getTime() - 6 * 60 * 60 * 1000 + 45000).toISOString(),
      notes: "Annual gym membership promo ticker verified and scheduled.",
      recordedBy: "Automated Gateway (SBI Corporate)",
      receiptNumber: "INV-HSR-2026-044",
    },
    {
      id: "TXN-HSR-2026-8945",
      type: "order_checkout",
      typeLabel: "Customer Store Order",
      businessName: "Maya's Home Kitchen",
      customerName: "Kavitha R.",
      customerPhone: "+91 98452 31209",
      customerId: "CUST-HSR-31209",
      itemSummary: "2x South Indian Thali, 1x Filter Coffee",
      grossAmount: 680,
      taxAmount: 34.0,
      netAmount: 646.0,
      platformFee: 34, // 5% marketplace commission
      status: "Paid",
      paymentMethod: "UPI (Google Pay)",
      referenceId: "UPI/261102894505/kavitha@oksbi",
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      createdDate: todayDate,
      createdTime: "02:15:30 pm",
      settledAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      notes: "Doorstep delivery to Flat 302, Sri Krishna Apts, Bagalur Road.",
      recordedBy: "Customer Checkout App",
      receiptNumber: "ORD-HSR-78214",
    },
    {
      id: "TXN-HSR-2026-8946",
      type: "order_checkout",
      typeLabel: "Customer Store Order",
      businessName: "Sri Balaji Electronics",
      customerName: "Senthil Nathan",
      customerPhone: "+91 94432 55667",
      customerId: "CUST-HSR-55667",
      itemSummary: "1x Wireless Bluetooth Earbuds (BoAt Rockerz)",
      grossAmount: 1499,
      taxAmount: 228.66,
      netAmount: 1270.34,
      platformFee: 75,
      status: "Paid",
      paymentMethod: "UPI (PhonePe)",
      referenceId: "UPI/261102894606/senthil@ybl",
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      createdDate: todayDate,
      createdTime: "12:05:44 pm",
      settledAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      notes: "Pick-up from Gandhi Road branch. Warranty verified.",
      recordedBy: "Customer Checkout App",
      receiptNumber: "ORD-HSR-78215",
    },
    {
      id: "TXN-HSR-2026-8947",
      type: "subscription",
      typeLabel: "Business Growth Plan",
      businessName: "A2B (Adyar Ananda Bhavan) Hosur",
      customerName: "Sundaramurthy M.",
      customerPhone: "+91 98400 11223",
      customerId: "CUST-HSR-11223",
      itemSummary: "Annual Verified Merchant Badge & Priority Search Placement",
      grossAmount: 4999,
      taxAmount: 762.56,
      netAmount: 4236.44,
      platformFee: 4999,
      status: "Paid",
      paymentMethod: "Bank Wire Transfer (NEFT)",
      referenceId: "NEFT-AXIS-2026-0982",
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      createdDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      createdTime: "10:00:00 am",
      settledAt: new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString(),
      notes: "Listing verified with GSTIN and Food Safety License certification.",
      recordedBy: "Company Admin (Priya Sharma)",
      receiptNumber: "SUB-HSR-2026-009",
    },
    {
      id: "TXN-HSR-2026-8948",
      type: "manual_settlement",
      typeLabel: "Manual Sponsor Settlement",
      businessName: "Titan Watches Hosur Plant Showroom",
      customerName: "Operations Manager",
      customerPhone: "+91 94420 88990",
      customerId: "CUST-HSR-88990",
      itemSummary: "Local Community Festival Billboard Sponsorship (Mathigiri Circle)",
      grossAmount: 25000,
      taxAmount: 3813.56,
      netAmount: 21186.44,
      platformFee: 25000,
      status: "Paid",
      paymentMethod: "Bank Wire Transfer (RTGS)",
      referenceId: "RTGS-HDFC-99128-TITAN",
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      createdDate: new Date(now.getTime() - 48 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      createdTime: "04:30:00 pm",
      settledAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      notes: "Corporate community engagement sponsorship invoice settled directly via RTGS.",
      recordedBy: "Super Admin (Finance Desk)",
      receiptNumber: "CORP-HSR-2026-001",
    },
  ];
}

export async function readPlatformTransactions(): Promise<PlatformTransaction[]> {
  try {
    const raw = await readFile(transactionsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as PlatformTransaction[];
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Could not read transactions store, falling back to seed:", err);
    }
  }

  // If not yet saved or empty, initialize with rich sample records and persist
  const initial = getInitialSampleTransactions();
  await savePlatformTransactions(initial);
  return initial;
}

export async function savePlatformTransactions(transactions: PlatformTransaction[]): Promise<void> {
  const dir = path.dirname(transactionsFilePath);
  await mkdir(dir, { recursive: true });
  const tempPath = `${transactionsFilePath}.tmp-${Date.now()}`;
  await writeFile(tempPath, JSON.stringify(transactions, null, 2), "utf8");
  await rename(tempPath, transactionsFilePath);
}

export async function recordPlatformTransaction(
  data: Partial<PlatformTransaction>
): Promise<PlatformTransaction> {
  const current = await readPlatformTransactions();
  const now = new Date();
  const todayDate = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const todayTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const grossAmount = Number(data.grossAmount) || 0;
  const netAmount = data.netAmount !== undefined ? Number(data.netAmount) : Math.round((grossAmount / 1.18) * 100) / 100;
  const taxAmount = data.taxAmount !== undefined ? Number(data.taxAmount) : Math.round((grossAmount - netAmount) * 100) / 100;

  const idSuffix = Math.floor(1000 + Math.random() * 9000);
  const newTxn: PlatformTransaction = {
    id: data.id || `TXN-HSR-2026-${idSuffix}`,
    type: data.type || "manual_settlement",
    typeLabel: data.typeLabel || (
      data.type === "ad_booking" ? "Ad Campaign Booking" :
      data.type === "order_checkout" ? "Customer Store Order" :
      data.type === "subscription" ? "Business Subscription" :
      "Manual Platform Settlement"
    ),
    businessName: data.businessName || "Hosur Merchant Partner",
    customerName: data.customerName || "Hosur Customer / Payer",
    customerPhone: data.customerPhone || "",
    customerId: data.customerId || `CUST-HSR-${Math.floor(10000 + Math.random() * 90000)}`,
    itemSummary: data.itemSummary || "Direct Platform Transaction Settlement",
    grossAmount,
    taxAmount,
    netAmount,
    platformFee: data.platformFee !== undefined ? Number(data.platformFee) : grossAmount,
    status: data.status || "Paid",
    paymentMethod: data.paymentMethod || "Bank Wire / Direct Cash",
    referenceId: data.referenceId || `REF-${Date.now().toString(36).toUpperCase()}`,
    createdAt: data.createdAt || now.toISOString(),
    createdDate: data.createdDate || todayDate,
    createdTime: data.createdTime || todayTime,
    settledAt: data.status === "Paid" ? (data.settledAt || now.toISOString()) : undefined,
    notes: data.notes || "Recorded via Company Portal administrative terminal.",
    recordedBy: data.recordedBy || "Company Admin Terminal",
    receiptNumber: data.receiptNumber || `INV-HSR-2026-${idSuffix}`,
  };

  // Add to top of list
  const updated = [newTxn, ...current.filter((t) => t.id !== newTxn.id)];
  await savePlatformTransactions(updated);
  return newTxn;
}
