"use client";

import React, { useRef } from "react";
import { JitCertificate, type JitCertificateData, downloadMasterCertificate } from "./JitCertificate";

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
          maxWidth: "1180px",
          width: "98vw",
          margin: "auto",
          position: "relative",
          maxHeight: "96vh",
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
          className="cert-modal-toolbar"
          style={{
            padding: "12px 18px",
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
          <div className="cert-modal-brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🏆</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", color: "#ffffff" }}>
                Official JIT Verified Certificate
              </h3>
              <small style={{ color: "#a3d9b4", fontSize: "11px" }}>
                {data.businessName} • ID: {data.certificateId || "BZR-JIT-2026-0001"}
              </small>
            </div>
          </div>

          <div className="cert-modal-actions" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
            <button
              type="button"
              onClick={() => downloadMasterCertificate(data)}
              className="cert-tool-btn cert-tool-gold"
              title="Download Master Resolution Certificate"
            >
              <span>⬇️</span> Master JPG
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="cert-tool-btn cert-tool-print"
            >
              <span>🖨️</span> Print / PDF
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="cert-tool-btn cert-tool-outline"
            >
              <span>🔗</span> Copy
            </button>

            <a
              href={shareableUrl}
              target="_blank"
              rel="noreferrer"
              className="cert-tool-btn cert-tool-outline"
            >
              <span>↗</span> Fullscreen
            </a>

            <button
              type="button"
              onClick={close}
              className="cert-tool-close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Certificate Viewer */}
        <div className="cert-modal-body" style={{ overflowY: "auto", overflowX: "hidden", padding: "12px 8px", background: "#1a241c", flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <JitCertificate data={data} />
        </div>

        <style jsx>{`
          .cert-tool-btn {
            border: none;
            border-radius: 8px;
            padding: 7px 12px;
            font-size: 11.5px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            text-decoration: none;
            transition: all 0.15s ease;
          }
          .cert-tool-gold {
            background: linear-gradient(135deg, #d4af37, #b8860b);
            color: #081a2e;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          }
          .cert-tool-print {
            background: #ffffff;
            color: #143a22;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }
          .cert-tool-outline {
            background: rgba(255,255,255,0.12);
            color: #ffffff;
            border: 1px solid rgba(255,255,255,0.25);
          }
          .cert-tool-outline:hover {
            background: rgba(255,255,255,0.2);
          }
          .cert-tool-close {
            background: rgba(255,255,255,0.15);
            border: none;
            color: #ffffff;
            font-size: 16px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 4px;
          }
          .cert-tool-close:hover {
            background: rgba(255,255,255,0.25);
          }

          @media (max-width: 640px) {
            .cert-modal-toolbar {
              padding: 8px 12px !important;
            }
            .cert-modal-brand {
              width: 100%;
              margin-bottom: 4px;
            }
            .cert-modal-actions {
              width: 100%;
              justify-content: space-between;
            }
            .cert-tool-btn {
              padding: 6px 8px;
              font-size: 10.5px;
            }
            .cert-modal-body {
              padding: 8px 4px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
