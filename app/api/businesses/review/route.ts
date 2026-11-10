import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readBusinessRecords, writeBusinessRecords, type BusinessReview } from "@/app/lib/businesses";
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

    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating))));
    if (!rating || isNaN(rating)) {
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
    const newReview: BusinessReview = {
      id: randomUUID(),
      userName: body.userName?.trim() || "Verified Resident",
      userPhone: body.userPhone?.trim(),
      rating,
      comment: body.comment?.trim() || "",
      createdAt: new Date().toISOString(),
    };

    const existingReviews = Array.isArray(business.customerReviews) ? business.customerReviews : [];
    const updatedReviews = [newReview, ...existingReviews];

    const nextReviews = updatedReviews.length;
    const totalScore = updatedReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    const nextRating = Number((totalScore / nextReviews).toFixed(1));

    business.customerReviews = updatedReviews;
    business.reviews = nextReviews;
    business.rating = nextRating;
    records[index] = business;

    await writeBusinessRecords(records);

    // Record review in platform activity logs
    try {
      await saveActivityLog({
        action: `Customer rated ${business.name} (${rating}★)`,
        category: "Review",
        actorName: newReview.userName,
        actorPhone: body.userPhone?.trim() || undefined,
        actorRole: "Customer",
        locality: business.address?.area || "Hosur",
        details: body.comment?.trim() ? `"${body.comment.trim()}" (${rating}/5 stars)` : `${rating} out of 5 stars`,
        metadata: {
          businessId: business.id,
          businessName: business.name,
          rating,
          comment: body.comment?.trim() || "",
          reviewId: newReview.id,
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
      review: newReview,
      customerReviews: updatedReviews,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record customer review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
