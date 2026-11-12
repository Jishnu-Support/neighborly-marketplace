"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JitCertificate, type JitCertificateData } from "../components/JitCertificate";

type BusinessRecord = {
  name: string;
  id?: string;
  category?: string;
  locality?: string;
  phone?: string;
  gstin?: string;
  address?: string | Record<string, unknown>;
  assignedAgentName?: string;
  agentVerification?: { agentName?: string };
  verificationStatus?: string;
  createdAt?: string;
  active?: boolean;
};

function formatAddress(address: string | Record<string, unknown> | undefined): string | undefined {
  if (!address) return undefined;
  if (typeof address === "string") return address;
  return Object.values(address).filter(Boolean).join(", ");
}

function buildCertId(name: string, certIdParam: string): string {
  if (certIdParam) return certIdParam;
  const num = Math.abs(
    name.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  return `BZR-JIT-TN-2026-${1000 + (num % 9000)}`;
}

function formatDate(isoString?: string): string {
  if (!isoString) return "12 November 2026";
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "12 November 2026";
  }
}

function CertificatePageInner() {
  const searchParams = useSearchParams();
  const businessParam = searchParams.get("business") || searchParams.get("name") || "";
  const idParam = searchParams.get("id") || "";
  const certIdParam = searchParams.get("certId") || "";
  const agentParam = searchParams.get("agent") || "";

  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessRecord | null>(null);
  const [certData, setCertData] = useState<JitCertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch real registered businesses from API
  useEffect(() => {
    setLoading(true);
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        const list: BusinessRecord[] = Array.isArray(data.businesses) ? data.businesses : [];
        setBusinesses(list);

        // Find the right business to show
        let found: BusinessRecord | null = null;

        if (idParam) {
          found = list.find((b) => b.id === idParam) || null;
        }
        if (!found && businessParam) {
          found =
            list.find((b) => b.name?.toLowerCase() === businessParam.toLowerCase()) ||
            list.find((b) => b.name?.toLowerCase().includes(businessParam.toLowerCase())) ||
            null;
        }
        // If only one business, default to it
        if (!found && list.length === 1) {
          found = list[0];
        }

        if (found) {
          setSelectedBusiness(found);
        } else if (list.length > 0) {
          // Default to first if no specific business selected
          setSelectedBusiness(list[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessParam, idParam]);

  // Build certificate data from selected business
  useEffect(() => {
    if (!selectedBusiness) {
      setCertData(null);
      return;
    }

    const name = selectedBusiness.name;
    const category = selectedBusiness.category || "";
    const address = formatAddress(selectedBusiness.address as string | Record<string, unknown>);
    const phone = selectedBusiness.phone || "";
    const gstin = selectedBusiness.gstin || "";
    const certId = buildCertId(name, certIdParam);
    const issueDate = formatDate(selectedBusiness.createdAt);

    const agentName =
      agentParam ||
      selectedBusiness.assignedAgentName ||
      selectedBusiness.agentVerification?.agentName ||
      "JIT Operations Wing";

    setCertData({
      businessName: name,
      category,
      address,
      phone,
      gstin,
      certificateId: certId,
      issueDate,
      validThrough: "31 March 2027",
      assignedAgentName: agentName,
      verifiedBy: "JIT On-Ground Verification Unit",
      profileUrl: "https://bizearch.in",
    });
  }, [selectedBusiness, certIdParam, agentParam]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard && certData) {
      const url = `${window.location.origin}/certificate?business=${encodeURIComponent(certData.businessName)}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="certificate-page-container">
      {/* Top Control Bar (hidden on print) */}
      <header className="cert-control-bar no-print">
        <div className="control-left">
          <Link href="/" className="back-link">← Back to Bizearch</Link>
          <span className="control-divider">|</span>
          <span className="control-title">JIT Verified Certificate Registry</span>
        </div>

        <div className="control-center">
          {businesses.length > 1 && (
            <div className="business-selector-wrap">
              <label htmlFor="cert-biz-select" className="selector-label">Business:</label>
              <select
                id="cert-biz-select"
                value={selectedBusiness?.name || ""}
                onChange={(e) => {
                  const found = businesses.find((b) => b.name === e.target.value);
                  if (found) setSelectedBusiness(found);
                }}
                className="cert-select"
              >
                {businesses.map((b) => (
                  <option key={b.id || b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="control-right">
          {certData && (
            <>
              <button type="button" onClick={handleCopyLink} className="action-btn outline-btn">
                {copied ? "✓ Link Copied!" : "🔗 Copy Link"}
              </button>
              <button type="button" onClick={handlePrint} className="action-btn primary-btn">
                🖨️ Print / Save as PDF
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Certificate Area */}
      <main className="cert-main-viewport">
        {loading ? (
          <div className="cert-status-box">
            <div className="cert-spinner" />
            <p>Loading certificate data…</p>
          </div>
        ) : !certData ? (
          <div className="cert-status-box">
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
            <h2>No Business Found</h2>
            <p>
              {businesses.length === 0
                ? "No registered businesses found on this platform yet."
                : "Could not find the requested business. Please select one from the list above."}
            </p>
          </div>
        ) : (
          <JitCertificate data={certData} />
        )}
      </main>

      <style jsx>{`
        .certificate-page-container {
          min-height: 100vh;
          background: #1e2621;
          display: flex;
          flex-direction: column;
        }

        .cert-control-bar {
          background: #141c16;
          border-bottom: 1px solid #2d3f32;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        }

        .control-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .back-link {
          color: #a4e2ba;
          text-decoration: none;
          font-weight: 800;
          font-size: 13px;
        }
        .back-link:hover { color: #ffffff; }

        .control-divider { color: #3b5442; }

        .control-title {
          font-size: 13px;
          font-weight: 700;
          color: #d1e3d6;
        }

        .control-center {
          display: flex;
          align-items: center;
        }

        .business-selector-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .selector-label {
          font-size: 12px;
          color: #9cb5a3;
          font-weight: 600;
        }

        .cert-select {
          background: #253328;
          color: #ffffff;
          border: 1px solid #3c5443;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          max-width: 320px;
          cursor: pointer;
        }

        .control-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .action-btn {
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .outline-btn {
          background: rgba(255,255,255,0.1);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .outline-btn:hover { background: rgba(255,255,255,0.18); }

        .primary-btn {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(16,185,129,0.3);
        }
        .primary-btn:hover { background: #059669; }

        .cert-main-viewport {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px 16px;
        }

        .cert-status-box {
          text-align: center;
          color: #a4e2ba;
          padding: 48px 24px;
        }
        .cert-status-box h2 {
          font-size: 20px;
          margin-bottom: 8px;
          color: #ffffff;
        }
        .cert-status-box p {
          font-size: 14px;
          color: #9cb5a3;
        }

        .cert-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(164,226,186,0.2);
          border-top-color: #a4e2ba;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media print {
          .no-print { display: none !important; }
          .certificate-page-container {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .cert-main-viewport {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#ffffff", textAlign: "center" }}>Loading Certificate…</div>}>
      <CertificatePageInner />
    </Suspense>
  );
}
