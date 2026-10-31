import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f8f5", padding: "24px", fontFamily: "Manrope, sans-serif" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center", background: "#ffffff", padding: "40px 28px", borderRadius: "12px", border: "1px solid #dce8db", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <img src="/bizearch-mark.svg" alt="Bizearch" style={{ width: "48px", height: "48px", margin: "0 auto 16px" }} />
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#2b7744", letterSpacing: "1px", textTransform: "uppercase" }}>Page Not Found</div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#193822", margin: "10px 0 12px" }}>404 · Lost your way?</h1>
        <p style={{ fontSize: "13px", color: "#5a7061", lineHeight: 1.6, margin: "0 0 24px" }}>
          The page or business listing you are looking for doesn't exist or may have been relocated.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#2b7744",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "7px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "13px",
            boxShadow: "0 2px 8px rgba(43, 119, 68, 0.28)",
          }}
        >
          ← Return to Bizearch Home
        </Link>
      </div>
    </main>
  );
}
