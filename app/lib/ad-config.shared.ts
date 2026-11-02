export type ImageAd = {
  id?: string;
  adBookingId?: string;
  businessName?: string;
  label: string;
  title: string;
  image: string;
  tone: string;
  viewsCount?: number;
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
  };
  audioAd: { title: string; description: string; sourceUrl: string };
};

export const defaultAdConfig: AdConfig = {
  tickerMessages: [
    "Local favorites, right around the corner",
    "Discover neighborhood businesses on Bizearch",
    "Good things are closer than you think",
  ],
  imageAds: [
    {
      id: "DEF-AD-1",
      label: "Fresh from your neighborhood",
      title: "Made nearby. Made for you.",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
      tone: "market",
      viewsCount: 1420,
    },
    {
      id: "DEF-AD-2",
      label: "Discover local makers",
      title: "Good things grow close to home.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85",
      tone: "makers",
      viewsCount: 980,
    },
    {
      id: "DEF-AD-3",
      label: "Support your local scene",
      title: "Meet the people behind it.",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85",
      tone: "community",
      viewsCount: 1150,
    },
  ],
  videoAd: {
    title: "Tell your neighborhood story",
    description: "Put your business in the local spotlight.",
    sourceUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=85",
    callToAction: "Promote your business",
    viewsCount: 2340,
  },
  audioAd: {
    title: "A local voice",
    description: "Listen to a story from your neighborhood.",
    sourceUrl: "",
  },
};
