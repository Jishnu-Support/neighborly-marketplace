"use client";

import { useState, useEffect } from "react";
import { AdFormatPricing } from "./ad-pricing.shared";
import { AD_FORMAT_PRICING } from "./ad-booking.shared";

const CACHE_KEY = "bizearch_ad_pricing_cache";

export function useAdPricing(): Record<string, AdFormatPricing> {
  const [pricing, setPricing] = useState<Record<string, AdFormatPricing>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
            return { ...AD_FORMAT_PRICING, ...parsed };
          }
        }
      } catch {}
    }
    return { ...AD_FORMAT_PRICING };
  });

  useEffect(() => {
    let mounted = true;

    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/ads/pricing", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.pricing && typeof data.pricing === "object" && mounted) {
          const merged = { ...AD_FORMAT_PRICING, ...data.pricing };
          setPricing(merged);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
          } catch {}
        }
      } catch {}
    };

    fetchPricing();

    const handleUpdate = () => {
      fetchPricing();
    };

    window.addEventListener("neighborly-ad-pricing-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("neighborly-ad-pricing-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return pricing;
}
