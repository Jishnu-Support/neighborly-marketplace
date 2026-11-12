"use client";

import React, { useRef } from "react";
import Link from "next/link";

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
  businessName: "Tarun Motors Hero – Mathigiri, Hosur",
  category: "Automobiles & Two-Wheeler Sales / Service",
  locality: "Mathigiri, Hosur",
  address: "Denkanikottai Main Road, Near RC Church, Mathigiri, Hosur - 635109",
  phone: "+91 98420 28389",
  gstin: "33AABCT8921M1Z4",
  certificateId: "BZR-JIT-TN-2026-8842",
  issueDate: "12 November 2026",
  validThrough: "31 March 2027",
  assignedAgentName: "JIT Field Operations Wing",
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
  const num = Math.abs(
    (data.businessName || "").split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  const certId =
    data.certificateId ||
    `BZR-JIT-TN-2026-${1000 + (num % 9000)}`;

  return (
    <div className={`jit-cert-outer-wrapper ${className}`}>
      {/* A4 Landscape Document Container (297mm x 210mm ratio = 1.414) */}
      <div className="jit-cert-frame">
        {/* Guilloche Corner Ornaments (SVG) */}
        <div className="cert-corner cert-corner-tl">
          <svg viewBox="0 0 100 100" className="corner-svg">
            <path d="M 0 0 L 100 0 C 45 0 0 45 0 100 Z" fill="#b48324" opacity="0.15" />
            <path d="M 5 5 L 85 5 C 40 5 5 40 5 85 Z" fill="none" stroke="#b48324" strokeWidth="1.5" />
            <circle cx="28" cy="28" r="8" fill="none" stroke="#d4af37" strokeWidth="1.5" />
            <circle cx="28" cy="28" r="4" fill="#b48324" />
            <path d="M 5 5 L 45 45" stroke="#b48324" strokeWidth="1" />
          </svg>
        </div>
        <div className="cert-corner cert-corner-tr">
          <svg viewBox="0 0 100 100" className="corner-svg">
            <path d="M 100 0 L 0 0 C 55 0 100 45 100 100 Z" fill="#b48324" opacity="0.15" />
            <path d="M 95 5 L 15 5 C 60 5 95 40 95 85 Z" fill="none" stroke="#b48324" strokeWidth="1.5" />
            <circle cx="72" cy="28" r="8" fill="none" stroke="#d4af37" strokeWidth="1.5" />
            <circle cx="72" cy="28" r="4" fill="#b48324" />
            <path d="M 95 5 L 55 45" stroke="#b48324" strokeWidth="1" />
          </svg>
        </div>
        <div className="cert-corner cert-corner-bl">
          <svg viewBox="0 0 100 100" className="corner-svg">
            <path d="M 0 100 L 100 100 C 45 100 0 55 0 0 Z" fill="#b48324" opacity="0.15" />
            <path d="M 5 95 L 85 95 C 40 95 5 60 5 15 Z" fill="none" stroke="#b48324" strokeWidth="1.5" />
            <circle cx="28" cy="72" r="8" fill="none" stroke="#d4af37" strokeWidth="1.5" />
            <circle cx="28" cy="72" r="4" fill="#b48324" />
            <path d="M 5 95 L 45 55" stroke="#b48324" strokeWidth="1" />
          </svg>
        </div>
        <div className="cert-corner cert-corner-br">
          <svg viewBox="0 0 100 100" className="corner-svg">
            <path d="M 100 100 L 0 100 C 55 100 100 55 100 0 Z" fill="#b48324" opacity="0.15" />
            <path d="M 95 95 L 15 95 C 60 95 95 60 95 15 Z" fill="none" stroke="#b48324" strokeWidth="1.5" />
            <circle cx="72" cy="72" r="8" fill="none" stroke="#d4af37" strokeWidth="1.5" />
            <circle cx="72" cy="72" r="4" fill="#b48324" />
            <path d="M 95 95 L 55 55" stroke="#b48324" strokeWidth="1" />
          </svg>
        </div>

        {/* Security Watermark Background Emblem */}
        <div className="cert-watermark">
          <svg viewBox="0 0 400 400" className="watermark-svg">
            <circle cx="200" cy="200" r="175" fill="none" stroke="#b48324" strokeWidth="3" opacity="0.05" />
            <circle cx="200" cy="200" r="155" fill="none" stroke="#b48324" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.07" />
            <circle cx="200" cy="200" r="130" fill="none" stroke="#b48324" strokeWidth="2" opacity="0.05" />
            <path d="M 200 80 L 230 170 L 320 170 L 250 225 L 275 315 L 200 260 L 125 315 L 150 225 L 80 170 L 170 170 Z" fill="#b48324" opacity="0.03" />
            <text x="200" y="205" textAnchor="middle" fontSize="34" fontWeight="900" fill="#b48324" opacity="0.06" letterSpacing="4">
              BIZEARCH
            </text>
            <text x="200" y="235" textAnchor="middle" fontSize="16" fontWeight="700" fill="#b48324" opacity="0.06" letterSpacing="2">
              JIT VERIFIED
            </text>
          </svg>
        </div>

        {/* Inner Border System */}
        <div className="jit-cert-inner-content">
          {/* HEADER STRIP */}
          <div className="cert-header-strip">
            <div className="cert-brand-block">
              <div className="cert-logo-row">
                <span className="cert-logo-icon">⌖</span>
                <span className="cert-brand-text">BIZEARCH<span className="dot-in">.IN</span></span>
              </div>
              <span className="cert-brand-sub">India&apos;s Hyperlocal Neighborhood Discovery Engine</span>
            </div>

            <div className="cert-crest-center">
              <div className="cert-shield-crest">
                <span>🛡️</span>
              </div>
              <span className="cert-registry-tag">OFFICIAL REGISTRATION REGISTRY</span>
            </div>

            <div className="cert-meta-right">
              <div className="cert-badge-pill">
                <span className="live-dot">●</span> JIT ON-GROUND VERIFIED
              </div>
              <div className="cert-id-tag">
                Certificate No: <strong>{certId}</strong>
              </div>
            </div>
          </div>

          {/* MAIN TITLES */}
          <div className="cert-title-section">
            <div className="cert-eyebrow">
              COMMERCIAL AUTHENTICITY &amp; NEIGHBORHOOD TRUST ACCREDITATION
            </div>
            <h1 className="cert-main-title">
              Certificate of Verification
            </h1>
            <div className="cert-title-rule">
              <span className="rule-diamond">◆</span>
            </div>
          </div>

          {/* PRESENTATION PHRASE */}
          <div className="cert-recipient-section">
            <p className="cert-intro-phrase">
              This is to officially certify and accredit that the local business establishment
            </p>

            <h2 className="cert-business-name">
              {data.businessName}
            </h2>

            {/* Address & Category metadata */}
            <div className="cert-business-meta">
              {data.category && (
                <span className="meta-item">
                  <strong>Sector:</strong> {data.category}
                </span>
              )}
              {data.address && (
                <>
                  <span className="meta-sep">•</span>
                  <span className="meta-item">
                    <strong>Premises:</strong> {data.address}
                  </span>
                </>
              )}
              {data.gstin && (
                <>
                  <span className="meta-sep">•</span>
                  <span className="meta-item">
                    <strong>GSTIN / Tax ID:</strong> {data.gstin}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* LEGAL CITATION / DECLARATION */}
          <div className="cert-statement-box">
            <p className="cert-statement-text">
              Has successfully undergone comprehensive on-ground physical inspection, doorstep identity authentication,
              and catalog verification conducted by certified <strong>JIT Field Operations Personnel</strong>.
              Having met all criteria for authentic neighborhood commerce, customer trust, and verified local operation,
              the enterprise is officially designated as a <strong>JIT Verified Store</strong> on the Bizearch directory network.
            </p>
          </div>

          {/* FOOTER: QR + 3D GOLD SEAL + SIGNATURES */}
          <div className="cert-footer-row">
            {/* Left: Scannable QR Code */}
            <div className="cert-qr-block">
              <div className="qr-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bizearch-qr.png"
                  alt="Scan to Verify Certificate"
                  className="cert-qr-img"
                />
              </div>
              <div className="qr-caption">
                <span className="qr-scan-title">SCAN TO VERIFY LIVE</span>
                <span className="qr-url">bizearch.in/verify</span>
              </div>
            </div>

            {/* Center: Metallic Gold Medallion Ribbon Seal */}
            <div className="cert-seal-block">
              <div className="gold-seal-medallion">
                <div className="seal-outer-ring">
                  <div className="seal-inner-circle">
                    <div className="seal-star">★ ★ ★</div>
                    <div className="seal-core-text">JIT</div>
                    <div className="seal-sub-text">VERIFIED</div>
                    <div className="seal-year">2026 – 2027</div>
                  </div>
                </div>
                {/* Hanging Gold/Emerald Ribbons */}
                <div className="seal-ribbon ribbon-left"></div>
                <div className="seal-ribbon ribbon-right"></div>
              </div>
            </div>

            {/* Right: Dual Formal Signatures */}
            <div className="cert-signatures-block">
              <div className="sig-unit">
                <div className="sig-line">
                  <div className="sig-cursive-font">K. Soundararajan</div>
                </div>
                <div className="sig-title">Head of Field Verification</div>
                <div className="sig-org">JIT Operations Wing, Hosur</div>
              </div>

              <div className="sig-unit">
                <div className="sig-line">
                  <div className="sig-cursive-font">Dr. Arvind R. Iyer</div>
                </div>
                <div className="sig-title">Director of Trust &amp; Safety</div>
                <div className="sig-org">Bizearch Technologies Ltd.</div>
              </div>
            </div>
          </div>

          {/* BOTTOM AUDIT STRIP */}
          <div className="cert-audit-strip">
            <span>Issue Date: <strong>{data.issueDate || "November 2026"}</strong></span>
            <span>•</span>
            <span>Valid Through: <strong>{data.validThrough || "March 31, 2027"}</strong></span>
            <span>•</span>
            <span>Verification Authority: <strong>JIT Field Operations Unit (Hosur Division)</strong></span>
            <span>•</span>
            <span>Security Hash: <strong className="font-mono">{certId}</strong></span>
          </div>
        </div>
      </div>

      {/* STYLES (Screen + Print) */}
      <style jsx>{`
        .jit-cert-outer-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: #2b332d;
          min-height: 100%;
          box-sizing: border-box;
        }

        .jit-cert-frame {
          width: 100%;
          max-width: 1080px;
          aspect-ratio: 1.414 / 1; /* Standard A4 Landscape */
          min-height: 720px;
          background: #fbf9f4;
          background-image: 
            radial-gradient(circle at 50% 50%, #ffffff 0%, #fbf9f4 80%, #f4eee1 100%);
          border: 14px solid #1a3922;
          box-shadow:
            0 0 0 3px #d4af37,
            0 0 0 6px #1a3922,
            0 0 0 9px #e5c158,
            0 24px 70px rgba(0, 0, 0, 0.55);
          position: relative;
          padding: 24px;
          box-sizing: border-box;
          color: #1a2f20;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* 4 Ornate Corners */
        .cert-corner {
          position: absolute;
          width: 70px;
          height: 70px;
          z-index: 2;
          pointer-events: none;
        }
        .cert-corner-tl { top: 8px; left: 8px; }
        .cert-corner-tr { top: 8px; right: 8px; }
        .cert-corner-bl { bottom: 8px; left: 8px; }
        .cert-corner-br { bottom: 8px; right: 8px; }
        .corner-svg { width: 100%; height: 100%; }

        /* Security Watermark */
        .cert-watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
        }
        .watermark-svg {
          width: 480px;
          height: 480px;
        }

        /* Inner Content Border */
        .jit-cert-inner-content {
          position: relative;
          z-index: 3;
          height: 100%;
          border: 2px solid #c9a44c;
          padding: 22px 28px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(0.5px);
        }

        /* Header Strip */
        .cert-header-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid #d8ba6d;
          padding-bottom: 12px;
        }
        .cert-brand-block {
          display: flex;
          flex-direction: column;
        }
        .cert-logo-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cert-logo-icon {
          color: #1a5632;
          font-size: 22px;
          font-weight: 900;
        }
        .cert-brand-text {
          font-size: 21px;
          font-weight: 900;
          letter-spacing: 1.5px;
          color: #133f24;
        }
        .dot-in {
          color: #c9a44c;
        }
        .cert-brand-sub {
          font-size: 9.5px;
          color: #556b5b;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .cert-crest-center {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .cert-shield-crest {
          font-size: 22px;
        }
        .cert-registry-tag {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #8c6a1e;
        }

        .cert-meta-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .cert-badge-pill {
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          color: #065f46;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .live-dot {
          color: #10b981;
          font-size: 12px;
        }
        .cert-id-tag {
          font-size: 10px;
          color: #4b6352;
          font-family: monospace;
        }

        /* Title Section */
        .cert-title-section {
          text-align: center;
          margin-top: 10px;
          margin-bottom: 4px;
        }
        .cert-eyebrow {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #926d1d;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .cert-main-title {
          font-size: 34px;
          font-weight: 800;
          font-family: "Georgia", "Times New Roman", serif;
          color: #133a22;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin: 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }
        .cert-title-rule {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 6px;
        }
        .cert-title-rule::before,
        .cert-title-rule::after {
          content: "";
          height: 1.5px;
          width: 140px;
          background: linear-gradient(90deg, transparent, #b88d2d, transparent);
        }
        .rule-diamond {
          color: #b88d2d;
          font-size: 11px;
          margin: 0 10px;
        }

        /* Recipient Box */
        .cert-recipient-section {
          text-align: center;
          margin-top: 6px;
        }
        .cert-intro-phrase {
          font-size: 12px;
          font-style: italic;
          color: #556c5c;
          margin: 0 0 6px 0;
          font-family: "Georgia", serif;
        }
        .cert-business-name {
          font-size: 26px;
          font-weight: 900;
          font-family: "Georgia", serif;
          color: #0b341c;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 6px 0;
          border-bottom: 2px solid #b88d2d;
          display: inline-block;
          padding-bottom: 3px;
        }
        .cert-business-meta {
          font-size: 11px;
          color: #3b5443;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .meta-sep {
          color: #b88d2d;
          font-size: 12px;
        }

        /* Statement Box */
        .cert-statement-box {
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid #d4ba75;
          border-radius: 8px;
          padding: 10px 18px;
          margin: 8px 0;
          text-align: center;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .cert-statement-text {
          font-size: 11px;
          line-height: 1.6;
          color: #2b4534;
          margin: 0;
          font-family: "Georgia", serif;
        }

        /* Footer Row */
        .cert-footer-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: flex-end;
          gap: 16px;
          margin-top: 8px;
          padding-top: 4px;
        }

        /* QR block */
        .cert-qr-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .qr-wrapper {
          width: 76px;
          height: 76px;
          background: #ffffff;
          border: 1.5px solid #d4ba75;
          border-radius: 6px;
          padding: 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cert-qr-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .qr-caption {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .qr-scan-title {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #174226;
        }
        .qr-url {
          font-size: 9px;
          color: #5c7463;
          font-family: monospace;
        }

        /* Seal block */
        .cert-seal-block {
          display: flex;
          justify-content: center;
          position: relative;
        }
        .gold-seal-medallion {
          width: 100px;
          height: 100px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .seal-outer-ring {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff2a3 0%, #d4af37 40%, #996e13 100%);
          box-shadow:
            0 4px 14px rgba(153, 110, 19, 0.45),
            inset 0 2px 4px rgba(255, 255, 255, 0.8);
          border: 2px dashed #ffe685;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }
        .seal-inner-circle {
          width: 74px;
          height: 74px;
          border-radius: 50%;
          border: 1.5px solid #fff5b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #573c00;
        }
        .seal-star {
          font-size: 7px;
          letter-spacing: 2px;
          color: #704f05;
        }
        .seal-core-text {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #473200;
          line-height: 1;
        }
        .seal-sub-text {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #473200;
          margin-top: 1px;
        }
        .seal-year {
          font-size: 6.5px;
          font-weight: 700;
          color: #634602;
          margin-top: 1px;
        }

        .seal-ribbon {
          position: absolute;
          bottom: -14px;
          width: 24px;
          height: 40px;
          background: linear-gradient(135deg, #1b432a 0%, #2f6943 100%);
          z-index: 1;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
        }
        .ribbon-left {
          left: 26px;
          transform: rotate(-12deg);
        }
        .ribbon-right {
          right: 26px;
          transform: rotate(12deg);
        }

        /* Signatures block */
        .cert-signatures-block {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }
        .sig-unit {
          text-align: center;
          flex: 1;
        }
        .sig-line {
          border-bottom: 1.5px solid #94742a;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .sig-cursive-font {
          font-family: "Brush Script MT", "Caveat", "Dancing Script", cursive, serif;
          font-size: 19px;
          color: #173824;
          transform: rotate(-3deg);
          letter-spacing: 0.5px;
        }
        .sig-title {
          font-size: 9.5px;
          font-weight: 800;
          color: #1b3d27;
        }
        .sig-org {
          font-size: 8px;
          color: #556c5c;
        }

        /* Audit Strip */
        .cert-audit-strip {
          border-top: 1px solid #d8ba6d;
          padding-top: 8px;
          margin-top: 8px;
          font-size: 9px;
          color: #556c5c;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .font-mono {
          font-family: monospace;
          color: #1a4228;
        }

        /* PRINT STYLES */
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          :global(body) {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .jit-cert-outer-wrapper {
            padding: 0 !important;
            background: transparent !important;
            min-height: 0 !important;
          }
          .jit-cert-frame {
            width: 297mm !important;
            height: 210mm !important;
            max-width: 297mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            border: 10mm solid #1a3922 !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
