export type RegistrationVideoType = "upload" | "youtube";

export type RegistrationVideoConfig = {
  enabled: boolean;
  type: RegistrationVideoType;
  videoUrl: string; // Direct uploaded video URL, e.g. "/api/ads/media/xxx.mp4"
  fileName?: string; // Original uploaded file name
  fileSize?: number; // File size in bytes
  youtubeUrl: string; // YouTube video link, e.g. "https://www.youtube.com/watch?v=..."
  title: string; // Header title for pop-up player (default: "How to Register Your Business")
  buttonText: string; // Display text for link (default: "How to Register ?")
  updatedAt?: string;
};

export const defaultRegistrationVideoConfig: RegistrationVideoConfig = {
  enabled: true,
  type: "upload",
  videoUrl: "",
  fileName: "",
  youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "How to Register Your Business",
  buttonText: "How to Register ?",
  updatedAt: "2026-11-11T16:40:00.000Z",
};

/**
 * Extracts a YouTube Video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|shorts)\/))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

export function formatYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

export function formatYouTubeWatchUrl(url: string): string {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url.trim();
}
