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

        .poster-bg-dots {
          position: absolute;
          top: 20px;
          left: 20px;
          width: 120px;
          height: 120px;
          background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
          background-size: 12px 12px;
          opacity: 0.5;
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
          font-size: 32px;
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
          font-size: 14.5px;
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
   POSTER 1: MERCHANT GROWTH POSTER (Matching user's reference image)
   ========================================================================= */
function MerchantGrowthPoster() {
  return (
    <div className="poster-canvas">
      <div className="poster-bg-glow" />
      <div className="poster-bg-dots" />

      {/* TOP HEADER */}
      <div className="poster-header">
        <div className="poster-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bizearch-logo.jpg" alt="Bizearch.in - Find • Connect • Grow" />
        </div>

        <div className="header-graphic-wrap">
          <div className="store-3d-card">
            <span className="store-icon-3d">🏪</span>
            <div className="store-badge-text">
              <span className="store-badge-title">YOUR LOCAL STORE</span>
              <span className="store-badge-sub">OPEN FOR BUSINESS</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN HEADLINE */}
      <div>
        <div className="attention-pill">
          <span>📢</span> ATTENTION BUSINESS OWNERS!
        </div>
        <h1 className="hero-title">
          Big or Small, Every Business Deserves to <span className="highlight-grow">Grow!</span>
        </h1>
        <p className="hero-subtitle">
          Growth is what matters — not the size of your business.
        </p>

        {/* CONTRAST GRID */}
        <div className="contrast-grid">
          <div className="contrast-left">
            <div className="contrast-item">
              <span className="icon">🔍</span>
              <span>On one side, customers are actively searching for products and services.</span>
            </div>
            <div className="contrast-item">
              <span className="icon">🏪</span>
              <span>On the other side, businesses are ready and waiting to serve them.</span>
            </div>
          </div>

          <div className="contrast-right">
            <div className="contrast-right-header">
              <span className="icon">💡</span>
              <span>What if the right customers could find your business right when they need you?</span>
            </div>
            <p>Imagine people in your neighbourhood discovering your business, reaching you easily, and buying from you!</p>
          </div>
        </div>

        {/* BLUE BANNER */}
        <div className="blue-promo-strip">
          <h3>🚀 Give Your Business a Stronger Digital Presence!</h3>
          <p>We are introducing a new Business Search Engine to help customers discover local businesses, products, and services.</p>
        </div>

        {/* 3-COLUMN BENEFIT + MOCKUP + QR SECTION */}
        <div className="value-section">
          {/* Left: Benefits */}
          <div className="benefits-col">
            <h4>⭐ Register Your Business — It&apos;s FREE!</h4>
            <div className="benefits-subtitle">Enjoy these benefits:</div>
            <ul className="benefits-list">
              <li><span className="check-icon">✓</span> FREE Business Registration</li>
              <li><span className="check-icon">✓</span> Dedicated Business Profile</li>
              <li><span className="check-icon">✓</span> Get Discovered by Local Customers</li>
              <li><span className="check-icon">✓</span> Direct Call &amp; WhatsApp Enquiries</li>
              <li><span className="check-icon">✓</span> Showcase Your Products &amp; Services</li>
              <li><span className="check-icon">✓</span> Share Your Business Profile Easily</li>
            </ul>
          </div>

          {/* Center: Mobile mockup */}
          <div className="mockup-col">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="mockup-brand">bizearch.in</div>
                <div className="mockup-search-bar">
                  <span>⌕</span> Search Hosur stores...
                </div>
                <div className="mockup-categories">
                  <div className="mockup-cat-item">
                    <span>🛍️</span> Retail
                  </div>
                  <div className="mockup-cat-item">
                    <span>🚗</span> Auto
                  </div>
                  <div className="mockup-cat-item">
                    <span>💻</span> Tech
                  </div>
                  <div className="mockup-cat-item">
                    <span>🍽️</span> Food
                  </div>
                </div>
                <div className="mockup-store-card">
                  <div>Verified Store</div>
                  <div style={{ fontSize: "6.5px", color: "#0284c7" }}>Near you · 0.5 km</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="qr-col">
            <div className="qr-card">
              <div className="qr-code-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bizearch-qr.png" alt="Scan QR Code to Register" />
              </div>
              <div className="scan-text">Scan me!</div>
              <a href="https://bizearch.in" className="url-pill" target="_blank" rel="noreferrer">
                🔗 https://bizearch.in
              </a>
            </div>
          </div>
        </div>

        {/* FOUNDING PARTNERS OFFER */}
        <div className="special-offer-banner">
          <div className="offer-title">
            <span>👑</span> SPECIAL OFFER FOR FOUNDING BUSINESS PARTNERS
          </div>
          <div className="offer-desc">
            Be among the first businesses to join our growing network and take your business one step closer to more customers.
          </div>
        </div>

        {/* CTA SLOGAN ROW */}
        <div className="cta-slogan-row">
          <div className="cta-top">
            <div className="cta-register-pill">
              <span>📲</span> Register Your Business Today <span>For Free!</span>
            </div>
            <div className="tagline-badge">Your Business. Your Visibility. Your Growth.</div>
          </div>
          <div className="cta-bottom">
            <span>🤝 Let&apos;s connect local customers with local businesses.</span>
            <span className="grow-together">🌱 Let&apos;s Grow Together!</span>
          </div>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <footer className="poster-footer">
        <div className="footer-brand-strip">
          <div className="footer-team">By Team Bizearch</div>

          <div className="footer-powered-box">
            <span className="powered-text">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jishnu-infotech-logo.jpg" alt="Jishnu Infotech" />
          </div>

          <div className="footer-care">
            <span>📞 Customer Care:</span>
            <span className="phone-num">+91 95668 23219</span>
          </div>
        </div>

        <div className="hashtag-bar">
          <span>#BusinessGrowth</span>
          <span>•</span>
          <span>#LocalBusiness</span>
          <span>•</span>
          <span>#FreeBusinessListing</span>
          <span>•</span>
          <span>#DigitalPresence</span>
          <span>•</span>
          <span>#GrowTogether</span>
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
      <div className="poster-bg-dots" />

      {/* TOP HEADER */}
      <div className="poster-header">
        <div className="poster-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bizearch-logo.jpg" alt="Bizearch.in - Find • Connect • Grow" />
        </div>

        <div className="header-graphic-wrap">
          <div className="store-3d-card" style={{ background: "#eff6ff", borderColor: "#93c5fd" }}>
            <span className="store-icon-3d">🗺️</span>
            <div className="store-badge-text">
              <span className="store-badge-title" style={{ color: "#1d4ed8" }}>HYPERLOCAL NETWORK</span>
              <span className="store-badge-sub" style={{ color: "#1e40af" }}>SEE YOUR NEIGHBORHOOD</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEADLINE */}
      <div>
        <div className="attention-pill" style={{ background: "#059669" }}>
          <span>🌟</span> ALL-IN-ONE NEIGHBORHOOD PLATFORM
        </div>
        <h1 className="hero-title">
          Everything in Your City, <span className="highlight-grow">Right Around Your Corner!</span>
        </h1>
        <p className="hero-subtitle">
          Discover verified stores, request instant quotes, contact owners directly, and shop local.
        </p>

        {/* 6 CORE FEATURES GRID */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-bubble blue">📍</div>
            <div className="feature-content">
              <h4>Real-Time Proximity &amp; Navigation</h4>
              <p>Instant GPS distance (in km) and 1-tap Google Maps directions to any store or office in town.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble green">💬</div>
            <div className="feature-content">
              <h4>Direct Call &amp; WhatsApp Connect</h4>
              <p>Connect directly with shop owners in 1 tap with zero middleman commissions or broker fees.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble orange">📄</div>
            <div className="feature-content">
              <h4>Custom Quotes &amp; Estimates</h4>
              <p>Request price estimates directly from merchants with automated WhatsApp message handoff.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble purple">🛍️</div>
            <div className="feature-content">
              <h4>Live Menus &amp; Store Catalogs</h4>
              <p>Browse real-time product catalogs, pricing, order for doorstep delivery or store pickup.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble green">🛡️</div>
            <div className="feature-content">
              <h4>100% Agent-Verified Listings</h4>
              <p>Every business is verified on-ground by JIT field agents with geotagged physical proof.</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-bubble red">🚨</div>
            <div className="feature-content">
              <h4>Emergency SOS &amp; Quick Help</h4>
              <p>1-tap community SOS alert with live GPS coordinates sent to nearby emergency services.</p>
            </div>
          </div>
        </div>

        {/* 4 LANGUAGES BANNER */}
        <div className="lang-banner">
          <span className="lang-label">🗣️ Available in 4 Regional Languages:</span>
          <div className="lang-tags">
            <span className="lang-tag">English</span>
            <span className="lang-tag">தமிழ் (Tamil)</span>
            <span className="lang-tag">ಕನ್ನಡ (Kannada)</span>
            <span className="lang-tag">తెలుగు (Telugu)</span>
          </div>
        </div>

        {/* VALUE SECTION */}
        <div className="value-section" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 900, color: "#004b87", marginBottom: "4px" }}>
              🚀 Are You a Local Business Owner?
            </h4>
            <div className="benefits-subtitle" style={{ marginBottom: "10px" }}>
              Join hundreds of Hosur businesses reaching thousands of local customers daily:
            </div>
            <ul className="benefits-list">
              <li><span className="check-icon">✓</span> Zero Commission — 100% of sales stay with you</li>
              <li><span className="check-icon">✓</span> Real-Time Customer Lead Inbox on your phone</li>
              <li><span className="check-icon">✓</span> Direct WhatsApp customer engagement</li>
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="qr-card" style={{ maxWidth: "200px" }}>
              <div className="qr-code-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bizearch-qr.png" alt="Scan QR Code to Explore" />
              </div>
              <div className="scan-text">Scan to Explore</div>
              <a href="https://bizearch.in" className="url-pill" target="_blank" rel="noreferrer">
                🔗 https://bizearch.in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <footer className="poster-footer">
        <div className="footer-brand-strip">
          <div className="footer-team">By Team Bizearch</div>

          <div className="footer-powered-box">
            <span className="powered-text">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jishnu-infotech-logo.jpg" alt="Jishnu Infotech" />
          </div>

          <div className="footer-care">
            <span>📞 Customer Care:</span>
            <span className="phone-num">+91 95668 23219</span>
          </div>
        </div>

        <div className="hashtag-bar">
          <span>#HosurMarketplace</span>
          <span>•</span>
          <span>#VocalForLocal</span>
          <span>•</span>
          <span>#VerifiedStores</span>
          <span>•</span>
          <span>#DirectConnect</span>
          <span>•</span>
          <span>#BizearchIndia</span>
        </div>
      </footer>
    </div>
  );
}
