import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", padding: "24px", fontFamily: "Manrope, sans-serif" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center", background: "#ffffff", padding: "40px 28px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,67,139,0.06)" }}>
        <img src="/bizearch-logo.png" alt="Bizearch.in" style={{ width: "180px", height: "auto", margin: "0 auto 16px", objectFit: "contain", display: "block" }} />
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#00438b", letterSpacing: "1px", textTransform: "uppercase" }}>Page Not Found</div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "10px 0 12px" }}>404 · Lost your way?</h1>
        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
          The page or business listing you are looking for doesn't exist or may have been relocated.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#00438b",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0, 67, 139, 0.25)",
          }}
        >
          ← Return to Bizearch Home
        </Link>
      </div>
    </main>
  );
}
