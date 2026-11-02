import { type AdConfig } from "./ad-config.shared";

export type AdFormat = "poster" | "content" | "video" | "combo";

export type AdSlotTiming = "morning" | "afternoon" | "evening" | "night" | "all_day" | "custom";

export interface AdTimeSlotInfo {
  id: AdSlotTiming;
  label: string;
  tagline: string;
  hours: string;
  startHour: number;
  endHour: number;
  multiplier: number;
}

export const AD_TIME_SLOTS: Record<AdSlotTiming, AdTimeSlotInfo> = {
  morning: {
    id: "morning",
    label: "Morning Peak",
    tagline: "High breakfast & morning commute footfall",
    hours: "08:00 AM – 12:00 PM",
    startHour: 8,
    endHour: 12,
    multiplier: 1.0,
  },
  afternoon: {
    id: "afternoon",
    label: "Afternoon Prime",
    tagline: "Midday shopping & business hours traffic",
    hours: "12:00 PM – 05:00 PM",
    startHour: 12,
    endHour: 17,
    multiplier: 0.9,
  },
  evening: {
    id: "evening",
    label: "Evening Rush",
    tagline: "Peak evening browsing & dinner ordering",
    hours: "05:00 PM – 10:00 PM",
    startHour: 17,
    endHour: 22,
    multiplier: 1.25,
  },
  night: {
    id: "night",
    label: "Night Owl",
    tagline: "Late night discovery & 24/7 emergency services",
    hours: "10:00 PM – 08:00 AM",
    startHour: 22,
    endHour: 8,
    multiplier: 0.75,
  },
  all_day: {
    id: "all_day",
    label: "All-Day 24/7",
    tagline: "Continuous round-the-clock priority exposure",
    hours: "24 Hours (All Day)",
    startHour: 0,
    endHour: 24,
    multiplier: 1.75,
  },
  custom: {
    id: "custom",
    label: "Custom Slot",
    tagline: "Target specific business operating hours",
    hours: "Custom Hours",
    startHour: 9,
    endHour: 18,
    multiplier: 1.1,
  },
};

export interface AdFormatPricing {
  format: AdFormat;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  baseDailyRate: number; // in INR
}

export const AD_FORMAT_PRICING: Record<AdFormat, AdFormatPricing> = {
  content: {
    format: "content",
    name: "Content Ad (Marquee Ticker)",
    shortName: "Content Ad",
    badge: "Announcement Ticker",
    description: "High-visibility scrolling message bar at the top of the platform header",
    baseDailyRate: 299,
  },
  poster: {
    format: "poster",
    name: "Poster Ad (Hero Billboard)",
    shortName: "Poster Billboard",
    badge: "Image Billboard",
    description: "Prominent photo billboard banner rotating in both mobile & desktop ad positions",
    baseDailyRate: 699,
  },
  video: {
    format: "video",
    name: "Video Ad (Spotlight Reel)",
    shortName: "Video Spotlight",
    badge: "Spotlight Video",
    description: "Local video player spotlight with headline, description, and direct call to action",
    baseDailyRate: 1299,
  },
  combo: {
    format: "combo",
    name: "Combo Pack (Poster + Content + Video)",
    shortName: "All-In-One Combo",
    badge: "Best Value Bundle",
    description: "Maximum neighborhood reach across Poster Billboard, Marquee Ticker & Video Spotlight",
    baseDailyRate: 1899,
  },
};

export interface PosterAdDetails {
  title: string;
  label: string;
  imageUrl: string;
  tone: string;
}

export interface ContentAdDetails {
  message: string;
}

export interface VideoAdDetails {
  title: string;
  description: string;
  sourceUrl: string;
  posterUrl: string;
  callToAction: string;
}

export interface AdBookingRequest {
  id: string;
  businessName: string;
  contactName: string;
  contactPhone: string;
  format: AdFormat;
  slotTiming: AdSlotTiming;
  slotLabel: string;
  customStartHour?: number;
  customEndHour?: number;
  startHour: number;
  endHour: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  
  // Creative assets
  poster?: PosterAdDetails;
  content?: ContentAdDetails;
  video?: VideoAdDetails;

  // Pricing calculations
  baseRate: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;

  // Status & Payment
  status: "Pending Payment" | "Paid" | "Active" | "Completed" | "Rejected";
  paymentMethod?: string;
  transactionId?: string;
  invoiceNumber?: string;
  paidAt?: string;
  createdAt: string;
  notes?: string;

  // View / Impression Analytics
  viewsCount?: number;
  clicksCount?: number;
  impressionsBySurface?: {
    poster: number;
    content: number;
    video: number;
  };
  lastViewedAt?: string;
}

export function calculateAdPricing(
  format: AdFormat,
  slotTiming: AdSlotTiming,
  durationDays: number
): {
  baseDailyRate: number;
  multiplier: number;
  effectiveDailyRate: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
} {
  const formatInfo = AD_FORMAT_PRICING[format] || AD_FORMAT_PRICING.poster;
  const slotInfo = AD_TIME_SLOTS[slotTiming] || AD_TIME_SLOTS.morning;
  const days = Math.max(1, durationDays || 1);

  const baseDailyRate = formatInfo.baseDailyRate;
  const multiplier = slotInfo.multiplier;
  const effectiveDailyRate = Math.round(baseDailyRate * multiplier);
  const subtotal = effectiveDailyRate * days;
  const gstAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstAmount;

  return {
    baseDailyRate,
    multiplier,
    effectiveDailyRate,
    subtotal,
    gstAmount,
    totalAmount,
  };
}

export function isAdActiveAt(
  booking: AdBookingRequest,
  targetDate: Date = new Date(),
  simulatedHour?: number
): boolean {
  if (booking.status !== "Paid" && booking.status !== "Active") return false;

  const currentHour = typeof simulatedHour === "number" ? simulatedHour : targetDate.getHours();
  
  // Format target date to YYYY-MM-DD in local time
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  if (dateStr < booking.startDate || dateStr > booking.endDate) {
    return false;
  }

  if (booking.slotTiming === "all_day") {
    return true;
  }

  const { startHour, endHour } = booking;
  if (startHour < endHour) {
    return currentHour >= startHour && currentHour < endHour;
  } else if (startHour > endHour) {
    // Over midnight, e.g. 22:00 to 08:00
    return currentHour >= startHour || currentHour < endHour;
  }

  return true;
}

/**
 * Merges time-slot active paid ads into the standard AdConfig
 * based on the current date/hour or a simulated hour.
 */
export function resolveScheduledAds(
  baseConfig: AdConfig,
  bookings: AdBookingRequest[],
  targetDate: Date = new Date(),
  simulatedHour?: number
): AdConfig {
  const activeBookings = bookings.filter((b) =>
    isAdActiveAt(b, targetDate, simulatedHour)
  );

  const extraTickers: string[] = [];
  const extraImages: AdConfig["imageAds"] = [];
  let customVideoAd = baseConfig.videoAd;

  for (const b of activeBookings) {
    if (b.content?.message && (b.format === "content" || b.format === "combo")) {
      extraTickers.push(b.content.message);
    }
    if (b.poster?.imageUrl && (b.format === "poster" || b.format === "combo")) {
      extraImages.push({
        id: b.id,
        adBookingId: b.id,
        businessName: b.businessName,
        label: b.poster.label || b.businessName,
        title: b.poster.title,
        image: b.poster.imageUrl,
        tone: b.poster.tone || "gold",
        viewsCount: b.viewsCount || 0,
      });
    }
    if (b.video?.sourceUrl && (b.format === "video" || b.format === "combo")) {
      customVideoAd = {
        adBookingId: b.id,
        businessName: b.businessName,
        title: b.video.title || `${b.businessName} Spotlight`,
        description: b.video.description,
        sourceUrl: b.video.sourceUrl,
        posterUrl: b.video.posterUrl || "",
        callToAction: b.video.callToAction || "View business details",
        viewsCount: b.viewsCount || 0,
      };
    }
  }

  return {
    ...baseConfig,
    tickerMessages:
      extraTickers.length > 0
        ? [...extraTickers, ...baseConfig.tickerMessages]
        : baseConfig.tickerMessages,
    imageAds:
      extraImages.length > 0
        ? [...extraImages, ...baseConfig.imageAds]
        : baseConfig.imageAds,
    videoAd: customVideoAd,
  };
}
