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
import { createServerNotification } from "@/app/lib/notifications";

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

    // Notify Merchant, Customer & Company Admins in real-time
    try {
      await createServerNotification({
        title: `🛍️ New Order #${saved.id} - ₹${saved.totalAmount}`,
        message: `${saved.customerName} ordered ${saved.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")} from ${saved.businessName}. Please accept and prepare!`,
        type: "order",
        targetRole: "Business",
        targetIdentity: saved.businessName,
        linkText: "View order",
        action: {
          type: "portal",
          payload: "Business",
          tab: "Orders",
        },
      });

      if (saved.customerPhone || saved.customerName) {
        await createServerNotification({
          title: `✅ Order Placed: #${saved.id} - ₹${saved.totalAmount}`,
          message: `Your order for ${saved.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")} from ${saved.businessName} has been placed. Estimated delivery: ${saved.estimatedTime}.`,
          type: "order",
          targetRole: "Account",
          targetIdentity: saved.customerPhone || saved.customerName,
          linkText: "Track order",
          action: {
            type: "portal",
            payload: "Account",
            tab: "Orders",
          },
        });
      }

      await createServerNotification({
        title: `🛍️ Platform Order #${saved.id}`,
        message: `New order for ${saved.businessName} placed by ${saved.customerName} (₹${saved.totalAmount}).`,
        type: "order",
        targetRole: "Company",
        linkText: "View in orders",
        action: {
          type: "portal",
          payload: "Company",
          tab: "Orders",
        },
      });
    } catch (notifErr) {
      console.warn("Failed to create order notification:", notifErr);
    }

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
    const body = (await request.json()) as {
      id?: string;
      status?: OrderStatus;
      cancellationReason?: string;
      cancelledBy?: "Customer" | "Business" | "Company" | "Admin";
    };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400, headers: noStoreHeaders });
    }

    const validStatuses: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "completed", "cancelled"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid order status value." }, { status: 400, headers: noStoreHeaders });
    }

    const updated = await updateOrderStatus(body.id, body.status, body.cancellationReason, body.cancelledBy);
    if (!updated) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: noStoreHeaders });
    }

    // Notify Customer and Business about order status update in real time
    try {
      const reasonSuffix = body.cancellationReason ? ` (${body.cancellationReason})` : "";
      const isCancelled = body.status === "cancelled";

      const statusMessage =
        body.status === "accepted" ? "accepted by store and entering preparation 👨‍🍳" :
        body.status === "preparing" ? "now being freshly prepared by the business partner 👨‍🍳" :
        body.status === "ready" ? "marked READY! Prepared and packed for pickup / delivery 🛵" :
        body.status === "completed" ? "completed and successfully delivered ✅" :
        body.status === "cancelled"
          ? (body.cancelledBy === "Customer" ? `cancelled by you${reasonSuffix}` : `cancelled by store${reasonSuffix}`)
          : body.status;

      if (updated.customerPhone || updated.customerName) {
        await createServerNotification({
          title: isCancelled ? `❌ Order #${updated.id} Cancelled` : `🛵 Order #${updated.id} Update: ${body.status.toUpperCase()}`,
          message: isCancelled
            ? (body.cancelledBy === "Customer"
                ? `Your order from ${updated.businessName} was cancelled successfully.${reasonSuffix} If prepaid, your refund has been initiated.`
                : `${updated.businessName} could not fulfill your order #${updated.id} and had to cancel.${reasonSuffix} If prepaid, your refund is in process.`)
            : `Your order from ${updated.businessName} is ${statusMessage}.`,
          type: "order",
          targetRole: "Account",
          targetIdentity: updated.customerPhone || updated.customerName,
          linkText: "Track order",
          action: {
            type: "portal",
            payload: "Account",
            tab: "Orders",
          },
        });
      }

      await createServerNotification({
        title: isCancelled
          ? (body.cancelledBy === "Customer" ? `⚠️ Order #${updated.id} Cancelled by Customer` : `❌ Order #${updated.id} Marked Cancelled`)
          : `📦 Order #${updated.id} Status: ${body.status.toUpperCase()}`,
        message: isCancelled
          ? (body.cancelledBy === "Customer"
              ? `${updated.customerName} cancelled order #${updated.id}.${reasonSuffix} Do not prepare or dispatch.`
              : `Order #${updated.id} for ${updated.customerName} was marked cancelled.${reasonSuffix}`)
          : `Order #${updated.id} for ${updated.customerName} has been updated to ${statusMessage}.`,
        type: "order",
        targetRole: "Business",
        targetIdentity: updated.businessName,
        linkText: "View order",
        action: {
          type: "portal",
          payload: "Business",
          tab: "Orders",
        },
      });

      if (isCancelled) {
        await createServerNotification({
          title: `❌ Platform Order #${updated.id} Cancelled`,
          message: `Order #${updated.id} for ${updated.businessName} was cancelled by ${body.cancelledBy || "user"}.${reasonSuffix}`,
          type: "order",
          targetRole: "Company",
          linkText: "View order",
          action: {
            type: "portal",
            payload: "Company",
            tab: "Orders",
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to notify customer/business of order status:", notifErr);
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
