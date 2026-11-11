"use client";

import { useEffect, useRef } from "react";
import {
  formatYouTubeEmbedUrl,
  formatYouTubeWatchUrl,
  type RegistrationVideoConfig,
} from "@/app/lib/registration-video.shared";

interface RegistrationVideoPlayerModalProps {
  config: RegistrationVideoConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RegistrationVideoPlayerModal({
  config,
  isOpen,
  onClose,
}: RegistrationVideoPlayerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Pause video when closed
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isYouTube = config?.type === "youtube" && Boolean(config?.youtubeUrl);
  const youtubeEmbedUrl = isYouTube ? formatYouTubeEmbedUrl(config!.youtubeUrl) : null;
  const youtubeWatchUrl = isYouTube ? formatYouTubeWatchUrl(config!.youtubeUrl) : null;
  const isUploadedVideo = config?.type === "upload" && Boolean(config?.videoUrl);
  const title = config?.title || "How to Register Your Business";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-video-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(6px)",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          background: "#0f172a",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background: "linear-gradient(to right, #1e293b, #0f172a)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: "14px",
              }}
            >
              ▶
            </span>
            <div>
              <h3
                id="reg-video-title"
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                Bizearch Merchant Onboarding & Step-by-Step Guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close tutorial video"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cbd5e1",
              fontSize: "18px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#cbd5e1";
            }}
          >
            ✕
          </button>
        </div>

        {/* Video Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            backgroundColor: "#000000",
            minHeight: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isUploadedVideo ? (
            <video
              ref={videoRef}
              src={config!.videoUrl}
              controls
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxHeight: "68vh",
                display: "block",
                backgroundColor: "#000000",
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : isYouTube && youtubeEmbedUrl ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "56.25%", // 16:9 Aspect Ratio
                height: 0,
              }}
            >
              <iframe
                src={youtubeEmbedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "#94a3b8",
                maxWidth: "480px",
              }}
            >
              <div style={{ fontSize: "42px", marginBottom: "12px" }}>📹</div>
              <h4 style={{ color: "#f1f5f9", margin: "0 0 8px 0", fontSize: "16px" }}>
                Registration Guide Video
              </h4>
              <p style={{ fontSize: "13px", lineHeight: 1.5, margin: "0 0 20px 0" }}>
                The tutorial video is currently being prepared by the Bizearch administrative team.
                Follow the simple steps on the registration form to set up your business storefront!
              </p>
              {config?.youtubeUrl && (
                <a
                  href={formatYouTubeWatchUrl(config.youtubeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#dc2626",
                    color: "#ffffff",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  <span>Watch on YouTube ↗</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#0f172a",
            fontSize: "12px",
            color: "#94a3b8",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            Need personal assistance? Call Merchant Care:{" "}
            <a
              href="tel:+919566823219"
              style={{ color: "#38bdf8", textDecoration: "underline" }}
            >
              +91 95668 23219
            </a>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isYouTube && youtubeWatchUrl && (
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#ef4444",
                  textDecoration: "underline",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Open in YouTube ↗
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Continue Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
