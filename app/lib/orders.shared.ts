export type OrderStatus = "placed" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "upi" | "card" | "netbanking" | "cod";
export type PaymentStatus = "paid" | "pending";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
};

export type OrderRecord = {
  id: string;
  businessName: string;
  businessPhone?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: "delivery" | "pickup";
  notes?: string;
  items: OrderItem[];
  itemTotal: number;
  deliveryFee: number;
  taxes: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId: string;
  upiId?: string;
  status: OrderStatus;
  createdAt: string;
  estimatedTime: string;
};
