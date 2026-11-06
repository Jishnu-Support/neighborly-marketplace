import { NextResponse } from "next/server";
import { readBusinessRecords, writeBusinessRecords } from "@/app/lib/businesses";
import { saveActivityLog } from "@/app/lib/activity-logs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      businessId?: string;
      businessName?: string;
      rating?: number;
      comment?: string;
      userName?: string;
      userPhone?: string;
    };

    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
    }

    const identifier = (body.businessId || body.businessName || "").trim();
    if (!identifier) {
      return NextResponse.json({ error: "Business ID or Name is required to submit a review." }, { status: 400 });
    }

    const records = await readBusinessRecords();
    const index = records.findIndex(
      (b) =>
        b.id === identifier ||
        b.name.toLowerCase() === identifier.toLowerCase()
    );

    if (index < 0) {
      return NextResponse.json({ error: "Business listing not found." }, { status: 404 });
    }

    const business = records[index];
    const prevRating = typeof business.rating === "number" && !isNaN(business.rating) ? business.rating : 4.5;
    const prevReviews = typeof business.reviews === "number" && !isNaN(business.reviews) ? business.reviews : 1;

    const nextReviews = prevReviews + 1;
    const nextRating = Number((((prevRating * prevReviews) + rating) / nextReviews).toFixed(1));

    business.rating = nextRating;
    business.reviews = nextReviews;
    records[index] = business;

    await writeBusinessRecords(records);

    // Record review in platform activity logs
    try {
      await saveActivityLog({
        action: `Customer rated ${business.name} (${rating}★)`,
        category: "Review",
        actorName: body.userName?.trim() || "Verified Customer",
        actorPhone: body.userPhone?.trim() || undefined,
        actorRole: "Customer",
        locality: business.address?.area || "Hosur",
        details: body.comment?.trim() ? `"${body.comment.trim()}" (${rating}/5 stars)` : `${rating} out of 5 stars`,
        metadata: {
          businessId: business.id,
          businessName: business.name,
          rating,
          comment: body.comment?.trim() || "",
        },
      });
    } catch (e) {
      console.warn("Could not record review activity log:", e);
    }

    return NextResponse.json({
      success: true,
      businessName: business.name,
      rating: nextRating,
      reviews: nextReviews,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record customer review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
