"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function BrandSplash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Connecting to Hosur digital grid...");
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const isLogin = pathname === "/login" || pathname.startsWith("/company-login");
  const dismissTimerRef = useRef<number | null>(null);

  const handleDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setTimeout(() => {
      setVisible(false);
      setIsDismissing(false);
    }, 400);
  };

  useEffect(() => {
    if (isLogin || pathname !== "/") {
      setVisible(false);
      return;
    }

    // Show splash on root page refresh or initial visit
    setVisible(true);
    setIsDismissing(false);
    setProgress(15);
    setStatusText("Connecting to Hosur digital grid...");

    const pTimer1 = window.setTimeout(() => {
      setProgress(55);
      setStatusText("Syncing neighborhood stores & geo-ads...");
    }, 700);

    const pTimer2 = window.setTimeout(() => {
      setProgress(88);
      setStatusText("Verifying local merchant credentials...");
    }, 1400);

    const pTimer3 = window.setTimeout(() => {
      setProgress(100);
      setStatusText("Welcome to Bizearch Hosur!");
    }, 2000);

    // Auto dismiss after 2.6s
    dismissTimerRef.current = window.setTimeout(() => {
      handleDismiss();
    }, 2600);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
      window.clearTimeout(pTimer1);
      window.clearTimeout(pTimer2);
      window.clearTimeout(pTimer3);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, isLogin]);

  if (!visible || isLogin) return null;

  return (
    <div
      className={`brand-splash-overlay ${isDismissing ? "brand-splash-dismissing" : ""}`}
      role="status"
      aria-label="Loading Bizearch Hyperlocal Marketplace"
      onClick={(e) => {
        // Dismiss if clicking backdrop or skip button, but not inside partner modal
        if ((e.target as HTMLElement).closest(".partner-modal-card")) return;
        handleDismiss();
      }}
    >
      {/* Background ambient lighting glows */}
      <div className="brand-splash-glow brand-splash-glow-emerald" />
      <div className="brand-splash-glow brand-splash-glow-blue" />

      <div
        className="brand-splash-container"
        onClick={(e) => e.stopPropagation()} // Let clicks inside container handle their own actions
      >
        {/* Top Bizearch Identity */}
        <div className="brand-splash-top-identity">
          <div className="brand-splash-logo-row">
            <div className="brand-splash-icon-wrapper">
              <img src="/bizearch-mark.svg" alt="Bizearch Mark" className="brand-splash-icon" />
              <span className="brand-splash-beacon" />
            </div>
            <span className="brand-splash-title">
              bizearch<span className="brand-splash-period">.</span>
            </span>
          </div>
          <div className="brand-splash-tagline">
            <span className="brand-splash-pill">Hosur Hyperlocal Engine</span>
            <span className="brand-splash-dot">•</span>
            <span>Local Commerce & Discovery</span>
          </div>
        </div>

        {/* Divider with Powered By */}
        <div className="brand-splash-divider-wrap">
          <div className="brand-splash-line" />
          <span className="brand-splash-powered-badge">POWERED & ARCHITECTED BY</span>
          <div className="brand-splash-line" />
        </div>

        {/* Interactive Jishnu Infotech Spotlight Card */}
        <div
          className="brand-splash-company-card"
          tabIndex={0}
          role="region"
          aria-label="Jishnu Infotech Company Information"
          title="Click to view Jishnu Infotech partner credentials"
          onClick={() => setShowPartnerModal(true)}
        >
          {/* Card sheen lighting */}
          <div className="brand-splash-card-sheen" />

          {/* Logo container */}
          <div className="brand-splash-img-box">
            <img
              src="/jishnu-infotech-logo.png"
              alt="Jishnu Infotech — Innovate • Integrate • Inspire"
              className="brand-splash-company-logo"
            />
          </div>

          {/* Company Badges & Action */}
          <div className="brand-splash-company-footer">
            <div className="brand-splash-motto-row">
              <span className="brand-splash-motto-pill">Innovate</span>
              <span className="brand-splash-motto-sep">•</span>
              <span className="brand-splash-motto-pill">Integrate</span>
              <span className="brand-splash-motto-sep">•</span>
              <span className="brand-splash-motto-pill">Inspire</span>
            </div>
            <div className="brand-splash-partner-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Technology & Infrastructure Partner</span>
            </div>
          </div>
        </div>

        {/* Real-time Loading & Progress Section */}
        <div className="brand-splash-progress-section">
          <div className="brand-splash-progress-track">
            <div
              className="brand-splash-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="brand-splash-status-row">
            <span className="brand-splash-status-text">{statusText}</span>
            <span className="brand-splash-percent">{progress}%</span>
          </div>
        </div>

        {/* Interactive Action Bar */}
        <div className="brand-splash-actions">
          <button
            type="button"
            className="brand-splash-skip-btn"
            onClick={handleDismiss}
            aria-label="Skip splash screen and enter marketplace"
          >
            <span>Enter Marketplace</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <span className="brand-splash-hint">Press [Space] or click anywhere to skip</span>
        </div>
      </div>

      {/* Interactive Partner Modal */}
      {showPartnerModal && (
        <div
          className="brand-splash-modal-backdrop"
          onClick={(e) => {
            e.stopPropagation();
            setShowPartnerModal(false);
          }}
        >
          <div
            className="partner-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="partner-modal-header">
              <div className="partner-modal-logo-wrap">
                <img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" />
              </div>
              <button
                type="button"
                className="partner-modal-close"
                onClick={() => setShowPartnerModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="partner-modal-body">
              <h3 className="partner-modal-title">Jishnu Infotech</h3>
              <p className="partner-modal-subtitle">Enterprise Technology, Cloud Hosting & Hyperlocal Platform Engineering</p>
              
              <div className="partner-modal-grid">
                <div className="partner-modal-item">
                  <div className="partner-modal-item-icon">🚀</div>
                  <div>
                    <strong>Platform Engineering</strong>
                    <p>Powers Bizearch&apos;s real-time transaction ledger, localized ad server, and neighborhood routing.</p>
                  </div>
                </div>
                <div className="partner-modal-item">
                  <div className="partner-modal-item-icon">📍</div>
                  <div>
                    <strong>Hosur Digital Ecosystem</strong>
                    <p>Dedicated to accelerating digital transformation for Hosur industrial hubs, retail merchants, and local residents.</p>
                  </div>
                </div>
                <div className="partner-modal-item">
                  <div className="partner-modal-item-icon">🔒</div>
                  <div>
                    <strong>Secure Cloud Infrastructure</strong>
                    <p>Hosted on enterprise server nodes with end-to-end encryption, automated backups, and 99.9% uptime SLA.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="partner-modal-footer">
              <button
                type="button"
                className="partner-modal-action-btn"
                onClick={() => {
                  setShowPartnerModal(false);
                  handleDismiss();
                }}
              >
                Continue to Bizearch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
