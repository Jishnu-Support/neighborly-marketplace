"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  type PlatformTransaction,
  type PlatformTransactionType,
  type PlatformPaymentStatus,
  type TransactionsSummary,
  calculateTransactionsSummary,
} from "./lib/transactions.shared";

export type BusinessRef = {
  name: string;
  category?: string;
  [key: string]: unknown;
};

// ============================================================================
// COMPANY TRANSACTION RECEIPT & AUDIT MODAL
// ============================================================================
export function CompanyTransactionReceiptModal({
  transaction,
  close,
}: {
  transaction: PlatformTransaction;
  close: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  const gstRate = 0.18;
  const netAmount = transaction.netAmount || Math.round((transaction.grossAmount / 1.18) * 100) / 100;
  const taxAmount = transaction.taxAmount || Math.round((transaction.grossAmount - netAmount) * 100) / 100;

  return (
    <div
      className="dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 15, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={close}
    >
      <div
        className="dialog-surface"
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          border: "1px solid #c8dccb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #163e26 0%, #1e5434 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🧾</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, letterSpacing: "-0.2px" }}>
                Official Transaction Audit &amp; Tax Receipt
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#a7d3b5" }}>
                Bizearch Hosur Local Commerce Network • Certified Platform Record
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: 0,
              color: "#ffffff",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }} id="printable-receipt">
          {/* Company & Invoice Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #e1ebe2",
              paddingBottom: "16px",
              marginBottom: "18px",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#143a22" }}>
                bizearch<span style={{ color: "#22c55e" }}>.</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#4f6956", lineHeight: 1.5 }}>
                Bizearch Marketplace Pvt. Ltd.<br />
                Near Sub-Collector Office, Bagalur Main Road<br />
                Hosur, Krishnagiri Dist, Tamil Nadu – 635109<br />
                <strong>GSTIN:</strong> 33AAACB1234F1Z5
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: 800,
                  background: transaction.status === "Paid" ? "#dcfce7" : "#fef3c7",
                  color: transaction.status === "Paid" ? "#15803d" : "#b45309",
                  border: `1px solid ${transaction.status === "Paid" ? "#86efac" : "#fde68a"}`,
                  marginBottom: "6px",
                }}
              >
                ● {transaction.status.toUpperCase()}
              </span>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a3d27", fontFamily: "monospace" }}>
                {transaction.receiptNumber || transaction.id}
              </div>
              <small style={{ display: "block", color: "#617d6a", fontSize: "11px", marginTop: "2px" }}>
                Date: {transaction.createdDate} • {transaction.createdTime}
              </small>
            </div>
          </div>

          {/* Party Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              background: "#f7faf7",
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid #e2ede3",
              marginBottom: "20px",
            }}
          >
            <div>
              <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#54735e", textTransform: "uppercase" }}>
                MERCHANT / BENEFICIARY
              </span>
              <strong style={{ display: "block", fontSize: "13px", color: "#163a23", marginTop: "2px" }}>
                {transaction.businessName}
              </strong>
              <div style={{ fontSize: "11px", color: "#56725f", marginTop: "2px" }}>
                Registered Hosur Marketplace Partner
              </div>
            </div>

            <div>
              <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#54735e", textTransform: "uppercase" }}>
                PAYER / CUSTOMER
              </span>
              <strong style={{ display: "block", fontSize: "13px", color: "#163a23", marginTop: "2px" }}>
                {transaction.customerName || "Customer in Hosur"}
              </strong>
              <div style={{ fontSize: "11px", color: "#56725f", marginTop: "2px" }}>
                {transaction.customerPhone ? `Contact: ${transaction.customerPhone}` : ""}
                {transaction.customerId ? ` • ID: ${transaction.customerId}` : ""}
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div style={{ border: "1px solid #d9e6db", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#edf5ee", color: "#2d5438", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Description</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Type</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, textAlign: "right" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e7f0e8" }}>
                  <td style={{ padding: "12px", color: "#183a24", fontWeight: 600 }}>
                    {transaction.itemSummary}
                    {transaction.notes && (
                      <div style={{ fontSize: "11px", color: "#607c68", fontWeight: 400, marginTop: "4px" }}>
                        Note: {transaction.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px", color: "#456950" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        background: "#e0f2fe",
                        color: "#0369a1",
                      }}
                    >
                      {transaction.typeLabel}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#133820" }}>
                    ₹{netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations Breakdown */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
            <div style={{ width: "260px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#4f6e57", marginBottom: "6px" }}>
                <span>Subtotal (Net):</span>
                <span>₹{netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#4f6e57", marginBottom: "6px" }}>
                <span>GST (18%):</span>
                <span>₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 800, color: "#143a22", borderTop: "2px solid #d0e2d3", paddingTop: "8px" }}>
                <span>Total Paid:</span>
                <span>₹{transaction.grossAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Payment & Audit Reference */}
          <div
            style={{
              padding: "12px 16px",
              background: "#edf4ee",
              borderRadius: "8px",
              border: "1px solid #d4e4d6",
              fontSize: "11.5px",
              color: "#34553d",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <strong>Payment Method:</strong> {transaction.paymentMethod}
            </div>
            <div>
              <strong>Transaction / UTR Ref:</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>{transaction.referenceId || "N/A"}</span>
            </div>
            <div>
              <strong>Recorded By:</strong> {transaction.recordedBy || "Authorized Terminal"}
            </div>
            <div>
              <strong>Audit State:</strong> 🔒 System Verified
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            background: "#ffffff",
            borderTop: "1px solid #dbe7dc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="outline-button"
            onClick={handlePrint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>🖨️</span> Print / Save Receipt
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={close}
            style={{ padding: "8px 22px", fontSize: "12px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPANY RECORD TRANSACTION MODAL (FOR DIRECT ENTRY BY COMPANY ADMIN)
// ============================================================================
export function CompanyRecordTransactionModal({
  businesses,
  close,
  onTransactionRecorded,
  showNotice,
}: {
  businesses: BusinessRef[];
  close: () => void;
  onTransactionRecorded: (txn: PlatformTransaction) => void;
  showNotice: (msg: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<PlatformTransactionType>("ad_booking");
  const [businessName, setBusinessName] = useState(businesses[0]?.name || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemSummary, setItemSummary] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI (Google Pay / PhonePe)");
  const [referenceId, setReferenceId] = useState("");
  const [status, setStatus] = useState<PlatformPaymentStatus>("Paid");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !grossAmount) {
      setError("Please fill out the business name and transaction amount.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/company/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          businessName: businessName.trim(),
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          itemSummary: itemSummary.trim() || `${type.replace(/_/g, " ").toUpperCase()} Settlement`,
          grossAmount: Number(grossAmount),
          paymentMethod,
          referenceId: referenceId.trim() || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record transaction.");
      }

      showNotice(`✅ Transaction ${data.transaction.id} recorded successfully.`);
      onTransactionRecorded(data.transaction);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error recording transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 15, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={close}
    >
      <div
        className="dialog-surface"
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          border: "1px solid #c8dccb",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            background: "linear-gradient(135deg, #163e26 0%, #1e5434 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>💳</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>
                Record Platform Transaction
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#a7d3b5" }}>
                Log offline payments, bank wires, merchant sponsorships, or custom settlements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            style={{
              background: "rgba(255,255,255,0.18)",
              border: 0,
              color: "#ffffff",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "16px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Transaction Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PlatformTransactionType)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
              >
                <option value="ad_booking">📢 Ad Campaign Booking</option>
                <option value="order_checkout">🛍️ Customer Store Order</option>
                <option value="subscription">⭐ Business Subscription / Listing</option>
                <option value="manual_settlement">💼 Manual Settlement / Sponsorship</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Payment Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlatformPaymentStatus)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
              >
                <option value="Paid">✅ Paid &amp; Settled</option>
                <option value="Pending">⏳ Pending Payment</option>
                <option value="Refunded">↩️ Refunded</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
              Merchant / Business Name *
            </label>
            <input
              type="text"
              list="hosur-businesses"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Star Electronics Hosur"
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
              required
            />
            <datalist id="hosur-businesses">
              {businesses.map((b) => (
                <option key={b.name} value={b.name} />
              ))}
            </datalist>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Payer / Contact Person
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Babu"
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Contact Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Gross Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                placeholder="e.g. 15686"
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "13px", fontWeight: 700 }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
              >
                <option value="UPI (Google Pay / PhonePe)">UPI (Google Pay / PhonePe)</option>
                <option value="Bank Wire Transfer (NEFT / RTGS)">Bank Wire Transfer (NEFT / RTGS)</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Direct Cash Settlement">Direct Cash Settlement</option>
                <option value="Cheque / DD Deposit">Cheque / DD Deposit</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Reference / UTR / Cheque #
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. UPI/261102894101 or NEFT-AXIS-991"
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px", fontFamily: "monospace" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
                Item / Service Description
              </label>
              <input
                type="text"
                value={itemSummary}
                onChange={(e) => setItemSummary(e.target.value)}
                placeholder="e.g. Billboard Ad (Morning Peak, 7 Days)"
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#25442e", marginBottom: "4px" }}>
              Administrative Notes / Audit Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Confirmed with Axis Bank statement. Verified by Company Admin."
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #c5d8c8", fontSize: "12px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
            <button
              type="button"
              className="outline-button"
              onClick={close}
              disabled={submitting}
              style={{ padding: "8px 16px", fontSize: "12px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
              style={{ padding: "8px 20px", fontSize: "12px", fontWeight: 700 }}
            >
              {submitting ? "Recording..." : "Record Transaction & Generate Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPANY TRANSACTIONS MONITOR & DASHBOARD MANAGER (MAIN TAB)
// ============================================================================
export function CompanyTransactionsManager({
  businesses,
  showNotice,
}: {
  businesses: BusinessRef[];
  showNotice: (msg: string) => void;
}) {
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedReceipt, setSelectedReceipt] = useState<PlatformTransaction | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/transactions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load transactions.");
      }
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const summary = useMemo(() => calculateTransactionsSummary(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchId = t.id.toLowerCase().includes(query);
        const matchBiz = t.businessName.toLowerCase().includes(query);
        const matchCustomer = t.customerName?.toLowerCase().includes(query);
        const matchRef = t.referenceId?.toLowerCase().includes(query);
        const matchItem = t.itemSummary.toLowerCase().includes(query);
        if (!matchId && !matchBiz && !matchCustomer && !matchRef && !matchItem) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const exportCsv = () => {
    if (filteredTransactions.length === 0) {
      showNotice("No transactions to export.");
      return;
    }

    const headers = [
      "Transaction ID",
      "Receipt / Invoice #",
      "Type",
      "Merchant / Business",
      "Payer / Customer",
      "Customer Phone",
      "Customer ID",
      "Item / Description",
      "Gross Amount (INR)",
      "Tax GST (INR)",
      "Net Amount (INR)",
      "Platform Fee (INR)",
      "Status",
      "Payment Method",
      "Reference / UTR",
      "Created Date",
      "Created Time",
      "Timestamp (ISO)",
      "Recorded By",
      "Notes",
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.receiptNumber || t.id}"`,
      `"${t.typeLabel}"`,
      `"${t.businessName}"`,
      `"${t.customerName || "N/A"}"`,
      `"${t.customerPhone || "N/A"}"`,
      `"${t.customerId || "N/A"}"`,
      `"${t.itemSummary.replace(/"/g, '""')}"`,
      t.grossAmount,
      t.taxAmount || 0,
      t.netAmount || 0,
      t.platformFee || 0,
      `"${t.status}"`,
      `"${t.paymentMethod}"`,
      `"${t.referenceId || "N/A"}"`,
      `"${t.createdDate}"`,
      `"${t.createdTime}"`,
      t.createdAt,
      `"${t.recordedBy || "System"}"`,
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csvContent);
    a.download = `bizearch_platform_transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showNotice("📁 Platform transactions CSV downloaded.");
  };

  return (
    <section className="panel tab-panel" style={{ padding: "20px 24px" }}>
      {/* Header & Main Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div className="eyebrow">COMPANY FINANCIAL AUDIT &amp; CLEARING</div>
          <h2 style={{ margin: "2px 0 4px", fontSize: "20px", color: "#143a22" }}>
            Platform Transactions Monitor
          </h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#4f6a57" }}>
            Real-time audit log of all advertising bookings, customer store orders, listing subscriptions, and manual settlements.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsRecordModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>➕</span> Record New Transaction
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={exportCsv}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>📥</span> Export CSV
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={fetchTransactions}
            style={{ padding: "8px 12px", fontSize: "12px" }}
            title="Refresh transaction feed"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Metric Tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 16px", borderRadius: "10px" }}>
          <span style={{ fontSize: "10.5px", color: "#166534", fontWeight: 800, textTransform: "uppercase" }}>
            GROSS PLATFORM VOLUME (GMV)
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#14532d", marginTop: "4px" }}>
            ₹{summary.totalGmv.toLocaleString("en-IN")}
          </div>
          <small style={{ color: "#166534", fontSize: "11px" }}>Across {summary.totalPaidCount} settled transactions</small>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "14px 16px", borderRadius: "10px" }}>
          <span style={{ fontSize: "10.5px", color: "#1e40af", fontWeight: 800, textTransform: "uppercase" }}>
            COMPANY NET REVENUE
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#1e3a8a", marginTop: "4px" }}>
            ₹{summary.totalPlatformRevenue.toLocaleString("en-IN")}
          </div>
          <small style={{ color: "#1e40af", fontSize: "11px" }}>Ad bookings + platform commissions</small>
        </div>

        <div style={{ background: "#fdf4ff", border: "1px solid #f5d0fe", padding: "14px 16px", borderRadius: "10px" }}>
          <span style={{ fontSize: "10.5px", color: "#86198f", fontWeight: 800, textTransform: "uppercase" }}>
            AD CAMPAIGN REVENUE
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#701a75", marginTop: "4px" }}>
            ₹{summary.adRevenue.toLocaleString("en-IN")}
          </div>
          <small style={{ color: "#86198f", fontSize: "11px" }}>Billboard, ticker &amp; spotlight ads</small>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "14px 16px", borderRadius: "10px" }}>
          <span style={{ fontSize: "10.5px", color: "#92400e", fontWeight: 800, textTransform: "uppercase" }}>
            PENDING RECEIVABLES
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#78350f", marginTop: "4px" }}>
            {summary.totalPendingCount}
          </div>
          <small style={{ color: "#92400e", fontSize: "11px" }}>Awaiting payment / verification</small>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Txn ID, Business, Customer, UTR..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              borderRadius: "8px",
              border: "1px solid #c9dccb",
              fontSize: "12px",
              background: "#ffffff",
            }}
          />
          <span style={{ position: "absolute", left: "10px", top: "8px", color: "#7a9480", fontSize: "13px" }}>
            🔍
          </span>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #c9dccb", fontSize: "12px", background: "#ffffff" }}
        >
          <option value="all">All Transaction Types</option>
          <option value="ad_booking">Ad Campaign Bookings</option>
          <option value="order_checkout">Customer Store Orders</option>
          <option value="subscription">Business Subscriptions</option>
          <option value="manual_settlement">Manual Settlements</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #c9dccb", fontSize: "12px", background: "#ffffff" }}
        >
          <option value="all">All Payment Statuses</option>
          <option value="Paid">Paid &amp; Settled</option>
          <option value="Pending">Pending Payment</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {/* Table / List View */}
      {loading ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#50705a" }}>
          Loading platform transactions...
        </div>
      ) : error ? (
        <div style={{ padding: "20px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px" }}>
          ⚠️ {error}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#607a67", background: "#f8faf8", borderRadius: "10px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💳</div>
          <strong style={{ fontSize: "15px" }}>No transactions match your search.</strong>
          <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
            Try adjusting your search query or type filters.
          </p>
        </div>
      ) : (
        <div style={{ border: "1px solid #d5e5d7", borderRadius: "10px", overflow: "hidden", background: "#ffffff" }}>
          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.6fr 1.8fr 1.2fr 1.4fr 1fr 1fr",
              padding: "11px 16px",
              background: "#edf5ee",
              borderBottom: "1px solid #d5e5d7",
              fontSize: "11px",
              fontWeight: 800,
              color: "#35573e",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            <span>Txn &amp; Invoice</span>
            <span>Parties</span>
            <span>Description</span>
            <span style={{ textAlign: "right" }}>Amount (₹)</span>
            <span>Payment Mode</span>
            <span>Status</span>
            <span style={{ textAlign: "center" }}>Action</span>
          </div>

          {/* Table Rows */}
          <div style={{ maxHeight: "560px", overflowY: "auto" }}>
            {filteredTransactions.map((t, idx) => {
              const typeBadgeColor =
                t.type === "ad_booking"
                  ? { bg: "#fdf4ff", text: "#86198f", border: "#f5d0fe" }
                  : t.type === "order_checkout"
                  ? { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }
                  : t.type === "subscription"
                  ? { bg: "#fef3c7", text: "#b45309", border: "#fde68a" }
                  : { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" };

              return (
                <div
                  key={t.id || idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.6fr 1.8fr 1.2fr 1.4fr 1fr 1fr",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: idx < filteredTransactions.length - 1 ? "1px solid #eef5ef" : "none",
                    background: idx % 2 === 0 ? "#ffffff" : "#fbfdfb",
                    fontSize: "12px",
                  }}
                >
                  {/* Txn ID & Receipt */}
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontFamily: "monospace",
                        fontWeight: 800,
                        fontSize: "11px",
                        color: "#184525",
                      }}
                    >
                      {t.id}
                    </span>
                    <div style={{ fontSize: "10px", color: "#6e8976", marginTop: "2px" }}>
                      📅 {t.createdDate} ⏰ {t.createdTime}
                    </div>
                  </div>

                  {/* Parties (Merchant & Customer) */}
                  <div style={{ minWidth: 0, paddingRight: "8px" }}>
                    <strong style={{ display: "block", color: "#143921", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.businessName}>
                      🏢 {t.businessName}
                    </strong>
                    <div style={{ fontSize: "10.5px", color: "#54735e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      👤 {t.customerName || "Customer in Hosur"}
                    </div>
                  </div>

                  {/* Description & Type */}
                  <div style={{ paddingRight: "8px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "1px 6px",
                        borderRadius: "8px",
                        fontSize: "9.5px",
                        fontWeight: 800,
                        background: typeBadgeColor.bg,
                        color: typeBadgeColor.text,
                        border: `1px solid ${typeBadgeColor.border}`,
                        marginBottom: "3px",
                      }}
                    >
                      {t.typeLabel}
                    </span>
                    <div style={{ fontSize: "11px", color: "#25442e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={t.itemSummary}>
                      {t.itemSummary}
                    </div>
                  </div>

                  {/* Gross Amount */}
                  <div style={{ textAlign: "right", paddingRight: "12px" }}>
                    <strong style={{ fontSize: "13px", color: "#143a22", display: "block" }}>
                      ₹{t.grossAmount.toLocaleString("en-IN")}
                    </strong>
                    {t.taxAmount ? (
                      <small style={{ fontSize: "9.5px", color: "#6c8574" }}>
                        incl. ₹{Math.round(t.taxAmount)} GST
                      </small>
                    ) : null}
                  </div>

                  {/* Payment Mode & Reference */}
                  <div style={{ paddingRight: "8px" }}>
                    <div style={{ fontWeight: 600, color: "#1b4227", fontSize: "11px" }}>
                      {t.paymentMethod}
                    </div>
                    {t.referenceId && (
                      <small style={{ fontSize: "9.5px", color: "#5d7c67", fontFamily: "monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.referenceId}>
                        Ref: {t.referenceId}
                      </small>
                    )}
                  </div>

                  {/* Status Pill */}
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10.5px",
                        fontWeight: 800,
                        background: t.status === "Paid" ? "#dcfce7" : "#fef3c7",
                        color: t.status === "Paid" ? "#15803d" : "#b45309",
                        border: `1px solid ${t.status === "Paid" ? "#86efac" : "#fde68a"}`,
                      }}
                    >
                      ● {t.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className="outline-button"
                      onClick={() => setSelectedReceipt(t)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        borderRadius: "6px",
                      }}
                      title="View complete invoice & tax audit details"
                    >
                      🧾 Receipt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedReceipt && (
        <CompanyTransactionReceiptModal
          transaction={selectedReceipt}
          close={() => setSelectedReceipt(null)}
        />
      )}

      {isRecordModalOpen && (
        <CompanyRecordTransactionModal
          businesses={businesses}
          close={() => setIsRecordModalOpen(false)}
          onTransactionRecorded={(newTxn) => {
            setTransactions((prev) => [newTxn, ...prev]);
          }}
          showNotice={showNotice}
        />
      )}
    </section>
  );
}
