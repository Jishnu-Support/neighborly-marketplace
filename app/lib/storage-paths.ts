import fs from "node:fs";
import path from "node:path";

/**
 * Resolves a persistent file storage path.
 * 1. Honors explicit environment variables if configured (e.g. NEIGHBORLY_BUSINESS_STORE).
 * 2. If running inside a Docker container with an attached persistent volume at /app/data,
 *    automatically stores data in /app/data to ensure zero data loss across deployments.
 * 3. Falls back to process.cwd() for local development.
 */
export function resolveStorePath(envVarName: string, defaultFilename: string): string {
  const envVal = process.env[envVarName]?.trim();
  if (envVal) {
    return envVal;
  }

  const dockerPersistentDir = "/app/data";
  try {
    if (fs.existsSync(dockerPersistentDir)) {
      return path.join(dockerPersistentDir, defaultFilename);
    }
  } catch {
    // Ignore and fall back to local cwd
  }

  return path.join(process.cwd(), defaultFilename);
}
