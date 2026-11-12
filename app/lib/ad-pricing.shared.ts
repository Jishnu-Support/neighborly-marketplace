export interface AdFormatPricing {
  format: string;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  baseDailyRate: number; // in INR
}

export const DEFAULT_AD_FORMAT_PRICING: Record<string, AdFormatPricing> = {
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
