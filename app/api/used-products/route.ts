import { NextResponse } from "next/server";
import {
  listUsedProducts,
  createUsedProduct,
  markUsedProductStatus,
  deleteUsedProduct,
} from "@/app/lib/used-products";
import { saveActivityLog } from "@/app/lib/activity-logs";

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
