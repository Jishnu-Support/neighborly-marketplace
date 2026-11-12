export type EmergencyNumberItem = {
  id: string;
  title: string;
  displayNumber: string;
  dialNumber: string;
  icon: string;
  active: boolean;
  category?: "police" | "medical" | "fire" | "helpdesk" | "women-safety" | "general";
};

export const defaultEmergencyNumbers: EmergencyNumberItem[] = [
  {
    id: "police",
    title: "Police Emergency",
    displayNumber: "Dial 100 / 112",
    dialNumber: "100",
    icon: "🚔",
    active: true,
    category: "police",
  },
  {
    id: "ambulance",
    title: "Medical Ambulance",
    displayNumber: "Dial 108",
    dialNumber: "108",
    icon: "🚑",
    active: true,
    category: "medical",
  },
  {
    id: "fire",
    title: "Fire & Rescue",
    displayNumber: "Dial 101",
    dialNumber: "101",
    icon: "🚒",
    active: true,
    category: "fire",
  },
  {
    id: "helpdesk",
    title: "Bizearch Hosur Help Desk",
    displayNumber: "+91 94895 21482",
    dialNumber: "+919489521482",
    icon: "💬",
    active: true,
    category: "helpdesk",
  },
  {
    id: "women-safety",
    title: "Women's Safety Helpline",
    displayNumber: "Dial 1091 / 112",
    dialNumber: "1091",
    icon: "🛡️",
    active: true,
    category: "women-safety",
  },
  {
    id: "disaster",
    title: "District Disaster Control",
    displayNumber: "Dial 1077",
    dialNumber: "1077",
    icon: "⚠️",
    active: true,
    category: "general",
  },
];

export type SupportConfig = {
  phone: string;
  email: string;
  hours: string;
  label: string;
  whatsapp?: string;
  updatedAt: string;
  updatedBy: string;
  emergencyNumbers?: EmergencyNumberItem[];
};

export const defaultSupportConfig: SupportConfig = {
  phone: "+91 94432 12345",
  email: "support@bizearch.in",
  hours: "8:00 AM - 9:00 PM (All Days)",
  label: "Bizearch Customer Care (Hosur)",
  whatsapp: "+91 94432 12345",
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default",
  emergencyNumbers: defaultEmergencyNumbers,
};

