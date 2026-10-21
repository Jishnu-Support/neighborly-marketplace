import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultAdConfig, type AdConfig } from "./ad-config.shared";

const configPath = process.env.NEIGHBORLY_AD_CONFIG_STORE || path.join(process.cwd(), ".neighborly-ad-config.json");

export async function readAdConfig(): Promise<AdConfig> {
  try {
    const parsed = JSON.parse(await readFile(configPath, "utf8")) as Partial<AdConfig>;
    return { ...defaultAdConfig, ...parsed, audioAd: parsed.audioAd || defaultAdConfig.audioAd };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return defaultAdConfig;
  }
}

export async function saveAdConfig(config: AdConfig) {
  await mkdir(path.dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(config, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, configPath);
  return config;
}

export function validateAdConfig(input: unknown): input is AdConfig {
  if (!input || typeof input !== "object") return false;
  const value = input as Record<string, unknown>;
  const validUrl = (candidate: unknown) => {
    if (typeof candidate !== "string" || candidate.length > 2000) return false;
    if (/^\/api\/ads\/media\/[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif|mp4|webm|mp3|mpeg|mpga|mp2|m4a|wav|ogg)$/i.test(candidate)) return true;
    try { return new URL(candidate).protocol === "https:"; } catch { return false; }
  };
  if (!Array.isArray(value.tickerMessages) || value.tickerMessages.length < 1 || value.tickerMessages.length > 6 ||
    !value.tickerMessages.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 140)) return false;
  if (!Array.isArray(value.imageAds) || value.imageAds.length < 1 || value.imageAds.length > 8 ||
    !value.imageAds.every((item) => item && typeof item === "object" &&
      typeof item.label === "string" && item.label.trim().length > 0 && item.label.length <= 80 &&
      typeof item.title === "string" && item.title.trim().length > 0 && item.title.length <= 100 &&
      validUrl(item.image) && typeof item.tone === "string" && /^[a-z0-9_-]{1,30}$/i.test(item.tone))) return false;
  const video = value.videoAd as Record<string, unknown> | null;
  const videoValid = Boolean(video && typeof video.title === "string" && video.title.trim().length > 0 && video.title.length <= 100 &&
    typeof video.description === "string" && video.description.trim().length > 0 && video.description.length <= 220 &&
    typeof video.callToAction === "string" && video.callToAction.trim().length > 0 && video.callToAction.length <= 50 &&
    validUrl(video.sourceUrl) && (video.posterUrl === "" || validUrl(video.posterUrl)));
  const audio = value.audioAd as Record<string, unknown> | null;
  const audioValid = Boolean(audio && typeof audio.title === "string" && audio.title.trim().length > 0 && audio.title.length <= 100 &&
    typeof audio.description === "string" && audio.description.trim().length > 0 && audio.description.length <= 220 &&
    (audio.sourceUrl === "" || validUrl(audio.sourceUrl)));
  return videoValid && audioValid;
}
