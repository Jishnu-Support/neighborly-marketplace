export type QuoteStatus = "New" | "Contacted" | "Quoted" | "Completed" | "Declined";

export type QuoteEnquiry = {
  id: string;
  businessId?: string;
  businessName: string;
  businessPhone?: string;
  businessEmail?: string;
  productName: string;
  productPrice?: number;
  productUnit?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerLocality?: string;
  message: string;
  status: QuoteStatus;
  replyNote?: string;
  createdAt: string;
  updatedAt?: string;
};
