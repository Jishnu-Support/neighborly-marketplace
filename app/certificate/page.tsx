"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JitCertificate, type JitCertificateData, DEFAULT_SAMPLE_CERTIFICATE } from "../components/JitCertificate";

function CertificatePageInner() {
  const searchParams = useSearchParams();
  const businessParam = searchParams.get("business") || searchParams.get("name") || "";
  const idParam = searchParams.get("id") || "";
  const categoryParam = searchParams.get("category") || "";
  const addressParam = searchParams.get("address") || searchParams.get("locality") || "";
  const gstinParam = searchParams.get("gstin") || "";
  const certIdParam = searchParams.get("certId") || "";

  const [businesses, setBusinesses] = useState<Array<{ name: string; category?: string; locality?: string; phone?: string; gstin?: string; address?: string }>>([]);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>(businessParam || DEFAULT_SAMPLE_CERTIFICATE.businessName);
  const [certData, setCertData] = useState<JitCertificateData>(DEFAULT_SAMPLE_CERTIFICATE);
  const [copied, setCopied] = useState(false);

  // Fetch registered businesses for quick switcher
  useEffect(() => {
    let active = true;
    fetch("/api/businesses")
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.businesses) && data.businesses.length > 0) {
          setBusinesses(data.businesses);
          // If query param matched one of them, select it
          if (businessParam) {
            const found = data.businesses.find(
              (b: any) => b.name?.toLowerCase() === businessParam.toLowerCase()
            );
            if (found) {
              setSelectedBusinessName(found.name);
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [businessParam]);

  // Construct certificate data based on selection or query params
  useEffect(() => {
    const matched = businesses.find(
      (b) => b.name?.toLowerCase() === selectedBusinessName.toLowerCase()
    );

    const name = businessParam || selectedBusinessName || DEFAULT_SAMPLE_CERTIFICATE.businessName;
    const category = categoryParam || (matched as any)?.category || DEFAULT_SAMPLE_CERTIFICATE.category;
    const address = addressParam || (matched as any)?.address || (matched as any)?.locality || DEFAULT_SAMPLE_CERTIFICATE.address;
    const phone = (matched as any)?.phone || DEFAULT_SAMPLE_CERTIFICATE.phone;
    const gstin = gstinParam || (matched as any)?.gstin || DEFAULT_SAMPLE_CERTIFICATE.gstin;

    const num = Math.abs(
      name.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
    );
    const hashId =
      certIdParam ||
      `BZR-JIT-TN-2026-${1000 + (num % 9000)}`;

    setCertData({
      businessName: name,
      category,
      address,
      phone,
      gstin,
      certificateId: hashId,
      issueDate: "12 November 2026",
      validThrough: "31 March 2027",
      assignedAgentName: "JIT Field Operations Wing",
      verifiedBy: "JIT On-Ground Verification Unit",
      profileUrl: `https://bizearch.in`,
    });
  }, [selectedBusinessName, businesses, businessParam, categoryParam, addressParam, gstinParam, certIdParam]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      const url = `${window.location.origin}/certificate?business=${encodeURIComponent(certData.businessName)}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="certificate-page-container">
      {/* Top Floating Control Bar (Hidden on print) */}
      <header className="cert-control-bar no-print">
        <div className="control-left">
          <Link href="/" className="back-link">
            ← Back to Bizearch
          </Link>
          <span className="control-divider">|</span>
          <span className="control-title">Official JIT Certificate Registry</span>
        </div>

        <div className="control-center">
          {businesses.length > 0 && (
            <div className="business-selector-wrap">
              <label htmlFor="cert-biz-select" className="selector-label">
                Preview Store:
              </label>
              <select
                id="cert-biz-select"
                value={selectedBusinessName}
                onChange={(e) => setSelectedBusinessName(e.target.value)}
                className="cert-select"
              >
                {businesses.slice(0, 30).map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.category || "Store"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="control-right">
          <button type="button" onClick={handleCopyLink} className="action-btn outline-btn">
            {copied ? "✓ Link Copied!" : "🔗 Shareable Link"}
          </button>
          <button type="button" onClick={handlePrint} className="action-btn primary-btn">
            🖨️ Print / Save as PDF (A4)
          </button>
        </div>
      </header>

      {/* Main Certificate Canvas */}
      <main className="cert-main-viewport">
        <JitCertificate data={certData} />
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
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
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
          transition: color 0.15s ease;
        }
        .back-link:hover {
          color: #ffffff;
        }

        .control-divider {
          color: #3b5442;
        }

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
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .outline-btn:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        .primary-btn {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        .primary-btn:hover {
          background: #059669;
        }

        .cert-main-viewport {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px 16px;
        }

        @media print {
          .no-print {
            display: none !important;
          }
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
    <Suspense fallback={<div style={{ padding: "40px", color: "#ffffff", textAlign: "center" }}>Loading Certificate...</div>}>
      <CertificatePageInner />
    </Suspense>
  );
}
