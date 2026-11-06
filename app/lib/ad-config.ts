import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultAdConfig, type AdConfig } from "./ad-config.shared";
import { resolveStorePath } from "./storage-paths";

const configPath = resolveStorePath("NEIGHBORLY_AD_CONFIG_STORE", ".neighborly-ad-config.json");

export function normalizeAdConfig(input: unknown): AdConfig {
  if (!input || typeof input !== "object") {
    return defaultAdConfig;
  }
  const raw = input as Record<string, unknown>;

  // 1. Ticker messages (trim strings, filter empty, max 20)
  const tickerMessages = Array.isArray(raw.tickerMessages)
    ? raw.tickerMessages
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 20)
    : [];

  // 2. Image ads (allow any valid image URL, root path, or data URI)
  const imageAds: AdConfig["imageAds"] = Array.isArray(raw.imageAds)
    ? raw.imageAds
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item, idx) => ({
          id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `ad-${idx + 1}`,
          label: typeof item.label === "string" && item.label.trim() ? item.label.trim().slice(0, 100) : "Featured Store",
          title: typeof item.title === "string" && item.title.trim() ? item.title.trim().slice(0, 120) : "Discover this business",
          image: typeof item.image === "string" ? item.image.trim() : "",
          tone: typeof item.tone === "string" && item.tone.trim() ? item.tone.trim().slice(0, 40) : "community",
          viewsCount: typeof item.viewsCount === "number" ? item.viewsCount : 0,
          locality: typeof item.locality === "string" ? item.locality : undefined,
          category: typeof item.category === "string" ? item.category : undefined,
        }))
        .slice(0, 20)
    : [];

  // 3. Video ad (optional or populated)
  const rawVideo = raw.videoAd && typeof raw.videoAd === "object" ? (raw.videoAd as Record<string, unknown>) : {};
  const videoAd: AdConfig["videoAd"] = {
    title: typeof rawVideo.title === "string" ? rawVideo.title.trim().slice(0, 120) : "",
    description: typeof rawVideo.description === "string" ? rawVideo.description.trim().slice(0, 300) : "",
    sourceUrl: typeof rawVideo.sourceUrl === "string" ? rawVideo.sourceUrl.trim() : "",
    posterUrl: typeof rawVideo.posterUrl === "string" ? rawVideo.posterUrl.trim() : "",
    callToAction: typeof rawVideo.callToAction === "string" && rawVideo.callToAction.trim() ? rawVideo.callToAction.trim().slice(0, 60) : "Learn More",
    viewsCount: typeof rawVideo.viewsCount === "number" ? rawVideo.viewsCount : 0,
    locality: typeof rawVideo.locality === "string" ? rawVideo.locality : undefined,
  };

  // 4. Audio ad (optional or populated)
  const rawAudio = raw.audioAd && typeof raw.audioAd === "object" ? (raw.audioAd as Record<string, unknown>) : {};
  const audioAd: AdConfig["audioAd"] = {
    title: typeof rawAudio.title === "string" ? rawAudio.title.trim().slice(0, 120) : "",
    description: typeof rawAudio.description === "string" ? rawAudio.description.trim().slice(0, 300) : "",
    sourceUrl: typeof rawAudio.sourceUrl === "string" ? rawAudio.sourceUrl.trim() : "",
  };

  return {
    tickerMessages,
    imageAds,
    videoAd,
    audioAd,
  };
}

export function validateAdConfig(input: unknown): input is AdConfig {
  if (!input || typeof input !== "object") return false;
  return true;
}

export async function readAdConfig(): Promise<AdConfig> {
  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeAdConfig(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return defaultAdConfig;
  }
}

export async function saveAdConfig(config: AdConfig): Promise<AdConfig> {
  const normalized = normalizeAdConfig(config);
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(normalized, null, 2), { encoding: "utf8" });
  return normalized;
}
