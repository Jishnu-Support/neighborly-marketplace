import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";
import { saveActivityLog } from "./activity-logs";
import { QuoteStatus, QuoteEnquiry } from "./quotes.shared";

export type { QuoteStatus, QuoteEnquiry };

export type NewQuoteInput = {
  businessId?: string;
  businessName: string;
  businessPhone?: string;
  businessEmail?: string;
  productName?: string;
  productPrice?: number;
  productUnit?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerLocality?: string;
  message: string;
};

const quotesPath = resolveStorePath("NEIGHBORLY_QUOTES_STORE", ".neighborly-quotes.json");

async function readQuotesFile(): Promise<QuoteEnquiry[]> {
  try {
    const raw = await readFile(quotesPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as QuoteEnquiry[];
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    return [];
  }
}

async function writeQuotesFile(quotes: QuoteEnquiry[]): Promise<void> {
  await mkdir(path.dirname(quotesPath), { recursive: true });
  const temporaryPath = `${quotesPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(quotes, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, quotesPath);
}

export async function createQuoteEnquiry(input: NewQuoteInput): Promise<QuoteEnquiry> {
  const quotes = await readQuotesFile();
  const cleanPhone = (input.customerPhone || "").replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : input.customerPhone.trim();

  const record: QuoteEnquiry = {
    id: `quote-${Date.now()}-${randomUUID().slice(0, 8)}`,
    businessId: input.businessId || undefined,
    businessName: input.businessName.trim(),
    businessPhone: input.businessPhone?.trim(),
    businessEmail: input.businessEmail?.trim().toLowerCase(),
    productName: input.productName?.trim() || "Custom Quote / Estimate",
    productPrice: input.productPrice,
    productUnit: input.productUnit?.trim(),
    customerName: input.customerName.trim(),
    customerPhone: formattedPhone,
    customerEmail: input.customerEmail?.trim().toLowerCase() || undefined,
    customerLocality: input.customerLocality?.trim() || undefined,
    message: input.message.trim(),
    status: "New",
    createdAt: new Date().toISOString(),
  };

  await writeQuotesFile([record, ...quotes]);

  // Log persistent activity log with category "Lead"
  try {
    await saveActivityLog({
      action: `Quote enquiry sent to "${record.businessName}"`,
      category: "Lead",
      actorName: record.customerName,
      actorPhone: record.customerPhone,
      actorRole: "Customer",
      locality: record.customerLocality || "Hosur",
      details: `${record.productName}: "${record.message.slice(0, 150)}"${
        record.productPrice ? ` (Estimated ₹${record.productPrice})` : ""
      }. Customer contact: ${record.customerPhone}${record.customerEmail ? ` · ${record.customerEmail}` : ""}.`,
      metadata: {
        quoteId: record.id,
        businessName: record.businessName,
        productName: record.productName,
        customerName: record.customerName,
        customerPhone: record.customerPhone,
      },
    });
  } catch {}

  return record;
}

export async function listAllQuotes(): Promise<QuoteEnquiry[]> {
  return readQuotesFile();
}

export async function listQuotesForBusiness(businessIdentifier: string): Promise<QuoteEnquiry[]> {
  const quotes = await readQuotesFile();
  const normalized = businessIdentifier.trim().toLowerCase();
  const cleanDigits = normalized.replace(/\D/g, "");

  return quotes.filter((q) => {
    if (q.businessId && q.businessId.toLowerCase() === normalized) return true;
    if (q.businessName && q.businessName.toLowerCase() === normalized) return true;
    if (q.businessName && q.businessName.toLowerCase().includes(normalized)) return true;
    if (q.businessEmail && q.businessEmail.toLowerCase() === normalized) return true;
    if (cleanDigits.length >= 8 && q.businessPhone) {
      const bDigits = q.businessPhone.replace(/\D/g, "");
      if (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits)) return true;
    }
    return false;
  });
}

export async function listQuotesForCustomer(customerIdentifier: string): Promise<QuoteEnquiry[]> {
  const quotes = await readQuotesFile();
  const normalized = customerIdentifier.trim().toLowerCase();
  const cleanDigits = normalized.replace(/\D/g, "");

  return quotes.filter((q) => {
    if (q.customerEmail && q.customerEmail.toLowerCase() === normalized) return true;
    if (q.customerName && q.customerName.toLowerCase() === normalized) return true;
    if (cleanDigits.length >= 8 && q.customerPhone) {
      const cDigits = q.customerPhone.replace(/\D/g, "");
      if (cDigits === cleanDigits || cDigits.endsWith(cleanDigits) || cleanDigits.endsWith(cDigits)) return true;
    }
    return false;
  });
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus,
  replyNote?: string
): Promise<QuoteEnquiry | null> {
  const quotes = await readQuotesFile();
  const index = quotes.findIndex((q) => q.id === id);
  if (index === -1) return null;

  quotes[index].status = status;
  if (replyNote !== undefined) quotes[index].replyNote = replyNote.trim();
  quotes[index].updatedAt = new Date().toISOString();

  await writeQuotesFile(quotes);
  return quotes[index];
}

export async function deleteQuote(id: string): Promise<boolean> {
  const quotes = await readQuotesFile();
  const next = quotes.filter((q) => q.id !== id);
  if (next.length === quotes.length) return false;
  await writeQuotesFile(next);
  return true;
}
