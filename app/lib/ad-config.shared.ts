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

export type AdConfig = {
  tickerMessages: string[];
  imageAds: ImageAd[];
  videoAd: {
    adBookingId?: string;
    businessName?: string;
    title: string;
    description: string;
    sourceUrl: string;
    posterUrl: string;
    callToAction: string;
    viewsCount?: number;
    locality?: string;
    distanceKm?: number;
    matchedReason?: string;
    isSearchMatch?: boolean;
  };
  audioAd: { title: string; description: string; sourceUrl: string };
  targetingSummary?: AdTargetingSummary;
};

export const defaultAdConfig: AdConfig = {
  tickerMessages: [],
  imageAds: [],
  videoAd: {
    title: "",
    description: "",
    sourceUrl: "",
    posterUrl: "",
    callToAction: "",
  },
  audioAd: {
    title: "",
    description: "",
    sourceUrl: "",
  },
};
