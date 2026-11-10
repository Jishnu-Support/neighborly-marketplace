"use client";

import { useEffect, useState, useMemo } from "react";
import type { AdActivityLogRecord } from "./lib/ad-activity-logs";

interface CompanyAdsActivityLogsPanelProps {
  accessLevel: "Admin" | "Super Admin";
}

export function CompanyAdsActivityLogsPanel({ accessLevel }: CompanyAdsActivityLogsPanelProps) {
  const [logs, setLogs] = useState<AdActivityLogRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    bookings: 0,
    payments: 0,
    approvals: 0,
    rejections: 0,
    impressions: 0,
    clicks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("All");
  const [surfaceFilter, setSurfaceFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loadLogs = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (typeFilter !== "All") params.set("type", typeFilter);
    if (surfaceFilter !== "All") params.set("surface", surfaceFilter);
    if (searchQuery.trim()) params.set("query", searchQuery.trim());

    fetch(`/api/company/ads/activity-logs?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load ads activity logs.");
        setLogs(data.logs || []);
        if (data.stats) setStats(data.stats);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error loading ad logs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, [typeFilter, surfaceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  const clearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all advertisement activity logs? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/company/ads/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear logs.");
      setLogs(data.logs || []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error clearing logs.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "Booking":
        return { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
      case "Payment":
        return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" };
      case "Approval":
        return { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" };
      case "Rejection":
        return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
      case "Click":
        return { background: "#f3e8ff", color: "#6b21a8", border: "1px solid #d8b4fe" };
      case "Impression":
      default:
        return { background: "#e0f2fe", color: "#075985", border: "1px solid #7dd3fc" };
    }
  };

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {/* Top Header Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#c2410c",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            📢 ADVERTISING PERFORMANCE &amp; AUDIT TRAIL · 1-YEAR RETENTION
          </div>
          <h2 style={{ margin: "4px 0", fontSize: "20px", color: "#0f172a" }}>
            Ads Activity Log
          </h2>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0", maxWidth: "680px" }}>
            Dedicated server module tracking all advertisement impressions, banner clicks, customer leads, campaign bookings, payments, and approvals across Bizearch over the last 365 days.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <a
            href={`/api/company/ads/activity-logs/export?format=xlsx&type=${typeFilter}&surface=${surfaceFilter}`}
            download="bizearch-ads-activity-logs.xlsx"
            className="primary-button"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 14px",
              background: "#c2410c",
              borderColor: "#c2410c",
            }}
          >
            📊 Export Excel (.xlsx)
          </a>
          <a
            href={`/api/company/ads/activity-logs/export?format=pdf&type=${typeFilter}&surface=${surfaceFilter}`}
            download="bizearch-ads-activity-logs.pdf"
            className="outline-button"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "8px 14px",
              background: "#fff7ed",
              borderColor: "#fed7aa",
              color: "#c2410c",
              fontWeight: 700,
            }}
          >
            📑 Export PDF (.pdf)
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
          {accessLevel === "Super Admin" && (
            <button
              type="button"
              className="outline-button"
              onClick={clearLogs}
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
              title="Permanently clear all ads activity logs"
            >
              🗑️ Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "10px",
        }}
      >
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Events</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{stats.total.toLocaleString()}</div>
        </div>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", color: "#0284c7", fontWeight: 700, textTransform: "uppercase" }}>Impressions (Views)</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0369a1", marginTop: "2px" }}>{stats.impressions.toLocaleString()}</div>
        </div>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", color: "#9333ea", fontWeight: 700, textTransform: "uppercase" }}>Clicks &amp; Leads</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#7e22ce", marginTop: "2px" }}>{stats.clicks.toLocaleString()}</div>
        </div>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, textTransform: "uppercase" }}>Bookings</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#15803d", marginTop: "2px" }}>{stats.bookings.toLocaleString()}</div>
        </div>
        <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 700, textTransform: "uppercase" }}>Approvals / Paid</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#4338ca", marginTop: "2px" }}>{(stats.approvals + stats.payments).toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "12px 16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                background: "#f8fafc",
              }}
            >
              <option value="All">All Types</option>
              <option value="Impression">Impressions (Views)</option>
              <option value="Click">Clicks &amp; Leads</option>
              <option value="Booking">Campaign Bookings</option>
              <option value="Payment">Payments Confirmed</option>
              <option value="Approval">Approvals</option>
              <option value="Rejection">Rejections</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
            <span>Surface:</span>
            <select
              value={surfaceFilter}
              onChange={(e) => setSurfaceFilter(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                background: "#f8fafc",
              }}
            >
              <option value="All">All Surfaces</option>
              <option value="poster">Poster Billboard</option>
              <option value="content">Content / Marquee</option>
              <option value="video">Video Spotlight</option>
              <option value="Banner">General Banner</option>
            </select>
          </label>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <input
            type="search"
            placeholder="Search business, campaign, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              width: "240px",
            }}
          />
          <button
            type="submit"
            className="outline-button"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "12px",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "10px 14px", fontWeight: 700, width: "140px" }}>Date &amp; Time</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, width: "110px" }}>Type</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Business &amp; Campaign</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Surface / Placement</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Action Details</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Lead / Actor</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Locality</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    Loading advertisement activity logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📢</div>
                    <strong style={{ fontSize: "14px", color: "#334155", display: "block" }}>
                      No advertisement activity records found
                    </strong>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {searchQuery || typeFilter !== "All" || surfaceFilter !== "All"
                        ? "Try clearing your filters to view more records."
                        : "Ad views, clicks, bookings, and approvals will automatically appear here."}
                    </span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badgeStyle = getTypeBadgeStyle(log.type);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.1s ease",
                      }}
                    >
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "#64748b", fontSize: "11.5px" }}>
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            ...badgeStyle,
                          }}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{log.businessName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{log.campaignTitle}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569", fontSize: "11.5px" }}>
                        {log.surface || "Billboard Banner"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#334155", maxWidth: "260px" }}>
                        <div style={{ fontWeight: 600 }}>{log.action}</div>
                        {log.details && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            {log.details}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#334155" }}>
                        <div style={{ fontWeight: 600 }}>{log.actorName}</div>
                        {log.actorPhone && (
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{log.actorPhone}</div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "11.5px" }}>
                        {log.locality || "Hosur"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CompanyAdsActivityLogsPanel;
