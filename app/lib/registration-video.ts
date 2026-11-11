import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultRegistrationVideoConfig,
  type RegistrationVideoConfig,
} from "./registration-video.shared";
import { resolveStorePath } from "./storage-paths";

const configPath = resolveStorePath(
  "NEIGHBORLY_REGISTRATION_VIDEO_STORE",
  ".neighborly-registration-video.json"
);

export function validateRegistrationVideoConfig(
  input: unknown
): input is RegistrationVideoConfig {
  if (!input || typeof input !== "object") return false;
  const cfg = input as Partial<RegistrationVideoConfig>;
  if (typeof cfg.enabled !== "boolean") return false;
  if (cfg.type !== "upload" && cfg.type !== "youtube") return false;
  if (typeof cfg.videoUrl !== "string") return false;
  if (typeof cfg.youtubeUrl !== "string") return false;
  if (typeof cfg.title !== "string" || !cfg.title.trim()) return false;
  if (typeof cfg.buttonText !== "string" || !cfg.buttonText.trim()) return false;
  return true;
}

export async function readRegistrationVideoConfig(): Promise<RegistrationVideoConfig> {
  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (validateRegistrationVideoConfig(parsed)) {
      return parsed;
    }
    return defaultRegistrationVideoConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Failed to read registration video config:", error);
    }
    return defaultRegistrationVideoConfig;
  }
}

export async function saveRegistrationVideoConfig(
  config: RegistrationVideoConfig
): Promise<RegistrationVideoConfig> {
  const normalized: RegistrationVideoConfig = {
    enabled: Boolean(config.enabled),
    type: config.type === "youtube" ? "youtube" : "upload",
    videoUrl: (config.videoUrl || "").trim(),
    fileName: (config.fileName || "").trim(),
    fileSize: typeof config.fileSize === "number" ? config.fileSize : undefined,
    youtubeUrl: (config.youtubeUrl || "").trim(),
    title: (config.title || "How to Register Your Business").trim(),
    buttonText: (config.buttonText || "How to Register ?").trim(),
    updatedAt: new Date().toISOString(),
  };

  await mkdir(path.dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(normalized, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, configPath);
  return normalized;
}
