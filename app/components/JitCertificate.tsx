"use client";

import React from "react";

export interface JitCertificateData {
  businessName: string;
  category?: string;
  locality?: string;
  address?: string;
  phone?: string;
  gstin?: string;
  certificateId?: string;
  issueDate?: string;
  validThrough?: string;
  assignedAgentName?: string;
  verifiedBy?: string;
  profileUrl?: string;
}

export const DEFAULT_SAMPLE_CERTIFICATE: JitCertificateData = {
  businessName: "Jishnu Infotech Private Limited",
  category: "IT & Software Solutions",
  locality: "NGGO's Colony, Hosur",
  address: "NGGO's Colony, Hosur",
  phone: "+91 90430 22219",
  certificateId: "BZR-JIT-2026-00001",
  issueDate: "12 November 2026",
  validThrough: "31 March 2027",
  assignedAgentName: "JIT",
  verifiedBy: "JIT On-Ground Verification Unit",
  profileUrl: "https://bizearch.in",
};

export function JitCertificate({
  data = DEFAULT_SAMPLE_CERTIFICATE,
  className = "",
}: {
  data?: JitCertificateData;
  className?: string;
}) {
  const businessName = (data.businessName || "Jishnu Infotech Private Limited").trim();
  const category = data.category || "IT & Software Solutions";
  const address = data.address || data.locality || "NGGO's Colony, Hosur";
  const phone = data.phone || "+91 90430 22219";
  const issueDate = data.issueDate || "12 November 2026";
  const validThrough = data.validThrough || "31 March 2027";
  const agentName = data.assignedAgentName || "JIT";

  // Check if this is the flagship business shown in the user's master artwork
  const isExactMaster =
    !businessName ||
    businessName.toLowerCase() === "jishnu infotech private limited" ||
    businessName.toLowerCase() === "jishnu infotech";

  // Deterministic certificate number if not given
  const num = Math.abs(
    businessName.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  const certId =
    data.certificateId ||
    (isExactMaster ? "BZR-JIT-2026-00001" : `BZR-JIT-2026-${String(1 + (num % 9999)).padStart(5, "0")}`);

  const sectorLower = category.toLowerCase();
  const sectorIcon =
    sectorLower.includes("software") ||
    sectorLower.includes("it ") ||
    sectorLower.includes("tech") ||
    sectorLower.includes("computer")
      ? "💻"
      : sectorLower.includes("clinic") ||
        sectorLower.includes("hospital") ||
        sectorLower.includes("ayurvedic") ||
        sectorLower.includes("health")
      ? "🏥"
      : sectorLower.includes("lab") ||
        sectorLower.includes("education") ||
        sectorLower.includes("coaching")
      ? "🎓"
      : "🏪";

  return (
    <div className={`jit-cert-root ${className}`}>
      <div className="jit-cert-canvas">
        {/* The Exact Master Design Template */}
        <img
          src="/bizearch-verified-certificate-exact.jpg"
          alt="Bizearch Verified Business Certificate"
          className="jit-cert-bg-image"
        />

        {/* Dynamic Overlays: ONLY applied when rendering a different business from the master template */}
        {!isExactMaster && (
          <div className="jit-cert-dynamic-overlays">
            {/* 1. Dynamic Certificate Number */}
            <div className="overlay-cert-no">
              <span className="cert-no-label">CERTIFICATE NO:&nbsp;</span>
              <strong>{certId}</strong>
            </div>

            {/* 2. Dynamic Business Name */}
            <div className="overlay-business-name">
              <h2>{businessName}</h2>
            </div>

            {/* 3. Dynamic Business Details Pill */}
            <div className="overlay-details-pill-wrap">
              <div className="overlay-details-pill">
                <span className="pill-entry">
                  <span className="pill-ico">{sectorIcon}</span>
                  <span>{category}</span>
                </span>
                <span className="pill-bar">|</span>
                <span className="pill-entry">
                  <span className="pill-ico">📍</span>
                  <span>{address}</span>
                </span>
                <span className="pill-bar">|</span>
                <span className="pill-entry">
                  <span className="pill-ico">📞</span>
                  <span>{phone}</span>
                </span>
              </div>
            </div>

            {/* 4. Dynamic Verification Date */}
            <div className="overlay-date-verification">
              {issueDate}
            </div>

            {/* 5. Dynamic Valid Through Date */}
            <div className="overlay-date-valid">
              {validThrough}
            </div>

            {/* 6. Dynamic Verifying Agent Name & Signature */}
            {agentName !== "JIT" && (
              <div className="overlay-agent-signature-block">
                <div className="overlay-agent-script">{agentName}</div>
                <div className="overlay-agent-bar"></div>
                <div className="overlay-agent-name">{agentName}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .jit-cert-root {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px;
          background: transparent;
        }

        .jit-cert-canvas {
          position: relative;
          width: 1024px;
          height: 712px;
          max-width: 100%;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
          background: #ffffff;
        }

        .jit-cert-bg-image {
          width: 100%;
          height: 100%;
          object-fit: fill;
          display: block;
        }

        .jit-cert-dynamic-overlays {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* 1. Dynamic Cert No */
        .overlay-cert-no {
          position: absolute;
          top: 80px;
          right: 60px;
          background: #ffffff;
          padding: 1px 6px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          color: #0b1e33;
          letter-spacing: 0.5px;
          text-align: right;
        }

        /* 2. Dynamic Business Name */
        .overlay-business-name {
          position: absolute;
          top: 242px;
          left: 175px;
          right: 175px;
          height: 48px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .overlay-business-name h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
          font-weight: 900;
          color: #091a2b;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 0;
          line-height: 1.1;
        }

        /* 3. Dynamic Details Pill */
        .overlay-details-pill-wrap {
          position: absolute;
          top: 295px;
          left: 170px;
          right: 170px;
          height: 36px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .overlay-details-pill {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #fbf5ea;
          border: 1px solid #ebd9bc;
          border-radius: 999px;
          padding: 4px 18px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1e293b;
        }

        .pill-entry {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .pill-ico {
          font-size: 13px;
        }

        .pill-bar {
          color: #c5a059;
          font-size: 12px;
        }

        /* 4. Verification Date */
        .overlay-date-verification {
          position: absolute;
          top: 486px;
          left: 345px;
          width: 175px;
          height: 22px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #091a2b;
        }

        /* 5. Valid Through Date */
        .overlay-date-valid {
          position: absolute;
          top: 486px;
          left: 540px;
          width: 155px;
          height: 22px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #091a2b;
        }

        /* 6. Agent Signature Block */
        .overlay-agent-signature-block {
          position: absolute;
          top: 544px;
          left: 630px;
          width: 125px;
          height: 60px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
        }

        .overlay-agent-script {
          font-family: "Brush Script MT", "Caveat", cursive, serif;
          font-size: 22px;
          color: #091a2b;
          height: 26px;
          line-height: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .overlay-agent-bar {
          width: 100%;
          height: 1.5px;
          background: #d4af37;
          margin: 3px 0 2px;
        }

        .overlay-agent-name {
          font-size: 11px;
          font-weight: 800;
          color: #091a2b;
        }

        @media print {
          .jit-cert-root {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .jit-cert-canvas {
            width: 100% !important;
            height: 100vh !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
