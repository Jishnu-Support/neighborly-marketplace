import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultAdConfig,
  defaultPopupAdConfig,
  defaultVideoSettings,
  defaultInitialVideoAds,
  defaultTickerMessages,
  defaultInitialImageAds,
  type AdConfig,
  type VideoAd,
  type VideoAdSettings,
  type PopupAdConfig,
} from "./ad-config.shared";
import { resolveStorePath } from "./storage-paths";
import { saveActivityLog } from "./activity-logs";
import { saveAdActivityLog } from "./ad-activity-logs";

const configPath = resolveStorePath("NEIGHBORLY_AD_CONFIG_STORE", ".neighborly-ad-config.json");

export function normalizeAdConfig(input: unknown): AdConfig {
  if (!input || typeof input !== "object") {
    return defaultAdConfig;
  }
  const raw = input as Record<string, unknown>;

  // 1. Ticker messages (trim strings, filter empty, max 20)
  const rawTickerMessages = Array.isArray(raw.tickerMessages)
    ? raw.tickerMessages
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 20)
    : [];

  const tickerMessages = rawTickerMessages.length > 0 ? rawTickerMessages : defaultTickerMessages;

  // 2. Image ads (allow any valid image URL, root path, or data URI)
  const rawImageAds: AdConfig["imageAds"] = Array.isArray(raw.imageAds)
    ? raw.imageAds
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item, idx) => ({
          id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `ad-${idx + 1}`,
          adBookingId: typeof item.adBookingId === "string" && item.adBookingId.trim() ? item.adBookingId.trim() : undefined,
          businessName: typeof item.businessName === "string" && item.businessName.trim() ? item.businessName.trim() : undefined,
          label: typeof item.label === "string" && item.label.trim() ? item.label.trim().slice(0, 100) : "Featured Store",
          title: typeof item.title === "string" && item.title.trim() ? item.title.trim().slice(0, 120) : "Discover this business",
          image: typeof item.image === "string" ? item.image.trim() : "",
          tone: typeof item.tone === "string" && item.tone.trim() ? item.tone.trim().slice(0, 40) : "community",
          viewsCount: typeof item.viewsCount === "number" ? item.viewsCount : 0,
          locality: typeof item.locality === "string" && item.locality.trim() ? item.locality.trim() : undefined,
          category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : undefined,
          distanceKm: typeof item.distanceKm === "number" ? item.distanceKm : undefined,
        }))
        .slice(0, 20)
    : [];

  const imageAds = rawImageAds.length > 0 ? rawImageAds : defaultInitialImageAds;

  // 3. Video ad (optional or populated)
  const rawVideo = raw.videoAd && typeof raw.videoAd === "object" ? (raw.videoAd as Record<string, unknown>) : {};
  const videoAd: AdConfig["videoAd"] = {
    title: typeof rawVideo.title === "string" ? rawVideo.title.trim().slice(0, 120) : "",
    description: typeof rawVideo.description === "string" ? rawVideo.description.trim().slice(0, 300) : "",
    sourceUrl: typeof rawVideo.sourceUrl === "string" ? rawVideo.sourceUrl.trim() : "",
    posterUrl: typeof rawVideo.posterUrl === "string" && rawVideo.posterUrl.trim() ? rawVideo.posterUrl.trim() : "/bizearch-splash-banner.png",
    callToAction: typeof rawVideo.callToAction === "string" && rawVideo.callToAction.trim() ? rawVideo.callToAction.trim().slice(0, 60) : "Learn More",
    viewsCount: typeof rawVideo.viewsCount === "number" ? rawVideo.viewsCount : 0,
    locality: typeof rawVideo.locality === "string" ? rawVideo.locality : undefined,
    category: typeof rawVideo.category === "string" ? rawVideo.category : undefined,
  };

  // 3b. Multiple cyclic video ads
  const rawVideoAds: VideoAd[] = Array.isArray(raw.videoAds) && raw.videoAds.length > 0
    ? raw.videoAds
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item, idx) => ({
          id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `video-ad-${idx + 1}`,
          adBookingId: typeof item.adBookingId === "string" ? item.adBookingId.trim() : undefined,
          businessName: typeof item.businessName === "string" ? item.businessName.trim() : undefined,
          title: typeof item.title === "string" ? item.title.trim().slice(0, 120) : "Bizearch Video Spotlight",
          description: typeof item.description === "string" ? item.description.trim().slice(0, 300) : "",
          sourceUrl: typeof item.sourceUrl === "string" ? item.sourceUrl.trim() : "",
          posterUrl: typeof item.posterUrl === "string" && item.posterUrl.trim() ? item.posterUrl.trim() : "/bizearch-splash-banner.png",
          callToAction: typeof item.callToAction === "string" && item.callToAction.trim() ? item.callToAction.trim().slice(0, 60) : "Learn More",
          keywords: Array.isArray(item.keywords) ? item.keywords.filter((k): k is string => typeof k === "string").map((k) => k.trim()) : undefined,
          category: typeof item.category === "string" ? item.category.trim() : undefined,
          viewsCount: typeof item.viewsCount === "number" ? item.viewsCount : 0,
          locality: typeof item.locality === "string" ? item.locality : undefined,
        }))
    : (videoAd.sourceUrl ? [videoAd] : defaultInitialVideoAds);

  const videoAds = rawVideoAds.length > 0 ? rawVideoAds : defaultInitialVideoAds;

  // 3c. Video settings (splash screen & timing)
  const rawVidSettings = raw.videoSettings && typeof raw.videoSettings === "object" ? (raw.videoSettings as Record<string, unknown>) : {};
  const videoSettings: VideoAdSettings = {
    splashDurationSeconds: typeof rawVidSettings.splashDurationSeconds === "number" && rawVidSettings.splashDurationSeconds >= 1 ? Math.min(30, Math.round(rawVidSettings.splashDurationSeconds)) : defaultVideoSettings.splashDurationSeconds,
    splashImageUrl: typeof rawVidSettings.splashImageUrl === "string" && rawVidSettings.splashImageUrl.trim() ? rawVidSettings.splashImageUrl.trim() : defaultVideoSettings.splashImageUrl,
    splashTagline: typeof rawVidSettings.splashTagline === "string" && rawVidSettings.splashTagline.trim() ? rawVidSettings.splashTagline.trim().slice(0, 100) : defaultVideoSettings.splashTagline,
    autoCycleIntervalSeconds: typeof rawVidSettings.autoCycleIntervalSeconds === "number" && rawVidSettings.autoCycleIntervalSeconds >= 3 ? Math.round(rawVidSettings.autoCycleIntervalSeconds) : defaultVideoSettings.autoCycleIntervalSeconds,
  };

  // 3d. Popup video ads config
  const rawPopup = raw.popupAdConfig && typeof raw.popupAdConfig === "object" ? (raw.popupAdConfig as Record<string, unknown>) : {};
  const popupAdConfig: PopupAdConfig = {
    enabled: rawPopup.enabled !== false,
    mandatoryWatchSeconds: typeof rawPopup.mandatoryWatchSeconds === "number" && rawPopup.mandatoryWatchSeconds >= 1 ? Math.min(120, Math.round(rawPopup.mandatoryWatchSeconds)) : defaultPopupAdConfig.mandatoryWatchSeconds,
    firstAdDelaySeconds: typeof rawPopup.firstAdDelaySeconds === "number" && rawPopup.firstAdDelaySeconds >= 5 ? Math.round(rawPopup.firstAdDelaySeconds) : defaultPopupAdConfig.firstAdDelaySeconds,
    secondAdDelaySeconds: typeof rawPopup.secondAdDelaySeconds === "number" && rawPopup.secondAdDelaySeconds >= 10 ? Math.round(rawPopup.secondAdDelaySeconds) : defaultPopupAdConfig.secondAdDelaySeconds,
    thirdAdDelaySeconds: typeof rawPopup.thirdAdDelaySeconds === "number" && rawPopup.thirdAdDelaySeconds >= 10 ? Math.round(rawPopup.thirdAdDelaySeconds) : defaultPopupAdConfig.thirdAdDelaySeconds,
    repeatIntervalSeconds: typeof rawPopup.repeatIntervalSeconds === "number" && rawPopup.repeatIntervalSeconds >= 10 ? Math.round(rawPopup.repeatIntervalSeconds) : defaultPopupAdConfig.repeatIntervalSeconds,
    searchTriggerEnabled: rawPopup.searchTriggerEnabled !== false,
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
    videoAd: videoAds[0] || videoAd,
    videoAds,
    videoSettings,
    popupAdConfig,
    audioAd,
  };
}

export function validateAdConfig(input: unknown): input is AdConfig {
  if (!input || typeof input !== "object") return false;
  const config = input as Partial<AdConfig>;
  if (!Array.isArray(config.tickerMessages) || !Array.isArray(config.imageAds) || typeof config.videoAd !== "object" || typeof config.audioAd !== "object") {
    return false;
  }
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

export async function recordPlatformAdImpression(params: {
  adId?: string;
  adTitle?: string;
  businessName?: string;
  surface?: "poster" | "content" | "video";
  viewerDetails?: {
    customerId?: string;
    viewerName?: string;
    viewerPhone?: string;
    viewerRole?: string;
    viewedDate?: string;
    viewedTime?: string;
    locality?: string;
    device?: string;
  };
}): Promise<{ success: boolean; viewsCount: number }> {
  const config = await readAdConfig();
  const surface = params.surface || "poster";
  let targetAdTitle = params.adTitle || params.businessName || "Featured Store";
  let viewsCount = 1;

  if (surface === "video") {
    let matchedVideo = config.videoAds?.find(
      (v) => (params.adId && v.id === params.adId) || (params.adTitle && v.title === params.adTitle)
    );
    if (matchedVideo) {
      matchedVideo.viewsCount = (matchedVideo.viewsCount || 0) + 1;
      viewsCount = matchedVideo.viewsCount;
      targetAdTitle = matchedVideo.title || targetAdTitle;
    } else {
      config.videoAd.viewsCount = (config.videoAd.viewsCount || 0) + 1;
      viewsCount = config.videoAd.viewsCount;
      targetAdTitle = config.videoAd.title || targetAdTitle;
    }
  } else {
    // Find matching image ad by id, title or label
    const adId = params.adId;
    let matchedAd = config.imageAds.find(
      (a) => (adId && a.id === adId) || (params.adTitle && a.title === params.adTitle) || (params.businessName && a.label.includes(params.businessName))
    );

    if (matchedAd) {
      matchedAd.viewsCount = (matchedAd.viewsCount || 0) + 1;
      viewsCount = matchedAd.viewsCount;
      targetAdTitle = matchedAd.title || matchedAd.label || targetAdTitle;
    } else if (config.imageAds.length > 0) {
      const idx = adId && adId.startsWith("ad-") ? parseInt(adId.replace("ad-", ""), 10) - 1 : 0;
      const target = config.imageAds[idx] || config.imageAds[0];
      target.viewsCount = (target.viewsCount || 0) + 1;
      viewsCount = target.viewsCount;
      targetAdTitle = target.title || target.label || targetAdTitle;
    }
  }

  await saveAdConfig(config);

  // Save dedicated ad activity log
  try {
    await saveAdActivityLog({
      campaignTitle: targetAdTitle,
      businessName: params.businessName || targetAdTitle,
      action: `Ad Impression: ${targetAdTitle}`,
      type: "Impression",
      surface: surface === "video" ? "Video Spotlight" : surface === "content" ? "Marquee Ticker" : "Poster Billboard",
      actorName: params.viewerDetails?.viewerName || "Local Shopper",
      actorPhone: params.viewerDetails?.viewerPhone || "",
      actorRole: (params.viewerDetails?.viewerRole as any) || "Customer",
      locality: params.viewerDetails?.locality || "Hosur",
      details: `Viewed on ${surface === "video" ? "Video Spotlight" : surface === "content" ? "Marquee Ticker" : "Poster Billboard"} (${params.viewerDetails?.device || "Mobile / Web"}).`,
      metadata: {
        adId: params.adId,
        title: targetAdTitle,
        surface,
      },
    });
  } catch (err) {
    console.warn("Failed to save ad view activity log:", err);
  }

  return { success: true, viewsCount };
}

export async function recordPlatformAdClick(params: {
  adId?: string;
  adTitle?: string;
  businessName?: string;
  action: "call" | "whatsapp" | "view_store" | "navigate";
  viewerDetails?: {
    customerId?: string;
    viewerName?: string;
    viewerPhone?: string;
    locality?: string;
    device?: string;
  };
}): Promise<{ success: boolean }> {
  const actionLabels: Record<string, string> = {
    call: "Phone Call Placed",
    whatsapp: "WhatsApp Lead",
    view_store: "Visited Store Profile",
    navigate: "Directions / Map Route",
  };

  const targetName = params.businessName || params.adTitle || "Featured Business";

  try {
    if (params.action === "call") {
      await saveActivityLog({
        action: `Phone Call: ${targetName}`,
        category: "Call",
        actorName: params.viewerDetails?.viewerName || "Visitor",
        actorPhone: params.viewerDetails?.viewerPhone || "",
        actorRole: "Customer",
        locality: params.viewerDetails?.locality || "Hosur",
        details: `User clicked direct Call button on ${targetName}'s advertisement billboard.`,
        metadata: {
          adId: params.adId,
          businessName: targetName,
        },
      });
    }

    await saveAdActivityLog({
      campaignTitle: targetName,
      businessName: targetName,
      action: `Ad Click: ${actionLabels[params.action] || params.action}`,
      type: "Click",
      surface: "Poster Billboard",
      actorName: params.viewerDetails?.viewerName || "Visitor",
      actorPhone: params.viewerDetails?.viewerPhone || "",
      actorRole: "Customer",
      locality: params.viewerDetails?.locality || "Hosur",
      details: `Lead clicked "${actionLabels[params.action] || params.action}" on ${targetName}'s ad banner.`,
      metadata: {
        adId: params.adId,
        businessName: targetName,
        action: params.action,
      },
    });
  } catch (err) {
    console.warn("Failed to record platform ad lead:", err);
  }

  return { success: true };
}
