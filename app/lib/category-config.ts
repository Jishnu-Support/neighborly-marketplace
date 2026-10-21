import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultCategoryConfig, legacyDefaultCategoryConfig, type CategoryConfig, type CategorySector } from "./category-config.shared";

const configPath = process.env.NEIGHBORLY_CATEGORY_CONFIG_STORE || path.join(process.cwd(), ".neighborly-category-config.json");

function buildTree(paths: string[][]) {
  const roots: { name: string; children: { name: string; children: any[] }[] }[] = [];
  for (const path of paths) {
    let level: any[] = roots;
    for (const name of path) {
      let node = level.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (!node) { node = { name, children: [] }; level.push(node); }
      level = node.children;
    }
  }
  return roots;
}

export function validateCategoryConfig(input: unknown): input is CategoryConfig {
  if (!input || typeof input !== "object") return false;
  const sectors = (input as { sectors?: unknown }).sectors;
  if (!Array.isArray(sectors) || sectors.length < 1 || sectors.length > 30) return false;
  const names = new Set<string>();
  for (const value of sectors) {
    if (!value || typeof value !== "object") return false;
    const sector = value as Partial<CategorySector>;
    if (typeof sector.name !== "string" || !sector.name.trim() || sector.name.trim().length > 60 ||
      typeof sector.icon !== "string" || !sector.icon.trim() || sector.icon.length > 8 ||
      !Array.isArray(sector.paths) || sector.paths.length > 1000) return false;
    const normalized = sector.name.trim().toLowerCase();
    if (normalized === "all" || names.has(normalized)) return false;
    names.add(normalized);
    const paths = new Set<string>();
    for (const path of sector.paths) {
      if (!Array.isArray(path) || path.length < 1 || path.length > 5 ||
        !path.every((part) => typeof part === "string" && part.trim().length > 0 && part.trim().length <= 60)) return false;
      const normalizedPath = path.map((part) => part.trim().toLowerCase()).join("/");
      if (paths.has(normalizedPath)) return false;
      paths.add(normalizedPath);
    }
    const checkChildren = (nodes: { name: string; children: any[] }[], depth = 0): boolean =>
      nodes.length <= (depth < 2 ? 6 : 100) && nodes.every((node) => checkChildren(node.children, depth + 1));
    if (!checkChildren(buildTree(sector.paths))) return false;
  }
  return true;
}

export async function readCategoryConfig(): Promise<CategoryConfig> {
  try {
    const parsed = JSON.parse(await readFile(configPath, "utf8")) as unknown;
    if (!validateCategoryConfig(parsed)) return defaultCategoryConfig;
    // Migrate bundled legacy paths only when they still match the original defaults.
    // This preserves any taxonomy an Admin or Super Admin has customized.
    const migratedSectors = parsed.sectors.map((sector) => {
      const current = sector.name.trim().toLowerCase();
      const nextDefault = defaultCategoryConfig.sectors.find((item) => item.name.trim().toLowerCase() === current);
      const previousDefault = legacyDefaultCategoryConfig.sectors.find((item) => item.name.trim().toLowerCase() === current);
      if (!nextDefault) return sector;
      const hasSalesOrService = sector.paths.some((item) => ["sales", "service"].includes(item[0]?.trim().toLowerCase() || ""));
      if (current === "electronics" && !hasSalesOrService) return { ...sector, paths: nextDefault.paths };
      if (current === "automobiles" && previousDefault && JSON.stringify(sector.paths) === JSON.stringify(previousDefault.paths)) {
        return { ...sector, icon: nextDefault.icon };
      }
      if (current !== "automobiles" && previousDefault && JSON.stringify(sector.paths) === JSON.stringify(previousDefault.paths)) {
        return { ...sector, paths: nextDefault.paths };
      }
      return sector;
    });
    return { ...parsed, sectors: migratedSectors };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return defaultCategoryConfig;
  }
}

export async function saveCategoryConfig(config: CategoryConfig) {
  const normalized: CategoryConfig = {
    sectors: config.sectors.map((sector) => ({
      name: sector.name.trim(),
      icon: sector.icon.trim(),
      paths: sector.paths.map((path) => path.map((part) => part.trim())),
    })),
  };
  await mkdir(path.dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(normalized, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, configPath);
  return normalized;
}
