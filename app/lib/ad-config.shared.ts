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

export const defaultTickerMessages: string[] = [
  "🌟 Welcome to Bizearch.in — Hosur's Premier Verified Local Business Directory & Marketplace",
  "📍 Discover verified stores across Bagalur Road, SIPCOT, MG Road, Mathigiri & Denkanikottai Road",
  "⚡ Book top-rated local services: Automotive, Healthcare, Home Care, Electrical & Dining",
  "💼 Promote your Hosur business: Reach verified local customers with targeted banner & video spots",
  "🚨 24/7 Emergency Assistance: Tap the SOS button anytime for instant local emergency help",
];

export const defaultInitialImageAds: ImageAd[] = [
  {
    id: "def-img-ad-1",
    businessName: "Jishnu Learning Labs",
    label: "Jishnu Learning Labs • Bagalur Road",
    title: "Special Neighborhood Educational Offer — Interactive STEM & Robotics Classes",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=85",
    tone: "gold",
    locality: "Bagalur Road",
    category: "Education & training",
    distanceKm: 1.5,
    viewsCount: 24,
  },
  {
    id: "def-img-ad-2",
    businessName: "Amman Motors Maruti ARENA – Hosur",
    label: "Amman Motors • NH 44 Bypass",
    title: "Authorized Maruti Suzuki Arena — Festival Savings & Doorstep Test Rides",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=85",
    tone: "mint",
    locality: "NH 44",
    category: "Automobiles",
    distanceKm: 2.1,
    viewsCount: 38,
  },
  {
    id: "def-img-ad-3",
    businessName: "Kauvery Hospital – Hosur",
    label: "Kauvery Hospital • Shanthi Nagar",
    title: "NABH Accredited 24/7 Multi-Specialty Hospital & Advanced Emergency Care",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=85",
    tone: "lavender",
    locality: "Shanthi Nagar",
    category: "Health & wellness",
    distanceKm: 1.8,
    viewsCount: 45,
  },
  {
    id: "def-img-ad-4",
    businessName: "Muneer Bakery – Hosur",
    label: "Muneer Bakery • Old Bangalore Road",
    title: "Hosur's Legendary Bakery Since 1982 — Signature Plum Cakes & Fresh Bakes",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85",
    tone: "peach",
    locality: "Old Bangalore Road",
    category: "Food & dining",
    distanceKm: 0.9,
    viewsCount: 52,
  },
];

export const defaultAdConfig: AdConfig = {
  tickerMessages: defaultTickerMessages,
  imageAds: defaultInitialImageAds,
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
