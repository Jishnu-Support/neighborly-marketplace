export type AdTargetingSummary = {
  appliedNeighborhood?: string;
  appliedQuery?: string;
  isLocationTargeted: boolean;
  isSearchTargeted: boolean;
  matchingAdsCount: number;
  locationLabel?: string;
  searchLabel?: string;
};

export type ImageAd = {
  id?: string;
  adBookingId?: string;
  businessName?: string;
  label: string;
  title: string;
  image: string;
  tone: string;
  viewsCount?: number;
  locality?: string;
  category?: string;
  distanceKm?: number;
  matchedReason?: string;
  isSearchMatch?: boolean;
};

export type VideoAd = {
  id?: string;
  adBookingId?: string;
  businessName?: string;
  title: string;
  description: string;
  sourceUrl: string;
  posterUrl: string;
  callToAction: string;
  keywords?: string[];
  category?: string;
  viewsCount?: number;
  locality?: string;
  distanceKm?: number;
  matchedReason?: string;
  isSearchMatch?: boolean;
};

export type VideoAdSettings = {
  splashDurationSeconds: number; // default: 3
  splashImageUrl: string;        // default: "/bizearch-splash-banner.png"
  splashTagline: string;         // default: "Find • Connect • Grow"
  autoCycleIntervalSeconds?: number;
};

export type PopupAdConfig = {
  enabled: boolean;
  mandatoryWatchSeconds: number; // default: 15
  firstAdDelaySeconds: number;   // default: 60 (1 min)
  secondAdDelaySeconds: number;  // default: 300 (5 mins)
  thirdAdDelaySeconds: number;   // default: 600 (10 mins)
  repeatIntervalSeconds: number; // default: 300 (every 5 mins)
  searchTriggerEnabled: boolean; // default: true
};

export type AdConfig = {
  tickerMessages: string[];
  imageAds: ImageAd[];
  videoAd: VideoAd;
  videoAds?: VideoAd[];
  videoSettings?: VideoAdSettings;
  popupAdConfig?: PopupAdConfig;
  audioAd: { title: string; description: string; sourceUrl: string };
  targetingSummary?: AdTargetingSummary;
};

export const defaultPopupAdConfig: PopupAdConfig = {
  enabled: true,
  mandatoryWatchSeconds: 15,
  firstAdDelaySeconds: 60,   // 1 minute
  secondAdDelaySeconds: 300,  // 5 minutes
  thirdAdDelaySeconds: 600,  // 10 minutes
  repeatIntervalSeconds: 300, // every 5 minutes
  searchTriggerEnabled: true,
};

export const defaultVideoSettings: VideoAdSettings = {
  splashDurationSeconds: 3,
  splashImageUrl: "/bizearch-splash-banner.png",
  splashTagline: "Find • Connect • Grow",
  autoCycleIntervalSeconds: 12,
};

export const defaultInitialVideoAds: VideoAd[] = [
  {
    id: "video-ad-1",
    businessName: "Bizearch.in Official Registry",
    title: "Bizearch Verified Business Spotlight",
    description: "Discover Hosur's accredited and physically verified local businesses with trusted neighborhood ratings.",
    sourceUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl: "/bizearch-splash-banner.png",
    callToAction: "Explore Verified Stores",
    keywords: ["all", "bizearch", "verified", "marketplace", "hosur", "directory"],
    viewsCount: 384,
  },
  {
    id: "video-ad-2",
    businessName: "Amman Motors Maruti ARENA – Hosur",
    title: "Amman Motors Maruti ARENA – Drive Your Dream Car",
    description: "Authorized Maruti Suzuki dealership on NH 44, Hosur. Swift, Brezza, Ertiga, Grand Vitara with fast loan approvals.",
    sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    posterUrl: "/bizearch-splash-banner.png",
    callToAction: "Book Test Drive",
    keywords: ["car", "automobile", "maruti", "swift", "brezza", "motors", "vehicle", "service"],
    category: "Automobiles",
    viewsCount: 295,
  },
  {
    id: "video-ad-3",
    businessName: "Kauvery Hospital – Hosur",
    title: "Kauvery Hospital – 24/7 Multi-Specialty Care",
    description: "NABH-accredited 125-bed hospital in Shanthi Nagar, Hosur. Emergency ICU, cardiology, orthopaedics & expert consultants.",
    sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    posterUrl: "/bizearch-splash-banner.png",
    callToAction: "Book Appointment",
    keywords: ["hospital", "clinic", "health", "doctor", "emergency", "medical", "treatment"],
    category: "Health & wellness",
    viewsCount: 218,
  },
  {
    id: "video-ad-4",
    businessName: "Muneer Bakery – Hosur",
    title: "Muneer Bakery – Legendary Taste & Fresh Bakes",
    description: "Hosur's favorite bakery on Old Bangalore Road. Signature plum cakes, honey cakes, savory puffs and celebrations.",
    sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    posterUrl: "/bizearch-splash-banner.png",
    callToAction: "Order Fresh Bakes",
    keywords: ["bakery", "food", "cake", "sweets", "restaurant", "snacks", "pastry"],
    category: "Food & dining",
    viewsCount: 172,
  },
];

export const defaultAdConfig: AdConfig = {
  tickerMessages: [],
  imageAds: [],
  videoAd: defaultInitialVideoAds[0],
  videoAds: defaultInitialVideoAds,
  videoSettings: defaultVideoSettings,
  popupAdConfig: defaultPopupAdConfig,
  audioAd: {
    title: "",
    description: "",
    sourceUrl: "",
  },
};
