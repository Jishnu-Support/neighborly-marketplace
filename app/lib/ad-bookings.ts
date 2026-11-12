import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";
import {
  type AdBookingRequest,
  type AdSlotTiming,
  type AdViewRecord,
  type AdClickRecord,
  AD_TIME_SLOTS,
  calculateAdPricing,
  createSampleViewRecords,
  createSampleClickRecords,
  isAdActiveAt,
  resolveScheduledAds,
} from "./ad-booking.shared";
export { resolveScheduledAds, createSampleViewRecords, createSampleClickRecords };
import { type AdConfig } from "./ad-config.shared";
import { saveActivityLog } from "./activity-logs";
import { saveAdActivityLog } from "./ad-activity-logs";

const bookingsFilePath = resolveStorePath("NEIGHBORLY_AD_BOOKINGS_STORE", ".neighborly-ad-bookings.json");

export async function readAdBookings(): Promise<AdBookingRequest[]> {
  try {
    const raw = await readFile(bookingsFilePath, "utf8");
    const bookings = JSON.parse(raw);
    if (Array.isArray(bookings)) {
      let backfilled = false;
      for (const b of bookings) {
        if (!b.viewRecords) {
          b.viewRecords = [];
        }
        if (!b.clickRecords) {
          b.clickRecords = [];
        }
      }
      if (backfilled) {
        try {
          await saveAdBookings(bookings);
        } catch {}
      }
      return bookings;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveAdBookings(bookings: AdBookingRequest[]): Promise<AdBookingRequest[]> {
  await mkdir(path.dirname(bookingsFilePath), { recursive: true });
  const temporaryPath = `${bookingsFilePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(bookings, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, bookingsFilePath);
  return bookings;
}

export async function createAdBooking(
  request: Omit<AdBookingRequest, "id" | "createdAt" | "status" | "subtotal" | "gstAmount" | "totalAmount" | "baseRate"> & {
    status?: AdBookingRequest["status"];
    paymentMethod?: string;
    transactionId?: string;
  }
): Promise<AdBookingRequest> {
  const bookings = await readAdBookings();
  const id = `AD-REQ-${Math.floor(1000 + Math.random() * 9000)}`;

  const pricing = calculateAdPricing(request.format, request.slotTiming, request.durationDays);

  const newBooking: AdBookingRequest = {
    ...request,
    id,
    baseRate: pricing.baseDailyRate,
    subtotal: pricing.subtotal,
    gstAmount: pricing.gstAmount,
    totalAmount: pricing.totalAmount,
    status: request.status || "Pending Payment",
    createdAt: new Date().toISOString(),
  };

  bookings.unshift(newBooking);
  await saveAdBookings(bookings);

  try {
    await saveAdActivityLog({
      adBookingId: id,
      campaignTitle: newBooking.poster?.title || newBooking.businessName,
      businessName: newBooking.businessName,
      action: `Ad Campaign Booked: ${newBooking.businessName} (${newBooking.format} format, ${newBooking.durationDays} days)`,
      type: "Booking",
      surface: "Advertisement Billboard",
      actorName: newBooking.businessName,
      actorPhone: newBooking.contactPhone,
      actorRole: "Business",
      locality: (newBooking as any).locality || (newBooking as any).neighborhood || "Hosur",
      details: `Plan format: ${newBooking.format}, timing: ${newBooking.slotTiming}, total: INR ${newBooking.totalAmount}.`,
      metadata: { id, format: newBooking.format, totalAmount: newBooking.totalAmount },
    });
  } catch (e) {
    console.warn("Failed to log ad booking activity:", e);
  }

  return newBooking;
}

export async function updateAdBooking(
  id: string,
  updates: Partial<AdBookingRequest>
): Promise<AdBookingRequest | null> {
  const bookings = await readAdBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = bookings[index];
  const updated = { ...current, ...updates };

  // Re-calculate pricing if format, slotTiming, or durationDays changed
  if (
    updates.format ||
    updates.slotTiming ||
    typeof updates.durationDays === "number"
  ) {
    const pricing = calculateAdPricing(
      updated.format,
      updated.slotTiming,
      updated.durationDays
    );
    updated.baseRate = pricing.baseDailyRate;
    updated.subtotal = pricing.subtotal;
    updated.gstAmount = pricing.gstAmount;
    updated.totalAmount = pricing.totalAmount;
  }

  bookings[index] = updated;
  await saveAdBookings(bookings);

  try {
    if (updates.status === "Active") {
      await saveAdActivityLog({
        adBookingId: id,
        campaignTitle: updated.poster?.title || updated.businessName,
        businessName: updated.businessName,
        action: `Ad Campaign Approved & Activated: ${updated.businessName}`,
        type: "Approval",
        surface: "Billboard Network",
        actorName: "Company Admin",
        actorRole: "Admin",
        locality: (updated as any).locality || (updated as any).neighborhood || "Hosur",
        details: `Ad campaign ${id} verified and activated for live broadcast.`,
      });
    } else if (updates.status === "Rejected") {
      await saveAdActivityLog({
        adBookingId: id,
        campaignTitle: updated.poster?.title || updated.businessName,
        businessName: updated.businessName,
        action: `Ad Campaign Rejected: ${updated.businessName}`,
        type: "Rejection",
        surface: "Billboard Network",
        actorName: "Company Admin",
        actorRole: "Admin",
        locality: (updated as any).locality || (updated as any).neighborhood || "Hosur",
        details: `Ad campaign ${id} was rejected by company admin review.`,
      });
    }
  } catch {}

  return updated;
}

export async function deleteAdBooking(id: string): Promise<boolean> {
  const bookings = await readAdBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return false;
  const deleted = bookings.splice(index, 1)[0];
  await saveAdBookings(bookings);
  try {
    await saveActivityLog({
      action: `Ad Campaign Deleted: ${deleted.businessName}`,
      category: "Advertisement",
      actorRole: "Admin",
      actorName: "Ad Manager",
      details: `Ad booking ${deleted.id} deleted. Format: ${deleted.format}, Amount: ₹${deleted.totalAmount}`,
      metadata: { id, businessName: deleted.businessName, totalAmount: deleted.totalAmount },
    });
  } catch (e) {
    console.warn("Failed to log ad deletion activity:", e);
  }
  return true;
}

export async function markAdBookingPaid(
  id: string,
  paymentDetails: {
    paymentMethod: string;
    transactionId?: string;
  }
): Promise<AdBookingRequest | null> {
  const transactionId =
    paymentDetails.transactionId ||
    `TXN-AD-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const invoiceNumber = `INV-AD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const res = await updateAdBooking(id, {
    status: "Paid",
    paymentMethod: paymentDetails.paymentMethod,
    transactionId,
    invoiceNumber,
    paidAt: new Date().toISOString(),
  });

  if (res) {
    try {
      await saveAdActivityLog({
        adBookingId: id,
        campaignTitle: res.poster?.title || res.businessName,
        businessName: res.businessName,
        action: `Ad Payment Confirmed: ${res.businessName} (INR ${res.totalAmount})`,
        type: "Payment",
        surface: "Payment Gateway",
        actorName: res.businessName,
        actorPhone: res.contactPhone,
        actorRole: "Business",
        locality: (res as any).locality || (res as any).neighborhood || "Hosur",
        details: `Paid via ${paymentDetails.paymentMethod}. Transaction ID: ${transactionId}, Invoice: ${invoiceNumber}.`,
        metadata: { id, transactionId, invoiceNumber, amount: res.totalAmount },
      });
    } catch {}
  }

  return res;
}

export async function recordAdImpression(
  adBookingId: string,
  surface: "poster" | "content" | "video",
  viewerDetails?: {
    customerId?: string;
    viewerName?: string;
    viewerPhone?: string;
    viewerRole?: string;
    viewedDate?: string;
    viewedTime?: string;
    locality?: string;
    device?: string;
  }
): Promise<{ success: boolean; viewsCount: number; booking: AdBookingRequest; record?: AdViewRecord } | null> {
  const bookings = await readAdBookings();
  const booking = bookings.find((b) => b.id === adBookingId);
  if (!booking) return null;

  booking.viewsCount = (booking.viewsCount || 0) + 1;
  if (!booking.impressionsBySurface) {
    booking.impressionsBySurface = { poster: 0, content: 0, video: 0 };
  }
  booking.impressionsBySurface[surface] = (booking.impressionsBySurface[surface] || 0) + 1;
  const now = new Date();
  const isoNow = now.toISOString();
  booking.lastViewedAt = isoNow;

  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const surfaceLabels = {
    poster: "Poster Billboard",
    content: "Marquee Ticker",
    video: "Video Spotlight",
  };

  const customerId =
    viewerDetails?.customerId ||
    (viewerDetails?.viewerPhone
      ? `CUST-HSR-${viewerDetails.viewerPhone.replace(/\D/g, "").slice(-5) || "001"}`
      : `CUST-HSR-${Math.floor(10000 + Math.random() * 90000)}`);

  const newRecord: AdViewRecord = {
    id: `view_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adBookingId,
    customerId,
    viewerName: viewerDetails?.viewerName || "Hosur Neighbor",
    viewerPhone: viewerDetails?.viewerPhone || "",
    viewerRole: viewerDetails?.viewerRole || "Customer",
    surface,
    surfaceLabel: surfaceLabels[surface] || "Poster Billboard",
    viewedAt: isoNow,
    viewedDate: viewerDetails?.viewedDate || dateStr,
    viewedTime: viewerDetails?.viewedTime || timeStr,
    locality: viewerDetails?.locality || "Hosur, Tamil Nadu",
    device: viewerDetails?.device || "Mobile / Web",
  };

  if (!booking.viewRecords) {
    booking.viewRecords = [];
  }
  booking.viewRecords.unshift(newRecord);
  if (booking.viewRecords.length > 200) {
    booking.viewRecords = booking.viewRecords.slice(0, 200);
  }

  await saveAdBookings(bookings);

  // Record dedicated ad activity log
  try {
    await saveAdActivityLog({
      adBookingId,
      campaignTitle: booking.poster?.title || booking.businessName,
      businessName: booking.businessName,
      action: `Ad Impression: ${booking.poster?.title || booking.businessName}`,
      type: "Impression",
      surface: surfaceLabels[surface] || surface,
      actorName: viewerDetails?.viewerName || "Local Shopper",
      actorPhone: viewerDetails?.viewerPhone || "",
      actorRole: (viewerDetails?.viewerRole as any) || "Customer",
      locality: viewerDetails?.locality || "Hosur",
      details: `Ad banner viewed on ${surfaceLabels[surface] || surface} (${viewerDetails?.device || "Browser"}).`,
      metadata: { adBookingId, surface, businessName: booking.businessName },
    });
  } catch (err) {
    console.warn("Failed to save ad activity log:", err);
  }

  return { success: true, viewsCount: booking.viewsCount, booking, record: newRecord };
}

export async function recordAdClick(
  adBookingId: string,
  action: "call" | "whatsapp" | "view_store" | "navigate",
  viewerDetails?: {
    customerId?: string;
    viewerName?: string;
    viewerPhone?: string;
    locality?: string;
    device?: string;
  }
): Promise<{ success: boolean; clicksCount: number; booking: AdBookingRequest; record?: AdClickRecord } | null> {
  const bookings = await readAdBookings();
  const booking = bookings.find((b) => b.id === adBookingId);
  if (!booking) return null;

  booking.clicksCount = (booking.clicksCount || 0) + 1;
  const now = new Date();
  const isoNow = now.toISOString();

  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const actionLabels: Record<string, string> = {
    call: "Phone Call Placed",
    whatsapp: "WhatsApp Lead",
    view_store: "Visited Business Profile",
    navigate: "Directions / Map Route",
  };

  const customerId =
    viewerDetails?.customerId ||
    (viewerDetails?.viewerPhone
      ? `CUST-HSR-${viewerDetails.viewerPhone.replace(/\D/g, "").slice(-5) || "001"}`
      : `CUST-HSR-${Math.floor(10000 + Math.random() * 90000)}`);

  const newRecord: AdClickRecord = {
    id: `click_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adBookingId,
    customerId,
    action,
    actionLabel: actionLabels[action] || "Customer Ad Interaction",
    viewerName: viewerDetails?.viewerName || "Hosur Customer",
    viewerPhone: viewerDetails?.viewerPhone || "",
    clickedAt: isoNow,
    clickedDate: dateStr,
    clickedTime: timeStr,
    locality: viewerDetails?.locality || "Hosur, Tamil Nadu",
    device: viewerDetails?.device || "Mobile / Web",
  };

  if (!booking.clickRecords) {
    booking.clickRecords = [];
  }
  booking.clickRecords.unshift(newRecord);
  if (booking.clickRecords.length > 200) {
    booking.clickRecords = booking.clickRecords.slice(0, 200);
  }

  await saveAdBookings(bookings);

  // Record advertisement interaction & call activity log
  try {
    if (action === "call") {
      await saveActivityLog({
        action: `Phone Call: ${booking.businessName} (${booking.contactPhone || "Ad Dialer"})`,
        category: "Call",
        actorName: viewerDetails?.viewerName || "Visitor",
        actorPhone: viewerDetails?.viewerPhone || "",
        actorRole: "Customer",
        locality: viewerDetails?.locality || "Hosur",
        details: `User clicked direct Call button on ${booking.businessName}'s advertisement billboard.`,
        metadata: {
          adBookingId,
          businessName: booking.businessName,
          targetPhone: booking.contactPhone,
          targetType: "Business Ad",
        },
      });
    }

    await saveAdActivityLog({
      adBookingId,
      campaignTitle: booking.poster?.title || booking.businessName,
      businessName: booking.businessName,
      action: `Ad Click: ${actionLabels[action] || action}`,
      type: "Click",
      surface: "Ad Billboard Banner",
      actorName: viewerDetails?.viewerName || "Visitor",
      actorPhone: viewerDetails?.viewerPhone || "",
      actorRole: "Customer",
      locality: viewerDetails?.locality || "Hosur",
      details: `Lead clicked "${actionLabels[action] || action}" on ${booking.businessName}'s campaign (${viewerDetails?.device || "Mobile / Web"}).`,
      metadata: { action, device: viewerDetails?.device },
    });
  } catch {
    // Non-blocking log
  }

  return { success: true, clicksCount: booking.clicksCount, booking, record: newRecord };
}
