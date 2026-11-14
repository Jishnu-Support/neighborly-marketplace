"use client";

import React, { useState, useEffect, useRef } from "react";
import type { UsedProduct } from "@/app/lib/used-products";

export const USED_PRODUCT_CATEGORIES = [
  "All",
  "Mobiles & Tablets",
  "Vehicles & Two-Wheelers",
  "Electronics & Appliances",
  "Furniture & Home",
  "Fashion & Clothing",
  "Books & Education",
  "Sports & Fitness",
  "Other",
] as const;

export const USED_PRODUCT_CONDITIONS = [
  "Like New (Flawless)",
  "Good Condition (Gently Used)",
  "Fair Condition (Functional)",
  "Brand New (Unopened)",
] as const;

/**
 * Modal that asks the user whether they want to BUY or SELL used products.
 */
export function UsedProductChoiceModal({
  isOpen,
  onClose,
  onSelectBuy,
  onSelectSell,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuy: () => void;
  onSelectSell: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="order-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "480px",
          padding: "24px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.25)",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            fontSize: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
              fontSize: "28px",
              marginBottom: "10px",
              border: "1px solid #a7f3d0",
            }}
          >
            🏷️
          </div>
          <h2 style={{ fontSize: "21px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
            Used Product Sales
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            Neighborhood pre-owned goods marketplace. Buy verified pre-owned items or sell your own for free!
          </p>
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          {/* Option 1: Buy */}
          <button
            type="button"
            onClick={() => {
              onSelectBuy();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px 18px",
              borderRadius: "14px",
              background: "#f8fafc",
              border: "2px solid #e2e8f0",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#16a34a";
              e.currentTarget.style.background = "#f0fdf4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#f8fafc";
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
              }}
            >
              🛒
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#166534", marginBottom: "3px" }}>
                Buy Used Products
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", lineHeight: 1.35 }}>
                Browse pre-owned mobiles, bikes, electronics, furniture &amp; deals in your locality.
              </div>
            </div>
            <span style={{ fontSize: "18px", color: "#16a34a", fontWeight: 700 }}>→</span>
          </button>

          {/* Option 2: Sell */}
          <button
            type="button"
            onClick={() => {
              onSelectSell();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "16px 18px",
              borderRadius: "14px",
              background: "#f8fafc",
              border: "2px solid #e2e8f0",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#2563eb";
              e.currentTarget.style.background = "#eff6ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#f8fafc";
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
              }}
            >
              🏷️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e40af", marginBottom: "3px" }}>
                Sell a Used Product
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748b", lineHeight: 1.35 }}>
                Anyone can post items for sale. Direct calls &amp; WhatsApp from local buyers with 0% commission.
              </div>
            </div>
            <span style={{ fontSize: "18px", color: "#2563eb", fontWeight: 700 }}>+</span>
          </button>
        </div>

        <div style={{ marginTop: "18px", textAlign: "center" }}>
          <small style={{ fontSize: "11px", color: "#94a3b8" }}>
            Free for all community members • 100% direct buyer-to-seller contact
          </small>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Used Products Marketplace Modal (supports Buy & Sell modes).
 */
export function UsedProductsMarketplaceModal({
  isOpen,
  initialMode = "buy",
  onClose,
  currentLocality = "Hosur",
  userName = "",
  userPhone = "",
  showNotice,
}: {
  isOpen: boolean;
  initialMode?: "buy" | "sell";
  onClose: () => void;
  currentLocality?: string;
  userName?: string;
  userPhone?: string;
  showNotice?: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"buy" | "sell">(initialMode);
  const [products, setProducts] = useState<UsedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<UsedProduct | null>(null);

  // Form state for Sell mode
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Mobiles & Tablets");
  const [formPrice, setFormPrice] = useState("");
  const [formNegotiable, setFormNegotiable] = useState(true);
  const [formCondition, setFormCondition] = useState<string>("Good Condition (Gently Used)");
  const [formLocation, setFormLocation] = useState(currentLocality || "Hosur");
  const [formDescription, setFormDescription] = useState("");
  const [formSellerName, setFormSellerName] = useState(userName || "");
  const [formSellerPhone, setFormSellerPhone] = useState(userPhone || "");
  const [formSellerWhatsapp, setFormSellerWhatsapp] = useState(userPhone || "");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/used-products", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/businesses/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to upload photo.");
      }

      const result = await res.json();
      if (result.url) {
        setFormImages((prev) => [...prev, result.url]);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error uploading image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setFormImages((prev) => [...prev, url]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Please enter product title.");
      return;
    }
    const numPrice = Number(formPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError("Please enter a valid price in ₹.");
      return;
    }
    if (!formSellerPhone.trim()) {
      setFormError("Please provide your contact phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        price: numPrice,
        negotiable: formNegotiable,
        condition: formCondition,
        location: formLocation.trim() || currentLocality || "Local Area",
        description: formDescription.trim(),
        sellerName: formSellerName.trim() || "Local Seller",
        sellerPhone: formSellerPhone.trim(),
        sellerWhatsapp: formSellerWhatsapp.trim() || formSellerPhone.trim(),
        images: formImages,
      };

      const res = await fetch("/api/used-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Could not post used product.");
      }

      if (showNotice) {
        showNotice("✓ Your used product has been posted! Buyers can now call or WhatsApp you directly.");
      }

      // Reset form
      setFormTitle("");
      setFormPrice("");
      setFormDescription("");
      setFormImages([]);
      setImageUrlInput("");

      // Refresh listings and switch to Buy mode
      await loadProducts();
      setMode("buy");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to post product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat) return false;
    }
    return true;
  });

  return (
    <div
      className="order-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(5px)",
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#dcfce7",
                fontSize: "20px",
              }}
            >
              🏷️
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Used Product Sales
                </h2>
                <span
                  style={{
                    background: "#ecfdf5",
                    color: "#166534",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "6px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  Pre-Owned Marketplace
                </span>
              </div>
              <small style={{ color: "#64748b", fontSize: "11.5px" }}>
                Buy pre-owned items or sell your own directly to neighbors
              </small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Mode Switcher */}
            <div
              style={{
                display: "flex",
                background: "#e2e8f0",
                padding: "3px",
                borderRadius: "10px",
                gap: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => setMode("buy")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: mode === "buy" ? "#ffffff" : "transparent",
                  color: mode === "buy" ? "#166534" : "#64748b",
                  boxShadow: mode === "buy" ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                🛒 Buy ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setMode("sell")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: mode === "sell" ? "#2563eb" : "transparent",
                  color: mode === "sell" ? "#ffffff" : "#64748b",
                  boxShadow: mode === "sell" ? "0 2px 4px rgba(37,99,235,0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                🏷️ Sell Product (+)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#e2e8f0",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {mode === "buy" ? (
            <div>
              {/* Search & Category Filter Bar */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                <div style={{ flex: "1 1 260px", position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search used mobiles, bikes, furniture, laptops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 36px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "14px",
                      color: "#94a3b8",
                    }}
                  >
                    🔍
                  </span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        fontSize: "14px",
                        cursor: "pointer",
                        color: "#94a3b8",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMode("sell")}
                  style={{
                    padding: "9px 16px",
                    background: "#166534",
                    color: "#ffffff",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>+</span> Post Used Product
                </button>
              </div>

              {/* Category Pills */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  overflowX: "auto",
                  paddingBottom: "10px",
                  marginBottom: "16px",
                  scrollbarWidth: "none",
                }}
              >
                {USED_PRODUCT_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        border: active ? "1.5px solid #166534" : "1px solid #e2e8f0",
                        background: active ? "#ecfdf5" : "#f8fafc",
                        color: active ? "#166534" : "#475569",
                        fontWeight: active ? 700 : 500,
                        fontSize: "12px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Products List */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <p>Loading available used products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    background: "#f8fafc",
                    borderRadius: "16px",
                    border: "1.5px dashed #cbd5e1",
                  }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏷️</div>
                  <h3 style={{ fontSize: "17px", color: "#0f172a", margin: "0 0 6px" }}>
                    No used products listed yet {selectedCategory !== "All" ? `in "${selectedCategory}"` : ""}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "420px", margin: "0 auto 16px" }}>
                    Be the first person to post a pre-owned item for sale! Anyone can sell their mobile, bike, furniture, or gadgets for free.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode("sell")}
                    style={{
                      padding: "10px 20px",
                      background: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    + Sell a Used Product Now
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {filteredProducts.map((item) => (
                    <UsedProductCard
                      key={item.id}
                      item={item}
                      onSelect={() => setSelectedProduct(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Sell Mode Form */
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              <div style={{ marginBottom: "18px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                  List Your Used Product for Sale
                </h3>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                  Anyone can post! Provide accurate details and photos to connect with verified local buyers directly via Call &amp; WhatsApp.
                </p>
              </div>

              {formError && (
                <div
                  style={{
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    marginBottom: "14px",
                    border: "1px solid #fecaca",
                  }}
                >
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleSellSubmit} style={{ display: "grid", gap: "14px" }}>
                {/* Title */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samsung Galaxy S21 5G 128GB or Royal Enfield Classic 350"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                    }}
                  />
                </div>

                {/* Category & Condition */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#fff",
                      }}
                    >
                      {USED_PRODUCT_CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Condition *
                    </label>
                    <select
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        background: "#fff",
                      }}
                    >
                      {USED_PRODUCT_CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & Negotiable */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px", alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 4500"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div style={{ paddingTop: "18px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#334155", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formNegotiable}
                        onChange={(e) => setFormNegotiable(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#166534" }}
                      />
                      <span>Price is Negotiable</span>
                    </label>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Location / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bagalur Road, Hosur or Mathigiri"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Description &amp; Specifications
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe item condition, age, usage, accessories included (box, charger, bills), and reasons for selling..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Product Images */}
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Product Images (Upload or URL)
                  </label>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageFileUpload}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "8px 14px",
                        background: "#0f172a",
                        color: "#ffffff",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {uploadingImage ? "Uploading..." : "📷 Upload Photo"}
                    </button>

                    <div style={{ display: "flex", gap: "6px", flex: 1, minWidth: "200px" }}>
                      <input
                        type="url"
                        placeholder="Or paste image URL"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        style={{
                          padding: "7px 12px",
                          background: "#e2e8f0",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Image Thumbnails */}
                  {formImages.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                      {formImages.map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "72px",
                            height: "72px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          <img
                            src={img}
                            alt="Upload preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: "18px",
                              height: "18px",
                              fontSize: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seller Contact Details */}
                <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#166534", marginBottom: "8px" }}>
                    📞 Seller Contact Information (Buyers will contact you directly)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#166534", marginBottom: "3px" }}>
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh K."
                        value={formSellerName}
                        onChange={(e) => setFormSellerName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "7px",
                          border: "1px solid #86efac",
                          fontSize: "12.5px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#166534", marginBottom: "3px" }}>
                        Phone Number (for Call) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9842012345"
                        value={formSellerPhone}
                        onChange={(e) => {
                          setFormSellerPhone(e.target.value);
                          if (!formSellerWhatsapp) setFormSellerWhatsapp(e.target.value);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "7px",
                          border: "1px solid #86efac",
                          fontSize: "12.5px",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#166534", marginBottom: "3px" }}>
                      WhatsApp Number (optional, defaults to Phone)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9842012345"
                      value={formSellerWhatsapp}
                      onChange={(e) => setFormSellerWhatsapp(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1px solid #86efac",
                        fontSize: "12.5px",
                      }}
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "12px 18px",
                      background: "#166534",
                      color: "#ffffff",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "14px",
                      cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(22, 101, 52, 0.25)",
                    }}
                  >
                    {submitting ? "Publishing Listing..." : "✓ Publish Used Product Listing"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("buy")}
                    style={{
                      padding: "12px 18px",
                      background: "#f1f5f9",
                      color: "#475569",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <UsedProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          showNotice={showNotice}
        />
      )}
    </div>
  );
}

/**
 * Single Card for Used Product Listing in the Grid.
 */
function UsedProductCard({
  item,
  onSelect,
}: {
  item: UsedProduct;
  onSelect: () => void;
}) {
  const cleanPhone = (item.sellerPhone || "").replace(/\D/g, "");
  const whatsappNumber = (item.sellerWhatsapp || item.sellerPhone || "").replace(/\D/g, "");
  const defaultImage = item.images && item.images.length > 0 ? item.images[0] : null;

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cleanPhone) {
      window.location.href = `tel:+91${cleanPhone.slice(-10)}`;
    }
  };

  const handleWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (whatsappNumber) {
      const msg = encodeURIComponent(
        `Hi ${item.sellerName}, I am interested in your used item "${item.title}" (₹${item.price.toLocaleString("en-IN")}) listed on Bizearch.in.`
      );
      window.open(`https://wa.me/91${whatsappNumber.slice(-10)}?text=${msg}`, "_blank");
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        border: "1.5px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(0,0,0,0.12)";
        e.currentTarget.style.borderColor = "#86efac";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      {/* Product Image */}
      <div
        style={{
          height: "170px",
          background: "#f1f5f9",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {defaultImage ? (
          <img
            src={defaultImage}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ textAlign: "center", color: "#94a3b8" }}>
            <span style={{ fontSize: "36px", display: "block", marginBottom: "4px" }}>🏷️</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Pre-Owned Item</span>
          </div>
        )}

        {/* Condition tag */}
        <span
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          {item.condition}
        </span>

        {/* Category tag */}
        <span
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            background: "rgba(255, 255, 255, 0.9)",
            color: "#0f172a",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "5px",
          }}
        >
          {item.category}
        </span>
      </div>

      {/* Card Content */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Price & Negotiable */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ fontSize: "19px", fontWeight: 800, color: "#166534" }}>
            ₹{item.price.toLocaleString("en-IN")}
          </div>
          {item.negotiable && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#2563eb",
                background: "#eff6ff",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #bfdbfe",
              }}
            >
              Negotiable
            </span>
          )}
        </div>

        {/* Title */}
        <h4
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 4px",
            lineHeight: 1.3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.title}
        </h4>

        {/* Location & Seller */}
        <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>
          📍 {item.location} • 👤 {item.sellerName}
        </div>

        {/* Action Buttons: Call & WhatsApp */}
        <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            type="button"
            onClick={handleCall}
            style={{
              padding: "7px 10px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            📞 Call
          </button>
          <button
            type="button"
            onClick={handleWhatsapp}
            style={{
              padding: "7px 10px",
              background: "#22c55e",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            💬 WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Detailed Modal for viewing a single used product.
 */
export function UsedProductDetailModal({
  product,
  onClose,
  showNotice,
}: {
  product: UsedProduct;
  onClose: () => void;
  showNotice?: (msg: string) => void;
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const cleanPhone = (product.sellerPhone || "").replace(/\D/g, "");
  const whatsappNumber = (product.sellerWhatsapp || product.sellerPhone || "").replace(/\D/g, "");

  const handleCall = () => {
    if (cleanPhone) {
      window.location.href = `tel:+91${cleanPhone.slice(-10)}`;
    }
  };

  const handleWhatsapp = () => {
    if (whatsappNumber) {
      const msg = encodeURIComponent(
        `Hi ${product.sellerName}, I am interested in your used item "${product.title}" (₹${product.price.toLocaleString("en-IN")}) listed on Bizearch.in.`
      );
      window.open(`https://wa.me/91${whatsappNumber.slice(-10)}?text=${msg}`, "_blank");
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      if (showNotice) showNotice("✓ Link copied to clipboard!");
    }
  };

  return (
    <div
      className="order-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🏷️</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Used Product Details</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Main Image */}
          <div
            style={{
              height: "260px",
              background: "#f8fafc",
              borderRadius: "14px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: "1px solid #e2e8f0",
              marginBottom: "12px",
            }}
          >
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "#94a3b8" }}>
                <span style={{ fontSize: "48px", display: "block" }}>🏷️</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>No Photo Uploaded</span>
              </div>
            )}
          </div>

          {/* Multiple Image Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "14px" }}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: activeImageIndex === idx ? "2px solid #166534" : "1px solid #cbd5e1",
                    padding: 0,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <img src={img} alt="Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}

          {/* Price & Title */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#166534" }}>
              ₹{product.price.toLocaleString("en-IN")}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {product.negotiable && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#2563eb",
                    background: "#eff6ff",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  Negotiable
                </span>
              )}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#166534",
                  background: "#dcfce7",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  border: "1px solid #86efac",
                }}
              >
                {product.condition}
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
            {product.title}
          </h3>

          <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
            <span>📁 {product.category}</span>
            <span>📍 {product.location}</span>
          </div>

          {/* Description */}
          <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
            <h5 style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", margin: "0 0 4px", textTransform: "uppercase" }}>
              Product Details &amp; Specifications
            </h5>
            <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: 1.5, whiteSpace: "pre-line" }}>
              {product.description || "No additional description provided by seller."}
            </p>
          </div>

          {/* Seller Card */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1.5px solid #86efac",
              borderRadius: "12px",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                SELLER INFORMATION
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#065f46" }}>
                👤 {product.sellerName}
              </div>
              <div style={{ fontSize: "12px", color: "#047857" }}>
                📞 {product.sellerPhone}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleCall}
                style={{
                  padding: "9px 14px",
                  background: "#ffffff",
                  color: "#166534",
                  border: "1.5px solid #166534",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📞 Call
              </button>
              <button
                type="button"
                onClick={handleWhatsapp}
                style={{
                  padding: "9px 14px",
                  background: "#22c55e",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Embedded Used Products Panel for AccountPortal tabs.
 */
export function UsedProductsPanel({
  onOpenSell,
  showNotice,
}: {
  onOpenSell?: () => void;
  showNotice?: (msg: string) => void;
}) {
  const [products, setProducts] = useState<UsedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<UsedProduct | null>(null);

  useEffect(() => {
    fetch("/api/used-products", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (selectedCategory !== "All" && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <section className="panel tab-panel">
      <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div className="eyebrow">PRE-OWNED MARKETPLACE</div>
          <h2>Used Product Sales</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Buy pre-owned goods or list your used items for free. Direct Call &amp; WhatsApp reach.
          </p>
        </div>
        {onOpenSell && (
          <button
            type="button"
            className="primary-button"
            onClick={onOpenSell}
            style={{ fontSize: "12.5px", padding: "8px 14px" }}
          >
            + Sell a Used Product
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px", margin: "14px 0" }}>
        {USED_PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "4px 10px",
              borderRadius: "16px",
              border: selectedCategory === cat ? "1.5px solid #166534" : "1px solid #cbd5e1",
              background: selectedCategory === cat ? "#ecfdf5" : "#f8fafc",
              color: selectedCategory === cat ? "#166534" : "#475569",
              fontSize: "11.5px",
              fontWeight: selectedCategory === cat ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "13px" }}>Loading used products...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏷️</div>
          <h4 style={{ margin: "0 0 4px", fontSize: "15px" }}>No used products listed yet</h4>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b" }}>
            Be the first to list a pre-owned item for sale in your neighborhood.
          </p>
          {onOpenSell && (
            <button
              type="button"
              className="primary-button"
              onClick={onOpenSell}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              + Sell a Used Product
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {filtered.map((item) => (
            <UsedProductCard key={item.id} item={item} onSelect={() => setSelectedProduct(item)} />
          ))}
        </div>
      )}

      {selectedProduct && (
        <UsedProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          showNotice={showNotice}
        />
      )}
    </section>
  );
}
