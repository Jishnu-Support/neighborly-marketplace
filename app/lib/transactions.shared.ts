export type PlatformTransactionType =
  | "ad_booking"
  | "order_checkout"
  | "subscription"
  | "claim_fee"
  | "manual_settlement";

export type PlatformPaymentStatus = "Paid" | "Pending" | "Refunded" | "Failed";

export interface PlatformTransaction {
  id: string; // e.g. "TXN-HSR-2026-8941"
  type: PlatformTransactionType;
  typeLabel: string;
  businessName: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  itemSummary: string;
  grossAmount: number;
  taxAmount?: number;
  netAmount?: number;
  platformFee?: number;
  status: PlatformPaymentStatus;
  paymentMethod: string;
  referenceId?: string;
  createdAt: string; // ISO
  createdDate: string;
  createdTime: string;
  settledAt?: string;
  notes?: string;
  recordedBy?: string;
  receiptNumber?: string;
}

export interface TransactionsSummary {
  totalGmv: number;
  totalPlatformRevenue: number;
  totalPaidCount: number;
  totalPendingCount: number;
  totalTransactionsCount: number;
  adRevenue: number;
  orderRevenue: number;
  subscriptionRevenue: number;
  manualRevenue: number;
}

export function calculateTransactionsSummary(transactions: PlatformTransaction[]): TransactionsSummary {
  let totalGmv = 0;
  let totalPlatformRevenue = 0;
  let totalPaidCount = 0;
  let totalPendingCount = 0;
  let adRevenue = 0;
  let orderRevenue = 0;
  let subscriptionRevenue = 0;
  let manualRevenue = 0;

  for (const t of transactions) {
    if (t.status === "Paid") {
      totalPaidCount++;
      totalGmv += t.grossAmount;

      if (t.type === "ad_booking") {
        adRevenue += t.grossAmount;
        totalPlatformRevenue += t.grossAmount;
      } else if (t.type === "subscription") {
        subscriptionRevenue += t.grossAmount;
        totalPlatformRevenue += t.grossAmount;
      } else if (t.type === "order_checkout") {
        orderRevenue += t.grossAmount;
        totalPlatformRevenue += t.platformFee || Math.round(t.grossAmount * 0.05); // 5% marketplace commission
      } else {
        manualRevenue += t.grossAmount;
        totalPlatformRevenue += t.grossAmount;
      }
    } else if (t.status === "Pending") {
      totalPendingCount++;
    }
  }

  return {
    totalGmv,
    totalPlatformRevenue,
    totalPaidCount,
    totalPendingCount,
    totalTransactionsCount: transactions.length,
    adRevenue,
    orderRevenue,
    subscriptionRevenue,
    manualRevenue,
  };
}
