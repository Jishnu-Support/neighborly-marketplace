import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "@/app/lib/storage-paths";

export type UsedProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  negotiable?: boolean;
  condition: string; // "Brand New" | "Like New" | "Good Condition" | "Fair Condition"
  description: string;
  location: string;
  images: string[];
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp?: string;
  createdAt: string;
  status: "active" | "sold";
};

const storePath = resolveStorePath("NEIGHBORLY_USED_PRODUCTS_STORE", ".neighborly-used-products.json");

export async function readUsedProducts(): Promise<UsedProduct[]> {
  try {
    const raw = await readFile(storePath, { encoding: "utf8" });
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await writeUsedProducts([]);
      return [];
    }
    return [];
  }
}

export async function writeUsedProducts(products: UsedProduct[]): Promise<void> {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(products, null, 2), { encoding: "utf8" });
}

export async function listUsedProducts(options?: {
  query?: string;
  category?: string;
  status?: "active" | "sold" | "all";
}): Promise<UsedProduct[]> {
  const all = await readUsedProducts();
  const q = options?.query?.trim().toLowerCase();
  const cat = options?.category?.trim().toLowerCase();
  const statusFilter = options?.status || "active";

  return all.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    if (cat && cat !== "all" && item.category.toLowerCase() !== cat) {
      return false;
    }
    if (q) {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchSeller = item.sellerName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat && !matchSeller) {
        return false;
      }
    }
    return true;
  });
}

export async function createUsedProduct(input: {
  title: string;
  category: string;
  price: number;
  negotiable?: boolean;
  condition: string;
  description: string;
  location: string;
  images: string[];
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp?: string;
}): Promise<UsedProduct> {
  const products = await readUsedProducts();

  const newProduct: UsedProduct = {
    id: `used-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
    title: input.title.trim(),
    category: input.category.trim() || "Other",
    price: Math.max(0, Math.round(Number(input.price) || 0)),
    negotiable: Boolean(input.negotiable),
    condition: input.condition.trim() || "Good Condition",
    description: input.description.trim(),
    location: input.location.trim() || "Local Area",
    images: Array.isArray(input.images) ? input.images.filter((url) => typeof url === "string" && url.trim().length > 0) : [],
    sellerName: input.sellerName.trim() || "Community Member",
    sellerPhone: input.sellerPhone.trim(),
    sellerWhatsapp: input.sellerWhatsapp?.trim() || input.sellerPhone.trim(),
    createdAt: new Date().toISOString(),
    status: "active",
  };

  products.unshift(newProduct);
  await writeUsedProducts(products);
  return newProduct;
}

export async function markUsedProductStatus(id: string, status: "active" | "sold"): Promise<UsedProduct | null> {
  const products = await readUsedProducts();
  const product = products.find((p) => p.id === id);
  if (!product) return null;

  product.status = status;
  await writeUsedProducts(products);
  return product;
}

export async function deleteUsedProduct(id: string): Promise<boolean> {
  const products = await readUsedProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  await writeUsedProducts(products);
  return true;
}
