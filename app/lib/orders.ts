import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "./storage-paths";
import { saveActivityLog } from "./activity-logs";
import { getBusinessByIdentity } from "./businesses";
import { OrderStatus, PaymentMethod, PaymentStatus, OrderItem, OrderRecord } from "./orders.shared";

export type { OrderStatus, PaymentMethod, PaymentStatus, OrderItem, OrderRecord };

const ordersPath = resolveStorePath("NEIGHBORLY_ORDERS_STORE", ".neighborly-orders.json");

export async function readOrdersFile(): Promise<OrderRecord[]> {
  try {
    const raw = await readFile(ordersPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as OrderRecord[];
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    return [];
  }
}

async function writeOrdersFile(orders: OrderRecord[]): Promise<void> {
  await mkdir(path.dirname(ordersPath), { recursive: true });
  const temporaryPath = `${ordersPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(orders, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, ordersPath);
}

export async function createOrder(order: OrderRecord): Promise<OrderRecord> {
  const orders = await readOrdersFile();
  const existingIndex = orders.findIndex((o) => o.id === order.id);

  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.unshift(order);
  }

  await writeOrdersFile(orders);

  try {
    await saveActivityLog({
      action: `Order placed #${order.id} for "${order.businessName}"`,
      category: "Order",
      actorName: order.customerName,
      actorPhone: order.customerPhone,
      actorRole: "Customer",
      locality: order.customerAddress || "Hosur",
      details: `Customer ${order.customerName} ordered ${order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")} (Total: ₹${order.totalAmount}). Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus}).`,
      metadata: {
        orderId: order.id,
        businessName: order.businessName,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
      },
    });
  } catch {
    // Activity log failure should not block order placement
  }

  return order;
}

export async function listAllOrders(): Promise<OrderRecord[]> {
  const orders = await readOrdersFile();
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listOrdersForCustomer(customerQuery: string): Promise<OrderRecord[]> {
  const orders = await listAllOrders();
  const cleanQuery = customerQuery.trim().toLowerCase();
  const cleanDigits = customerQuery.replace(/\D/g, "");

  return orders.filter((o) => {
    if (!cleanQuery) return true;
    if (o.customerPhone) {
      const oDigits = o.customerPhone.replace(/\D/g, "");
      if (cleanDigits.length >= 8 && (oDigits === cleanDigits || oDigits.endsWith(cleanDigits) || cleanDigits.endsWith(oDigits))) {
        return true;
      }
    }
    if (o.customerName && (o.customerName.toLowerCase() === cleanQuery || o.customerName.toLowerCase().includes(cleanQuery) || cleanQuery.includes(o.customerName.toLowerCase()))) {
      return true;
    }
    return false;
  });
}

export async function listOrdersForBusiness(businessIdentifier: string): Promise<OrderRecord[]> {
  const orders = await listAllOrders();
  const normalized = businessIdentifier.trim().toLowerCase();
  const cleanDigits = businessIdentifier.replace(/\D/g, "");

  let registeredBizName = "";
  let registeredBizPhone = "";
  try {
    const biz = await getBusinessByIdentity(businessIdentifier);
    if (biz) {
      registeredBizName = biz.name?.trim().toLowerCase() || "";
      registeredBizPhone = biz.phone?.replace(/\D/g, "") || "";
    }
  } catch {}

  return orders.filter((o) => {
    if (!o.businessName) return false;
    const oName = o.businessName.trim().toLowerCase();
    if (oName === normalized) return true;
    if (normalized.length >= 3 && (oName.includes(normalized) || normalized.includes(oName))) return true;
    if (registeredBizName && (oName === registeredBizName || oName.includes(registeredBizName) || registeredBizName.includes(oName))) return true;
    if (cleanDigits.length >= 8 && o.businessPhone) {
      const bDigits = o.businessPhone.replace(/\D/g, "");
      if (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits)) return true;
    }
    if (registeredBizPhone && o.businessPhone) {
      const bDigits = o.businessPhone.replace(/\D/g, "");
      if (bDigits === registeredBizPhone || bDigits.endsWith(registeredBizPhone) || registeredBizPhone.endsWith(bDigits)) return true;
    }
    return false;
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderRecord | null> {
  const orders = await readOrdersFile();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index < 0) return null;

  orders[index] = {
    ...orders[index],
    status,
  };

  await writeOrdersFile(orders);

  try {
    await saveActivityLog({
      action: `Order #${orderId} status updated to ${status.toUpperCase()}`,
      category: "Order",
      actorName: orders[index].businessName,
      actorPhone: orders[index].businessPhone,
      actorRole: "Business",
      details: `Order #${orderId} for ${orders[index].customerName} updated to status: ${status}`,
      metadata: {
        orderId,
        businessName: orders[index].businessName,
        status,
      },
    });
  } catch {
    // Activity log failure should not block update
  }

  return orders[index];
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  const orders = await readOrdersFile();
  const initialLength = orders.length;
  const filtered = orders.filter((o) => o.id !== orderId);
  if (filtered.length === initialLength) return false;
  await writeOrdersFile(filtered);
  return true;
}
