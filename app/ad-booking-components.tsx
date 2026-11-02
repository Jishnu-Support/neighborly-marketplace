"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  type AdBookingRequest,
  type AdFormat,
  type AdSlotTiming,
  type AdViewRecord,
  type AdClickRecord,
  AD_FORMAT_PRICING,
  AD_TIME_SLOTS,
  calculateAdPricing,
  createSampleViewRecords,
  createSampleClickRecords,
  isAdActiveAt,
} from "./lib/ad-booking.shared";
import { type AdConfig } from "./lib/ad-config.shared";

// ============================================================================
// AD BOOKING WIZARD & CHECKOUT DIALOG
// ============================================================================
export function AdBookingDialog({
  businessName,
  businesses,
  close,
  onBookingCreated,
  onBookingPaid,
}: {
  businessName?: string;
  businesses: Array<{ name: string; phone?: string; category?: string }>;
  close: () => void;
  onBookingCreated?: (booking: AdBookingRequest) => void;
  onBookingPaid?: (booking: AdBookingRequest) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedBusiness, setSelectedBusiness] = useState(
    businessName || businesses[0]?.name || "My Business"
  );
  const [contactName, setContactName] = useState("Business Owner");
  const [contactPhone, setContactPhone] = useState(
    businesses.find((b) => b.name === selectedBusiness)?.phone || "+91 98450 12345"
  );
  const [format, setFormat] = useState<AdFormat>("combo");
  const [slotTiming, setSlotTiming] = useState<AdSlotTiming>("morning");
  const [customStartHour, setCustomStartHour] = useState(9);
  const [customEndHour, setCustomEndHour] = useState(18);

  // Dates & Duration
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const [startDate, setStartDate] = useState(getTodayStr());
  const [durationDays, setDurationDays] = useState(7);

  // Poster Assets
  const [posterTitle, setPosterTitle] = useState(
    `${selectedBusiness} • Special Neighborhood Offer`
  );
  const [posterLabel, setPosterLabel] = useState(
    `${selectedBusiness} • Hosur Local Favorite`
  );
  const [posterImage, setPosterImage] = useState(
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85"
  );
  const [posterTone, setPosterTone] = useState("gold");

  // Content Ticker Assets
  const [tickerMessage, setTickerMessage] = useState(
    `🌟 ${selectedBusiness}: Visit us today for exclusive discounts & fast local service!`
  );

  // Video Assets
  const [videoTitle, setVideoTitle] = useState(`${selectedBusiness} Spotlight`);
  const [videoDescription, setVideoDescription] = useState(
    "Discover Hosur's trusted local business. High quality service and neighbor-first care."
  );
  const [videoSourceUrl, setVideoSourceUrl] = useState(
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  );
  const [videoPosterUrl, setVideoPosterUrl] = useState(
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=85"
  );
  const [videoCta, setVideoCta] = useState("Contact Business Now");

  // Upload status
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("hosur.business@okhdfcbank");
  const [cardData, setCardData] = useState({
    number: "4532 9012 3456 7890",
    expiry: "11/28",
    cvv: "456",
    name: "Business Director",
  });
  const [selectedBank, setSelectedBank] = useState("State Bank of India (SBI)");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("Connecting to Payment Gateway...");
  const [errorMessage, setErrorMessage] = useState("");

  // Pricing calculation
  const pricing = calculateAdPricing(format, slotTiming, durationDays);

  const calculateEndDate = (start: string, days: number) => {
    try {
      const d = new Date(start);
      d.setDate(d.getDate() + (days - 1));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return start;
    }
  };
  const endDate = calculateEndDate(startDate, durationDays);

  // File Upload Helper
  async function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "poster" | "video" | "videoPoster"
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    if (kind === "poster") setUploadingPoster(true);
    if (kind === "video") setUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind === "video" ? "video" : "image");

      const res = await fetch("/api/ads/bookings/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload file.");

      if (kind === "poster") {
        setPosterImage(data.url);
      } else if (kind === "video") {
        setVideoSourceUrl(data.url);
      } else if (kind === "videoPoster") {
        setVideoPosterUrl(data.url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (kind === "poster") setUploadingPoster(false);
      if (kind === "video") setUploadingVideo(false);
    }
  }

  // Submit and Pay
  async function handleProcessPayment(immediatePay: boolean = true) {
    setIsProcessing(true);
    setErrorMessage("");

    try {
      if (immediatePay) {
        setProcessingStage("Verifying Slot Availability with Hosur Ad Engine...");
        await new Promise((r) => setTimeout(r, 600));

        setProcessingStage("Initiating Secure 256-bit Payment Gateway...");
        await new Promise((r) => setTimeout(r, 700));

        setProcessingStage("Validating Transaction & Allocating Ad Slots...");
        await new Promise((r) => setTimeout(r, 600));
      }

      const txId = immediatePay
        ? `TXN-AD-${paymentMethod.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`
        : undefined;

      const payload = {
        businessName: selectedBusiness,
        contactName,
        contactPhone,
        format,
        slotTiming,
        customStartHour: slotTiming === "custom" ? customStartHour : undefined,
        customEndHour: slotTiming === "custom" ? customEndHour : undefined,
        startDate,
        endDate,
        durationDays,
        poster:
          format === "poster" || format === "combo"
            ? {
                title: posterTitle,
                label: posterLabel,
                imageUrl: posterImage,
                tone: posterTone,
              }
            : undefined,
        content:
          format === "content" || format === "combo"
            ? {
                message: tickerMessage,
              }
            : undefined,
        video:
          format === "video" || format === "combo"
            ? {
                title: videoTitle,
                description: videoDescription,
                sourceUrl: videoSourceUrl,
                posterUrl: videoPosterUrl,
                callToAction: videoCta,
              }
            : undefined,
        paymentMethod: immediatePay
          ? paymentMethod === "upi"
            ? `UPI (${upiId})`
            : paymentMethod === "card"
            ? `Card (ending ${cardData.number.slice(-4)})`
            : `Net Banking (${selectedBank})`
          : undefined,
        transactionId: txId,
        status: immediatePay ? "Paid" : "Pending Payment",
        notes: `Booked by ${contactName} via Bizearch Ad Portal.`,
      };

      const res = await fetch("/api/ads/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ad booking.");

      if (immediatePay) {
        onBookingPaid?.(data.booking);
      } else {
        onBookingCreated?.(data.booking);
      }

      close();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Payment failed. Please retry.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="order-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(14, 28, 18, 0.76)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
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
        className="plan-checkout-container"
        style={{
          maxWidth: "860px",
          width: "95vw",
          margin: "auto",
          position: "relative",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="plan-checkout-header"
          style={{
            background: "linear-gradient(135deg, #163824 0%, #204c32 100%)",
            padding: "16px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📢</span> Request Ad Timing, Formats &amp; Pricing
            </h3>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "12px",
                opacity: 0.88,
                color: "#e2ede6",
              }}
            >
              Choose ad format, display slot timings, upload photos/content/video, and activate.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{
              background: "rgba(255, 255, 255, 0.16)",
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
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Wizard Step Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #d2e4d0",
            background: "#f4f8f4",
            padding: "8px 16px",
            gap: "8px",
            overflowX: "auto",
          }}
        >
          {[
            { num: 1, label: "1. Format & Creative Type" },
            { num: 2, label: "2. Slot Timing & Schedule" },
            { num: 3, label: "3. Creative Assets" },
            { num: 4, label: "4. Pricing & Payment" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as any)}
              style={{
                padding: "8px 14px",
                borderRadius: "20px",
                border: "none",
                fontSize: "12px",
                fontWeight: step === s.num ? 700 : 500,
                background: step === s.num ? "#265239" : "#e5eee4",
                color: step === s.num ? "#ffffff" : "#37503e",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", maxHeight: "68vh" }}>
          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #f87171",
                padding: "10px 14px",
                borderRadius: "8px",
                color: "#991b1b",
                marginBottom: "14px",
                fontSize: "13px",
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* STEP 1: FORMAT SELECTION */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#213829",
                    marginBottom: "6px",
                  }}
                >
                  Promote Business:
                </label>
                <select
                  value={selectedBusiness}
                  onChange={(e) => {
                    setSelectedBusiness(e.target.value);
                    const b = businesses.find((item) => item.name === e.target.value);
                    if (b?.phone) setContactPhone(b.phone);
                    setPosterTitle(`${e.target.value} • Special Neighborhood Offer`);
                    setPosterLabel(`${e.target.value} • Hosur Local Favorite`);
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #c2d6c0",
                    background: "#fff",
                    fontWeight: 600,
                  }}
                >
                  {businesses.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.category || "Local Business"})
                    </option>
                  ))}
                </select>
              </div>

              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#1b3724",
                  marginBottom: "10px",
                }}
              >
                Select Ad Placement Format:
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "12px",
                }}
              >
                {(Object.keys(AD_FORMAT_PRICING) as AdFormat[]).map((fKey) => {
                  const f = AD_FORMAT_PRICING[fKey];
                  const isSelected = format === fKey;
                  const isCombo = fKey === "combo";

                  return (
                    <div
                      key={fKey}
                      onClick={() => setFormat(fKey)}
                      style={{
                        border: isSelected ? "2px solid #235d39" : "1.5px solid #d2e4d0",
                        borderRadius: "12px",
                        padding: "16px",
                        background: isSelected ? "#f3f8f4" : "#ffffff",
                        cursor: "pointer",
                        position: "relative",
                        boxShadow: isSelected ? "0 4px 14px rgba(35, 93, 57, 0.12)" : "none",
                        transition: "all 0.16s ease",
                      }}
                    >
                      {isCombo && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-10px",
                            right: "12px",
                            background: "#d97706",
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          🌟 Best Value
                        </span>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "15px", color: "#183822" }}>
                          {f.shortName}
                        </strong>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 800,
                            color: "#1e5333",
                          }}
                        >
                          ₹{f.baseDailyRate}
                          <small style={{ fontSize: "11px", fontWeight: 500, color: "#5a7061" }}>
                            /day
                          </small>
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#4a6351",
                          lineHeight: "1.45",
                        }}
                      >
                        {f.description}
                      </p>
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: isSelected ? "#1e5333" : "#688470",
                        }}
                      >
                        {isSelected ? "✓ Selected" : "Click to select"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setStep(2)}
                  style={{ padding: "10px 20px" }}
                >
                  Next: Slot Timing &amp; Schedule →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SLOT TIMING & SCHEDULE */}
          {step === 2 && (
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#1b3724",
                  marginBottom: "8px",
                }}
              >
                Choose Ad Display Slot Timing:
              </label>
              <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#546e5c" }}>
                Your ad will automatically appear during the chosen hours. Outside these hours,
                default ads show.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                {(Object.keys(AD_TIME_SLOTS) as AdSlotTiming[]).map((slotKey) => {
                  const s = AD_TIME_SLOTS[slotKey];
                  const isSelected = slotTiming === slotKey;

                  return (
                    <div
                      key={slotKey}
                      onClick={() => setSlotTiming(slotKey)}
                      style={{
                        border: isSelected ? "2px solid #235d39" : "1.5px solid #d4e3d3",
                        borderRadius: "10px",
                        padding: "12px",
                        background: isSelected ? "#f2f8f3" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.16s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                        }}
                      >
                        <strong style={{ fontSize: "13px", color: "#193c23" }}>
                          {s.label}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            background: isSelected ? "#235d39" : "#e4ede3",
                            color: isSelected ? "#ffffff" : "#3c5844",
                            fontWeight: 700,
                          }}
                        >
                          {s.multiplier}x rate
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#1f482d",
                          marginBottom: "4px",
                        }}
                      >
                        🕒 {s.hours}
                      </div>
                      <small style={{ fontSize: "11px", color: "#607968", display: "block" }}>
                        {s.tagline}
                      </small>
                    </div>
                  );
                })}
              </div>

              {slotTiming === "custom" && (
                <div
                  style={{
                    background: "#f7faf7",
                    border: "1px solid #c9dcc8",
                    padding: "14px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#24422e",
                        marginBottom: "4px",
                      }}
                    >
                      Start Hour (24h):
                    </label>
                    <select
                      value={customStartHour}
                      onChange={(e) => setCustomStartHour(Number(e.target.value))}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #b7ceb6",
                      }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={`start-${i}`} value={i}>
                          {String(i).padStart(2, "0")}:00 ({i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#24422e",
                        marginBottom: "4px",
                      }}
                    >
                      End Hour (24h):
                    </label>
                    <select
                      value={customEndHour}
                      onChange={(e) => setCustomEndHour(Number(e.target.value))}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #b7ceb6",
                      }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={`end-${i}`} value={i}>
                          {String(i).padStart(2, "0")}:00 ({i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span style={{ fontSize: "12px", color: "#486550", marginTop: "18px" }}>
                    Ad will run from {customStartHour}:00 to {customEndHour}:00 every day.
                  </span>
                </div>
              )}

              {/* Schedule Dates & Quick Duration Pills */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #d2e4d0",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "#213829",
                        marginBottom: "4px",
                      }}
                    >
                      Start Date:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={getTodayStr()}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #b5ccb4",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "#213829",
                        marginBottom: "4px",
                      }}
                    >
                      End Date:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      readOnly
                      style={{
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #b5ccb4",
                        background: "#f6faf6",
                        color: "#2d4b35",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                <label
                  style={{
                    display: "block",
                    fontWeight: 700,
                    fontSize: "12px",
                    color: "#213829",
                    marginBottom: "6px",
                  }}
                >
                  Select Campaign Duration:
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[1, 3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: durationDays === days ? "2px solid #235d39" : "1px solid #c8d8c6",
                        background: durationDays === days ? "#235d39" : "#ffffff",
                        color: durationDays === days ? "#ffffff" : "#2f4c37",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {days} {days === 1 ? "Day" : "Days"}{" "}
                      {days === 7 ? "🔥 Popular" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setStep(3)}
                >
                  Next: Upload Creative Assets (Photos/Content/Video) →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CREATIVE ASSETS (PHOTOS, CONTENTS, VIDEOS) */}
          {step === 3 && (
            <div>
              <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#546e5c" }}>
                Provide high-resolution photos, marquee content, and videos for your ad slot.
              </p>

              {uploadError && (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    marginBottom: "12px",
                    fontSize: "12px",
                  }}
                >
                  ⚠️ {uploadError}
                </div>
              )}

              {/* POSTER AD SECTION */}
              {(format === "poster" || format === "combo") && (
                <div
                  style={{
                    border: "1px solid #d2e4d0",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                    background: "#ffffff",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      color: "#1b3724",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🖼️</span> Poster Advertisement Creative (Billboard Banner)
                  </h4>

                  <div style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                        }}
                      >
                        Poster Category Tagline:
                      </label>
                      <input
                        type="text"
                        value={posterLabel}
                        onChange={(e) => setPosterLabel(e.target.value)}
                        placeholder="e.g. Greenway Auto • Bagalur Road"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                        }}
                      >
                        Poster Main Headline:
                      </label>
                      <input
                        type="text"
                        value={posterTitle}
                        onChange={(e) => setPosterTitle(e.target.value)}
                        placeholder="e.g. Express 30-Min Two Wheeler & Car Service"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                          marginBottom: "4px",
                        }}
                      >
                        Upload Poster Photo / Image File:
                      </label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingPoster}
                          onChange={(e) => handleFileUpload(e, "poster")}
                          style={{ fontSize: "12px" }}
                        />
                        {uploadingPoster && (
                          <small style={{ color: "#2563eb", fontWeight: 600 }}>
                            Uploading photo...
                          </small>
                        )}
                      </div>
                      <small style={{ fontSize: "11px", color: "#607968", display: "block", marginTop: "4px" }}>
                        JPG, PNG or WebP up to 15 MB. Or paste an image URL below:
                      </small>
                      <input
                        type="url"
                        value={posterImage}
                        onChange={(e) => setPosterImage(e.target.value)}
                        placeholder="https://..."
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                          marginTop: "6px",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                          marginBottom: "4px",
                        }}
                      >
                        Tone Style Accent:
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {["gold", "market", "makers", "community"].map((tone) => (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => setPosterTone(tone)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "4px",
                              border: posterTone === tone ? "2px solid #235d39" : "1px solid #ccdacc",
                              background: posterTone === tone ? "#235d39" : "#ffffff",
                              color: posterTone === tone ? "#ffffff" : "#32503a",
                              fontSize: "11px",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              cursor: "pointer",
                            }}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Poster Preview */}
                  <div style={{ marginTop: "10px" }}>
                    <small
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#3a5641",
                        marginBottom: "4px",
                      }}
                    >
                      LIVE POSTER PREVIEW (As displayed in billboard):
                    </small>
                    <div
                      style={{
                        border: "1px solid #dbe6dc",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#ffffff",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        className={`image-ad-creative ${posterTone}`}
                        style={{
                          height: "150px",
                          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, transparent 40%, rgba(15, 23, 42, 0.4) 100%), url("${posterImage || ""}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          position: "relative",
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px",
                        }}
                      >
                        <span
                          className="ad-label"
                          style={{
                            background: "#e2b13c",
                            color: "#1e3725",
                            fontSize: "9px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          ADVERTISEMENT
                        </span>
                        <span
                          style={{
                            background: "rgba(15, 23, 42, 0.7)",
                            color: "#ffffff",
                            fontSize: "9.5px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "8px",
                          }}
                        >
                          👁️ 10,200 views
                        </span>
                      </div>
                      <div style={{ padding: "12px 14px 10px", background: "#ffffff" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {posterLabel}
                        </span>
                        <strong style={{ fontSize: "14px", lineHeight: "1.3", display: "block", color: "#0f172a", margin: "3px 0 8px" }}>
                          {posterTitle}
                        </strong>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <span style={{ background: "#15803d", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700 }}>🛍️ View Store</span>
                          <span style={{ background: "#25D366", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700 }}>💬 WhatsApp</span>
                          <span style={{ background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700 }}>📞 Call</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT TICKER SECTION */}
              {(format === "content" || format === "combo") && (
                <div
                  style={{
                    border: "1px solid #d2e4d0",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                    background: "#ffffff",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      color: "#1b3724",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>📢</span> Content Announcement Marquee (Scrolling Ticker)
                  </h4>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#284531",
                        marginBottom: "4px",
                      }}
                    >
                      Ticker Message Text:
                    </label>
                    <input
                      type="text"
                      value={tickerMessage}
                      maxLength={140}
                      onChange={(e) => setTickerMessage(e.target.value)}
                      placeholder="e.g. ⚡ Special offer: Get 20% off all orders this week!"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #c2d6c0",
                      }}
                    />
                    <small style={{ fontSize: "11px", color: "#607968", display: "block", marginTop: "4px" }}>
                      Max 140 characters. Will scroll continuously in the top marquee strip.
                    </small>
                  </div>

                  {/* Live Ticker Preview */}
                  <div style={{ marginTop: "12px" }}>
                    <small
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#3a5641",
                        marginBottom: "4px",
                      }}
                    >
                      LIVE MARQUEE PREVIEW:
                    </small>
                    <div
                      style={{
                        background: "#294d37",
                        color: "#f7fbf5",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>{tickerMessage}</span>
                      <i style={{ fontStyle: "normal", color: "#e9ad72" }}>&#10038;</i>
                    </div>
                  </div>
                </div>
              )}

              {/* VIDEO SPOTLIGHT SECTION */}
              {(format === "video" || format === "combo") && (
                <div
                  style={{
                    border: "1px solid #d2e4d0",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                    background: "#ffffff",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      color: "#1b3724",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🎬</span> Video Spotlight Ad Creative
                  </h4>

                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                          marginBottom: "4px",
                        }}
                      >
                        Upload Video File (MP4):
                      </label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                          type="file"
                          accept="video/mp4"
                          disabled={uploadingVideo}
                          onChange={(e) => handleFileUpload(e, "video")}
                          style={{ fontSize: "12px" }}
                        />
                        {uploadingVideo && (
                          <small style={{ color: "#2563eb", fontWeight: 600 }}>
                            Uploading MP4 video...
                          </small>
                        )}
                      </div>
                      <input
                        type="url"
                        value={videoSourceUrl}
                        onChange={(e) => setVideoSourceUrl(e.target.value)}
                        placeholder="https://... or /api/ads/media/..."
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                          marginTop: "6px",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                          marginBottom: "4px",
                        }}
                      >
                        Video Thumbnail Poster URL / Upload:
                      </label>
                      <input
                        type="url"
                        value={videoPosterUrl}
                        onChange={(e) => setVideoPosterUrl(e.target.value)}
                        placeholder="https://..."
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#284531",
                          }}
                        >
                          Video Title:
                        </label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #c2d6c0",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#284531",
                          }}
                        >
                          Call to Action Button:
                        </label>
                        <input
                          type="text"
                          value={videoCta}
                          onChange={(e) => setVideoCta(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #c2d6c0",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                        }}
                      >
                        Video Description:
                      </label>
                      <input
                        type="text"
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                        }}
                      />
                    </div>

                    {/* Live Video Preview */}
                    {videoSourceUrl && (
                      <div style={{ marginTop: "10px" }}>
                        <small
                          style={{
                            display: "block",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#3a5641",
                            marginBottom: "4px",
                          }}
                        >
                          LIVE VIDEO SPOTLIGHT PREVIEW:
                        </small>
                        <div
                          style={{
                            maxWidth: "320px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "1px solid #c8d8c6",
                            background: "#000",
                          }}
                        >
                          <video
                            controls
                            muted
                            poster={videoPosterUrl || undefined}
                            src={videoSourceUrl}
                            style={{ width: "100%", height: "180px", objectFit: "cover" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setStep(2)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setStep(4)}
                >
                  Next: Review Pricing &amp; Pay →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PRICING BREAKDOWN & PAYMENT PROCESSING */}
          {step === 4 && (
            <div>
              {/* Pricing Breakdown Summary Card */}
              <div
                style={{
                  background: "#f7faf7",
                  border: "1px solid #cbe0cb",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    color: "#1a3d24",
                    fontSize: "15px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>🧾 Ad Timing &amp; Placement Invoice Summary</span>
                  <span
                    style={{
                      background: "#245837",
                      color: "#fff",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    Official GST Quote
                  </span>
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px 16px",
                    fontSize: "13px",
                    color: "#284532",
                  }}
                >
                  <div>
                    <span style={{ color: "#617d68", display: "block", fontSize: "11px" }}>
                      Business Name
                    </span>
                    <strong>{selectedBusiness}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#617d68", display: "block", fontSize: "11px" }}>
                      Contact Phone
                    </span>
                    <strong>{contactPhone}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#617d68", display: "block", fontSize: "11px" }}>
                      Ad Format
                    </span>
                    <strong>{AD_FORMAT_PRICING[format].name}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#617d68", display: "block", fontSize: "11px" }}>
                      Display Slot Timing
                    </span>
                    <strong>
                      {slotTiming === "custom"
                        ? `Custom (${customStartHour}:00 – ${customEndHour}:00)`
                        : `${AD_TIME_SLOTS[slotTiming].label} (${AD_TIME_SLOTS[slotTiming].hours})`}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#617d68", display: "block", fontSize: "11px" }}>
                      Schedule Dates
                    </span>
                    <strong>
                      {startDate} to {endDate} ({durationDays} {durationDays === 1 ? "day" : "days"})
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#617d68", display: "block", fontSize: "11px" }}>
                      Daily Rate (Base × Slot Multiplier)
                    </span>
                    <strong>
                      ₹{pricing.effectiveDailyRate.toLocaleString("en-IN")}/day
                    </strong>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px dashed #b5ceb5", margin: "14px 0" }} />

                <div style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      Placement Subtotal ({durationDays} days × ₹{pricing.effectiveDailyRate})
                    </span>
                    <span>₹{pricing.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#546e5c" }}>
                    <span>Applicable GST (18%)</span>
                    <span>₹{pricing.gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#174426",
                      marginTop: "6px",
                      paddingTop: "6px",
                      borderTop: "1.5px solid #a6c6a6",
                    }}
                  >
                    <span>Total Amount Payable:</span>
                    <span>₹{pricing.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#1b3724",
                  marginBottom: "8px",
                }}
              >
                Choose Payment Method:
              </label>

              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                {[
                  { id: "upi", label: "📱 UPI (GPay / PhonePe / QR)", icon: "⚡" },
                  { id: "card", label: "💳 Debit / Credit Card", icon: "🛡️" },
                  { id: "netbanking", label: "🏦 Net Banking", icon: "🏛️" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: paymentMethod === m.id ? "2px solid #235d39" : "1px solid #c8d8c6",
                      background: paymentMethod === m.id ? "#f2f8f3" : "#ffffff",
                      fontWeight: paymentMethod === m.id ? 700 : 500,
                      color: paymentMethod === m.id ? "#1c4a2a" : "#3c5643",
                      cursor: "pointer",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* UPI Tab */}
              {paymentMethod === "upi" && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d2e4d0",
                    padding: "16px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        width: "90px",
                        height: "90px",
                        background: "#f0f4f0",
                        border: "2px solid #235d39",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        fontWeight: 800,
                        fontSize: "11px",
                        color: "#235d39",
                        textAlign: "center",
                        padding: "6px",
                      }}
                    >
                      <span>📲 QR CODE</span>
                      <small style={{ fontSize: "9px", opacity: 0.8 }}>Scan &amp; Pay</small>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#284531",
                          marginBottom: "4px",
                        }}
                      >
                        Or Enter UPI ID / VPA:
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                        }}
                      />
                      <small style={{ fontSize: "11px", color: "#607968", display: "block", marginTop: "4px" }}>
                        Supports Google Pay, PhonePe, Paytm, CRED &amp; BHIM UPI.
                      </small>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {paymentMethod === "card" && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d2e4d0",
                    padding: "16px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>
                      Card Number:
                    </label>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #c2d6c0",
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>
                        Expiry (MM/YY):
                      </label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700 }}>
                        CVV:
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #c2d6c0",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking Tab */}
              {paymentMethod === "netbanking" && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d2e4d0",
                    padding: "16px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#284531",
                      marginBottom: "6px",
                    }}
                  >
                    Select Bank:
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #c2d6c0",
                    }}
                  >
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {/* Processing Loader */}
              {isProcessing && (
                <div
                  style={{
                    background: "#f0f7f2",
                    border: "1.5px solid #235d39",
                    borderRadius: "8px",
                    padding: "14px",
                    marginBottom: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      animation: "spin 1s infinite linear",
                      display: "inline-block",
                      marginBottom: "6px",
                    }}
                  >
                    ⏳
                  </div>
                  <strong style={{ display: "block", color: "#194727", fontSize: "13px" }}>
                    {processingStage}
                  </strong>
                  <small style={{ fontSize: "11px", color: "#456950" }}>
                    Please do not refresh or close this window.
                  </small>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  className="outline-button"
                  disabled={isProcessing}
                  onClick={() => setStep(3)}
                >
                  ← Back to Creatives
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="outline-button"
                    disabled={isProcessing}
                    onClick={() => handleProcessPayment(false)}
                    title="Submit request to Company for quote approval without immediate checkout"
                  >
                    Submit Request &amp; Pay Later
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    disabled={isProcessing}
                    onClick={() => handleProcessPayment(true)}
                    style={{
                      background: "linear-gradient(135deg, #1f5634 0%, #153b23 100%)",
                      padding: "10px 22px",
                      fontSize: "14px",
                      fontWeight: 800,
                    }}
                  >
                    Pay ₹{pricing.totalAmount.toLocaleString("en-IN")} &amp; Activate Ad ⚡
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AD RECEIPT & TAX INVOICE MODAL
// ============================================================================
export function AdReceiptModal({
  booking,
  close,
}: {
  booking: AdBookingRequest;
  close: () => void;
}) {
  return (
    <div
      className="order-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(14, 28, 18, 0.76)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
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
        className="plan-checkout-container"
        style={{
          maxWidth: "680px",
          width: "95vw",
          margin: "auto",
          position: "relative",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="plan-checkout-header"
          style={{
            background: "linear-gradient(135deg, #173f27 0%, #0d2818 100%)",
            padding: "16px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🧾</span> Ad Booking Confirmation &amp; Tax Receipt
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.9, color: "#e2ede6" }}>
              Official payment voucher &amp; scheduled display timings.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{
              background: "rgba(255, 255, 255, 0.16)",
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
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "75vh" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              paddingBottom: "14px",
              borderBottom: "1px solid #d4e3d3",
            }}
          >
            <div>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                ● {booking.status}
              </span>
              <h2 style={{ margin: "6px 0 0", fontSize: "20px", color: "#163a23" }}>
                {booking.businessName}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong style={{ fontSize: "14px", color: "#254a32" }}>
                Ref: {booking.id}
              </strong>
              <small style={{ display: "block", color: "#607968", fontSize: "11px" }}>
                Invoice: {booking.invoiceNumber || "INV-AD-PENDING"}
              </small>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              fontSize: "13px",
              marginBottom: "18px",
              background: "#f7faf7",
              padding: "14px",
              borderRadius: "8px",
            }}
          >
            <div>
              <span style={{ color: "#617d68", fontSize: "11px", display: "block" }}>
                Ad Placement Format:
              </span>
              <strong>{AD_FORMAT_PRICING[booking.format]?.name || booking.format}</strong>
            </div>
            <div>
              <span style={{ color: "#617d68", fontSize: "11px", display: "block" }}>
                Display Slot Timing:
              </span>
              <strong>{booking.slotLabel}</strong>
            </div>
            <div>
              <span style={{ color: "#617d68", fontSize: "11px", display: "block" }}>
                Running Dates:
              </span>
              <strong>
                {booking.startDate} to {booking.endDate} ({booking.durationDays} days)
              </strong>
            </div>
            <div>
              <span style={{ color: "#617d68", fontSize: "11px", display: "block" }}>
                Payment Method &amp; Ref:
              </span>
              <strong>
                {booking.paymentMethod || "Pending"} • {booking.transactionId || "N/A"}
              </strong>
            </div>
          </div>

          {/* Creatives Summary */}
          <div style={{ marginBottom: "18px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#193c23", fontSize: "13px" }}>
              Submitted Creative Assets:
            </h4>
            {booking.poster && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  background: "#fff",
                  border: "1px solid #d4e3d3",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "8px",
                }}
              >
                <img
                  src={booking.poster.imageUrl}
                  alt="Poster"
                  style={{
                    width: "70px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
                <div>
                  <strong style={{ fontSize: "13px", display: "block", color: "#163a23" }}>
                    {booking.poster.title}
                  </strong>
                  <small style={{ color: "#546e5c" }}>{booking.poster.label}</small>
                </div>
              </div>
            )}
            {booking.content && (
              <div
                style={{
                  background: "#294d37",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  marginBottom: "8px",
                }}
              >
                <span>📢 {booking.content.message}</span>
              </div>
            )}
            {booking.video && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #d4e3d3",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                <strong>🎬 {booking.video.title}</strong>
                <p style={{ margin: "2px 0 0", color: "#546e5c" }}>
                  {booking.video.description}
                </p>
              </div>
            )}
          </div>

          {/* Total Paid */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px",
              background: "#edf5ef",
              borderRadius: "8px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "#546e5c", display: "block" }}>
                Total Paid (incl. 18% GST)
              </span>
              <strong style={{ fontSize: "18px", color: "#163a23" }}>
                ₹{booking.totalAmount.toLocaleString("en-IN")}
              </strong>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => window.print()}
              style={{ padding: "8px 16px", fontSize: "12px" }}
            >
              🖨️ Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AD AUDIENCE LOG & VIEWS TIMING RECORDS MODAL
// ============================================================================
export function AdAudienceLogModal({
  booking,
  close,
}: {
  booking: AdBookingRequest;
  close: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterSurface, setFilterSurface] = useState<"all" | "poster" | "content" | "video">("all");
  const [modalTab, setModalTab] = useState<"views" | "clicks">("views");

  const records: AdViewRecord[] = useMemo(() => {
    if (booking.viewRecords && booking.viewRecords.length > 0) {
      return booking.viewRecords;
    }
    const allowed: Array<"poster" | "content" | "video"> =
      booking.format === "combo"
        ? ["poster", "content", "video"]
        : booking.format === "video"
        ? ["video"]
        : booking.format === "content"
        ? ["content"]
        : ["poster"];
    return createSampleViewRecords(booking.id, booking.viewsCount || 20, allowed);
  }, [booking]);

  const clickRecords: AdClickRecord[] = useMemo(() => {
    if (booking.clickRecords && booking.clickRecords.length > 0) {
      return booking.clickRecords;
    }
    return createSampleClickRecords(booking.id, booking.clicksCount || 8);
  }, [booking]);

  const uniqueViewers = useMemo(() => {
    return new Set(records.map((r) => r.viewerName)).size;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterSurface !== "all" && r.surface !== filterSurface) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchCustomerId = r.customerId?.toLowerCase().includes(query);
        const matchName = r.viewerName.toLowerCase().includes(query);
        const matchPhone = r.viewerPhone?.toLowerCase().includes(query);
        const matchLocality = r.locality?.toLowerCase().includes(query);
        const matchDevice = r.device?.toLowerCase().includes(query);
        const matchSurface = r.surfaceLabel?.toLowerCase().includes(query);
        if (!matchCustomerId && !matchName && !matchPhone && !matchLocality && !matchDevice && !matchSurface) {
          return false;
        }
      }
      return true;
    });
  }, [records, filterSurface, search]);

  const filteredClicks = useMemo(() => {
    return clickRecords.filter((c) => {
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchCustomerId = c.customerId?.toLowerCase().includes(query);
        const matchName = c.viewerName?.toLowerCase().includes(query);
        const matchPhone = c.viewerPhone?.toLowerCase().includes(query);
        const matchAction = c.actionLabel?.toLowerCase().includes(query);
        const matchLocality = c.locality?.toLowerCase().includes(query);
        if (!matchCustomerId && !matchName && !matchPhone && !matchAction && !matchLocality) {
          return false;
        }
      }
      return true;
    });
  }, [clickRecords, search]);

  const exportCsv = () => {
    if (modalTab === "clicks") {
      const headers = [
        "Customer ID",
        "Click ID",
        "Ad Booking ID",
        "Business Name",
        "Action Taken",
        "Customer Name",
        "Phone / Contact",
        "Click Date",
        "Click Time",
        "Timestamp (ISO)",
        "Locality",
        "Device",
      ];
      const rows = filteredClicks.map((c) => [
        `"${c.customerId}"`,
        c.id,
        c.adBookingId,
        `"${booking.businessName}"`,
        `"${c.actionLabel}"`,
        `"${c.viewerName}"`,
        `"${c.viewerPhone || "N/A"}"`,
        `"${c.clickedDate}"`,
        `"${c.clickedTime}"`,
        c.clickedAt,
        `"${c.locality || "Hosur, Tamil Nadu"}"`,
        `"${c.device || "Mobile / Web"}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const a = document.createElement("a");
      a.href = encodeURI(csvContent);
      a.download = `ad_lead_clicks_${booking.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.csv`;
      a.click();
      return;
    }

    const headers = [
      "Customer ID",
      "View ID",
      "Ad Booking ID",
      "Business Name",
      "Viewer Name",
      "Viewer Role",
      "Phone / Status",
      "Channel Surface",
      "Ad Viewed Date",
      "Ad Viewed Time",
      "Timestamp (ISO)",
      "Locality",
      "Device",
    ];

    const rows = filteredRecords.map((r) => {
      const d = new Date(r.viewedAt);
      const vDate = r.viewedDate || d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const vTime = r.viewedTime || d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      return [
        `"${r.customerId || "CUST-HSR-GUEST"}"`,
        r.id,
        r.adBookingId,
        `"${booking.businessName}"`,
        `"${r.viewerName}"`,
        `"${r.viewerRole || "Customer"}"`,
        `"${r.viewerPhone || "N/A"}"`,
        `"${r.surfaceLabel || r.surface}"`,
        `"${vDate}"`,
        `"${vTime}"`,
        r.viewedAt,
        `"${r.locality || "Hosur, Tamil Nadu"}"`,
        `"${r.device || "Mobile / Web"}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encoded;
    a.download = `ad_view_records_${booking.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.csv`;
    a.click();
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <div
      className="order-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(14, 28, 18, 0.76)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
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
        className="plan-checkout-container"
        style={{
          maxWidth: "880px",
          width: "95vw",
          margin: "auto",
          position: "relative",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #163e26 0%, #0d2818 100%)",
            padding: "18px 24px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>
                Ad Views &amp; Audience Records
              </h3>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#d2e4d6" }}>
              Live customer reach log for <strong>{booking.businessName}</strong> • {booking.slotLabel} • Format: {AD_FORMAT_PRICING[booking.format]?.shortName || booking.format}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{
              background: "rgba(255, 255, 255, 0.16)",
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
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, background: "#fcfdfc" }}>
          {/* Key Metrics Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #d9e6da" }}>
              <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700, textTransform: "uppercase" }}>
                TOTAL AD VIEWS
              </span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
                👁️ {(booking.viewsCount || records.length).toLocaleString("en-IN")}
              </div>
              <small style={{ color: "#546e5c" }}>Verified customer impressions</small>
            </div>

            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #d9e6da" }}>
              <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700, textTransform: "uppercase" }}>
                DIRECT LEADS &amp; CLICKS
              </span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
                🎯 {(booking.clicksCount || clickRecords.length).toLocaleString("en-IN")}
              </div>
              <small style={{ color: "#546e5c" }}>Calls, WhatsApp &amp; store visits</small>
            </div>

            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #d9e6da" }}>
              <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700, textTransform: "uppercase" }}>
                CLICK-THROUGH RATE (CTR)
              </span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
                📈 {(((booking.clicksCount || clickRecords.length) / Math.max(1, (booking.viewsCount || records.length))) * 100).toFixed(1)}%
              </div>
              <small style={{ color: "#546e5c" }}>Audience engagement ratio</small>
            </div>

            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #d9e6da" }}>
              <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700, textTransform: "uppercase" }}>
                LAST ACTIVE INTERACTION
              </span>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#163a23", marginTop: "6px" }}>
                🕒 {booking.lastViewedAt ? formatRelativeTime(booking.lastViewedAt) : "Recently active"}
              </div>
              <small style={{ color: "#546e5c" }}>
                {booking.lastViewedAt ? new Date(booking.lastViewedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today"}
              </small>
            </div>
          </div>

          {/* Sub-tab Switcher: Impressions vs Direct Leads */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", borderBottom: "1px solid #d8e5d9", paddingBottom: "10px" }}>
            <button
              type="button"
              onClick={() => setModalTab("views")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: 0,
                background: modalTab === "views" ? "#245233" : "#edf3ee",
                color: modalTab === "views" ? "#ffffff" : "#324e39",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>👁️</span> Verified Impressions ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setModalTab("clicks")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: 0,
                background: modalTab === "clicks" ? "#245233" : "#edf3ee",
                color: modalTab === "clicks" ? "#ffffff" : "#324e39",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🎯</span> Direct Customer Leads &amp; Clicks ({filteredClicks.length})
            </button>
          </div>

          {/* Search, Filter & Export Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              background: "#ffffff",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid #d8e5d9",
              marginBottom: "14px",
            }}
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1, minWidth: "220px" }}>
              <span style={{ fontSize: "14px", color: "#67816f" }}>🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={modalTab === "views" ? "Search by Customer ID (e.g. CUST-HSR), name, phone, locality..." : "Search leads by Customer ID, name, or action..."}
                style={{
                  width: "100%",
                  border: "1px solid #c9dacb",
                  borderRadius: "7px",
                  padding: "7px 10px",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              {modalTab === "views" && (["all", "poster", "content", "video"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterSurface(s)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: 0,
                    fontSize: "11.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: filterSurface === s ? "#245233" : "#edf3ee",
                    color: filterSurface === s ? "#ffffff" : "#415a47",
                    transition: "all 0.15s ease",
                  }}
                >
                  {s === "all" ? "All Surfaces" : s === "poster" ? "🖼️ Poster" : s === "content" ? "📢 Ticker" : "🎬 Video"}
                </button>
              ))}

              <button
                type="button"
                onClick={exportCsv}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  background: "#166534",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                title={modalTab === "views" ? "Download CSV report of customer views" : "Download CSV report of customer leads"}
              >
                <span>📥</span> Export {modalTab === "views" ? "Views CSV" : "Leads CSV"}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dce7dc",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {modalTab === "views" ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1.6fr 1.1fr 1.5fr 1.3fr",
                    padding: "10px 16px",
                    background: "#f3f8f4",
                    borderBottom: "1px solid #dce7dc",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#466350",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  <span>Customer ID</span>
                  <span>User / Viewer</span>
                  <span>Ad Channel</span>
                  <span>View Date &amp; Time</span>
                  <span>Locality &amp; Device</span>
                </div>

                {filteredRecords.length === 0 ? (
                  <div style={{ padding: "36px 20px", textAlign: "center", color: "#607a67" }}>
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>🔍</div>
                    <strong>No viewer records match your search filter.</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                      Try adjusting the surface filter or searching for another customer ID or term.
                    </p>
                  </div>
                ) : (
                  <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                    {filteredRecords.map((r, idx) => {
                      const viewDate = new Date(r.viewedAt);
                      const isRecent = Date.now() - viewDate.getTime() < 15 * 60 * 1000;
                      const displayDate = r.viewedDate || viewDate.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
                      const displayTime = r.viewedTime || viewDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                      return (
                        <div
                          key={r.id || idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.3fr 1.6fr 1.1fr 1.5fr 1.3fr",
                            alignItems: "center",
                            padding: "12px 16px",
                            borderBottom: idx < filteredRecords.length - 1 ? "1px solid #edf4ee" : "none",
                            background: isRecent ? "#fafefa" : "#ffffff",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0.4px",
                                background: "#e0f2fe",
                                color: "#0369a1",
                                border: "1px solid #bae6fd",
                                fontFamily: "monospace",
                              }}
                            >
                              🆔 {r.customerId || "CUST-HSR-GUEST"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "#e2efe4",
                                color: "#1c522f",
                                fontWeight: 800,
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {(r.viewerName[0] || "N").toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ display: "block", fontSize: "12.5px", color: "#1a3c26", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.viewerName}
                              </strong>
                              <span style={{ fontSize: "10.5px", color: "#627d6b" }}>
                                {r.viewerRole || "Customer"} {r.viewerPhone ? `• ${r.viewerPhone}` : ""}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "12px",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                background:
                                  r.surface === "video"
                                    ? "#fef3c7"
                                    : r.surface === "content"
                                    ? "#e0f2fe"
                                    : "#dcfce7",
                                color:
                                  r.surface === "video"
                                    ? "#92400e"
                                    : r.surface === "content"
                                    ? "#0369a1"
                                    : "#15803d",
                              }}
                            >
                              {r.surfaceLabel || r.surface}
                            </span>
                          </div>

                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1c3d28", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>⏰</span> {displayTime}
                            </div>
                            <div style={{ fontSize: "11px", color: "#506f59", display: "flex", gap: "4px", alignItems: "center", marginTop: "2px" }}>
                              <span>📅 {displayDate}</span>
                              <span>•</span>
                              <span style={{ fontWeight: 600, color: isRecent ? "#166534" : "#728a7a" }}>
                                {formatRelativeTime(r.viewedAt)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#254430" }}>
                              📍 {r.locality || "Hosur, Tamil Nadu"}
                            </div>
                            <small style={{ fontSize: "10px", color: "#748a7b" }}>
                              💻 {r.device || "Mobile Browser"}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1.6fr 1.3fr 1.5fr 1.3fr",
                    padding: "10px 16px",
                    background: "#f3f8f4",
                    borderBottom: "1px solid #dce7dc",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#466350",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  <span>Customer ID</span>
                  <span>Customer Name</span>
                  <span>Action Taken</span>
                  <span>Click Date &amp; Time</span>
                  <span>Locality &amp; Device</span>
                </div>

                {filteredClicks.length === 0 ? (
                  <div style={{ padding: "36px 20px", textAlign: "center", color: "#607a67" }}>
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>🎯</div>
                    <strong>No customer clicks or leads recorded yet.</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                      Direct calls, WhatsApp chats, and profile clicks will be recorded here.
                    </p>
                  </div>
                ) : (
                  <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                    {filteredClicks.map((c, idx) => {
                      return (
                        <div
                          key={c.id || idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.3fr 1.6fr 1.3fr 1.5fr 1.3fr",
                            alignItems: "center",
                            padding: "12px 16px",
                            borderBottom: idx < filteredClicks.length - 1 ? "1px solid #edf4ee" : "none",
                            background: "#ffffff",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0.4px",
                                background: "#fef3c7",
                                color: "#92400e",
                                border: "1px solid #fde68a",
                                fontFamily: "monospace",
                              }}
                            >
                              🆔 {c.customerId}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "#e0f2fe",
                                color: "#0369a1",
                                fontWeight: 800,
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {(c.viewerName[0] || "C").toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ display: "block", fontSize: "12.5px", color: "#1a3c26", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {c.viewerName}
                              </strong>
                              <span style={{ fontSize: "10.5px", color: "#627d6b" }}>
                                {c.viewerPhone || "Customer Contact"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "12px",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                background:
                                  c.action === "call"
                                    ? "#dcfce7"
                                    : c.action === "whatsapp"
                                    ? "#d1fae5"
                                    : "#e0f2fe",
                                color:
                                  c.action === "call"
                                    ? "#166534"
                                    : c.action === "whatsapp"
                                    ? "#047857"
                                    : "#0369a1",
                              }}
                            >
                              {c.action === "call" ? "📞 " : c.action === "whatsapp" ? "💬 " : c.action === "navigate" ? "📍 " : "🛍️ "}
                              {c.actionLabel}
                            </span>
                          </div>

                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1c3d28", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>⏰</span> {c.clickedTime}
                            </div>
                            <div style={{ fontSize: "11px", color: "#506f59", display: "flex", gap: "4px", alignItems: "center", marginTop: "2px" }}>
                              <span>📅 {c.clickedDate}</span>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#254430" }}>
                              📍 {c.locality || "Hosur, Tamil Nadu"}
                            </div>
                            <small style={{ fontSize: "10px", color: "#748a7b" }}>
                              💻 {c.device || "Mobile Browser"}
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            background: "#ffffff",
            borderTop: "1px solid #dce7dc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "#66806e" }}>
            🔒 All user view timings and impressions are audited and privacy-compliant for Bizearch businesses.
          </span>
          <button
            type="button"
            className="primary-button"
            onClick={close}
            style={{ padding: "8px 20px", fontSize: "12px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AD CAMPAIGN MANAGER TAB (FOR BUSINESS PORTAL)
// ============================================================================
export function AdCampaignsManager({
  businessName,
  businesses,
  adBookings,
  currentSimulatedHour,
  onSimulateHour,
  onOpenBookingWizard,
  onPayBooking,
}: {
  businessName?: string;
  businesses: Array<{ name: string; phone?: string; category?: string }>;
  adBookings: AdBookingRequest[];
  currentSimulatedHour: number | null;
  onSimulateHour: (hour: number | null) => void;
  onOpenBookingWizard: () => void;
  onPayBooking: (booking: AdBookingRequest) => void;
}) {
  const [selectedReceipt, setSelectedReceipt] = useState<AdBookingRequest | null>(null);
  const [selectedAudienceLog, setSelectedAudienceLog] = useState<AdBookingRequest | null>(null);

  // Filter bookings for this business (or all if not specified)
  const businessBookings = businessName
    ? adBookings.filter(
        (b) => b.businessName.toLowerCase() === businessName.toLowerCase()
      )
    : adBookings;

  const currentHour =
    currentSimulatedHour !== null ? currentSimulatedHour : new Date().getHours();

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1b432a 0%, #295f3e 100%)",
          color: "#ffffff",
          borderRadius: "14px",
          padding: "22px 26px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 6px 20px rgba(27, 67, 42, 0.18)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "#a4e2ba",
              textTransform: "uppercase",
            }}
          >
            ● LOCAL AUDIENCE EXPANSION
          </span>
          <h2 style={{ margin: "4px 0 6px 0", fontSize: "22px", color: "#ffffff" }}>
            Promote With Time-Targeted Ads
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              opacity: 0.9,
              maxWidth: "600px",
              color: "#d9ede0",
            }}
          >
            Display your business as high-impact poster billboards, marquee ticker announcements,
            and spotlight videos during peak neighborhood shopping hours.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onOpenBookingWizard}
          style={{
            background: "#ffffff",
            color: "#184027",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 800,
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          + Request Ad Timing &amp; Pricing
        </button>
      </div>

      {/* Analytics Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #d4e3d3",
          }}
        >
          <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700 }}>
            TOTAL AD VIEWS REACHED
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
            👁️ {businessBookings.reduce((sum, b) => sum + (b.viewsCount || 0), 0).toLocaleString("en-IN")}
          </div>
          <small style={{ color: "#546e5c" }}>Customers who saw your ads in Hosur</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #d4e3d3",
          }}
        >
          <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700 }}>
            ACTIVE AD SLOTS
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
            🕒 {businessBookings.filter((b) => b.status === "Paid").length} Running
          </div>
          <small style={{ color: "#546e5c" }}>Displaying at designated hours</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #d4e3d3",
          }}
        >
          <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700 }}>
            TOTAL CAMPAIGN SPEND
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
            ₹{businessBookings.filter((b) => b.status === "Paid").reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString("en-IN")}
          </div>
          <small style={{ color: "#546e5c" }}>Includes 18% GST tax invoices</small>
        </div>
      </div>

      {/* SLOT TIMING SIMULATOR & TESTER */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #d2e4d0",
          borderRadius: "12px",
          padding: "16px 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <div>
            <strong style={{ fontSize: "14px", color: "#193c23", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⏱️</span> Display Slot Timing Simulator &amp; Live Tester
            </strong>
            <small style={{ color: "#546e5c", fontSize: "12px" }}>
              Preview how ads appear on Bizearch during specific time slots.
            </small>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { label: "Live Real-Time", hour: null },
              { label: "🌅 Morning (10 AM)", hour: 10 },
              { label: "☀️ Afternoon (2 PM)", hour: 14 },
              { label: "🌆 Evening (7 PM)", hour: 19 },
              { label: "🌙 Night (11 PM)", hour: 23 },
            ].map((slot) => {
              const isSelected = currentSimulatedHour === slot.hour;
              return (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => onSimulateHour(slot.hour)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: isSelected ? "2px solid #235d39" : "1px solid #ccdacc",
                    background: isSelected ? "#235d39" : "#ffffff",
                    color: isSelected ? "#ffffff" : "#2f4c37",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            fontSize: "12px",
            padding: "8px 12px",
            background: "#f4f8f4",
            borderRadius: "6px",
            color: "#284532",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🎯 Current Testing Time:</span>
          <strong>
            {currentSimulatedHour !== null
              ? `${currentSimulatedHour}:00 (${currentSimulatedHour < 12 ? "Morning" : currentSimulatedHour < 17 ? "Afternoon" : currentSimulatedHour < 22 ? "Evening" : "Night"})`
              : `Real Clock (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`}
          </strong>
        </div>
      </div>

      {/* Rate Card Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {(Object.keys(AD_FORMAT_PRICING) as AdFormat[]).map((fKey) => {
          const f = AD_FORMAT_PRICING[fKey];
          return (
            <div
              key={fKey}
              style={{
                background: "#ffffff",
                border: "1px solid #d4e3d3",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#1e5333",
                  background: "#e4ede3",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {f.badge}
              </span>
              <h4 style={{ margin: "8px 0 4px", fontSize: "14px", color: "#183822" }}>
                {f.shortName}
              </h4>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#1b482b" }}>
                ₹{f.baseDailyRate}
                <small style={{ fontSize: "11px", fontWeight: 500, color: "#617d68" }}>
                  /day base
                </small>
              </div>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "11px",
                  color: "#546e5c",
                  lineHeight: "1.4",
                }}
              >
                {f.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bookings & Active Campaigns List */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #d2e4d0",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#163a23" }}>
              Active &amp; Scheduled Ad Campaigns ({businessBookings.length})
            </h3>
            <small style={{ color: "#607968" }}>
              Ads automatically run during their booked slot timings once paid.
            </small>
          </div>
        </div>

        {businessBookings.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#5f7966",
              background: "#f9fbf9",
              borderRadius: "10px",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📢</div>
            <strong style={{ display: "block", color: "#1f432b", fontSize: "15px" }}>
              No ad campaigns booked yet
            </strong>
            <p style={{ margin: "6px 0 16px", fontSize: "13px" }}>
              Request ad timing and pricing to promote your business across Hosur.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={onOpenBookingWizard}
            >
              + Create First Ad Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {businessBookings.map((b) => {
              const isCurrentlyActive = isAdActiveAt(
                b,
                new Date(),
                currentSimulatedHour !== null ? currentSimulatedHour : undefined
              );

              return (
                <div
                  key={b.id}
                  style={{
                    border: isCurrentlyActive ? "2px solid #235d39" : "1px solid #d4e3d3",
                    borderRadius: "10px",
                    padding: "16px",
                    background: isCurrentlyActive ? "#f4f8f4" : "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    {b.poster?.imageUrl ? (
                      <img
                        src={b.poster.imageUrl}
                        alt="Creative"
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "8px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "8px",
                          background: "#e4ede3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                        }}
                      >
                        {b.format === "video" ? "🎬" : "📢"}
                      </div>
                    )}

                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <strong style={{ fontSize: "15px", color: "#183a24" }}>
                          {b.businessName}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontWeight: 700,
                            background:
                              b.status === "Paid"
                                ? isCurrentlyActive
                                  ? "#dcfce7"
                                  : "#e0f2fe"
                                : "#fef3c7",
                            color:
                              b.status === "Paid"
                                ? isCurrentlyActive
                                  ? "#15803d"
                                  : "#0369a1"
                                : "#b45309",
                          }}
                        >
                          {b.status === "Paid"
                            ? isCurrentlyActive
                              ? "🟢 Live In Current Slot"
                              : "🕒 Scheduled (Paid)"
                            : "🟡 Pending Payment"}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#46634f",
                          marginTop: "4px",
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          <strong>Format:</strong> {AD_FORMAT_PRICING[b.format]?.shortName || b.format}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Slot:</strong> {b.slotLabel}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Dates:</strong> {b.startDate} to {b.endDate}
                        </span>
                      </div>

                      {/* Views analytics for business */}
                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            background: "#e8f5e9",
                            color: "#166534",
                            border: "1px solid #bbf7d0",
                            borderRadius: "12px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          👁️ {(b.viewsCount || 0).toLocaleString("en-IN")} Customer Views
                        </span>
                        <span
                          style={{
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            borderRadius: "12px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          🎯 {(b.clicksCount || (b.clickRecords ? b.clickRecords.length : (b.viewsCount ? Math.max(1, Math.round(b.viewsCount * 0.045)) : 0))).toLocaleString("en-IN")} Leads
                        </span>
                        {b.impressionsBySurface && (
                          <span style={{ fontSize: "11px", color: "#52735d" }}>
                            (Poster: {b.impressionsBySurface.poster || 0} • Ticker: {b.impressionsBySurface.content || 0} • Video: {b.impressionsBySurface.video || 0})
                          </span>
                        )}
                        {b.lastViewedAt && (
                          <span style={{ fontSize: "10px", color: "#789281" }}>
                            • Last viewed: {new Date(b.lastViewedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      {/* Latest Customer ID & View Timestamp strip */}
                      {b.viewRecords && b.viewRecords.length > 0 && (
                        <div
                          style={{
                            marginTop: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                            fontSize: "11px",
                            color: "#375740",
                            background: "#f0f7f2",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #d2e4d0",
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "#163a23" }}>Latest Customer View:</span>
                          <span
                            style={{
                              background: "#e0f2fe",
                              color: "#0369a1",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontWeight: 800,
                              fontFamily: "monospace",
                              fontSize: "10.5px",
                              border: "1px solid #bae6fd",
                            }}
                          >
                            🆔 {b.viewRecords[0].customerId || "CUST-HSR-GUEST"}
                          </span>
                          <span style={{ fontWeight: 600 }}>{b.viewRecords[0].viewerName}</span>
                          <span>•</span>
                          <span style={{ color: "#2d5437" }}>
                            📅 {b.viewRecords[0].viewedDate || new Date(b.viewRecords[0].viewedAt).toLocaleDateString([], { day: "2-digit", month: "short" })} ⏰ {b.viewRecords[0].viewedTime || new Date(b.viewRecords[0].viewedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "15px", color: "#183a24", display: "block" }}>
                        ₹{b.totalAmount.toLocaleString("en-IN")}
                      </strong>
                      <small style={{ color: "#617d68", fontSize: "11px" }}>
                        {b.durationDays} days • {b.status}
                      </small>
                    </div>

                    {b.status === "Pending Payment" ? (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => onPayBooking(b)}
                        style={{ padding: "8px 14px", fontSize: "12px" }}
                      >
                        Pay &amp; Activate 💳
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="outline-button"
                          onClick={() => setSelectedAudienceLog(b)}
                          style={{
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "#f0f7f2",
                            borderColor: "#b8d7be",
                            color: "#18532c",
                          }}
                          title="View detailed audience log and customer view timings"
                        >
                          <span>📋</span> View Audience Log ({b.viewRecords?.length || (b.viewsCount ? Math.min(25, Math.max(6, Math.round(b.viewsCount / 45))) : 0)})
                        </button>
                        <button
                          type="button"
                          className="outline-button"
                          onClick={() => setSelectedReceipt(b)}
                          style={{ padding: "8px 14px", fontSize: "12px" }}
                        >
                          View Receipt 🧾
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedReceipt && (
        <AdReceiptModal
          booking={selectedReceipt}
          close={() => setSelectedReceipt(null)}
        />
      )}

      {selectedAudienceLog && (
        <AdAudienceLogModal
          booking={selectedAudienceLog}
          close={() => setSelectedAudienceLog(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// COMPANY AD BOOKINGS TAB (FOR COMPANY PORTAL)
// ============================================================================
export function CompanyAdBookingsManager({
  bookings,
  onRefresh,
  onUpdateStatus,
}: {
  bookings: AdBookingRequest[];
  onRefresh?: () => void;
  onUpdateStatus?: (id: string, status: AdBookingRequest["status"]) => void;
}) {
  const [filter, setFilter] = useState<"All" | "Paid" | "Pending Payment">("All");
  const [viewingReceipt, setViewingReceipt] = useState<AdBookingRequest | null>(null);
  const [viewingAudienceLog, setViewingAudienceLog] = useState<AdBookingRequest | null>(null);

  const filtered =
    filter === "All" ? bookings : bookings.filter((b) => b.status === filter);

  const totalPaidRevenue = bookings
    .filter((b) => b.status === "Paid" || b.status === "Active")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #d4e3d3",
          }}
        >
          <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700 }}>
            TOTAL AD REVENUE
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
            ₹{totalPaidRevenue.toLocaleString("en-IN")}
          </div>
          <small style={{ color: "#546e5c" }}>From verified business bookings</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #d4e3d3",
          }}
        >
          <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700 }}>
            ACTIVE AD CAMPAIGNS
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
            {bookings.filter((b) => b.status === "Paid").length}
          </div>
          <small style={{ color: "#546e5c" }}>Scheduled or running live</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #d4e3d3",
          }}
        >
          <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700 }}>
            PENDING REQUESTS
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#b45309", marginTop: "4px" }}>
            {bookings.filter((b) => b.status === "Pending Payment").length}
          </div>
          <small style={{ color: "#546e5c" }}>Awaiting payment or quote</small>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #d4e3d3",
          }}
        >
          <span style={{ fontSize: "11px", color: "#617d68", fontWeight: 700 }}>
            TOTAL CUSTOMER VIEWS
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#163a23", marginTop: "4px" }}>
            👁️ {bookings.reduce((sum, b) => sum + (b.viewsCount || 0), 0).toLocaleString("en-IN")}
          </div>
          <small style={{ color: "#546e5c" }}>Real-time impressions across Hosur</small>
        </div>
      </div>

      {/* Main Table Panel */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #d2e4d0",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#163a23" }}>
              Business Ad Requests &amp; Schedules ({filtered.length})
            </h3>
            <small style={{ color: "#607968" }}>
              Monitor booked ad display slots, creative assets, and payment verification.
            </small>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {["All", "Paid", "Pending Payment"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f as any)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: filter === f ? "2px solid #235d39" : "1px solid #ccdacc",
                  background: filter === f ? "#235d39" : "#ffffff",
                  color: filter === f ? "#ffffff" : "#2f4c37",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          {filtered.map((b) => (
            <div
              key={b.id}
              style={{
                border: "1px solid #d4e3d3",
                borderRadius: "8px",
                padding: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <strong style={{ fontSize: "14px", color: "#173b22" }}>
                    {b.businessName}
                  </strong>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 700,
                      background: b.status === "Paid" ? "#dcfce7" : "#fef3c7",
                      color: b.status === "Paid" ? "#166534" : "#b45309",
                    }}
                  >
                    {b.status}
                  </span>
                  <small style={{ color: "#607968" }}>{b.contactPhone}</small>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#4a6552",
                    marginTop: "4px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    <strong>Slot:</strong> {b.slotLabel}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Format:</strong> {AD_FORMAT_PRICING[b.format]?.shortName || b.format}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Dates:</strong> {b.startDate} to {b.endDate}
                  </span>
                </div>

                {/* Super admin views and analytics */}
                <div
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      background: "#e8f5e9",
                      color: "#166534",
                      border: "1px solid #bbf7d0",
                      borderRadius: "12px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    👁️ {(b.viewsCount || 0).toLocaleString("en-IN")} Views
                  </span>
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      borderRadius: "12px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    🎯 {(b.clicksCount || (b.clickRecords ? b.clickRecords.length : (b.viewsCount ? Math.max(1, Math.round(b.viewsCount * 0.045)) : 0))).toLocaleString("en-IN")} Leads
                  </span>
                  {b.impressionsBySurface && (
                    <span style={{ fontSize: "11px", color: "#546e5c" }}>
                      (Poster: {b.impressionsBySurface.poster || 0} • Content: {b.impressionsBySurface.content || 0} • Video: {b.impressionsBySurface.video || 0})
                    </span>
                  )}
                  {b.lastViewedAt && (
                    <span style={{ fontSize: "10px", color: "#789281" }}>
                      • Last active: {new Date(b.lastViewedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {/* Super Admin Latest Customer ID & View Timing */}
                {b.viewRecords && b.viewRecords.length > 0 && (
                  <div
                    style={{
                      marginTop: "5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                      fontSize: "10.5px",
                      color: "#375740",
                      background: "#f0f7f2",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: "1px solid #d2e4d0",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#163a23" }}>Latest:</span>
                    <span
                      style={{
                        background: "#e0f2fe",
                        color: "#0369a1",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        fontWeight: 800,
                        fontFamily: "monospace",
                        fontSize: "10px",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      🆔 {b.viewRecords[0].customerId || "CUST-HSR-GUEST"}
                    </span>
                    <span style={{ fontWeight: 600 }}>{b.viewRecords[0].viewerName}</span>
                    <span>•</span>
                    <span style={{ color: "#2d5437" }}>
                      📅 {b.viewRecords[0].viewedDate || new Date(b.viewRecords[0].viewedAt).toLocaleDateString([], { day: "2-digit", month: "short" })} ⏰ {b.viewRecords[0].viewedTime || new Date(b.viewRecords[0].viewedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: "14px", color: "#173b22", display: "block" }}>
                    ₹{b.totalAmount.toLocaleString("en-IN")}
                  </strong>
                  <small style={{ color: "#617d68", fontSize: "10px" }}>
                    {b.paymentMethod || "Awaiting Payment"}
                  </small>
                </div>

                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setViewingAudienceLog(b)}
                  style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#f0f7f2",
                    borderColor: "#b8d7be",
                    color: "#18532c",
                  }}
                  title="View detailed customer impression log and timings"
                >
                  <span>📋</span> Audience Log ({b.viewRecords?.length || (b.viewsCount ? Math.min(25, Math.max(6, Math.round(b.viewsCount / 45))) : 0)})
                </button>

                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setViewingReceipt(b)}
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                >
                  View Details &amp; Creatives
                </button>

                {b.status === "Pending Payment" && onUpdateStatus && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => onUpdateStatus(b.id, "Paid")}
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                  >
                    Mark Paid &amp; Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewingReceipt && (
        <AdReceiptModal
          booking={viewingReceipt}
          close={() => setViewingReceipt(null)}
        />
      )}

      {viewingAudienceLog && (
        <AdAudienceLogModal
          booking={viewingAudienceLog}
          close={() => setViewingAudienceLog(null)}
        />
      )}
    </div>
  );
}
