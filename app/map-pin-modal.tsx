"use client";

import React, { useState, useEffect, useRef } from "react";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

interface MapPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coordinates: Coordinates) => void;
  initialCoordinates?: Coordinates | null;
  title?: string;
  businessName?: string;
}

const POPULAR_LOCALITIES = [
  { name: "Bagalur Road", lat: 12.7412, lng: 77.8322 },
  { name: "Hosur Bus Stand", lat: 12.7335, lng: 77.8285 },
  { name: "Railway Station", lat: 12.7310, lng: 77.8305 },
  { name: "SIPCOT Phase I", lat: 12.7565, lng: 77.8012 },
  { name: "SIPCOT Phase II", lat: 12.7095, lng: 77.8050 },
  { name: "Avalapalli HUDCO", lat: 12.7480, lng: 77.8390 },
  { name: "Mathigiri", lat: 12.7150, lng: 77.8520 },
  { name: "Rayakottai Road", lat: 12.7295, lng: 77.8350 },
];

export function MapPinModal({
  isOpen,
  onClose,
  onConfirm,
  initialCoordinates,
  title = "Pin Location on Map",
  businessName,
}: MapPinModalProps) {
  const defaultLat = initialCoordinates?.latitude && Number.isFinite(initialCoordinates.latitude)
    ? initialCoordinates.latitude
    : 12.746459;
  const defaultLng = initialCoordinates?.longitude && Number.isFinite(initialCoordinates.longitude)
    ? initialCoordinates.longitude
    : 77.833395;

  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [latInput, setLatInput] = useState<string>(defaultLat.toFixed(6));
  const [lngInput, setLngInput] = useState<string>(defaultLng.toFixed(6));
  const [pasteQuery, setPasteQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [leafletReady, setLeafletReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  // Sync state when initialCoordinates change
  useEffect(() => {
    if (initialCoordinates?.latitude && initialCoordinates?.longitude) {
      setLat(initialCoordinates.latitude);
      setLng(initialCoordinates.longitude);
      setLatInput(initialCoordinates.latitude.toFixed(6));
      setLngInput(initialCoordinates.longitude.toFixed(6));
    }
  }, [initialCoordinates, isOpen]);

  // Load Leaflet dynamically when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if ((window as any).L) {
      setLeafletReady(true);
      return;
    }

    // Add Leaflet CSS
    const existingCss = document.getElementById("leaflet-css");
    if (!existingCss) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    const existingScript = document.getElementById("leaflet-js");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.crossOrigin = "";
      script.onload = () => {
        setLeafletReady(true);
      };
      script.onerror = () => {
        setStatusMessage("Leaflet map could not load. You can enter coordinates manually or use GPS.");
      };
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setLeafletReady(true));
    }
  }, [isOpen]);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!isOpen || !leafletReady || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Fix default Leaflet icon paths
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerInstanceRef.current = marker;

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          const newLat = Number(position.lat.toFixed(6));
          const newLng = Number(position.lng.toFixed(6));
          setLat(newLat);
          setLng(newLng);
          setLatInput(newLat.toFixed(6));
          setLngInput(newLng.toFixed(6));
          setStatusMessage(`Pin updated: ${newLat}, ${newLng}`);
        });

        map.on("click", (e: any) => {
          const newLat = Number(e.latlng.lat.toFixed(6));
          const newLng = Number(e.latlng.lng.toFixed(6));
          marker.setLatLng([newLat, newLng]);
          setLat(newLat);
          setLng(newLng);
          setLatInput(newLat.toFixed(6));
          setLngInput(newLng.toFixed(6));
          setStatusMessage(`Pin placed at: ${newLat}, ${newLng}`);
        });

        // Trigger resize after render
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      } catch (err) {
        console.error("Leaflet init error:", err);
      }
    } else {
      try {
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom() || 15);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([lat, lng]);
        }
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 150);
      } catch (err) {
        console.error("Leaflet update error:", err);
      }
    }

    return () => {
      // Don't destroy immediately to prevent flickering on quick re-renders
    };
  }, [isOpen, leafletReady]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {}
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    }
  }, [isOpen]);

  function updatePinLocation(newLat: number, newLng: number, zoom = 16) {
    const roundedLat = Number(newLat.toFixed(6));
    const roundedLng = Number(newLng.toFixed(6));
    setLat(roundedLat);
    setLng(roundedLng);
    setLatInput(roundedLat.toFixed(6));
    setLngInput(roundedLng.toFixed(6));

    if (mapInstanceRef.current && (window as any).L) {
      mapInstanceRef.current.setView([roundedLat, roundedLng], zoom);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([roundedLat, roundedLng]);
      }
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setStatusMessage("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setStatusMessage("Requesting GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        updatePinLocation(userLat, userLng, 17);
        setStatusMessage(`✓ GPS pinned: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}`);
      },
      (err) => {
        setLocating(false);
        setStatusMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please click on the map or type coordinates."
            : "Could not retrieve GPS location. Please select on the map."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function handleParsePaste() {
    if (!pasteQuery.trim()) return;

    // Pattern 1: Raw numbers "12.746459, 77.833395" or "12.746459 77.833395"
    const rawMatch = pasteQuery.match(/([-+]?[0-9]*\.?[0-9]+)[\s,]+([-+]?[0-9]*\.?[0-9]+)/);
    if (rawMatch) {
      const parsedLat = parseFloat(rawMatch[1]);
      const parsedLng = parseFloat(rawMatch[2]);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        updatePinLocation(parsedLat, parsedLng);
        setStatusMessage(`✓ Coordinates pinned from input: ${parsedLat}, ${parsedLng}`);
        setPasteQuery("");
        return;
      }
    }

    // Pattern 2: Google Maps URL q=lat,lng or @lat,lng
    const gmapsMatch = pasteQuery.match(/([@?&]q=|[?&]destination=|@)([-+]?[0-9]*\.?[0-9]+)[,]([-+]?[0-9]*\.?[0-9]+)/);
    if (gmapsMatch) {
      const parsedLat = parseFloat(gmapsMatch[2]);
      const parsedLng = parseFloat(gmapsMatch[3]);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        updatePinLocation(parsedLat, parsedLng);
        setStatusMessage(`✓ Google Maps location pinned: ${parsedLat}, ${parsedLng}`);
        setPasteQuery("");
        return;
      }
    }

    setStatusMessage("Could not parse coordinates from this text. Enter Lat, Lng e.g. 12.746459, 77.833395");
  }

  function handleManualCoordinateChange() {
    const parsedLat = parseFloat(latInput);
    const parsedLng = parseFloat(lngInput);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng) && parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
      updatePinLocation(parsedLat, parsedLng);
      setStatusMessage(`✓ Pinned to ${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}`);
    } else {
      setStatusMessage("Enter valid numbers: Latitude (-90 to 90) and Longitude (-180 to 180)");
    }
  }

  function handleConfirm() {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStatusMessage("Please pin a valid location on the map first.");
      return;
    }
    onConfirm({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "14px",
        backdropFilter: "blur(4px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="map-pin-modal-card"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>📍</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                {title}
              </h3>
            </div>
            {businessName && (
              <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "block" }}>
                Setting location pin for: <strong>{businessName}</strong>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              fontSize: "20px",
              color: "#64748b",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Quick Action Bar: GPS + Paste Coordinates */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: locating ? "wait" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>{locating ? "⏳" : "🎯"}</span>
              <span>{locating ? "Detecting GPS..." : "Use My Device Location"}</span>
            </button>

            <div style={{ display: "flex", flex: 1, minWidth: "220px", gap: "6px" }}>
              <input
                type="text"
                placeholder="Paste Lat, Lng or Google Maps link..."
                value={pasteQuery}
                onChange={(e) => setPasteQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleParsePaste();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                }}
              />
              <button
                type="button"
                onClick={handleParsePaste}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                Pin
              </button>
            </div>
          </div>

          {/* Quick Locality Chips */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
              Quick Landmark Localities:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {POPULAR_LOCALITIES.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    updatePinLocation(loc.lat, loc.lng);
                    setStatusMessage(`Moved to ${loc.name}`);
                  }}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  📍 {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Map Container */}
          <div
            style={{
              position: "relative",
              height: "360px",
              width: "100%",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1.5px solid #cbd5e1",
              background: "#e2e8f0",
            }}
          >
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: "100%",
                zIndex: 1,
              }}
            />

            {!leafletReady && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(248, 250, 252, 0.9)",
                  zIndex: 2,
                  gap: "8px",
                }}
              >
                <div style={{ fontSize: "24px" }}>🗺️</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                  Loading interactive map tiles...
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  You can also enter coordinates manually below.
                </div>
              </div>
            )}

            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                background: "rgba(255, 255, 255, 0.92)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#1e293b",
                zIndex: 1000,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                pointerEvents: "none",
              }}
            >
              💡 Click anywhere or drag the pin marker to reposition
            </div>
          </div>

          {/* Status / Notice */}
          {statusMessage && (
            <div
              style={{
                fontSize: "12px",
                color: statusMessage.startsWith("✓") ? "#166534" : "#b45309",
                background: statusMessage.startsWith("✓") ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${statusMessage.startsWith("✓") ? "#bbf7d0" : "#fef3c7"}`,
                padding: "6px 12px",
                borderRadius: "6px",
              }}
            >
              {statusMessage}
            </div>
          )}

          {/* Coordinate Precision Inputs */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Latitude:</span>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  onBlur={handleManualCoordinateChange}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleManualCoordinateChange(); } }}
                  style={{
                    width: "110px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#ffffff",
                  }}
                />
              </label>

              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Longitude:</span>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  onBlur={handleManualCoordinateChange}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleManualCoordinateChange(); } }}
                  style={{
                    width: "110px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0f172a",
                    background: "#ffffff",
                  }}
                />
              </label>
            </div>

            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "11.5px",
                color: "#16a34a",
                fontWeight: 600,
                textDecoration: "underline",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              Verify on Google Maps ↗
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Pinned at: <strong style={{ color: "#0f172a" }}>{lat.toFixed(6)}, {lng.toFixed(6)}</strong>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                background: "#166534",
                border: "none",
                padding: "8px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(22, 101, 52, 0.2)",
              }}
            >
              ✓ Set Pinned Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
