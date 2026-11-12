"use client";

import React, { useState, useEffect } from "react";
import { AdFormatPricing, DEFAULT_AD_FORMAT_PRICING } from "./lib/ad-pricing.shared";
import { SubscriptionPlan, DEFAULT_SUBSCRIPTION_PLANS } from "./lib/plans-config.shared";

// ============================================================================
// SUPER ADMIN AD PRICING MANAGER COMPONENT (IMAGE 3)
// ============================================================================
export function CompanyAdPricingManager({
  showNotice,
}: {
  showNotice?: (msg: string) => void;
}) {
  const [pricing, setPricing] = useState<Record<string, AdFormatPricing>>(DEFAULT_AD_FORMAT_PRICING);
  const [loading, setLoading] = useState(true);
  const [editingFormat, setEditingFormat] = useState<AdFormatPricing | null>(null);
  const [isNewFormat, setIsNewFormat] = useState(false);
  const [deletingFormat, setDeletingFormat] = useState<AdFormatPricing | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPricing = () => {
    setLoading(true);
    fetch("/api/company/ads/pricing", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.pricing && typeof data.pricing === "object") {
          setPricing(data.pricing);
          try {
            localStorage.setItem("bizearch_ad_pricing_cache", JSON.stringify(data.pricing));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPricing();
    const handleUpdate = () => loadPricing();
    window.addEventListener("neighborly-ad-pricing-updated", handleUpdate);
    return () => window.removeEventListener("neighborly-ad-pricing-updated", handleUpdate);
  }, []);

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormat) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/company/ads/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingFormat),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save ad pricing option.");

      showNotice?.(`✓ Ad pricing option "${editingFormat.shortName}" saved!`);
      window.dispatchEvent(new Event("neighborly-ad-pricing-updated"));
      setEditingFormat(null);
      loadPricing();
    } catch (err: any) {
      setError(err.message || "Failed to save pricing option.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!deletingFormat) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/company/ads/pricing?format=${encodeURIComponent(deletingFormat.format)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove ad pricing option.");

      showNotice?.(`✓ Removed ad pricing option "${deletingFormat.shortName}".`);
      window.dispatchEvent(new Event("neighborly-ad-pricing-updated"));
      setDeletingFormat(null);
      loadPricing();
    } catch (err: any) {
      setError(err.message || "Failed to delete pricing option.");
    } finally {
      setSaving(false);
    }
  };

  const formatKeys = Object.keys(pricing);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
          color: "#ffffff",
          padding: "20px 24px",
          borderRadius: "12px",
          boxShadow: "0 4px 14px rgba(6, 78, 59, 0.15)",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#6ee7b7" }}>
            👑 SUPER ADMIN ONLY · AD RATE CARD CONTROLS
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 6px", color: "#ffffff" }}>
            Manage Ad Formats &amp; Pricing
          </h2>
          <p style={{ fontSize: "12px", opacity: 0.9, margin: 0, maxWidth: "600px", color: "#ecfdf5" }}>
            Add, update, or remove ad format rate cards and base daily pricing shown to merchants on the ad booking wizard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsNewFormat(true);
            setEditingFormat({
              format: `custom_${Date.now().toString(36)}`,
              name: "",
              shortName: "",
              badge: "Special Format",
              description: "",
              baseDailyRate: 499,
            });
          }}
          className="primary-button"
          style={{
            background: "#ffffff",
            color: "#064e3b",
            fontWeight: 800,
            padding: "10px 18px",
            fontSize: "13px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          + Add Ad Pricing Option
        </button>
      </div>

      {loading && <p style={{ fontSize: "13px", color: "#64748b" }}>Loading ad pricing options...</p>}

      {/* Grid matching Image 3 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {formatKeys.map((fKey) => {
          const f = pricing[fKey];
          return (
            <div
              key={fKey}
              style={{
                background: "#ffffff",
                border: "1px solid #d4e3d3",
                borderRadius: "12px",
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                position: "relative",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#1e5333",
                      background: "#e4ede3",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {f.badge || "Ad Format"}
                  </span>
                  <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                    key: {f.format}
                  </span>
                </div>

                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#183a24", margin: "4px 0 6px" }}>
                  {f.shortName || f.name}
                </h3>

                <div style={{ fontSize: "22px", fontWeight: 800, color: "#166534", margin: "6px 0 10px" }}>
                  ₹{f.baseDailyRate.toLocaleString("en-IN")}
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}>/day base</span>
                </div>

                <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.45", margin: "0 0 16px" }}>
                  {f.description}
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => {
                    setIsNewFormat(false);
                    setEditingFormat({ ...f });
                  }}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  ✏️ Edit Pricing
                </button>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setDeletingFormat(f)}
                  style={{
                    padding: "7px 10px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    color: "#dc2626",
                    borderColor: "#fecaca",
                    background: "#fef2f2",
                  }}
                  title="Remove this format"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT / ADD MODAL */}
      {editingFormat && (
        <div className="order-modal-backdrop" onClick={() => setEditingFormat(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#064e3b" }}>
                {isNewFormat ? "Add New Ad Pricing Format" : `Edit Ad Pricing: ${editingFormat.shortName}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFormat(null)}
                style={{ background: "transparent", border: 0, fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveOption} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Format Key *</span>
                  <input
                    type="text"
                    value={editingFormat.format}
                    onChange={(e) => setEditingFormat({ ...editingFormat, format: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                    disabled={!isNewFormat}
                    required
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="e.g. spotlight_banner"
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Base Daily Rate (₹) *</span>
                  <input
                    type="number"
                    value={editingFormat.baseDailyRate}
                    onChange={(e) => setEditingFormat({ ...editingFormat, baseDailyRate: Number(e.target.value) })}
                    required
                    min={1}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="e.g. 699"
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Display Name *</span>
                  <input
                    type="text"
                    value={editingFormat.name}
                    onChange={(e) => setEditingFormat({ ...editingFormat, name: e.target.value })}
                    required
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="e.g. Poster Ad (Hero Billboard)"
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Short Name *</span>
                  <input
                    type="text"
                    value={editingFormat.shortName}
                    onChange={(e) => setEditingFormat({ ...editingFormat, shortName: e.target.value })}
                    required
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="e.g. Poster Billboard"
                  />
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                <span>Badge / Tag</span>
                <input
                  type="text"
                  value={editingFormat.badge}
                  onChange={(e) => setEditingFormat({ ...editingFormat, badge: e.target.value })}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  placeholder="e.g. Image Billboard, Best Value Bundle"
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                <span>Description &amp; Placement</span>
                <textarea
                  rows={3}
                  value={editingFormat.description}
                  onChange={(e) => setEditingFormat({ ...editingFormat, description: e.target.value })}
                  required
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                  placeholder="Explain where this ad displays on Bizearch and its customer impact..."
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setEditingFormat(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                  style={{ background: "#065f46" }}
                >
                  {saving ? "Saving..." : "Save Pricing Option"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingFormat && (
        <div className="order-modal-backdrop" onClick={() => setDeletingFormat(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
              Remove Ad Pricing Option?
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px", lineHeight: "1.5" }}>
              Are you sure you want to remove <strong>{deletingFormat.shortName}</strong> (₹{deletingFormat.baseDailyRate}/day base)? Merchants will no longer be able to select this format for future ad bookings.
            </p>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => setDeletingFormat(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleDeleteOption}
                disabled={saving}
                style={{ background: "#dc2626" }}
              >
                {saving ? "Removing..." : "Yes, Remove Format"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUPER ADMIN SUBSCRIPTION PLANS MANAGER COMPONENT (IMAGE 4)
// ============================================================================
export function CompanyPlansManager({
  showNotice,
}: {
  showNotice?: (msg: string) => void;
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isNewPlan, setIsNewPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);
  const [perksText, setPerksText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPlans = () => {
    setLoading(true);
    fetch("/api/company/plans", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
    const handleUpdate = () => loadPlans();
    window.addEventListener("neighborly-plans-updated", handleUpdate);
    return () => window.removeEventListener("neighborly-plans-updated", handleUpdate);
  }, []);

  const openEditModal = (plan: SubscriptionPlan, isNew = false) => {
    setIsNewPlan(isNew);
    setEditingPlan({ ...plan });
    setPerksText((plan.perks || []).join("\n"));
    setError("");
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);
    setError("");

    const parsedPerks = perksText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const payload: SubscriptionPlan = {
      ...editingPlan,
      perks: parsedPerks,
    };

    try {
      const res = await fetch("/api/company/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save subscription plan.");

      showNotice?.(`✓ Subscription plan "${payload.name}" saved successfully!`);
      window.dispatchEvent(new Event("neighborly-plans-updated"));
      setEditingPlan(null);
      loadPlans();
    } catch (err: any) {
      setError(err.message || "Failed to save plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/company/plans?id=${encodeURIComponent(deletingPlan.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete subscription plan.");

      showNotice?.(`✓ Subscription plan "${deletingPlan.name}" removed.`);
      window.dispatchEvent(new Event("neighborly-plans-updated"));
      setDeletingPlan(null);
      loadPlans();
    } catch (err: any) {
      setError(err.message || "Failed to delete plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "linear-gradient(135deg, #002d5e 0%, #00438b 100%)",
          color: "#ffffff",
          padding: "20px 24px",
          borderRadius: "12px",
          boxShadow: "0 4px 14px rgba(0, 67, 139, 0.15)",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#93c5fd" }}>
            👑 SUPER ADMIN ONLY · MEMBERSHIP TIER CONTROLS
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 6px", color: "#ffffff" }}>
            Manage Subscription Plans &amp; Pricing
          </h2>
          <p style={{ fontSize: "12px", opacity: 0.9, margin: 0, maxWidth: "600px", color: "#eff6ff" }}>
            Add, update monthly/yearly rates, customize feature perks, and remove membership subscription tiers displayed to merchants across Bizearch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            openEditModal(
              {
                id: `tier_${Date.now().toString(36)}`,
                name: "",
                monthlyPrice: 799,
                yearlyPrice: 7690,
                tagline: "Great for growing businesses.",
                desc: "Expanded reach and direct local customer leads.",
                perks: [
                  "✓ Local search priority",
                  "✓ Verified Business profile",
                  "✓ Customer enquiry & order alerts",
                ],
                enabled: true,
              },
              true
            );
          }}
          className="primary-button"
          style={{
            background: "#ffffff",
            color: "#00438b",
            fontWeight: 800,
            padding: "10px 18px",
            fontSize: "13px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          + Add New Subscription Plan
        </button>
      </div>

      {loading && <p style={{ fontSize: "13px", color: "#64748b" }}>Loading subscription plans...</p>}

      {/* Grid matching Image 4 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
        }}
      >
        {plans.map((p, idx) => (
          <div
            key={p.id || idx}
            style={{
              background: "#ffffff",
              border: p.isPopular ? "2px solid #00438b" : "1px solid #d4ded5",
              borderRadius: "14px",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              boxShadow: p.isPopular ? "0 4px 14px rgba(0, 67, 139, 0.12)" : "0 2px 6px rgba(0,0,0,0.03)",
            }}
          >
            {p.isPopular && (
              <span
                style={{
                  position: "absolute",
                  top: "-11px",
                  right: "18px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "10px",
                  border: "1px solid #bbf7d0",
                }}
              >
                {p.badge || "MOST POPULAR"}
              </span>
            )}

            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                {p.name}
              </h3>

              <div style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: "6px 0 2px" }}>
                ₹{p.monthlyPrice.toLocaleString("en-IN")}
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}> / month</span>
              </div>
              <div style={{ fontSize: "11px", color: "#059669", fontWeight: 700, marginBottom: "10px" }}>
                Yearly: ₹{p.yearlyPrice.toLocaleString("en-IN")} / year
              </div>

              <p style={{ fontSize: "12.5px", color: "#475569", margin: "0 0 16px", fontStyle: "italic" }}>
                {p.tagline || p.desc}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {p.perks.map((perk, perkIdx) => (
                  <li
                    key={perkIdx}
                    style={{
                      fontSize: "12.5px",
                      color: perk.startsWith("—") ? "#94a3b8" : "#334155",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => openEditModal(p, false)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                ✏️ Edit Plan &amp; Pricing
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={() => setDeletingPlan(p)}
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  color: "#dc2626",
                  borderColor: "#fecaca",
                  background: "#fef2f2",
                }}
                title="Remove this plan"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT / ADD PLAN MODAL */}
      {editingPlan && (
        <div className="order-modal-backdrop" onClick={() => setEditingPlan(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#00438b" }}>
                {isNewPlan ? "Add New Subscription Plan" : `Edit Plan: ${editingPlan.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                style={{ background: "transparent", border: 0, fontSize: "20px", cursor: "pointer", color: "#64748b" }}
              >
                ×
              </button>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSavePlan} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Plan Identifier (ID) *</span>
                  <input
                    type="text"
                    value={editingPlan.id}
                    onChange={(e) => setEditingPlan({ ...editingPlan, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                    disabled={!isNewPlan}
                    required
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="e.g. starter, growth"
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Plan Name *</span>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    required
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="e.g. Starter, Growth, Spotlight"
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Monthly Price (₹) *</span>
                  <input
                    type="number"
                    value={editingPlan.monthlyPrice}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setEditingPlan({
                        ...editingPlan,
                        monthlyPrice: m,
                        yearlyPrice: Math.round(m * 9.6),
                      });
                    }}
                    required
                    min={0}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="499"
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                  <span>Yearly Price (₹) *</span>
                  <input
                    type="number"
                    value={editingPlan.yearlyPrice}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: Number(e.target.value) })}
                    required
                    min={0}
                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    placeholder="4790"
                  />
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                <span>Tagline</span>
                <input
                  type="text"
                  value={editingPlan.tagline}
                  onChange={(e) => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  placeholder="e.g. A great place to start."
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: "#334155" }}>
                <span>Feature Perks (One per line)</span>
                <textarea
                  rows={5}
                  value={perksText}
                  onChange={(e) => setPerksText(e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                  placeholder={"✓ Local search priority\n✓ Verified Business profile\n✓ Customer enquiry alerts"}
                />
                <small style={{ color: "#64748b", fontSize: "11px" }}>
                  Start lines with &quot;✓&quot; for included features or &quot;—&quot; for excluded ones.
                </small>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editingPlan.isPopular}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                  />
                  <span>Mark as &quot;Most Popular&quot; tier</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setEditingPlan(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                  style={{ background: "#00438b" }}
                >
                  {saving ? "Saving..." : "Save Subscription Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPlan && (
        <div className="order-modal-backdrop" onClick={() => setDeletingPlan(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>⚠️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
              Remove Subscription Plan?
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px", lineHeight: "1.5" }}>
              Are you sure you want to remove the <strong>{deletingPlan.name}</strong> plan (₹{deletingPlan.monthlyPrice}/mo)?
            </p>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => setDeletingPlan(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleDeletePlan}
                disabled={saving}
                style={{ background: "#dc2626" }}
              >
                {saving ? "Removing..." : "Yes, Remove Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
