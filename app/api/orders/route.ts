import { NextResponse } from "next/server";
import { getCurrentSession } from "@/app/lib/auth";
import { getBusinessByIdentity } from "@/app/lib/businesses";
import {
  createOrder,
  listAllOrders,
  listOrdersForBusiness,
  listOrdersForCustomer,
  updateOrderStatus,
  deleteOrder,
  OrderStatus,
  OrderRecord,
} from "@/app/lib/orders";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession(request);
    const body = (await request.json()) as Partial<OrderRecord>;

    if (!body.businessName || typeof body.businessName !== "string") {
      return NextResponse.json({ error: "Business name is required." }, { status: 400, headers: noStoreHeaders });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Order items cannot be empty." }, { status: 400, headers: noStoreHeaders });
    }

    const orderId = body.id || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const customerName = body.customerName?.trim() || (session?.role === "Account" ? session.identity : "Resident Shopper");
    const customerPhone = body.customerPhone?.trim() || (session?.role === "Account" && !session.identity.includes("@") ? session.identity : "");

    const order: OrderRecord = {
      id: orderId,
      businessName: body.businessName.trim(),
      businessPhone: body.businessPhone?.trim() || "",
      customerName,
      customerPhone,
      customerAddress: body.customerAddress?.trim() || "Hosur",
      deliveryType: body.deliveryType === "pickup" ? "pickup" : "delivery",
      notes: body.notes?.trim() || "",
      items: body.items,
      itemTotal: typeof body.itemTotal === "number" ? body.itemTotal : (body.totalAmount || 0),
      deliveryFee: typeof body.deliveryFee === "number" ? body.deliveryFee : 0,
      taxes: typeof body.taxes === "number" ? body.taxes : 0,
      totalAmount: typeof body.totalAmount === "number" ? body.totalAmount : 0,
      paymentMethod: body.paymentMethod || "cod",
      paymentStatus: body.paymentStatus || "pending",
      paymentTransactionId: body.paymentTransactionId || `TXN-${Date.now()}`,
      upiId: body.upiId,
      status: (body.status as OrderStatus) || "placed",
      createdAt: body.createdAt || new Date().toISOString(),
      estimatedTime: body.estimatedTime || "30-45 mins",
    };

    const saved = await createOrder(order);

    return NextResponse.json(
      {
        success: true,
        order: saved,
        message: `Order #${order.id} placed successfully!`,
      },
      { status: 201, headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to place order." },
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

    // 1. If Company Admin/Super Admin
    if (session?.role === "Company") {
      if (businessQuery) {
        const orders = await listOrdersForBusiness(businessQuery);
        return NextResponse.json({ orders, count: orders.length }, { headers: noStoreHeaders });
      }
      const orders = await listAllOrders();
      return NextResponse.json({ orders, count: orders.length }, { headers: noStoreHeaders });
    }

    // 2. If Business role
    if (session?.role === "Business") {
      let bizName = businessQuery;
      if (!bizName && session.identity) {
        try {
          const biz = await getBusinessByIdentity(session.identity);
          if (biz) bizName = biz.name;
        } catch {}
      }
      const bizIdentity = bizName || session.identity;
      const orders = await listOrdersForBusiness(bizIdentity);
      return NextResponse.json({ orders, count: orders.length }, { headers: noStoreHeaders });
    }

    // 3. If Customer role (Account) or explicit customer query
    if (customerQuery || session?.role === "Account") {
      const custIdentity = customerQuery || session?.identity || "";
      const orders = await listOrdersForCustomer(custIdentity);
      if (orders.length === 0 && !customerQuery) {
        const all = await listAllOrders();
        return NextResponse.json({ orders: all, count: all.length }, { headers: noStoreHeaders });
      }
      return NextResponse.json({ orders, count: orders.length }, { headers: noStoreHeaders });
    }

    // 4. If businessName is explicitly queried
    if (businessQuery) {
      const orders = await listOrdersForBusiness(businessQuery);
      return NextResponse.json({ orders, count: orders.length }, { headers: noStoreHeaders });
    }

    // 5. Fallback: list all orders
    const orders = await listAllOrders();
    return NextResponse.json({ orders, count: orders.length }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load orders." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; status?: OrderStatus };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400, headers: noStoreHeaders });
    }

    const validStatuses: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "completed", "cancelled"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid order status value." }, { status: 400, headers: noStoreHeaders });
    }

    const updated = await updateOrderStatus(body.id, body.status);
    if (!updated) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json({ success: true, order: updated }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order status." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession(request);
    if (!session || (session.role !== "Company" && session.role !== "Business")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403, headers: noStoreHeaders });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400, headers: noStoreHeaders });
    }

    const ok = await deleteOrder(id);
    if (!ok) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json({ success: true, message: "Order deleted successfully." }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("DELETE /api/orders error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete order." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
