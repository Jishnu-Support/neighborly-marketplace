"use client";

import React, { useRef } from "react";

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
  businessName: "Jishnu Infotech Private Limited",
  category: "IT & Software Solutions",
  locality: "NGGO's Colony, Hosur",
  address: "NGGO's Colony, Hosur",
  phone: "+91 90430 22219",
  certificateId: "BZR-JIT-2026-00001",
  issueDate: "12 November 2026",
  validThrough: "31 March 2027",
  assignedAgentName: "JIT",
  verifiedBy: "JIT On-Ground Verification Unit",
  profileUrl: "https://bizearch.in",
};

export function cleanDisplayLocality(address?: string, locality?: string): string {
  if (locality && locality.trim()) return locality.trim();
  if (!address) return "Hosur, Tamil Nadu";
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 2) return address;
  // If multiple parts (e.g. Plot No, Street, Locality, City), pick the last 2 meaningful parts
  return parts.slice(-2).join(", ");
}

export function getCategoryIcon(category?: string): string {
  if (!category) return "💻";
  const c = category.toLowerCase();
  if (c.includes("soft") || c.includes("tech") || c.includes("it ") || c.includes("computer")) return "💻";
  if (c.includes("ayur") || c.includes("clinic") || c.includes("medic") || c.includes("health") || c.includes("hospital")) return "🏥";
  if (c.includes("auto") || c.includes("motor") || c.includes("bike") || c.includes("car")) return "🏍️";
  if (c.includes("jewel") || c.includes("fashion") || c.includes("saree") || c.includes("cloth")) return "💎";
  if (c.includes("food") || c.includes("rest") || c.includes("baker") || c.includes("cafe") || c.includes("sweets")) return "🍽️";
  if (c.includes("gym") || c.includes("fit") || c.includes("turf") || c.includes("sport") || c.includes("badminton")) return "🏋️";
  if (c.includes("hotel") || c.includes("tour") || c.includes("travel") || c.includes("taxi")) return "🏨";
  if (c.includes("electr") || c.includes("mobile") || c.includes("appliance")) return "📱";
  if (c.includes("home") || c.includes("furn") || c.includes("decor") || c.includes("interior")) return "🛋️";
  if (c.includes("school") || c.includes("colleg") || c.includes("acad") || c.includes("educ")) return "🎓";
  return "🏢";
}

/**
 * Downloads high-definition Master Certificate (either direct master artwork or high-res 2048x1424 canvas render).
 */
export async function downloadMasterCertificate(data: JitCertificateData, filename?: string) {
  const businessName = (data.businessName || "Jishnu Infotech Private Limited").trim();
  const isFlagship =
    businessName.toLowerCase() === "jishnu infotech private limited" ||
    businessName.toLowerCase() === "jishnu infotech";

  if (isFlagship) {
    const a = document.createElement("a");
    a.href = "/bizearch-master-certificate-artwork.jpg";
    a.download = filename || "Bizearch-Verified-Certificate-Jishnu.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Dynamic high-res canvas render (2048 x 1424 px)
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1424;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = "/bizearch-master-certificate-artwork.jpg";

    await new Promise((resolve, reject) => {
      bgImg.onload = resolve;
      bgImg.onerror = reject;
    });

    // Draw base artwork
    ctx.drawImage(bgImg, 0, 0, 2048, 1424);
    const s = 2; // Scale factor relative to 1024x712 design coordinates

    const num = Math.abs(
      businessName.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
    );
    const certId =
      data.certificateId || `BZR-JIT-2026-${String(1 + (num % 9999)).padStart(5, "0")}`;

    // 1. Dynamic Cert ID
    ctx.fillStyle = "#fdfbf7";
    ctx.fillRect(720 * s, 81 * s, 250 * s, 18 * s);
    ctx.font = `800 ${10.5 * s}px 'Montserrat', sans-serif`;
    ctx.fillStyle = "#081a2b";
    ctx.textAlign = "right";
    ctx.fillText(`CERTIFICATE NO: ${certId}`, (1024 - 58) * s, 94 * s);

    // 2. Dynamic Business Name
    ctx.fillStyle = "#fdfbf7";
    ctx.fillRect(175 * s, 240 * s, 674 * s, 44 * s);
    const nameLen = businessName.length;
    const fontSize = nameLen > 36 ? 22 * s : nameLen > 28 ? 25 * s : 29 * s;
    ctx.font = `800 ${fontSize}px 'Playfair Display', Georgia, serif`;
    ctx.fillStyle = "#081a2b";
    ctx.textAlign = "center";
    ctx.fillText(businessName.toUpperCase(), 512 * s, 271 * s);

    // 3. Dynamic Details Pill
    ctx.fillStyle = "#fdfbf7";
    ctx.fillRect(175 * s, 288 * s, 674 * s, 32 * s);

    const category = data.category || "Verified Business Enterprise";
    const locality = cleanDisplayLocality(data.address, data.locality);
    const phone = data.phone || "+91 90430 22219";
    const icon = getCategoryIcon(category);
    const pillText = `${icon} ${category}   |   📍 ${locality}   |   📞 ${phone}`;

    ctx.font = `700 ${11 * s}px 'Montserrat', sans-serif`;
    const textWidth = ctx.measureText(pillText).width;
    const pillW = Math.min(650 * s, textWidth + (36 * s));
    const pillH = 26 * s;
    const pillX = 512 * s - (pillW / 2);
    const pillY = 293 * s;

    // Draw pill background
    ctx.fillStyle = "#f7f4ea";
    ctx.strokeStyle = "#eee8d8";
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 13 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#081a2b";
    ctx.textAlign = "center";
    ctx.fillText(pillText, 512 * s, 310 * s);

    // Export as JPG
    const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename || `Bizearch-Verified-Certificate-${businessName.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Canvas export fallback:", err);
    // Fallback to downloading master image
    const a = document.createElement("a");
    a.href = "/bizearch-master-certificate-artwork.jpg";
    a.download = filename || "Bizearch-Verified-Certificate.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function JitCertificate({
  data = DEFAULT_SAMPLE_CERTIFICATE,
  className = "",
}: {
  data?: JitCertificateData;
  className?: string;
}) {
  const businessName = (data.businessName || "Jishnu Infotech Private Limited").trim();
  const category = data.category || "IT & Software Solutions";
  const locality = cleanDisplayLocality(data.address, data.locality);
  const phone = data.phone || "+91 90430 22219";

  const isJishnuFlagship =
    businessName.toLowerCase() === "jishnu infotech private limited" ||
    businessName.toLowerCase() === "jishnu infotech";

  const num = Math.abs(
    businessName.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 17)
  );
  const certId =
    data.certificateId ||
    (isJishnuFlagship
      ? "BZR-JIT-2026-00001"
      : `BZR-JIT-2026-${String(1 + (num % 9999)).padStart(5, "0")}`);

  const sectorIcon = getCategoryIcon(category);
  const nameLen = businessName.length;
  const nameFontSize =
    nameLen > 36 ? "21px" : nameLen > 28 ? "25px" : nameLen > 20 ? "28px" : "31px";

  return (
    <div className={`jit-cert-master-root ${className}`}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=Montserrat:wght@500;600;700;800&family=Great+Vibes&display=swap"
        rel="stylesheet"
      />

      <div className="jit-cert-frame">
        {/* Master Certificate Artwork Base (1024 x 712 px format) */}
        <img
          src="/bizearch-master-certificate-artwork.jpg"
          alt="Bizearch Business Accreditation Master Certificate"
          className="jit-cert-master-image"
        />

        {/* Dynamic Overlays: ONLY applied when business is not flagship */}
        {!isJishnuFlagship && (
          <>
            {/* 1. Dynamic Certificate Number */}
            <div className="jit-cert-no-overlay">
              CERTIFICATE NO: {certId}
            </div>

            {/* 2. Dynamic Recipient Business Name (Centered between golden laurels) */}
            <div className="jit-cert-name-overlay">
              <span
                className="jit-cert-name-text"
                style={{ fontSize: nameFontSize }}
              >
                {businessName}
              </span>
            </div>

            {/* 3. Dynamic Details Pill Badge */}
            <div className="jit-cert-pill-overlay">
              <div className="jit-cert-pill-badge">
                <span className="pill-item">
                  <span className="pill-icon">{sectorIcon}</span> {category}
                </span>
                <span className="pill-divider">|</span>
                <span className="pill-item">
                  <span className="pill-icon">📍</span> {locality}
                </span>
                <span className="pill-divider">|</span>
                <span className="pill-item">
                  <span className="pill-icon">📞</span> {phone}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .jit-cert-master-root {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px;
          background: transparent;
        }

        .jit-cert-frame {
          position: relative;
          width: 100%;
          max-width: 1024px;
          aspect-ratio: 1024 / 712;
          background: #fdfbf7;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
        }

        .jit-cert-master-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
          display: block;
          user-select: none;
          pointer-events: none;
        }

        /* 1. Dynamic Certificate Number (Top-Right) */
        .jit-cert-no-overlay {
          position: absolute;
          top: 11.65%;
          right: 5.66%;
          width: 25%;
          height: 2.3%;
          background: #fdfbf7;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: clamp(8px, 1.05vw, 10.5px);
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #081a2b;
          text-transform: uppercase;
          z-index: 5;
        }

        /* 2. Dynamic Recipient Business Name (Centered between golden laurels) */
        .jit-cert-name-overlay {
          position: absolute;
          top: 33.98%;
          left: 17.09%;
          width: 65.82%;
          height: 6.18%;
          background: #fdfbf7;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 5;
        }

        .jit-cert-name-text {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 800;
          color: #081a2b;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          line-height: 1.1;
          white-space: nowrap;
        }

        /* 3. Dynamic Details Pill Badge */
        .jit-cert-pill-overlay {
          position: absolute;
          top: 40.73%;
          left: 17.09%;
          width: 65.82%;
          height: 4.2%;
          background: #fdfbf7;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }

        .jit-cert-pill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 1.2vw, 14px);
          background: #f7f4ea;
          border: 1px solid #eee8d8;
          border-radius: 20px;
          padding: 3px clamp(10px, 1.5vw, 18px);
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: clamp(7.5px, 1.05vw, 11px);
          font-weight: 700;
          color: #081a2b;
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .pill-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .pill-icon {
          font-size: 1.1em;
        }

        .pill-divider {
          color: #cbd5e1;
          font-weight: 400;
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
          .jit-cert-master-root {
            width: 100vw !important;
            height: 100vh !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .jit-cert-frame {
            width: 1024px !important;
            height: 712px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
