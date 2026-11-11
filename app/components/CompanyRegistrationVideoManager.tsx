"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  defaultRegistrationVideoConfig,
  formatYouTubeEmbedUrl,
  formatYouTubeWatchUrl,
  extractYouTubeId,
  type RegistrationVideoConfig,
} from "@/app/lib/registration-video.shared";
import { RegistrationVideoPlayerModal } from "./RegistrationVideoPlayerModal";

export function CompanyRegistrationVideoManager() {
  const [config, setConfig] = useState<RegistrationVideoConfig>(defaultRegistrationVideoConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing configuration
  useEffect(() => {
    let active = true;
    fetch("/api/company/registration-video", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load registration video configuration.");
        return res.json();
      })
      .then((data) => {
        if (active && data.config) {
          setConfig(data.config);
        }
      })
      .catch((err) => {
        if (active) {
          // Fallback to public endpoint if session check failed in dev
          fetch("/api/registration/video")
            .then((res) => res.json())
            .then((fallback) => {
              if (active && fallback.config) setConfig(fallback.config);
            })
            .catch(() => {});
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveConfig = async (override?: Partial<RegistrationVideoConfig>) => {
    setSaving(true);
    setMessage(null);
    const toSave = { ...config, ...(override || {}) };

    try {
      const res = await fetch("/api/company/registration-video", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: toSave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration.");

      setConfig(data.config);
      setMessage({ text: "✓ Registration video configuration saved successfully.", type: "success" });

      // Notify other components/tabs
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("neighborly-registration-video-updated", { detail: data.config })
        );
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      setMessage({ text: "Please select a valid video file (MP4, WebM, MOV).", type: "error" });
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setMessage({ text: "Video file exceeds the maximum 200 MB limit.", type: "error" });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await fetch("/api/company/registration-video/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload video.");

      if (data.config) {
        setConfig(data.config);
      } else if (data.url) {
        const updated: RegistrationVideoConfig = {
          ...config,
          type: "upload",
          videoUrl: data.url,
          fileName: data.fileName || file.name,
          fileSize: file.size,
          enabled: true,
        };
        setConfig(updated);
      }

      setMessage({
        text: `✓ Video '${file.name}' (${(file.size / (1024 * 1024)).toFixed(1)} MB) uploaded & activated.`,
        type: "success",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("neighborly-registration-video-updated", { detail: data.config })
        );
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Video upload failed.", type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = async () => {
    if (!window.confirm("Are you sure you want to remove the uploaded tutorial video?")) return;

    const updated: RegistrationVideoConfig = {
      ...config,
      videoUrl: "",
      fileName: "",
      fileSize: undefined,
      type: config.youtubeUrl ? "youtube" : "upload",
    };
    setConfig(updated);
    await handleSaveConfig(updated);
  };

  if (loading) {
    return (
      <div style={{ padding: "16px", color: "#64748b", fontSize: "14px" }}>
        Loading registration video configuration…
      </div>
    );
  }

  const isYouTubeActive = config.type === "youtube";
  const isUploadActive = config.type === "upload";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "14px",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#dc2626",
              marginBottom: "2px",
            }}
          >
            MERCHANT ONBOARDING TUTORIAL
          </div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
            📹 Business Registration Guidance Video (&ldquo;How to Register ?&rdquo;)
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Manage the tutorial video that plays or redirects when merchants click &ldquo;How to Register ?&rdquo; on the business registration form.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              color: "#334155",
              cursor: "pointer",
            }}
            title="Preview the pop-up video player as seen by merchants"
          >
            <span>👁 Preview Pop-up Player</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Global Enablement Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#f8fafc",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #e2e8f0",
        }}
      >
        <input
          type="checkbox"
          id="enable-reg-video"
          checked={config.enabled}
          onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
          style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#dc2626" }}
        />
        <label
          htmlFor="enable-reg-video"
          style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", cursor: "pointer", margin: 0 }}
        >
          Show &ldquo;How to Register ?&rdquo; link in red letters above Business Name on the registration form
        </label>
      </div>

      {/* Mode Selection Tabs */}
      <div style={{ marginBottom: "18px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
          Choose Video Type:
        </label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, type: "upload" }))}
            style={{
              flex: "1 1 200px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: isUploadActive ? "2px solid #2563eb" : "1px solid #cbd5e1",
              background: isUploadActive ? "#eff6ff" : "#ffffff",
              color: isUploadActive ? "#1e40af" : "#475569",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}>
              <span>📁 Upload Video File</span>
              {isUploadActive && <span style={{ fontSize: "11px", background: "#2563eb", color: "#fff", padding: "1px 6px", borderRadius: "10px" }}>ACTIVE</span>}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Plays directly inside a sleek <strong>Pop-up Video Player</strong> on Bizearch without leaving the site.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, type: "youtube" }))}
            style={{
              flex: "1 1 200px",
              padding: "12px 16px",
              borderRadius: "8px",
              border: isYouTubeActive ? "2px solid #dc2626" : "1px solid #cbd5e1",
              background: isYouTubeActive ? "#fef2f2" : "#ffffff",
              color: isYouTubeActive ? "#991b1b" : "#475569",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px" }}>
              <span>🔴 YouTube Video Link</span>
              {isYouTubeActive && <span style={{ fontSize: "11px", background: "#dc2626", color: "#fff", padding: "1px 6px", borderRadius: "10px" }}>ACTIVE</span>}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Redirects the registrant directly to your specific <strong>YouTube Video</strong>.
            </div>
          </button>
        </div>
      </div>

      {/* Mode Details Section */}
      {isUploadActive ? (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "18px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
            Direct Video File (Pop-up Player Mode)
          </h4>

          {config.videoUrl ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                    {config.fileName || "Uploaded Video File"}
                  </strong>
                  {config.fileSize && (
                    <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                      ({(config.fileSize / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  )}
                  <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "2px" }}>
                    URL: {config.videoUrl}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Change Video
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    disabled={uploading}
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Remove Video
                  </button>
                </div>
              </div>

              {/* Inline Mini-preview */}
              <div style={{ maxWidth: "480px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                <video src={config.videoUrl} controls style={{ width: "100%", maxHeight: "240px", display: "block" }} />
              </div>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b" }}>
                No video file uploaded yet. Upload an MP4 or WebM video (up to 200 MB).
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {uploading ? "Uploading Video File…" : "➕ Upload Video File"}
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/mp4,video/webm,video/quicktime"
            style={{ display: "none" }}
          />
        </div>
      ) : (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "18px",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
            YouTube Video Link (Direct Redirection Mode)
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b" }}>
            Enter your official YouTube tutorial video URL. When merchants click <strong>How to Register ?</strong>, they will be redirected to this video.
          </p>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="url"
              placeholder="e.g. https://www.youtube.com/watch?v=YOUR_VIDEO_ID or https://youtu.be/..."
              value={config.youtubeUrl}
              onChange={(e) => setConfig((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
              style={{
                flex: "1 1 320px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
              }}
            />
            {config.youtubeUrl && (
              <a
                href={formatYouTubeWatchUrl(config.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#dc2626",
                  color: "#ffffff",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <span>Test YouTube Link ↗</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, youtubeUrl: "" }))}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "12px",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Label and Title Customization */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginBottom: "18px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Button / Link Text (Shown in Red & Underlined):
          </label>
          <input
            type="text"
            value={config.buttonText}
            onChange={(e) => setConfig((prev) => ({ ...prev, buttonText: e.target.value }))}
            placeholder="How to Register ?"
            maxLength={60}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Modal Header Title:
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="How to Register Your Business"
            maxLength={80}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => handleSaveConfig()}
          disabled={saving || uploading}
          style={{
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "9px 22px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {saving ? "Saving Configuration…" : "Save Video Configuration"}
        </button>
      </div>

      {/* Pop-up Video Player Modal for live preview */}
      <RegistrationVideoPlayerModal
        config={config}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
