import { type AdConfig, type VideoAd } from "./ad-config.shared";

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
  discount?: number; // percentage discount (e.g. 20 for 20% off)
}

export const AD_FORMAT_PRICING: Record<AdFormat, AdFormatPricing> = {
  content: {
    format: "content",
    name: "Content Ad (Marquee Ticker)",
    shortName: "Content Ad",
    badge: "Announcement Ticker",
    description: "High-visibility scrolling message bar at the top of the platform header",
    baseDailyRate: 10,
    discount: 0,
  },
  poster: {
    format: "poster",
    name: "Poster Ad (Hero Billboard)",
    shortName: "Poster Billboard",
    badge: "Image Billboard",
    description: "Prominent photo billboard banner rotating in both mobile & desktop ad positions",
    baseDailyRate: 25,
    discount: 0,
  },
  video: {
    format: "video",
    name: "Video Ad (Spotlight Reel)",
    shortName: "Video Spotlight",
    badge: "Spotlight Video",
    description: "Local video player spotlight with headline, description, and direct call to action",
    baseDailyRate: 50,
    discount: 10,
  },
  combo: {
    format: "combo",
    name: "Combo Pack (Poster + Content + Video)",
    shortName: "All-In-One Combo",
    badge: "Best Value Bundle",
    description: "Maximum neighborhood reach across Poster Billboard, Marquee Ticker & Video Spotlight",
    baseDailyRate: 75,
    discount: 20,
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
  discount?: number;
  discountSavings?: number;
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

  // View / Impression Analytics & Audience Logs
  viewsCount?: number;
  clicksCount?: number;
  impressionsBySurface?: {
    poster: number;
    content: number;
    video: number;
  };
  lastViewedAt?: string;
  viewRecords?: AdViewRecord[];
  clickRecords?: AdClickRecord[];
}

export interface AdClickRecord {
  id: string;
  adBookingId: string;
  customerId: string; // e.g. "CUST-HSR-21482"
  action: "call" | "whatsapp" | "view_store" | "navigate";
  actionLabel: string;
  viewerName: string;
  viewerPhone?: string;
  clickedAt: string;
  clickedDate: string;
  clickedTime: string;
  locality?: string;
  device?: string;
}

export interface AdViewRecord {
  id: string;
  adBookingId: string;
  customerId: string; // e.g. "CUST-HSR-21482"
  viewerName: string;
  viewerPhone?: string;
  viewerRole?: string;
  surface: "poster" | "content" | "video";
  surfaceLabel?: string;
  viewedAt: string; // ISO date string
  viewedDate: string; // Formatted date e.g. "02 Nov 2026"
  viewedTime: string; // Formatted time e.g. "02:04:15 PM"
  locality?: string;
  device?: string;
}

export function calculateAdPricing(
  format: AdFormat,
  slotTiming: AdSlotTiming,
  durationDays: number,
  customPricing?: Record<string, { baseDailyRate: number; discount?: number } | any>
): {
  baseDailyRate: number;
  discount: number;
  discountedDailyRate: number;
  multiplier: number;
  effectiveDailyRate: number;
  subtotal: number;
  discountSavings: number;
  gstAmount: number;
  totalAmount: number;
} {
  const formatInfo = customPricing?.[format] || AD_FORMAT_PRICING[format] || AD_FORMAT_PRICING.poster;
  const slotInfo = AD_TIME_SLOTS[slotTiming] || AD_TIME_SLOTS.morning;
  const days = Math.max(1, durationDays || 1);

  const baseDailyRate = Number(formatInfo?.baseDailyRate) || 10;
  const discount = Math.max(0, Math.min(100, Number(formatInfo?.discount) || 0));
  const discountedDailyRate = discount > 0 ? Math.max(1, Math.round(baseDailyRate * (1 - discount / 100))) : baseDailyRate;

  const multiplier = slotInfo.multiplier;
  const effectiveDailyRate = Math.round(discountedDailyRate * multiplier);
  const undiscountedEffectiveDailyRate = Math.round(baseDailyRate * multiplier);
  const subtotal = effectiveDailyRate * days;
  const discountSavings = Math.max(0, (undiscountedEffectiveDailyRate * days) - subtotal);
  const gstAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstAmount;

  return {
    baseDailyRate,
    discount,
    discountedDailyRate,
    multiplier,
    effectiveDailyRate,
    subtotal,
    discountSavings,
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

export interface AdTargetingContext {
  searchQuery?: string;
  selectedNeighborhood?: string;
  locationCoordinates?: { latitude: number; longitude: number } | null;
  locationEnabled?: boolean;
  radiusKm?: number;
  businesses?: Array<{
    name: string;
    category?: string;
    categories?: string[];
    subcategories?: string[];
    taxonomyTags?: string[];
    address?: { area?: string; street?: string; cityTown?: string };
    coordinates?: { latitude: number; longitude: number } | null;
    demoCoordinates?: { latitude: number; longitude: number };
    distance?: number;
    products?: Array<{ name: string; description?: string; category?: string }>;
  }>;
}

export function calculateDistanceKm(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(destination.latitude - origin.latitude);
  const dLng = toRad(destination.longitude - origin.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.latitude)) *
      Math.cos(toRad(destination.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDistanceMeters(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): number {
  return Math.round(calculateDistanceKm(origin, destination) * 1000);
}

export const NEIGHBORHOOD_CENTROIDS: Record<string, { latitude: number; longitude: number }> = {
  "Bagalur Road": { latitude: 12.741, longitude: 77.834 },
  "SIPCOT Phase 1": { latitude: 12.756, longitude: 77.801 },
  "SIPCOT Phase 2": { latitude: 12.772, longitude: 77.789 },
  "MG Road / Railway Station": { latitude: 12.735, longitude: 77.828 },
  "Mathigiri": { latitude: 12.712, longitude: 77.818 },
  "Mookandapalli": { latitude: 12.748, longitude: 77.812 },
  "Denkanikottai Road": { latitude: 12.721, longitude: 77.839 },
  "Rayakottai Road": { latitude: 12.729, longitude: 77.842 },
};

export function findNearestNeighborhood(coords: { latitude: number; longitude: number }): string {
  let closest = "Bagalur Road";
  let minDistance = Infinity;
  for (const [name, centroid] of Object.entries(NEIGHBORHOOD_CENTROIDS)) {
    const d = calculateDistanceKm(coords, centroid);
    if (d < minDistance) {
      minDistance = d;
      closest = name;
    }
  }
  return closest;
}

const PRODUCT_SYNONYMS: Record<string, string[]> = {
  automotive: [
    "car", "bike", "auto", "vehicle", "scooter", "motorcycle", "puncture", "tyre", "tire", "engine", "service",
    "mechanic", "repair", "diagnostics", "brake", "oil", "two wheeler", "four wheeler", "battery", "wheel", "tvs", "bajaj", "hero", "maruti", "honda"
  ],
  sweets_food: [
    "sweet", "sweets", "bakery", "cake", "biscuit", "pastry", "ladoo", "laddu", "mysurpa", "mysore pak", "halwa", "mithai",
    "snack", "snacks", "samosa", "murukku", "thali", "meals", "briyani", "biryani", "food", "tea", "coffee", "restaurant", "cafe", "tiffin"
  ],
  electronics: [
    "tv", "television", "phone", "mobile", "laptop", "computer", "electronics", "fridge", "refrigerator", "washing machine",
    "ac", "air conditioner", "charger", "gadget", "gadgets", "croma", "samsung", "headphone", "audio", "camera", "led"
  ],
  fitness_sports: [
    "gym", "fitness", "workout", "trainer", "exercise", "weight loss", "muscle", "cardio", "bodybuilding", "yoga",
    "badminton", "turf", "sports", "swimming", "crossfit", "aerobics", "nutrition"
  ],
  groceries_produce: [
    "veg", "vegetable", "vegetables", "fruits", "fruit", "organic", "farm", "produce", "grocery", "groceries", "milk",
    "dairy", "greens", "tomato", "onion", "rice", "dal", "oil", "provisions", "supermarket"
  ],
  fashion_lifestyle: [
    "cloth", "clothing", "dress", "saree", "shirt", "pant", "kurta", "fashion", "tailor", "tailoring", "textile",
    "footwear", "shoes", "chappal", "sandals", "jewellery", "gold", "silver"
  ],
  hardware_home: [
    "hardware", "tools", "paint", "cement", "pipes", "plumbing", "sanitary", "electricals", "switch", "wire", "plywood", "steel", "interior", "furniture"
  ],
  healthcare: [
    "doctor", "clinic", "hospital", "medicine", "pharmacy", "medical", "physio", "dental", "dentist", "laser", "skin", "care"
  ]
};

function checkSynonymOverlap(query: string, targetText: string): boolean {
  const qLower = query.toLowerCase();
  const targetLower = targetText.toLowerCase();

  for (const cluster of Object.values(PRODUCT_SYNONYMS)) {
    const queryMatchesCluster = cluster.some((syn) => qLower.includes(syn));
    if (queryMatchesCluster) {
      const targetMatchesCluster = cluster.some((syn) => targetLower.includes(syn));
      if (targetMatchesCluster) return true;
    }
  }
  return false;
}

/**
 * Merges time-slot active paid ads into the standard AdConfig
 * based on the current date/hour or simulated hour, filtered and ranked
 * by customer location (surrounding area) and search query (similar products).
 */
export function resolveScheduledAds(
  baseConfig: AdConfig,
  bookings: AdBookingRequest[],
  targetDate: Date = new Date(),
  simulatedHour?: number,
  targeting?: AdTargetingContext
): AdConfig {
  const activeBookings = bookings.filter((b) =>
    isAdActiveAt(b, targetDate, simulatedHour)
  );

  const cleanQuery = targeting?.searchQuery?.trim().toLowerCase() || "";
  const activeNeighborhood = targeting?.selectedNeighborhood || "All Hosur";
  const hasLocalityFilter = activeNeighborhood !== "All Hosur";
  const hasGpsFilter = Boolean(targeting?.locationEnabled && targeting?.locationCoordinates);
  const radius = targeting?.radiusKm || 5;
  const businesses = targeting?.businesses || [];

  // Helper to find business by booking
  const findBiz = (name: string) => {
    const n = name.toLowerCase();
    return businesses.find(
      (b) =>
        b.name.toLowerCase() === n ||
        b.name.toLowerCase().includes(n) ||
        n.includes(b.name.toLowerCase())
    );
  };

  interface ScoredBooking {
    booking: AdBookingRequest;
    bizName: string;
    locality: string;
    distanceKm: number;
    searchScore: number;
    locationScore: number;
    rankScore: number;
    isSearchMatch: boolean;
    isLocationMatch: boolean;
    matchedReason?: string;
  }

  const scoredBookings: ScoredBooking[] = [];

  for (const b of activeBookings) {
    const biz = findBiz(b.businessName);
    const area = biz?.address?.area || "";
    const street = biz?.address?.street || "";
    const label = b.poster?.label || "";
    const cleanLocality = area || street || (label.includes("•") ? label.split("•")[1].trim() : label) || "Hosur";
    const combinedLocality = `${area} ${street} ${label}`.trim() || "Hosur";

    // Distance
    let dist = 2.5;
    if (targeting?.locationCoordinates && (biz?.coordinates || biz?.demoCoordinates)) {
      dist = calculateDistanceKm(
        targeting.locationCoordinates,
        biz.coordinates || biz.demoCoordinates!
      );
    } else if (typeof biz?.distance === "number") {
      dist = biz.distance;
    } else if (hasLocalityFilter && combinedLocality.toLowerCase().includes(activeNeighborhood.toLowerCase())) {
      dist = 0.8;
    }

    // Location check (surrounding ads only)
    let isLocationMatch = true;
    let locationScore = 50;

    if (hasLocalityFilter) {
      const matchArea = combinedLocality.toLowerCase().includes(activeNeighborhood.toLowerCase());
      const matchRadius = dist <= radius;
      if (matchArea || matchRadius) {
        isLocationMatch = true;
        locationScore = 100 - Math.min(dist, 25) * 2;
      } else {
        isLocationMatch = false;
        locationScore = 0;
      }
    } else if (hasGpsFilter) {
      if (dist <= radius) {
        isLocationMatch = true;
        locationScore = 100 - Math.min(dist, 25) * 2;
      } else {
        isLocationMatch = false;
        locationScore = 0;
      }
    }

    // Search query check (similar products & relevant offerings only)
    let isSearchMatch = true;
    let searchScore = 0;
    let matchedReason: string | undefined;

    if (cleanQuery) {
      // 1. Direct product match
      const matchingProds = biz?.products?.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          (p.description && p.description.toLowerCase().includes(cleanQuery))
      ) || [];

      // 2. Ad creative text match
      const creativeTexts = [
        b.poster?.title,
        b.poster?.label,
        b.content?.message,
        b.video?.title,
        b.video?.description,
      ].filter(Boolean).join(" ").toLowerCase();
      const creativeMatch = creativeTexts.includes(cleanQuery);

      // 3. Category & subcategories match
      const catTexts = [
        biz?.category,
        ...(biz?.categories || []),
        ...(biz?.subcategories || []),
        ...(biz?.taxonomyTags || []),
      ].filter(Boolean).join(" ").toLowerCase();
      const catMatch = catTexts.includes(cleanQuery);

      // 4. Synonym cluster match
      const synonymMatch = checkSynonymOverlap(cleanQuery, `${biz?.name || ""} ${catTexts} ${creativeTexts}`);

      if (matchingProds.length > 0) {
        searchScore = 60 + matchingProds.length * 15;
        matchedReason = `Similar product: "${matchingProds[0].name}"`;
      } else if (creativeMatch) {
        searchScore = 50;
        matchedReason = `Sponsored promotion for "${cleanQuery}"`;
      } else if (catMatch) {
        searchScore = 40;
        matchedReason = `Category match: ${biz?.category || "Local Category"}`;
      } else if (synonymMatch) {
        searchScore = 30;
        matchedReason = `Relevant to "${cleanQuery}"`;
      } else {
        searchScore = 0;
        isSearchMatch = false;
      }
    }

    const rankScore = (searchScore * 4) + locationScore + (1 / (dist + 0.1)) * 10;

    scoredBookings.push({
      booking: b,
      bizName: b.businessName,
      locality: cleanLocality,
      distanceKm: Math.round(dist * 10) / 10,
      searchScore,
      locationScore,
      rankScore,
      isSearchMatch,
      isLocationMatch,
      matchedReason,
    });
  }

  // If search query is active: ONLY include search-matching ads!
  let filteredBookings = scoredBookings;
  if (cleanQuery) {
    filteredBookings = filteredBookings.filter((sb) => sb.isSearchMatch);
  }

  // If locality is active (or GPS is active): filter to surrounding ads only.
  if (hasLocalityFilter || hasGpsFilter) {
    const surrounding = filteredBookings.filter((sb) => sb.isLocationMatch);
    if (surrounding.length > 0) {
      filteredBookings = surrounding;
    } else if (!cleanQuery) {
      // Pure locality browsing without search: strictly surrounding ads
      filteredBookings = surrounding;
    }
  }

  // Sort by rank score descending
  filteredBookings.sort((a, b) => b.rankScore - a.rankScore);

  // Evaluate base image ads for location and search
  const evaluatedBaseImages = baseConfig.imageAds.map((ad, idx) => {
    const adLocality = ad.locality || (idx === 0 ? "Bagalur Road" : idx === 1 ? "SIPCOT Phase 1" : "MG Road / Railway Station");
    const adCategory = ad.category || (idx === 0 ? "Groceries & organic produce" : idx === 1 ? "Industrial & Manufacturing" : "Retail & electronics");

    let isLocMatch = true;
    if (hasLocalityFilter) {
      isLocMatch = adLocality.toLowerCase().includes(activeNeighborhood.toLowerCase());
    }

    let isSearchMatch = true;
    let matchedReason: string | undefined;
    if (cleanQuery) {
      const text = `${ad.title} ${ad.label} ${adLocality} ${adCategory}`.toLowerCase();
      const directMatch = text.includes(cleanQuery);
      const synMatch = checkSynonymOverlap(cleanQuery, text);
      if (directMatch) {
        matchedReason = `Sponsored: "${cleanQuery}"`;
        isSearchMatch = true;
      } else if (synMatch) {
        matchedReason = `Relevant to "${cleanQuery}"`;
        isSearchMatch = true;
      } else {
        isSearchMatch = false;
      }
    }

    return {
      ad: {
        ...ad,
        locality: adLocality,
        category: adCategory,
        matchedReason,
        isSearchMatch,
      },
      isLocMatch,
      isSearchMatch,
    };
  });

  let eligibleBaseImages = evaluatedBaseImages;
  if (cleanQuery) {
    eligibleBaseImages = eligibleBaseImages.filter((x) => x.isSearchMatch);
  }
  if (hasLocalityFilter) {
    const locOnly = eligibleBaseImages.filter((x) => x.isLocMatch);
    if (locOnly.length > 0 || !cleanQuery) {
      eligibleBaseImages = locOnly;
    }
  }

  const extraTickers: string[] = [];
  const extraImages: AdConfig["imageAds"] = [];
  const extraVideoAds: VideoAd[] = [];
  let customVideoAd = baseConfig.videoAd;

  for (const sb of filteredBookings) {
    const b = sb.booking;
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
        locality: sb.locality,
        distanceKm: sb.distanceKm,
        matchedReason: sb.matchedReason,
        isSearchMatch: sb.isSearchMatch,
      });
    }
    if (b.video?.sourceUrl && (b.format === "video" || b.format === "combo")) {
      const poster = (b.video?.posterUrl && !b.video.posterUrl.includes("1528605248644"))
        ? b.video.posterUrl
        : (baseConfig.videoAd?.posterUrl || "/bizearch-splash-banner.png");
      const bookedVid: VideoAd = {
        id: b.id,
        adBookingId: b.id,
        businessName: b.businessName,
        title: b.video.title || `${b.businessName} Spotlight`,
        description: b.video.description,
        sourceUrl: b.video.sourceUrl,
        posterUrl: poster,
        callToAction: b.video.callToAction || "View business details",
        viewsCount: b.viewsCount || 0,
        locality: sb.locality,
        distanceKm: sb.distanceKm,
        matchedReason: sb.matchedReason,
        isSearchMatch: sb.isSearchMatch,
      };
      extraVideoAds.push(bookedVid);
      if (!customVideoAd || customVideoAd === baseConfig.videoAd) {
        customVideoAd = bookedVid;
      }
    }
  }

  // Base video ads from baseConfig
  const baseVideos: VideoAd[] = (baseConfig.videoAds && baseConfig.videoAds.length > 0)
    ? baseConfig.videoAds
    : (baseConfig.videoAd ? [baseConfig.videoAd] : []);

  // Check search matches on base video ads
  const evaluatedBaseVideos = baseVideos.map((va) => {
    let isSearchMatch = false;
    let matchedReason = va.matchedReason;
    if (cleanQuery) {
      const hay = `${va.title} ${va.description} ${va.businessName || ""} ${va.category || ""} ${(va.keywords || []).join(" ")}`.toLowerCase();
      if (hay.includes(cleanQuery)) {
        isSearchMatch = true;
        matchedReason = `Matching "${cleanQuery}"`;
      }
    }
    return {
      ...va,
      isSearchMatch: isSearchMatch || va.isSearchMatch,
      matchedReason: isSearchMatch ? matchedReason : va.matchedReason,
    };
  });

  // Combine booked videos + base videos, prioritizing search-matching videos to the front
  const combinedVideoAds = [...extraVideoAds, ...evaluatedBaseVideos];
  const sortedVideoAds = [...combinedVideoAds].sort((a, b) => {
    if (a.isSearchMatch && !b.isSearchMatch) return -1;
    if (!a.isSearchMatch && b.isSearchMatch) return 1;
    return 0;
  });

  const finalVideoAds = sortedVideoAds.length > 0 ? sortedVideoAds : (baseConfig.videoAd ? [baseConfig.videoAd] : []);

  const finalImageAds = [...extraImages, ...eligibleBaseImages.map((x) => x.ad)];

  const isSearchTargeted = Boolean(cleanQuery);
  const isLocationTargeted = Boolean(hasLocalityFilter || hasGpsFilter);

  const targetingSummary = {
    appliedNeighborhood: hasLocalityFilter ? activeNeighborhood : undefined,
    appliedQuery: cleanQuery || undefined,
    isLocationTargeted,
    isSearchTargeted,
    matchingAdsCount: finalImageAds.length,
    locationLabel: hasLocalityFilter
      ? `${activeNeighborhood} (within ${radius} km)`
      : hasGpsFilter
      ? `GPS Location (${radius} km radius)`
      : "All Hosur",
    searchLabel: cleanQuery ? `Similar products for "${cleanQuery}"` : undefined,
  };

  // For tickers: if search query is active and we have matching tickers, display only those.
  // Otherwise, if no extra tickers match the search query, show contextual announcement.
  let finalTickers = baseConfig.tickerMessages;
  if (cleanQuery) {
    if (extraTickers.length > 0) {
      finalTickers = extraTickers;
    } else {
      finalTickers = [`🎯 Sponsored: Showing verified Hosur providers matching "${cleanQuery}"`];
    }
  } else if (extraTickers.length > 0) {
    finalTickers = [...extraTickers, ...baseConfig.tickerMessages];
  }

  return {
    ...baseConfig,
    tickerMessages: finalTickers,
    imageAds: finalImageAds,
    videoAd: finalVideoAds[0] || customVideoAd,
    videoAds: finalVideoAds,
    videoSettings: baseConfig.videoSettings,
    popupAdConfig: baseConfig.popupAdConfig,
    targetingSummary,
  };
}

export function createSampleViewRecords(
  adBookingId: string,
  totalViews: number = 20,
  allowedSurfaces: Array<"poster" | "content" | "video"> = ["poster", "content", "video"]
): AdViewRecord[] {
  const sampleUsers = [
    { customerId: "CUST-HSR-21482", name: "Naveen Kumar", phone: "•••• 21482", role: "Resident Member", locality: "Bagalur Road, Hosur" },
    { customerId: "CUST-HSR-43210", name: "Asha Rao", phone: "•••• 43210", role: "Verified Customer", locality: "Gandhi Road, Hosur" },
    { customerId: "CUST-HSR-87654", name: "Karthik Raja", phone: "•••• 87654", role: "Resident Member", locality: "Rayakottai Road, Hosur" },
    { customerId: "CUST-HSR-10987", name: "Priya Raman", phone: "•••• 10987", role: "Verified Customer", locality: "SIPCOT Phase 1, Hosur" },
    { customerId: "CUST-HSR-65432", name: "Suresh Babu", phone: "•••• 65432", role: "Resident Member", locality: "Mathigiri, Hosur" },
    { customerId: "CUST-HSR-32109", name: "Ananya Swaminathan", phone: "•••• 32109", role: "Customer", locality: "Denkanikotta Road, Hosur" },
    { customerId: "CUST-HSR-78901", name: "Venkatesh Murthy", phone: "•••• 78901", role: "Resident Member", locality: "Near Bus Stand, Hosur" },
    { customerId: "CUST-HSR-45678", name: "Meena Sundaram", phone: "•••• 45678", role: "Verified Customer", locality: "Avalapalli Road, Hosur" },
    { customerId: "CUST-HSR-12345", name: "Dinesh Kumar", phone: "•••• 12345", role: "Resident Member", locality: "Mookandapalli, Hosur" },
    { customerId: "CUST-HSR-67890", name: "Lakshmi Narayanan", phone: "•••• 67890", role: "Customer", locality: "Mornapalli, Hosur" },
    { customerId: "CUST-HSR-91823", name: "Neighbor in Hosur", phone: "", role: "Local Shopper", locality: "All Hosur" },
    { customerId: "CUST-HSR-55241", name: "Neighbor in Hosur", phone: "", role: "Local Shopper", locality: "Bagalur Road, Hosur" },
  ];

  const devices = [
    "Mobile (Android / Chrome)",
    "Mobile (iOS / Safari)",
    "Desktop (Windows / Chrome)",
    "Desktop (macOS / Safari)",
  ];

  const surfaceLabels: Record<string, string> = {
    poster: "Poster Billboard",
    content: "Marquee Ticker",
    video: "Video Spotlight",
  };

  const records: AdViewRecord[] = [];
  const count = Math.min(25, Math.max(6, Math.round(totalViews / 45)));

  for (let i = 0; i < count; i++) {
    const user = sampleUsers[i % sampleUsers.length];
    const surface = allowedSurfaces[i % allowedSurfaces.length];
    const minutesAgo = i === 0 ? 3 : i * 14 + 7;
    const viewDateObj = new Date(Date.now() - minutesAgo * 60 * 1000);
    const time = viewDateObj.toISOString();

    records.push({
      id: `view_${adBookingId}_${i + 1}`,
      adBookingId,
      customerId: user.customerId,
      viewerName: user.name,
      viewerPhone: user.phone,
      viewerRole: user.role,
      surface,
      surfaceLabel: surfaceLabels[surface] || "Poster Billboard",
      viewedAt: time,
      viewedDate: viewDateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      viewedTime: viewDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
      locality: user.locality,
      device: devices[i % devices.length],
    });
  }

  return records;
}

export function createSampleClickRecords(
  adBookingId: string,
  totalClicks: number = 6
): AdClickRecord[] {
  const sampleUsers = [
    { customerId: "CUST-HSR-21482", name: "Naveen Kumar", phone: "•••• 21482", locality: "Bagalur Road, Hosur" },
    { customerId: "CUST-HSR-43210", name: "Asha Rao", phone: "•••• 43210", locality: "Gandhi Road, Hosur" },
    { customerId: "CUST-HSR-87654", name: "Karthik Raja", phone: "•••• 87654", locality: "Rayakottai Road, Hosur" },
    { customerId: "CUST-HSR-10987", name: "Priya Raman", phone: "•••• 10987", locality: "SIPCOT Phase 1, Hosur" },
    { customerId: "CUST-HSR-65432", name: "Suresh Babu", phone: "•••• 65432", locality: "Mathigiri, Hosur" },
  ];

  const actions: Array<{ action: "call" | "whatsapp" | "view_store" | "navigate"; label: string }> = [
    { action: "whatsapp", label: "WhatsApp Inquiry" },
    { action: "call", label: "Phone Call Placed" },
    { action: "view_store", label: "Visited Business Profile" },
    { action: "navigate", label: "Directions / Map Route" },
  ];

  const devices = [
    "Mobile (Android / Chrome)",
    "Mobile (iOS / Safari)",
    "Desktop (Windows / Chrome)",
  ];

  const records: AdClickRecord[] = [];
  const count = Math.min(15, Math.max(3, Math.round(totalClicks)));

  for (let i = 0; i < count; i++) {
    const user = sampleUsers[i % sampleUsers.length];
    const act = actions[i % actions.length];
    const minutesAgo = i * 28 + 12;
    const clickDateObj = new Date(Date.now() - minutesAgo * 60 * 1000);

    records.push({
      id: `click_${adBookingId}_${i + 1}`,
      adBookingId,
      customerId: user.customerId,
      action: act.action,
      actionLabel: act.label,
      viewerName: user.name,
      viewerPhone: user.phone,
      clickedAt: clickDateObj.toISOString(),
      clickedDate: clickDateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      clickedTime: clickDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
      locality: user.locality,
      device: devices[i % devices.length],
    });
  }

  return records;
}
