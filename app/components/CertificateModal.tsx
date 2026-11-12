"use client";

import React, { useRef } from "react";
import { JitCertificate, type JitCertificateData } from "./JitCertificate";

export function CertificateModal({
  data,
  close,
}: {
  data: JitCertificateData;
  close: () => void;
}) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const shareableUrl = typeof window !== "undefined"
    ? `${window.location.origin}/certificate?business=${encodeURIComponent(data.businessName)}`
    : `/certificate?business=${encodeURIComponent(data.businessName)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareableUrl);
      alert("Certificate link copied to clipboard!");
    }
  };

  return (
    <div
      className="order-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(11, 22, 14, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100000,
        padding: "16px",
        overflowY: "auto",
      }}
      onClick={close}
    >
      <div
        className="certificate-modal-container"
        style={{
          maxWidth: "1120px",
          width: "98vw",
          margin: "auto",
          position: "relative",
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
          background: "#18221b",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
          border: "1px solid #3d5945",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar */}
        <div
          style={{
            padding: "12px 20px",
            background: "linear-gradient(135deg, #132a1b 0%, #1e422b 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            borderBottom: "1px solid #2d5a3b",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🏆</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>
                Official JIT Verified Certificate
              </h3>
              <small style={{ color: "#a3d9b4", fontSize: "11px" }}>
                {data.businessName} • Certificate ID: {data.certificateId || "BZR-JIT-TN-2026"}
              </small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: "#ffffff",
                color: "#143a22",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <span>🖨️</span> Print / Save PDF
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>🔗</span> Copy Link
            </button>

            <a
              href={shareableUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>↗</span> Open Fullscreen
            </a>

            <button
              type="button"
              onClick={close}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#ffffff",
                fontSize: "18px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Certificate Viewer */}
        <div style={{ overflowY: "auto", padding: "16px", background: "#1a241c" }}>
          <JitCertificate data={data} />
        </div>
      </div>
    </div>
  );
}
