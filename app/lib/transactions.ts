import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type PlatformTransaction,
  type PlatformTransactionType,
  type PlatformPaymentStatus,
} from "./transactions.shared";
import { readAdBookings } from "./ad-bookings";
import { resolveStorePath } from "./storage-paths";

const transactionsFilePath = resolveStorePath("NEIGHBORLY_TRANSACTIONS_STORE", ".neighborly-transactions.json");

export async function readPlatformTransactions(): Promise<PlatformTransaction[]> {
  try {
    const raw = await readFile(transactionsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as PlatformTransaction[];
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Could not read transactions store:", err);
    }
  }

  // Clean initialization: start with empty transactions array
  await savePlatformTransactions([]);
  return [];
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
