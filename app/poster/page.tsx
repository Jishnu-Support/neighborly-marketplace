"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function PosterPage() {
  const [activePoster, setActivePoster] = useState<"merchant" | "features">("merchant");

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="poster-page-wrapper">
      {/* Non-printed control bar */}
      <header className="poster-control-bar no-print">
        <div className="control-left">
          <Link href="/" className="back-link">
            ← Back to Bizearch
          </Link>
          <span className="divider">|</span>
          <span className="brand-label">Bizearch.in Official Poster Designs</span>
        </div>

        <div className="control-center">
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill ${activePoster === "merchant" ? "active" : ""}`}
              onClick={() => setActivePoster("merchant")}
            >
              📢 Business Owners Poster (Growth)
            </button>
            <button
              type="button"
              className={`tab-pill ${activePoster === "features" ? "active" : ""}`}
              onClick={() => setActivePoster("features")}
            >
              🌟 All-Features Platform Poster
            </button>
          </div>
        </div>

        <div className="control-right">
          <button type="button" onClick={handlePrint} className="print-btn">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </header>

      {/* Main poster viewport */}
      <main className="poster-viewport">
        {activePoster === "merchant" ? <MerchantGrowthPoster /> : <AllFeaturesPoster />}
      </main>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap");

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: #eef2f6;
          font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
          color: #0d233a;
          -webkit-font-smoothing: antialiased;
        }

        .poster-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 40px;
        }

        .poster-control-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #d5dfe9;
          box-shadow: 0 2px 10px rgba(0, 35, 70, 0.08);
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .control-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-link {
          color: #004b87;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 6px;
          background: #f0f6fc;
          transition: background 0.15s;
        }

        .back-link:hover {
          background: #e2edf8;
        }

        .divider {
          color: #cbd5e1;
        }

        .brand-label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .tab-pill-group {
          display: inline-flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 30px;
          border: 1px solid #e2e8f0;
        }

        .tab-pill {
          border: none;
          background: transparent;
          padding: 8px 18px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-pill.active {
          background: #004b87;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 75, 135, 0.25);
        }

        .print-btn {
          background: #e65100;
          color: #ffffff;
          border: none;
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(230, 81, 0, 0.3);
          transition: transform 0.15s, background 0.15s;
        }

        .print-btn:hover {
          background: #d84315;
          transform: translateY(-1px);
        }

        .poster-viewport {
          margin-top: 24px;
          display: flex;
          justify-content: center;
          width: 100%;
          padding: 0 16px;
        }

        /* Standard Poster Canvas - Aspect Ratio 4:5 or standard A4 Print */
        .poster-canvas {
          width: 820px;
          min-height: 1140px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0, 30, 60, 0.15);
          position: relative;
          overflow: hidden;
          padding: 30px 34px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid #dce5ee;
        }

        /* Decorative background accents */
        .poster-bg-glow {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(238, 142, 36, 0.12) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* HEADER */
        .poster-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          position: relative;
          z-index: 2;
        }

        .poster-logo-wrap img {
          height: 64px;
          width: auto;
          object-fit: contain;
          display: block;
        }

        .header-graphic-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .store-3d-card {
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1.5px solid #86efac;
          border-radius: 12px;
          padding: 8px 14px;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
        }

        .store-icon-3d {
          font-size: 32px;
          line-height: 1;
        }

        .store-badge-text {
          display: flex;
          flex-direction: column;
        }

        .store-badge-title {
          font-size: 11px;
          font-weight: 800;
          color: #166534;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .store-badge-sub {
          font-size: 13px;
          font-weight: 900;
          color: #14532d;
        }

        /* ATTENTION CALLOUT */
        .attention-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #003366;
          color: #ffffff;
          padding: 6px 18px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(0, 51, 102, 0.25);
          margin-bottom: 10px;
        }

        .hero-title {
          font-size: 37px;
          font-weight: 900;
          color: #0b2545;
          line-height: 1.15;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .hero-title .highlight-grow {
          background: linear-gradient(90deg, #ea580c 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-style: italic;
        }

        .hero-subtitle {
          font-size: 15.5px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 14px;
        }

        /* TWO-COLUMN CONTRAST BOX */
        .contrast-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .contrast-left {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contrast-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.35;
        }

        .contrast-item .icon {
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
        }

        .contrast-right {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1.5px dashed #f59e0b;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .contrast-right-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 800;
          color: #92400e;
          line-height: 1.3;
          margin-bottom: 6px;
        }

        .contrast-right-header .icon {
          font-size: 18px;
        }

        .contrast-right p {
          font-size: 11.5px;
          font-weight: 500;
          color: #78350f;
          line-height: 1.4;
          font-style: italic;
        }

        /* BLUE PROMO STRIP */
        .blue-promo-strip {
          background: linear-gradient(90deg, #004b87 0%, #0066b2 100%);
          color: #ffffff;
          border-radius: 10px;
          padding: 10px 16px;
          text-align: center;
          box-shadow: 0 4px 14px rgba(0, 75, 135, 0.2);
          margin-bottom: 16px;
        }

        .blue-promo-strip h3 {
          font-size: 14.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 3px;
        }

        .blue-promo-strip p {
          font-size: 11.5px;
          font-weight: 500;
          opacity: 0.95;
        }

        /* VALUE PROPOSITION 3-COLUMN SECTION */
        .value-section {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 1.25fr 0.9fr 1.05fr;
          gap: 14px;
          align-items: center;
          margin-bottom: 14px;
          box-shadow: 0 4px 12px rgba(0, 25, 50, 0.04);
        }

        .benefits-col h4 {
          font-size: 14px;
          font-weight: 900;
          color: #ea580c;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .benefits-subtitle {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 8px;
        }

        .benefits-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .benefits-list li {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
        }

        .benefits-list li .check-icon {
          color: #16a34a;
          font-size: 14px;
          font-weight: 900;
        }

        /* PHONE MOCKUP */
        .mockup-col {
          display: flex;
          justify-content: center;
        }

        .phone-mockup {
          width: 140px;
          height: 195px;
          background: #0f172a;
          border-radius: 20px;
          padding: 6px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
          position: relative;
        }

        .phone-screen {
          width: 100%;
          height: 100%;
          background: #f8fafc;
          border-radius: 15px;
          overflow: hidden;
          padding: 8px 6px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mockup-brand {
          font-size: 10px;
          font-weight: 900;
          color: #004b87;
          text-align: center;
        }

        .mockup-search-bar {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 4px 6px;
          font-size: 8px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mockup-categories {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
        }

        .mockup-cat-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 4px 2px;
          text-align: center;
          font-size: 7.5px;
          font-weight: 700;
          color: #334155;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .mockup-store-card {
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 4px;
          font-size: 7.5px;
          font-weight: 700;
          color: #0369a1;
        }

        /* QR CODE COLUMN */
        .qr-col {
          display: flex;
          justify-content: center;
        }

        .qr-card {
          background: #002b49;
          color: #ffffff;
          border-radius: 14px;
          padding: 12px 14px;
          text-align: center;
          box-shadow: 0 6px 18px rgba(0, 43, 73, 0.25);
          width: 100%;
          max-width: 175px;
        }

        .qr-code-box {
          background: #ffffff;
          border-radius: 8px;
          padding: 6px;
          margin-bottom: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .qr-code-box img {
          width: 110px;
          height: 110px;
          display: block;
        }

        .qr-card .scan-text {
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .qr-card .url-pill {
          background: #ffffff;
          color: #002b49;
          font-size: 9.5px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 12px;
          display: inline-block;
          text-decoration: none;
        }

        /* SPECIAL OFFER RIBBON */
        .special-offer-banner {
          background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
          color: #ffffff;
          border-radius: 10px;
          padding: 10px 14px;
          text-align: center;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
        }

        .special-offer-banner .offer-title {
          font-size: 13.5px;
          font-weight: 900;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        .special-offer-banner .offer-desc {
          font-size: 11.5px;
          font-weight: 500;
          opacity: 0.95;
        }

        /* SLOGAN & CTA ROW */
        .cta-slogan-row {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 16px;
          margin-bottom: 14px;
        }

        .cta-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .cta-register-pill {
          font-size: 13px;
          font-weight: 900;
          color: #004b87;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cta-register-pill span {
          color: #dc2626;
        }

        .tagline-badge {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 800;
          font-style: italic;
        }

        .cta-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          border-top: 1px solid #edf2f7;
          padding-top: 6px;
        }

        .grow-together {
          color: #15803d;
          font-weight: 800;
        }

        /* FOOTER BRAND BAR */
        .poster-footer {
          margin-top: auto;
        }

        .footer-brand-strip {
          background: linear-gradient(90deg, #002b49 0%, #004b87 100%);
          border-radius: 12px;
          padding: 10px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .footer-team {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .footer-powered-box {
          background: #ffffff;
          padding: 4px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-powered-box .powered-text {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .footer-powered-box img {
          height: 28px;
          width: auto;
          display: block;
        }

        .footer-care {
          font-size: 11.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .footer-care .phone-num {
          font-weight: 900;
          color: #fde047;
          letter-spacing: 0.5px;
        }

        .hashtag-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          font-size: 9.5px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* ALL-FEATURES POSTER STYLES */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 14px 0;
        }

        .feature-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .feature-icon-bubble {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .feature-icon-bubble.blue {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .feature-icon-bubble.green {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .feature-icon-bubble.orange {
          background: #fff7ed;
          border: 1px solid #fed7aa;
        }

        .feature-icon-bubble.purple {
          background: #faf5ff;
          border: 1px solid #e9d5ff;
        }

        .feature-icon-bubble.red {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .feature-content h4 {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .feature-content p {
          font-size: 11px;
          font-weight: 500;
          color: #475569;
          line-height: 1.35;
        }

        .lang-banner {
          background: #f8fafc;
          border: 1.5px dashed #004b87;
          border-radius: 10px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .lang-label {
          font-size: 12px;
          font-weight: 800;
          color: #004b87;
        }

        .lang-tags {
          display: flex;
          gap: 8px;
        }

        .lang-tag {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 10.5px;
          font-weight: 700;
          color: #1e293b;
        }

        /* PRINT STYLES */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          body {
            background: #ffffff;
            color: #000000;
          }

          .no-print {
            display: none !important;
          }

          .poster-page-wrapper {
            padding: 0;
            margin: 0;
          }

          .poster-viewport {
            margin: 0;
            padding: 0;
          }

          .poster-canvas {
            width: 100vw;
            height: 100vh;
            max-width: 100%;
            min-height: 100%;
            border-radius: 0;
            border: none;
            box-shadow: none;
            padding: 24px 28px 18px;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================================
   POSTER 1: MERCHANT GROWTH POSTER (Register Before Dec 10, 2026)
   ========================================================================= */
function MerchantGrowthPoster() {
  return (
    <div className="poster-canvas">
      <div className="poster-bg-glow" />

      {/* TOP HEADER */}
      <div className="poster-header">
        <div className="poster-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bizearch-logo.jpg" alt="Bizearch.in - Find • Connect • Grow" />
        </div>

        <div className="header-graphic-wrap">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)", color: "#fff", padding: "6px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: 800, boxShadow: "0 3px 10px rgba(220,38,38,0.25)" }}>
              ⏰ REGISTER BEFORE DEC 10, 2026: FREE UNTIL MARCH 31ST, 2027!
            </div>
            <div className="store-3d-card" style={{ padding: "5px 14px", gap: "8px" }}>
              <span className="store-icon-3d" style={{ fontSize: "24px" }}>🏪</span>
              <div className="store-badge-text">
                <span className="store-badge-title" style={{ fontSize: "11px" }}>LOCAL MERCHANTS</span>
                <span className="store-badge-sub" style={{ fontSize: "13.5px" }}>VERIFIED PLATFORM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN HEADLINE */}
      <div>
        <div className="attention-pill" style={{ padding: "6px 18px", fontSize: "13px" }}>
          <span>📢</span> ATTENTION RETAILERS, STORES, CLINICS &amp; SERVICE PROVIDERS!
        </div>
        <h1 className="hero-title" style={{ fontSize: "37px" }}>
          Big or Small, Every Business Deserves to <span className="highlight-grow">Grow!</span>
        </h1>
        <p className="hero-subtitle" style={{ fontSize: "15.5px" }}>
          Growth is what matters — not the size of your store. Connect directly with thousands of nearby shoppers in your neighborhood.
        </p>

        {/* DEC 10 LIMITED TIME EARLY BIRD RIBBON */}
        <div style={{ background: "linear-gradient(90deg, #b91c1c 0%, #ea580c 50%, #d97706 100%)", color: "#ffffff", borderRadius: "10px", padding: "9px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", boxShadow: "0 3px 12px rgba(234,88,12,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "26px" }}>🔥</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.4px" }}>LIMITED-TIME FOUNDING PARTNER WINDOW</div>
              <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.95 }}>Register before Dec 10th, 2026 to unlock a <strong>FREE Business Listing until March 31st, 2027</strong>!</div>
            </div>
          </div>
          <div style={{ background: "#ffffff", color: "#b91c1c", fontSize: "12.5px", fontWeight: 900, padding: "6px 16px", borderRadius: "18px", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            Valid Until Dec 10, 2026
          </div>
        </div>

        {/* 4 KILLER PILLARS (NO EMPTY SPACE) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "10px", padding: "8px 10px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "24px" }}>💰</span>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#92400e" }}>0% Commission</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#78350f" }}>Keep 100% profit — zero cuts on orders.</div>
            </div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px", padding: "8px 10px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "24px" }}>💬</span>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#166534" }}>WhatsApp Leads</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#14532d" }}>Customer inquiries straight to your phone.</div>
            </div>
          </div>
          <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "10px", padding: "8px 10px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "24px" }}>📍</span>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#1e40af" }}>Hyperlocal GPS</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#1e3a8a" }}>Nearby residents navigate straight to you.</div>
            </div>
          </div>
          <div style={{ background: "#faf5ff", border: "1.5px solid #e9d5ff", borderRadius: "10px", padding: "8px 10px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "24px" }}>🛡️</span>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#6b21a8" }}>JIT Verified</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#581c87" }}>On-ground certified badge for 5X trust.</div>
            </div>
          </div>
        </div>

        {/* CONTRAST STRIP */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 14px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span>🔍</span> <span>Nearby shoppers actively search daily for products, services &amp; estimates.</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><span>🏪</span> <span>Your store is ready to serve them with genuine quality &amp; fair prices.</span></div>
          </div>
          <div style={{ background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontWeight: 600, color: "#92400e", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>💡</span>
            <div><strong>What if they could find you right now?</strong> Put your store on India&apos;s fastest growing neighborhood search engine!</div>
          </div>
        </div>

        {/* 8 COMPLETE FEATURES GRID */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <h3 style={{ fontSize: "15.5px", fontWeight: 900, color: "#004b87", display: "flex", alignItems: "center", gap: "6px" }}>
              ✨ Complete Business Toolkit — Free Business Listing Until March 31, 2027
            </h3>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#ea580c" }}>Why Local Stores Choose Bizearch.in →</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "7px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>🏪</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>Digital Storefront</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>Photos, timings, phone, address &amp; 1-tap Google Maps directions.</p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>🛍️</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>Live Product Catalog</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>Publish items, prices, offers &amp; receive direct customer orders.</p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>📄</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>Custom Quote Inbox</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>Receive real-time customer price inquiries with verified numbers.</p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>📞</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>1-Tap Direct Call &amp; WA</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>Zero middleman call centers. Customers ring your mobile or WhatsApp.</p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>📲</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>Countertop QR Code</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>Custom QR for your cash desk so shoppers bookmark &amp; re-order easily.</p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>🗣️</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>4 Regional Languages</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>Reach shoppers in English, தமிழ், ಕನ್ನಡ, and తెలుగు.</p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>📢</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>Hyperlocal Ad Boost</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>Promote festival offers, clearance sales &amp; top category banners.</p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "16px" }}>🤝</span>
                <strong style={{ fontSize: "12px", color: "#0f172a" }}>Free Agent Onboarding</strong>
              </div>
              <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>JIT agents visit your store to verify and help set up your catalog free.</p>
            </div>
          </div>
        </div>

        {/* ONBOARDING CATEGORIES STRIP */}
        <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 900, color: "#004b87", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Categories We Welcome:</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
            {["🛒 Supermarkets & Groceries", "👗 Fashion & Boutiques", "📱 Electronics & Mobiles", "🚗 Automobiles & Service", "🍽️ Restaurants & Bakeries", "🩺 Clinics & Pharmacies", "🔧 Hardware & Repairs"].map((cat) => (
              <span key={cat} style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "3px 9px", borderRadius: "14px", fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS 3-STEP BAR */}
        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "8px", padding: "6px 14px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "24px", height: "24px", background: "#16a34a", color: "#fff", borderRadius: "50%", fontSize: "12px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>1</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#14532d" }}>Scan QR or Visit Bizearch.in</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#166534" }}>Takes only 60 seconds to register your store.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "24px", height: "24px", background: "#16a34a", color: "#fff", borderRadius: "50%", fontSize: "12px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>2</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#14532d" }}>Add Your Store &amp; Products</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#166534" }}>Upload photos, prices, hours and phone numbers.</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "24px", height: "24px", background: "#16a34a", color: "#fff", borderRadius: "50%", fontSize: "12px", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>3</div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#14532d" }}>Get JIT Verified &amp; Grow</div>
              <div style={{ fontSize: "10.5px", fontWeight: 600, color: "#166534" }}>Receive direct WhatsApp orders &amp; quote leads.</div>
            </div>
          </div>
        </div>

        {/* 3-COLUMN BENEFIT + MOCKUP + QR SECTION */}
        <div className="value-section" style={{ padding: "10px 14px", gap: "12px", marginBottom: "10px" }}>
          {/* Left: Benefits */}
          <div className="benefits-col">
            <h4 style={{ fontSize: "16px" }}>⭐ Register Before Dec 10, 2026!</h4>
            <div className="benefits-subtitle" style={{ fontSize: "12px", marginBottom: "6px" }}>Free listing until March 31st, 2027 includes:</div>
            <ul className="benefits-list" style={{ gap: "5px" }}>
              <li style={{ fontSize: "12px" }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> FREE Full Business Listing until March 31, 2027</li>
              <li style={{ fontSize: "12px" }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> Real-Time Customer Lead Inbox on Phone</li>
              <li style={{ fontSize: "12px" }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> Direct Customer Callback &amp; WhatsApp</li>
              <li style={{ fontSize: "12px" }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> 0% Commission — Keep 100% Profits</li>
              <li style={{ fontSize: "12px" }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> Showcase Unlimited Products &amp; Services</li>
              <li style={{ fontSize: "12px" }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> Doorstep JIT Field Verification Badge</li>
            </ul>
          </div>

          {/* Center: Mobile mockup with live incoming lead */}
          <div className="mockup-col">
            <div className="phone-mockup" style={{ width: "140px", height: "190px" }}>
              <div className="phone-screen" style={{ padding: "5px", gap: "4px" }}>
                <div style={{ background: "#004b87", color: "#fff", borderRadius: "4px", padding: "3px 5px", fontSize: "8px", fontWeight: 800, display: "flex", justifyContent: "space-between" }}>
                  <span>bizearch.in Merchant</span>
                  <span>● LIVE</span>
                </div>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "5px", padding: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "7.5px", fontWeight: 900, color: "#1d4ed8" }}>🔥 NEW CUSTOMER LEAD</span>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "#0f172a" }}>Quote Request from Resident</span>
                  <span style={{ fontSize: "7.5px", color: "#475569", lineHeight: 1.25 }}>&quot;Need price estimate &amp; delivery today.&quot;</span>
                  <div style={{ display: "flex", gap: "3px", marginTop: "2px" }}>
                    <span style={{ flex: 1, background: "#2563eb", color: "#fff", borderRadius: "3px", fontSize: "7.5px", fontWeight: 800, textAlign: "center", padding: "2.5px" }}>📞 Call</span>
                    <span style={{ flex: 1, background: "#16a34a", color: "#fff", borderRadius: "3px", fontSize: "7.5px", fontWeight: 800, textAlign: "center", padding: "2.5px" }}>💬 WhatsApp</span>
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px", padding: "3px", fontSize: "7.5px", color: "#16a34a", fontWeight: 800 }}>
                  ✓ JIT Verified Store
                </div>
              </div>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="qr-col">
            <div className="qr-card" style={{ padding: "10px" }}>
              <div className="qr-code-box" style={{ padding: "4px", marginBottom: "4px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bizearch-qr.png" alt="Scan QR Code to Register" style={{ width: "95px", height: "95px" }} />
              </div>
              <div className="scan-text" style={{ fontSize: "12px", marginBottom: "2px" }}>Scan &amp; Register</div>
              <a href="https://bizearch.in" className="url-pill" target="_blank" rel="noreferrer" style={{ fontSize: "10px" }}>
                🔗 https://bizearch.in
              </a>
            </div>
          </div>
        </div>

        {/* FOUNDING PARTNERS OFFER */}
        <div style={{ background: "linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)", color: "#ffffff", borderRadius: "10px", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>👑</span>
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 900, textTransform: "uppercase" }}>FOUNDING MERCHANT PRIVILEGES (DECEMBER 2026 BATCH)</div>
              <div style={{ fontSize: "11.5px", opacity: 0.95 }}>Early registrants receive Priority Search Ranking, Free Geotagging, and Dedicated Verification Support!</div>
            </div>
          </div>
          <div style={{ background: "#fde047", color: "#854d0e", fontSize: "11.5px", fontWeight: 900, padding: "4px 12px", borderRadius: "12px", whiteSpace: "nowrap" }}>
            FREE UNTIL MARCH 31, 2027
          </div>
        </div>

        {/* CTA SLOGAN ROW */}
        <div className="cta-slogan-row" style={{ padding: "8px 14px", marginBottom: "8px" }}>
          <div className="cta-top" style={{ marginBottom: "3px" }}>
            <div className="cta-register-pill" style={{ fontSize: "14px" }}>
              <span>📲</span> Register Your Business Today — <span>Offer Ends Dec 10, 2026!</span>
            </div>
            <div className="tagline-badge" style={{ fontSize: "11.5px" }}>Your Business. Your Visibility. Your Growth.</div>
          </div>
          <div className="cta-bottom" style={{ fontSize: "11.5px", paddingTop: "4px" }}>
            <span>🤝 Let&apos;s connect local customers directly with your business.</span>
            <span className="grow-together">🌱 Let&apos;s Grow Together!</span>
          </div>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <footer className="poster-footer">
        <div className="footer-brand-strip" style={{ padding: "8px 16px", marginBottom: "5px" }}>
          <div className="footer-team" style={{ fontSize: "13px" }}>By Team Bizearch</div>

          <div className="footer-powered-box" style={{ padding: "3px 10px" }}>
            <span className="powered-text" style={{ fontSize: "9.5px" }}>Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jishnu-infotech-logo.jpg" alt="Jishnu Infotech" style={{ height: "24px" }} />
          </div>

          <div className="footer-care" style={{ fontSize: "13px" }}>
            <span>📞 Merchant Care:</span>
            <span className="phone-num" style={{ fontSize: "14.5px" }}>+91 95668 23219</span>
          </div>
        </div>

        <div className="hashtag-bar" style={{ fontSize: "9.5px" }}>
          <span>#RegisterBeforeDec10</span>
          <span>•</span>
          <span>#FreeUntilMarch2027</span>
          <span>•</span>
          <span>#0PercentCommission</span>
          <span>•</span>
          <span>#DirectWhatsAppLeads</span>
          <span>•</span>
          <span>#LocalBusiness</span>
          <span>•</span>
          <span>#VocalForLocal</span>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================================
   POSTER 2: ALL-FEATURES PLATFORM POSTER (Comprehensive Neighborhood Network)
   ========================================================================= */
function AllFeaturesPoster() {
  return (
    <div className="poster-canvas">
      <div className="poster-bg-glow" />

      {/* TOP HEADER */}
      <div className="poster-header">
        <div className="poster-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bizearch-logo.jpg" alt="Bizearch.in - Find • Connect • Grow" />
        </div>

        <div className="header-graphic-wrap">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ background: "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)", color: "#fff", padding: "6px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: 800, boxShadow: "0 3px 10px rgba(220,38,38,0.25)" }}>
              ⏰ REGISTER BEFORE DEC 10, 2026: FREE UNTIL MARCH 31ST, 2027!
            </div>
            <div className="store-3d-card" style={{ background: "#eff6ff", borderColor: "#93c5fd", padding: "6px 16px", gap: "10px" }}>
              <span className="store-icon-3d" style={{ fontSize: "26px" }}>🗺️</span>
              <div className="store-badge-text">
                <span className="store-badge-title" style={{ color: "#1d4ed8", fontSize: "11px" }}>HYPERLOCAL NETWORK</span>
                <span className="store-badge-sub" style={{ color: "#1e40af", fontSize: "13.5px" }}>SEE YOUR NEIGHBORHOOD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HEADLINE */}
      <div>
        <div className="attention-pill" style={{ background: "#059669", padding: "6px 18px", fontSize: "13px" }}>
          <span>🌟</span> ALL-IN-ONE NEIGHBORHOOD PLATFORM
        </div>
        <h1 className="hero-title" style={{ fontSize: "38px" }}>
          Everything in Your City, <span className="highlight-grow">Right Around Your Corner!</span>
        </h1>
        <p className="hero-subtitle" style={{ fontSize: "15.5px" }}>
          Discover verified stores, request instant quotes, contact owners directly, and shop local with zero middleman commissions.
        </p>

        {/* DEC 10 LIMITED TIME EARLY BIRD RIBBON */}
        <div style={{ background: "linear-gradient(90deg, #b91c1c 0%, #ea580c 50%, #d97706 100%)", color: "#ffffff", borderRadius: "12px", padding: "9px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", boxShadow: "0 4px 14px rgba(234,88,12,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "26px" }}>🔥</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>LIMITED-TIME FOUNDING PARTNER WINDOW</div>
              <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.95 }}>Register before Dec 10th, 2026 to unlock a <strong>FREE Business Listing until March 31st, 2027</strong>!</div>
            </div>
          </div>
          <div style={{ background: "#ffffff", color: "#b91c1c", fontSize: "12.5px", fontWeight: 900, padding: "6px 16px", borderRadius: "18px", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            Valid Until Dec 10, 2026
          </div>
        </div>

        {/* 6 CORE FEATURES GRID */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <h3 style={{ fontSize: "15.5px", fontWeight: 900, color: "#004b87", display: "flex", alignItems: "center", gap: "6px" }}>
              ✨ Explore Complete Neighborhood Platform Features
            </h3>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#059669" }}>Built for Local Residents &amp; Businesses</span>
          </div>

          <div className="features-grid" style={{ gap: "9px", marginBottom: "10px" }}>
            <div className="feature-card" style={{ padding: "10px 14px", gap: "12px" }}>
              <div className="feature-icon-bubble blue" style={{ width: "44px", height: "44px", fontSize: "22px" }}>📍</div>
              <div className="feature-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Real-Time Proximity &amp; Navigation</h4>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, padding: "1.5px 6px", borderRadius: "4px", background: "#dbeafe", color: "#1e40af", textTransform: "uppercase" }}>GPS Accurate</span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: 1.35 }}>Instant GPS distance (in km) and 1-tap Google Maps directions straight to any store, clinic, or service in your neighborhood.</p>
              </div>
            </div>

            <div className="feature-card" style={{ padding: "10px 14px", gap: "12px" }}>
              <div className="feature-icon-bubble green" style={{ width: "44px", height: "44px", fontSize: "22px" }}>💬</div>
              <div className="feature-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Direct Call &amp; WhatsApp Connect</h4>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, padding: "1.5px 6px", borderRadius: "4px", background: "#dcfce7", color: "#166534", textTransform: "uppercase" }}>Zero Middleman</span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: 1.35 }}>Connect directly with shop owners in 1 tap. Ring their direct mobile or WhatsApp with 0% commissions or broker fees.</p>
              </div>
            </div>

            <div className="feature-card" style={{ padding: "10px 14px", gap: "12px" }}>
              <div className="feature-icon-bubble orange" style={{ width: "44px", height: "44px", fontSize: "22px" }}>📄</div>
              <div className="feature-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Custom Quotes &amp; Estimates</h4>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, padding: "1.5px 6px", borderRadius: "4px", background: "#ffedd5", color: "#9a3412", textTransform: "uppercase" }}>Real Leads</span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: 1.35 }}>Send customer quote inquiries directly to local merchants with verified callback numbers and automated WhatsApp handoff.</p>
              </div>
            </div>

            <div className="feature-card" style={{ padding: "10px 14px", gap: "12px" }}>
              <div className="feature-icon-bubble purple" style={{ width: "44px", height: "44px", fontSize: "22px" }}>🛍️</div>
              <div className="feature-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Live Menus &amp; Store Catalogs</h4>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, padding: "1.5px 6px", borderRadius: "4px", background: "#f3e8ff", color: "#6b21a8", textTransform: "uppercase" }}>Live Catalog</span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: 1.35 }}>Browse real-time product catalogs, pricing, daily discounts, and order easily for doorstep delivery or quick store pickup.</p>
              </div>
            </div>

            <div className="feature-card" style={{ padding: "10px 14px", gap: "12px" }}>
              <div className="feature-icon-bubble green" style={{ width: "44px", height: "44px", fontSize: "22px" }}>🛡️</div>
              <div className="feature-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 900, color: "#0f172a", margin: 0 }}>100% Agent-Verified Listings</h4>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, padding: "1.5px 6px", borderRadius: "4px", background: "#d1fae5", color: "#065f46", textTransform: "uppercase" }}>5X Trust Seal</span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: 1.35 }}>Every store is physically visited and certified on-ground by JIT field verification agents with geotagged physical proof.</p>
              </div>
            </div>

            <div className="feature-card" style={{ padding: "10px 14px", gap: "12px" }}>
              <div className="feature-icon-bubble red" style={{ width: "44px", height: "44px", fontSize: "22px" }}>🚨</div>
              <div className="feature-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Emergency SOS &amp; Quick Help</h4>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, padding: "1.5px 6px", borderRadius: "4px", background: "#fee2e2", color: "#991b1b", textTransform: "uppercase" }}>Safety First</span>
                </div>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: 1.35 }}>1-tap community emergency SOS alert with live GPS coordinates sent immediately to nearby verified emergency services.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORIES STRIP */}
        <div style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "9px" }}>
          <span style={{ fontSize: "12px", fontWeight: 900, color: "#004b87", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Categories Across Town:</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
            {["🛒 Supermarkets & Groceries", "👗 Fashion & Boutiques", "📱 Electronics & Mobiles", "🚗 Automobiles & Service", "🍽️ Restaurants & Bakeries", "🩺 Clinics & Pharmacies", "🔧 Hardware & Repairs"].map((cat) => (
              <span key={cat} style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "3px 9px", borderRadius: "14px", fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* 4 LANGUAGES BANNER */}
        <div className="lang-banner" style={{ padding: "8px 16px", marginBottom: "10px" }}>
          <span className="lang-label" style={{ fontSize: "13.5px" }}>🗣️ Available in 4 Regional Languages:</span>
          <div className="lang-tags" style={{ gap: "8px" }}>
            <span className="lang-tag" style={{ padding: "3px 12px", fontSize: "12px" }}>English</span>
            <span className="lang-tag" style={{ padding: "3px 12px", fontSize: "12px" }}>தமிழ் (Tamil)</span>
            <span className="lang-tag" style={{ padding: "3px 12px", fontSize: "12px" }}>ಕನ್ನಡ (Kannada)</span>
            <span className="lang-tag" style={{ padding: "3px 12px", fontSize: "12px" }}>తెలుగు (Telugu)</span>
          </div>
        </div>

        {/* VALUE SECTION */}
        <div className="value-section" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #eff6ff 100%)", border: "2px solid #86efac", borderRadius: "14px", padding: "12px 18px", gridTemplateColumns: "1.45fr 1fr", gap: "16px", marginBottom: "10px" }}>
          <div>
            <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#004b87", marginBottom: "2px" }}>
              🚀 Are You a Local Business Owner?
            </h4>
            <div className="benefits-subtitle" style={{ fontSize: "12px", marginBottom: "6px" }}>
              Register before Dec 10, 2026 to unlock exclusive privileges:
            </div>
            <ul className="benefits-list" style={{ gap: "4.5px" }}>
              <li style={{ fontSize: "12px", fontWeight: 800 }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> FREE Full Business Listing until March 31, 2027</li>
              <li style={{ fontSize: "12px", fontWeight: 800 }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> 0% Commission — 100% of customer sales stay with you</li>
              <li style={{ fontSize: "12px", fontWeight: 800 }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> Real-Time Customer Lead Inbox straight to your phone</li>
              <li style={{ fontSize: "12px", fontWeight: 800 }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> Direct WhatsApp orders &amp; customer call connection</li>
              <li style={{ fontSize: "12px", fontWeight: 800 }}><span className="check-icon" style={{ fontSize: "15px" }}>✓</span> Free Doorstep JIT Field Verification badge</li>
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="qr-card" style={{ maxWidth: "200px", padding: "10px 14px", borderRadius: "14px" }}>
              <div className="qr-code-box" style={{ padding: "5px", marginBottom: "5px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bizearch-qr.png" alt="Scan QR Code to Explore" style={{ width: "100px", height: "100px" }} />
              </div>
              <div className="scan-text" style={{ fontSize: "12px", marginBottom: "3px" }}>Scan &amp; Explore</div>
              <a href="https://bizearch.in" className="url-pill" target="_blank" rel="noreferrer" style={{ fontSize: "10px", padding: "3px 9px" }}>
                🔗 https://bizearch.in
              </a>
            </div>
          </div>
        </div>

        {/* CTA SLOGAN ROW */}
        <div className="cta-slogan-row" style={{ padding: "8px 16px", marginBottom: "10px" }}>
          <div className="cta-top" style={{ marginBottom: "3px" }}>
            <div className="cta-register-pill" style={{ fontSize: "14px" }}>
              <span>📲</span> Register Your Business Today — <span>Offer Ends Dec 10, 2026!</span>
            </div>
            <div className="tagline-badge" style={{ fontSize: "11.5px" }}>Your Business. Your Visibility. Your Growth.</div>
          </div>
          <div className="cta-bottom" style={{ fontSize: "11.5px", paddingTop: "4px" }}>
            <span>🤝 Let&apos;s connect local customers directly with your business.</span>
            <span className="grow-together">🌱 Let&apos;s Grow Together!</span>
          </div>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <footer className="poster-footer">
        <div className="footer-brand-strip" style={{ padding: "8px 18px", marginBottom: "6px" }}>
          <div className="footer-team" style={{ fontSize: "13px" }}>By Team Bizearch</div>

          <div className="footer-powered-box" style={{ padding: "3px 12px" }}>
            <span className="powered-text" style={{ fontSize: "9.5px" }}>Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jishnu-infotech-logo.jpg" alt="Jishnu Infotech" style={{ height: "25px" }} />
          </div>

          <div className="footer-care" style={{ fontSize: "13px" }}>
            <span>📞 Merchant &amp; Customer Care:</span>
            <span className="phone-num" style={{ fontSize: "14.5px" }}>+91 95668 23219</span>
          </div>
        </div>

        <div className="hashtag-bar" style={{ fontSize: "9.5px" }}>
          <span>#RegisterBeforeDec10</span>
          <span>•</span>
          <span>#FreeUntilMarch2027</span>
          <span>•</span>
          <span>#0PercentCommission</span>
          <span>•</span>
          <span>#LocalMarketplace</span>
          <span>•</span>
          <span>#VerifiedStores</span>
          <span>•</span>
          <span>#VocalForLocal</span>
        </div>
      </footer>
    </div>
  );
}
