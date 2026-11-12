"use client";

import React, { useRef, useState, useEffect } from "react";

export interface JitCertificateData {
  businessName: string;
  category?: string;
  locality?: string;
  address?: string;
  phone?: string;
  gstin?: string;
  certificateId?: string;
  issueDate?: string;
  validThrough?: string;
  assignedAgentName?: string;
  verifiedBy?: string;
  profileUrl?: string;
}

export const DEFAULT_SAMPLE_CERTIFICATE: JitCertificateData = {
  businessName: "JISHNU INFOTECH PRIVATE LIMITED",
  category: "IT & Software Solutions",
  locality: "NGGO's Colony, Hosur",
  address: "NGGO's Colony, Hosur",
  phone: "+91 90430 22219",
  certificateId: "BZR-JIT-2026-0001",
  issueDate: "12 November 2026",
  validThrough: "31 March 2027",
  assignedAgentName: "JIT",
  verifiedBy: "JIT On-Ground Verification Unit",
  profileUrl: "https://bizearch.in",
};

export function cleanDisplayLocality(address?: string, locality?: string): string {
  if (locality && locality.trim()) return locality.trim();
  if (!address) return "NGGO's Colony, Hosur";
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 2) return address;
  return parts.slice(-2).join(", ");
}

/**
 * High-res image download helper using print / canvas capture
 */
export async function downloadMasterCertificate(data: JitCertificateData, filename?: string) {
  try {
    window.print();
  } catch {
    window.print();
  }
}

export function JitCertificate({
  data = DEFAULT_SAMPLE_CERTIFICATE,
  className = "",
}: {
  data?: JitCertificateData;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Responsive dynamic scaling for all devices (Mobile, Tablet, Desktop)
  useEffect(() => {
    setMounted(true);
    const updateScale = () => {
      if (containerRef.current) {
        const availableW = containerRef.current.clientWidth;
        if (availableW > 0 && availableW < 1123) {
          // Leave a subtle 4px margin on mobile screens
          const targetW = Math.max(280, availableW - 4);
          const computedScale = targetW / 1123;
          setScale(computedScale);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const businessName = (data.businessName || "JISHNU INFOTECH PRIVATE LIMITED").trim().toUpperCase();
  const category = data.category || "IT & Software Solutions";
  const locality = cleanDisplayLocality(data.address, data.locality);
  const phone = data.phone || "+91 90430 22219";
  const issueDate = data.issueDate || "12 November 2026";
  const validThrough = data.validThrough || "31 March 2027";
  const agentName = (data.assignedAgentName || "JIT").trim();

  const isFlagship = businessName.includes("JISHNU INFOTECH");

  const num = Math.abs(
    businessName.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  const certId =
    data.certificateId ||
    (isFlagship
      ? "BZR-JIT-2026-0001"
      : `BZR-JIT-2026-${String(1 + (num % 9999)).padStart(4, "0")}`);

  // Dynamic font sizing for long business names to prevent any wrapping or overflow
  const nameLen = businessName.length;
  const nameSize = nameLen > 38 ? "24px" : nameLen > 28 ? "28px" : "34px";

  return (
    <div ref={containerRef} className={`certificate-viewport-wrapper ${className}`}>
      {/* Scaler Box keeps outer document flow exactly matched to the scaled certificate size */}
      <div
        className="certificate-scaler-box"
        style={{
          width: mounted && scale < 1 ? `${Math.round(1123 * scale)}px` : "1123px",
          height: mounted && scale < 1 ? `${Math.round(794 * scale)}px` : "794px",
          position: "relative",
          margin: "0 auto",
          overflow: "visible",
          maxWidth: "100%",
        }}
      >
        <div
          className="certificate"
          id="bizearch-official-certificate-node"
          style={{
            transform: mounted && scale < 1 ? `scale(${scale})` : "none",
            transformOrigin: "top left",
            position: mounted && scale < 1 ? "absolute" : "relative",
            top: 0,
            left: 0,
          }}
        >
          <div className="inner-border">
            {/* Header */}
            <div className="header">
              <div className="header-brand">
                <img
                  src="/bizearch-cert-logo.png"
                  alt="Bizearch.in"
                  className="brand-logo-img"
                />
              </div>

              <div className="registry">
                <div className="badge">✓ BIZEARCH VERIFIED BUSINESS</div>
                <div className="reg-text">
                  OFFICIAL REGISTRY OF VERIFIED BUSINESSES<br />
                  CERTIFICATE NO: {certId}
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="heading">
              <div className="subtitle">BIZEARCH BUSINESS ACCREDITATION</div>
              <h1>CERTIFICATE OF VERIFICATION</h1>
              <p>This is to officially certify that</p>
            </div>

            {/* Business */}
            <div className="business">
              <h2 style={{ fontSize: nameSize }}>{businessName}</h2>

              <div className="business-info">
                {category}
                &nbsp; | &nbsp;
                {locality}
                &nbsp; | &nbsp;
                {phone}
              </div>
            </div>

            {/* Description */}
            <div className="description">
              Has successfully completed the Bizearch.in business
              verification process, including on-ground physical verification,
              business identity validation, and service assessment.
              This organization is hereby recognized as a
            </div>

            {/* Verified Badge */}
            <div className="verified">
              ✓ BIZEARCH VERIFIED BUSINESS
            </div>

            {/* Listing */}
            <div className="listing">
              and is listed on the <b>Bizearch.in</b> directory platform.
            </div>

            {/* Details 4-Column Grid */}
            <div className="details">
              <div className="detail">
                <small>VERIFICATION TYPE</small>
                <strong>On-Ground Physical Audit</strong>
              </div>

              <div className="detail">
                <small>DATE OF VERIFICATION</small>
                <strong>{issueDate}</strong>
              </div>

              <div className="detail">
                <small>VALID THROUGH</small>
                <strong>{validThrough}</strong>
              </div>

              <div className="detail">
                <small>JURISDICTION</small>
                <strong>Hosur Division, Tamil Nadu</strong>
              </div>
            </div>

            {/* Footer Grid */}
            <div className="footer">
              <div className="qr">
                <img
                  src="/bizearch-cert-qr.jpg"
                  alt="Verification QR Code"
                />
                <div className="qr-text">
                  <b>SCAN TO VERIFY</b><br />
                  Scan to view business profile<br />
                  and verification details at<br />
                  <b>bizearch.in</b>
                </div>
              </div>

              <div className="seal">
                ★ BIZEARCH ★
                <br />
                VERIFIED
                <br />
                BUSINESS
                <br />
                ★ ★ ★
              </div>

              <div className="signature">
                <div className="sign">{agentName}</div>
                <strong>{agentName}</strong>
                Agent<br />
                Bizearch.in
              </div>

              <div className="signature">
                <div className="sign">G. Venkatesan</div>
                <strong>G. Venkatesan</strong>
                Director - Trust &amp; Verification<br />
                Bizearch.in
              </div>
            </div>

            {/* Bottom citation */}
            <div className="bottom">
              ISSUED BY JISHNU INFOTECH PRIVATE LIMITED
              &nbsp; | &nbsp;
              BIZEARCH.IN BUSINESS VERIFICATION PROGRAM
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .certificate-viewport-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px 4px;
          overflow: hidden;
          background: transparent;
          box-sizing: border-box;
        }

        .certificate {
          width: 1123px;
          height: 794px;
          margin: 0;
          padding: 35px 48px;
          position: relative;
          overflow: hidden;
          background: #fffdf8;
          border: 8px double #c99b37;
          outline: 2px solid #102c55;
          outline-offset: -15px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.25);
          font-family: Georgia, 'Times New Roman', serif;
          color: #102c55;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .inner-border {
          height: 100%;
          border: 1px solid #d3aa58;
          padding: 20px 25px;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #d9bd80;
          padding-bottom: 12px;
        }

        .header-brand {
          display: flex;
          align-items: center;
        }

        .brand-logo-img {
          height: 54px;
          width: auto;
          max-width: 260px;
          object-fit: contain;
          display: block;
        }

        .registry {
          text-align: right;
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.8;
          letter-spacing: 1px;
        }

        .reg-text {
          margin-top: 4px;
          font-size: 11px;
          color: #102c55;
        }

        .badge {
          background: #082d55;
          color: white;
          padding: 5px 16px;
          border-radius: 20px;
          font-weight: bold;
          display: inline-block;
          font-size: 11px;
          letter-spacing: 0.5px;
        }

        .heading {
          text-align: center;
          margin-top: 24px;
        }

        .heading .subtitle {
          font-size: 12px;
          letter-spacing: 6px;
          color: #bb8c38;
          font-family: Arial, sans-serif;
          font-weight: bold;
        }

        .heading h1 {
          font-size: 35px;
          letter-spacing: 2px;
          margin: 6px 0;
          color: #102e61;
          font-weight: bold;
        }

        .heading p {
          font-style: italic;
          font-size: 15px;
          margin: 0;
          color: #3b4e6b;
        }

        .business {
          text-align: center;
          margin-top: 18px;
        }

        .business h2 {
          margin: 6px 0 10px;
          text-transform: uppercase;
          color: #102c55;
          font-weight: bold;
          letter-spacing: 1px;
          line-height: 1.15;
        }

        .business-info {
          display: inline-block;
          padding: 8px 24px;
          border: 1px solid #e5c17c;
          border-radius: 25px;
          background: #fff8e8;
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: bold;
          color: #102c55;
        }

        .description {
          text-align: center;
          font-size: 14.5px;
          line-height: 1.7;
          margin: 18px 40px 8px;
          color: #243a5e;
        }

        .verified {
          margin: 4px auto 0;
          padding: 8px 40px;
          background: #092d57;
          border: 4px solid #d7a42f;
          color: white;
          font-family: Arial, sans-serif;
          font-weight: bold;
          font-size: 18px;
          letter-spacing: 1px;
          text-align: center;
          width: fit-content;
        }

        .listing {
          text-align: center;
          font-size: 13.5px;
          margin: 8px 0 14px;
          color: #3b4e6b;
        }

        .details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid #d7dce4;
          border-radius: 12px;
          background: white;
          padding: 10px 5px;
          font-family: Arial, sans-serif;
          text-align: center;
        }

        .detail {
          border-right: 1px solid #aab3c1;
          padding: 0 8px;
        }

        .detail:last-child {
          border: none;
        }

        .detail small {
          display: block;
          font-size: 10px;
          letter-spacing: 1px;
          margin-bottom: 4px;
          color: #64748b;
          font-weight: bold;
        }

        .detail strong {
          font-size: 13px;
          color: #102c55;
        }

        .footer {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 1fr 1fr;
          align-items: center;
          gap: 15px;
          margin-top: auto;
          padding-top: 14px;
        }

        .qr {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: Arial, sans-serif;
          font-size: 11.5px;
          color: #102c55;
        }

        .qr img {
          width: 80px;
          height: 80px;
          border: 2px solid #102c55;
          padding: 3px;
          background: #ffffff;
          object-fit: contain;
          flex-shrink: 0;
        }

        .qr-text {
          line-height: 1.4;
        }

        .seal {
          text-align: center;
          width: 115px;
          height: 115px;
          margin: auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffe994, #d69a19, #fff0a6);
          border: 5px double #b27c13;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: bold;
          color: #082d55;
          box-shadow: 0 4px 12px rgba(170, 130, 29, 0.35);
          line-height: 1.35;
        }

        .signature {
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: 11.5px;
          color: #102c55;
        }

        .signature .sign {
          font-family: "Great Vibes", "Brush Script MT", cursive, serif;
          font-size: 28px;
          font-style: italic;
          border-bottom: 1.5px solid #c99b37;
          padding-bottom: 4px;
          margin-bottom: 5px;
          color: #102c55;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signature strong {
          display: block;
          font-size: 12.5px;
          color: #102c55;
        }

        .bottom {
          text-align: center;
          border-top: 1px solid #d8b76e;
          margin-top: 14px;
          padding-top: 8px;
          font-family: Arial, sans-serif;
          font-size: 10px;
          letter-spacing: 2px;
          color: #64748b;
        }

        @page {
          size: A4 landscape;
          margin: 0;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .certificate-viewport-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .certificate-scaler-box {
            width: 1123px !important;
            height: 794px !important;
          }

          .certificate {
            transform: none !important;
            position: relative !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
