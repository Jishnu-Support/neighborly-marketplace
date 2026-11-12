"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JitCertificate, type JitCertificateData, DEFAULT_SAMPLE_CERTIFICATE, downloadMasterCertificate } from "../components/JitCertificate";

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
  if (!name || name.toLowerCase().includes("jishnu infotech")) {
    return "BZR-JIT-2026-00001";
  }
  const num = Math.abs(
    name.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  return `BZR-JIT-2026-${String(1 + (num % 9999)).padStart(5, "0")}`;
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

  // Fetch registered businesses and establish dropdown
  useEffect(() => {
    setLoading(true);
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        const rawList: BusinessRecord[] = Array.isArray(data.businesses) ? data.businesses : [];
        
        // Ensure flagship business is always available in the directory list
        const flagshipRecord: BusinessRecord = {
          name: DEFAULT_SAMPLE_CERTIFICATE.businessName,
          category: DEFAULT_SAMPLE_CERTIFICATE.category,
          address: DEFAULT_SAMPLE_CERTIFICATE.address,
          phone: DEFAULT_SAMPLE_CERTIFICATE.phone,
          assignedAgentName: DEFAULT_SAMPLE_CERTIFICATE.assignedAgentName,
          createdAt: "2026-11-12T00:00:00Z",
          verificationStatus: "Approved",
          active: true,
        };

        const existingFlagship = rawList.find(
          (b) => b.name?.toLowerCase().includes("jishnu infotech")
        );
        const combinedList: BusinessRecord[] = existingFlagship
          ? rawList
          : [flagshipRecord, ...rawList];

        setBusinesses(combinedList);

        // Find the matching business to show
        let found: BusinessRecord | null = null;

        if (idParam) {
          found = combinedList.find((b) => b.id === idParam) || null;
        }
        if (!found && businessParam) {
          found =
            combinedList.find((b) => b.name?.toLowerCase() === businessParam.toLowerCase()) ||
            combinedList.find((b) => b.name?.toLowerCase().includes(businessParam.toLowerCase())) ||
            null;
        }

        // If not found in API list but businessParam was provided via URL query params, synthesize from params
        if (!found && businessParam) {
          found = {
            name: businessParam,
            category: searchParams.get("category") || "Retail & Business",
            address: searchParams.get("address") || searchParams.get("locality") || "Hosur, Tamil Nadu",
            phone: searchParams.get("phone") || "",
            gstin: searchParams.get("gstin") || "",
            assignedAgentName: agentParam || "JIT",
            createdAt: searchParams.get("date") || undefined,
          };
        }

        // If no param, default to Jishnu Infotech Private Limited (matching exact reference certificate)
        if (!found) {
          found = flagshipRecord;
        }

        setSelectedBusiness(found);
      })
      .catch(() => {
        setSelectedBusiness({
          name: DEFAULT_SAMPLE_CERTIFICATE.businessName,
          category: DEFAULT_SAMPLE_CERTIFICATE.category,
          address: DEFAULT_SAMPLE_CERTIFICATE.address,
          phone: DEFAULT_SAMPLE_CERTIFICATE.phone,
          assignedAgentName: DEFAULT_SAMPLE_CERTIFICATE.assignedAgentName,
        });
      })
      .finally(() => setLoading(false));
  }, [businessParam, idParam]);

  // Build certificate data from selected business
  useEffect(() => {
    if (!selectedBusiness) {
      setCertData(null);
      return;
    }

    const name = selectedBusiness.name;
    const isFlagship = name.toLowerCase().includes("jishnu infotech");
    const category = selectedBusiness.category || (isFlagship ? "IT & Software Solutions" : "Retail & Business");
    const address = formatAddress(selectedBusiness.address as string | Record<string, unknown>) || (isFlagship ? "NGGO's Colony, Hosur" : "Hosur, Tamil Nadu");
    const phone = selectedBusiness.phone || (isFlagship ? "+91 90430 22219" : "");
    const gstin = selectedBusiness.gstin || "";
    const certId = buildCertId(name, certIdParam);
    const issueDate = isFlagship ? "12 November 2026" : formatDate(selectedBusiness.createdAt);

    const agentName =
      agentParam ||
      selectedBusiness.assignedAgentName ||
      selectedBusiness.agentVerification?.agentName ||
      "JIT";

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

  const isFlagshipCert = certData?.businessName?.toLowerCase().includes("jishnu infotech");

  return (
    <div className="certificate-page-container">
      {/* Top Control Bar (hidden on print) */}
      <header className="cert-control-bar no-print">
        <div className="control-left">
          <Link href="/" className="back-link">← Back to Bizearch</Link>
          <span className="control-divider">|</span>
          <span className="control-title">Official Bizearch Certificate of Verification</span>
        </div>

        <div className="control-center">
          {businesses.length > 0 && (
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
              <button
                type="button"
                onClick={() => downloadMasterCertificate(certData)}
                className="action-btn outline-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <span>⬇️</span> Download Master JPG
              </button>
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
          background: #141c16;
          display: flex;
          flex-direction: column;
        }

        .cert-control-bar {
          background: #0d140f;
          border-bottom: 1px solid #233527;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
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
          background: #1e2a21;
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

        @page {
          size: A4 landscape;
          margin: 0;
        }

        @media (max-width: 820px) {
          .cert-control-bar {
            padding: 10px 14px;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .control-left {
            justify-content: space-between;
            width: 100%;
          }
          .control-center {
            width: 100%;
          }
          .business-selector-wrap {
            width: 100%;
            display: flex;
          }
          .cert-select {
            flex: 1;
            max-width: none;
            width: 100%;
          }
          .control-right {
            width: 100%;
            flex-wrap: wrap;
            gap: 8px;
          }
          .action-btn {
            flex: 1 1 calc(50% - 6px);
            text-align: center;
            justify-content: center;
            padding: 10px 12px;
            font-size: 11.5px;
          }
          .cert-main-viewport {
            padding: 10px 4px;
          }
        }

        @media (max-width: 480px) {
          .action-btn {
            flex: 1 1 100%;
          }
        }

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
