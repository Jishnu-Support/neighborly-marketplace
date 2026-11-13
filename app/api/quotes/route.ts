import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import {
  createQuoteEnquiry,
  listAllQuotes,
  listQuotesForBusiness,
  listQuotesForCustomer,
  updateQuoteStatus,
  deleteQuote,
  QuoteStatus,
} from "@/app/lib/quotes";
import { getBusinessByIdentity } from "@/app/lib/businesses";
import { createServerNotification } from "@/app/lib/notifications";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const body = (await request.json()) as {
      businessId?: string;
      businessName?: string;
      businessPhone?: string;
      businessEmail?: string;
      productName?: string;
      productPrice?: number;
      productUnit?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerLocality?: string;
      message?: string;
    };

    const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
    if (!businessName) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length < 3) {
      return NextResponse.json({ error: "Please enter your quote inquiry message (at least 3 characters)." }, { status: 400 });
    }

    let customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    let customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    const customerLocality = typeof body.customerLocality === "string" ? body.customerLocality.trim() : "Hosur";

    if (!customerName && session?.role === "Account") {
      customerName = session.identity;
    }
    if (!customerPhone && session?.role === "Account" && !session.identity.includes("@")) {
      customerPhone = session.identity;
    }

    if (!customerName) {
      customerName = "Resident Shopper";
    }

    const cleanDigits = customerPhone.replace(/\D/g, "");
    if (!cleanDigits && !customerEmail) {
      return NextResponse.json(
        { error: "Please provide your mobile number or email so the business can respond to you." },
        { status: 400 }
      );
    }

    // Try finding business phone/email if not passed
    let businessPhone = body.businessPhone?.trim() || "";
    let businessEmail = body.businessEmail?.trim() || "";
    if (!businessPhone) {
      const biz = await getBusinessByIdentity(businessName);
      if (biz) {
        businessPhone = biz.phone || "";
        businessEmail = biz.email || businessEmail;
      }
    }

    const quote = await createQuoteEnquiry({
      businessId: body.businessId,
      businessName,
      businessPhone,
      businessEmail,
      productName: body.productName,
      productPrice: typeof body.productPrice === "number" ? body.productPrice : undefined,
      productUnit: body.productUnit,
      customerName,
      customerPhone: customerPhone || cleanDigits || customerEmail,
      customerEmail: customerEmail || undefined,
      customerLocality,
      message,
    });

    // Notify the Merchant about this new enquiry
    try {
      await createServerNotification({
        title: `💬 New Quote Enquiry from ${customerName}`,
        message: `${customerName} enquired about "${body.productName || "Product / Service"}" from ${businessName}.`,
        type: "enquiry",
        targetRole: "Business",
        targetIdentity: businessName,
        linkText: "View enquiries",
        action: {
          type: "portal",
          payload: "Business",
          tab: "Enquiries",
        },
      });
    } catch {}

    // Generate pre-filled WhatsApp link if business phone exists
    let whatsappUrl = "";
    if (businessPhone) {
      const cleanBizPhone = businessPhone.replace(/\D/g, "");
      const waNumber = cleanBizPhone.startsWith("91") ? cleanBizPhone : `91${cleanBizPhone}`;
      const waText = `Hello ${businessName}, I am ${customerName}. I found your business on Bizearch and would like to ask about "${quote.productName}":\n\n"${message}"\n\nPlease let me know your price estimate and availability. My contact: ${quote.customerPhone}. Thank you!`;
      whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
    }

    return NextResponse.json(
      {
        success: true,
        quote,
        whatsappUrl,
        message: `✓ Quote request sent successfully to ${businessName}! The business will review your request.`,
      },
      { status: 201, headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("POST /api/quotes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit quote inquiry." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const url = new URL(request.url);
    const businessQuery = url.searchParams.get("businessName") || url.searchParams.get("business");
    const customerQuery = url.searchParams.get("customer") || url.searchParams.get("phone");

    // If Company Admin/Super Admin
    if (session?.role === "Company") {
      if (businessQuery) {
        const quotes = await listQuotesForBusiness(businessQuery);
        return NextResponse.json({ quotes, count: quotes.length }, { headers: noStoreHeaders });
      }
      const quotes = await listAllQuotes();
      return NextResponse.json({ quotes, count: quotes.length }, { headers: noStoreHeaders });
    }

    // If Business role
    if (session?.role === "Business") {
      const bizIdentity = businessQuery || session.identity;
      const quotes = await listQuotesForBusiness(bizIdentity);
      return NextResponse.json({ quotes, count: quotes.length }, { headers: noStoreHeaders });
    }

    // If customer role or explicit customer filter
    if (customerQuery || session?.role === "Account") {
      const custIdentity = customerQuery || session?.identity || "";
      const quotes = await listQuotesForCustomer(custIdentity);
      return NextResponse.json({ quotes, count: quotes.length }, { headers: noStoreHeaders });
    }

    // If businessName is explicitly queried (e.g. from storefront)
    if (businessQuery) {
      const quotes = await listQuotesForBusiness(businessQuery);
      return NextResponse.json({ quotes, count: quotes.length }, { headers: noStoreHeaders });
    }

    // Fallback: list all for public stats or general discovery
    const quotes = await listAllQuotes();
    return NextResponse.json({ quotes, count: quotes.length }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("GET /api/quotes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load quotes." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const body = (await request.json()) as { id?: string; status?: string; replyNote?: string };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Quote ID is required." }, { status: 400 });
    }

    const validStatuses: QuoteStatus[] = ["New", "Contacted", "Quoted", "Completed", "Declined"];
    const status = body.status as QuoteStatus;
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const updated = await updateQuoteStatus(body.id, status, body.replyNote);
    if (!updated) {
      return NextResponse.json({ error: "Quote inquiry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, quote: updated }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("PATCH /api/quotes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update quote status." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession(request);
    if (!session || (session.role !== "Company" && session.role !== "Business")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Quote ID is required." }, { status: 400 });
    }

    const ok = await deleteQuote(id);
    if (!ok) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Quote deleted successfully." }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("DELETE /api/quotes error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete quote." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
