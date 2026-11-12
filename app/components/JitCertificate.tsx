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
  businessName: "SRI BALAJI SUPERMARKET",
  category: "Retail & Grocery Store",
  locality: "Hosur, Tamil Nadu",
  address: "Hosur, Tamil Nadu",
  phone: "+91 99440 12345",
  gstin: "33AABCT8921M1Z4",
  certificateId: "BZR-JIT-2026-00483",
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
  const businessName = data.businessName || "Registered Business";
  const category = data.category || "Verified Local Store";
  const address = data.address || data.locality || "Hosur, Tamil Nadu";
  const phone = data.phone || "+91 90430 22219";
  const issueDate = data.issueDate || "12 November 2026";
  const validThrough = data.validThrough || "31 March 2027";

  // Derive cert number if not provided
  const num = Math.abs(
    businessName.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  const certId =
    data.certificateId ||
    `BZR-JIT-2026-${String(100 + (num % 9000)).padStart(5, "0")}`;

  const agentName = data.assignedAgentName || "JIT";

  return (
    <div className={`jit-cert-root ${className}`}>
      <div className="jit-cert-card">
        {/* Subtle Guilloche Wave Flourishes (Left and Right) */}
        <div className="wave-flourish wave-left" aria-hidden="true">
          <svg viewBox="0 0 300 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-50,50 Q120,200 40,350 T100,550" stroke="#d4af37" strokeWidth="0.8" opacity="0.35" />
            <path d="M-40,80 Q130,220 50,370 T110,570" stroke="#d4af37" strokeWidth="0.8" opacity="0.3" />
            <path d="M-30,110 Q140,240 60,390 T120,590" stroke="#d4af37" strokeWidth="0.6" opacity="0.25" />
            <path d="M-20,140 Q150,260 70,410 T130,610" stroke="#d4af37" strokeWidth="0.5" opacity="0.2" />
            <path d="M-10,170 Q160,280 80,430 T140,630" stroke="#d4af37" strokeWidth="0.4" opacity="0.15" />
          </svg>
        </div>
        <div className="wave-flourish wave-right" aria-hidden="true">
          <svg viewBox="0 0 300 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M350,50 Q180,200 260,350 T200,550" stroke="#d4af37" strokeWidth="0.8" opacity="0.35" />
            <path d="M340,80 Q170,220 250,370 T190,570" stroke="#d4af37" strokeWidth="0.8" opacity="0.3" />
            <path d="M330,110 Q160,240 240,390 T180,590" stroke="#d4af37" strokeWidth="0.6" opacity="0.25" />
            <path d="M320,140 Q150,260 230,410 T170,610" stroke="#d4af37" strokeWidth="0.5" opacity="0.2" />
            <path d="M310,170 Q140,280 220,430 T160,630" stroke="#d4af37" strokeWidth="0.4" opacity="0.15" />
          </svg>
        </div>

        {/* Outer and Inner Border Frame */}
        <div className="cert-border-outer">
          <div className="cert-border-inner">
            {/* 1. TOP HEADER */}
            <div className="cert-top-header">
              <div className="brand-logo-area">
                <img
                  src="/bizearch-official-logo.png"
                  alt="Bizearch.in - Find • Connect • Grow"
                  className="brand-logo-img"
                />
              </div>

              <div className="registry-badge-area">
                <div className="verified-pill-tag">
                  <span className="check-icon">✔</span>
                  <span className="pill-text">BIZEARCH VERIFIED BUSINESS</span>
                </div>
                <div className="registry-subtext">
                  OFFICIAL REGISTRY OF VERIFIED BUSINESSES
                </div>
                <div className="cert-number-tag">
                  CERTIFICATE NO: <strong>{certId}</strong>
                </div>
              </div>
            </div>

            {/* 2. ACCREDITATION TITLE */}
            <div className="accreditation-header-block">
              <div className="super-header">
                B I Z E A R C H &nbsp; B U S I N E S S &nbsp; A C C R E D I T A T I O N
              </div>
              <h1 className="main-cert-title">
                CERTIFICATE OF VERIFICATION
              </h1>
              <div className="diamonds-row">
                <span>◆</span>
                <span>◆</span>
                <span>◆</span>
              </div>
              <div className="certify-intro-phrase">
                This is to officially certify that
              </div>
            </div>

            {/* 3. RECIPIENT BUSINESS NAME WITH LAUREL WREATH */}
            <div className="recipient-showcase-row">
              {/* Left Laurel */}
              <div className="laurel-branch laurel-left" aria-hidden="true">
                <svg viewBox="0 0 60 120" fill="#d4af37">
                  <path d="M50,110 C45,90 35,60 10,20 C18,30 25,45 28,60 C32,80 38,100 50,110 Z" opacity="0.8" />
                  <ellipse cx="14" cy="24" rx="8" ry="4" transform="rotate(-35 14 24)" />
                  <ellipse cx="20" cy="38" rx="9" ry="4.5" transform="rotate(-25 20 38)" />
                  <ellipse cx="26" cy="54" rx="10" ry="5" transform="rotate(-15 26 54)" />
                  <ellipse cx="32" cy="72" rx="10.5" ry="5.2" transform="rotate(-5 32 72)" />
                  <ellipse cx="38" cy="92" rx="11" ry="5.5" transform="rotate(5 38 92)" />
                  <ellipse cx="28" cy="30" rx="7" ry="3.8" transform="rotate(25 28 30)" />
                  <ellipse cx="35" cy="46" rx="8" ry="4.2" transform="rotate(35 35 46)" />
                  <ellipse cx="42" cy="64" rx="9" ry="4.5" transform="rotate(40 42 64)" />
                  <ellipse cx="48" cy="84" rx="9.5" ry="4.8" transform="rotate(45 48 84)" />
                </svg>
              </div>

              {/* Center Business Content */}
              <div className="recipient-content-center">
                <h2 className="business-title">
                  {businessName}
                </h2>

                {/* Details Pill (Store | Location | Phone) */}
                <div className="business-details-pill">
                  <span className="pill-item">
                    <span className="pill-icon">🏪</span>
                    <span>{category}</span>
                  </span>
                  <span className="pill-divider">|</span>
                  <span className="pill-item">
                    <span className="pill-icon">📍</span>
                    <span>{address}</span>
                  </span>
                  <span className="pill-divider">|</span>
                  <span className="pill-item">
                    <span className="pill-icon">📞</span>
                    <span>{phone}</span>
                  </span>
                </div>
              </div>

              {/* Right Laurel */}
              <div className="laurel-branch laurel-right" aria-hidden="true">
                <svg viewBox="0 0 60 120" fill="#d4af37">
                  <path d="M10,110 C15,90 25,60 50,20 C42,30 35,45 32,60 C28,80 22,100 10,110 Z" opacity="0.8" />
                  <ellipse cx="46" cy="24" rx="8" ry="4" transform="rotate(35 46 24)" />
                  <ellipse cx="40" cy="38" rx="9" ry="4.5" transform="rotate(25 40 38)" />
                  <ellipse cx="34" cy="54" rx="10" ry="5" transform="rotate(15 34 54)" />
                  <ellipse cx="28" cy="72" rx="10.5" ry="5.2" transform="rotate(5 28 72)" />
                  <ellipse cx="22" cy="92" rx="11" ry="5.5" transform="rotate(-5 22 92)" />
                  <ellipse cx="32" cy="30" rx="7" ry="3.8" transform="rotate(-25 32 30)" />
                  <ellipse cx="25" cy="46" rx="8" ry="4.2" transform="rotate(-35 25 46)" />
                  <ellipse cx="18" cy="64" rx="9" ry="4.5" transform="rotate(-40 18 64)" />
                  <ellipse cx="12" cy="84" rx="9.5" ry="4.8" transform="rotate(-45 12 84)" />
                </svg>
              </div>
            </div>

            {/* 4. ATTESTATION CLAUSE & CENTER RIBBON */}
            <div className="attestation-statement-section">
              <p className="attest-text-p1">
                Has successfully completed the <strong>Bizearch.in</strong> business verification process, including on-ground physical verification, business identity validation, and product/service assessment. This establishment is hereby recognized as a
              </p>

              {/* Center Ribbon Banner */}
              <div className="ribbon-banner-wrap">
                <div className="ribbon-banner">
                  <span className="ribbon-check-badge">✔</span>
                  <span className="ribbon-label">BIZEARCH VERIFIED BUSINESS</span>
                </div>
              </div>

              <p className="attest-text-p2">
                and is listed on the <strong>Bizearch.in</strong> directory platform.
              </p>
            </div>

            {/* 5. 4-COLUMN AUDIT GRID */}
            <div className="audit-specs-matrix">
              <div className="matrix-col">
                <div className="matrix-label">VERIFICATION TYPE</div>
                <div className="matrix-val">On-Ground Physical Audit</div>
              </div>
              <div className="matrix-sep"></div>
              <div className="matrix-col">
                <div className="matrix-label">DATE OF VERIFICATION</div>
                <div className="matrix-val">{issueDate}</div>
              </div>
              <div className="matrix-sep"></div>
              <div className="matrix-col">
                <div className="matrix-label">VALID THROUGH</div>
                <div className="matrix-val">{validThrough}</div>
              </div>
              <div className="matrix-sep"></div>
              <div className="matrix-col">
                <div className="matrix-label">JURISDICTION</div>
                <div className="matrix-val">Hosur Division, Tamil Nadu</div>
              </div>
            </div>

            {/* 6. BOTTOM TRUST & SIGNATURE FOOTER */}
            <div className="cert-bottom-footer">
              {/* QR Code Left */}
              <div className="footer-qr-container">
                <div className="qr-image-frame">
                  <img src="/bizearch-qr.png" alt="Scan QR Code" className="qr-image" />
                </div>
                <div className="qr-text-meta">
                  <div className="qr-action-title">SCAN TO VERIFY</div>
                  <div className="qr-action-desc">
                    Scan this QR code to view the business profile and verification details on <strong>Bizearch.in</strong>
                  </div>
                </div>
              </div>

              {/* Center Scalloped Gold Medallion Seal */}
              <div className="footer-seal-container">
                <div className="seal-laurel-wrap">
                  {/* Left Seal Laurel */}
                  <svg className="seal-laurel laurel-left-mini" viewBox="0 0 40 80" fill="#d4af37">
                    <path d="M35,70 C30,55 20,40 5,15 C10,22 16,32 18,42 C20,55 25,65 35,70 Z" />
                    <ellipse cx="8" cy="18" rx="6" ry="3" transform="rotate(-30 8 18)" />
                    <ellipse cx="12" cy="30" rx="7" ry="3.5" transform="rotate(-20 12 30)" />
                    <ellipse cx="17" cy="44" rx="7.5" ry="3.8" transform="rotate(-10 17 44)" />
                    <ellipse cx="23" cy="58" rx="8" ry="4" transform="rotate(0 23 58)" />
                  </svg>

                  {/* Scalloped Gold Badge */}
                  <div className="scalloped-seal">
                    <div className="seal-pin-icon">📍</div>
                    <div className="seal-text-title">BIZEARCH</div>
                    <div className="seal-text-sub">VERIFIED</div>
                    <div className="seal-text-desc">BUSINESS</div>
                    <div className="seal-stars-row">★ ★ ★</div>
                  </div>

                  {/* Right Seal Laurel */}
                  <svg className="seal-laurel laurel-right-mini" viewBox="0 0 40 80" fill="#d4af37">
                    <path d="M5,70 C10,55 20,40 35,15 C30,22 24,32 22,42 C20,55 15,65 5,70 Z" />
                    <ellipse cx="32" cy="18" rx="6" ry="3" transform="rotate(30 32 18)" />
                    <ellipse cx="28" cy="30" rx="7" ry="3.5" transform="rotate(20 28 30)" />
                    <ellipse cx="23" cy="44" rx="7.5" ry="3.8" transform="rotate(10 23 44)" />
                    <ellipse cx="17" cy="58" rx="8" ry="4" transform="rotate(0 17 58)" />
                  </svg>
                </div>
                {/* Navy Ribbon Tails */}
                <div className="seal-ribbon-tails">
                  <div className="ribbon-tail tail-left"></div>
                  <div className="ribbon-tail tail-right"></div>
                </div>
              </div>

              {/* Dual Signatures Right */}
              <div className="footer-signatures-container">
                {/* Agent Signature */}
                <div className="signature-column">
                  <div className="signature-cursive">
                    {agentName}
                  </div>
                  <div className="signature-bar"></div>
                  <div className="signer-name">{agentName}</div>
                  <div className="signer-title">Agent</div>
                  <div className="signer-org">Bizearch.in</div>
                </div>

                {/* Director Signature */}
                <div className="signature-column">
                  <div className="signature-cursive">
                    G. Venkatesan
                  </div>
                  <div className="signature-bar"></div>
                  <div className="signer-name">G. Venkatesan</div>
                  <div className="signer-title">Director – Trust &amp; Verification</div>
                  <div className="signer-org">Bizearch.in</div>
                </div>
              </div>
            </div>

            {/* 7. BOTTOM LINE CITATION */}
            <div className="cert-bottom-citation-line">
              <span className="line-text">
                ISSUED BY JISHNU INFOTECH PRIVATE LIMITED &nbsp;|&nbsp; BIZEARCH.IN BUSINESS VERIFICATION PROGRAM
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .jit-cert-root {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: transparent;
        }

        .jit-cert-card {
          width: 1024px;
          height: 712px;
          background: #ffffff;
          position: relative;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          box-sizing: border-box;
          padding: 10px;
        }

        /* Golden wave background accents */
        .wave-flourish {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 280px;
          pointer-events: none;
          z-index: 1;
        }
        .wave-left {
          left: 0;
        }
        .wave-right {
          right: 0;
        }

        /* Concentric Borders */
        .cert-border-outer {
          width: 100%;
          height: 100%;
          border: 3.5px solid #091a2b;
          border-radius: 12px;
          padding: 6px;
          box-sizing: border-box;
          position: relative;
          z-index: 2;
        }

        .cert-border-inner {
          width: 100%;
          height: 100%;
          border: 1.5px solid #d4af37;
          border-radius: 8px;
          padding: 16px 26px 14px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: radial-gradient(circle at 50% 45%, #ffffff 0%, #fdfbf7 85%, #fcf9f2 100%);
        }

        /* 1. Header */
        .cert-top-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .brand-logo-img {
          height: 52px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        .registry-badge-area {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .verified-pill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #091a2b;
          color: #ffffff;
          padding: 4px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.6px;
        }

        .check-icon {
          color: #10b981;
          font-size: 11px;
        }

        .registry-subtext {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #475569;
          margin-top: 4px;
          text-transform: uppercase;
        }

        .cert-number-tag {
          font-size: 10.5px;
          font-weight: 700;
          color: #091a2b;
          letter-spacing: 0.5px;
          margin-top: 2px;
          font-family: monospace;
        }

        /* 2. Accreditation Title */
        .accreditation-header-block {
          text-align: center;
          margin-top: 2px;
        }

        .super-header {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3.5px;
          color: #7c6020;
          text-transform: uppercase;
        }

        .main-cert-title {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 32px;
          font-weight: 800;
          color: #091a2b;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 3px 0 2px;
        }

        .diamonds-row {
          display: flex;
          justify-content: center;
          gap: 10px;
          color: #d4af37;
          font-size: 10px;
          margin: 1px 0;
        }

        .certify-intro-phrase {
          font-family: Georgia, "Times New Roman", serif;
          font-style: italic;
          font-size: 15px;
          color: #334155;
          margin-top: 2px;
        }

        /* 3. Recipient Showcase */
        .recipient-showcase-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 4px 0 2px;
        }

        .laurel-branch {
          width: 44px;
          height: 80px;
          flex-shrink: 0;
        }

        .recipient-content-center {
          text-align: center;
          max-width: 740px;
        }

        .business-title {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 32px;
          font-weight: 900;
          color: #091a2b;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 0 0 6px;
          line-height: 1.15;
        }

        .business-details-pill {
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

        .pill-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .pill-icon {
          font-size: 13px;
        }

        .pill-divider {
          color: #c5a059;
          font-size: 12px;
        }

        /* 4. Attestation Statement & Ribbon */
        .attestation-statement-section {
          text-align: center;
          max-width: 860px;
          margin: 0 auto;
        }

        .attest-text-p1 {
          font-size: 12.5px;
          color: #334155;
          line-height: 1.45;
          margin: 0;
        }

        .attest-text-p2 {
          font-size: 12.5px;
          color: #334155;
          margin: 2px 0 0;
        }

        .ribbon-banner-wrap {
          display: flex;
          justify-content: center;
          margin: 5px 0 3px;
        }

        .ribbon-banner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #091a2b;
          color: #ffffff;
          padding: 5px 28px;
          position: relative;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(9, 26, 43, 0.25);
        }

        .ribbon-banner::before,
        .ribbon-banner::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 14px;
          background: #c59b27;
        }

        .ribbon-banner::before {
          left: -14px;
          clip-path: polygon(100% 0, 0 50%, 100% 100%);
        }

        .ribbon-banner::after {
          right: -14px;
          clip-path: polygon(0 0, 100% 50%, 0 100%);
        }

        .ribbon-check-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: #d4af37;
          color: #091a2b;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 900;
        }

        /* 5. 4-Column Audit Grid */
        .audit-specs-matrix {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fbfbf9;
          border: 1px solid #e8e4d8;
          border-radius: 8px;
          padding: 7px 18px;
          margin: 2px 8px;
        }

        .matrix-col {
          flex: 1;
          text-align: center;
        }

        .matrix-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .matrix-val {
          font-size: 12px;
          font-weight: 800;
          color: #091a2b;
        }

        .matrix-sep {
          width: 1px;
          height: 24px;
          background: #cbd5e1;
        }

        /* 6. Bottom Trust & Signatures */
        .cert-bottom-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 4px 6px 0;
        }

        /* Left QR */
        .footer-qr-container {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 250px;
        }

        .qr-image-frame {
          width: 66px;
          height: 66px;
          border: 1.5px solid #091a2b;
          border-radius: 6px;
          padding: 3px;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          flex-shrink: 0;
        }

        .qr-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .qr-action-title {
          font-size: 10.5px;
          font-weight: 800;
          color: #091a2b;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .qr-action-desc {
          font-size: 9.5px;
          color: #475569;
          line-height: 1.35;
        }

        /* Center Scalloped Seal */
        .footer-seal-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .seal-laurel-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .seal-laurel {
          width: 26px;
          height: 52px;
        }

        .scalloped-seal {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fff6cc 0%, #d4af37 40%, #b8860b 80%, #7c5a08 100%);
          border: 3px dashed #fff9db;
          box-shadow: 0 4px 12px rgba(124, 90, 8, 0.35);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #3b2802;
          box-sizing: border-box;
          padding: 4px;
        }

        .seal-pin-icon {
          font-size: 13px;
          line-height: 1;
        }

        .seal-text-title {
          font-family: Georgia, serif;
          font-size: 9.5px;
          font-weight: 900;
          letter-spacing: 0.6px;
          line-height: 1;
          margin-top: 2px;
        }

        .seal-text-sub {
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.8px;
          line-height: 1;
          margin-top: 1px;
        }

        .seal-text-desc {
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.6px;
          line-height: 1;
        }

        .seal-stars-row {
          font-size: 7px;
          color: #ffffff;
          letter-spacing: 1px;
          margin-top: 1px;
        }

        .seal-ribbon-tails {
          position: absolute;
          top: 60px;
          display: flex;
          gap: 8px;
          z-index: -1;
        }

        .ribbon-tail {
          width: 18px;
          height: 30px;
          background: #091a2b;
          border: 1px solid #c59b27;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%);
        }

        /* Right Signatures */
        .footer-signatures-container {
          display: flex;
          gap: 28px;
        }

        .signature-column {
          width: 140px;
          text-align: center;
        }

        .signature-cursive {
          font-family: "Brush Script MT", "Caveat", "Dancing Script", cursive, serif;
          font-size: 24px;
          color: #091a2b;
          line-height: 1;
          height: 28px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          transform: rotate(-2deg);
        }

        .signature-bar {
          height: 1.5px;
          background: #d4af37;
          margin: 3px 0 4px;
        }

        .signer-name {
          font-size: 11px;
          font-weight: 800;
          color: #091a2b;
        }

        .signer-title {
          font-size: 9px;
          color: #475569;
          font-weight: 600;
          margin-top: 1px;
        }

        .signer-org {
          font-size: 8.5px;
          color: #64748b;
        }

        /* 7. Bottom Citation Line */
        .cert-bottom-citation-line {
          text-align: center;
          border-top: 1px solid #ebd9bc;
          padding-top: 5px;
          margin-top: 4px;
        }

        .line-text {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #64748b;
          text-transform: uppercase;
        }

        @media print {
          .jit-cert-root {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .jit-cert-card {
            width: 100% !important;
            height: 100vh !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
