export type SupportConfig = {
  phone: string;
  email: string;
  hours: string;
  label: string;
  whatsapp?: string;
  updatedAt: string;
  updatedBy: string;
};

export const defaultSupportConfig: SupportConfig = {
  phone: "+91 94432 12345",
  email: "support@bizearch.in",
  hours: "8:00 AM - 9:00 PM (All Days)",
  label: "Bizearch Customer Care (Hosur)",
  whatsapp: "+91 94432 12345",
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default",
};
