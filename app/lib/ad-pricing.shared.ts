export interface AdFormatPricing {
  format: string;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  baseDailyRate: number; // in INR
  discount?: number; // percentage discount (e.g. 20 for 20% off, 0 for none)
}

export const DEFAULT_AD_FORMAT_PRICING: Record<string, AdFormatPricing> = {
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
