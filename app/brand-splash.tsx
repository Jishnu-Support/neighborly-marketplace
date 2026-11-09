"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function BrandSplash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const isLogin = pathname === "/login" || pathname.startsWith("/company-login");
  const dismissTimerRef = useRef<number | null>(null);

  const handleDismiss = () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setTimeout(() => {
      setVisible(false);
      setIsDismissing(false);
    }, 350);
  };

  useEffect(() => {
    if (isLogin || pathname !== "/") {
      setVisible(false);
      return;
    }

    // Show crisp clean splash on page load / refresh
    setVisible(true);
    setIsDismissing(false);

    // Fast, crisp auto-dismiss after ~1.4s
    dismissTimerRef.current = window.setTimeout(() => {
      handleDismiss();
    }, 1400);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname, isLogin]);

  if (!visible || isLogin) return null;

  return (
    <div
      className={`brand-splash-overlay ${isDismissing ? "brand-splash-dismissing" : ""}`}
      role="status"
      aria-label="Loading Bizearch"
      onClick={handleDismiss}
    >
      {/* Subtle ambient lighting */}
      <div className="brand-splash-glow brand-splash-glow-emerald" />
      <div className="brand-splash-glow brand-splash-glow-blue" />

      {/* Crisp & Clean Professional Brand Showcase Card */}
      <div className="brand-splash-clean-card" onClick={(e) => e.stopPropagation()}>
        {/* Bizearch Identity */}
        <div className="brand-splash-logo-row" style={{ justifyContent: "center", marginBottom: "8px" }}>
          <img
            src="/bizearch-logo.png"
            alt="Bizearch.in - Find • Connect • Grow"
            style={{ width: "220px", height: "auto", objectFit: "contain", display: "block" }}
          />
        </div>

        {/* Clean Powered By Label */}
        <span className="brand-splash-clean-subtitle">
          POWERED BY
        </span>

        {/* Full Jishnu Infotech Logo */}
        <div className="brand-splash-clean-logo-wrap">
          <img
            src="/jishnu-infotech-logo.png"
            alt="Jishnu Infotech"
            className="brand-splash-clean-partner-logo"
          />
        </div>

        {/* Crisp Modern Loader Bar */}
        <div className="brand-splash-clean-loader" aria-hidden="true">
          <div className="brand-splash-clean-loader-bar" />
        </div>
      </div>
    </div>
  );
}
