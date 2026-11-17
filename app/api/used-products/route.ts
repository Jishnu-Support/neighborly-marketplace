import { NextResponse } from "next/server";
import {
  listUsedProducts,
  createUsedProduct,
  updateUsedProduct,
  markUsedProductStatus,
  deleteUsedProduct,
} from "@/app/lib/used-products";
import { saveActivityLog } from "@/app/lib/activity-logs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const statusParam = searchParams.get("status") || "active";
    const status = statusParam === "all" ? "all" : statusParam === "sold" ? "sold" : "active";

    const products = await listUsedProducts({ query, category, status });
    return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load used products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "Other";
    const price = typeof body.price === "number" ? body.price : Number(body.price);
    const negotiable = Boolean(body.negotiable);
    const condition = typeof body.condition === "string" ? body.condition.trim() : "Good Condition";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "Local Area";
    const sellerName = typeof body.sellerName === "string" ? body.sellerName.trim() : "Community Member";
    const sellerPhone = typeof body.sellerPhone === "string" ? body.sellerPhone.trim() : "";
    const sellerWhatsapp = typeof body.sellerWhatsapp === "string" ? body.sellerWhatsapp.trim() : sellerPhone;
    const images = Array.isArray(body.images) ? (body.images as string[]) : [];

    // Location coordinates and details
    let coordinates: { latitude: number; longitude: number } | undefined;
    if (body.coordinates && typeof body.coordinates === "object") {
      const coords = body.coordinates as Record<string, unknown>;
      const lat = Number(coords.latitude);
      const lng = Number(coords.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates = { latitude: lat, longitude: lng };
      }
    }
    const locality = typeof body.locality === "string" ? body.locality.trim() : undefined;
    const city = typeof body.city === "string" ? body.city.trim() : undefined;
    const pincode = typeof body.pincode === "string" ? body.pincode.trim() : undefined;
    const landmark = typeof body.landmark === "string" ? body.landmark.trim() : undefined;

    if (!title) {
      return NextResponse.json({ error: "Product title is required." }, { status: 400 });
    }
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Valid price is required." }, { status: 400 });
    }
    if (!sellerPhone) {
      return NextResponse.json({ error: "Seller contact phone number is required." }, { status: 400 });
    }

    const created = await createUsedProduct({
      title,
      category,
      price,
      negotiable,
      condition,
      description,
      location,
      coordinates,
      locality,
      city,
      pincode,
      landmark,
      images,
      sellerName,
      sellerPhone,
      sellerWhatsapp,
    });

    try {
      await saveActivityLog({
        action: `Used Product Posted: ${created.title} (₹${created.price})`,
        category: "General",
        actorName: created.sellerName,
        actorRole: "Customer",
        details: `Seller ${created.sellerName} (${created.sellerPhone}) posted used item '${created.title}' for ₹${created.price} in ${created.location}.`,
      });
    } catch {}

    return NextResponse.json({ success: true, product: created });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create used product." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const category = typeof body.category === "string" ? body.category.trim() : undefined;
    const price = body.price !== undefined ? (typeof body.price === "number" ? body.price : Number(body.price)) : undefined;
    const negotiable = body.negotiable !== undefined ? Boolean(body.negotiable) : undefined;
    const condition = typeof body.condition === "string" ? body.condition.trim() : undefined;
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    const location = typeof body.location === "string" ? body.location.trim() : undefined;
    const sellerName = typeof body.sellerName === "string" ? body.sellerName.trim() : undefined;
    const sellerPhone = typeof body.sellerPhone === "string" ? body.sellerPhone.trim() : undefined;
    const sellerWhatsapp = typeof body.sellerWhatsapp === "string" ? body.sellerWhatsapp.trim() : undefined;
    const images = Array.isArray(body.images) ? (body.images as string[]) : undefined;

    let coordinates: { latitude: number; longitude: number } | undefined;
    if (body.coordinates && typeof body.coordinates === "object") {
      const coords = body.coordinates as Record<string, unknown>;
      const lat = Number(coords.latitude);
      const lng = Number(coords.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates = { latitude: lat, longitude: lng };
      }
    }
    const locality = typeof body.locality === "string" ? body.locality.trim() : undefined;
    const city = typeof body.city === "string" ? body.city.trim() : undefined;
    const pincode = typeof body.pincode === "string" ? body.pincode.trim() : undefined;
    const landmark = typeof body.landmark === "string" ? body.landmark.trim() : undefined;

    const updated = await updateUsedProduct(id, {
      title,
      category,
      price,
      negotiable,
      condition,
      description,
      location,
      coordinates,
      locality,
      city,
      pincode,
      landmark,
      images,
      sellerName,
      sellerPhone,
      sellerWhatsapp,
    });

    if (!updated) {
      return NextResponse.json({ error: "Used product not found." }, { status: 404 });
    }

    try {
      await saveActivityLog({
        action: `Used Product Updated: ${updated.title} (₹${updated.price})`,
        category: "General",
        actorName: updated.sellerName,
        actorRole: "Customer",
        details: `Seller ${updated.sellerName} (${updated.sellerPhone}) updated listing '${updated.title}'.`,
      });
    } catch {}

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update used product." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; status?: "active" | "sold" };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "Product ID and valid status are required." }, { status: 400 });
    }

    const updated = await markUsedProductStatus(body.id, body.status);
    if (!updated) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update used product." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const deleted = await deleteUsedProduct(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete used product." },
      { status: 500 }
    );
  }
}
