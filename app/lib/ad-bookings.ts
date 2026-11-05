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

const bookingsFilePath = resolveStorePath("NEIGHBORLY_AD_BOOKINGS_STORE", ".neighborly-ad-bookings.json");

function getInitialSampleBookings(): AdBookingRequest[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;

  return [
    {
      id: "AD-REQ-101",
      businessName: "Amman Motors Maruti ARENA – Hosur",
      contactName: "Suresh Kumar",
      contactPhone: "+91 98450 12345",
      format: "combo",
      slotTiming: "morning",
      slotLabel: "Morning Peak (08:00 AM – 12:00 PM)",
      startHour: 8,
      endHour: 12,
      startDate: todayStr,
      endDate: futureStr,
      durationDays: 7,
      poster: {
        title: "Express 30-Min Two Wheeler & Car Service",
        label: "Amman Motors Maruti • Bagalur Road",
        imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=900&q=85",
        tone: "market",
      },
      content: {
        message: "⚡ Amman Motors Maruti ARENA: Free 21-point vehicle safety inspection this week on Bagalur Road!",
      },
      video: {
        title: "Amman Motors Maruti Diagnostics",
        description: "Watch our state-of-the-art computerized wheel balancing and authorized Maruti service in Hosur.",
        sourceUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        posterUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=900&q=85",
        callToAction: "Book Service Appointment",
      },
      baseRate: 1899,
      subtotal: 13293,
      gstAmount: 2393,
      totalAmount: 15686,
      status: "Paid",
      paymentMethod: "UPI QR (Google Pay / PhonePe)",
      transactionId: "TXN-UPICOMBO-98213",
      invoiceNumber: "INV-AD-2026-0041",
      paidAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      notes: "Morning rush special campaign verified and active.",
      viewsCount: 1420,
      clicksCount: 86,
      impressionsBySurface: { poster: 780, content: 390, video: 250 },
      lastViewedAt: new Date(Date.now() - 60000 * 2).toISOString(),
      viewRecords: createSampleViewRecords("AD-REQ-101", 1420, ["poster", "content", "video"]),
    },
    {
      id: "AD-REQ-102",
      businessName: "Sri Krishna Sweets & Bakery",
      contactName: "Radha Krishnan",
      contactPhone: "+91 94432 87654",
      format: "poster",
      slotTiming: "evening",
      slotLabel: "Evening Rush (05:00 PM – 10:00 PM)",
      startHour: 17,
      endHour: 22,
      startDate: todayStr,
      endDate: futureStr,
      durationDays: 5,
      poster: {
        title: "Hot Fresh Mysurpa & Savories Fresh From Kadai",
        label: "Sri Krishna Sweets • Gandhi Road",
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
        tone: "gold",
      },
      content: {
        message: "🍬 Sri Krishna Sweets: Piping hot evening snacks & pure ghee sweets freshly prepared!",
      },
      baseRate: 699,
      subtotal: 4369,
      gstAmount: 786,
      totalAmount: 5155,
      status: "Paid",
      paymentMethod: "Credit Card (HDFC Visa)",
      transactionId: "TXN-CCPOSTER-77124",
      invoiceNumber: "INV-AD-2026-0042",
      paidAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      notes: "Evening slot poster campaign active.",
      viewsCount: 890,
      clicksCount: 42,
      impressionsBySurface: { poster: 890, content: 0, video: 0 },
      lastViewedAt: new Date(Date.now() - 60000 * 8).toISOString(),
      viewRecords: createSampleViewRecords("AD-REQ-102", 890, ["poster"]),
    },
    {
      id: "AD-REQ-103",
      businessName: "Apex Fitness Studio",
      contactName: "Karthik Raj",
      contactPhone: "+91 99001 22334",
      format: "content",
      slotTiming: "all_day",
      slotLabel: "All-Day 24/7 Priority",
      startHour: 0,
      endHour: 24,
      startDate: todayStr,
      endDate: futureStr,
      durationDays: 14,
      content: {
        message: "💪 Apex Fitness Studio: Join today and get 30% off your annual personal training package!",
      },
      baseRate: 299,
      subtotal: 7326,
      gstAmount: 1319,
      totalAmount: 8645,
      status: "Paid",
      paymentMethod: "Net Banking (SBI)",
      transactionId: "TXN-NBTICKER-33901",
      invoiceNumber: "INV-AD-2026-0043",
      paidAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      notes: "24/7 marquee ticker message running.",
      viewsCount: 2150,
      clicksCount: 110,
      impressionsBySurface: { poster: 0, content: 2150, video: 0 },
      lastViewedAt: new Date(Date.now() - 60000 * 1).toISOString(),
      viewRecords: createSampleViewRecords("AD-REQ-103", 2150, ["content"]),
    },
  ];
}

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
    return getInitialSampleBookings();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn("Could not read ad bookings store, returning defaults:", error);
    }
    const initial = getInitialSampleBookings();
    try {
      await saveAdBookings(initial);
    } catch {
      // ignore
    }
    return initial;
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
  return updated;
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

  return updateAdBooking(id, {
    status: "Paid",
    paymentMethod: paymentDetails.paymentMethod,
    transactionId,
    invoiceNumber,
    paidAt: new Date().toISOString(),
  });
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

  // Record separate advertisement activity log for Company Admins & Super Admins
  try {
    await saveActivityLog({
      action: `Ad viewed: ${booking.businessName} (${surfaceLabels[surface]})`,
      category: "Advertisement",
      actorName: viewerDetails?.viewerName || "Visitor",
      actorPhone: viewerDetails?.viewerPhone || "",
      actorRole: (viewerDetails?.viewerRole as any) || "Customer",
      locality: viewerDetails?.locality || "Hosur",
      details: `Advertisement impression on ${surfaceLabels[surface]} for ${booking.businessName} (Booking #${booking.id}).`,
      metadata: {
        adBookingId,
        businessName: booking.businessName,
        surface,
        device: viewerDetails?.device || "Mobile / Web",
      },
    });
  } catch {
    // Non-blocking log
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

    await saveActivityLog({
      action: `Ad Interaction: ${booking.businessName} (${actionLabels[action] || action})`,
      category: "Advertisement",
      actorName: viewerDetails?.viewerName || "Visitor",
      actorPhone: viewerDetails?.viewerPhone || "",
      actorRole: "Customer",
      locality: viewerDetails?.locality || "Hosur",
      details: `Lead clicked "${actionLabels[action] || action}" on ${booking.businessName}'s ad campaign.`,
      metadata: {
        adBookingId,
        businessName: booking.businessName,
        action,
        device: viewerDetails?.device || "Mobile / Web",
      },
    });
  } catch {
    // Non-blocking log
  }

  return { success: true, clicksCount: booking.clicksCount, booking, record: newRecord };
}
