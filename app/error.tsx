"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Bizearch application error:", error);

    // If it's an internal Next.js redirect thrown during navigation, route immediately
    if (error?.digest?.startsWith("NEXT_REDIRECT") || error?.message?.includes("NEXT_REDIRECT")) {
      window.location.href = "/";
      return;
    }

    // Automatically recover without showing error message to the user
    try {
      const attempts = parseInt(sessionStorage.getItem("bizearch_auto_retry") || "0", 10);
      if (attempts < 2) {
        sessionStorage.setItem("bizearch_auto_retry", String(attempts + 1));
        window.location.reload();
        return;
      }
      sessionStorage.removeItem("bizearch_auto_retry");
      reset();
    } catch {
      window.location.reload();
    }
  }, [error, reset]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f6f8f5",
        padding: "24px",
        fontFamily: "Manrope, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "20px" }}>
        <img
          src="/bizearch-logo.png"
          alt="Bizearch.in"
          style={{ width: "180px", height: "auto", margin: "0 auto 14px", display: "block", objectFit: "contain" }}
        />
        <p style={{ fontSize: "14px", color: "#3d5244", fontWeight: 600, margin: 0 }}>
          Loading Bizearch portal…
        </p>
      </div>
    </main>
  );
}
