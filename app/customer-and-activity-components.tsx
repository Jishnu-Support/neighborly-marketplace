"use client";

import React, { useState, useEffect, useMemo } from "react";

export type CustomerRegistrationRecord = {
  id: string;
  name: string;
  phone?: string;
  phoneLast4: string;
  email?: string;
  doorNo?: string;
  street?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  address?: string;
  emergencyPhones?: [string, string];
  emergencyNames?: [string, string];
  locationStatus: "shared" | "denied" | "unavailable";
  latitude: number | null;
  longitude: number | null;
  registeredAt: string;
  verificationStatus: string;
  registrationMethod?: string;
  active?: boolean;
};

export type ActivityLogRecord = {
  id: string;
  action: string;
  category: "Registration" | "Login" | "Search" | "Lead" | "View" | "SOS" | "Order" | "Admin" | "General" | "Call" | "Advertisement" | "Customer Care";
  actorName: string;
  actorPhone?: string;
  actorRole: "Customer" | "Business" | "Agent" | "Admin" | "Super Admin" | "Guest";
  locality?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

function formatRelativeTime(dateString: string): string {
  try {
    const now = Date.now();
    const date = new Date(dateString).getTime();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

export function CompanyCustomerRegistrationsPanel({
  registrations,
  loading,
  error,
  accessLevel,
  onRefresh,
  onViewCustomerActivity,
  onShowNotice,
}: {
  registrations: CustomerRegistrationRecord[];
  loading: boolean;
  error: string;
  accessLevel?: string;
  onRefresh: () => void;
  onViewCustomerActivity?: (customerName: string) => void;
  onShowNotice?: (msg: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const isSuperAdmin = accessLevel === "Super Admin";

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (locationFilter !== "All" && r.locationStatus !== locationFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.phoneLast4 && r.phoneLast4.includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.locality && r.locality.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q)) ||
        (r.street && r.street.toLowerCase().includes(q)) ||
        (r.pincode && r.pincode.includes(q))
      );
    });
  }, [registrations, searchQuery, locationFilter]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const sharedGps = registrations.filter((r) => r.locationStatus === "shared").length;
    const localities = new Set(registrations.map((r) => r.locality).filter(Boolean)).size;
    return { total, sharedGps, localities };
  }, [registrations]);

  return (
    <section className="panel tab-panel">
      {/* Header */}
      <div className="panel-heading" style={{ flexWrap: "wrap", gap: "12px", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow" style={{ color: "#2d6a4f", fontWeight: 700 }}>
            CUSTOMER ONBOARDING AUDIT
          </div>
          <h2 style={{ margin: "4px 0", fontSize: "20px" }}>
            How Customers Registered ({registrations.length} Customers)
          </h2>
          <p style={{ fontSize: "12px", color: "#66786c", margin: "4px 0 0", maxWidth: "680px" }}>
            Comprehensive audit of registered customers across India: verified mobile numbers, full physical addresses,
            emergency contacts, browser location consent, and account status.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <a
            href="/api/company/customer-locations/export?format=xlsx"
            download="bizearch-registered-customers.xlsx"
            className="primary-button"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 14px",
            }}
          >
            📊 Export Customers (.xlsx)
          </a>
          <a
            href="/api/company/customer-locations/export?format=csv"
            download="bizearch-registered-customers.csv"
            className="outline-button"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 14px",
            }}
          >
            📄 Export CSV
          </a>
          <button
            type="button"
            className="outline-button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 12px",
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          margin: "18px 0 20px",
        }}
      >
        <div style={{ background: "#f4f8f4", border: "1px solid #dbe8db", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontSize: "11px", color: "#4f7756", fontWeight: 700, textTransform: "uppercase" }}>
            Total Customers
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#1b4332", marginTop: "4px" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "11px", color: "#66786c", marginTop: "2px" }}>Active customer accounts</div>
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontSize: "11px", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
            Mobile OTP Verified
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>
            100%
          </div>
          <div style={{ fontSize: "11px", color: "#166534", marginTop: "2px" }}>Two-factor verified phone</div>
        </div>

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontSize: "11px", color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
            GPS Locations Shared
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
            {stats.sharedGps} / {stats.total}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Consented exact map pins</div>
        </div>

        <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontSize: "11px", color: "#854d0e", fontWeight: 700, textTransform: "uppercase" }}>
            Active Localities
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#713f12", marginTop: "4px" }}>
            {stats.localities} Areas
          </div>
          <div style={{ fontSize: "11px", color: "#a16207", marginTop: "2px" }}>Bagalur, HUDCO, SIPCOT & more</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
          alignItems: "center",
          background: "#fafbfa",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #eef2ed",
        }}
      >
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by customer name, mobile, address, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #d4ded3",
              fontSize: "12px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#546e5c" }}>Location Consent:</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "6px",
              border: "1px solid #d4ded3",
              fontSize: "12px",
              background: "#fff",
              color: "#2d4233",
            }}
          >
            <option value="All">All Statuses ({registrations.length})</option>
            <option value="shared">📍 Location Shared (GPS Captured)</option>
            <option value="denied">🚫 Location Denied</option>
            <option value="unavailable">⚠️ GPS Unavailable</option>
          </select>
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              background: "none",
              border: 0,
              color: "#6b7d70",
              fontSize: "11px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Clear Search
          </button>
        )}
      </div>

      {loading && <p style={{ fontSize: "12px", color: "#66786c" }}>Loading customer registration records…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fbfcfb", borderRadius: "8px", border: "1px dashed #d5e0d4" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>👥</div>
          <strong style={{ fontSize: "15px", color: "#2d4233", display: "block" }}>No registered customers yet</strong>
          <p style={{ fontSize: "12px", color: "#77877c", margin: "6px auto 14px", maxWidth: "460px", lineHeight: 1.5 }}>
            {searchQuery || locationFilter !== "All"
              ? "No registered customers matched your search query or location filter."
              : "Only real customer registrations are displayed here. When customers sign up through 'Create an account', their verified phone, address, and location consent will appear here."}
          </p>
        </div>
      )}

      {/* Customer Registration Cards */}
      <div style={{ display: "grid", gap: "12px" }}>
        {filtered.map((r) => {
          const phoneDisplay = r.phone || `+91 ******${r.phoneLast4}`;
          const cleanPhone = phoneDisplay.replace(/\D/g, "");
          const waPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

          return (
            <div
              key={r.id}
              style={{
                border: "1px solid #e3eae2",
                borderRadius: "8px",
                padding: "16px",
                background: "#ffffff",
                transition: "all 0.15s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "10px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #f0f4f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: "#e8f2e8",
                      color: "#2d6a4f",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                      fontSize: "14px",
                    }}
                  >
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "14px", color: "#1c2b20" }}>{r.name}</strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: r.active === false ? "#fef2f2" : "#ecfdf5",
                          color: r.active === false ? "#b91c1c" : "#065f46",
                          border: `1px solid ${r.active === false ? "#fca5a5" : "#a7f3d0"}`,
                        }}
                      >
                        ● {r.active === false ? "Disabled" : r.verificationStatus}
                      </span>
                    </div>
                    <small style={{ fontSize: "11px", color: "#77877c" }}>
                      ID: {r.id} · Registered {formatRelativeTime(r.registeredAt)} (
                      {new Date(r.registeredAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      )
                    </small>
                  </div>
                </div>

                {/* Action buttons: Status badge, Audit, Disable/Activate, Delete */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#4f7756",
                      background: "#f0f5ef",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    🔐 {r.registrationMethod || "Mobile OTP + Password"}
                  </span>
                  {onViewCustomerActivity && (
                    <button
                      type="button"
                      onClick={() => onViewCustomerActivity(r.name)}
                      style={{
                        background: "#fff",
                        border: "1px solid #c7d8c6",
                        color: "#2d6a4f",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Audit Activity →
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      disabled={actionBusyId === r.id}
                      onClick={async () => {
                        const willDisable = r.active !== false;
                        const confirmed = window.confirm(
                          willDisable
                            ? `Are you sure you want to disable customer "${r.name}"? They will not be able to sign in.`
                            : `Activate customer account "${r.name}"?`
                        );
                        if (!confirmed) return;
                        try {
                          setActionBusyId(r.id);
                          const res = await fetch("/api/company/customer-locations", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: r.id, active: !willDisable }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Could not update customer status.");
                          onRefresh();
                          if (onShowNotice) onShowNotice(`Customer "${r.name}" ${willDisable ? "disabled" : "activated"} successfully.`);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Error updating customer.");
                        } finally {
                          setActionBusyId(null);
                        }
                      }}
                      style={{
                        background: r.active === false ? "#15803d" : "#ffffff",
                        border: `1px solid ${r.active === false ? "#15803d" : "#ef4444"}`,
                        color: r.active === false ? "#ffffff" : "#b91c1c",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {r.active === false ? "Activate Customer" : "Disable Customer"}
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      disabled={actionBusyId === r.id}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Are you sure you want to permanently delete customer registration record for "${r.name}"? This action cannot be undone.`
                        );
                        if (!confirmed) return;
                        try {
                          setActionBusyId(r.id);
                          const res = await fetch(`/api/company/customer-locations?id=${encodeURIComponent(r.id)}`, {
                            method: "DELETE",
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Could not delete customer record.");
                          onRefresh();
                          if (onShowNotice) onShowNotice(`Customer record for "${r.name}" deleted.`);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Error deleting record.");
                        } finally {
                          setActionBusyId(null);
                        }
                      }}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#64748b",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                      title="Delete this customer record"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Registration Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                  padding: "12px 0",
                  fontSize: "12px",
                }}
              >
                {/* Contact Info */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a968d", textTransform: "uppercase" }}>
                    Verified Contact
                  </div>
                  <div style={{ fontWeight: 700, color: "#1b4332", fontSize: "13px", marginTop: "2px" }}>
                    📞 {phoneDisplay}
                  </div>
                  {r.email && (
                    <div style={{ color: "#4f6556", fontSize: "11px", marginTop: "2px" }}>
                      ✉️ {r.email}
                    </div>
                  )}
                  {/* Quick Connect Actions */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <a
                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                        `Hi ${r.name}, Greetings from Bizearch! We are checking in regarding your Bizearch account. Please let us know if you have any questions or need any help. Thanks! - Team Bizearch`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#25D366",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      💬 WhatsApp
                    </a>
                    <a
                      href={`tel:${phoneDisplay.replace(/\s+/g, "")}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        color: "#166534",
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      📞 Call
                    </a>
                  </div>
                </div>

                {/* Physical Address */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a968d", textTransform: "uppercase" }}>
                    Physical Address
                  </div>
                  <div style={{ color: "#2d4233", lineHeight: 1.4, marginTop: "2px" }}>
                    {r.doorNo ? `${r.doorNo}, ` : ""}
                    {r.street ? `${r.street}, ` : ""}
                    <strong>{r.locality}</strong>{r.city ? `, ${r.city}` : ""}
                    {r.pincode ? ` - ${r.pincode}` : ""}
                  </div>
                  {r.district && (
                    <small style={{ color: "#77877c", display: "block" }}>
                      {r.district}, {r.state || "Tamil Nadu"}
                    </small>
                  )}
                </div>

                {/* Location Sharing Consent & Coordinates */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a968d", textTransform: "uppercase" }}>
                    Location Consent & Coordinates
                  </div>
                  {r.locationStatus === "shared" && r.latitude !== null && r.longitude !== null ? (
                    <div style={{ marginTop: "2px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "#ecfdf5",
                          color: "#065f46",
                          fontWeight: 700,
                        }}
                      >
                        📍 GPS Captured
                      </span>
                      <div style={{ fontSize: "11px", color: "#374151", marginTop: "3px", fontFamily: "monospace" }}>
                        {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: "4px",
                          fontSize: "11px",
                          color: "#1d4ed8",
                          textDecoration: "underline",
                          fontWeight: 600,
                        }}
                      >
                        🗺️ View on Google Maps ↗
                      </a>
                    </div>
                  ) : r.locationStatus === "denied" ? (
                    <div style={{ marginTop: "2px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "#fef2f2",
                          color: "#991b1b",
                          fontWeight: 600,
                        }}
                      >
                        🚫 Location Denied by Customer
                      </span>
                      <small style={{ display: "block", color: "#77877c", marginTop: "2px" }}>
                        Customer chose not to share GPS coordinates during registration.
                      </small>
                    </div>
                  ) : (
                    <div style={{ marginTop: "2px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "#f8fafc",
                          color: "#475569",
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ GPS Unavailable
                      </span>
                      <small style={{ display: "block", color: "#77877c", marginTop: "2px" }}>
                        Device GPS service was not accessible at registration time.
                      </small>
                    </div>
                  )}
                </div>

                {/* Emergency SOS Contacts */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a968d", textTransform: "uppercase" }}>
                    Emergency SOS Contacts
                  </div>
                  {r.emergencyPhones && (r.emergencyPhones[0] || r.emergencyPhones[1]) ? (
                    <div style={{ display: "grid", gap: "3px", marginTop: "2px", fontSize: "11px" }}>
                      {r.emergencyPhones[0] && (
                        <div style={{ color: "#2d4233" }}>
                          1. <strong>{(r.emergencyNames && r.emergencyNames[0]) || "Contact 1"}:</strong>{" "}
                          <a href={`tel:${r.emergencyPhones[0]}`} style={{ color: "#2d6a4f", textDecoration: "underline" }}>
                            {r.emergencyPhones[0]}
                          </a>
                        </div>
                      )}
                      {r.emergencyPhones[1] && (
                        <div style={{ color: "#2d4233" }}>
                          2. <strong>{(r.emergencyNames && r.emergencyNames[1]) || "Contact 2"}:</strong>{" "}
                          <a href={`tel:${r.emergencyPhones[1]}`} style={{ color: "#2d6a4f", textDecoration: "underline" }}>
                            {r.emergencyPhones[1]}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <small style={{ color: "#9ca3af", fontStyle: "italic", marginTop: "2px", display: "block" }}>
                      No emergency contacts specified
                    </small>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CompanyActivityLogsPanel({
  accessLevel,
  initialCustomerFilter,
}: {
  accessLevel: "Admin" | "Super Admin";
  initialCustomerFilter?: string;
}) {
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    calls: 0,
    ads: 0,
    leads: 0,
    searches: 0,
    registrations: 0,
    logins: 0,
    sos: 0,
    views: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState(initialCustomerFilter || "");

  const loadLogs = () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (categoryFilter !== "All") params.set("category", categoryFilter);
    if (roleFilter !== "All") params.set("role", roleFilter);
    if (searchQuery.trim()) params.set("query", searchQuery.trim());
    params.set("limit", "300");

    fetch(`/api/company/activity-logs?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { logs?: ActivityLogRecord[]; stats?: typeof stats; error?: string };
        if (!res.ok) throw new Error(data.error || "Could not load activity logs.");
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load activity logs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, [categoryFilter, roleFilter]);

  const categoryPills: { id: string; label: string; icon: string; color: string }[] = [
    { id: "All", label: "All Activities", icon: "📋", color: "#374151" },
    { id: "Call", label: "Call Logs", icon: "📞", color: "#0284c7" },
    { id: "Advertisement", label: "Ad Activity", icon: "📢", color: "#ea580c" },
    { id: "Lead", label: "Customer Leads", icon: "💬", color: "#059669" },
    { id: "Search", label: "Searches", icon: "🔍", color: "#d97706" },
    { id: "Registration", label: "Registrations", icon: "📝", color: "#7c3aed" },
    { id: "Login", label: "Logins", icon: "🔑", color: "#2563eb" },
    { id: "SOS", label: "SOS Alerts", icon: "🚨", color: "#dc2626" },
    { id: "View", label: "Profile Views", icon: "👁️", color: "#0284c7" },
  ];

  return (
    <section className="panel tab-panel">
      {/* Panel Header */}
      <div className="panel-heading" style={{ flexWrap: "wrap", gap: "12px", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="eyebrow" style={{ color: "#2d6a4f", fontWeight: 700 }}>
              PLATFORM AUDIT LOG
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "10px",
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
              }}
            >
              ● Live Server Audit
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#1e40af",
                border: "1px solid #bfdbfe",
              }}
              title="Activity logs are safely preserved on disk for six months (180 days) until an authorized administrator clears them."
            >
              🕒 6-Month Retention Active (180 Days)
            </span>
          </div>
          <h2 style={{ margin: "4px 0", fontSize: "20px" }}>
            Customer & Platform Activity Logs
          </h2>
          <p style={{ fontSize: "12px", color: "#66786c", margin: "4px 0 0", maxWidth: "680px" }}>
            Real-time server activity log recorded on disk with 6-month retention (180 days) until manually cleared. Captures customer registrations, logins, business searches,
            WhatsApp leads, phone calls, store profile views, and SOS emergency alerts.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <a
            href={`/api/company/activity-logs/export?format=xlsx&category=${categoryFilter}&role=${roleFilter}`}
            download="bizearch-activity-logs.xlsx"
            className="primary-button"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 14px",
            }}
          >
            📊 Export Excel (.xlsx)
          </a>
          <a
            href={`/api/company/activity-logs/export?format=pdf&category=${categoryFilter}&role=${roleFilter}`}
            download="bizearch-activity-logs.pdf"
            className="outline-button"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 14px",
              background: "#fff1f2",
              borderColor: "#fecdd3",
              color: "#be123c",
              fontWeight: 700,
            }}
          >
            📑 Export PDF (.pdf)
          </a>
          <a
            href={`/api/company/activity-logs/export?format=csv&category=${categoryFilter}&role=${roleFilter}`}
            download="bizearch-activity-logs.csv"
            className="outline-button"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 14px",
            }}
          >
            📄 Export CSV
          </a>
          <button
            type="button"
            className="outline-button"
            onClick={loadLogs}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 12px",
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch("/api/company/activity-logs", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "deduplicate" }),
                });
                const data = await res.json();
                if (data.logs) setLogs(data.logs);
                if (data.stats) setStats(data.stats);
              } catch {}
              setLoading(false);
            }}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 12px",
              background: "#fffbeb",
              borderColor: "#fde68a",
              color: "#92400e",
              fontWeight: 600,
            }}
            title="Remove duplicate ad impressions and restore authentic activity records"
          >
            🧹 Clean Duplicates
          </button>
          <button
            type="button"
            className="outline-button"
            onClick={async () => {
              if (!window.confirm("Are you sure you want to clear all activity logs? This cannot be undone.")) return;
              setLoading(true);
              try {
                const res = await fetch("/api/company/activity-logs", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "clear" }),
                });
                const data = await res.json();
                setLogs(data.logs || []);
                if (data.stats) setStats(data.stats);
              } catch {}
              setLoading(false);
            }}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 12px",
              background: "#fef2f2",
              borderColor: "#fecaca",
              color: "#b91c1c",
              fontWeight: 600,
            }}
            title="Permanently clear all activity logs"
          >
            🗑️ Clear All Logs
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "10px",
          margin: "16px 0 18px",
        }}
      >
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
            Total Recorded Events
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>Audit trail on server</div>
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
            Customer Leads
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803d", marginTop: "2px" }}>
            {stats.leads}
          </div>
          <div style={{ fontSize: "10px", color: "#166534" }}>WhatsApp & Phone calls</div>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>
            Searches Performed
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#b45309", marginTop: "2px" }}>
            {stats.searches}
          </div>
          <div style={{ fontSize: "10px", color: "#92400e" }}>Local queries & filters</div>
        </div>

        <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#6b21a8", fontWeight: 700, textTransform: "uppercase" }}>
            Registrations & Logins
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#7e22ce", marginTop: "2px" }}>
            {stats.registrations + stats.logins}
          </div>
          <div style={{ fontSize: "10px", color: "#6b21a8" }}>Accounts & Sessions</div>
        </div>

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#0369a1", fontWeight: 700, textTransform: "uppercase" }}>
            Phone Calls Placed
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#0284c7", marginTop: "2px" }}>
            {stats.calls || 0}
          </div>
          <div style={{ fontSize: "10px", color: "#0369a1" }}>Calls triggered on portal</div>
        </div>

        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#c2410c", fontWeight: 700, textTransform: "uppercase" }}>
            Ad Views & Clicks
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#ea580c", marginTop: "2px" }}>
            {stats.ads || 0}
          </div>
          <div style={{ fontSize: "10px", color: "#c2410c" }}>Ad impressions & interactions</div>
        </div>

        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>
            SOS Alerts
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#b91c1c", marginTop: "2px" }}>
            {stats.sos}
          </div>
          <div style={{ fontSize: "10px", color: "#991b1b" }}>Emergency broadcasts</div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {categoryPills.map((p) => {
          const isSelected = categoryFilter === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setCategoryFilter(p.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? `2px solid ${p.color}` : "1px solid #dce4dc",
                background: isSelected ? "#ffffff" : "#f8faf8",
                color: isSelected ? p.color : "#506354",
                cursor: "pointer",
              }}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary filter & search bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
          alignItems: "center",
          background: "#fafbfa",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #eef2ed",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadLogs();
          }}
          style={{ display: "flex", flex: "1 1 240px", gap: "6px" }}
        >
          <input
            type="text"
            placeholder="Search logs by customer name, phone, action, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #d4ded3",
              fontSize: "12px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="outline-button"
            style={{ padding: "7px 12px", fontSize: "12px" }}
          >
            Search
          </button>
        </form>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#546e5c" }}>Actor Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #d4ded3",
              fontSize: "12px",
              background: "#fff",
              color: "#2d4233",
            }}
          >
            <option value="All">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Business">Business</option>
            <option value="Agent">Agent</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Guest">Guest</option>
          </select>
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setTimeout(() => loadLogs(), 10);
            }}
            style={{
              background: "none",
              border: 0,
              color: "#6b7d70",
              fontSize: "11px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Clear Search
          </button>
        )}
      </div>

      {loading && <p style={{ fontSize: "12px", color: "#66786c" }}>Refreshing platform activity stream…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {/* Empty State */}
      {!loading && !error && logs.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fbfcfb", borderRadius: "8px", border: "1px dashed #d5e0d4" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
          <strong style={{ fontSize: "15px", color: "#2d4233", display: "block" }}>No activity logs recorded yet</strong>
          <p style={{ fontSize: "12px", color: "#77877c", margin: "6px auto 14px", maxWidth: "460px", lineHeight: 1.5 }}>
            {searchQuery || categoryFilter !== "All" || roleFilter !== "All"
              ? "No activities matched your current category or search filters."
              : "Real customer and platform activities (registrations, logins, searches, WhatsApp leads, phone calls, SOS alerts) will be recorded live here."}
          </p>
        </div>
      )}

      {/* Log Stream */}
      <div style={{ display: "grid", gap: "10px" }}>
        {logs.map((log) => {
          const categoryBadgeColor: Record<string, { bg: string; text: string; border: string }> = {
            Call: { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
            Advertisement: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
            "Customer Care": { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
            Lead: { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
            Search: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
            Registration: { bg: "#faf5ff", text: "#6b21a8", border: "#e9d5ff" },
            Login: { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
            SOS: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
            View: { bg: "#f0fdfa", text: "#115e59", border: "#99f6e4" },
            Order: { bg: "#fdf4ff", text: "#86198f", border: "#f5d0fe" },
            Admin: { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" },
            General: { bg: "#f8faf8", text: "#4b5563", border: "#e5e7eb" },
          };

          const color = categoryBadgeColor[log.category] || categoryBadgeColor.General;

          return (
            <div
              key={log.id}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #edf2ed",
                background: "#ffffff",
                transition: "background 0.15s ease",
              }}
            >
              {/* Category Dot/Icon */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: color.bg,
                  color: color.text,
                  border: `1px solid ${color.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {log.category === "Call"
                  ? "📞"
                  : log.category === "Advertisement"
                  ? "📢"
                  : log.category === "Customer Care"
                  ? "🎧"
                  : log.category === "Lead"
                  ? "💬"
                  : log.category === "Search"
                  ? "🔍"
                  : log.category === "Registration"
                  ? "📝"
                  : log.category === "Login"
                  ? "🔑"
                  : log.category === "SOS"
                  ? "🚨"
                  : log.category === "View"
                  ? "👁️"
                  : log.category === "Order"
                  ? "📦"
                  : log.category === "Admin"
                  ? "🛡️"
                  : "📌"}
              </div>

              {/* Main Log Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "13px", color: "#1c2b20" }}>{log.action}</strong>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: color.bg,
                      color: color.text,
                      border: `1px solid ${color.border}`,
                      textTransform: "uppercase",
                    }}
                  >
                    {log.category}
                  </span>
                </div>

                {log.details && (
                  <p style={{ fontSize: "12px", color: "#546e5c", margin: "3px 0 4px", lineHeight: 1.4 }}>
                    {log.details}
                  </p>
                )}

                {/* Actor & Location Metadata */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", fontSize: "11px", color: "#77877c" }}>
                  <span>
                    👤 <strong>{log.actorName}</strong> ({log.actorRole})
                  </span>
                  {log.actorPhone && <span>📞 {log.actorPhone}</span>}
                  {log.locality && <span>📍 {log.locality}</span>}
                </div>
              </div>

              {/* Timestamp */}
              <div style={{ textAlign: "right", flexShrink: 0, fontSize: "11px" }}>
                <div style={{ fontWeight: 700, color: "#2d6a4f" }}>{formatRelativeTime(log.timestamp)}</div>
                <small style={{ color: "#8a968d", fontSize: "10px", display: "block" }}>
                  {new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
