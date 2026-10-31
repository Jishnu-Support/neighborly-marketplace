"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Bizearch application error:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f8f5", padding: "24px", fontFamily: "Manrope, sans-serif" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center", background: "#ffffff", padding: "40px 28px", borderRadius: "12px", border: "1px solid #ebd4d2", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <img src="/bizearch-mark.svg" alt="Bizearch" style={{ width: "48px", height: "48px", margin: "0 auto 16px" }} />
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#9a3830", letterSpacing: "1px", textTransform: "uppercase" }}>Something Went Wrong</div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#221919", margin: "10px 0 12px" }}>Temporary Glitch</h1>
        <p style={{ fontSize: "13px", color: "#6a5c5b", lineHeight: 1.6, margin: "0 0 24px" }}>
          We encountered an unexpected error loading this view. You can reload this section or return to the marketplace home.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#2b7744",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "7px",
              border: 0,
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ↻ Try Again
          </button>
          <Link
            href="/"
            style={{
              background: "#f1f6ef",
              color: "#275934",
              border: "1px solid #c9dec6",
              padding: "10px 20px",
              borderRadius: "7px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
