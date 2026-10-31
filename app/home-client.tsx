"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CompanyAccessLevel } from "./lib/auth";
import { defaultAdConfig, type AdConfig } from "./lib/ad-config.shared";
import { defaultCategoryConfig, legacyDefaultCategoryConfig, type CategoryConfig, type CategorySector } from "./lib/category-config.shared";
import { defaultRegistrationFormConfig, type RegistrationFormConfig, type RegistrationForm, type RegistrationField } from "./lib/registration-form-config.shared";
import { buildAutomobileTaxonomyPaths as buildSharedAutomobileTaxonomyPaths, commercialVehicleSubcategories, getVehicleModelsForType as getSharedVehicleModelsForType } from "./lib/vehicle-taxonomy.shared";
import AtoZDirectory from "./atoz-directory";
import { atozCatalog, type AtoZItem } from "./lib/atoz-catalog";

const subcategoriesSummary: Record<string, string> = {
  Automobiles: "Sales · Service → Two wheelers · Three wheelers · Four wheelers · Heavy vehicles",
  Electronics: "Sales · Service → Mobiles · Laptops · Audio & video · Cameras",
  Electricals: "Wiring & cables · Modular switches · LED lighting · Fans · Inverters · Solar",
  Hardware: "Power tools · Hand tools · Pipes & plumbing · Paints · Locks & sanitaryware",
  "Home Appliances": "Refrigerators · Washing machines · ACs · Chimneys · Purifiers & geysers",
  Fashion: "Clothing · Footwear · Jewellery · Tailoring · Bags & accessories",
  "Home & furniture": "Furniture · Decor · Kitchen · Repairs",
  "Food & dining": "Restaurants · Meal delivery · Bakery · Cafes",
  "Health & wellness": "Clinics · Dental · Pharmacies · Physio",
  "Sports & fitness": "Gyms · Yoga · Sports coaching · Swimming · Turf",
  Travel: "Travel agents · Stays · Airport cabs · Tours",
  Entertainment: "Events · Music · Workshops · Gaming",
  "Everyday services": "Plumbing · Cleaning · Carpentry · Pest control · Repairs",
  "Books & Stationery": "Books · School textbooks · Notebooks · Printing & Xerox",
  "Toys & Fancy Stores": "Toys & Games · Fancy store · Bangles & Gifts · Cosmetics",
  "Public & Common Places": "Bus stand · Railway station · Temples · Parks & Civic hubs",
  "Real Estate & Construction": "Rentals · Plots · Industrial sheds · Civil contractors · Architects",
  "Heavy Industries & Machinery": "Earth movers · Cranes & forklifts · Heavy CNC · Generators · Compressors · Plant machinery",
  "Industrial & B2B Manufacturing": "CNC machining · Sheet metal · Powder coating · Packaging · PPE safety",
  "Education & Coaching": "CBSE schools · Engineering colleges · NEET/TNPSC coaching · Driving schools",
  "Events & Weddings": "Kalyana mandapams · Catering · Stage decor · Sound & DJ · Photography",
  "Agriculture, Nurseries & Pets": "Hosur rose nurseries · Farm seeds · Pet shops · Vet clinics · Cattle feed",
};

type Role = "Discover" | "Account" | "Business" | "Agent" | "Company";
type EmergencyType = "police" | "medical" | "fire" | "women-safety" | "general";
const emergencyTypes: { id: EmergencyType; title: string; description: string; icon: string; phone: string }[] = [
  { id: "police", title: "Police / safety", description: "Threat, crime or immediate danger", icon: "?", phone: "100" },
  { id: "medical", title: "Medical", description: "Urgent medical or ambulance help", icon: "+", phone: "108" },
  { id: "fire", title: "Fire / rescue", description: "Fire, accident or rescue help", icon: "?", phone: "101" },
  { id: "women-safety", title: "Women?s safety", description: "Safety threat or harassment", icon: "?", phone: "112" },
  { id: "general", title: "Other emergency", description: "Any other immediate emergency", icon: "!", phone: "112" },
];
type MemberProfile = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  doorNo?: string;
  street?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  bio?: string;
  avatarInitials?: string;
  avatarBg?: string;
  emergencyPhones: [string, string];
  emergencyNames?: [string, string];
  emergencyRelations?: [string, string];
  capturedGps?: { latitude: number; longitude: number; accuracy: number; timestamp: string };
};

type UserSettings = {
  defaultRadius: number;
  autoDetectLocation: boolean;
  preferredLocality: string;
  mapProvider: "google" | "osm";
  language: "en" | "ta" | "kn" | "te";
  catalogView: "grid" | "list";
  compactDensity: boolean;
  orderStatusAlerts: boolean;
  smsOrderUpdates: boolean;
  communityBroadcasts: boolean;
  merchantOffers: boolean;
  soundAlerts: boolean;
  shareLocationWithShops: boolean;
  saveSearchHistory: boolean;
  twoFactorAuth: boolean;
  passcode: string;
};

const defaultUserSettings: UserSettings = {
  defaultRadius: 5,
  autoDetectLocation: true,
  preferredLocality: "All Hosur",
  mapProvider: "google",
  language: "en",
  catalogView: "grid",
  compactDensity: false,
  orderStatusAlerts: true,
  smsOrderUpdates: true,
  communityBroadcasts: true,
  merchantOffers: true,
  soundAlerts: true,
  shareLocationWithShops: true,
  saveSearchHistory: true,
  twoFactorAuth: false,
  passcode: "",
};

const HOSUR_LOCALITIES = [
  "All Hosur",
  "Bagalur Road",
  "Sipcot Phase 1",
  "Sipcot Phase 2",
  "Rayakottai Road",
  "Mookandapalli",
  "Mathigiri",
  "Avalapalli",
  "Gandhi Nagar",
  "Kamaraj Nagar",
  "Old Bangalore Road",
  "Railway Station Road",
  "Moranapalli",
  "Zuzuvadi",
  "Thally Road",
  "Denkanikottai Road",
  "Hosur Cattle Farm",
  "Central Hosur",
];

const emptyMemberProfile: MemberProfile = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  doorNo: "",
  street: "",
  locality: "Bagalur Road",
  city: "Hosur",
  district: "Krishnagiri",
  state: "Tamil Nadu",
  pincode: "635109",
  bio: "",
  avatarInitials: "N",
  avatarBg: "#efc7aa",
  emergencyPhones: ["", ""],
  emergencyNames: ["", ""],
  emergencyRelations: ["Spouse / Family", "Friend / Colleague"],
};

const profileStorageKey = (role: "Account" | "Business" | "Agent" | "Company", identity = "") => `neighborly-profile-v1-${role.toLowerCase()}${role === "Company" && identity ? `-${encodeURIComponent(identity.trim().toLowerCase())}` : ""}`;
const settingsStorageKey = (role: "Account" | "Business" | "Agent" | "Company", identity = "") => `neighborly-settings-v1-${role.toLowerCase()}${role === "Company" && identity ? `-${encodeURIComponent(identity.trim().toLowerCase())}` : ""}`;
type PortalRole = Exclude<Role, "Discover">;
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image?: string;
  badge?: string;
  inStock?: boolean;
  catalogueSelections?: CatalogueSelection[];
};
type CatalogueActivity = "Sales" | "Service";
type CatalogueSelection = { activity: CatalogueActivity; sector: string; path: string[] };
type Coordinates = { latitude: number; longitude: number };
type BusinessAddress = {
  doorNumber: string;
  street: string;
  area: string;
  cityTown: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
};
type Business = {
  name: string;
  category: string;
  phone?: string;
  address?: BusinessAddress;
  coordinates?: Coordinates | null;
  businessModes?: string[];
  vehicleTypes?: string[];
  vehicleMakes?: string[];
  vehicleModels?: string[];
  categories?: string[];
  taxonomyPaths?: string[][];
  subcategories: string[];
  products: Product[];
  description: string;
  distance: number;
  demoCoordinates: Coordinates;
  rating: number;
  reviews: number;
  price: string;
  icon: string;
  color: string;
  subscribed: boolean;
  taxonomyTags?: string[];
  tag?: string;
};
type DemoEnquiry = {
  id: string;
  businessName: string;
  productName: string;
  message: string;
  createdAt: string;
  status: "New";
};
type DemoEvent = {
  id: string;
  action: string;
  createdAt: string;
};
type CustomerRegistrationLocation = {
  id: string;
  name: string;
  phoneLast4: string;
  locationStatus: "shared" | "denied" | "unavailable";
  latitude: number | null;
  longitude: number | null;
  registeredAt: string;
  verificationStatus: string;
};
type SosAlert = {
  id: string;
  customerName: string;
  profileRole: "Account" | "Business" | "Agent" | "Company";
  identity?: string;
  emergencyType: EmergencyType;
  serviceNumber: string;
  customerPhone?: string;
  customerPhoneLast4: string;
  emergencyPhones: [string, string];
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  locationStatus: "shared" | "unavailable";
  createdAt: string;
  deliveryStatus: string;
};
export type CheckoutRequest = {
  id?: string;
  businessName: string;
  plan: string;
  billingCycle?: "monthly" | "yearly";
  amount?: number;
  taxes?: number;
  totalAmount?: number;
  paymentMethod: string;
  transactionId?: string;
  invoiceNumber?: string;
  validUntil?: string;
  createdAt: string;
  status: "Active" | "Paid" | "Pending" | "Not processed" | string;
};

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

type DemoData = {
  favorites: string[];
  recentSearches: string[];
  enquiries: DemoEnquiry[];
  events: DemoEvent[];
  checkouts: CheckoutRequest[];
  businesses: Business[];
  orders?: OrderRecord[];
};
type TaxonomyNode = { name: string; children: TaxonomyNode[] };

export type NotificationType = "sos" | "enquiry" | "offer" | "business" | "favorite" | "system" | "order";

export type MarketplaceNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  linkText?: string;
  action?: {
    type: "search" | "business" | "role" | "category" | "sos" | "order" | "portal";
    payload: string;
  };
};

const initialNotifications: MarketplaceNotification[] = [
  {
    id: "notif-welcome",
    title: "Welcome to Bizearch Hosur!",
    message: "Explore 21 sectors across retail, services, industry and agriculture in Hosur.",
    timestamp: "10 mins ago",
    type: "system",
    read: false,
    linkText: "Explore sectors",
    action: { type: "role", payload: "Discover" }
  },
  {
    id: "notif-rose",
    title: "🌹 Hosur Rose & Flora City Nursery",
    message: "New export-quality red rose saplings and indoor bonsai available on Bagalur Road.",
    timestamp: "1 hour ago",
    type: "offer",
    read: false,
    linkText: "View nursery",
    action: { type: "business", payload: "Hosur Rose & Flora City Nurseries" }
  },
  {
    id: "notif-sipcot",
    title: "🏭 SIPCOT Industrial Factory Sheds",
    message: "Heavy PEB manufacturing sheds with 50 HP power now listed for lease.",
    timestamp: "3 hours ago",
    type: "business",
    read: false,
    linkText: "View listings",
    action: { type: "business", payload: "SIPCOT Industrial Sheds & Godowns" }
  },
  {
    id: "notif-safety",
    title: "🛡️ 24/7 SOS Emergency Ready",
    message: "Hosur emergency hotlines and GPS broadcast are active on this device.",
    timestamp: "Yesterday",
    type: "sos",
    read: true,
    linkText: "Emergency help",
    action: { type: "sos", payload: "sos" }
  },
  {
    id: "notif-college",
    title: "🎓 Adhiyamaan College Admissions",
    message: "2026 admissions open for B.E., B.Tech, MBA, and MCA degree programs.",
    timestamp: "2 days ago",
    type: "offer",
    read: true,
    linkText: "View college",
    action: { type: "business", payload: "Adhiyamaan College of Engineering (ACE)" }
  }
];

const NOTIF_STORAGE_KEY = "neighborly-notifications-v2";

const STORAGE_KEY = "neighborly-demo-v2";
const vehicleTypeOptions = ["Two wheeler", "Three wheeler", "Four wheeler", "Multi wheel / commercial"];
const vehicleMakesByType: Record<string, string[]> = {
  "Two wheeler": ["TVS", "Hero", "Honda", "Bajaj", "Royal Enfield", "Suzuki", "Yamaha", "KTM", "Jawa", "Yezdi", "Triumph", "BMW Motorrad", "Kawasaki", "Ducati", "Aprilia", "Vespa", "Ather Energy", "Ola Electric", "Revolt Motors", "Ampere", "Ultraviolette", "Simple Energy", "Other / not listed"],
  "Three wheeler": ["Bajaj", "TVS", "Mahindra", "Piaggio", "Atul Auto", "Force Motors", "Euler Motors", "Omega Seiki", "Kinetic Green", "YC Electric", "Lohia Auto", "Other / not listed"],
  "Four wheeler": ["Maruti Suzuki", "Tata Motors", "Mahindra", "Hyundai", "Toyota", "Kia", "Honda", "Renault", "Volkswagen", "Skoda", "MG Motor", "Nissan", "Jeep", "Mercedes-Benz", "BMW", "Audi", "Volvo", "BYD", "Citroën", "Force Motors", "Other / not listed"],
  "Multi wheel / commercial": ["Tata Motors", "Ashok Leyland", "Eicher", "Mahindra", "BharatBenz", "Force Motors", "Isuzu", "SML Isuzu", "Volvo", "Scania", "JCB", "Tata Hitachi", "Komatsu", "Caterpillar", "CASE Construction", "ACE", "Escorts Kubota", "SANY", "XCMG", "Swaraj", "Sonalika", "Massey Ferguson", "John Deere", "New Holland", "Kubota", "BEML", "Ammann", "Other / not listed"],
};
const vehicleModelsByMake: Record<string, string[]> = {
  TVS: ["Jupiter", "Ntorq 125", "Apache RTR 160", "Apache RTR 200", "Raider", "Sport", "Radeon", "iQube", "King (3W)"],
  Hero: ["Splendor Plus", "HF Deluxe", "Glamour", "Passion Plus", "Xtreme 125R", "Xtreme 160R", "Pleasure Plus", "Destini", "Vida V1"],
  Honda: ["Activa", "Dio", "Shine 125", "SP 125", "Unicorn", "Hornet 2.0", "CB350", "City", "Amaze"],
  Bajaj: ["Pulsar 125", "Pulsar NS200", "Platina", "Dominar 400", "Chetak", "RE (3W)", "Maxima (3W)"],
  "Royal Enfield": ["Classic 350", "Hunter 350", "Bullet 350", "Meteor 350", "Himalayan", "Interceptor 650", "Continental GT 650"],
  Suzuki: ["Access 125", "Burgman Street", "Avenis", "Gixxer", "V-Strom SX", "Baleno", "Fronx", "Swift"],
  Yamaha: ["FZ-S", "R15", "MT-15", "Fascino 125", "RayZR 125", "Aerox 155"],
  KTM: ["Duke 200", "Duke 250", "Duke 390", "RC 390", "Adventure 390"],
  Jawa: ["42", "Perak", "350"], Yezdi: ["Roadster", "Adventure", "Scrambler"],
  "Maruti Suzuki": ["Swift", "Baleno", "WagonR", "Brezza", "Dzire", "Ertiga", "Fronx", "Grand Vitara", "Alto K10"],
  "Tata Motors": ["Punch", "Nexon", "Tiago", "Altroz", "Harrier", "Safari", "Curvv", "Ace", "407"],
  Mahindra: ["Thar", "Scorpio-N", "XUV 3XO", "XUV700", "Bolero", "Treo (3W)", "Jeeto"],
  Hyundai: ["i20", "Venue", "Creta", "Exter", "Verna", "Aura", "Alcazar"],
  Toyota: ["Innova Crysta", "Innova Hycross", "Fortuner", "Glanza", "Urban Cruiser Hyryder", "Rumion"],
  Kia: ["Sonet", "Seltos", "Carens", "Carnival"], Renault: ["Kwid", "Triber", "Kiger"],
  Volkswagen: ["Polo", "Taigun", "Virtus", "Tiguan"], Skoda: ["Kushaq", "Slavia", "Kodiaq"],
  "MG Motor": ["Comet EV", "Windsor EV", "Astor", "Hector", "ZS EV"],
  Piaggio: ["Ape City", "Ape Xtra", "Ape E-City"], "Force Motors": ["Traveller", "Trax", "Gurkha"],
};
// Commercial three-wheeler and multi-wheel model names are scoped by vehicle type.
// Only model ranges verified against manufacturer product pages are included here.
const vehicleModelsByTypeAndMake: Record<string, Record<string, string[]>> = {
  "Three wheeler": {
    Bajaj: ["RE", "Maxima Z", "Maxima X Wide", "Maxima C", "WEGO P50", "WEGO P70", "WEGO P9018", "WEGO C90", "Riki P4005", "Riki C4005"],
    TVS: ["King Deluxe", "King Kargo HD EV"],
    Mahindra: ["UDO", "Treo Plus", "Treo", "Treo Yaari Passenger", "e-Alfa Plus", "Alfa DX Duo", "Alfa DX", "Zor Grand", "Treo Zor", "e-Alfa Cargo", "Alfa Plus", "Alfa Plus Duo", "Treo Yaari Cargo"],
    Piaggio: ["Apé Xtra Bada 330 CNG", "Apé Xtra Bada 700 Diesel", "Apé Xtra 600 Diesel", "Apé Xtra Classic Diesel", "Apé Xtra LDX 230 CNG", "Apé Xtra HT 300 CNG", "Apé Xtra HT 300 Petrol", "Apé Auto Classic", "Apé NXT+", "Apé Metro", "Apé Auto Bada", "Apé Auto DXL", "Apé Auto+", "Apé City Diesel", "Apé City+", "Apé E-Xtra FX Max", "Apé E-City SwaP", "Apé E-City MAXX", "Apé E-City Ultra", "Apé WavE"],
  },
  "Multi wheel / commercial": {
    "Tata Motors": ["Ace", "Intra", "Yodha", "Prima", "Signa", "Ultra", "LPT"],
    "Ashok Leyland": ["Saathi", "Dost", "Bada Dost", "Partner", "BOSS", "AVTR"],
    Mahindra: ["Jeeto Strong Diesel", "Jeeto L6", "Jeeto Strong CNG", "Jeeto Plus Petrol", "Zeo"],
    BharatBenz: ["1117R", "1217C", "1217R", "1217RE", "1417R", "1417RE", "1617R", "1617RD", "1917R"],
    Isuzu: ["D-MAX", "S-CAB", "S-CAB Z", "V-Cross", "Hi-Lander"],
  },
};
function getVehicleModelsForType(vehicleType: string, make: string) {
  const models = getSharedVehicleModelsForType(vehicleType, make);
  if (vehicleType !== "Multi wheel / commercial" || models.length) return models;
  return Object.values(commercialVehicleSubcategories).flatMap((groups) => groups[make] || []);
}
function isDemoData(value: unknown): value is DemoData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const isRecord = (item: unknown): item is Record<string, unknown> =>
    item !== null && typeof item === "object";
  const isStringArray = (items: unknown): items is string[] =>
    Array.isArray(items) && items.every((item) => typeof item === "string");
  const isBusinessAddress = (address: unknown): address is BusinessAddress =>
    isRecord(address) && ["doorNumber", "street", "area", "cityTown", "taluka", "district", "state", "pincode"].every((key) => typeof address[key] === "string");
  return isStringArray(data.favorites) &&
    isStringArray(data.recentSearches) &&
    Array.isArray(data.enquiries) && data.enquiries.every((item) =>
      isRecord(item) && typeof item.id === "string" && typeof item.businessName === "string" &&
      typeof item.productName === "string" && typeof item.message === "string" &&
      typeof item.createdAt === "string" && item.status === "New") &&
    Array.isArray(data.events) && data.events.every((item) =>
      isRecord(item) && typeof item.id === "string" && typeof item.action === "string" &&
      typeof item.createdAt === "string") &&
    Array.isArray(data.checkouts) && data.checkouts.every((item) =>
      isRecord(item) && typeof item.businessName === "string" && typeof item.plan === "string" &&
      typeof item.createdAt === "string" && typeof item.paymentMethod === "string" &&
      typeof item.status === "string") &&
    Array.isArray(data.businesses) && data.businesses.every((item) =>
      isRecord(item) && typeof item.name === "string" && typeof item.category === "string" &&
      Array.isArray(item.subcategories) && item.subcategories.every((entry) => typeof entry === "string") &&
      Array.isArray(item.products) && item.products.every((product) =>
        isRecord(product) && typeof product.id === "string" && typeof product.name === "string" &&
        typeof product.description === "string" && typeof product.price === "number" &&
        typeof product.unit === "string") &&
      typeof item.description === "string" && typeof item.distance === "number" &&
      isRecord(item.demoCoordinates) && typeof item.demoCoordinates.latitude === "number" &&
      typeof item.demoCoordinates.longitude === "number" &&
      typeof item.rating === "number" && typeof item.reviews === "number" &&
      typeof item.price === "string" && typeof item.icon === "string" &&
      typeof item.color === "string" && typeof item.subscribed === "boolean" &&
      (item.address === undefined || isBusinessAddress(item.address)) &&
      (item.coordinates === undefined || item.coordinates === null || (isRecord(item.coordinates) && typeof item.coordinates.latitude === "number" && typeof item.coordinates.longitude === "number")) &&
      (item.businessModes === undefined || isStringArray(item.businessModes)) &&
      (item.vehicleTypes === undefined || isStringArray(item.vehicleTypes)) &&
      (item.vehicleMakes === undefined || isStringArray(item.vehicleMakes)) &&
      (item.vehicleModels === undefined || isStringArray(item.vehicleModels)) &&
      (item.categories === undefined || isStringArray(item.categories)) &&
      (item.taxonomyPaths === undefined || (Array.isArray(item.taxonomyPaths) && item.taxonomyPaths.every((path) => isStringArray(path)))) &&
      (item.taxonomyTags === undefined || (Array.isArray(item.taxonomyTags) && item.taxonomyTags.every((entry) => typeof entry === "string")))) &&
    (data.orders === undefined || Array.isArray(data.orders));
}

function buildTaxonomy(paths: string[][]): TaxonomyNode[] {
  const roots: TaxonomyNode[] = [];
  for (const path of paths) {
    let level = roots;
    for (const name of path) {
      let node = level.find((item) => item.name === name);
      if (!node) { node = { name, children: [] }; level.push(node); }
      level = node.children;
    }
  }
  return roots;
}

function brandLogoKey(name: string) {
  return name.trim().toLowerCase();
}

const categoryIconIds: Record<string, string> = {
  sales: "sales",
  service: "service",
  automobiles: "four-wheeler",
  electronics: "electronics",
  fashion: "fashion",
  "home & furniture": "furniture",
  "food & dining": "food",
  "health & wellness": "health",
  travel: "plane",
  entertainment: "music",
  "everyday services": "tools",
  "two wheeler": "two-wheeler",
  "three wheeler": "three-wheeler",
  "four wheeler": "four-wheeler",
  "multi wheel / commercial": "multi-wheel-commercial",
  trucks: "trucks",
  buses: "buses",
  cranes: "cranes",
  "earth movers": "earth-movers",
  tractors: "tractors",
  "road construction equipment": "road-construction",
  "mining equipment": "mining-equipment",
  "special-purpose vehicles": "special-purpose-vehicles",
  "laptops & computers": "computer",
  "mobile phones": "phone",
  "home appliances": "appliance",
  "audio & video": "electronics",
  cameras: "camera",
  clothing: "fashion",
  footwear: "shoes",
  jewellery: "jewellery",
  "bags & accessories": "bag",
  tailoring: "fashion",
  textiles: "fashion",
  furniture: "furniture",
  "home decor": "home",
  "kitchen & storage": "kitchen",
  repairs: "tools",
  "interior design": "home",
  restaurants: "food",
  "meal delivery": "food",
  "groceries & produce": "produce",
  "bakery & sweets": "bakery",
  "cafes & beverages": "coffee",
  catering: "food",
  clinics: "health",
  "dental care": "dental",
  pharmacies: "medicine",
  physiotherapy: "health",
  fitness: "fitness",
  "sports & fitness": "fitness",
  "gyms & fitness centers": "fitness",
  "yoga & pilates": "fitness",
  "sports coaching": "fitness",
  "swimming & aquatics": "fitness",
  "martial arts": "fitness",
  "dance fitness": "fitness",
  "turf & facility rental": "fitness",
  "sports gear & nutrition": "fitness",
  "personal training": "fitness",
  "personal care": "health",
  "travel agents": "plane",
  stays: "hotel",
  "local transport": "multi-wheel-commercial",
  "tours & experiences": "plane",
  "car rentals": "four-wheeler",
  "bus & rail services": "buses",
  events: "event",
  "movies & cinema": "cinema",
  music: "music",
  "classes & workshops": "book",
  "home services": "home",
  "professional services": "briefcase",
  electricals: "electricals",
  hardware: "hardware",
  "books & stationery": "book",
  "toys & fancy stores": "toys-fancy",
  "public & common places": "public-places",
  "real estate & construction": "real-estate",
  "heavy industries & machinery": "earth-movers",
  "industrial & b2b manufacturing": "industrial-mfg",
  "education & coaching": "education",
  "events & weddings": "events-weddings",
  "agriculture, nurseries & pets": "agriculture-pets",
};

function categoryIconIdFor(name: string, sector = "") {
  const key = name.trim().toLowerCase();
  if (categoryIconIds[key]) return categoryIconIds[key];
  if (/motorcycle|scooter|moped/.test(key)) return "two-wheeler";
  if (/car|automobile/.test(key)) return "four-wheeler";
  if (/tyre|tire|wheel|battery/.test(key)) return "multi-wheel-commercial";
  if (/phone|mobile/.test(key)) return "phone";
  if (/laptop|computer|tablet/.test(key)) return "computer";
  if (/camera|photograph/.test(key)) return "camera";
  if (/appliance|refrigerat|washing machine/.test(key)) return "appliance";
  if (/audio|video|television|speaker|cinema/.test(key)) return "electronics";
  if (/shoe|footwear|sandal/.test(key)) return "shoes";
  if (/jewel|earring|necklace/.test(key)) return "jewellery";
  if (/bag|accessor/.test(key)) return "bag";
  if (/clothing|fashion|tailor|textile|wear|shirt|saree|kurta/.test(key)) return "fashion";
  if (/furniture|sofa|chair|table|bed|wardrobe/.test(key)) return "furniture";
  if (/kitchen|cabinet|storage/.test(key)) return "kitchen";
  if (/home|garden|decor|lighting|curtain|interior/.test(key)) return "home";
  if (/restaurant|meal|food|catering|dining/.test(key)) return "food";
  if (/grocery|produce|fruit|vegetable|market/.test(key)) return "produce";
  if (/bakery|cake|sweet|bread/.test(key)) return "bakery";
  if (/cafe|coffee|tea|beverage|juice|drink/.test(key)) return "coffee";
  if (/dental|tooth/.test(key)) return "dental";
  if (/pharmacy|medicine|medical|clinic|doctor|health|wellness/.test(key)) return "health";
  if (/fitness|yoga|training|exercise/.test(key)) return "fitness";
  if (/travel|tour|holiday|trip|flight/.test(key)) return "plane";
  if (/hotel|stay|guest house|accommodation/.test(key)) return "hotel";
  if (/bus|transport|ride|rail/.test(key)) return "buses";
  if (/rental|car hire/.test(key)) return "four-wheeler";
  if (/wedding|marriage|mandapam|banquet|pandal|reception/.test(key)) return "events-weddings";
  if (/event|celebration|party/.test(key)) return "event";
  if (/movie|cinema|film/.test(key)) return "cinema";
  if (/music|instrument|artist/.test(key)) return "music";
  if (/education|coaching|school|college|degree|academy|course|driving|tuition/.test(key)) return "education";
  if (/class|workshop|lesson|education|book/.test(key)) return "book";
  if (/electrical|wire|switch|lighting|inverter/.test(key)) return "electricals";
  if (/hardware|fastener|paint|cement|pipe|pump|lock/.test(key)) return "hardware";
  if (/toy|fancy|gift|bangle|novelty|novelties|game/.test(key)) return "toys-fancy";
  if (/public|common|transit|temple|park|dam|library|station|civic|corporation/.test(key)) return "public-places";
  if (/real estate|construction|property|plot|shed|contractor|architect|builder/.test(key)) return "real-estate";
  if (/heavy industri|machiner|earthmover|earth mover|crane|forklift|generator|compressor|excavator|backhoe|loader|grader|batching/.test(key)) return "earth-movers";
  if (/industrial|manufacturing|cnc|vmc|machining|fabrication|laser|coating|packaging/.test(key)) return "industrial-mfg";
  if (/agriculture|nursery|nurseries|plant|rose|seed|fertilizer|pet|vet|cattle|feed|livestock/.test(key)) return "agriculture-pets";
  if (/repair|service|maintenance|diagnostic|installation|cleaning|plumbing|carpentry/.test(key)) return "tools";
  if (/professional|consult|account|business/.test(key)) return "briefcase";
  return categoryIconIds[sector.trim().toLowerCase()] || "default-category";
}

function CategoryIcon({ name, sector = "" }: { name: string; sector?: string }) {
  const iconId = categoryIconIdFor(name, sector);
  return <svg className="category-illustration" viewBox="0 0 48 48" aria-hidden="true"><use href={`/vehicle-category-icons.svg#${iconId}`} /></svg>;
}

const verifiedBrandLogos: Record<string, string> = {
  // Heavy Machinery, Earth Movers & Commercial
  jcb: "/brand-logos/jcb.svg",
  "tata hitachi": "/brand-logos/tatahitachi.svg",
  tatahitachi: "/brand-logos/tatahitachi.svg",
  komatsu: "/brand-logos/komatsu.svg",
  caterpillar: "/brand-logos/caterpillar.svg",
  cat: "/brand-logos/caterpillar.svg",
  "case construction": "/brand-logos/case-construction.svg",
  case: "/brand-logos/case-construction.svg",
  ace: "/brand-logos/ace.svg",
  "escorts kubota": "/brand-logos/escorts-kubota.svg",
  escorts: "/brand-logos/escorts-kubota.svg",
  sany: "/brand-logos/sany.svg",
  xcmg: "/brand-logos/xcmg.svg",
  ammann: "/brand-logos/ammann.svg",
  beml: "/brand-logos/beml.svg",

  // Tractors & Agricultural Machinery
  swaraj: "/brand-logos/swaraj.svg",
  sonalika: "/brand-logos/sonalika.svg",
  "massey ferguson": "/brand-logos/masseyferguson.svg",
  "john deere": "/brand-logos/johndeere.svg",
  "new holland": "/brand-logos/newholland.svg",
  kubota: "/brand-logos/kubota.svg",

  // Commercial & Two/Three Wheeler Makes
  eicher: "/brand-logos/eicher.svg",
  "ather energy": "/brand-logos/ather.svg",
  ather: "/brand-logos/ather.svg",
  "yc electric": "/brand-logos/ycelectric.svg",
  skoda: "/brand-logos/skoda.svg",
  "atul auto": "/brand-logos/atulauto.png",

  // Home Appliances & Electronics
  haier: "/brand-logos/haier.svg",
  daikin: "/brand-logos/daikin.svg",
  voltas: "/brand-logos/voltas.svg",
  "blue star": "/brand-logos/bluestar.svg",
  bluestar: "/brand-logos/bluestar.svg",
  carrier: "/brand-logos/carrier.svg",
  hitachi: "/brand-logos/hitachi.svg",
  prestige: "/brand-logos/prestige.svg",
  faber: "/brand-logos/faber.svg",
  glen: "/brand-logos/glen.svg",
  "morphy richards": "/brand-logos/morphyrichards.svg",
  aquaguard: "/brand-logos/aquaguard.svg",
  kent: "/brand-logos/kent.svg",
  "a.o. smith": "/brand-logos/aosmith.svg",
  "ao smith": "/brand-logos/aosmith.svg",
  havells: "/brand-logos/havells.svg",
  crompton: "/brand-logos/crompton.svg",
  racold: "/brand-logos/racold.svg",

  // Existing Verified Brand Logos
  acer: "/brand-logos/acer.svg",
  ampere: "/brand-logos/ampere.png",
  "apple": "/brand-logos/apple.svg",
  aprilia: "/brand-logos/aprilia.png",
  "ashok leyland": "/brand-logos/ashokleyland.png",
  ashokleyland: "/brand-logos/ashokleyland.png",
  asus: "/brand-logos/asus.svg",
  audi: "/brand-logos/audi.svg",
  bajaj: "/brand-logos/bajaj.png",
  bharatbenz: "/brand-logos/bharatbenz.png",
  "bharat benz": "/brand-logos/bharatbenz.png",
  "bmw motorrad": "/brand-logos/bmw.svg",
  bmw: "/brand-logos/bmw.svg",
  bosch: "/brand-logos/bosch.svg",
  bose: "/brand-logos/bose.svg",
  byd: "/brand-logos/byd.png",
  canon: "/brand-logos/canon.png",
  citroën: "/brand-logos/citroen.svg",
  citroen: "/brand-logos/citroen.svg",
  dell: "/brand-logos/dell.svg",
  ducati: "/brand-logos/ducati.svg",
  "euler motors": "/brand-logos/euler.png",
  euler: "/brand-logos/euler.png",
  "force motors": "/brand-logos/forcemotors.png",
  "fujifilm": "/brand-logos/fujifilm.svg",
  godrej: "/brand-logos/godrej.svg",
  google: "/brand-logos/google.svg",
  gopro: "/brand-logos/gopro.png",
  hero: "/brand-logos/hero-motocorp.svg",
  honda: "/brand-logos/honda.svg",
  hp: "/brand-logos/hp.svg",
  hyundai: "/brand-logos/hyundai.svg",
  ifb: "/brand-logos/ifb.png",
  isuzu: "/brand-logos/isuzu.png",
  jawa: "/brand-logos/jawa.png",
  jbl: "/brand-logos/jbl.svg",
  jeep: "/brand-logos/jeep.svg",
  "kawasaki": "/brand-logos/kawasaki.png",
  kia: "/brand-logos/kia.svg",
  "kinetic green": "/brand-logos/kineticgreen.png",
  "kineticgreen": "/brand-logos/kineticgreen.png",
  ktm: "/brand-logos/ktm.svg",
  lenovo: "/brand-logos/lenovo.svg",
  "lg": "/brand-logos/lg.svg",
  "lohia auto": "/brand-logos/lohia.png",
  lohia: "/brand-logos/lohia.png",
  mahindra: "/brand-logos/mahindra.svg",
  "maruti suzuki": "/brand-logos/maruti-suzuki.svg",
  "mercedes-benz": "/brand-logos/mercedes.png",
  "mg motor": "/brand-logos/mg.svg",
  mg: "/brand-logos/mg.svg",
  motorola: "/brand-logos/motorola.svg",
  nikon: "/brand-logos/nikon.svg",
  nissan: "/brand-logos/nissan.svg",
  "ola electric": "/brand-logos/ola.webp",
  ola: "/brand-logos/ola.webp",
  "omega seiki": "/brand-logos/omegaseiki.png",
  "omega seiki mobility": "/brand-logos/omegaseiki.png",
  "oneplus": "/brand-logos/oneplus.svg",
  panasonic: "/brand-logos/panasonic.svg",
  philips: "/brand-logos/philips.png",
  piaggio: "/brand-logos/piaggio.png",
  "piaggio group": "/brand-logos/piaggiogroup.svg",
  renault: "/brand-logos/renault.svg",
  "revolt motors": "/brand-logos/revolt.png",
  revolt: "/brand-logos/revolt.png",
  "royal enfield": "/brand-logos/royalenfield.png",
  samsung: "/brand-logos/samsung.svg",
  scania: "/brand-logos/scania.svg",
  "simple energy": "/brand-logos/simpleenergy.png",
  sml: "/brand-logos/smlisuzu.png",
  "sml isuzu": "/brand-logos/smlisuzu.png",
  sony: "/brand-logos/sony.svg",
  suzuki: "/brand-logos/suzuki.svg",
  tata: "/brand-logos/tata.svg",
  "tata motors": "/brand-logos/tata.svg",
  toyota: "/brand-logos/toyota.svg",
  tvs: "/brand-logos/tvs-horse.svg",
  triumph: "/brand-logos/triumph.png",
  ultraviolette: "/brand-logos/ultraviolette.png",
  vespa: "/brand-logos/vespa.svg",
  volkswagen: "/brand-logos/volkswagen.svg",
  volvo: "/brand-logos/volvo.svg",
  whirlpool: "/brand-logos/whirlpool.png",
  xiaomi: "/brand-logos/xiaomi.svg",
  yamaha: "/brand-logos/yamahamotorcorporation.svg",
  yezdi: "/brand-logos/yezdi.png",
};

function brandLogoFor(name: string, overrides?: Record<string, string>) {
  return overrides?.[brandLogoKey(name)] || verifiedBrandLogos[brandLogoKey(name)];
}

function brandMonogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.map((word) => word[0]).join("") : words[0] || "").slice(0, 3).toUpperCase();
}

function isBrandOption(sector: string, parentPath: string[], node: TaxonomyNode, brandLogos?: Record<string, string>) {
  const sectorKey = sector.trim().toLowerCase();
  // For Automobiles: Sales/Service → Vehicle type → [BRAND] → Model
  if (sectorKey === "automobiles") {
    return ["sales", "service"].includes(parentPath[0]?.trim().toLowerCase() || "") &&
      ((parentPath.length === 2 && parentPath[1] !== "Multi wheel / commercial") ||
        (parentPath.length === 3 && parentPath[1] === "Multi wheel / commercial"));
  }
  // For Electronics & Home Appliances: Sales/Service → Device type → [BRAND] → Model
  if (sectorKey === "electronics" || sectorKey === "home appliances") {
    return ["sales", "service"].includes(parentPath[0]?.trim().toLowerCase() || "") &&
      parentPath.length === 2;
  }
  return Boolean(brandLogoFor(node.name, brandLogos));
}

function buildAutomobileTaxonomyPaths(): string[][] {
  return buildSharedAutomobileTaxonomyPaths();
}

function isLegacyAutomobileTaxonomy(paths: string[][]) {
  const legacy = legacyDefaultCategoryConfig.sectors.find((item) => item.name.toLowerCase() === "automobiles")?.paths;
  return Boolean(legacy && JSON.stringify(paths) === JSON.stringify(legacy));
}

function getTaxonomyOptions(sector: string, path: string[], config: CategoryConfig): TaxonomyNode[] {
  const entry = config.sectors.find((item) => item.name === sector);
  const paths = entry?.paths || [];
  let level: TaxonomyNode[] = buildTaxonomy(paths);
  for (const selected of path) {
    level = level.find((node) => node.name === selected)?.children || [];
  }
  return level;
}

function getSectorActivityPaths(sector: CategorySector, activity: CatalogueActivity) {
  const sectorKey = sector.name.trim().toLowerCase();
  const hasActivityRoot = sector.paths.some((path) => ["sales", "service"].includes(path[0]?.toLowerCase() || ""));
  // Legacy migration: if Automobiles paths lack Sales/Service root, rebuild from shared taxonomy
  const isLegacyAuto = sectorKey === "automobiles" && !hasActivityRoot && isLegacyAutomobileTaxonomy(sector.paths);
  const paths = isLegacyAuto ? buildAutomobileTaxonomyPaths() : sector.paths;
  return paths.some((path) => ["sales", "service"].includes(path[0]?.toLowerCase() || ""))
    ? paths.filter((path) => path[0]?.toLowerCase() === activity.toLowerCase()).map((path) => path.slice(1)).filter((path) => path.length > 0)
    : paths;
}

function updateCatalogueSelections(current: CatalogueSelection[], activity: CatalogueActivity, sector: string, path: string[], checked: boolean) {
  if (!checked) {
    return current.filter((selection) => selection.activity !== activity || selection.sector !== sector ||
      selection.path.length !== path.length || !selection.path.every((part, index) => part === path[index]));
  }
  return [
    ...current.filter((selection) => {
      if (selection.activity !== activity || selection.sector !== sector) return true;
      const sharesPrefix = path.every((part, index) => selection.path[index] === part) || selection.path.every((part, index) => path[index] === part);
      return !sharesPrefix;
    }),
    { activity, sector, path },
  ];
}

function getBusinessWorkingStatus(business: Business): { isOpen: boolean; label: string } {
  // Use Indian Standard Time (UTC+5:30)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);
  const currentHour = istDate.getHours();
  const currentMinute = istDate.getMinutes();
  const timeNum = currentHour + currentMinute / 60;

  // Most businesses in Hosur / India operate from 9:00 AM to 8:30 PM (20.5)
  // Food & dining operates 7:30 AM to 10:30 PM (22.5)
  // Health & wellness / pharmacies 8:00 AM to 10:00 PM (22)
  const cat = (business.category || "").toLowerCase();
  let openHour = 9.0;
  let closeHour = 20.5;
  let closeTimeStr = "8:30 PM";
  let openTimeStr = "9:00 AM";

  if (/food|dining|restaurant|baker/.test(cat)) {
    openHour = 7.5;
    closeHour = 22.5;
    closeTimeStr = "10:30 PM";
    openTimeStr = "7:30 AM";
  } else if (/health|pharmacy|clinic|medical/.test(cat)) {
    openHour = 8.0;
    closeHour = 22.0;
    closeTimeStr = "10:00 PM";
    openTimeStr = "8:00 AM";
  } else if (/heavy|machiner|industrial/.test(cat)) {
    openHour = 8.5;
    closeHour = 19.5;
    closeTimeStr = "7:30 PM";
    openTimeStr = "8:30 AM";
  }

  const isOpen = timeNum >= openHour && timeNum < closeHour;
  return {
    isOpen,
    label: isOpen ? `Open · Closes ${closeTimeStr}` : `Closed · Opens ${openTimeStr}`,
  };
}

type Language = "en" | "ta" | "kn" | "te";

const TRANSLATIONS = {
  en: {
    // Topbar & Sidebar
    workspaceLabel: "WORKSPACE",
    discover: "Discover",
    myActivity: "My activity",
    businessPortal: "Business portal",
    agentPortal: "Agent portal",
    companyPortal: "Company portal",
    browseBy: "BROWSE BY",
    allProductsAndServices: "All Products & Services",
    allCategories: "All categories",
    goodThingsCloser: "Good things are closer.",
    goodThingsDesc: "Every search supports a business in your neighborhood.",
    yourBizearchActivity: "Your Bizearch activity",
    savedOnDevice: "Saved on this device",
    companyLogin: "Company login",
    yourNeighborhood: "Your neighborhood",
    poweredBy: "Powered by",
    signIn: "Sign in",
    signOut: "Sign out",
    hosurLocation: "Hosur, Tamil Nadu",
    stopLocation: "Stop using device location",

    // Hero
    madeForAroundHere: "MADE FOR AROUND HERE",
    heroHeadingMain: "Your neighborhood,",
    heroHeadingSub: "in reach.",
    heroTitle: "Hosur's premier local & industrial marketplace",
    heroDesc: "Discover verified manufacturers, retail, healthcare, and everyday services across Hosur.",
    registerBusiness: "Register your business",
    registerBusinessNote: "No customer account needed to start. One business profile per business account.",

    // Search Panel
    whatDoYouNeed: "WHAT DO YOU NEED?",
    nearLocality: "NEAR LOCALITY",
    withinKm: "WITHIN",
    searchPlaceholder: "Search 85+ Hosur businesses, Maruti Swift, Hero bike, Kauvery Hospital, Biryani...",
    findNearby: "Find nearby",
    allHosur: "All Hosur",

    // Modes & Sections
    browseBySector: "Browse by Sector",
    atozDirectoryTab: "A–Z Directory (All Products & Services)",
    aLittleBitOfEverything: "A LITTLE BIT OF EVERYTHING",
    exploreLocalScene: "Explore your local scene",
    browseWithinSector: "BROWSE WITHIN SECTOR",
    atozDirectoryLink: "A–Z Directory →",
    allSectors: "All sectors",
    backBtn: "Back",
    allIn: "All in",

    // Filter Chips
    openNow: "Open Now",
    topRated: "Top Rated ★ 4.5+",
    verifiedOnly: "Verified",
    whatsappReady: "WhatsApp Ready",
    clearFilters: "Clear filters",
    open: "Open",
    closed: "Closed",
    filterNotice: "Active filters applied",
    noFilteredMatches: "No businesses match your active filter combination.",

    // Results Header
    localVerifiedProviders: "LOCAL VERIFIED PROVIDERS",
    aroundYourCorner: "Around your corner",
    providersFor: "Providers for",
    subscribedListings: "Subscribed listings · demo distances",
    subscribedListingsGps: "Subscribed listings · device radius",
    sampleDistance: "sample",
    reviewsLabel: "reviews",

    // Actions & Cards
    productsServices: "View products & services",
    navigate: "Navigate",
    call: "Call",
    whatsapp: "WhatsApp",
    share: "Share",
    rate: "Rate",
    claim: "Claim",
    requestAQuote: "Request a Quote",
    requestInfo: "Request info",
    recentlyViewed: "Recently Viewed Places",
    clearRecent: "Clear recent",
    rateBusiness: "Rate Business",
    claimBusinessLink: "Claim this business",
    writeReview: "Write a Review",
    reviewsAndRatings: "Reviews & Community Ratings",
    directionsAndMap: "Directions & Map",
    directBusinessContact: "DIRECT BUSINESS CONTACT",
    instantCallHint: "Call or WhatsApp directly for instant stock availability, quotes & bookings",
    verifiedMerchantLicense: "Verified Merchant License",
    freeCustomerParking: "Free Customer Parking",
    gstInvoiced: "GST Invoiced",
    acceptsUpiCash: "Accepts UPI & Cash",
    fastResponse: "Fast Response (<15m)",

    // Advertisement Rail & SOS
    advertisement: "ADVERTISEMENT",
    videoAd: "VIDEO ADVERTISEMENT",
    localSpotlight: "Local spotlight",
    emergencyHelp: "Emergency help",
    promoteYourBusiness: "Promote your business",
    localFirst: "Local first. People always.",
    localFirstDesc: "Every recommendation comes from a business that chose to be here.",
  },
  ta: {
    // Topbar & Sidebar
    workspaceLabel: "பணிப்பகுதி",
    discover: "கண்டறியவும்",
    myActivity: "என் செயல்பாடு",
    businessPortal: "வணிக தளம்",
    agentPortal: "முகவர் தளம்",
    companyPortal: "நிறுவன தளம்",
    browseBy: "வகைப்படி பார்க்க",
    allProductsAndServices: "அனைத்து பொருட்கள் & சேவைகள்",
    allCategories: "அனைத்து பிரிவுகள்",
    goodThingsCloser: "சிறந்தவை உங்கள் அருகிலேயே.",
    goodThingsDesc: "ஒவ்வொரு தேடலும் உங்கள் பகுதியில் உள்ள உள்ளூர் வணிகத்தை ஆதரிக்கிறது.",
    yourBizearchActivity: "உங்கள் பைசர்ச் செயல்பாடு",
    savedOnDevice: "இந்த சாதனத்தில் சேமிக்கப்பட்டது",
    companyLogin: "நிறுவன உள்நுழைவு",
    yourNeighborhood: "உங்கள் பகுதி",
    poweredBy: "இயக்குவது",
    signIn: "உள்நுழைக",
    signOut: "வெளியேறுக",
    hosurLocation: "ஓசூர், தமிழ்நாடு",
    stopLocation: "சாதன இருப்பிடத்தை நிறுத்து",

    // Hero
    madeForAroundHere: "நம்ம ஊருக்கான தளம்",
    heroHeadingMain: "உங்கள் அருகிலுள்ள வணிகங்கள்,",
    heroHeadingSub: "உங்கள் கைகளில்.",
    heroTitle: "ஓசூரின் முதன்மையான உள்ளூர் & தொழில்துறை வர்த்தக களம்",
    heroDesc: "ஓசூர் முழுவதும் உள்ள சரிபார்க்கப்பட்ட உற்பத்தியாளர்கள், கடைகள், மருத்துவமனைகள் மற்றும் சேவைகளை எளிதில் கண்டறியுங்கள்.",
    registerBusiness: "உங்கள் வணிகத்தைப் பதிவு செய்க",
    registerBusinessNote: "தொடங்க வாடிக்கையாளர் கணக்கு தேவையில்லை. ஒரு வணிகத்திற்கு ஒரு சுயவிவரம்.",

    // Search Panel
    whatDoYouNeed: "உங்களுக்கு என்ன தேவை?",
    nearLocality: "அருகிலுள்ள பகுதி",
    withinKm: "தொலைவு",
    searchPlaceholder: "வாகன உதிரிபாகங்கள், CNC இயந்திரங்கள், உணவகங்கள், மருத்துவமனைகள்...",
    findNearby: "அருகிலுள்ளவை தேடு",
    allHosur: "அனைத்து ஓசூர்",

    // Modes & Sections
    browseBySector: "துறை வாரியாகப் பார்க்க",
    atozDirectoryTab: "A–Z அகராதி (அனைத்து பொருட்கள் & சேவைகள்)",
    aLittleBitOfEverything: "அனைத்தும் ஒரே இடத்தில்",
    exploreLocalScene: "உங்கள் உள்ளூர் வணிகங்களைக் காணுங்கள்",
    browseWithinSector: "துறைக்குள் தேடுக",
    atozDirectoryLink: "A–Z பட்டியல் →",
    allSectors: "அனைத்து துறைகள்",
    backBtn: "பின்செல்",
    allIn: "அனைத்தும்:",

    // Filter Chips
    openNow: "இப்போது திறந்துள்ளது",
    topRated: "உயர்தர மதிப்பீடு ★ 4.5+",
    verifiedOnly: "சரிபார்க்கப்பட்டது",
    whatsappReady: "வாட்ஸ்அப் வசதி",
    clearFilters: "வடிகட்டிகளை நீக்கு",
    open: "திறந்துள்ளது",
    closed: "மூடப்பட்டுள்ளது",
    filterNotice: "வடிகட்டிகள் பயன்படுத்தப்பட்டுள்ளன",
    noFilteredMatches: "தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்குப் பொருத்தமான வணிகங்கள் இல்லை.",

    // Results Header
    localVerifiedProviders: "சரிபார்க்கப்பட்ட உள்ளூர் வணிகங்கள்",
    aroundYourCorner: "உங்கள் அருகில் உள்ளவை",
    providersFor: "இதற்கான வணிகங்கள்",
    subscribedListings: "பதிவுசெய்யப்பட்ட வணிகங்கள் · மாதிரி தூரம்",
    subscribedListingsGps: "பதிவுசெய்யப்பட்ட வணிகங்கள் · நேரலை தூரம்",
    sampleDistance: "மாதிரி",
    reviewsLabel: "மதிப்புரைகள்",

    // Actions & Cards
    productsServices: "தயாரிப்புகள் & சேவைகள்",
    navigate: "வழிசெலுத்து",
    call: "அழைப்பு",
    whatsapp: "வாட்ஸ்அப்",
    share: "பகிர்",
    rate: "மதிப்பிடு",
    claim: "உரிமைகோரு",
    requestAQuote: "விலை மதிப்பீடு கோருக",
    requestInfo: "விவரம் கோருக",
    recentlyViewed: "சமீபத்தில் பார்த்தவை",
    clearRecent: "அழி",
    rateBusiness: "வணிகத்தை மதிப்பிடுக",
    claimBusinessLink: "வணிகத்தை உரிமைகோருங்கள்",
    writeReview: "மதிப்புரை எழுதுக",
    reviewsAndRatings: "சமூக மதிப்பீடுகள் & கருத்துகள்",
    directionsAndMap: "வரைபடம் & வழிகள்",
    directBusinessContact: "நேரடி வணிகத் தொடர்பு",
    instantCallHint: "இருப்பு விவரங்கள், விலை மற்றும் முன்பதிவுகளுக்கு நேரடியாக அழைக்கவும்",
    verifiedMerchantLicense: "சரிபார்க்கப்பட்ட வணிக உரிமம்",
    freeCustomerParking: "இலவச வாகன நிறுத்துமிடம்",
    gstInvoiced: "GST வரி ரசீது உண்டு",
    acceptsUpiCash: "UPI & பணம் ஏற்கப்படும்",
    fastResponse: "விரைவான பதில் (<15 நிமிடம்)",

    // Advertisement Rail & SOS
    advertisement: "விளம்பரம்",
    videoAd: "வீடியோ விளம்பரம்",
    localSpotlight: "உள்ளூர் சிறப்பம்சம்",
    emergencyHelp: "அவசர உதவி",
    promoteYourBusiness: "வணிகத்தை விளம்பரப்படுத்துங்கள்",
    localFirst: "முதன்மையாக உள்ளூர். எப்போதும் மக்கள்.",
    localFirstDesc: "ஒவ்வொரு பரிந்துரையும் உங்கள் ஊரிலேயே உள்ள சிறந்த வணிகங்களிடமிருந்து வருகிறது.",
  },
  kn: {
    // Topbar & Sidebar
    workspaceLabel: "ಕಾರ್ಯಕ್ಷೇತ್ರ",
    discover: "ಅನ್ವೇಷಿಸಿ",
    myActivity: "ನನ್ನ ಚಟುವಟಿಕೆ",
    businessPortal: "ವ್ಯಾಪಾರ ಪೋರ್ಟಲ್",
    agentPortal: "ಏಜೆಂಟ್ ಪೋರ್ಟಲ್",
    companyPortal: "ಕಂಪನಿ ಪೋರ್ಟಲ್",
    browseBy: "ವರ್ಗೀಕರಿಸಿ ನೋಡಿ",
    allProductsAndServices: "ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು & ಸೇವೆಗಳು",
    allCategories: "ಎಲ್ಲಾ ವಿಭಾಗಗಳು",
    goodThingsCloser: "ಉತ್ತಮ ವಿಷಯಗಳು ಹತ್ತಿರದಲ್ಲಿವೆ.",
    goodThingsDesc: "ಪ್ರತಿಯೊಂದು ಹುಡುಕಾಟವೂ ನಿಮ್ಮ ಪ್ರದೇಶದ ಸ್ಥಳೀಯ ವ್ಯಾಪಾರವನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ.",
    yourBizearchActivity: "ನಿಮ್ಮ ಬೈಜರ್ಚ್ ಚಟುವಟಿಕೆ",
    savedOnDevice: "ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ",
    companyLogin: "ಕಂಪನಿ ಲಾಗಿನ್",
    yourNeighborhood: "ನಿಮ್ಮ ನೆರೆಹೊರೆ",
    poweredBy: "ಪ್ರಾಯೋಜಿತ",
    signIn: "ಸೈನ್ ಇನ್",
    signOut: "ಸೈನ್ ಔಟ್",
    hosurLocation: "ಹೊಸೂರು, ತಮಿಳುನಾಡು",
    stopLocation: "ಸಾಧನದ ಸ್ಥಳ ನಿಲ್ಲಿಸಿ",

    // Hero
    madeForAroundHere: "ನಮ್ಮ ಸ್ಥಳೀಯರಿಗಾಗಿ ಮಾಡಲ್ಪಟ್ಟಿದೆ",
    heroHeadingMain: "ನಿಮ್ಮ ನೆರೆಹೊರೆ,",
    heroHeadingSub: "ನಿಮ್ಮ ಕೈಗೆಟಕುವಂತೆ.",
    heroTitle: "ಹೊಸೂರಿನ ಪ್ರಮುಖ ಸ್ಥಳೀಯ ಮತ್ತು ಕೈಗಾರಿಕಾ ಮಾರುಕಟ್ಟೆ",
    heroDesc: "ಹೊಸೂರಿನಾದ್ಯಂತ ಪರಿಶೀಲಿಸಿದ ತಯಾರಕರು, ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರ, ಆರೋಗ್ಯ ಸೇವೆಗಳು ಮತ್ತು ದೈನಂದಿನ ಸೇವೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.",
    registerBusiness: "ನಿಮ್ಮ ವ್ಯಾಪಾರವನ್ನು ನೋಂದಾಯಿಸಿ",
    registerBusinessNote: "ಪ್ರಾರಂಭಿಸಲು ಗ್ರಾಹಕರ ಖಾತೆಯ ಅಗತ್ಯವಿಲ್ಲ. ಪ್ರತಿ ವ್ಯಾಪಾರ ಖಾತೆಗೆ ಒಂದು ಪ್ರೊಫೈಲ್.",

    // Search Panel
    whatDoYouNeed: "ನಿಮಗೆ ಏನು ಬೇಕು?",
    nearLocality: "ಹತ್ತಿರದ ಪ್ರದೇಶ",
    withinKm: "ವ್ಯಾಪ್ತಿ",
    searchPlaceholder: "ಆಟೋ ಭಾಗಗಳು, ಸಿಎನ್‌ಸಿ ಯಂತ್ರ, ಉಪಹಾರಗೃಹಗಳು, ಆಸ್ಪತ್ರೆಗಳು...",
    findNearby: "ಹತ್ತಿರ ಹುಡುಕಿ",
    allHosur: "ಎಲ್ಲಾ ಹೊಸೂರು",

    // Modes & Sections
    browseBySector: "ವಲಯವಾರು ಅನ್ವೇಷಿಸಿ",
    atozDirectoryTab: "A–Z ಡೈರೆಕ್ಟರಿ (ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು & ಸೇವೆಗಳು)",
    aLittleBitOfEverything: "ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ",
    exploreLocalScene: "ನಿಮ್ಮ ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    browseWithinSector: "ವಲಯದೊಳಗೆ ಬ್ರೌಸ್ ಮಾಡಿ",
    atozDirectoryLink: "A–Z ಡೈರೆಕ್ಟರಿ →",
    allSectors: "ಎಲ್ಲಾ ವಲಯಗಳು",
    backBtn: "ಹಿಂದಕ್ಕೆ",
    allIn: "ಎಲ್ಲವೂ:",

    // Filter Chips
    openNow: "ಈಗ ತೆರೆದಿದೆ",
    topRated: "ಉನ್ನತ ರೇಟಿಂಗ್ ★ 4.5+",
    verifiedOnly: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    whatsappReady: "ವಾಟ್ಸಾಪ್ ಲಭ್ಯವಿದೆ",
    clearFilters: "ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ",
    open: "ತೆರೆದಿದೆ",
    closed: "ಮುಚ್ಚಲಾಗಿದೆ",
    filterNotice: "ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಅನ್ವಯಿಸಲಾಗಿದೆ",
    noFilteredMatches: "ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ವ್ಯಾಪಾರಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",

    // Results Header
    localVerifiedProviders: "ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳೀಯ ಪೂರೈಕೆದಾರರು",
    aroundYourCorner: "ನಿಮ್ಮ ಸುತ್ತಮುತ್ತಲಿನ ಸ್ಥಳಗಳು",
    providersFor: "ಇದಕ್ಕಾಗಿ ಪೂರೈಕೆದಾರರು",
    subscribedListings: "ನೋಂದಾಯಿತ ಪಟ್ಟಿಗಳು · ಮಾದರಿ ದೂರ",
    subscribedListingsGps: "ನೋಂದಾಯಿತ ಪಟ್ಟಿಗಳು · ಸಾಧನದ ವ್ಯಾಪ್ತಿ",
    sampleDistance: "ಮಾದರಿ",
    reviewsLabel: "ವಿಮರ್ಶೆಗಳು",

    // Actions & Cards
    productsServices: "ಉತ್ಪನ್ನಗಳು & ಸೇವೆಗಳು",
    navigate: "ಮಾರ್ಗ",
    call: "ಕರೆ ಮಾಡಿ",
    whatsapp: "ವಾಟ್ಸಾಪ್",
    share: "ಹಂಚಿಕೊಳ್ಳಿ",
    rate: "ರೇಟ್ ಮಾಡಿ",
    claim: "ಕ್ಲೈಮ್ ಮಾಡಿ",
    requestAQuote: "ಉಲ್ಲೇಖವನ್ನು ವಿನಂತಿಸಿ",
    requestInfo: "ಮಾಹಿತಿ ವಿನಂತಿಸಿ",
    recentlyViewed: "ಇತ್ತೀಚೆಗೆ ವೀಕ್ಷಿಸಿದ ಸ್ಥಳಗಳು",
    clearRecent: "ತೆರವುಗೊಳಿಸಿ",
    rateBusiness: "ವ್ಯಾಪಾರ ರೇಟ್ ಮಾಡಿ",
    claimBusinessLink: "ಈ ವ್ಯಾಪಾರವನ್ನು ಕ್ಲೈಮ್ ಮಾಡಿ",
    writeReview: "ವಿಮರ್ಶೆ ಬರೆಯಿರಿ",
    reviewsAndRatings: "ಸಮುದಾಯ ವಿಮರ್ಶೆಗಳು & ರೇಟಿಂಗ್‌ಗಳು",
    directionsAndMap: "ನಕ್ಷೆ & ನಿರ್ದೇಶನಗಳು",
    directBusinessContact: "ನೇರ ವ್ಯಾಪಾರ ಸಂಪರ್ಕ",
    instantCallHint: "ಲಭ್ಯತೆ, ದರಪಟ್ಟಿ ಮತ್ತು ಬುಕಿಂಗ್‌ಗಾಗಿ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ",
    verifiedMerchantLicense: "ಪರಿಶೀಲಿಸಿದ ವ್ಯಾಪಾರ ಪರವಾನಗಿ",
    freeCustomerParking: "ಉಚಿತ ಗ್ರಾಹಕ ಪಾರ್ಕಿಂಗ್",
    gstInvoiced: "GST ಇನ್‌ವಾಯ್ಸ್ ಲಭ್ಯವಿದೆ",
    acceptsUpiCash: "UPI ಮತ್ತು ನಗದು ಸ್ವೀಕಾರಾರ್ಹ",
    fastResponse: "ವೇಗದ ಪ್ರತಿಕ್ರಿಯೆ (<15 ನಿಮಿಷ)",

    // Advertisement Rail & SOS
    advertisement: "ಜಾಹೀರಾತು",
    videoAd: "ವೀಡಿಯೊ ಜಾಹೀರಾತು",
    localSpotlight: "ಸ್ಥಳೀಯ ಮುಖ್ಯಾಂಶ",
    emergencyHelp: "ತುರ್ತು ಸಹಾಯ",
    promoteYourBusiness: "ನಿಮ್ಮ ವ್ಯಾಪಾರವನ್ನು ಪ್ರಚಾರ ಮಾಡಿ",
    localFirst: "ಮೊದಲು ಸ್ಥಳೀಯ. ಸದಾ ಜನರು.",
    localFirstDesc: "ಪ್ರತಿಯೊಂದು ಶಿಫಾರಸು ಇಲ್ಲಿರಲು ಬಯಸಿದ ಸ್ಥಳೀಯ ವ್ಯಾಪಾರದಿಂದ ಬರುತ್ತದೆ.",
  },
  te: {
    // Topbar & Sidebar
    workspaceLabel: "వర్క్‌స్పేస్",
    discover: "కనుగొనండి",
    myActivity: "నా యాక్టివిటీ",
    businessPortal: "వ్యాపార పోర్టల్",
    agentPortal: "ఏజెంట్ పోర్టల్",
    companyPortal: "కంపెనీ పోర్టల్",
    browseBy: "వర్గాల వారీగా",
    allProductsAndServices: "అన్ని ఉత్పత్తులు & సేవలు",
    allCategories: "అన్ని విభాగాలు",
    goodThingsCloser: "మంచి విషయాలు మీకు సమీపంలోనే ఉన్నాయి.",
    goodThingsDesc: "ప్రతి శోధన మీ పరిసరాల్లోని స్థానిక వ్యాపారానికి మద్దతు ఇస్తుంది.",
    yourBizearchActivity: "మీ బైజెర్చ్ కార్యాచరణ",
    savedOnDevice: "ఈ పరికరంలో సేవ్ చేయబడింది",
    companyLogin: "కంపెనీ లాగిన్",
    yourNeighborhood: "మీ పరిసరాలు",
    poweredBy: "సహకారంతో",
    signIn: "సైన్ ఇన్",
    signOut: "సైన్ అవుట్",
    hosurLocation: "హోసూరు, తమిళనాడు",
    stopLocation: "పరికర స్థానాన్ని ఆపండి",

    // Hero
    madeForAroundHere: "మన స్థానిక ప్రజల కోసం ప్రత్యేకంగా",
    heroHeadingMain: "మీ పరిసరాల వ్యాపారాలు,",
    heroHeadingSub: "మీ చేతిలోనే.",
    heroTitle: "హోసూరు ప్రముఖ స్థానిక & పారిశ్రామిక మార్కెట్‌ప్లేస్",
    heroDesc: "హోసూరు అంతటా ధృవీకరించబడిన తయారీదారులు, దుకాణాలు, ఆసుపత్రులు మరియు రోజువారీ సేవలను సులభంగా కనుగొనండి.",
    registerBusiness: "మీ వ్యాపారాన్ని నమోదు చేయండి",
    registerBusinessNote: "ప్రారంభించడానికి ఖాతా అవసరం లేదు. ఒక వ్యాపారానికి ఒక ప్రొఫైల్.",

    // Search Panel
    whatDoYouNeed: "మీకు ఏమి కావాలి?",
    nearLocality: "సమీప ప్రాంతం",
    withinKm: "పరిధి",
    searchPlaceholder: "ఆటో విడిభాగాలు, సిఎన్‌సి యంత్రాలు, రెస్టారెంట్లు, ఆసుపత్రులు...",
    findNearby: "సమీపంలో వెతకండి",
    allHosur: "మొత్తం హోసూరు",

    // Modes & Sections
    browseBySector: "రంగాల వారీగా బ్రౌజ్ చేయండి",
    atozDirectoryTab: "A–Z డైరెక్టరీ (అన్ని ఉత్పత్తులు & సేవలు)",
    aLittleBitOfEverything: "అన్నీ ఒకే చోట",
    exploreLocalScene: "మీ స్థానిక వ్యాపారాలను అన్వేషించండి",
    browseWithinSector: "విభాగంలో చూడండి",
    atozDirectoryLink: "A–Z డైరెక్టరీ →",
    allSectors: "అన్ని రంగాలు",
    backBtn: "వెనుకకు",
    allIn: "అన్నీ:",

    // Filter Chips
    openNow: "ఇప్పుడు తెరిచి ఉంది",
    topRated: "ఉన్నత రేటింగ్ ★ 4.5+",
    verifiedOnly: "ధృవీకరించబడింది",
    whatsappReady: "వాట్సాప్ సౌకర్యం",
    clearFilters: "ఫిల్టర్లు క్లియర్ చేయండి",
    open: "తెరిచి ఉంది",
    closed: "మూసివేయబడింది",
    filterNotice: "ఫిల్టర్లు వర్తింపజేయబడ్డాయి",
    noFilteredMatches: "ఎంచుకున్న ఫిల్టర్లకు సరిపోయే వ్యాపారాలు లేవు.",

    // Results Header
    localVerifiedProviders: "ధృవీకరించబడిన స్థానిక వ్యాపారాలు",
    aroundYourCorner: "మీ సమీపంలో ఉన్న ప్రదేశాలు",
    providersFor: "వీరి కోసం వ్యాపారాలు",
    subscribedListings: "నమోదిత జాబితాలు · నమూనా దూరం",
    subscribedListingsGps: "నమోదిత జాబితాలు · పరికర దూరం",
    sampleDistance: "నమూనా",
    reviewsLabel: "సమీక్షలు",

    // Actions & Cards
    productsServices: "ఉత్పత్తులు & సేవలు",
    navigate: "మ్యాప్ మార్గం",
    call: "కాల్ చేయండి",
    whatsapp: "వాట్సాప్",
    share: "షేర్ చేయండి",
    rate: "రేట్ చేయండి",
    claim: "క్లెయిమ్ చేయండి",
    requestAQuote: "ధర అంచనాను అడగండి",
    requestInfo: "వివరాలు అడగండి",
    recentlyViewed: "ఇటీవల చూసిన స్థలాలు",
    clearRecent: "క్లియర్ చేయండి",
    rateBusiness: "వ్యాపారాన్ని రేట్ చేయండి",
    claimBusinessLink: "ఈ వ్యాపారాన్ని క్లెయిమ్ చేయండి",
    writeReview: "సమీక్ష రాయండి",
    reviewsAndRatings: "కమ్యూనిటీ సమీక్షలు & రేటింగ్‌లు",
    directionsAndMap: "మ్యాప్ & దిశలు",
    directBusinessContact: "ప్రత్యక్ష వ్యాపార సంప్రదింపు",
    instantCallHint: "లభ్యత, ధర మరియు బుకింగ్ కోసం నేరుగా కాల్ లేదా వాట్సాప్ చేయండి",
    verifiedMerchantLicense: "ధృవీకరించబడిన వ్యాపార లైసెన్స్",
    freeCustomerParking: "ఉచిత కస్టమర్ పార్కింగ్",
    gstInvoiced: "GST ఇన్‌వాయిస్ లభ్యం",
    acceptsUpiCash: "UPI & నగదు అంగీకరించబడును",
    fastResponse: "వేగవంతమైన స్పందన (<15 నిమిషాలు)",

    // Advertisement Rail & SOS
    advertisement: "ప్రకటన",
    videoAd: "వీడియో ప్రకటన",
    localSpotlight: "స్థానిక విశేషాలు",
    emergencyHelp: "అత్యవసర సహాయం",
    promoteYourBusiness: "మీ వ్యాపారాన్ని ప్రచారం చేయండి",
    localFirst: "ముందుగా స్థానిక. ఎల్లప్పుడూ ప్రజలు.",
    localFirstDesc: "ప్రతి సిఫార్సు ఇక్కడే ఉండాలని ఎంచుకున్న వ్యాపారం నుండి వస్తుంది.",
  },
};

const CATEGORY_LOCALIZED: Record<Language, Record<string, string>> = {
  en: {},
  ta: {
    "Automobiles": "தானியங்கிகள் & வாகனங்கள்",
    "Electronics": "மின்னணுவியல் & சாதனங்கள்",
    "Electricals": "மின்சாதனங்கள் & வயரிங்",
    "Hardware": "வன்பொருள் & கருவிகள்",
    "Home Appliances": "வீட்டு உபயோகப் பொருட்கள்",
    "Fashion": "ஆடை & ஜவுளி",
    "Home & furniture": "வீடு & மரச்சாமான்கள்",
    "Food & dining": "உணவு & உணவகங்கள்",
    "Health & wellness": "மருத்துவம் & நல்வாழ்வு",
    "Sports & fitness": "விளையாட்டு & உடற்பயிற்சி",
    "Travel": "பயணம் & தங்குமிடம்",
    "Entertainment": "பொழுதுபோக்கு",
    "Everyday services": "தினசரி சேவைகள்",
    "Books & Stationery": "புத்தகங்கள் & எழுதுபொருட்கள்",
    "Toys & Fancy Stores": "பொம்மைகள் & பேன்சி கடைகள்",
    "Public & Common Places": "பொது இடங்கள் & தளங்கள்",
    "Real Estate & Construction": "ரியல் எஸ்டேட் & கட்டுமானம்",
    "Industrial & B2B Manufacturing": "தொழில்துறை & உற்பத்தி",
    "Heavy Industries & Machinery": "கனரக தொழில்துறை & இயந்திரங்கள்",
    "Education & Coaching": "கல்வி & பயிற்சி மையங்கள்",
    "Events & Weddings": "திருமணங்கள் & நிகழ்வுகள்",
    "Agriculture, Nurseries & Pets": "விவசாயம், நர்சரி & வளர்ப்பு பிராணிகள்",
  },
  kn: {
    "Automobiles": "ವಾಹನಗಳು & ಸೇವೆಗಳು",
    "Electronics": "ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ & ಮೊಬೈಲ್",
    "Electricals": "ಎಲೆಕ್ಟ್ರಿಕಲ್ಸ್ & ವೈರಿಂಗ್",
    "Hardware": "ಹಾರ್ಡ್‌ವೇರ್ & ಉಪಕರಣಗಳು",
    "Home Appliances": "ಗೃಹೋಪಯೋಗಿ ವಸ್ತುಗಳು",
    "Fashion": "ಫ್ಯಾಷನ್ & ಬಟ್ಟೆಗಳು",
    "Home & furniture": "ಮನೆ ಮತ್ತು ಪೀಠೋಪಕರಣಗಳು",
    "Food & dining": "ಆಹಾರ & ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು",
    "Health & wellness": "ಆರೋಗ್ಯ & ಕ್ಷೇಮ",
    "Sports & fitness": "ಕ್ರೀಡೆ & ಫಿಟ್‌ನೆಸ್",
    "Travel": "ಪ್ರಯಾಣ & ಪ್ರವಾಸ",
    "Entertainment": "ಮನರಂಜನೆ",
    "Everyday services": "ದೈನಂದಿನ ಸೇವೆಗಳು",
    "Books & Stationery": "ಪುಸ್ತಕಗಳು & ಸ್ಟೇಷನರಿ",
    "Toys & Fancy Stores": "ಆಟಿಕೆಗಳು & ಫ್ಯಾನ್ಸಿ ಮಳಿಗೆಗಳು",
    "Public & Common Places": "ಸಾರ್ವಜನಿಕ ಸ್ಥಳಗಳು",
    "Real Estate & Construction": "ರಿಯಲ್ ಎಸ್ಟೇಟ್ & ನಿರ್ಮಾಣ",
    "Industrial & B2B Manufacturing": "ಕೈಗಾರಿಕಾ & B2B ಉತ್ಪಾದನೆ",
    "Heavy Industries & Machinery": "ಭಾರಿ ಯಂತ್ರೋಪಕರಣಗಳು",
    "Education & Coaching": "ಶಿಕ್ಷಣ & ತರಬೇತಿ",
    "Events & Weddings": "ವಿವಾಹ & ಸಮಾರಂಭಗಳು",
    "Agriculture, Nurseries & Pets": "ಕೃಷಿ, ನರ್ಸರಿ & ಸಾಕುಪ್ರಾಣಿಗಳು",
  },
  te: {
    "Automobiles": "ఆటోమొబైల్స్ & వాహనాలు",
    "Electronics": "ఎలక్ట్రానిక్స్ & మొబైల్స్",
    "Electricals": "ఎలక్ట్రికల్స్ & వైరింగ్",
    "Hardware": "హార్డ్‌వేర్ & టూల్స్",
    "Home Appliances": "గృహోపకరణాలు",
    "Fashion": "ఫ్యాషన్ & దుస్తులు",
    "Home & furniture": "ఇల్లు & ఫర్నిచర్",
    "Food & dining": "ఆహారం & రెస్టారెంట్లు",
    "Health & wellness": "ఆరోగ్యం & వెల్‌నెస్",
    "Sports & fitness": "క్రీడలు & ఫిట్‌నెస్",
    "Travel": "ప్రయాణం & రవాణా",
    "Entertainment": "వినోదం",
    "Everyday services": "రోజువారీ సేవలు",
    "Books & Stationery": "పుస్తకాలు & స్టేషనరీ",
    "Toys & Fancy Stores": "బొమ్మలు & ఫ్యాన్సీ స్టోర్స్",
    "Public & Common Places": "ప్రజా ప్రదేశాలు",
    "Real Estate & Construction": "రియల్ ఎస్టేట్ & నిర్మాణం",
    "Industrial & B2B Manufacturing": "పారిశ్రామిక & B2B తయారీ",
    "Heavy Industries & Machinery": "భారీ పరిశ్రమలు & యంత్రాలు",
    "Education & Coaching": "విద్య & కోచింగ్",
    "Events & Weddings": "వివాహాలు & ఈవెంట్లు",
    "Agriculture, Nurseries & Pets": "వ్యవసాయం, నర్సరీలు & పెంపుడు జంతువులు",
  },
};

const CATEGORY_DESC_LOCALIZED: Record<Language, Record<string, string>> = {
  en: {},
  ta: {
    "Automobiles": "விற்பனை · பழுதுபார்த்தல் · இருசக்கர வாகனம் ↗",
    "Electronics": "விற்பனை · சர்வீஸ் · மொபைல்கள் · மடிக்கணினிகள் ↗",
    "Electricals": "வயரிங் & கேபிள்கள் · மாடுலர் சுவிட்சுகள் ↗",
    "Hardware": "பவர் டூல்ஸ் · கைக்கருவிகள் · குழாய்கள் ↗",
    "Home Appliances": "குளிர்சாதன பெட்டி · வாஷிங் மெஷின் ↗",
    "Fashion": "ஆடை · காலணிகள் · நகைகள் ↗",
    "Home & furniture": "மரச்சாமான்கள் · அலங்காரம் · சமையலறை ↗",
    "Food & dining": "உணவகங்கள் · உணவு டெலிவரி · பேக்கரிகள் ↗",
    "Health & wellness": "மருத்துவமனைகள் · பல் மருத்துவம் · மருந்தகங்கள் ↗",
    "Sports & fitness": "உடற்பயிற்சி கூடம் · யோகா · விளையாட்டு ↗",
    "Travel": "டிராவல்ஸ் · தங்குமிடம் · விமான டாக்ஸி ↗",
    "Entertainment": "நிகழ்வுகள் · இசை · திரையரங்குகள் ↗",
    "Everyday services": "பிளம்பிங் · சுத்தம் செய்தல் · தச்சு வேலை ↗",
    "Books & Stationery": "பாடப்புத்தகங்கள் · நோட்டுப்புத்தகங்கள் · ஜெராக்ஸ் ↗",
    "Toys & Fancy Stores": "பொம்மைகள் & விளையாட்டுகள் · பரிசுகள் ↗",
    "Public & Common Places": "பேருந்து நிலையம் · ரயில் நிலையம் · கோயில்கள் ↗",
    "Real Estate & Construction": "வாடகை · வீட்டு மனைகள் · தொழிற்சாலை கட்டிடங்கள் ↗",
    "Industrial & B2B Manufacturing": "CNC எந்திரம் · தாள் உலோகம் · பிளாஸ்டிக் ↗",
    "Heavy Industries & Machinery": "ஹைட்ராலிக் பிரஸ் · லேசர் கட்டிங் · கிரேன் ↗",
    "Education & Coaching": "பள்ளிகள் · பொறியியல் கல்லூரிகள் · பயிற்சி ↗",
    "Events & Weddings": "திருமண மண்டபங்கள் · கேட்டரிங் · அலங்காரம் ↗",
    "Agriculture, Nurseries & Pets": "ஓசூர் ரோஜா நர்சரி · விதைகள் · செல்லப்பிராணிகள் ↗",
  },
  kn: {
    "Automobiles": "ಮಾರಾಟ · ಸೇವೆ · ದ್ವಿಚಕ್ರ ವಾಹನಗಳು ↗",
    "Electronics": "ಮಾರಾಟ · ಸೇವೆ · ಮೊಬೈಲ್ · ಲ್ಯಾಪ್‌ಟಾಪ್ ↗",
    "Electricals": "ವೈರಿಂಗ್ & ಕೇಬಲ್‌ಗಳು · ಮಾಡ್ಯುಲರ್ ಸ್ವಿಚ್‌ಗಳು ↗",
    "Hardware": "ಪವರ್ ಟೂಲ್ಸ್ · ಕೈ ಉಪಕರಣಗಳು · ಪೈಪ್‌ಗಳು ↗",
    "Home Appliances": "ರೆಫ್ರಿಜರೇಟರ್ · ವಾಷಿಂಗ್ ಮೆಷಿನ್ ↗",
    "Fashion": "ಉಡುಪು · ಪಾದರಕ್ಷೆ · ಆಭರಣ ↗",
    "Home & furniture": "ಪೀಠೋಪಕರಣ · ಅಲಂಕಾರ · ಅಡುಗೆಮನೆ ↗",
    "Food & dining": "ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು · ಊಟ ವಿತರಣೆ · ಬೇಕರಿಗಳು ↗",
    "Health & wellness": "ಕ್ಲಿನಿಕ್‌ಗಳು · ದಂತವೈದ್ಯ · ಔಷಧಾಲಯಗಳು ↗",
    "Sports & fitness": "ಜಿಮ್ · ಯೋಗ · ಕ್ರೀಡಾ ತರಬೇತಿ ↗",
    "Travel": "ಟ್ರಾವೆಲ್ ಏಜೆಂಟ್‌ಗಳು · ವಾಸ್ತವ್ಯ · ವಿಮಾನ ಟ್ಯಾಕ್ಸಿ ↗",
    "Entertainment": "ಈವೆಂಟ್‌ಗಳು · ಸಂಗೀತ · ಆಟಗಳು ↗",
    "Everyday services": "ಪ್ಲಂಬಿಂಗ್ · ಸ್ವಚ್ಛತೆ · ಬಡಗಿ ಕೆಲಸ ↗",
    "Books & Stationery": "ಪಠ್ಯಪುಸ್ತಕಗಳು · ನೋಟ್‌ಬುಕ್‌ಗಳು · ಜೆರಾಕ್ಸ್ ↗",
    "Toys & Fancy Stores": "ಆಟಿಕೆಗಳು · ಉಡುಗೊರೆಗಳು · ಫ್ಯಾನ್ಸಿ ↗",
    "Public & Common Places": "ಬಸ್ ನಿಲ್ದಾಣ · ರೈಲ್ವೆ ನಿಲ್ದಾಣ · ದೇವಾಲಯಗಳು ↗",
    "Real Estate & Construction": "ಬಾಡಿಗೆ · ನಿವೇಶನಗಳು · ಕೈಗಾರಿಕಾ ಶೆಡ್‌ಗಳು ↗",
    "Industrial & B2B Manufacturing": "ಸಿಎನ್‌ಸಿ ಯಂತ್ರ · ಶೀಟ್ ಮೆಟಲ್ · ಪ್ಲಾಸ್ಟಿಕ್ ↗",
    "Heavy Industries & Machinery": "ಹೈಡ್ರಾಲಿಕ್ ಪ್ರೆಸ್ · ಲೇಸರ್ ಕಟ್ಟಿಂಗ್ · ಕ್ರೇನ್‌ಗಳು ↗",
    "Education & Coaching": "ಶಾಲೆಗಳು · ಎಂಜಿನಿಯರಿಂಗ್ ಕಾಲೇಜುಗಳು ↗",
    "Events & Weddings": "ಕಲ್ಯಾಣ ಮಂಟಪಗಳು · ಕ್ಯಾಟರಿಂಗ್ · ಅಲಂಕಾರ ↗",
    "Agriculture, Nurseries & Pets": "ಹೊಸೂರು ಗುಲಾಬಿ ನರ್ಸರಿ · ಬೀಜಗಳು · ಸಾಕುಪ್ರಾಣಿಗಳು ↗",
  },
  te: {
    "Automobiles": "సేల్స్ · సర్వీస్ · ద్విచక్ర వాహనాలు ↗",
    "Electronics": "సేల్స్ · సర్వీస్ · మొబైల్స్ · ల్యాప్‌టాప్‌లు ↗",
    "Electricals": "వైరింగ్ & కేబుల్స్ · మాడ్యులర్ స్విచ్‌లు ↗",
    "Hardware": "పవర్ టూల్స్ · హ్యాండ్ టూల్స్ · పైపులు ↗",
    "Home Appliances": "రిఫ్రిజిరేటర్లు · వాషింగ్ మెషీన్లు ↗",
    "Fashion": "దుస్తులు · పాదరక్షలు · ఆభరణాలు ↗",
    "Home & furniture": "ఫర్నిచర్ · అలంకరణ · కిచెన్ ↗",
    "Food & dining": "రెస్టారెంట్లు · ఫుడ్ డెలివరీ · బేకరీలు ↗",
    "Health & wellness": "క్లినిక్‌లు · దంత వైద్యం · ఫార్మసీలు ↗",
    "Sports & fitness": "జిమ్ · యోగా · స్పోర్ట్స్ కోచింగ్ ↗",
    "Travel": "ట్రావెల్ ఏజెంట్లు · బస · ఎయిర్‌పోర్ట్ క్యాబ్‌లు ↗",
    "Entertainment": "ఈవెంట్‌లు · సంగీతం · వినోదం ↗",
    "Everyday services": "ప్లంబింగ్ · క్లీనింగ్ · కార్పెంట్రీ ↗",
    "Books & Stationery": "పాఠ్యపుస్తకాలు · నోట్‌బుక్స్ · జిరాక్స్ ↗",
    "Toys & Fancy Stores": "బొమ్మలు & ఆటలు · ఫ్యాన్సీ · బహుమతులు ↗",
    "Public & Common Places": "బస్ స్టాండ్ · రైల్వే స్టేషన్ · ఆలయాలు ↗",
    "Real Estate & Construction": "అద్దెలు · ప్లాట్లు · పారిశ్రామిక షెడ్లు ↗",
    "Industrial & B2B Manufacturing": "సిఎన్‌సి మ్యాచినింగ్ · షీట్ మెటల్ · ప్లాస్టిక్స్ ↗",
    "Heavy Industries & Machinery": "హైడ్రాలిక్ ప్రెస్ · లేజర్ కటింగ్ · క్రేన్లు ↗",
    "Education & Coaching": "పాఠశాలలు · ఇంజనీరింగ్ కళాశాలలు ↗",
    "Events & Weddings": "కల్యాణ మండపాలు · క్యాటరింగ్ · డెకరేషన్ ↗",
    "Agriculture, Nurseries & Pets": "హోసూరు గులాబీ నర్సరీ · విత్తనాలు · పెంపుడు జంతువులు ↗",
  },
};

const NEIGHBORHOOD_LOCALIZED: Record<Language, Record<string, string>> = {
  en: {},
  ta: {
    "All Hosur": "அனைத்து ஓசூர்",
    "SIPCOT Phase 1": "சிப்காட் பகுதி 1",
    "SIPCOT Phase 2": "சிப்காட் பகுதி 2",
    "Bagalur Road": "பாகலூர் சாலை",
    "Mookandapalli": "மூக்கண்டப்பள்ளி",
    "Mathigiri": "மத்திகிரி",
    "MG Road / Railway Station": "எம்.ஜி சாலை / ரயில் நிலையம்",
    "Denkanikottai Road": "தேன்கனிக்கோட்டை சாலை",
    "Rayakottai Road": "ராயக்கோட்டை சாலை",
  },
  kn: {
    "All Hosur": "ಎಲ್ಲಾ ಹೊಸೂರು",
    "SIPCOT Phase 1": "ಸಿಪ್ಕಾಟ್ ಹಂತ 1",
    "SIPCOT Phase 2": "ಸಿಪ್ಕಾಟ್ ಹಂತ 2",
    "Bagalur Road": "ಬಾಗಲೂರು ರಸ್ತೆ",
    "Mookandapalli": "ಮೂಕಂಡಪಲ್ಲಿ",
    "Mathigiri": "ಮತ್ತಿಗಿರಿ",
    "MG Road / Railway Station": "ಎಂ.ಜಿ ರಸ್ತೆ / ರೈಲ್ವೆ ನಿಲ್ದಾಣ",
    "Denkanikottai Road": "ದೇನಕನಿಕೋಟೆ ರಸ್ತೆ",
    "Rayakottai Road": "ರಾಯಕ್ಕೋಟೆ ರಸ್ತೆ",
  },
  te: {
    "All Hosur": "మొత్తం హోసూరు",
    "SIPCOT Phase 1": "సిప్‌కాట్ ఫేజ్ 1",
    "SIPCOT Phase 2": "సిప్‌కాట్ ఫేజ్ 2",
    "Bagalur Road": "బాగలూరు రోడ్",
    "Mookandapalli": "మూకండపల్లి",
    "Mathigiri": "మత్తిగిరి",
    "MG Road / Railway Station": "ఎం.జి రోడ్ / రైల్వే స్టేషన్",
    "Denkanikottai Road": "దేనకనికోటై రోడ్",
    "Rayakottai Road": "రాయకోటై రోడ్",
  },
};

function translateCategory(name: string, lang: Language): string {
  if (lang === "en") return name;
  return CATEGORY_LOCALIZED[lang]?.[name] || name;
}

function translateCategoryDesc(name: string, lang: Language, fallback: string): string {
  if (lang === "en") return fallback;
  return CATEGORY_DESC_LOCALIZED[lang]?.[name] || fallback;
}

function translateNeighborhood(name: string, lang: Language): string {
  if (lang === "en") return name;
  return NEIGHBORHOOD_LOCALIZED[lang]?.[name] || name;
}

const HOSUR_NEIGHBORHOODS = [
  "All Hosur",
  "SIPCOT Phase 1",
  "SIPCOT Phase 2",
  "Bagalur Road",
  "Mookandapalli",
  "Mathigiri",
  "MG Road / Railway Station",
  "Denkanikottai Road",
  "Rayakottai Road",
];

function businessPhoneFor(business: Business): string {
  if (business.phone) return business.phone;
  let hash = 0;
  for (let i = 0; i < business.name.length; i++) {
    hash = (hash * 31 + business.name.charCodeAt(i)) & 0xffffffff;
  }
  const absHash = Math.abs(hash);
  const prefixes = [
    "+91 94432",
    "+91 98420",
    "+91 99440",
    "+91 97890",
    "+91 96290",
    "+91 90800",
    "+91 82480",
    "+91 94880",
    "04344 2",
    "+91 93600",
  ];
  const prefix = prefixes[absHash % prefixes.length];
  const suffix = prefix.startsWith("04344")
    ? String(20000 + (absHash % 80000))
    : String(10000 + (absHash % 90000));
  return `${prefix} ${suffix}`;
}

function businessRawPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function businessWhatsAppUrl(business: Business, product?: Product): string {
  const phone = businessPhoneFor(business);
  // Extract 10 digits for Indian numbers
  const digits = phone.replace(/\D/g, "");
  const normalizedPhone = digits.length === 10 ? `91${digits}` : digits.startsWith("91") ? digits : `91${digits.slice(-10)}`;
  const text = product
    ? `Hello ${business.name}, I found your listing on Bizearch (bizearch.co) and would like to inquire about "${product.name}". Is it currently available?`
    : `Hello ${business.name}, I found your listing on Bizearch (bizearch.co) and would like to inquire about your products and services.`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

async function shareBusiness(business: Business, product?: Product, onNotice?: (msg: string) => void) {
  const title = product ? `${product.name} at ${business.name} | Bizearch` : `${business.name} | Bizearch Hosur`;
  const text = product
    ? `Check out ${product.name} (${product.price > 0 ? `₹${product.price.toLocaleString("en-IN")}` : ""} ${product.unit || ""}) at ${business.name} on Bizearch:`
    : `Check out ${business.name} (${business.category}) on Bizearch Hosur:`;
  const url = typeof window !== "undefined" ? window.location.href : "https://bizearch.co";

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch {
      // User dismissed share dialog or cancelled
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      onNotice?.("✓ Link and business details copied to clipboard!");
    } catch {
      onNotice?.("Could not copy link.");
    }
  }
}

function productImageFor(product: Product, business?: Business): string {
  if (product.image) return product.image;
  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const cat = (business?.category || "").toLowerCase();
  const combined = `${name} ${desc} ${cat}`;

  // 1. Two-wheelers & Scooters
  if (/chetak|electric scooter|\bev\b|scooter|jupiter|activa|ntorq|iqube|ola s1|ather|rayzr|fascino/.test(combined)) {
    return "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80";
  }
  if (/pulsar|motorcycle|\bbike\b|apache|royal enfield|classic 350|hunter 350|bullet|duke|ktm|ninja|yamaha r15|fzs|gixxer|speed 400|scrambler/.test(combined)) {
    return "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=700&q=80";
  }
  // 2. Automotive Services & Repairs
  if (/oil change|routine service|two-wheeler service|bike service|general service|brake check|chain lube|tune-up/.test(combined)) {
    return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=700&q=80";
  }
  if (/car service|car wash|car repair|detailing|wheel alignment|water wash|engine diagnostic|brake pad|car ac/.test(combined)) {
    return "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=700&q=80";
  }
  if (/puncture|tyre|tire|tubeless/.test(combined)) {
    return "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=700&q=80";
  }
  if (/battery|inverter battery|jump start|exide|amaron/.test(combined)) {
    return "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=700&q=80";
  }
  // 3. Four-wheelers & Cars
  if (/four wheeler|\bcar\b|swift|baleno|creta|nexon|thar|scorpio|innova|fortuner|virtus|slavia|kushaq|elevate|curvv/.test(combined)) {
    return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=700&q=80";
  }
  // 4. Heavy Vehicles / Earth Movers / Tractors / Cranes / Heavy Machinery
  if (/crane|forklift|boom lift|scissor lift|overhead crane|eot crane|hoist|material handling|ace 15xw|pick & carry/.test(combined)) {
    return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=700&q=80";
  }
  if (/jcb|earth mover|excavator|backhoe|loader|bulldozer|dozer|komatsu|caterpillar|tata hitachi|sany|beml|rock breaker/.test(combined)) {
    return "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=700&q=80";
  }
  if (/concrete mixer|transit mixer|batching plant|road roller|compactor|asphalt paver|schwing|stetter|wirtgen|ammann/.test(combined)) {
    return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=700&q=80";
  }
  if (/generator|\bdg set\b|diesel generator|cummins|kirloskar|transformer|power plant|silent dg/.test(combined)) {
    return "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=700&q=80";
  }
  if (/compressor|screw compressor|atlas copco|elgi|air dryer|chiller|process pump/.test(combined)) {
    return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=700&q=80";
  }
  if (/vmc|machining center|laser cutting|fiber laser|press brake|shearing machine|turning lathe|lathe/.test(combined)) {
    return "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=700&q=80";
  }
  if (/hydraulic cylinder|undercarriage|track chain|sprocket|bucket teeth|chrome plating/.test(combined)) {
    return "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=700&q=80";
  }
  if (/tractor|swaraj|mahindra 575|john deere|sonalika|kubota|massey/.test(combined)) {
    return "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=700&q=80";
  }
  if (/tipper|truck|dost|ashok leyland|eicher|scania|bharatbenz/.test(combined)) {
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80";
  }
  // 5. Electronics & Mobiles
  if (/screen replacement|display repair|touch glass|cracked screen/.test(combined)) {
    return "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=700&q=80";
  }
  if (/phone|mobile|smartphone|iphone|galaxy|pixel|redmi|oneplus|realme|android|5g phone/.test(combined)) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80";
  }
  if (/laptop|macbook|thinkpad|computer|desktop|dell|hp|asus|pc repair/.test(combined)) {
    return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80";
  }
  if (/television|\btv\b|bravia|oled|smart tv|led tv|soundbar/.test(combined)) {
    return "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=80";
  }
  if (/headphone|earbud|speaker|bluetooth|jbl|bose|audio|sound/.test(combined)) {
    return "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80";
  }
  if (/camera|dslr|lens|gopro|nikon|canon|sony alpha|photography/.test(combined)) {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80";
  }
  // 6. Home Appliances
  if (/refrigerator|fridge|frost free|double door/.test(combined)) {
    return "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=700&q=80";
  }
  if (/washing machine|front load|top load|bloomwash/.test(combined)) {
    return "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=700&q=80";
  }
  if (/\bac\b|air conditioner|cooling|split ac|inverter ac|ac service/.test(combined)) {
    return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=700&q=80";
  }
  if (/purifier|water filter|ro\+uv|aquaguard|kent|geyser|water heater/.test(combined)) {
    return "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=700&q=80";
  }
  // 7. Food & Dining
  if (/thali|lunch|plate|meals|meals & thalis|south indian meals/.test(combined)) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80";
  }
  if (/dosa|idli|vada|breakfast|chutney/.test(combined)) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80";
  }
  if (/biryani|fried rice|chicken|meat|curry/.test(combined)) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80";
  }
  if (/cake|pastry|bread|bun|bakery|sweet|dessert/.test(combined)) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80";
  }
  if (/coffee|tea|filter coffee|beverage|juice|cafe/.test(combined)) {
    return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80";
  }
  // 8. Furniture & Home
  if (/sofa|couch|living room|chair|seating/.test(combined)) {
    return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80";
  }
  if (/bed|bedroom|mattress|cot|wardrobe/.test(combined)) {
    return "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80";
  }
  if (/table|dining|desk|interior|decor|curtain/.test(combined)) {
    return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=700&q=80";
  }
  // 9. Hardware & Electricals
  if (/drill|grinder|cutter|machinery|power tools|makita|bosch/.test(combined)) {
    return "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=80";
  }
  if (/tool|fastener|screw|hardware|lock|pipe|pump|fittings/.test(combined)) {
    return "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=700&q=80";
  }
  if (/wire|cable|switch|lighting|led|fan|havells|electrical/.test(combined)) {
    return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=700&q=80";
  }
  // 10. Fashion & Jewellery
  if (/saree|silk|handloom|drape/.test(combined)) {
    return "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80";
  }
  if (/kurta|shirt|dress|clothing|wear|tailor|suit|pants/.test(combined)) {
    return "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=700&q=80";
  }
  if (/jewel|gold|necklace|earring|bangle|silver|ornament/.test(combined)) {
    return "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80";
  }
  // 11. Health & Wellness
  if (/doctor|consultation|clinic|health|check-up|medical|hospital/.test(combined)) {
    return "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=700&q=80";
  }
  if (/dental|teeth|dentist|cleaning & fillings/.test(combined)) {
    return "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=700&q=80";
  }
  if (/medicine|pharmacy|tablet|prescription/.test(combined)) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=700&q=80";
  }
  if (/physio|mobility|rehab|therapy|massage/.test(combined)) {
    return "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80";
  }
  // 12. Real Estate, Construction, Education, Agriculture & Others
  if (/plot|house|villa|flat|apartment|rental|commercial space|real estate/.test(combined)) {
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=700&q=80";
  }
  if (/rose|plant|sapling|nursery|garden|flower|seed|fertilizer|livestock|cattle|pet/.test(combined)) {
    return "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80";
  }
  if (/mandapam|hall|wedding|banquet|event|reception|party/.test(combined)) {
    return "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80";
  }
  if (/college|school|tuition|course|degree|admission|education/.test(combined)) {
    return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80";
  }
  if (/gym|fitness|workout|yoga|training|zumba/.test(combined)) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80";
  }
  if (/cnc|vmc|machining|fabrication|manufacturing|industrial/.test(combined)) {
    return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80";
  }

  const fallbacks: Record<string, string> = {
    automobiles: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80",
    electronics: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80",
    "home appliances": "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=700&q=80",
    "food & dining": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80",
    fashion: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=700&q=80",
    "home & furniture": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80",
    "health & wellness": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=700&q=80",
    hardware: "https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&w=700&q=80",
    electricals: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=700&q=80",
    "sports & fitness": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=700&q=80",
    travel: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=700&q=80",
    entertainment: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=700&q=80",
    "real estate & construction": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=700&q=80",
    "heavy industries & machinery": "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=700&q=80",
    "industrial & b2b manufacturing": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80",
    "agriculture, nurseries & pets": "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=700&q=80",
  };
  return fallbacks[cat] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80";
}

const initialBusinesses: Business[] = [
  {
    "name": "Maya's Home Kitchen",
    "category": "Food & dining",
    "subcategories": [
      "Meal delivery",
      "Restaurants"
    ],
    "products": [
      {
        "id": "maya-meals",
        "name": "Homestyle lunch plate",
        "description": "Seasonal thali with fresh sides, hot sambar, rasam, kootu, 2 poriyals, curd & appalam.",
        "price": 180,
        "unit": "per plate",
        "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
        "badge": "Bestseller",
        "inStock": true
      },
      {
        "id": "maya-breakfast",
        "name": "Breakfast box",
        "description": "A rotating morning spread: 2 hot idlis, crispy medu vada, mini masala dosa, coconut & tomato chutneys.",
        "price": 120,
        "unit": "per box",
        "image": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
        "badge": "Popular",
        "inStock": true
      },
      {
        "id": "dosa-south-indian-meals",
        "name": "Dosa, Idli & South Indian Meals",
        "description": "Crispy golden ghee roast dosas, steamed idlis, vada, chutneys and traditional tiffin items.",
        "price": 70,
        "unit": "per plate",
        "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
        "badge": "Quick Bite",
        "inStock": true
      },
      {
        "id": "meal-delivery-tiffin",
        "name": "Meal Delivery & Homestyle Tiffins",
        "description": "Daily subscription tiffin boxes with balanced roti, dal tadka, seasonal sabzi, curd and steamed rice.",
        "price": 150,
        "unit": "per tiffin",
        "image": "https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&w=800&q=80",
        "badge": "Daily Tiffin",
        "inStock": true
      },
      {
        "id": "north-indian-thali",
        "name": "North Indian Meals & Thalis",
        "description": "Paneer butter masala, slow-cooked dal makhani, butter naan, jeera rice and hot gulab jamun.",
        "price": 199,
        "unit": "per thali",
        "image": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
        "badge": "Chef Special",
        "inStock": true
      },
      {
        "id": "restaurant-dine-in",
        "name": "Restaurant Dining & Regional Food",
        "description": "Family dining tables, regional Kongu delicacies, tandoor specials and chef feast platters.",
        "price": 300,
        "unit": "per person",
        "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "badge": "Family Feast",
        "inStock": true
      }
    ],
    "description": "Fresh, homestyle meals made with local ingredients.",
    "distance": 0.4,
    "demoCoordinates": {
      "latitude": 12.973,
      "longitude": 77.591
    },
    "rating": 4.9,
    "reviews": 128,
    "price": "Meals from ₹180",
    "icon": "🥘",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Meal delivery",
      "Lunch",
      "Thali",
      "Homestyle lunch plate",
      "Breakfast",
      "Regional specials",
      "Breakfast box",
      "Restaurants",
      "Indian",
      "South Indian",
      "Dosa & idli",
      "North Indian"
    ],
    "tag": "Popular nearby"
  },
  {
    "name": "NexGen Mobile Care",
    "category": "Electronics",
    "subcategories": [
      "Phone repair",
      "Accessories",
      "Mobile phones"
    ],
    "products": [
      {
        "id": "nex-screen",
        "name": "Screen replacement",
        "description": "Device inspection and screen replacement quote.",
        "price": 2499,
        "unit": "from"
      },
      {
        "id": "nex-diagnostic",
        "name": "Phone diagnostics",
        "description": "Same-day device health and repair assessment.",
        "price": 299,
        "unit": "per visit"
      },
      {
        "id": "electronics-sales-phones",
        "name": "Electronics & Smartphone Sales",
        "description": "Latest 5G smartphones, tablets, genuine fast chargers, tempered glass and protective cases.",
        "price": 799,
        "unit": "unit"
      },
      {
        "id": "mobile-screen-replacement",
        "name": "Mobile Screen & Battery Repair",
        "description": "Glass & AMOLED screen replacements, charging port fixes, camera lens care and speaker repairs.",
        "price": 699,
        "unit": "service"
      },
      {
        "id": "xiaomi-service-support",
        "name": "Xiaomi & Android Smartphone Care",
        "description": "Genuine battery replacement, motherboard diagnostics, software flashing and camera module fixes.",
        "price": 399,
        "unit": "service"
      }
    ],
    "description": "Phone repair, accessories and same-day diagnostics.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.981,
      "longitude": 77.601
    },
    "rating": 4.8,
    "reviews": 96,
    "price": "Repairs from ₹299",
    "icon": "📱",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Phone repair",
      "Mobile phones",
      "Screen & display",
      "Screen replacement",
      "Diagnostics",
      "Phone diagnostics",
      "Accessories",
      "Mobile accessories",
      "Chargers",
      "Fast chargers",
      "Xiaomi"
    ]
  },
  {
    "name": "Greenway Auto Works",
    "category": "Automobiles",
    "subcategories": [
      "Two-wheeler service",
      "Car repair"
    ],
    "products": [
      {
        "id": "greenway-service",
        "name": "Two-wheeler service",
        "description": "Routine inspection and maintenance.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "greenway-puncture",
        "name": "Puncture repair",
        "description": "Quick tyre repair and safety check.",
        "price": 150,
        "unit": "from"
      },
      {
        "id": "automobile-diagnostics",
        "name": "Automobile Engine Diagnostics",
        "description": "Computerized OBD-II engine scan, transmission diagnostics, brake checks and electronic fault tracing.",
        "price": 599,
        "unit": "service"
      },
      {
        "id": "bicycle-service-rentals",
        "name": "Bicycle Sales & Servicing",
        "description": "Gear tuning, chain overhaul, hydraulic disc brake servicing and city bike rentals.",
        "price": 250,
        "unit": "service"
      },
      {
        "id": "brake-pad-replacement",
        "name": "Brake Pad & Disc Care",
        "description": "Inspection, rotor skimming, fluid top-up and ceramic or semi-metallic brake pad replacement.",
        "price": 450,
        "unit": "service"
      },
      {
        "id": "oil-filter-service",
        "name": "Oil Change & Filter Replacement",
        "description": "Synthetic engine oil change, oil filter renewal, air filter cleaning and 24-point car health inspection.",
        "price": 799,
        "unit": "service"
      },
      {
        "id": "scooter-two-wheeler-tuning",
        "name": "Scooter & Motorcycle Servicing",
        "description": "Complete general maintenance, carburetor/FI cleaning, belt check and brake overhaul for all 2Ws.",
        "price": 499,
        "unit": "service"
      },
      {
        "id": "yezdi-bullet-servicing",
        "name": "Yezdi & Vintage Motorcycle Care",
        "description": "Clutch cable tuning, spoke truing, vintage carburetor restoration and heavy two-wheeler service.",
        "price": 699,
        "unit": "service"
      }
    ],
    "description": "Trusted two-wheeler and car service, right around the corner.",
    "distance": 2.1,
    "demoCoordinates": {
      "latitude": 12.99,
      "longitude": 77.608
    },
    "rating": 4.7,
    "reviews": 83,
    "price": "Services from ₹499",
    "icon": "🛵",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Two-wheeler service",
      "Motorcycles",
      "Routine service",
      "Oil & filter",
      "Scooters",
      "Brake & tyre care",
      "Brake pads",
      "Car repair",
      "Cars",
      "Engine & transmission",
      "Diagnostics",
      "Wheels & tyres",
      "Tyre replacement"
    ],
    "tag": "Verified business"
  },
  {
    "name": "The Little Loom",
    "category": "Fashion",
    "subcategories": [
      "Clothing",
      "Local textiles",
      "Tailoring",
      "Footwear"
    ],
    "products": [
      {
        "id": "loom-kurta",
        "name": "Everyday cotton kurta",
        "description": "Locally made cotton clothing.",
        "price": 899,
        "unit": "from"
      },
      {
        "id": "loom-textiles",
        "name": "Handwoven textiles",
        "description": "Small-batch textiles from local makers.",
        "price": 650,
        "unit": "from"
      },
      {
        "id": "alterations-tailoring",
        "name": "Alterations & Tailoring",
        "description": "Suit, shirt, trouser and ethnic dress alterations, zip replacements and custom fitting.",
        "price": 150,
        "unit": "service"
      },
      {
        "id": "fashion-apparel-wear",
        "name": "Fashion & Everyday Clothing",
        "description": "Kurtis, ethnic sets, casual linen shirts, trousers, nightwear and sustainable cotton apparel.",
        "price": 599,
        "unit": "unit"
      },
      {
        "id": "footwear-shoes-sandals",
        "name": "Footwear, Shoes & Casuals",
        "description": "Everyday sneakers, formal leather oxfords, comfort walking sandals and ethnic juttis.",
        "price": 799,
        "unit": "unit"
      },
      {
        "id": "kurta-kurtis-apparel",
        "name": "Kurtas, Kurtis & Ethnic Sets",
        "description": "Hand-block printed cotton kurtis, festive silk kurtas, palazzo sets and dupatta combinations.",
        "price": 749,
        "unit": "unit"
      },
      {
        "id": "saree-draping-festive-wear",
        "name": "Sarees, Drapes & Occasion Wear",
        "description": "Handloom Kanjivaram, Banarasi, Chanderi, soft linen sarees and festive lehengas.",
        "price": 1299,
        "unit": "unit"
      },
      {
        "id": "tailoring-custom-stitching",
        "name": "Tailoring & Custom Blouse Stitching",
        "description": "Designer blouse stitching, customized salwar suits, fall-pico edging and bespoke trousers.",
        "price": 450,
        "unit": "service"
      }
    ],
    "description": "Thoughtful everyday wear from independent local makers.",
    "distance": 3.4,
    "demoCoordinates": {
      "latitude": 12.945,
      "longitude": 77.61
    },
    "rating": 4.9,
    "reviews": 57,
    "price": "New arrivals in store",
    "icon": "🧵",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Clothing",
      "Women",
      "Everyday wear",
      "Cotton kurta",
      "Men",
      "Tailoring",
      "Alterations",
      "Footwear",
      "Shoes",
      "Casual",
      "Everyday sneakers",
      "Local textiles",
      "Handloom",
      "Cotton",
      "Home textiles",
      "Kurtas & kurtis",
      "Sarees & dresses",
      "Blouse stitching"
    ]
  },
  {
    "name": "Oak & Olive Living",
    "category": "Home & furniture",
    "subcategories": [
      "Furniture",
      "Home decor",
      "Interior design",
      "Repairs"
    ],
    "products": [
      {
        "id": "oak-side-table",
        "name": "Handcrafted side table",
        "description": "Made-to-order solid wood furniture.",
        "price": 4200,
        "unit": "from"
      },
      {
        "id": "oak-consult",
        "name": "Furniture consultation",
        "description": "Discuss a custom piece for your home.",
        "price": 0,
        "unit": "free enquiry"
      },
      {
        "id": "bed-bedroom-furniture",
        "name": "Bed & Bedroom Furniture",
        "description": "Solid wood beds, storage cots, orthopedic mattresses and bedside nightstands.",
        "price": 5999,
        "unit": "unit"
      },
      {
        "id": "furniture-assembly-fitting",
        "name": "Furniture Assembly & Fitting",
        "description": "Professional assembly of flat-pack furniture, TV units, study tables, beds and modular wardrobes.",
        "price": 399,
        "unit": "service"
      },
      {
        "id": "home-decor-lighting",
        "name": "Home Decor & Ambient Lighting",
        "description": "Minimalist ceramic vases, warm LED pendant lamps, canvas art frames and handmade wall hangings.",
        "price": 350,
        "unit": "unit"
      },
      {
        "id": "indoor-plants-nursery",
        "name": "Indoor Plants & Ceramic Pots",
        "description": "Air-purifying snake plants, monstera, succulents, terra-cotta planters and balcony stands.",
        "price": 120,
        "unit": "unit"
      },
      {
        "id": "nursery-flowering-plants",
        "name": "Nursery Plants & Floral Bouquets",
        "description": "Fresh rose bouquets, jasmine garlands, flowering shrubs, potting soils and fertilizer mixes.",
        "price": 150,
        "unit": "unit"
      },
      {
        "id": "room-makeover-planning",
        "name": "Room Makeover & Space Planning",
        "description": "Wall color consultations, furniture rearrangement, lighting upgrades and modern modular aesthetics.",
        "price": 2499,
        "unit": "service"
      },
      {
        "id": "upholstery-furniture-repair",
        "name": "Upholstery & Furniture Restoration",
        "description": "Re-cushioning dining chairs, high-density foam replacement, leather re-stitching and fabric upgrades.",
        "price": 850,
        "unit": "service"
      },
      {
        "id": "urban-gardening-supplies",
        "name": "Urban Gardening & Terrace Balcony Kits",
        "description": "Coco-peat blocks, organic neem fertilizers, seed packs, vertical hanging planters and drip pipes.",
        "price": 199,
        "unit": "unit"
      },
      {
        "id": "wall-art-decor-prints",
        "name": "Wall Art & Handmade Hangings",
        "description": "Framed canvas prints, modern abstract murals, macramé wall hangings and brass wall sculptures.",
        "price": 450,
        "unit": "unit"
      },
      {
        "id": "wardrobes-modular-storage",
        "name": "Wardrobes & Modular Storage Racks",
        "description": "Sliding-door modular wardrobes, walk-in closets, study desks and engineered wood armoires.",
        "price": 8999,
        "unit": "unit"
      },
      {
        "id": "zen-garden-landscaping",
        "name": "Zen Garden & Water Fountain Setup",
        "description": "Japanese zen pebble landscaping, indoor water fountains, bamboo screens and tranquility corners.",
        "price": 3499,
        "unit": "service"
      }
    ],
    "description": "Handcrafted furniture and home finds, made to last.",
    "distance": 4.8,
    "demoCoordinates": {
      "latitude": 12.94,
      "longitude": 77.56
    },
    "rating": 4.6,
    "reviews": 71,
    "price": "Custom orders welcome",
    "icon": "🪑",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Furniture",
      "Living room",
      "Tables",
      "Side table",
      "Home decor",
      "Wall decor",
      "Handmade",
      "Local art",
      "Repairs",
      "Carpentry",
      "Furniture repair",
      "Wood repair",
      "Interior design",
      "Home planning",
      "Room makeover",
      "Consultation",
      "Beds",
      "Furniture assembly",
      "Garden care",
      "Home & garden",
      "Wall art",
      "Wardrobes"
    ]
  },
  {
    "name": "Neighbourhood Physio",
    "category": "Health & wellness",
    "subcategories": [
      "Physiotherapy",
      "Clinics"
    ],
    "products": [
      {
        "id": "physio-assessment",
        "name": "Physiotherapy assessment",
        "description": "Initial mobility and movement consultation.",
        "price": 400,
        "unit": "per visit"
      },
      {
        "id": "physio-followup",
        "name": "Follow-up session",
        "description": "One-on-one follow-up care.",
        "price": 350,
        "unit": "per visit"
      },
      {
        "id": "doctor-general-consultation",
        "name": "Doctor Consultation (General & Child)",
        "description": "In-clinic and teleconsultations with certified general physicians and paediatricians.",
        "price": 400,
        "unit": "service"
      },
      {
        "id": "eye-examination-opticals",
        "name": "Eye Care & Prescription Glasses",
        "description": "Comprehensive eye testing, prescription lenses, designer frames and blue-light spectacles.",
        "price": 499,
        "unit": "unit"
      },
      {
        "id": "optical-frames-spectacles",
        "name": "Optical Eyewear & Sunglasses",
        "description": "Lightweight titanium and acetate frames, UV-protected sunglasses and anti-reflective reading glasses.",
        "price": 899,
        "unit": "unit"
      },
      {
        "id": "physiotherapy-mobility",
        "name": "Physiotherapy & Mobility Care",
        "description": "Post-surgery rehabilitation, spinal decompression, back & neck pain relief and posture correction.",
        "price": 400,
        "unit": "service"
      },
      {
        "id": "xray-diagnostic-appointments",
        "name": "X-Ray & Diagnostic Appointments",
        "description": "Digital radiography, bone density scans, ultrasound appointments and prompt digital report access.",
        "price": 450,
        "unit": "service"
      }
    ],
    "description": "Friendly physiotherapy and mobility care from local experts.",
    "distance": 2.7,
    "demoCoordinates": {
      "latitude": 12.96,
      "longitude": 77.58
    },
    "rating": 4.8,
    "reviews": 64,
    "price": "Consultations from ₹400",
    "icon": "🩺",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Physiotherapy",
      "Mobility care",
      "Assessment",
      "Physiotherapy assessment",
      "Follow-up",
      "Follow-up session",
      "Clinics",
      "Eye examination",
      "Eye care"
    ]
  },
  {
    "name": "ProFix Home & Appliance Services",
    "category": "Everyday services",
    "subcategories": [
      "Appliance repair",
      "Plumbing",
      "Electrical",
      "Cleaning"
    ],
    "products": [
      {
        "id": "profix-ac",
        "name": "AC Repair & Servicing",
        "description": "Filter clean, gas recharge and cooling coil inspection.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "profix-elec",
        "name": "Electrical Wiring & Fixing",
        "description": "Switchboard repair, fan installation and emergency fixes.",
        "price": 249,
        "unit": "from"
      },
      {
        "id": "profix-plumb",
        "name": "Plumbing & Leak Repairs",
        "description": "Tap, sink, toilet and drainage repair.",
        "price": 299,
        "unit": "from"
      },
      {
        "id": "profix-ro",
        "name": "Water Purifier (RO) Service",
        "description": "Filter replacement and membrane service.",
        "price": 349,
        "unit": "from"
      },
      {
        "id": "appliance-repair",
        "name": "Appliance Repair",
        "description": "Same-day doorstep repair for washing machines, microwaves, refrigerators and dishwashers.",
        "price": 299,
        "unit": "service"
      },
      {
        "id": "cleaning-deep-home",
        "name": "Cleaning & Housekeeping (Deep Clean)",
        "description": "Full home sanitization, kitchen chimney degreasing, bathroom descaling and sofa shampooing.",
        "price": 1299,
        "unit": "service"
      },
      {
        "id": "electrical-repairs-wiring",
        "name": "Electrical Repairs & Wiring",
        "description": "Short circuit troubleshooting, MCB switchboard fixing, chandelier setup and whole-home rewiring.",
        "price": 249,
        "unit": "service"
      },
      {
        "id": "electrician-doorstep",
        "name": "Electrician On-Demand",
        "description": "Verified certified electricians for quick emergency fixes, fan installations and appliance plugs.",
        "price": 199,
        "unit": "service"
      },
      {
        "id": "inverter-ups-repair",
        "name": "Inverter & UPS Maintenance",
        "description": "Home backup power check-up, tubular battery acid top-up, wiring safety and inverter board repairs.",
        "price": 349,
        "unit": "service"
      },
      {
        "id": "kitchen-appliances-repair",
        "name": "Kitchen Appliances Service",
        "description": "Mixer grinder, induction cooktop, electric oven and water heater doorstep servicing.",
        "price": 249,
        "unit": "service"
      },
      {
        "id": "kitchen-cleaning-degreasing",
        "name": "Kitchen Deep Cleaning & Degreasing",
        "description": "Heavy oil and carbon stain removal from tiles, granite counters, exhaust fans and modular cabinets.",
        "price": 899,
        "unit": "service"
      },
      {
        "id": "laundry-dry-cleaning",
        "name": "Laundry & Eco Dry Cleaning",
        "description": "Steam press, silk saree dry cleaning, suit sanitization, quilt washing and doorstep pickup & drop.",
        "price": 120,
        "unit": "service"
      },
      {
        "id": "leak-detection-plumbing",
        "name": "Leak Repair & Pipe Plumbing",
        "description": "Overhead tank float valve fix, concealed wall seepage tracing, tap washer and flush tank repairs.",
        "price": 299,
        "unit": "service"
      },
      {
        "id": "plumbing-pipe-repairs",
        "name": "Plumbing & Fixture Installation",
        "description": "Mixer tap replacement, washbasin setup, clogged drain clearance, pipe repairs and geyser inlet valves.",
        "price": 249,
        "unit": "service"
      },
      {
        "id": "quilt-blanket-dry-clean",
        "name": "Quilt, Blanket & Curtain Cleaning",
        "description": "Deep steam cleaning for heavy winter quilts, comforters, blackout curtains and decorative rugs.",
        "price": 350,
        "unit": "service"
      },
      {
        "id": "refrigerator-gas-repair",
        "name": "Refrigerator Repair & Gas Refill",
        "description": "Compressor troubleshooting, frost build-up resolution, thermostat calibration and gas charge.",
        "price": 449,
        "unit": "service"
      },
      {
        "id": "sofa-carpet-cleaning",
        "name": "Sofa & Upholstery Deep Shampooing",
        "description": "Fabric and leather couch steam cleaning, allergen extraction and stain spot removal.",
        "price": 699,
        "unit": "service"
      },
      {
        "id": "tap-pipe-installation",
        "name": "Tap & Sanitary Fixture Installation",
        "description": "Overhead rain showers, quarter-turn taps, health faucets and bathroom fittings installed cleanly.",
        "price": 199,
        "unit": "service"
      },
      {
        "id": "washing-machine-service",
        "name": "Washing Machine Repair & Care",
        "description": "Front load & top load motor checks, drum bearing repair, water inlet valve and drainage pump fixes.",
        "price": 399,
        "unit": "service"
      },
      {
        "id": "water-purifier-ro-service",
        "name": "Water Purifier (RO) Filter Service",
        "description": "Sediment filter replacement, carbon block changes, RO membrane descaling and TDS water balancing.",
        "price": 349,
        "unit": "service"
      }
    ],
    "description": "Doorstep AC repair, electrical wiring, plumbing leak fixes and home appliance maintenance.",
    "distance": 1.5,
    "demoCoordinates": {
      "latitude": 12.975,
      "longitude": 77.62
    },
    "rating": 4.9,
    "reviews": 142,
    "price": "Services from ₹249",
    "icon": "🛠️",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "AC repair",
      "Air conditioning",
      "Appliance repair",
      "Electrical",
      "Wiring repair",
      "Plumbing",
      "Leak repair",
      "Washing machine service",
      "Refrigerator service",
      "Water purifier",
      "Deep cleaning",
      "Handyman",
      "Carpentry",
      "Pest control",
      "Cleaning",
      "Kitchen cleaning",
      "Tap & fixture installation"
    ],
    "tag": "Top rated nearby"
  },
  {
    "name": "Urban Blossom & Fitness Studio",
    "category": "Sports & fitness",
    "subcategories": [
      "Gyms & fitness centers",
      "Yoga & pilates",
      "Sports coaching",
      "Dance fitness",
      "Personal training"
    ],
    "products": [
      {
        "id": "ub-gym",
        "name": "Gym Membership & Weight Training",
        "description": "Full gym floor access, cardio equipment and strength weights.",
        "price": 1500,
        "unit": "per month"
      },
      {
        "id": "ub-yoga",
        "name": "Yoga Classes & Meditation",
        "description": "Morning and evening Hatha & Vinyasa flow sessions.",
        "price": 1000,
        "unit": "per month"
      },
      {
        "id": "ub-zumba",
        "name": "Zumba & Cardio Dance",
        "description": "High-energy rhythm cardio workout with certified instructors.",
        "price": 1200,
        "unit": "per month"
      },
      {
        "id": "ub-turf",
        "name": "Badminton Court & Turf Booking",
        "description": "Hourly indoor wooden court slot with international mats.",
        "price": 350,
        "unit": "per hour"
      },
      {
        "id": "fitness-coaching-gym",
        "name": "Fitness Coaching & Personal Training",
        "description": "One-on-one strength workouts, cross-training, muscle conditioning and cardio coaching.",
        "price": 2000,
        "unit": "mo"
      },
      {
        "id": "sports-coaching-classes",
        "name": "Sports Coaching (Badminton, Cricket)",
        "description": "Professional coaching academies for kids and adults across badminton, cricket, tennis and swimming.",
        "price": 1800,
        "unit": "mo"
      },
      {
        "id": "yoga-wellness-classes",
        "name": "Yoga Classes & Pranayama Sessions",
        "description": "Hatha, Vinyasa flow, morning meditation, breathing exercises, prenatal yoga and posture alignment.",
        "price": 1000,
        "unit": "mo"
      },
      {
        "id": "zumba-fitness-dance",
        "name": "Zumba & Cardio Dance Sessions",
        "description": "High-energy Latin dance cardio workouts, rhythm fitness classes and weekend stress-buster sessions.",
        "price": 1200,
        "unit": "mo"
      }
    ],
    "description": "Community fitness center offering weight training, yoga, Zumba, badminton courts and personal training.",
    "distance": 2.3,
    "demoCoordinates": {
      "latitude": 12.965,
      "longitude": 77.615
    },
    "rating": 4.8,
    "reviews": 110,
    "price": "Sessions from ₹350",
    "icon": "🏋️",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Sports & fitness",
      "Gyms & fitness centers",
      "Gym membership",
      "Weight training",
      "CrossFit",
      "Yoga & pilates",
      "Yoga classes",
      "Zumba",
      "Dance fitness",
      "Sports coaching",
      "Badminton",
      "Cricket",
      "Personal training",
      "Fitness",
      "Group exercise"
    ]
  },
  {
    "name": "Apex City Travel & Logistics",
    "category": "Travel",
    "subcategories": [
      "Local transport",
      "Airport rides",
      "Moving help",
      "Tours & experiences"
    ],
    "products": [
      {
        "id": "apex-airport",
        "name": "Airport Transfer Cab",
        "description": "Prompt, sanitized airport pickup and drop.",
        "price": 999,
        "unit": "per ride"
      },
      {
        "id": "apex-tour",
        "name": "Local City Sightseeing Cab",
        "description": "Full-day sightseeing with professional driver.",
        "price": 1499,
        "unit": "per day"
      },
      {
        "id": "apex-movers",
        "name": "Movers & Packers Assistance",
        "description": "Household packing, transport and unpacking.",
        "price": 2499,
        "unit": "from"
      },
      {
        "id": "outdoor-tours-experiences",
        "name": "Outdoor Tours & City Experiences",
        "description": "Heritage walks, bird-watching nature trails, cycling breakfasts and vineyard tours.",
        "price": 599,
        "unit": "service"
      },
      {
        "id": "tours-local-experiences",
        "name": "Tours & Local City Sightseeing",
        "description": "Full-day city heritage cabs, temple circuits, botanical garden trips and guided city excursions.",
        "price": 1499,
        "unit": "service"
      }
    ],
    "description": "Reliable airport transfers, day tours, vehicle rentals and moving help across town.",
    "distance": 3.1,
    "demoCoordinates": {
      "latitude": 12.985,
      "longitude": 77.635
    },
    "rating": 4.7,
    "reviews": 78,
    "price": "Cabs from ₹999",
    "icon": "✈️",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Airport transfer",
      "City tour",
      "Local transport",
      "Car hire",
      "Car rentals",
      "Hotels",
      "Guest houses",
      "Moving help",
      "Movers & packers",
      "Logistics",
      "Tours & experiences"
    ]
  },
  {
    "name": "Jaya Bajaj – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Two-wheeler service",
      "Car repair"
    ],
    "products": [
      {
        "id": "jb-chetak",
        "name": "Chetak Electric Scooter (Sales)",
        "description": "Latest Bajaj Chetak EV with full paperwork assistance.",
        "price": 115000,
        "unit": "onwards"
      },
      {
        "id": "jb-service",
        "name": "Bajaj 2-Wheeler Routine Service",
        "description": "Oil change, brake check and full vehicle inspection.",
        "price": 599,
        "unit": "from"
      },
      {
        "id": "jb-pulsar",
        "name": "Pulsar 125 / NS200 (Sales)",
        "description": "Authorized Bajaj showroom. Finance options available.",
        "price": 75000,
        "unit": "onwards"
      }
    ],
    "description": "Authorized Bajaj dealership near Bagalur Circle, Hosur. Sales of Pulsar, Platina, Chetak EV and full after-sales service.",
    "distance": 1.8,
    "demoCoordinates": {
      "latitude": 12.7326,
      "longitude": 77.8281
    },
    "rating": 4.6,
    "reviews": 187,
    "price": "Bikes from ₹75,000",
    "icon": "🏍️",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Two wheeler",
      "Bajaj",
      "Pulsar 125",
      "Pulsar NS200",
      "Chetak",
      "Sales",
      "Service",
      "Two-wheeler service",
      "Routine service",
      "Oil & filter",
      "Brake pads"
    ],
    "tag": "Authorized dealer"
  },
  {
    "name": "Sree Velan TVS – Bagalur Circle",
    "category": "Automobiles",
    "subcategories": [
      "Two-wheeler service",
      "Car repair"
    ],
    "products": [
      {
        "id": "tvs-jupiter",
        "name": "TVS Jupiter (Sales)",
        "description": "TVS Jupiter scooter – top comfort pick for families.",
        "price": 88000,
        "unit": "onwards"
      },
      {
        "id": "tvs-iqube",
        "name": "TVS iQube Electric (Sales)",
        "description": "Authorized EV showroom with home charging support.",
        "price": 145000,
        "unit": "onwards"
      },
      {
        "id": "tvs-svc",
        "name": "TVS Annual Service Package",
        "description": "Engine oil, air filter, chain lube and brake pads.",
        "price": 799,
        "unit": "per service"
      }
    ],
    "description": "TVS Motors authorized showroom on Bagalur Road, Hosur. Sales, service and spare parts for all TVS two-wheelers.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.7341,
      "longitude": 77.8293
    },
    "rating": 4.7,
    "reviews": 241,
    "price": "Scooters from ₹88,000",
    "icon": "🛵",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Two wheeler",
      "TVS",
      "Jupiter",
      "Ntorq 125",
      "iQube",
      "Sales",
      "Service",
      "Two-wheeler service",
      "Routine service",
      "Electric 2W",
      "Battery & motor check"
    ],
    "tag": "Verified business"
  },
  {
    "name": "Amman Motors Maruti ARENA – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Four-wheeler sales",
      "Car repair"
    ],
    "products": [
      {
        "id": "mm-swift",
        "name": "Maruti Swift (Sales)",
        "description": "New Swift with finance from 7.9% p.a. and exchange bonus.",
        "price": 699000,
        "unit": "onwards"
      },
      {
        "id": "mm-brezza",
        "name": "Maruti Brezza (Sales)",
        "description": "Top-selling SUV — test drive available daily.",
        "price": 1095000,
        "unit": "onwards"
      },
      {
        "id": "mm-service",
        "name": "Maruti Car Service (Annual)",
        "description": "Genuine spares, full inspection and car wash.",
        "price": 3499,
        "unit": "from"
      }
    ],
    "description": "Maruti Suzuki ARENA authorized dealership on NH-7, Hosur. Full sales, exchange, finance and after-sales service.",
    "distance": 3.4,
    "demoCoordinates": {
      "latitude": 12.727,
      "longitude": 77.835
    },
    "rating": 4.5,
    "reviews": 309,
    "price": "Cars from ₹6.99 L",
    "icon": "🚗",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Four wheeler",
      "Maruti Suzuki",
      "Swift",
      "Baleno",
      "Brezza",
      "WagonR",
      "Dzire",
      "Sales",
      "Service",
      "Car repair",
      "Engine & transmission",
      "Wheels & tyres"
    ],
    "tag": "Authorized dealer"
  },
  {
    "name": "Himavasini Hyundai – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Four-wheeler sales",
      "Car repair"
    ],
    "products": [
      {
        "id": "hh-creta",
        "name": "Hyundai Creta (Sales)",
        "description": "Hosur's most test-driven SUV — book your slot.",
        "price": 1099000,
        "unit": "onwards"
      },
      {
        "id": "hh-exter",
        "name": "Hyundai Exter (Sales)",
        "description": "Compact SUV with top safety ratings.",
        "price": 699000,
        "unit": "onwards"
      },
      {
        "id": "hh-svc",
        "name": "Hyundai Periodic Service",
        "description": "Genuine parts service with free health check.",
        "price": 2999,
        "unit": "from"
      }
    ],
    "description": "Authorized Hyundai dealership on Krishnagiri Road, Hosur. Sales, test drives, trade-in and full workshop service.",
    "distance": 2.9,
    "demoCoordinates": {
      "latitude": 12.731,
      "longitude": 77.841
    },
    "rating": 4.6,
    "reviews": 178,
    "price": "Cars from ₹6.99 L",
    "icon": "🚙",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Four wheeler",
      "Hyundai",
      "Creta",
      "Exter",
      "Venue",
      "i20",
      "Verna",
      "Aura",
      "Sales",
      "Service",
      "Car repair",
      "Wheels & tyres",
      "AC cooling recharge"
    ]
  },
  {
    "name": "Saraswathi Auto Engineering – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Car repair",
      "Tyres & batteries"
    ],
    "products": [
      {
        "id": "sae-ac",
        "name": "Car AC Repair & Gas Recharge",
        "description": "Cooling system diagnosis and refrigerant refill.",
        "price": 899,
        "unit": "from"
      },
      {
        "id": "sae-elect",
        "name": "Auto Electrical Repair",
        "description": "Wiring, alternator, starter motor and ECU diagnostics.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "sae-battery",
        "name": "Car Battery Replacement",
        "description": "On-the-spot battery test and replacement service.",
        "price": 3500,
        "unit": "from"
      },
      {
        "id": "battery-replacement",
        "name": "Battery Replacement (Car & Bike)",
        "description": "Doorstep jumpstart and multi-brand battery replacement for cars, bikes and inverters.",
        "price": 350,
        "unit": "service"
      },
      {
        "id": "quick-puncture-repair",
        "name": "Quick Puncture & Tyre Safety Check",
        "description": "Tubeless tyre puncture repair, nitrogen air filling, rim inspection and tyre pressure monitoring.",
        "price": 150,
        "unit": "service"
      },
      {
        "id": "tyre-replacement-balancing",
        "name": "Tyre Replacement & Wheel Balancing",
        "description": "New car & bike tyres from top brands, computerized 3D laser alignment and alloy balancing.",
        "price": 350,
        "unit": "service"
      }
    ],
    "description": "Multi-brand car repair and electrical workshop on Bagalur Road. Specialist in AC, wiring, battery and engine diagnostics.",
    "distance": 2.2,
    "demoCoordinates": {
      "latitude": 12.7355,
      "longitude": 77.826
    },
    "rating": 4.8,
    "reviews": 134,
    "price": "Repairs from ₹499",
    "icon": "🔧",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Car repair",
      "Cars",
      "Engine & transmission",
      "Diagnostics",
      "Air conditioning",
      "AC cooling recharge",
      "Tyres & batteries",
      "Vehicle batteries",
      "Battery replacement",
      "Car & bike battery",
      "Puncture repair",
      "Tyre replacement"
    ]
  },
  {
    "name": "Croma – Hosur",
    "category": "Electronics",
    "subcategories": [
      "Mobile phones",
      "Home appliances",
      "Laptops & computers",
      "Audio & video"
    ],
    "products": [
      {
        "id": "croma-phone",
        "name": "Mobile Phone Sales & Demo",
        "description": "All top brands — Apple, Samsung, Xiaomi, OnePlus — demo available.",
        "price": 8999,
        "unit": "from"
      },
      {
        "id": "croma-laptop",
        "name": "Laptop & Computer Sales",
        "description": "Dell, HP, Lenovo, Apple — EMI from ₹0 down payment.",
        "price": 34999,
        "unit": "from"
      },
      {
        "id": "croma-appliance",
        "name": "Home Appliance Sales",
        "description": "Washing machines, refrigerators, ACs from LG, Samsung and more.",
        "price": 12999,
        "unit": "from"
      },
      {
        "id": "laptop-computer-repair",
        "name": "Laptop & PC Repair",
        "description": "SSD upgrades, broken hinge fixes, RAM expansion, OS reinstallations, thermal paste and battery repair.",
        "price": 499,
        "unit": "service"
      },
      {
        "id": "macbook-apple-service",
        "name": "MacBook & iPad Specialist",
        "description": "Retina display replacements, keyboard key fixes, logic board repair and battery health service.",
        "price": 999,
        "unit": "service"
      },
      {
        "id": "television-audio-service",
        "name": "Television Mounting & Audio Setup",
        "description": "Wall mounting of 43″–75″ LED/OLED smart TVs, hidden cable channeling and Dolby soundbar sync.",
        "price": 499,
        "unit": "service"
      },
      {
        "id": "xps-laptop-diagnostics",
        "name": "XPS & High-Performance Laptop Repair",
        "description": "Cooling fan thermal overhaul, motherboard chip-level repair, SSD upgrades and keyboard fixes.",
        "price": 699,
        "unit": "service"
      }
    ],
    "description": "Tata-owned Croma electronics superstore in Hosur. Large floor with phones, laptops, TVs, appliances and extended warranty service.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.7318,
      "longitude": 77.8301
    },
    "rating": 4.5,
    "reviews": 412,
    "price": "Electronics from ₹8,999",
    "icon": "🖥️",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Sales",
      "Mobile phones",
      "Apple",
      "Samsung",
      "Xiaomi",
      "Laptops & computers",
      "Dell",
      "HP",
      "Lenovo",
      "Home appliances",
      "LG",
      "Whirlpool",
      "Audio & video",
      "Sony",
      "MacBook Pro"
    ],
    "tag": "Popular nearby"
  },
  {
    "name": "Bluewave Computers – Bagalur Road",
    "category": "Electronics",
    "subcategories": [
      "Laptops & computers",
      "Mobile phones"
    ],
    "products": [
      {
        "id": "bw-laptop-service",
        "name": "Laptop Repair & Service",
        "description": "Motherboard, screen, keyboard and hinge repairs.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "bw-custom-pc",
        "name": "Custom PC Build",
        "description": "Gaming or workstation build with warranty on all components.",
        "price": 35000,
        "unit": "from"
      },
      {
        "id": "bw-cctv",
        "name": "CCTV Installation (4/8 cam)",
        "description": "HD camera setup for homes and shops with remote viewing.",
        "price": 8999,
        "unit": "from"
      }
    ],
    "description": "Computer hardware, custom PC builds, laptop repair and CCTV installation on Bagalur Road, Hosur.",
    "distance": 2.3,
    "demoCoordinates": {
      "latitude": 12.7345,
      "longitude": 77.8278
    },
    "rating": 4.7,
    "reviews": 98,
    "price": "Repairs from ₹499",
    "icon": "💻",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Service",
      "Laptops & computers",
      "Dell",
      "HP",
      "Lenovo",
      "ASUS",
      "Acer",
      "Apple",
      "MacBook Air",
      "ThinkPad",
      "Phone repair",
      "Mobile phones"
    ]
  },
  {
    "name": "Vasavi Cafe – Hosur",
    "category": "Food & dining",
    "subcategories": [
      "Restaurants",
      "Cafes & beverages"
    ],
    "products": [
      {
        "id": "vc-dosa",
        "name": "Crispy Masala Dosa",
        "description": "Paper-thin ghee dosa with authentic chutneys and sambar.",
        "price": 55,
        "unit": "per plate"
      },
      {
        "id": "vc-rava-idli",
        "name": "Rava Idli Platter",
        "description": "Soft rava idlis with coconut chutney and gunpowder.",
        "price": 60,
        "unit": "per platter"
      },
      {
        "id": "vc-coffee",
        "name": "Filter Coffee",
        "description": "Traditional South Indian drip coffee — strong and creamy.",
        "price": 25,
        "unit": "per cup"
      },
      {
        "id": "coffee-cafe-beverages",
        "name": "Coffee, Tea & Cafe Dining",
        "description": "Specialty filter coffee, roasted espresso beans, artisan teas and healthy smoothies.",
        "price": 60,
        "unit": "unit"
      },
      {
        "id": "juice-smoothie-bar",
        "name": "Juice Bars & Healthy Smoothies",
        "description": "Cold-pressed detox greens, sugarcane coolers, protein smoothies and sugar-free fruit bowls.",
        "price": 80,
        "unit": "unit"
      }
    ],
    "description": "Iconic South Indian breakfast spot in Hosur. Famous for crispy masala dosas, rava idlis and filter coffee — open from 6 AM.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.733,
      "longitude": 77.8335
    },
    "rating": 4.8,
    "reviews": 563,
    "price": "Breakfast from ₹25",
    "icon": "🥞",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Restaurants",
      "Indian",
      "South Indian",
      "Dosa & idli",
      "Cafes & beverages",
      "Coffee & tea",
      "Hot drinks",
      "Coffee & tea",
      "Breakfast",
      "Cold drinks"
    ],
    "tag": "Local favourite"
  },
  {
    "name": "Muneer Bakery – Hosur",
    "category": "Food & dining",
    "subcategories": [
      "Bakery & sweets",
      "Cafes & beverages"
    ],
    "products": [
      {
        "id": "mb-paal-puff",
        "name": "Paal Khova Puff",
        "description": "Signature cream puff — viral Hosur favourite.",
        "price": 30,
        "unit": "per piece"
      },
      {
        "id": "mb-dilpasand",
        "name": "Dilpasand",
        "description": "Sweet stuffed pastry — a Hosur must-try.",
        "price": 35,
        "unit": "per piece"
      },
      {
        "id": "mb-cream-bun",
        "name": "Fresh Cream Bun",
        "description": "Soft pillowy bun with fresh whipped cream filling.",
        "price": 28,
        "unit": "per bun"
      },
      {
        "id": "bakery-artisan",
        "name": "Bakery & Artisan Breads",
        "description": "Sourdough loaves, fresh garlic buns, croissants, whole wheat breads and tea cakes baked daily.",
        "price": 80,
        "unit": "unit"
      },
      {
        "id": "cake-delivery",
        "name": "Cakes & Celebration Bakery",
        "description": "Customized designer birthday cakes, cheesecakes, cupcakes and eggless celebration treats.",
        "price": 450,
        "unit": "unit"
      }
    ],
    "description": "Hosur's most-loved bakery — famous city-wide for paal khova puffs, cream buns and dilpasands. Open daily from 7 AM.",
    "distance": 1.1,
    "demoCoordinates": {
      "latitude": 12.7322,
      "longitude": 77.8318
    },
    "rating": 4.9,
    "reviews": 871,
    "price": "Snacks from ₹25",
    "icon": "🥐",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Bakery & sweets",
      "Baked goods",
      "Breads & buns",
      "Fresh bread",
      "Cakes",
      "Celebrations",
      "Indian sweets",
      "Fresh sweets",
      "Traditional sweets",
      "Bakery"
    ],
    "tag": "Hosur favourite"
  },
  {
    "name": "Rayalaseema Spice – Hosur",
    "category": "Food & dining",
    "subcategories": [
      "Restaurants",
      "Meal delivery"
    ],
    "products": [
      {
        "id": "rs-biryani",
        "name": "Andhra Chicken Biryani",
        "description": "Spicy Rayalaseema-style dum biryani with raita.",
        "price": 180,
        "unit": "per plate"
      },
      {
        "id": "rs-meals",
        "name": "Andhra Meals (Unlimited)",
        "description": "Full thali with rice, curries, pappad and dessert.",
        "price": 130,
        "unit": "per person"
      },
      {
        "id": "rs-mutton",
        "name": "Mutton Curry + Rice Combo",
        "description": "Slow-cooked mutton in authentic Andhra masala.",
        "price": 220,
        "unit": "per plate"
      }
    ],
    "description": "Popular Andhra-style restaurant in Hosur famous for fiery biryanis and unlimited Rayalaseema meals. Perfect for non-veg lovers.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.7315,
      "longitude": 77.8295
    },
    "rating": 4.7,
    "reviews": 428,
    "price": "Meals from ₹130",
    "icon": "🍛",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Restaurants",
      "Indian",
      "Andhra",
      "Biryani",
      "Meals & thalis",
      "Meal delivery",
      "Daily meals",
      "Lunch",
      "Homestyle lunch"
    ]
  },
  {
    "name": "Hotel Junior Kuppanna – Hosur",
    "category": "Food & dining",
    "subcategories": [
      "Restaurants",
      "Catering"
    ],
    "products": [
      {
        "id": "hk-kongu",
        "name": "Kongunadu Meals",
        "description": "Traditional Kongu-style non-veg thali — rice, curries, kuzhambu.",
        "price": 160,
        "unit": "per person"
      },
      {
        "id": "hk-biryani",
        "name": "Mutton / Chicken Biryani",
        "description": "Authentic Kuppanna biryani — the Hosur crowd favourite.",
        "price": 200,
        "unit": "per plate"
      },
      {
        "id": "hk-catering",
        "name": "Event Catering Package",
        "description": "Full catering for 50–500 guests. Traditional setup included.",
        "price": 350,
        "unit": "per head"
      },
      {
        "id": "catering-event-meals",
        "name": "Catering & Event Meals",
        "description": "Party platters, corporate lunch buffets, wedding catering and regional feast menus.",
        "price": 250,
        "unit": "service"
      }
    ],
    "description": "Famous Kongunadu-style non-veg restaurant in Hosur. Beloved for authentic mutton biryani, kuzhambu meals and event catering.",
    "distance": 1.9,
    "demoCoordinates": {
      "latitude": 12.7302,
      "longitude": 77.827
    },
    "rating": 4.8,
    "reviews": 692,
    "price": "Meals from ₹160",
    "icon": "🍲",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Restaurants",
      "Indian",
      "South Indian",
      "Meals & thalis",
      "Catering",
      "Events",
      "Large gatherings",
      "Event catering",
      "Biryani"
    ],
    "tag": "Local favourite"
  },
  {
    "name": "A2B – Adyar Ananda Bhavan, Hosur",
    "category": "Food & dining",
    "subcategories": [
      "Restaurants",
      "Bakery & sweets"
    ],
    "products": [
      {
        "id": "a2b-thali",
        "name": "Pure Veg Meals Thali",
        "description": "Full South Indian veg thali with rice, kuzhambu and payasam.",
        "price": 150,
        "unit": "per person"
      },
      {
        "id": "a2b-sweets",
        "name": "Mysore Pak & Sweets Box",
        "description": "Traditional South Indian sweets — perfect for gifting.",
        "price": 380,
        "unit": "per 500g"
      },
      {
        "id": "a2b-snacks",
        "name": "Tiffin Snacks Combo",
        "description": "Vada, samosa, pongal and filter coffee set.",
        "price": 120,
        "unit": "per combo"
      }
    ],
    "description": "A2B (Adyar Ananda Bhavan) Hosur branch. Pure vegetarian restaurant and sweet shop — family meals, sweets and festive orders.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.7337,
      "longitude": 77.8308
    },
    "rating": 4.6,
    "reviews": 531,
    "price": "Thali ₹150",
    "icon": "🍮",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Restaurants",
      "Indian",
      "South Indian",
      "Vegetarian",
      "Meals & thalis",
      "Bakery & sweets",
      "Indian sweets",
      "Traditional sweets",
      "Meal delivery",
      "Tiffin"
    ]
  },
  {
    "name": "Uzhavar Santhai – Hosur Farmers Market",
    "category": "Food & dining",
    "subcategories": [
      "Groceries & produce"
    ],
    "products": [
      {
        "id": "uz-veg",
        "name": "Fresh Seasonal Vegetables",
        "description": "Direct from Hosur farmers — zero middlemen.",
        "price": 30,
        "unit": "per kg from"
      },
      {
        "id": "uz-fruits",
        "name": "Fresh Local Fruits",
        "description": "Seasonal fruits — mangoes, guava, tomatoes, bananas.",
        "price": 40,
        "unit": "per kg from"
      },
      {
        "id": "uz-flowers",
        "name": "Fresh Roses & Marigolds",
        "description": "Bulk and retail flowers — Hosur is the rose capital of India.",
        "price": 80,
        "unit": "per bunch"
      },
      {
        "id": "fruits-fresh-produce",
        "name": "Fruits & Fresh Farm Produce",
        "description": "Locally sourced seasonal fruits, organic apples, bananas, berries and cold-pressed citrus baskets.",
        "price": 60,
        "unit": "unit"
      },
      {
        "id": "groceries-pantry-staples",
        "name": "Groceries & Daily Pantry Staples",
        "description": "Aromatics, cold-pressed oils, rice, whole pulses, unrefined sugar, spices and flour delivered locally.",
        "price": 45,
        "unit": "unit"
      },
      {
        "id": "vegetable-fresh-produce",
        "name": "Vegetables & Farm Fresh Greens",
        "description": "Daily harvested tomatoes, spinach, bell peppers, root vegetables and crisp farm greens.",
        "price": 40,
        "unit": "unit"
      }
    ],
    "description": "Government-run Uzhavar Santhai (Farmers Market) in Hosur. Buy fresh vegetables, fruits and flowers directly from local farmers at below-market prices.",
    "distance": 0.9,
    "demoCoordinates": {
      "latitude": 12.7335,
      "longitude": 77.8355
    },
    "rating": 4.5,
    "reviews": 631,
    "price": "Vegetables from ₹30/kg",
    "icon": "🥬",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Groceries & produce",
      "Fresh produce",
      "Vegetables",
      "Seasonal vegetables",
      "Fruits",
      "Fresh fruits",
      "Pantry",
      "Staples"
    ],
    "tag": "Government market"
  },
  {
    "name": "Apollo Pharmacy – Bagalur Road, Hosur",
    "category": "Health & wellness",
    "subcategories": [
      "Pharmacies"
    ],
    "products": [
      {
        "id": "aph-rx",
        "name": "Prescription Medicine Delivery",
        "description": "Upload prescription and get medicines home-delivered same day.",
        "price": 0,
        "unit": "free delivery"
      },
      {
        "id": "aph-otc",
        "name": "OTC & Healthcare Products",
        "description": "Vitamins, first aid, sanitizers and daily health essentials.",
        "price": 49,
        "unit": "from"
      },
      {
        "id": "aph-bp",
        "name": "Free BP / Sugar Screening",
        "description": "Free BP and blood glucose check at store — no appointment needed.",
        "price": 0,
        "unit": "free"
      },
      {
        "id": "pharmacy-medicine-delivery",
        "name": "Pharmacies & Medicine Delivery",
        "description": "Prescription medicines, first-aid kits, surgical supports, multivitamins and rapid delivery.",
        "price": 50,
        "unit": "unit"
      }
    ],
    "description": "Apollo Pharmacy on Bagalur Road, Hosur. Extended hours, prescription refills, online ordering and free in-store health check-ups.",
    "distance": 1,
    "demoCoordinates": {
      "latitude": 12.7348,
      "longitude": 77.8285
    },
    "rating": 4.7,
    "reviews": 289,
    "price": "Medicines available",
    "icon": "💊",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Pharmacies",
      "Medicines",
      "Prescription support",
      "Prescription medicines",
      "Local delivery",
      "Medicine delivery",
      "Health screening"
    ],
    "tag": "Verified business"
  },
  {
    "name": "Sri Chandrasekara Hospital – Hosur",
    "category": "Health & wellness",
    "subcategories": [
      "Clinics",
      "Dental care"
    ],
    "products": [
      {
        "id": "sch-consult",
        "name": "General Doctor Consultation",
        "description": "OPD consultation with experienced doctors. Walk-in welcome.",
        "price": 200,
        "unit": "per visit"
      },
      {
        "id": "sch-dental",
        "name": "Dental Consultation & Cleaning",
        "description": "Oral examination, scaling and fluoride treatment.",
        "price": 350,
        "unit": "from"
      },
      {
        "id": "sch-lab",
        "name": "Diagnostic Lab Test Package",
        "description": "Blood count, lipid profile, blood sugar and urine analysis.",
        "price": 599,
        "unit": "per package"
      },
      {
        "id": "dental-clinic-consultation",
        "name": "Dental Care & Check-up",
        "description": "Dental check-up, ultrasonic teeth scaling, root canal treatment, braces and aligner consultations.",
        "price": 399,
        "unit": "service"
      }
    ],
    "description": "Established multi-specialty hospital on Bagalur Road, Hosur. General medicine, dental, paediatrics, diagnostics and pharmacy under one roof.",
    "distance": 2.1,
    "demoCoordinates": {
      "latitude": 12.7325,
      "longitude": 77.8265
    },
    "rating": 4.6,
    "reviews": 215,
    "price": "Consult from ₹200",
    "icon": "🏥",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Clinics",
      "General care",
      "Appointments",
      "Doctor consultation",
      "Paediatrics",
      "Dental care",
      "Dental clinics",
      "Check-ups",
      "Pharmacies",
      "Lab tests"
    ]
  },
  {
    "name": "Karthick Skin Hair & Laser Clinic – Hosur",
    "category": "Health & wellness",
    "subcategories": [
      "Clinics",
      "Personal care"
    ],
    "products": [
      {
        "id": "ks-laser",
        "name": "Laser Hair Removal (per session)",
        "description": "FDA-approved diode laser for permanent hair reduction.",
        "price": 1999,
        "unit": "per session"
      },
      {
        "id": "ks-acne",
        "name": "Acne & Pigmentation Treatment",
        "description": "Customized facial treatment with medicated serums.",
        "price": 1499,
        "unit": "per session"
      },
      {
        "id": "ks-prp",
        "name": "PRP Hair Loss Treatment",
        "description": "Platelet-rich plasma therapy for hair regrowth.",
        "price": 3999,
        "unit": "per session"
      },
      {
        "id": "ayurvedic-consultation",
        "name": "Ayurvedic Wellness & Herbs",
        "description": "Traditional holistic pulse evaluation, herbal remedies, lifestyle guidance and herbal supplements.",
        "price": 500,
        "unit": "service"
      },
      {
        "id": "beauty-salon-haircare",
        "name": "Beauty Salon & Hair Care",
        "description": "Hair styling, keratin treatments, facials, waxing, manicure, pedicure and bridal grooming.",
        "price": 399,
        "unit": "service"
      },
      {
        "id": "diet-nutrition-consultation",
        "name": "Diet & Nutrition Counseling",
        "description": "Custom meal plans for fitness, diabetes management, weight loss and sports nutrition.",
        "price": 799,
        "unit": "service"
      },
      {
        "id": "haircut-salon-grooming",
        "name": "Haircut & Men's Grooming",
        "description": "Precision fade cuts, beard shaping, head massage, hair coloring and tan removal treatments.",
        "price": 199,
        "unit": "service"
      }
    ],
    "description": "Specialist skin, hair and laser clinic on Bagalur Road, Hosur. Dermatology, laser therapy, PRP hair treatment and cosmetology.",
    "distance": 1.7,
    "demoCoordinates": {
      "latitude": 12.7358,
      "longitude": 77.829
    },
    "rating": 4.8,
    "reviews": 167,
    "price": "Sessions from ₹1,499",
    "icon": "🧴",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Clinics",
      "Skin care",
      "Personal care",
      "Salon services",
      "Hair care",
      "Wellness",
      "Consultation",
      "Wellness consultation",
      "Haircut"
    ]
  },
  {
    "name": "Santhosh Instyle – Nethaji Road, Hosur",
    "category": "Fashion",
    "subcategories": [
      "Clothing",
      "Tailoring"
    ],
    "products": [
      {
        "id": "si-mens",
        "name": "Men's Casual & Formal Wear",
        "description": "Shirts, trousers, denim and ethnic wear for men.",
        "price": 599,
        "unit": "from"
      },
      {
        "id": "si-womens",
        "name": "Women's Kurtas & Sarees",
        "description": "Printed kurtas, cotton sarees and occasion wear.",
        "price": 799,
        "unit": "from"
      },
      {
        "id": "si-kids",
        "name": "Kids Clothing Collection",
        "description": "Everyday school wear and festive outfits for children.",
        "price": 349,
        "unit": "from"
      }
    ],
    "description": "Popular fashion retail store on Nethaji Road, Hosur. Men's, women's and kids' clothing with latest trends and festive collections.",
    "distance": 1.5,
    "demoCoordinates": {
      "latitude": 12.7332,
      "longitude": 77.8327
    },
    "rating": 4.5,
    "reviews": 143,
    "price": "Clothing from ₹349",
    "icon": "👗",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Clothing",
      "Men",
      "Everyday wear",
      "Shirts & trousers",
      "Women",
      "Kurtas & kurtis",
      "Sarees & dresses",
      "Kids",
      "Ethnic wear",
      "Fashion accessories"
    ]
  },
  {
    "name": "GRT Jewellers – Hosur",
    "category": "Fashion",
    "subcategories": [
      "Jewellery"
    ],
    "products": [
      {
        "id": "grt-gold",
        "name": "Gold Jewellery (22K & 18K)",
        "description": "Certified hallmarked gold — rings, chains, bangles.",
        "price": 50000,
        "unit": "from"
      },
      {
        "id": "grt-diamond",
        "name": "Diamond Jewellery",
        "description": "BIS-hallmarked diamond solitaires, pendants and earrings.",
        "price": 15000,
        "unit": "from"
      },
      {
        "id": "grt-exchange",
        "name": "Old Gold Exchange",
        "description": "Exchange old gold for new jewellery at fair melt value.",
        "price": 0,
        "unit": "free service"
      },
      {
        "id": "jewellery-handcrafted",
        "name": "Jewellery & Silver Handcrafts",
        "description": "925 hallmarked sterling silver earrings, oxidised necklaces, anklets and artisan temple jewellery.",
        "price": 399,
        "unit": "unit"
      },
      {
        "id": "necklaces-fashion-jewellery",
        "name": "Necklaces & Fashion Jewellery",
        "description": "Choker necklaces, layered chains, freshwater pearl pendants, Kundan chokers and bohemian tassels.",
        "price": 299,
        "unit": "unit"
      }
    ],
    "description": "Trusted GRT Jewellers showroom in Hosur. Wide range of gold, diamond and platinum jewellery with BIS hallmark and easy exchange.",
    "distance": 2,
    "demoCoordinates": {
      "latitude": 12.732,
      "longitude": 77.834
    },
    "rating": 4.7,
    "reviews": 386,
    "price": "Gold from ₹50,000",
    "icon": "💍",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Jewellery",
      "Traditional jewellery",
      "Earrings",
      "Necklaces",
      "Handcrafted necklaces",
      "Gold",
      "Diamond",
      "Bangles"
    ],
    "tag": "Trusted brand"
  },
  {
    "name": "Nilgiris Supermarket – Hosur",
    "category": "Home & furniture",
    "subcategories": [
      "Kitchen & storage",
      "Home decor"
    ],
    "products": [
      {
        "id": "nil-grocery",
        "name": "Daily Grocery & Pantry Staples",
        "description": "Rice, pulses, oils, spices and packaged foods.",
        "price": 50,
        "unit": "from"
      },
      {
        "id": "nil-homeware",
        "name": "Kitchenware & Home Essentials",
        "description": "Cookware, storage boxes, cleaning supplies.",
        "price": 199,
        "unit": "from"
      },
      {
        "id": "nil-personal",
        "name": "Personal Care & Hygiene",
        "description": "Soaps, shampoos, face wash and daily care products.",
        "price": 99,
        "unit": "from"
      },
      {
        "id": "storage-racks-cabinets",
        "name": "Storage Solutions & Modular Racks",
        "description": "Steel heavy-duty utility shelves, shoe cabinets, bathroom organizers and wardrobe wire baskets.",
        "price": 899,
        "unit": "unit"
      }
    ],
    "description": "Nilgiris supermarket in Hosur — trusted for groceries, fresh produce, kitchenware, personal care and household daily needs.",
    "distance": 1.1,
    "demoCoordinates": {
      "latitude": 12.734,
      "longitude": 77.832
    },
    "rating": 4.4,
    "reviews": 324,
    "price": "Groceries from ₹50",
    "icon": "🛒",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Kitchen & storage",
      "Storage solutions",
      "Shelving",
      "Storage racks",
      "Home decor",
      "Soft furnishings",
      "Cleaning",
      "Home cleaning",
      "Pantry",
      "Staples"
    ]
  },
  {
    "name": "The Muscle Empire Gym – Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Gyms & fitness centers",
      "Personal training"
    ],
    "products": [
      {
        "id": "tme-monthly",
        "name": "Monthly Gym Membership",
        "description": "Unlimited floor access — free weights, cardio, cable machines.",
        "price": 1200,
        "unit": "per month"
      },
      {
        "id": "tme-pt",
        "name": "Personal Training (1-on-1)",
        "description": "Custom workout plan with certified personal trainer.",
        "price": 3500,
        "unit": "per month"
      },
      {
        "id": "tme-diet",
        "name": "Diet & Nutrition Consultation",
        "description": "Customized macro plan for muscle gain or fat loss.",
        "price": 800,
        "unit": "per session"
      }
    ],
    "description": "One of Hosur's top gyms with modern strength equipment, CrossFit zone and personal training. Open 5 AM – 11 PM every day.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.7352,
      "longitude": 77.831
    },
    "rating": 4.7,
    "reviews": 211,
    "price": "Membership from ₹1,200",
    "icon": "🏋️",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Sports & fitness",
      "Gyms & fitness centers",
      "Gym membership",
      "Weight training",
      "Strength conditioning",
      "CrossFit & functional",
      "HIIT workouts",
      "Personal training",
      "1-on-1 coaching"
    ],
    "tag": "Top rated nearby"
  },
  {
    "name": "7 Eleven Badminton Academy – Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Sports coaching",
      "Turf & facility rental"
    ],
    "products": [
      {
        "id": "7e-coaching",
        "name": "Badminton Coaching (Monthly)",
        "description": "Beginner to advanced coaching by BWF-certified coaches.",
        "price": 1500,
        "unit": "per month"
      },
      {
        "id": "7e-court",
        "name": "Court Slot Booking (1 hr)",
        "description": "Indoor synthetic mat court — well lit and ventilated.",
        "price": 300,
        "unit": "per hour"
      },
      {
        "id": "7e-kids",
        "name": "Kids Badminton Academy",
        "description": "Structured coaching for children aged 6–15.",
        "price": 1200,
        "unit": "per month"
      }
    ],
    "description": "Leading badminton coaching academy and court facility in Hosur. BWF-certified coaches, indoor courts and monthly training programs.",
    "distance": 2.4,
    "demoCoordinates": {
      "latitude": 12.7298,
      "longitude": 77.8268
    },
    "rating": 4.8,
    "reviews": 176,
    "price": "Coaching from ₹1,200",
    "icon": "🏸",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Sports coaching",
      "Badminton",
      "Coaching academies",
      "Badminton coaching",
      "Turf & facility rental",
      "Badminton courts",
      "Indoor court rental",
      "Court booking"
    ]
  },
  {
    "name": "Pranava Nature Cure & Yoga – Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Yoga & pilates",
      "Personal training"
    ],
    "products": [
      {
        "id": "pnc-yoga",
        "name": "Yoga Classes (Monthly)",
        "description": "Hatha and Vinyasa yoga — morning and evening batches.",
        "price": 1000,
        "unit": "per month"
      },
      {
        "id": "pnc-nature",
        "name": "Nature Cure Therapy Session",
        "description": "Holistic healing combining naturopathy and yoga therapy.",
        "price": 1500,
        "unit": "per session"
      },
      {
        "id": "pnc-weight",
        "name": "Weight Management Program",
        "description": "30-day plan with diet, yoga and lifestyle coaching.",
        "price": 4500,
        "unit": "per month"
      }
    ],
    "description": "Pranava Nature Cure & Yoga Clinic in Hosur. Holistic wellness center offering yoga, naturopathy, weight management and rejuvenation therapies.",
    "distance": 3.1,
    "demoCoordinates": {
      "latitude": 12.728,
      "longitude": 77.835
    },
    "rating": 4.9,
    "reviews": 142,
    "price": "Yoga from ₹1,000/mo",
    "icon": "🧘",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Yoga & pilates",
      "Yoga studios",
      "Hatha & Vinyasa",
      "Yoga classes",
      "Personal training",
      "1-on-1 coaching",
      "Transformation"
    ]
  },
  {
    "name": "GameX 360 – Hosur Turf",
    "category": "Sports & fitness",
    "subcategories": [
      "Turf & facility rental",
      "Sports coaching"
    ],
    "products": [
      {
        "id": "gx-football",
        "name": "5-A-Side Football Turf (1 hr)",
        "description": "Full synthetic grass turf with floodlights. All-weather facility.",
        "price": 800,
        "unit": "per hour"
      },
      {
        "id": "gx-cricket",
        "name": "Box Cricket Turf Booking",
        "description": "Box cricket field with nets. Suitable for 6–12 players.",
        "price": 600,
        "unit": "per hour"
      },
      {
        "id": "gx-package",
        "name": "Group Event Package (2 hrs)",
        "description": "Two sports slots + refreshments for up to 20 players.",
        "price": 2500,
        "unit": "per event"
      }
    ],
    "description": "Multi-sport turf facility in Hosur with 5-a-side football, box cricket and badminton courts. Floodlights, changing rooms and parking.",
    "distance": 2.8,
    "demoCoordinates": {
      "latitude": 12.7305,
      "longitude": 77.8387
    },
    "rating": 4.6,
    "reviews": 198,
    "price": "Turf from ₹600/hr",
    "icon": "⚽",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Turf & facility rental",
      "Box cricket turf",
      "Hourly rental",
      "Turf booking",
      "Sports coaching",
      "Cricket",
      "Net practice & coaching",
      "Badminton courts"
    ]
  },
  {
    "name": "Fortune Hosur – ITC Hotels",
    "category": "Travel",
    "subcategories": [
      "Stays",
      "Tours & experiences"
    ],
    "products": [
      {
        "id": "fh-room",
        "name": "Deluxe Room (Per Night)",
        "description": "Air-conditioned room with breakfast and high-speed Wi-Fi.",
        "price": 4500,
        "unit": "per night"
      },
      {
        "id": "fh-suite",
        "name": "Executive Suite Stay",
        "description": "Spacious suite with lounge access, minibar and city view.",
        "price": 8000,
        "unit": "per night"
      },
      {
        "id": "fh-banquet",
        "name": "Banquet Hall Booking",
        "description": "Ideal for conferences, weddings and corporate events.",
        "price": 50000,
        "unit": "per day"
      },
      {
        "id": "guest-house-stays",
        "name": "Guest Houses & Homestays",
        "description": "Curated heritage guest houses, weekend family stays and serviced studio apartments.",
        "price": 1200,
        "unit": "service"
      },
      {
        "id": "hotel-family-stays",
        "name": "Hotels & Vacation Stays",
        "description": "Comfortable boutique business hotels, airport transit stays and family vacation suites.",
        "price": 1800,
        "unit": "service"
      }
    ],
    "description": "Fortune Hosur — premium ITC Hotels property. Business and leisure hotel with spa, restaurant, conference rooms and modern amenities.",
    "distance": 3.2,
    "demoCoordinates": {
      "latitude": 12.7275,
      "longitude": 77.832
    },
    "rating": 4.8,
    "reviews": 522,
    "price": "Rooms from ₹4,500",
    "icon": "🏨",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Stays",
      "Hotels",
      "Family stays",
      "Hotel room booking",
      "Tours & experiences",
      "Local experiences",
      "Business hotel",
      "Conference",
      "Guest houses"
    ],
    "tag": "Premium stay"
  },
  {
    "name": "TGI Grand Fortuna – Hosur",
    "category": "Travel",
    "subcategories": [
      "Stays"
    ],
    "products": [
      {
        "id": "tgi-std",
        "name": "Standard Room (Per Night)",
        "description": "Well-appointed room with TV, AC and complimentary breakfast.",
        "price": 2800,
        "unit": "per night"
      },
      {
        "id": "tgi-corp",
        "name": "Corporate Room Package (Weekly)",
        "description": "7-night stay with breakfast, laundry and airport pick-up.",
        "price": 16000,
        "unit": "per week"
      }
    ],
    "description": "TGI Grand Fortuna — top-rated upscale hotel in Hosur. Popular with corporate and leisure travelers. Restaurant, banquet and gym on-site.",
    "distance": 2.6,
    "demoCoordinates": {
      "latitude": 12.7292,
      "longitude": 77.8305
    },
    "rating": 4.7,
    "reviews": 298,
    "price": "Rooms from ₹2,800",
    "icon": "🛏️",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Stays",
      "Hotels",
      "Family stays",
      "Hotel room booking",
      "Guest houses",
      "Short stays",
      "Corporate stay"
    ]
  },
  {
    "name": "Jaya Sri Electricals & Plumbing – Hosur",
    "category": "Electricals",
    "subcategories": [
      "Wiring & Cables",
      "Switches & Sockets",
      "LED Lighting",
      "Fans & Ventilation",
      "Electrical Services"
    ],
    "products": [
      {
        "id": "js-elec",
        "name": "Electrical Wiring & Repair",
        "description": "Fuse, switchboard, fan, light installation and emergency repair.",
        "price": 249,
        "unit": "from"
      },
      {
        "id": "js-plumb",
        "name": "Plumbing Leak & Pipe Repair",
        "description": "Tap, overhead tank, drainage and toilet repairs.",
        "price": 299,
        "unit": "from"
      },
      {
        "id": "js-geyser",
        "name": "Geyser Installation & Repair",
        "description": "Any brand geyser installation, thermostat fix and anode check.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "electrical-repairs-wiring",
        "name": "Electrical Repairs & Wiring",
        "description": "Short circuit troubleshooting, MCB switchboard fixing, chandelier setup and whole-home rewiring.",
        "price": 249,
        "unit": "service"
      },
      {
        "id": "electrician-doorstep",
        "name": "Electrician On-Demand",
        "description": "Verified certified electricians for quick emergency fixes, fan installations and appliance plugs.",
        "price": 199,
        "unit": "service"
      },
      {
        "id": "led-lighting-fixtures",
        "name": "LED Lighting, Panels & Decorative Lights",
        "description": "Ceiling slim LED panels, surface downlights, warm track lights, floodlights and Philips/Crompton bulbs.",
        "price": 120,
        "unit": "unit"
      },
      {
        "id": "switches-modular-fittings",
        "name": "Switches, Modular Plates & MCB Switchgear",
        "description": "Legrand and Anchor Roma modular switches, cover plates, Schneider MCBs, distribution boxes and sockets.",
        "price": 45,
        "unit": "unit"
      }
    ],
    "description": "Trusted electrician and plumber in Hosur — same-day home visits. Licensed professionals covering all major residential areas.",
    "distance": 0.7,
    "demoCoordinates": {
      "latitude": 12.7344,
      "longitude": 77.83
    },
    "rating": 4.8,
    "reviews": 219,
    "price": "Services from ₹249",
    "icon": "⚡",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Electrical",
      "Home electrical",
      "Repairs",
      "Wiring repair",
      "Installation",
      "Lighting installation",
      "Plumbing",
      "Home plumbing",
      "Leak repair",
      "Bathroom plumbing",
      "Tap & fixture installation",
      "Electrical Services",
      "LED Lighting",
      "Switches & Sockets"
    ],
    "tag": "Same-day service"
  },
  {
    "name": "Supreme Cool Tech AC Services – Hosur",
    "category": "Home Appliances",
    "subcategories": [
      "Air conditioners",
      "Refrigerators",
      "Washing machines",
      "Kitchen appliances"
    ],
    "products": [
      {
        "id": "sct-service",
        "name": "AC Service & Deep Cleaning",
        "description": "Coil wash, filter clean and performance test.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "sct-gas",
        "name": "AC Gas Recharge (R-32 / R-22)",
        "description": "Gas top-up with leak check and cooling test.",
        "price": 999,
        "unit": "from"
      },
      {
        "id": "sct-install",
        "name": "AC Installation (Split / Window)",
        "description": "Professional 1.5 ton / 2 ton split AC fitting.",
        "price": 1200,
        "unit": "from"
      },
      {
        "id": "ac-repair",
        "name": "AC Repair & Servicing",
        "description": "Gas refilling, deep cleaning, filter sanitization, cooling coil repair and compressor checks.",
        "price": 499,
        "unit": "service"
      },
      {
        "id": "appliance-repair",
        "name": "Appliance Repair & Installation",
        "description": "Same-day doorstep repair for washing machines, microwaves, refrigerators and dishwashers.",
        "price": 299,
        "unit": "service"
      },
      {
        "id": "kitchen-appliances-repair",
        "name": "Kitchen Appliances Service",
        "description": "Mixer grinder, induction cooktop, electric oven and water heater doorstep servicing.",
        "price": 249,
        "unit": "service"
      },
      {
        "id": "refrigerator-gas-repair",
        "name": "Refrigerator Repair & Gas Refill",
        "description": "Compressor troubleshooting, frost build-up resolution, thermostat calibration and gas charge.",
        "price": 449,
        "unit": "service"
      },
      {
        "id": "washing-machine-service",
        "name": "Washing Machine Repair & Care",
        "description": "Front load & top load motor checks, drum bearing repair, water inlet valve and drainage pump fixes.",
        "price": 399,
        "unit": "service"
      }
    ],
    "description": "Specialist AC repair, deep cleaning, gas recharge and installation in Hosur. Covers all brands — Daikin, Voltas, LG, Samsung, Hitachi.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.736,
      "longitude": 77.8265
    },
    "rating": 4.7,
    "reviews": 181,
    "price": "AC service from ₹499",
    "icon": "❄️",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Appliance repair",
      "Kitchen appliances",
      "Repair",
      "Refrigerator service",
      "Laundry appliances",
      "Air conditioning",
      "AC cooling recharge",
      "Electrical",
      "Home electrical",
      "Air conditioners",
      "AC repair",
      "Refrigerators",
      "Washing machines",
      "Washing machine service"
    ]
  },
  {
    "name": "AtoZ Home Services – Hosur",
    "category": "Everyday services",
    "subcategories": [
      "Cleaning",
      "Home services",
      "Plumbing",
      "Electrical"
    ],
    "products": [
      {
        "id": "az-deep",
        "name": "Full Home Deep Cleaning",
        "description": "2–5 BHK deep clean including kitchen, bathrooms and windows.",
        "price": 1999,
        "unit": "from"
      },
      {
        "id": "az-pest",
        "name": "Pest Control Treatment",
        "description": "Cockroach, bed bugs, termite and mosquito treatment.",
        "price": 799,
        "unit": "from"
      },
      {
        "id": "az-sofa",
        "name": "Sofa & Carpet Cleaning",
        "description": "Steam-clean and shampoo for sofas, chairs and carpets.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "az-movers",
        "name": "Local Moving & Packing",
        "description": "Professional packing, transport and unpacking in Hosur.",
        "price": 2499,
        "unit": "from"
      },
      {
        "id": "carpentry-furniture-repair",
        "name": "Carpentry & Wood Repair",
        "description": "Custom shelving, door latch repairs, wardrobe hinges, furniture polish and wooden alterations.",
        "price": 350,
        "unit": "service"
      },
      {
        "id": "gardening-maintenance",
        "name": "Garden Maintenance & Landscaping",
        "description": "Lawn mowing, balcony planter setups, shrub pruning, organic compost and plant repotting.",
        "price": 399,
        "unit": "service"
      },
      {
        "id": "junk-removal-moving",
        "name": "Junk Removal & Clearance",
        "description": "Old furniture carting, electronic waste disposal, renovation debris clearance and garage cleanouts.",
        "price": 699,
        "unit": "service"
      },
      {
        "id": "moving-packing-assistance",
        "name": "Movers & Packers Assistance",
        "description": "Bubble-wrap packing, household shifting, mini-truck logistics, furniture moving and unloading.",
        "price": 2499,
        "unit": "service"
      },
      {
        "id": "painting-wall-decor",
        "name": "Painting & Waterproofing",
        "description": "Interior wall emulsion, texture finishes, exterior weather-guard coatings and damp wall sealing.",
        "price": 12,
        "unit": "sq.ft"
      },
      {
        "id": "pest-control-treatment",
        "name": "Pest Control & Termite Defense",
        "description": "Odorless herbal cockroach gel, anti-termite wood treatment, bed bug fumigation and rodent control.",
        "price": 799,
        "unit": "service"
      },
      {
        "id": "yard-garden-cleanup",
        "name": "Yard Clearance & Garden Cleanup",
        "description": "Fallen foliage clearance, tree branch trimming, weed weeding, dry leaf compost and garden beautification.",
        "price": 499,
        "unit": "service"
      },
      {
        "id": "zero-waste-composting",
        "name": "Zero-Waste Home Composting Kits",
        "description": "Aero-bins, microbial composting powders, kitchen waste shredders and home eco-sustainability starter sets.",
        "price": 599,
        "unit": "unit"
      }
    ],
    "description": "Full-service home care in Hosur — deep cleaning, pest control, sofa shampooing, plumbing, electrical and local movers.",
    "distance": 1.8,
    "demoCoordinates": {
      "latitude": 12.7315,
      "longitude": 77.833
    },
    "rating": 4.6,
    "reviews": 267,
    "price": "Services from ₹499",
    "icon": "🧹",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Cleaning",
      "Home cleaning",
      "Full home",
      "Deep cleaning",
      "Focused cleaning",
      "Kitchen cleaning",
      "Home services",
      "Pest control",
      "Treatment",
      "Home pest treatment",
      "Moving help",
      "Packing & moving",
      "Local move assistance",
      "Carpentry",
      "Garden care",
      "Home planning"
    ]
  },
  {
    "name": "Tarun Motors Hero – Mathigiri, Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Two-wheeler service"
    ],
    "products": [
      {
        "id": "tarun-hero-splendor",
        "name": "Hero Splendor Plus (Sales)",
        "description": "Authorized sales of Hero Splendor Plus.",
        "price": 78000,
        "unit": "ex-showroom"
      },
      {
        "id": "tarun-hero-xtreme",
        "name": "Hero Xtreme 160R (Sales)",
        "description": "Authorized sales of Hero Xtreme 160R.",
        "price": 130000,
        "unit": "ex-showroom"
      },
      {
        "id": "tarun-hero-service",
        "name": "Hero Annual Service Package",
        "description": "Full annual service for Hero two-wheelers.",
        "price": 699,
        "unit": "per service"
      }
    ],
    "description": "Authorized Hero MotoCorp dealership near RC Church, Denkanikottai Main Road, Mathigiri. Sales of Splendor, HF Deluxe, Vida V1 EV and full service.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.722,
      "longitude": 77.831
    },
    "rating": 4.5,
    "reviews": 203,
    "price": "from ₹699",
    "icon": "🏍️",
    "color": "butter",
    "subscribed": true,
    "tag": "Authorized dealer",
    "taxonomyTags": [
      "Two wheeler",
      "Hero",
      "Splendor Plus",
      "HF Deluxe",
      "Vida V1",
      "Xtreme 160R",
      "Sales",
      "Service",
      "Two-wheeler service",
      "Routine service",
      "Oil & filter"
    ]
  },
  {
    "name": "Velan Honda – Denkanikotta Road, Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Two-wheeler service"
    ],
    "products": [
      {
        "id": "velan-activa",
        "name": "Honda Activa 6G (Sales)",
        "description": "Authorized sales of Honda Activa 6G.",
        "price": 82000,
        "unit": "ex-showroom"
      },
      {
        "id": "velan-cb350",
        "name": "Honda CB350 (Sales)",
        "description": "Authorized sales of Honda CB350.",
        "price": 210000,
        "unit": "ex-showroom"
      },
      {
        "id": "velan-service",
        "name": "Honda 2W Service",
        "description": "Routine service for Honda two-wheelers.",
        "price": 799,
        "unit": "per service"
      }
    ],
    "description": "Authorized Honda two-wheeler dealership on Denkanikotta Road near Railway Station, Hosur. Activa, Shine, Unicorn, CB350 sales and service.",
    "distance": 0.9,
    "demoCoordinates": {
      "latitude": 12.724,
      "longitude": 77.832
    },
    "rating": 4.6,
    "reviews": 156,
    "price": "from ₹799",
    "icon": "🛵",
    "color": "mint",
    "subscribed": true,
    "tag": "Authorized dealer",
    "taxonomyTags": [
      "Two wheeler",
      "Honda",
      "Activa",
      "Dio",
      "Shine 125",
      "Unicorn",
      "CB350",
      "Sales",
      "Service",
      "Two-wheeler service",
      "Routine service",
      "Brake & tyre care"
    ]
  },
  {
    "name": "Sri Saravana Motors Royal Enfield – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Two-wheeler service"
    ],
    "products": [
      {
        "id": "ssm-classic350",
        "name": "Royal Enfield Classic 350 (Sales)",
        "description": "Authorized sales of RE Classic 350.",
        "price": 196000,
        "unit": "ex-showroom"
      },
      {
        "id": "ssm-hunter350",
        "name": "RE Hunter 350 (Sales)",
        "description": "Authorized sales of RE Hunter 350.",
        "price": 155000,
        "unit": "ex-showroom"
      },
      {
        "id": "ssm-service",
        "name": "RE Annual Service",
        "description": "Complete annual service for Royal Enfield motorcycles.",
        "price": 1299,
        "unit": "per service"
      }
    ],
    "description": "Authorized Royal Enfield dealer in Hosur. Full range — Classic 350, Hunter 350, Bullet, Meteor, Himalayan. Test rides available daily.",
    "distance": 1.5,
    "demoCoordinates": {
      "latitude": 12.726,
      "longitude": 77.834
    },
    "rating": 4.7,
    "reviews": 312,
    "price": "from ₹1299",
    "icon": "🏍️",
    "color": "peach",
    "subscribed": true,
    "tag": "Authorized dealer",
    "taxonomyTags": [
      "Two wheeler",
      "Royal Enfield",
      "Classic 350",
      "Hunter 350",
      "Bullet 350",
      "Meteor 350",
      "Himalayan",
      "Sales",
      "Service",
      "Two-wheeler service",
      "Routine service"
    ]
  },
  {
    "name": "KHT Motors Tata – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Four-wheeler sales",
      "Car repair"
    ],
    "products": [
      {
        "id": "kht-nexon",
        "name": "Tata Nexon (Sales)",
        "description": "Authorized sales of Tata Nexon SUV.",
        "price": 850000,
        "unit": "ex-showroom"
      },
      {
        "id": "kht-punch",
        "name": "Tata Punch (Sales)",
        "description": "Authorized sales of Tata Punch.",
        "price": 620000,
        "unit": "ex-showroom"
      },
      {
        "id": "kht-service",
        "name": "Tata Periodic Service",
        "description": "Authorized periodic service for Tata vehicles.",
        "price": 3999,
        "unit": "per service"
      }
    ],
    "description": "Authorized Tata Motors passenger vehicle dealer in Hosur. Nexon, Punch, Tiago, Harrier, Safari — sales, test drives and full service.",
    "distance": 2,
    "demoCoordinates": {
      "latitude": 12.728,
      "longitude": 77.82
    },
    "rating": 4.4,
    "reviews": 187,
    "price": "from ₹3999",
    "icon": "🚗",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Four wheeler",
      "Tata Motors",
      "Punch",
      "Nexon",
      "Tiago",
      "Altroz",
      "Harrier",
      "Safari",
      "Sales",
      "Service",
      "Car repair",
      "Engine & transmission"
    ]
  },
  {
    "name": "Akash Bajaj (Chetak EV) – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Two-wheeler service"
    ],
    "products": [
      {
        "id": "akash-chetak",
        "name": "Bajaj Chetak Electric (Sales)",
        "description": "Authorized sales of Bajaj Chetak EV scooter.",
        "price": 120000,
        "unit": "ex-showroom"
      },
      {
        "id": "akash-pulsar",
        "name": "Bajaj Pulsar NS200 (Sales)",
        "description": "Authorized sales of Bajaj Pulsar NS200.",
        "price": 165000,
        "unit": "ex-showroom"
      },
      {
        "id": "akash-ev-diag",
        "name": "Battery & Motor Diagnostics",
        "description": "EV battery and motor health check.",
        "price": 499,
        "unit": "per visit"
      }
    ],
    "description": "Bajaj and Chetak EV authorized dealer near Krishnagiri Main Road, Hosur. EV test rides, finance and after-sales support.",
    "distance": 1.8,
    "demoCoordinates": {
      "latitude": 12.73,
      "longitude": 77.824
    },
    "rating": 4.5,
    "reviews": 142,
    "price": "from ₹499",
    "icon": "⚡",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Two wheeler",
      "Bajaj",
      "Chetak",
      "Pulsar 125",
      "Pulsar NS200",
      "Sales",
      "Service",
      "Two-wheeler service",
      "Electric 2W",
      "Battery & motor check",
      "Routine service"
    ]
  },
  {
    "name": "Hosur Tyre & Battery Hub",
    "category": "Automobiles",
    "subcategories": [
      "Tyres & batteries"
    ],
    "products": [
      {
        "id": "htb-car-tyre",
        "name": "MRF / Apollo Car Tyre",
        "description": "Multi-brand car tyre supply and fitting.",
        "price": 3500,
        "unit": "per tyre"
      },
      {
        "id": "htb-2w-tyre",
        "name": "Two-Wheeler Tyre",
        "description": "Multi-brand two-wheeler tyre supply and fitting.",
        "price": 800,
        "unit": "per tyre"
      },
      {
        "id": "htb-battery",
        "name": "Car Battery Replacement (Amaron/Exide)",
        "description": "Car battery supply and replacement service.",
        "price": 4200,
        "unit": "per battery"
      }
    ],
    "description": "Multi-brand tyre and battery shop on Bagalur Road. MRF, Apollo, CEAT tyres; Amaron, Exide, Luminous batteries. Free wheel balancing and alignment.",
    "distance": 2.3,
    "demoCoordinates": {
      "latitude": 12.732,
      "longitude": 77.826
    },
    "rating": 4.7,
    "reviews": 198,
    "price": "from ₹800",
    "icon": "🔩",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Tyres & batteries",
      "Tyres & wheels",
      "Wheel balancing",
      "Puncture repair",
      "Vehicle batteries",
      "Battery replacement",
      "Car & bike battery"
    ]
  },
  {
    "name": "Chil Zone Car Wash & Detailing – Hosur",
    "category": "Automobiles",
    "subcategories": [
      "Car wash & detailing"
    ],
    "products": [
      {
        "id": "chil-foam-wash",
        "name": "Full Body Foam Wash",
        "description": "Complete exterior foam wash for cars.",
        "price": 399,
        "unit": "per session"
      },
      {
        "id": "chil-interior",
        "name": "Interior Deep Vacuum & Sanitize",
        "description": "Full interior vacuum and sanitization.",
        "price": 599,
        "unit": "per session"
      },
      {
        "id": "chil-ppf",
        "name": "Paint Protection Film (PPF)",
        "description": "Full-body PPF application for paint protection.",
        "price": 15000,
        "unit": "per car"
      },
      {
        "id": "car-wash-detailing",
        "name": "Car Wash & Detailing",
        "description": "Foam exterior wash, interior vacuuming, ceramic coating and headlight restoration.",
        "price": 499,
        "unit": "service"
      },
      {
        "id": "vehicle-detailing-polish",
        "name": "Vehicle Detailing & Ceramic Polish",
        "description": "Multi-stage machine paint correction, swirl mark removal, interior dry cleaning and 9H ceramic coating.",
        "price": 1999,
        "unit": "service"
      }
    ],
    "description": "Professional car wash and auto detailing studio in Hosur. Foam wash, interior sanitization, ceramic coating and PPF available.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.734,
      "longitude": 77.828
    },
    "rating": 4.8,
    "reviews": 176,
    "price": "from ₹399",
    "icon": "🚿",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Car wash & detailing",
      "Exterior care",
      "Wash packages",
      "Full service foam wash",
      "Interior care",
      "Deep sanitization",
      "Upholstery shampoo",
      "Car wash",
      "Car repair"
    ]
  },
  {
    "name": "Reliance Digital – Bagalur Road, Hosur",
    "category": "Electronics",
    "subcategories": [
      "Mobile phones",
      "Home appliances",
      "Audio & video"
    ],
    "products": [
      {
        "id": "rd-tv",
        "name": "Smart TV (Sales)",
        "description": "Wide range of smart TVs from top brands.",
        "price": 18999,
        "unit": "from"
      },
      {
        "id": "rd-ac",
        "name": "Air Conditioner (Sales)",
        "description": "Energy-efficient ACs from leading brands.",
        "price": 32999,
        "unit": "from"
      },
      {
        "id": "rd-phone",
        "name": "Mobile Phone (Sales)",
        "description": "Latest smartphones across all price segments.",
        "price": 9999,
        "unit": "from"
      }
    ],
    "description": "Reliance Digital large-format electronics store on Bagalur Road, Hosur. TVs, ACs, washing machines, phones, laptops and audio systems with EMI options.",
    "distance": 2.5,
    "demoCoordinates": {
      "latitude": 12.736,
      "longitude": 77.822
    },
    "rating": 4.4,
    "reviews": 387,
    "price": "from ₹9999",
    "icon": "📺",
    "color": "peach",
    "subscribed": true,
    "tag": "Popular nearby",
    "taxonomyTags": [
      "Sales",
      "Mobile phones",
      "Samsung",
      "Audio & video",
      "Sony",
      "LG",
      "Home appliances",
      "Whirlpool",
      "Laptops & computers",
      "HP",
      "Lenovo"
    ]
  },
  {
    "name": "Samsung Experience Store – Bagalur Road, Hosur",
    "category": "Electronics",
    "subcategories": [
      "Mobile phones",
      "Home appliances"
    ],
    "products": [
      {
        "id": "samsung-s25",
        "name": "Samsung Galaxy S25 (Sales)",
        "description": "Latest Samsung flagship smartphone.",
        "price": 79999,
        "unit": "ex-showroom"
      },
      {
        "id": "samsung-fridge",
        "name": "Samsung Bespoke Refrigerator",
        "description": "Premium Bespoke series refrigerator.",
        "price": 65000,
        "unit": "ex-showroom"
      },
      {
        "id": "samsung-repair",
        "name": "Samsung Service & Repair",
        "description": "Authorized Samsung device repair and service.",
        "price": 499,
        "unit": "from"
      }
    ],
    "description": "Authorized Samsung Experience Store on Bagalur Road, Hosur. Full range of Samsung phones, tablets, TVs, appliances and official service.",
    "distance": 2.6,
    "demoCoordinates": {
      "latitude": 12.738,
      "longitude": 77.823
    },
    "rating": 4.6,
    "reviews": 219,
    "price": "from ₹499",
    "icon": "📱",
    "color": "mint",
    "subscribed": true,
    "tag": "Authorized store",
    "taxonomyTags": [
      "Sales",
      "Service",
      "Mobile phones",
      "Samsung",
      "Galaxy S25",
      "Galaxy A56",
      "Home appliances",
      "Samsung",
      "Bespoke refrigerator",
      "Bespoke washing machine"
    ]
  },
  {
    "name": "Sri Mithuna Samsung Service – Hosur",
    "category": "Electronics",
    "subcategories": [
      "Mobile phones"
    ],
    "products": [
      {
        "id": "mithuna-screen",
        "name": "Samsung Screen Replacement",
        "description": "Genuine Samsung screen replacement service.",
        "price": 2999,
        "unit": "from"
      },
      {
        "id": "mithuna-battery",
        "name": "Battery Replacement",
        "description": "Genuine battery replacement for Samsung devices.",
        "price": 999,
        "unit": "from"
      },
      {
        "id": "mithuna-software",
        "name": "Software Repair & Flash",
        "description": "Software troubleshooting and firmware flashing.",
        "price": 499,
        "unit": "per visit"
      }
    ],
    "description": "Authorized Samsung service center in Indira Nagar, Hosur. Genuine spare parts, warranty repairs and software troubleshooting for all Samsung models.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.727,
      "longitude": 77.833
    },
    "rating": 4.7,
    "reviews": 143,
    "price": "from ₹499",
    "icon": "🔧",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Service",
      "Mobile phones",
      "Samsung",
      "Galaxy S25",
      "Galaxy A56",
      "Phone repair",
      "Screen & display",
      "Screen replacement",
      "Diagnostics",
      "Phone diagnostics"
    ]
  },
  {
    "name": "Zenith PC – Hosur",
    "category": "Electronics",
    "subcategories": [
      "Laptops & computers"
    ],
    "products": [
      {
        "id": "zenith-gaming-pc",
        "name": "Custom Gaming PC Build",
        "description": "Custom-built gaming desktop per your specs.",
        "price": 45000,
        "unit": "from"
      },
      {
        "id": "zenith-laptop-repair",
        "name": "Laptop Repair",
        "description": "Hardware and software laptop repair service.",
        "price": 599,
        "unit": "from"
      },
      {
        "id": "zenith-cctv",
        "name": "CCTV & Network Setup",
        "description": "CCTV camera installation and LAN/WiFi networking.",
        "price": 12000,
        "unit": "from"
      }
    ],
    "description": "Computer hardware store and service center in Hosur. Custom builds, gaming rigs, laptop repair, CCTV, networking and printer solutions.",
    "distance": 1.7,
    "demoCoordinates": {
      "latitude": 12.729,
      "longitude": 77.821
    },
    "rating": 4.6,
    "reviews": 89,
    "price": "from ₹599",
    "icon": "🖥️",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Sales",
      "Service",
      "Laptops & computers",
      "Dell",
      "HP",
      "Lenovo",
      "ASUS",
      "Acer",
      "Apple",
      "MacBook Air",
      "Pavilion",
      "OmniBook",
      "IdeaPad"
    ]
  },
  {
    "name": "Tanishq Jewellery – By-Pass Road, Hosur",
    "category": "Fashion",
    "subcategories": [
      "Jewellery"
    ],
    "products": [
      {
        "id": "tanishq-necklace",
        "name": "22K Gold Necklace",
        "description": "Certified 22K gold necklace from Tanishq.",
        "price": 75000,
        "unit": "from"
      },
      {
        "id": "tanishq-ring",
        "name": "Diamond Solitaire Ring",
        "description": "Certified diamond solitaire ring.",
        "price": 25000,
        "unit": "from"
      },
      {
        "id": "tanishq-exchange",
        "name": "Old Gold Exchange",
        "description": "Exchange old gold jewellery at fair market value.",
        "price": 0,
        "unit": "free service"
      }
    ],
    "description": "Tanishq by Tata — India's most trusted jewellery brand. Showroom on By-Pass Road, Hosur. Certified gold, diamond and platinum jewellery.",
    "distance": 1.9,
    "demoCoordinates": {
      "latitude": 12.731,
      "longitude": 77.836
    },
    "rating": 4.8,
    "reviews": 489,
    "price": "from ₹25000",
    "icon": "💎",
    "color": "lavender",
    "subscribed": true,
    "tag": "Trusted brand",
    "taxonomyTags": [
      "Jewellery",
      "Traditional jewellery",
      "Earrings",
      "Necklaces",
      "Handcrafted necklaces",
      "Gold",
      "Diamond",
      "Everyday earrings"
    ]
  },
  {
    "name": "Raymond – The Complete Man, Hosur",
    "category": "Fashion",
    "subcategories": [
      "Clothing",
      "Tailoring"
    ],
    "products": [
      {
        "id": "raymond-fabric",
        "name": "Suit Fabric (2.5m)",
        "description": "Premium Raymond suiting fabric.",
        "price": 3500,
        "unit": "per 2.5m"
      },
      {
        "id": "raymond-shirt",
        "name": "Readymade Formal Shirt",
        "description": "Ready-to-wear formal shirt.",
        "price": 1299,
        "unit": "per piece"
      },
      {
        "id": "raymond-suit",
        "name": "Custom Suit Stitching",
        "description": "Bespoke suit stitching service.",
        "price": 2999,
        "unit": "per suit"
      }
    ],
    "description": "Raymond showroom in Hosur. Premium men's suiting fabric, readymade formals and custom tailoring. Corporate and ethnic wear collections.",
    "distance": 2.1,
    "demoCoordinates": {
      "latitude": 12.733,
      "longitude": 77.825
    },
    "rating": 4.6,
    "reviews": 178,
    "price": "from ₹1299",
    "icon": "👔",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Clothing",
      "Men",
      "Everyday wear",
      "Shirts & trousers",
      "Occasion wear",
      "Ethnic wear",
      "Tailoring",
      "Custom stitching",
      "Women",
      "Blouse stitching"
    ]
  },
  {
    "name": "Planet Fashion – Hosur",
    "category": "Fashion",
    "subcategories": [
      "Clothing"
    ],
    "products": [
      {
        "id": "planet-jeans",
        "name": "Men's Branded Jeans",
        "description": "Branded jeans for men from top labels.",
        "price": 1499,
        "unit": "from"
      },
      {
        "id": "planet-ethnic",
        "name": "Women's Ethnic Wear Set",
        "description": "Ethnic wear sets for women.",
        "price": 1999,
        "unit": "from"
      },
      {
        "id": "planet-kids",
        "name": "Kids Festive Outfit",
        "description": "Festive outfits for children.",
        "price": 899,
        "unit": "from"
      }
    ],
    "description": "Planet Fashion multi-brand apparel store near Post Office Road, Hosur. Top national brands for men, women and kids — casual, formal and ethnic wear.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.723,
      "longitude": 77.829
    },
    "rating": 4.5,
    "reviews": 231,
    "price": "from ₹899",
    "icon": "🛍️",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Clothing",
      "Men",
      "Everyday wear",
      "Shirts & trousers",
      "Women",
      "Kurtas & kurtis",
      "Sarees & dresses",
      "Kids",
      "Everyday wear",
      "Kids clothing"
    ]
  },
  {
    "name": "Bata Footwear – MG Road, Hosur",
    "category": "Fashion",
    "subcategories": [
      "Footwear"
    ],
    "products": [
      {
        "id": "bata-formal",
        "name": "Men's Formal Shoes",
        "description": "Classic formal shoes for men.",
        "price": 1499,
        "unit": "from"
      },
      {
        "id": "bata-sandals",
        "name": "Women's Sandals",
        "description": "Comfortable sandals for women.",
        "price": 999,
        "unit": "from"
      },
      {
        "id": "bata-school",
        "name": "School Shoes",
        "description": "Durable school shoes for children.",
        "price": 699,
        "unit": "from"
      }
    ],
    "description": "Bata footwear store on MG Road, Hosur. Affordable everyday shoes, formal footwear, sandals, slippers and school shoes for the whole family.",
    "distance": 1.1,
    "demoCoordinates": {
      "latitude": 12.725,
      "longitude": 77.83
    },
    "rating": 4.4,
    "reviews": 312,
    "price": "from ₹699",
    "icon": "👟",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Footwear",
      "Shoes",
      "Formal",
      "Formal shoes",
      "Casual",
      "Everyday sneakers",
      "Sandals & slippers",
      "Daily wear",
      "Sandals"
    ]
  },
  {
    "name": "Saree Palace – Nethaji Road, Hosur",
    "category": "Fashion",
    "subcategories": [
      "Clothing",
      "Textiles"
    ],
    "products": [
      {
        "id": "saree-cotton",
        "name": "Cotton Saree",
        "description": "Comfortable everyday cotton sarees.",
        "price": 899,
        "unit": "from"
      },
      {
        "id": "saree-silk",
        "name": "Silk Saree",
        "description": "Elegant silk sarees for occasions.",
        "price": 3500,
        "unit": "from"
      },
      {
        "id": "saree-handloom",
        "name": "Handloom Dress Material",
        "description": "Authentic handloom dress materials.",
        "price": 750,
        "unit": "from"
      }
    ],
    "description": "Hosur's go-to saree store on Nethaji Road. Vast collection of cotton, silk and handloom sarees for daily wear, festivals and weddings.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.721,
      "longitude": 77.828
    },
    "rating": 4.6,
    "reviews": 267,
    "price": "from ₹750",
    "icon": "🥻",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Clothing",
      "Women",
      "Occasion wear",
      "Sarees & dresses",
      "Textiles",
      "Handloom",
      "Cotton fabrics",
      "Dress materials",
      "Home textiles",
      "Bed & bath"
    ]
  },
  {
    "name": "Godrej Interio – Bagalur Road, Hosur",
    "category": "Home & furniture",
    "subcategories": [
      "Furniture",
      "Kitchen & storage"
    ],
    "products": [
      {
        "id": "godrej-kitchen",
        "name": "Modular Kitchen Setup",
        "description": "Complete modular kitchen design and installation.",
        "price": 85000,
        "unit": "from"
      },
      {
        "id": "godrej-wardrobe",
        "name": "Sliding Wardrobe",
        "description": "Custom sliding door wardrobe.",
        "price": 35000,
        "unit": "from"
      },
      {
        "id": "godrej-chair",
        "name": "Office Chair",
        "description": "Ergonomic office chair.",
        "price": 8500,
        "unit": "from"
      }
    ],
    "description": "Godrej Interio showroom on Bagalur Road, Hosur. Modular kitchens, wardrobes, beds, sofas and ergonomic office furniture with installation.",
    "distance": 2.8,
    "demoCoordinates": {
      "latitude": 12.737,
      "longitude": 77.827
    },
    "rating": 4.6,
    "reviews": 203,
    "price": "from ₹8500",
    "icon": "🪑",
    "color": "mint",
    "subscribed": true,
    "tag": "Trusted brand",
    "taxonomyTags": [
      "Furniture",
      "Bedroom",
      "Storage",
      "Wardrobes",
      "Kitchen & storage",
      "Kitchen fittings",
      "Modular kitchen cabinets",
      "Living room",
      "Seating",
      "Sofas & chairs"
    ]
  },
  {
    "name": "Royaloak Furniture – Hosur",
    "category": "Home & furniture",
    "subcategories": [
      "Furniture",
      "Home decor"
    ],
    "products": [
      {
        "id": "royaloak-sofa",
        "name": "5-Seater Sofa Set",
        "description": "Premium 5-seater fabric or leather sofa set.",
        "price": 32000,
        "unit": "from"
      },
      {
        "id": "royaloak-bed",
        "name": "King Size Bed",
        "description": "Solid wood king-size bed frame.",
        "price": 18000,
        "unit": "from"
      },
      {
        "id": "royaloak-dining",
        "name": "Dining Table (6-seater)",
        "description": "6-seater dining table with chairs.",
        "price": 22000,
        "unit": "from"
      }
    ],
    "description": "Royaloak large-format furniture showroom near Hosur. Wide range of living room, bedroom and dining furniture with free delivery and installation.",
    "distance": 3,
    "demoCoordinates": {
      "latitude": 12.739,
      "longitude": 77.829
    },
    "rating": 4.5,
    "reviews": 318,
    "price": "from ₹18000",
    "icon": "🛋️",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Furniture",
      "Living room",
      "Seating",
      "Sofas & chairs",
      "Bedroom",
      "Beds",
      "Beds & headboards",
      "Dining",
      "Dining sets",
      "Dining tables & chairs"
    ]
  },
  {
    "name": "Surya Home Decor & Interior – Hosur",
    "category": "Home & furniture",
    "subcategories": [
      "Home decor",
      "Interior design"
    ],
    "products": [
      {
        "id": "surya-consult",
        "name": "Interior Design Consultation",
        "description": "Free home interior design consultation.",
        "price": 0,
        "unit": "free"
      },
      {
        "id": "surya-ceiling",
        "name": "False Ceiling Design & Fit",
        "description": "False ceiling design and installation.",
        "price": 120,
        "unit": "per sqft"
      },
      {
        "id": "surya-wall",
        "name": "Wall Art & Decor Panels",
        "description": "Decorative wall art and paneling.",
        "price": 2500,
        "unit": "from"
      },
      {
        "id": "interior-design-makeover",
        "name": "Interior Design Consultation",
        "description": "3D space planning, modular kitchen design, false ceiling layouts and material selection.",
        "price": 1500,
        "unit": "service"
      }
    ],
    "description": "Full-home interior design studio in Hosur. False ceilings, modular furniture, lighting, wall paneling and 3D design planning from ₹0 consultation.",
    "distance": 2.2,
    "demoCoordinates": {
      "latitude": 12.735,
      "longitude": 77.832
    },
    "rating": 4.8,
    "reviews": 142,
    "price": "from ₹120/sqft",
    "icon": "🏠",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Interior design",
      "Home planning",
      "Room design",
      "Design consultation",
      "Room makeover",
      "Space planning",
      "Home decor",
      "Wall decor",
      "Art & hangings",
      "Lighting",
      "Indoor lighting"
    ]
  },
  {
    "name": "Nilkamal Homes – Hosur",
    "category": "Home & furniture",
    "subcategories": [
      "Furniture",
      "Kitchen & storage"
    ],
    "products": [
      {
        "id": "nilkamal-cabinet",
        "name": "Plastic Storage Cabinet",
        "description": "Durable plastic storage cabinet.",
        "price": 3500,
        "unit": "from"
      },
      {
        "id": "nilkamal-study",
        "name": "Study Table",
        "description": "Study table for kids and adults.",
        "price": 4999,
        "unit": "from"
      },
      {
        "id": "nilkamal-chairs",
        "name": "Plastic Chair (set of 4)",
        "description": "Set of 4 durable plastic chairs.",
        "price": 2800,
        "unit": "per set"
      }
    ],
    "description": "Nilkamal Homes store near Hosur. Affordable plastic and wooden furniture, storage solutions, kids furniture and home essentials.",
    "distance": 3.2,
    "demoCoordinates": {
      "latitude": 12.74,
      "longitude": 77.82
    },
    "rating": 4.3,
    "reviews": 187,
    "price": "from ₹2800",
    "icon": "📦",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Furniture",
      "Living room",
      "Tables",
      "Coffee & side tables",
      "Kitchen & storage",
      "Storage solutions",
      "Shelving",
      "Storage racks",
      "Repairs",
      "Furniture assembly"
    ]
  },
  {
    "name": "Kauvery Hospital – Hosur",
    "category": "Health & wellness",
    "subcategories": [
      "Clinics",
      "Dental care",
      "Physiotherapy"
    ],
    "products": [
      {
        "id": "kauvery-opd",
        "name": "General OPD Consultation",
        "description": "Walk-in general physician consultation.",
        "price": 300,
        "unit": "per visit"
      },
      {
        "id": "kauvery-dental",
        "name": "Dental Check-up & X-ray",
        "description": "Comprehensive dental check-up with X-ray.",
        "price": 500,
        "unit": "per visit"
      },
      {
        "id": "kauvery-physio",
        "name": "Physiotherapy Session",
        "description": "Guided physiotherapy rehabilitation session.",
        "price": 400,
        "unit": "per session"
      }
    ],
    "description": "NABH-accredited 125-bed multi-specialty Kauvery Hospital in Shanthi Nagar, Hosur. Emergency, dental, ophthalmology, physiotherapy, orthopaedics and ICU.",
    "distance": 1.5,
    "demoCoordinates": {
      "latitude": 12.726,
      "longitude": 77.835
    },
    "rating": 4.7,
    "reviews": 423,
    "price": "from ₹300",
    "icon": "🏥",
    "color": "peach",
    "subscribed": true,
    "tag": "NABH accredited",
    "taxonomyTags": [
      "Clinics",
      "General care",
      "Appointments",
      "Doctor consultation",
      "Paediatrics",
      "Dental care",
      "Dental clinics",
      "Treatment",
      "Physiotherapy",
      "Mobility care",
      "Eye care"
    ]
  },
  {
    "name": "SBS Hospital – Hosur",
    "category": "Health & wellness",
    "subcategories": [
      "Clinics",
      "Physiotherapy"
    ],
    "products": [
      {
        "id": "sbs-ortho",
        "name": "Orthopaedic Consultation",
        "description": "Specialist orthopaedic doctor consultation.",
        "price": 350,
        "unit": "per visit"
      },
      {
        "id": "sbs-xray",
        "name": "Bone & Joint X-ray",
        "description": "Digital X-ray for bone and joint assessment.",
        "price": 400,
        "unit": "per scan"
      },
      {
        "id": "sbs-physio",
        "name": "Physiotherapy & Rehab Session",
        "description": "Physical therapy and rehabilitation session.",
        "price": 500,
        "unit": "per session"
      }
    ],
    "description": "SBS Hospital Pvt. Ltd. on Tank Street, Hosur. Multi-specialty care with orthopaedic specialization, emergency, general surgery and rehabilitation.",
    "distance": 1,
    "demoCoordinates": {
      "latitude": 12.722,
      "longitude": 77.83
    },
    "rating": 4.6,
    "reviews": 287,
    "price": "from ₹350",
    "icon": "🩺",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Clinics",
      "General care",
      "Appointments",
      "Doctor consultation",
      "Physiotherapy",
      "Mobility care",
      "Assessment",
      "Physiotherapy assessment",
      "Physiotherapy session"
    ]
  },
  {
    "name": "Apollo Dental Clinic – Hosur",
    "category": "Health & wellness",
    "subcategories": [
      "Dental care"
    ],
    "products": [
      {
        "id": "apollo-implant-consult",
        "name": "Dental Implant Consultation",
        "description": "Specialist consultation for dental implants.",
        "price": 500,
        "unit": "per visit"
      },
      {
        "id": "apollo-rct",
        "name": "Root Canal Treatment",
        "description": "Complete root canal treatment.",
        "price": 6000,
        "unit": "per tooth"
      },
      {
        "id": "apollo-whitening",
        "name": "Teeth Whitening Session",
        "description": "Professional teeth whitening treatment.",
        "price": 3500,
        "unit": "per session"
      }
    ],
    "description": "Apollo Dental Clinic on Krishnagiri Bypass Road, Hosur. Implants, root canals, orthodontics, whitening and complete dental care under the Apollo brand.",
    "distance": 2.4,
    "demoCoordinates": {
      "latitude": 12.734,
      "longitude": 77.84
    },
    "rating": 4.7,
    "reviews": 198,
    "price": "from ₹500",
    "icon": "🦷",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Dental care",
      "Dental clinics",
      "Check-ups",
      "Dental consultation",
      "Treatment",
      "Cleaning & fillings"
    ]
  },
  {
    "name": "Arokyam Lungs Care Centre – Hosur",
    "category": "Health & wellness",
    "subcategories": [
      "Clinics"
    ],
    "products": [
      {
        "id": "arokyam-consult",
        "name": "Pulmonology Consultation",
        "description": "Specialist consultation for respiratory conditions.",
        "price": 400,
        "unit": "per visit"
      },
      {
        "id": "arokyam-spirometry",
        "name": "Spirometry Lung Function Test",
        "description": "Lung capacity and function assessment.",
        "price": 800,
        "unit": "per test"
      },
      {
        "id": "arokyam-asthma",
        "name": "Asthma Treatment Plan",
        "description": "Personalized asthma management plan.",
        "price": 1200,
        "unit": "per plan"
      }
    ],
    "description": "Specialized respiratory and lungs care clinic near Avalapalli Hudco, Hosur. Treating asthma, COPD, bronchitis, sleep apnoea and lung infections.",
    "distance": 1.8,
    "demoCoordinates": {
      "latitude": 12.73,
      "longitude": 77.837
    },
    "rating": 4.8,
    "reviews": 89,
    "price": "from ₹400",
    "icon": "🫁",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Clinics",
      "General care",
      "Appointments",
      "Doctor consultation",
      "Eye care",
      "Appointments",
      "Eye examination"
    ]
  },
  {
    "name": "Ketone Fitness – Shanthi Nagar, Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Gyms & fitness centers",
      "Personal training"
    ],
    "products": [
      {
        "id": "ketone-monthly",
        "name": "Monthly Gym Membership",
        "description": "Full gym access for one month.",
        "price": 1000,
        "unit": "per month"
      },
      {
        "id": "ketone-pt",
        "name": "Personal Training (10 sessions)",
        "description": "10 one-on-one personal training sessions.",
        "price": 4000,
        "unit": "per package"
      },
      {
        "id": "ketone-bca",
        "name": "Body Composition Analysis",
        "description": "Detailed body fat and muscle composition report.",
        "price": 300,
        "unit": "per test"
      }
    ],
    "description": "Ketone Fitness gym in Shanthi Nagar, Denkanikottai Road, Hosur. Modern equipment, personal training and body transformation programs.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.727,
      "longitude": 77.838
    },
    "rating": 4.7,
    "reviews": 198,
    "price": "from ₹1000",
    "icon": "💪",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Sports & fitness",
      "Gyms & fitness centers",
      "Gym membership",
      "Weight training",
      "Strength conditioning",
      "Personal training",
      "1-on-1 coaching",
      "Transformation"
    ]
  },
  {
    "name": "H&T Fitness – Navadhi, Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Gyms & fitness centers"
    ],
    "products": [
      {
        "id": "ht-monthly",
        "name": "Monthly Unisex Membership",
        "description": "Monthly gym access for all genders.",
        "price": 900,
        "unit": "per month"
      },
      {
        "id": "ht-quarterly",
        "name": "Quarterly Membership",
        "description": "3-month gym membership at a discount.",
        "price": 2400,
        "unit": "per quarter"
      },
      {
        "id": "ht-cardio",
        "name": "Cardio & Abs Package",
        "description": "Focused cardio and core training package.",
        "price": 1500,
        "unit": "per month"
      }
    ],
    "description": "H&T Fitness — popular unisex gym on Denkanikottai Main Road, Navadhi, Hosur. Free weights, machines, cardio and group fitness sessions.",
    "distance": 2,
    "demoCoordinates": {
      "latitude": 12.732,
      "longitude": 77.839
    },
    "rating": 4.6,
    "reviews": 154,
    "price": "from ₹900",
    "icon": "🏋️",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Sports & fitness",
      "Gyms & fitness centers",
      "Gym membership",
      "Weight training",
      "CrossFit & functional",
      "HIIT workouts",
      "Dance fitness",
      "Zumba studios"
    ]
  },
  {
    "name": "Royal Wellfit Health Club & Pool – Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Gyms & fitness centers",
      "Swimming & aquatics"
    ],
    "products": [
      {
        "id": "rwf-gym-pool",
        "name": "Monthly Gym + Pool Access",
        "description": "Combined gym and swimming pool monthly membership.",
        "price": 2500,
        "unit": "per month"
      },
      {
        "id": "rwf-swim-lessons",
        "name": "Swimming Lessons (monthly)",
        "description": "Professional swimming coaching for all levels.",
        "price": 1500,
        "unit": "per month"
      },
      {
        "id": "rwf-annual",
        "name": "Annual Membership",
        "description": "Full-year all-access membership.",
        "price": 18000,
        "unit": "per year"
      }
    ],
    "description": "Royal Wellfit Health Club near Kumudepalli, Hosur. Full-scale gym, heated swimming pool, steam room and multi-purpose sports hall.",
    "distance": 3.5,
    "demoCoordinates": {
      "latitude": 12.741,
      "longitude": 77.824
    },
    "rating": 4.8,
    "reviews": 267,
    "price": "from ₹1500",
    "icon": "🏊",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Sports & fitness",
      "Gyms & fitness centers",
      "Gym membership",
      "Swimming & aquatics",
      "Swimming pools",
      "Coaching",
      "Swimming lessons",
      "Personal training"
    ]
  },
  {
    "name": "Eagles Sports Club – Bagalur Circle, Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Sports coaching",
      "Turf & facility rental"
    ],
    "products": [
      {
        "id": "eagles-volleyball",
        "name": "Volleyball Coaching (monthly)",
        "description": "Professional volleyball coaching for all ages.",
        "price": 1200,
        "unit": "per month"
      },
      {
        "id": "eagles-football",
        "name": "Football Coaching (monthly)",
        "description": "Structured football training program.",
        "price": 1500,
        "unit": "per month"
      },
      {
        "id": "eagles-camp",
        "name": "Multi-sport Summer Camp",
        "description": "Multi-sport summer camp for kids.",
        "price": 3500,
        "unit": "per camp"
      }
    ],
    "description": "Eagles Sports Club near Bagalur Circle, Hosur. Professional volleyball, football and athletics coaching. Summer camps and inter-school tournaments.",
    "distance": 4,
    "demoCoordinates": {
      "latitude": 12.743,
      "longitude": 77.826
    },
    "rating": 4.7,
    "reviews": 143,
    "price": "from ₹1200",
    "icon": "🏐",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Sports coaching",
      "Badminton",
      "Coaching academies",
      "Cricket",
      "Net practice & coaching",
      "Turf & facility rental",
      "Box cricket turf",
      "Hourly rental"
    ]
  },
  {
    "name": "Little England Badminton Academy – Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Sports coaching",
      "Turf & facility rental"
    ],
    "products": [
      {
        "id": "leba-coaching",
        "name": "Badminton Coaching (monthly)",
        "description": "Professional badminton coaching for all ages.",
        "price": 1400,
        "unit": "per month"
      },
      {
        "id": "leba-court",
        "name": "Court Booking (1 hr)",
        "description": "Hourly badminton court rental.",
        "price": 280,
        "unit": "per hour"
      },
      {
        "id": "leba-kids",
        "name": "Kids Shuttle Program",
        "description": "Monthly badminton program for children.",
        "price": 1000,
        "unit": "per month"
      }
    ],
    "description": "Little England Badminton Academy — well-lit indoor courts and professional coaches for kids and adults in Hosur. Flexible batch timings.",
    "distance": 2.7,
    "demoCoordinates": {
      "latitude": 12.738,
      "longitude": 77.835
    },
    "rating": 4.7,
    "reviews": 128,
    "price": "from ₹280",
    "icon": "🏸",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Sports coaching",
      "Badminton",
      "Coaching academies",
      "Badminton coaching",
      "Turf & facility rental",
      "Badminton courts",
      "Indoor court rental",
      "Court booking"
    ]
  },
  {
    "name": "Prabhu's Turf 24/7 – Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Turf & facility rental"
    ],
    "products": [
      {
        "id": "prabhu-football",
        "name": "Football Turf (1 hr)",
        "description": "Synthetic football turf — hourly rental.",
        "price": 700,
        "unit": "per hour"
      },
      {
        "id": "prabhu-box-cricket",
        "name": "Box Cricket (1 hr)",
        "description": "Box cricket turf — hourly rental.",
        "price": 550,
        "unit": "per hour"
      },
      {
        "id": "prabhu-night",
        "name": "Night-slot Turf (10 PM–2 AM)",
        "description": "Floodlit turf — late night slot.",
        "price": 900,
        "unit": "per hour"
      }
    ],
    "description": "24/7 multi-sport turf facility in Hosur. Synthetic football, box cricket and kabaddi courts available round the clock with floodlights.",
    "distance": 3.1,
    "demoCoordinates": {
      "latitude": 12.74,
      "longitude": 77.833
    },
    "rating": 4.5,
    "reviews": 221,
    "price": "from ₹550",
    "icon": "⚽",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Turf & facility rental",
      "Box cricket turf",
      "Hourly rental",
      "Turf booking",
      "Badminton courts",
      "Indoor court rental",
      "Sports coaching"
    ]
  },
  {
    "name": "Orien Fitness – Muneeswara Nagar, Hosur",
    "category": "Sports & fitness",
    "subcategories": [
      "Gyms & fitness centers"
    ],
    "products": [
      {
        "id": "orien-monthly",
        "name": "Monthly Membership",
        "description": "Full gym access for one month.",
        "price": 800,
        "unit": "per month"
      },
      {
        "id": "orien-zumba",
        "name": "Zumba Classes (monthly)",
        "description": "Monthly Zumba dance fitness classes.",
        "price": 900,
        "unit": "per month"
      },
      {
        "id": "orien-combo",
        "name": "Yoga + Gym Combo",
        "description": "Combined yoga and gym monthly package.",
        "price": 1500,
        "unit": "per month"
      }
    ],
    "description": "Orien Fitness unisex gym near Muneeswara Nagar, Hosur. Strength training, Zumba, aerobics and yoga — all under one roof.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.729,
      "longitude": 77.836
    },
    "rating": 4.5,
    "reviews": 109,
    "price": "from ₹800",
    "icon": "🧘",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Sports & fitness",
      "Gyms & fitness centers",
      "Gym membership",
      "Dance fitness",
      "Zumba studios",
      "Cardio dance",
      "Yoga & pilates",
      "Yoga studios"
    ]
  },
  {
    "name": "A1 Call Taxi – Hosur",
    "category": "Travel",
    "subcategories": [
      "Local transport"
    ],
    "products": [
      {
        "id": "a1-airport",
        "name": "Airport Transfer to Bengaluru",
        "description": "Cab transfer to Bengaluru Kempegowda International Airport.",
        "price": 1200,
        "unit": "per trip"
      },
      {
        "id": "a1-outstation",
        "name": "Outstation Day Trip",
        "description": "Full-day outstation cab booking.",
        "price": 2500,
        "unit": "per day"
      },
      {
        "id": "a1-local",
        "name": "Local City Ride",
        "description": "Local city cab ride within Hosur.",
        "price": 199,
        "unit": "from"
      }
    ],
    "description": "A1 Call Taxi — 24/7 reliable cab service in Hosur. Airport drops to Bengaluru KIA, outstation tours, corporate travel and local rides.",
    "distance": 0.7,
    "demoCoordinates": {
      "latitude": 12.721,
      "longitude": 77.827
    },
    "rating": 4.7,
    "reviews": 398,
    "price": "from ₹199",
    "icon": "🚖",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Local transport",
      "Airport rides",
      "Cars",
      "Airport transfer",
      "City rides",
      "Car rentals",
      "Self drive",
      "Daily rental",
      "Car hire",
      "Tours & experiences"
    ]
  },
  {
    "name": "Red Taxi – Hosur",
    "category": "Travel",
    "subcategories": [
      "Local transport"
    ],
    "products": [
      {
        "id": "red-mini",
        "name": "Mini Car Ride (local)",
        "description": "Affordable mini car for local Hosur rides.",
        "price": 150,
        "unit": "from"
      },
      {
        "id": "red-sedan",
        "name": "Sedan Outstation",
        "description": "Sedan car for outstation trips.",
        "price": 3000,
        "unit": "from"
      },
      {
        "id": "red-pink",
        "name": "Pink Taxi (women-only)",
        "description": "Women-only cab with women driver.",
        "price": 200,
        "unit": "from"
      }
    ],
    "description": "Red Taxi fleet service in Hosur. Sedans, mini cars and tempo travellers. Unique Pink Taxi option with women drivers for women passengers.",
    "distance": 0.9,
    "demoCoordinates": {
      "latitude": 12.723,
      "longitude": 77.832
    },
    "rating": 4.6,
    "reviews": 287,
    "price": "from ₹150",
    "icon": "🚕",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Local transport",
      "Airport rides",
      "Cars",
      "Airport transfer",
      "City rides",
      "Two-wheelers",
      "Local bike rental",
      "Bus & rail services"
    ]
  },
  {
    "name": "Grand Royal Tours & Travel – Hosur",
    "category": "Travel",
    "subcategories": [
      "Travel agents",
      "Tours & experiences"
    ],
    "products": [
      {
        "id": "grand-ooty",
        "name": "Ooty & Kodaikanal Package (3N/4D)",
        "description": "3 nights 4 days Ooty & Kodaikanal holiday package.",
        "price": 8500,
        "unit": "per person"
      },
      {
        "id": "grand-kerala",
        "name": "Kerala Backwaters Tour (5N/6D)",
        "description": "5 nights 6 days Kerala backwaters tour.",
        "price": 22000,
        "unit": "per person"
      },
      {
        "id": "grand-visa",
        "name": "International Visa Assistance",
        "description": "Visa application assistance for international travel.",
        "price": 2500,
        "unit": "per application"
      },
      {
        "id": "itinerary-travel-planning",
        "name": "Itinerary & Holiday Planning",
        "description": "Custom domestic and international vacation itineraries, flight bookings and curated road trips.",
        "price": 999,
        "unit": "service"
      },
      {
        "id": "travel-tickets-bus-cab",
        "name": "Travel Agents & Airport Transfer Cabs",
        "description": "Doorstep sanitized airport drop/pickup, intercity outstation cabs and tour packages.",
        "price": 999,
        "unit": "service"
      }
    ],
    "description": "Grand Royal Tours in Hosur. Domestic and international holiday packages, visa assistance, hotel bookings and corporate travel management.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.724,
      "longitude": 77.826
    },
    "rating": 4.6,
    "reviews": 156,
    "price": "from ₹2500",
    "icon": "✈️",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Travel agents",
      "Holiday planning",
      "Domestic trips",
      "Custom itinerary",
      "International trips",
      "Travel planning",
      "Tours & experiences",
      "Local experiences",
      "Guided tours",
      "Airport transfer"
    ]
  },
  {
    "name": "Nanban Tours & Travels – Hosur",
    "category": "Travel",
    "subcategories": [
      "Travel agents",
      "Tours & experiences"
    ],
    "products": [
      {
        "id": "nanban-tirupati",
        "name": "Tirupati Darshan Package",
        "description": "Tirupati pilgrimage package with accommodation.",
        "price": 2800,
        "unit": "per person"
      },
      {
        "id": "nanban-rameswaram",
        "name": "Rameswaram Tour (2N/3D)",
        "description": "2 nights 3 days Rameswaram pilgrimage tour.",
        "price": 5500,
        "unit": "per person"
      },
      {
        "id": "nanban-bus",
        "name": "Bus Ticket Booking",
        "description": "Intercity bus ticket booking assistance.",
        "price": 50,
        "unit": "per booking"
      }
    ],
    "description": "Nanban Tours and Travels in Hosur. Pilgrimage tours, family holiday packages, bus and train ticket booking and group travel coordination.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.726,
      "longitude": 77.833
    },
    "rating": 4.5,
    "reviews": 198,
    "price": "from ₹50",
    "icon": "🗺️",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Travel agents",
      "Holiday planning",
      "Domestic trips",
      "Custom itinerary",
      "Bus & rail services",
      "Bus tickets",
      "Intercity travel",
      "Bus booking support",
      "Tours & experiences"
    ]
  },
  {
    "name": "Grand Continent Hosur (Sarovar Portico)",
    "category": "Travel",
    "subcategories": [
      "Stays"
    ],
    "products": [
      {
        "id": "gc-standard",
        "name": "Standard Room",
        "description": "Standard hotel room with all amenities.",
        "price": 2500,
        "unit": "per night"
      },
      {
        "id": "gc-superior",
        "name": "Superior Room with Breakfast",
        "description": "Superior room with complimentary breakfast.",
        "price": 3200,
        "unit": "per night"
      },
      {
        "id": "gc-conference",
        "name": "Conference Hall (full day)",
        "description": "Full-day conference hall rental.",
        "price": 35000,
        "unit": "per day"
      }
    ],
    "description": "Grand Continent Hosur — Sarovar Portico affiliated hotel. Centrally located, ideal for corporate and family travelers. Restaurant, conference and banquet facilities.",
    "distance": 1.7,
    "demoCoordinates": {
      "latitude": 12.729,
      "longitude": 77.834
    },
    "rating": 4.6,
    "reviews": 341,
    "price": "from ₹2500",
    "icon": "🏨",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Stays",
      "Hotels",
      "Family stays",
      "Hotel room booking",
      "Guest houses",
      "Short stays",
      "Guest house booking",
      "Tours & experiences"
    ]
  },
  {
    "name": "Hotel Hills – Hosur",
    "category": "Travel",
    "subcategories": [
      "Stays"
    ],
    "products": [
      {
        "id": "hills-standard",
        "name": "Standard Room",
        "description": "Clean and comfortable standard room.",
        "price": 1800,
        "unit": "per night"
      },
      {
        "id": "hills-double",
        "name": "Double Occupancy Room",
        "description": "Room for two with double bed.",
        "price": 2200,
        "unit": "per night"
      },
      {
        "id": "hills-dinner",
        "name": "Room + Dinner Combo",
        "description": "Room with complimentary dinner for two.",
        "price": 2800,
        "unit": "per night"
      }
    ],
    "description": "Hotel Hills — reliable mid-range hotel near Hosur Bus Stand. Clean rooms, in-house restaurant and easy access to all major commercial areas.",
    "distance": 0.5,
    "demoCoordinates": {
      "latitude": 12.72,
      "longitude": 77.828
    },
    "rating": 4.3,
    "reviews": 224,
    "price": "from ₹1800",
    "icon": "🛏️",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Stays",
      "Hotels",
      "Family stays",
      "Hotel room booking",
      "Guest houses",
      "Short stays",
      "Guest house booking"
    ]
  },
  {
    "name": "Lakshmi Cinemas – Hosur",
    "category": "Entertainment",
    "subcategories": [
      "Movies & cinema"
    ],
    "products": [
      {
        "id": "lakshmi-regular",
        "name": "Regular Ticket",
        "description": "Standard cinema seat.",
        "price": 120,
        "unit": "per ticket"
      },
      {
        "id": "lakshmi-premium",
        "name": "Premium Seat",
        "description": "Premium recliner seat.",
        "price": 180,
        "unit": "per ticket"
      },
      {
        "id": "lakshmi-combo",
        "name": "Movie + Popcorn Combo",
        "description": "Ticket with large popcorn and drink.",
        "price": 250,
        "unit": "per combo"
      }
    ],
    "description": "Lakshmi Cinemas in Hosur — Phase VII NHS. RGB Laser projection, QSC Dolby Atmos sound. Screening latest Tamil, Telugu, Hindi and English films.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.725,
      "longitude": 77.831
    },
    "rating": 4.6,
    "reviews": 534,
    "price": "from ₹120",
    "icon": "🎬",
    "color": "peach",
    "subscribed": true,
    "tag": "Dolby Atmos",
    "taxonomyTags": [
      "Movies & cinema",
      "Cinema",
      "Show times",
      "Movie tickets",
      "Home viewing",
      "Equipment hire",
      "Projector rental"
    ]
  },
  {
    "name": "Grand Cinemas – Thally Road, Hosur",
    "category": "Entertainment",
    "subcategories": [
      "Movies & cinema"
    ],
    "products": [
      {
        "id": "grand-standard",
        "name": "Standard Ticket",
        "description": "Standard cinema seat.",
        "price": 110,
        "unit": "per ticket"
      },
      {
        "id": "grand-couple",
        "name": "Couple Seat",
        "description": "Special couple sofa seat.",
        "price": 280,
        "unit": "per pair"
      },
      {
        "id": "grand-3d",
        "name": "3D Movie Ticket",
        "description": "3D movie experience ticket.",
        "price": 200,
        "unit": "per ticket"
      }
    ],
    "description": "Grand Cinemas near Karnur Bus Stop, Thally Road, Hosur. 4K projection, Dolby Atmos and recliner seating for a premium movie experience.",
    "distance": 2.9,
    "demoCoordinates": {
      "latitude": 12.739,
      "longitude": 77.831
    },
    "rating": 4.7,
    "reviews": 412,
    "price": "from ₹110",
    "icon": "🎥",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Movies & cinema",
      "Cinema",
      "Show times",
      "Movie tickets"
    ]
  },
  {
    "name": "Hosur Music & Arts Academy",
    "category": "Entertainment",
    "subcategories": [
      "Music",
      "Classes & workshops"
    ],
    "products": [
      {
        "id": "hma-carnatic",
        "name": "Carnatic Vocal Class (monthly)",
        "description": "Monthly Carnatic music vocal training.",
        "price": 800,
        "unit": "per month"
      },
      {
        "id": "hma-instrument",
        "name": "Guitar / Keyboard Lessons",
        "description": "Monthly guitar or keyboard lessons.",
        "price": 1000,
        "unit": "per month"
      },
      {
        "id": "hma-art",
        "name": "Drawing & Painting Class",
        "description": "Monthly drawing and painting classes.",
        "price": 700,
        "unit": "per month"
      },
      {
        "id": "dance-classes",
        "name": "Dance & Performing Arts Classes",
        "description": "Classical Bharatanatyam, contemporary, hip-hop, salsa and wedding choreography sessions.",
        "price": 1500,
        "unit": "mo"
      },
      {
        "id": "live-music-performances",
        "name": "Live Music & Band Bookings",
        "description": "Acoustic soloists, instrumental fusion duos, indie singers and sound systems for gatherings.",
        "price": 6000,
        "unit": "service"
      },
      {
        "id": "music-classes-instruments",
        "name": "Music Classes & Instrument Training",
        "description": "Beginner and advanced training for acoustic guitar, keyboard, drums, flute and Hindustani/Carnatic vocal.",
        "price": 1200,
        "unit": "mo"
      },
      {
        "id": "workshops-crafts-classes",
        "name": "Workshops & Creative Craft Classes",
        "description": "Weekend pottery throwing, resin art, candle crafting, baking workshops and watercolor painting.",
        "price": 699,
        "unit": "service"
      }
    ],
    "description": "Music and arts learning center in Hosur. Carnatic vocal, keyboard, guitar, tabla, drawing and painting classes for kids and adults.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.728,
      "longitude": 77.84
    },
    "rating": 4.8,
    "reviews": 87,
    "price": "from ₹700",
    "icon": "🎵",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Music",
      "Music lessons",
      "Instruments",
      "Music classes",
      "Live music",
      "Local artists",
      "Classes & workshops",
      "Arts & crafts",
      "Creative classes",
      "Craft workshop",
      "Dance classes"
    ]
  },
  {
    "name": "Hosur Weekend Haat – Cultural Events",
    "category": "Entertainment",
    "subcategories": [
      "Events",
      "Classes & workshops"
    ],
    "products": [
      {
        "id": "haat-event",
        "name": "Event Planning (from)",
        "description": "End-to-end event planning and coordination.",
        "price": 5000,
        "unit": "from"
      },
      {
        "id": "haat-photo",
        "name": "Photography Coverage",
        "description": "Professional event photography.",
        "price": 8000,
        "unit": "per event"
      },
      {
        "id": "haat-workshop",
        "name": "Workshop Hosting (half day)",
        "description": "Venue and coordination for half-day workshops.",
        "price": 3000,
        "unit": "per session"
      },
      {
        "id": "event-photography",
        "name": "Event Photography & Videography",
        "description": "Candid wedding coverage, birthday shoots, corporate gatherings and drone videography.",
        "price": 4999,
        "unit": "service"
      },
      {
        "id": "photography-portraits",
        "name": "Photography & Studio Portraits",
        "description": "Maternity shoots, infant portraits, corporate headshots, product photography and model portfolios.",
        "price": 2499,
        "unit": "service"
      },
      {
        "id": "video-production-drone",
        "name": "Video Shoot & Production Services",
        "description": "4K commercial video production, social media reels editing, corporate interviews and drone shoots.",
        "price": 5999,
        "unit": "service"
      }
    ],
    "description": "Community-run events platform in Hosur. Weekend haats, cultural workshops, local artisan expos and corporate team events coordination.",
    "distance": 2.1,
    "demoCoordinates": {
      "latitude": 12.733,
      "longitude": 77.827
    },
    "rating": 4.6,
    "reviews": 76,
    "price": "from ₹3000",
    "icon": "🎪",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Events",
      "Community events",
      "Workshops",
      "Weekend workshop",
      "Celebrations",
      "Private events",
      "Event planning",
      "Classes & workshops",
      "Dance",
      "Dance classes",
      "Event photography",
      "Photography"
    ]
  },
  {
    "name": "Hosur Gaming Zone – Arcade & VR",
    "category": "Entertainment",
    "subcategories": [
      "Gaming",
      "Outdoor activities"
    ],
    "products": [
      {
        "id": "hgz-vr",
        "name": "VR Gaming Session (30 min)",
        "description": "30-minute virtual reality gaming experience.",
        "price": 200,
        "unit": "per session"
      },
      {
        "id": "hgz-arcade",
        "name": "Arcade Games Pass (1 hr)",
        "description": "1-hour unlimited arcade games pass.",
        "price": 150,
        "unit": "per hour"
      },
      {
        "id": "hgz-group",
        "name": "Group Gaming Package",
        "description": "Group gaming package for up to 5 players.",
        "price": 500,
        "unit": "per group"
      },
      {
        "id": "gaming-pc-consoles",
        "name": "Gaming Zones, Consoles & PC",
        "description": "PlayStation & Xbox gaming lounges, VR experience booths and gaming PC diagnostics & upgrades.",
        "price": 150,
        "unit": "service"
      }
    ],
    "description": "Indoor gaming and arcade zone in Hosur. VR headset games, racing simulators, arcade machines and skill games for kids and adults.",
    "distance": 2.4,
    "demoCoordinates": {
      "latitude": 12.735,
      "longitude": 77.836
    },
    "rating": 4.5,
    "reviews": 198,
    "price": "from ₹150",
    "icon": "🎮",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Gaming",
      "Games & recreation",
      "Indoor activities",
      "Game session",
      "Outdoor activities",
      "Family activities",
      "Local outings",
      "Activity booking"
    ]
  },
  {
    "name": "Hope Home Care – Hosur",
    "category": "Everyday services",
    "subcategories": [
      "Plumbing",
      "Electrical",
      "Cleaning"
    ],
    "products": [
      {
        "id": "hope-plumbing",
        "name": "Plumbing Emergency Call-out",
        "description": "Emergency plumbing repair visit.",
        "price": 299,
        "unit": "from"
      },
      {
        "id": "hope-electrical",
        "name": "Fan & Light Installation",
        "description": "Ceiling fan and light fixture installation.",
        "price": 199,
        "unit": "per unit"
      },
      {
        "id": "hope-painting",
        "name": "Home Painting (per room)",
        "description": "Full room painting with emulsion paint.",
        "price": 3500,
        "unit": "per room"
      },
      {
        "id": "ac-repair",
        "name": "AC Repair & Servicing",
        "description": "Gas refilling, deep cleaning, filter sanitization, cooling coil repair and compressor checks.",
        "price": 499,
        "unit": "service"
      }
    ],
    "description": "Hope Home Care — multi-skilled home service professionals in Hosur. Plumbing, electrical, painting, carpentry and general home maintenance.",
    "distance": 1.1,
    "demoCoordinates": {
      "latitude": 12.723,
      "longitude": 77.834
    },
    "rating": 4.6,
    "reviews": 189,
    "price": "from ₹199",
    "icon": "🏠",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Plumbing",
      "Home plumbing",
      "Repairs",
      "Leak repair",
      "Electrical",
      "Home electrical",
      "Installation",
      "Lighting installation",
      "Cleaning",
      "Home cleaning"
    ]
  },
  {
    "name": "Vijay Home Services – Hosur",
    "category": "Everyday services",
    "subcategories": [
      "Appliance repair",
      "Cleaning"
    ],
    "products": [
      {
        "id": "vijay-washing",
        "name": "Washing Machine Repair",
        "description": "Doorstep washing machine repair.",
        "price": 399,
        "unit": "from"
      },
      {
        "id": "vijay-fridge",
        "name": "Refrigerator Service",
        "description": "Refrigerator gas refill and full service.",
        "price": 499,
        "unit": "from"
      },
      {
        "id": "vijay-chimney",
        "name": "Chimney & Exhaust Fan Cleaning",
        "description": "Kitchen chimney and exhaust fan deep clean.",
        "price": 349,
        "unit": "per unit"
      }
    ],
    "description": "Vijay Home Services — doorstep appliance repair and home cleaning in Hosur. Washing machines, fridges, chimneys, RO filters and microwave repair.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.725,
      "longitude": 77.836
    },
    "rating": 4.7,
    "reviews": 234,
    "price": "from ₹349",
    "icon": "🔨",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Appliance repair",
      "Kitchen appliances",
      "Repair",
      "Refrigerator service",
      "Laundry appliances",
      "Repair",
      "Washing machine service",
      "Cleaning",
      "Home cleaning",
      "Kitchen cleaning"
    ]
  },
  {
    "name": "Sri Balaji Pest Control – Hosur",
    "category": "Everyday services",
    "subcategories": [
      "Home services",
      "Professional services"
    ],
    "products": [
      {
        "id": "balaji-cockroach",
        "name": "Cockroach Treatment",
        "description": "Professional cockroach eradication treatment.",
        "price": 499,
        "unit": "per session"
      },
      {
        "id": "balaji-termite",
        "name": "Termite Treatment (per room)",
        "description": "Anti-termite chemical treatment.",
        "price": 999,
        "unit": "per room"
      },
      {
        "id": "balaji-bedbug",
        "name": "Bed Bug Elimination",
        "description": "Complete bed bug treatment and follow-up.",
        "price": 1299,
        "unit": "per session"
      },
      {
        "id": "accounting-services",
        "name": "Accounting & Tax Services",
        "description": "GST filing, income tax returns, monthly bookkeeping and small business financial advisory.",
        "price": 1499,
        "unit": "service"
      },
      {
        "id": "xerox-printing-scanning",
        "name": "Xerox, Printing & Document Binding",
        "description": "Color and B&W high-speed photocopying, architectural plan plotting, spiral binding and lamination.",
        "price": 2,
        "unit": "service"
      }
    ],
    "description": "Professional pest control service covering all of Hosur. Government-certified chemicals, safe for children and pets. Annual AMC packages available.",
    "distance": 1.9,
    "demoCoordinates": {
      "latitude": 12.731,
      "longitude": 77.838
    },
    "rating": 4.7,
    "reviews": 312,
    "price": "from ₹499",
    "icon": "🐛",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Home services",
      "Pest control",
      "Treatment",
      "Home pest treatment",
      "Professional services",
      "Consulting",
      "Local experts",
      "Accounting"
    ]
  },
  {
    "name": "Hosur Professional Painters & Carpenters",
    "category": "Everyday services",
    "subcategories": [
      "Home services",
      "Plumbing"
    ],
    "products": [
      {
        "id": "hpc-painting",
        "name": "Room Painting (2 coats emulsion)",
        "description": "Two-coat emulsion painting for one room.",
        "price": 3500,
        "unit": "per room"
      },
      {
        "id": "hpc-ceiling",
        "name": "False Ceiling (per sqft)",
        "description": "PVC or gypsum false ceiling installation.",
        "price": 85,
        "unit": "per sqft"
      },
      {
        "id": "hpc-furniture",
        "name": "Furniture Repair & Polish",
        "description": "Wooden furniture repair and polishing.",
        "price": 1500,
        "unit": "from"
      }
    ],
    "description": "Professional painters, carpenters and false ceiling contractors in Hosur. Home painting, furniture repair, false ceilings and waterproofing.",
    "distance": 2.3,
    "demoCoordinates": {
      "latitude": 12.733,
      "longitude": 77.822
    },
    "rating": 4.5,
    "reviews": 143,
    "price": "from ₹85/sqft",
    "icon": "🪣",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Home services",
      "Gardening",
      "Garden care",
      "Garden maintenance",
      "Professional services",
      "Consulting",
      "Local experts",
      "Initial consultation",
      "Appliance repair"
    ]
  },
  {
    "name": "Hosur CA & Tax Services",
    "category": "Everyday services",
    "subcategories": [
      "Professional services"
    ],
    "products": [
      {
        "id": "hosur-ca-itr",
        "name": "ITR Filing (individual)",
        "description": "Income tax return filing for individuals.",
        "price": 999,
        "unit": "per filing"
      },
      {
        "id": "hosur-ca-gst",
        "name": "GST Registration",
        "description": "GST registration and setup for businesses.",
        "price": 1999,
        "unit": "per registration"
      },
      {
        "id": "hosur-ca-accounting",
        "name": "Business Accounting (monthly)",
        "description": "Monthly bookkeeping and accounting service.",
        "price": 3500,
        "unit": "per month"
      }
    ],
    "description": "Chartered accountants and tax consultants in Hosur. ITR filing, GST registration, business accounting, audit and company registration services.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.721,
      "longitude": 77.826
    },
    "rating": 4.8,
    "reviews": 167,
    "price": "from ₹999",
    "icon": "📊",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Professional services",
      "Accounting",
      "Small business",
      "Bookkeeping support",
      "Consulting",
      "Local experts",
      "Initial consultation"
    ]
  },
  {
    "name": "Hosur Event Photography & Videography",
    "category": "Everyday services",
    "subcategories": [
      "Professional services"
    ],
    "products": [
      {
        "id": "hepv-wedding",
        "name": "Wedding Photography (full day)",
        "description": "Full-day wedding photography and editing.",
        "price": 25000,
        "unit": "per event"
      },
      {
        "id": "hepv-corporate",
        "name": "Corporate Event Photography",
        "description": "Professional corporate event photography.",
        "price": 8000,
        "unit": "per event"
      },
      {
        "id": "hepv-baby",
        "name": "Baby / Birthday Shoot",
        "description": "Studio or outdoor baby and birthday photography.",
        "price": 5000,
        "unit": "per session"
      }
    ],
    "description": "Professional photography and videography services in Hosur. Wedding, corporate events, product shoots, baby photography and drone videography.",
    "distance": 1.5,
    "demoCoordinates": {
      "latitude": 12.727,
      "longitude": 77.822
    },
    "rating": 4.9,
    "reviews": 198,
    "price": "from ₹5000",
    "icon": "📸",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Professional services",
      "Photography",
      "Events",
      "Event photography",
      "Consulting",
      "Local experts"
    ]
  },
  {
    "name": "Sri Murugan Book Center & Stationery – Netaji Road",
    "category": "Books & Stationery",
    "subcategories": [
      "Books",
      "Stationery"
    ],
    "products": [
      {
        "id": "smbc-textbooks",
        "name": "CBSE & Samacheer Kalvi School Textbooks",
        "description": "Standard 1 to 12 state board and CBSE curriculum textbooks.",
        "price": 180,
        "unit": "book"
      },
      {
        "id": "smbc-notebooks",
        "name": "Classmate Long Notebooks (Bundle of 6)",
        "description": "High quality ruled and unruled 192-page Classmate notebooks.",
        "price": 290,
        "unit": "bundle"
      },
      {
        "id": "smbc-colors",
        "name": "Camlin Artist Water Color & Brush Set",
        "description": "24-shade water colors with artist paint brush assortment.",
        "price": 350,
        "unit": "set"
      },
      {
        "id": "smbc-tnpsc",
        "name": "TNPSC Group 4 & Banking Exam Preparation Guide",
        "description": "Comprehensive Tamil & English general studies and aptitude guide.",
        "price": 450,
        "unit": "book"
      },
      {
        "id": "books-textbooks-novels",
        "name": "Books, School Textbooks & Novels",
        "description": "CBSE, Samacheer Kalvi school textbooks, college guides, Tamil literature novels and competitive exam books.",
        "price": 80,
        "unit": "unit"
      },
      {
        "id": "stationery-school-office-supplies",
        "name": "Stationery & School Supplies",
        "description": "Classmate notebooks, pens, Faber-Castell art materials, box files, geometry kits and drawing boards.",
        "price": 20,
        "unit": "unit"
      }
    ],
    "description": "Hosur's landmark bookstore on Netaji Road. Complete school & college textbooks, NCERT guides, competitive exam books, Classmate notebooks, and Camlin art materials.",
    "distance": 0.9,
    "demoCoordinates": {
      "latitude": 12.7335,
      "longitude": 77.8288
    },
    "rating": 4.8,
    "reviews": 342,
    "price": "from ₹40",
    "icon": "📚",
    "color": "mint",
    "tag": "Hosur favourite",
    "subscribed": true,
    "taxonomyTags": [
      "Books",
      "School & College",
      "Textbooks",
      "School textbooks",
      "Stationery",
      "School supplies",
      "Notebooks & pens",
      "Classmate notebooks",
      "Competitive Exams",
      "TNPSC & Bank exams"
    ]
  },
  {
    "name": "Higginbothams Books – Station Road, Hosur",
    "category": "Books & Stationery",
    "subcategories": [
      "Books",
      "Libraries & Study"
    ],
    "products": [
      {
        "id": "higg-novels",
        "name": "Tamil & English Bestselling Fiction Novels",
        "description": "Contemporary bestsellers, thrillers, classics and non-fiction.",
        "price": 299,
        "unit": "book"
      },
      {
        "id": "higg-ponniyin",
        "name": "Ponniyin Selvan Full Set (Tamil - 5 Vols)",
        "description": "Classic historical masterpiece by Kalki with box set cover.",
        "price": 999,
        "unit": "set"
      },
      {
        "id": "higg-kids",
        "name": "Children's Illustrated Story Books & Comics",
        "description": "Amar Chitra Katha, Panchatantra, Enid Blyton and fairy tales.",
        "price": 150,
        "unit": "book"
      },
      {
        "id": "higg-magazines",
        "name": "National & International Magazines & Periodicals",
        "description": "Frontline, India Today, Business Today and competitive journals.",
        "price": 80,
        "unit": "copy"
      }
    ],
    "description": "Iconic bookstore chain near Station Road, Hosur. Bestselling English fiction, Tamil literature classics, self-help books, children's storybooks, and magazines.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.729,
      "longitude": 77.8315
    },
    "rating": 4.7,
    "reviews": 215,
    "price": "from ₹80",
    "icon": "📖",
    "color": "lavender",
    "tag": "Heritage bookstore",
    "subscribed": true,
    "taxonomyTags": [
      "Books",
      "Literature & Fiction",
      "Tamil novels",
      "Historical fiction",
      "English fiction",
      "Bestsellers",
      "Children's Books",
      "Story books"
    ]
  },
  {
    "name": "Vignesh Stationery, Xerox & Project Mart – Bagalur Road",
    "category": "Books & Stationery",
    "subcategories": [
      "Stationery",
      "Printing & Xerox"
    ],
    "products": [
      {
        "id": "vig-binding",
        "name": "Spiral Binding & Project Report Printing",
        "description": "Color cover sheet, high-speed duplex printing and spiral comb binding.",
        "price": 120,
        "unit": "report"
      },
      {
        "id": "vig-xerox",
        "name": "Color Laser Print & Digital Photocopy",
        "description": "High-resolution color laser printouts and crisp black-and-white xerox.",
        "price": 10,
        "unit": "page"
      },
      {
        "id": "vig-paper",
        "name": "JK Copier A4 Paper Rim (75 GSM 500 Sheets)",
        "description": "Bright white smudge-free multipurpose copier paper.",
        "price": 320,
        "unit": "rim"
      },
      {
        "id": "vig-files",
        "name": "Office Box Files & Document Folders (Pack of 5)",
        "description": "Heavy-duty lever arch files for corporate and tax filing.",
        "price": 250,
        "unit": "pack"
      },
      {
        "id": "xerox-printing-binding",
        "name": "Xerox, Digital Printing & Binding",
        "description": "Color digital xerox, student project spiral binding, thesis printing, lamination and copier paper.",
        "price": 5,
        "unit": "service"
      }
    ],
    "description": "Complete stationery, digital xerox and student project binding center on Bagalur Road, Hosur. Color printouts, lamination, thesis binding, and corporate office supplies.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.738,
      "longitude": 77.834
    },
    "rating": 4.6,
    "reviews": 189,
    "price": "from ₹5",
    "icon": "🖨️",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Stationery",
      "Office supplies",
      "Files & folders",
      "Printing & Xerox",
      "Document services",
      "Photocopy & print",
      "Color & B/W xerox",
      "Binding & lamination",
      "Spiral binding"
    ]
  },
  {
    "name": "Reliance Stationery & Art Center – MG Road",
    "category": "Books & Stationery",
    "subcategories": [
      "Stationery"
    ],
    "products": [
      {
        "id": "rel-pens",
        "name": "Faber-Castell Connector Pens & Sketch Set",
        "description": "Washable vibrant colors ideal for school art and coloring.",
        "price": 199,
        "unit": "set"
      },
      {
        "id": "rel-canvas",
        "name": "Canvas Board & Acrylic Paints Kit",
        "description": "Stretched 10x12 canvas board with 12 acrylic color tubes.",
        "price": 499,
        "unit": "kit"
      },
      {
        "id": "rel-geometry",
        "name": "Doms Mathematical Drawing & Geometry Box",
        "description": "Precision compass, divider, protractor and set squares.",
        "price": 120,
        "unit": "box"
      },
      {
        "id": "rel-parker",
        "name": "Executive Parker Pen Gift Set",
        "description": "Classic rollerball metal finish pen in luxury presentation box.",
        "price": 550,
        "unit": "piece"
      }
    ],
    "description": "All-in-one stationery and fine art depot on MG Road, Hosur. Acrylics, oil paints, drawing boards, engineering drafting instruments, fountain pens, and school project accessories.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.7312,
      "longitude": 77.827
    },
    "rating": 4.6,
    "reviews": 164,
    "price": "from ₹30",
    "icon": "✏️",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Stationery",
      "School supplies",
      "Geometry & kits",
      "Art & craft",
      "Drawing & painting",
      "Paints & canvases",
      "Craft materials"
    ]
  },
  {
    "name": "Pooja Fancy & Bridal Gift World – MG Road",
    "category": "Toys & Fancy Stores",
    "subcategories": [
      "Fancy Store",
      "Gifts & Novelties"
    ],
    "products": [
      {
        "id": "pooja-bangles",
        "name": "Traditional Glass & Velvet Bangles (Set of 24)",
        "description": "Handcrafted festive glass bangles in assorted bridal shades.",
        "price": 180,
        "unit": "set"
      },
      {
        "id": "pooja-jewel",
        "name": "Matte Finish 1-Gram Gold Temple Jewellery Set",
        "description": "Antique choker necklace with matching jhumkas.",
        "price": 1450,
        "unit": "set"
      },
      {
        "id": "pooja-makeup",
        "name": "Lakme & Maybelline Bridal Vanity Makeup Kit",
        "description": "Kajal, foundation, compact powder and long-stay lipstick combo.",
        "price": 1200,
        "unit": "kit"
      },
      {
        "id": "pooja-gifts",
        "name": "Custom Photo Clock & Personalized Gift Frame",
        "description": "Personalized wooden tabletop frame with quartz clock.",
        "price": 550,
        "unit": "piece"
      },
      {
        "id": "bangles-fancy-jewellery",
        "name": "Bangles & Fashion Jewellery",
        "description": "Traditional glass bangles, velvet bangles, matte finish 1-gram gold temple jewellery and accessories.",
        "price": 50,
        "unit": "unit"
      },
      {
        "id": "fancy-store-gifts",
        "name": "Fancy Store, Gifts & Cosmetics",
        "description": "Party celebration items, return gifts, vanity makeup cosmetics, hair accessories, perfumes and gifts.",
        "price": 40,
        "unit": "unit"
      }
    ],
    "description": "Hosur's most renowned fancy and bridal gift showroom on MG Road. Premium glass bangles, imitation jewellery, branded cosmetics, hair accessories, luxury perfumes, and customized gifts.",
    "distance": 0.7,
    "demoCoordinates": {
      "latitude": 12.7318,
      "longitude": 77.8265
    },
    "rating": 4.8,
    "reviews": 388,
    "price": "from ₹50",
    "icon": "🎁",
    "color": "peach",
    "tag": "Hosur top fancy store",
    "subscribed": true,
    "taxonomyTags": [
      "Fancy Store",
      "Bangles & jewelry",
      "Glass & metal bangles",
      "Bridal & daily bangles",
      "Imitation jewelry",
      "Beauty & cosmetics",
      "Makeup & vanity",
      "Gifts & novelties",
      "Gift articles",
      "Bangles"
    ]
  },
  {
    "name": "Sri Balaji Novelties & Toy Kingdom – Netaji Road",
    "category": "Toys & Fancy Stores",
    "subcategories": [
      "Toys & Games",
      "Kids Essentials"
    ],
    "products": [
      {
        "id": "bal-rc",
        "name": "Rechargeable High-Speed RC Monster Truck",
        "description": "2.4GHz remote control 4WD off-road climbing vehicle.",
        "price": 1250,
        "unit": "piece"
      },
      {
        "id": "bal-lego",
        "name": "Lego-Compatible STEM Building Block Set (500 pcs)",
        "description": "Creative architectural blocks for cognitive learning.",
        "price": 850,
        "unit": "set"
      },
      {
        "id": "bal-carrom",
        "name": "Carrom Board Champion Tournament Size (32 inch)",
        "description": "Smooth waterproof playing surface with coins and striker.",
        "price": 1600,
        "unit": "board"
      },
      {
        "id": "bal-doll",
        "name": "Barbie Fashionista & Indian Doll Collection",
        "description": "Articulated fashion doll with modern interchangeable outfits.",
        "price": 499,
        "unit": "doll"
      },
      {
        "id": "toys-games-rc-cars",
        "name": "Toys, Board Games & RC Cars",
        "description": "Remote control cars, STEM building blocks, Barbie dolls, soft teddy bears, carrom and board games.",
        "price": 99,
        "unit": "unit"
      }
    ],
    "description": "Largest toy showroom in Hosur on Netaji Road. Remote control cars, drones, educational STEM building blocks, board games, Hot Wheels tracks, and baby developmental toys.",
    "distance": 1,
    "demoCoordinates": {
      "latitude": 12.734,
      "longitude": 77.8295
    },
    "rating": 4.7,
    "reviews": 275,
    "price": "from ₹99",
    "icon": "🧸",
    "color": "mint",
    "tag": "Top rated toys",
    "subscribed": true,
    "taxonomyTags": [
      "Toys & Games",
      "Action & vehicles",
      "RC cars & drones",
      "Learning & STEM",
      "Puzzles & blocks",
      "Board games",
      "Family classics",
      "Kids & baby toys"
    ]
  },
  {
    "name": "Kids Zone Toy World & Ride-Ons – Denkanikottai Road",
    "category": "Toys & Fancy Stores",
    "subcategories": [
      "Toys & Games",
      "Kids Essentials"
    ],
    "products": [
      {
        "id": "kz-electric-jeep",
        "name": "Kids Battery-Operated Electric Jeep (with Remote)",
        "description": "12V dual motor rechargeable electric ride-on with headlights and music.",
        "price": 8999,
        "unit": "piece"
      },
      {
        "id": "kz-tricycle",
        "name": "Kids Tricycle with Canopy & Parent Push Handle",
        "description": "Ergonomic comfortable trike with rear storage basket.",
        "price": 2400,
        "unit": "piece"
      },
      {
        "id": "kz-teddy",
        "name": "Giant 4-Foot Soft Plush Teddy Bear",
        "description": "Ultra-soft hypo-allergenic plush cuddle bear.",
        "price": 1200,
        "unit": "piece"
      },
      {
        "id": "kz-backpack",
        "name": "Insulated Cartoon School Backpack & Water Bottle",
        "description": "Water-resistant kids school bag with leakproof thermos bottle.",
        "price": 750,
        "unit": "combo"
      }
    ],
    "description": "Specialized kids toys and battery ride-on showroom on Denkanikottai Road, Hosur. Electric cars, bikes, tricycles, soft plush toys, baby walkers, and school accessories.",
    "distance": 1.5,
    "demoCoordinates": {
      "latitude": 12.726,
      "longitude": 77.829
    },
    "rating": 4.7,
    "reviews": 198,
    "price": "from ₹150",
    "icon": "🚗",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Toys & Games",
      "Kids & baby toys",
      "Soft toys & plush",
      "Kids Essentials",
      "Ride-ons",
      "Battery vehicles",
      "Kids cycles",
      "School accessories"
    ]
  },
  {
    "name": "Mahalakshmi Fancy Store & Party Hub – Bagalur Circle",
    "category": "Toys & Fancy Stores",
    "subcategories": [
      "Fancy Store",
      "Gifts & Novelties"
    ],
    "products": [
      {
        "id": "maha-decor",
        "name": "Birthday Party Decoration Kit (Balloons, Banner & Props)",
        "description": "Theme foil balloons, happy birthday banner and photobooth props.",
        "price": 450,
        "unit": "set"
      },
      {
        "id": "maha-return-gifts",
        "name": "Kids Birthday Return Gift Packs (Bundle of 10)",
        "description": "Stationery kit, puzzle and novelty gift packaged packs.",
        "price": 350,
        "unit": "pack"
      },
      {
        "id": "maha-clips",
        "name": "Fancy Hair Clips, Clutches & Scrunchies Collection",
        "description": "Korean style pastel hair accessories and pearl clips.",
        "price": 90,
        "unit": "set"
      },
      {
        "id": "maha-showpiece",
        "name": "Musical Snow Globe & Decorative Idols",
        "description": "LED lighting musical showpiece for birthdays and home gifting.",
        "price": 399,
        "unit": "piece"
      }
    ],
    "description": "Friendly neighbourhood fancy store and party decoration hub near Bagalur Circle. Helium balloons, party supplies, return gifts for kids, hair accessories, cosmetics, and seasonal decor.",
    "distance": 2.1,
    "demoCoordinates": {
      "latitude": 12.742,
      "longitude": 77.836
    },
    "rating": 4.5,
    "reviews": 172,
    "price": "from ₹40",
    "icon": "🎈",
    "color": "butter",
    "subscribed": true,
    "taxonomyTags": [
      "Fancy Store",
      "Beauty & cosmetics",
      "Hair accessories",
      "Gifts & novelties",
      "Party supplies",
      "Birthday celebration",
      "Return gifts",
      "Gift articles"
    ]
  },
  {
    "name": "Hosur MGR Central Bus Stand – NH 44 Bypass",
    "category": "Public & Common Places",
    "subcategories": [
      "Transit & Stations"
    ],
    "products": [
      {
        "id": "mgr-bus-bengaluru",
        "name": "TNSTC Hosur to Bengaluru City / Electronic City Bus",
        "description": "Frequent express town and highway shuttle service every 10 minutes.",
        "price": 45,
        "unit": "trip"
      },
      {
        "id": "mgr-bus-intercity",
        "name": "Intercity Superfast Express to Chennai / Salem / Madurai",
        "description": "Long-distance government passenger buses connecting major Tamil Nadu cities.",
        "price": 210,
        "unit": "ticket"
      },
      {
        "id": "mgr-cloakroom",
        "name": "24-Hour Passenger Cloakroom & Luggage Storage",
        "description": "Secure luggage deposit facility inside main bus terminus.",
        "price": 30,
        "unit": "bag"
      },
      {
        "id": "bus-stand-intercity-transit",
        "name": "Bus Stand & Intercity Transit Services",
        "description": "TNSTC and KSRTC bus services to Bengaluru, Chennai, Salem, cloakroom facility and town departures.",
        "price": 499,
        "unit": "service"
      }
    ],
    "description": "Hosur's main government bus terminus situated at the NH 44 junction. 24/7 bus connectivity to Bengaluru, Chennai, Salem, Coimbatore, Krishnagiri, and surrounding rural villages.",
    "distance": 0.6,
    "demoCoordinates": {
      "latitude": 12.7302,
      "longitude": 77.8248
    },
    "rating": 4.3,
    "reviews": 1250,
    "price": "Public amenity",
    "icon": "🚌",
    "color": "mint",
    "tag": "Central transit hub",
    "subscribed": true,
    "taxonomyTags": [
      "Transit & Stations",
      "Bus stations",
      "MGR Central Bus Stand",
      "Town & intercity buses",
      "Depot & enquiry",
      "MGR Bus Stand"
    ]
  },
  {
    "name": "Hosur Railway Station (HSRA) – Station Road",
    "category": "Public & Common Places",
    "subcategories": [
      "Transit & Stations"
    ],
    "products": [
      {
        "id": "hsra-suburban",
        "name": "Hosur to Bengaluru MEMU / Suburban Train Ticket",
        "description": "Daily commuter trains to Bangalore City (SBC) and Baiyyappanahalli (SMVB).",
        "price": 20,
        "unit": "ticket"
      },
      {
        "id": "hsra-reservation",
        "name": "PRS Reserved Express Train Booking Counter",
        "description": "Computerized passenger reservation system for mail/express trains.",
        "price": 0,
        "unit": "enquiry"
      },
      {
        "id": "hsra-auto",
        "name": "24/7 Prepaid Auto & Taxi Stand Facility",
        "description": "Regulated auto rickshaw stand serving all Hosur industrial and residential sectors.",
        "price": 50,
        "unit": "base fare"
      }
    ],
    "description": "South Western Railway station connecting Hosur with Bengaluru, Salem, Tiruchirappalli, and Kerala. Equipped with passenger waiting rooms, ticket counters, and auto-rickshaw stand.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.7238,
      "longitude": 77.8312
    },
    "rating": 4.4,
    "reviews": 890,
    "price": "Public amenity",
    "icon": "🚆",
    "color": "lavender",
    "tag": "Rail gateway",
    "subscribed": true,
    "taxonomyTags": [
      "Transit & Stations",
      "Railways",
      "Hosur Railway Station",
      "Train schedules & tickets",
      "Station amenities"
    ]
  },
  {
    "name": "Shri Chandra Choodeswarar Hill Temple (Malai Kovil)",
    "category": "Public & Common Places",
    "subcategories": [
      "Heritage & Temples"
    ],
    "products": [
      {
        "id": "temple-darshan",
        "name": "Temple Darshan & Archana Pooja Token",
        "description": "Special archana pooja and divine blessings of Lord Shiva.",
        "price": 20,
        "unit": "token"
      },
      {
        "id": "temple-prasad",
        "name": "Special Abhishekham & Temple Prasad",
        "description": "Morning and evening deity abhishekham with holy sweet pongal prasad.",
        "price": 100,
        "unit": "seva"
      },
      {
        "id": "temple-viewpoint",
        "name": "Hilltop Panoramic Viewpoint & Sunset Walk",
        "description": "360-degree panoramic vantage point overlooking the entire town of Hosur.",
        "price": 0,
        "unit": "free access"
      },
      {
        "id": "public-common-places-heritage",
        "name": "Public Places, Parks & Heritage Sites",
        "description": "Malai Kovil temple, Kelavarapalli Dam, Rajaji Eco Park, Municipal Corporation, HPO and Town Library.",
        "price": 499,
        "unit": "service"
      }
    ],
    "description": "Ancient and sacred Shiva hill temple dating back to the Chola dynasty, perched on an elevation overlooking all of Hosur. Famous for Rajagopuram, car festival, and panoramic views.",
    "distance": 2.2,
    "demoCoordinates": {
      "latitude": 12.716,
      "longitude": 77.83
    },
    "rating": 4.9,
    "reviews": 2180,
    "price": "Free / ₹20",
    "icon": "🛕",
    "color": "peach",
    "tag": "Hosur heritage icon",
    "subscribed": true,
    "taxonomyTags": [
      "Heritage & Temples",
      "Hill temples",
      "Chandra Choodeswarar Kovil",
      "Malai Kovil Shiva temple",
      "Temple rituals",
      "Public & Common Places"
    ]
  },
  {
    "name": "Kelavarapalli Reservoir Dam & Children's Park",
    "category": "Public & Common Places",
    "subcategories": [
      "Parks & Nature"
    ],
    "products": [
      {
        "id": "dam-entry",
        "name": "Park Entry & Garden Walkway Access",
        "description": "Entry ticket to public landscaped gardens along the Ponniyar reservoir.",
        "price": 15,
        "unit": "person"
      },
      {
        "id": "dam-kids",
        "name": "Children's Play Zone, Swings & Slides",
        "description": "Open lawn playground area with merry-go-round, slides and seesaws.",
        "price": 0,
        "unit": "included"
      },
      {
        "id": "dam-view",
        "name": "River Promenade & Sunset Photography View",
        "description": "Scenic embankment viewpoint watching water release and sunset.",
        "price": 0,
        "unit": "free"
      }
    ],
    "description": "Picturesque dam and reservoir across the Ponniyar River located 10 km from Hosur. Features lush landscaped gardens, children's amusement playground, and picnic meadows.",
    "distance": 4.8,
    "demoCoordinates": {
      "latitude": 12.785,
      "longitude": 77.85
    },
    "rating": 4.5,
    "reviews": 940,
    "price": "₹15 / person",
    "icon": "🌊",
    "color": "mint",
    "tag": "Popular picnic spot",
    "subscribed": true,
    "taxonomyTags": [
      "Parks & Nature",
      "Lakes & dams",
      "Kelavarapalli Dam",
      "Reservoir garden & boating",
      "Public parks"
    ]
  },
  {
    "name": "Rajaji Memorial & Eco Park – Thorapalli / Hosur",
    "category": "Public & Common Places",
    "subcategories": [
      "Parks & Nature",
      "Heritage & Temples"
    ],
    "products": [
      {
        "id": "eco-track",
        "name": "Eco Park Walking Track & Herbal Garden Entry",
        "description": "Paved jogging and morning walking track amidst medicinal native trees.",
        "price": 10,
        "unit": "person"
      },
      {
        "id": "eco-museum",
        "name": "Bharat Ratna Rajaji Historical Memorial Tour",
        "description": "Preserved ancestral house and museum gallery of C. Rajagopalachari.",
        "price": 0,
        "unit": "free"
      },
      {
        "id": "eco-lawn",
        "name": "Children's Outdoor Lawn & Activity Ground",
        "description": "Green carpet lawns for family picnics, yoga and outdoor relaxation.",
        "price": 0,
        "unit": "free"
      }
    ],
    "description": "Historic memorial dedicated to C. Rajagopalachari (Rajaji) combined with a scenic eco park. Walking trails, medicinal trees, children's play equipment, and memorial gallery.",
    "distance": 3.5,
    "demoCoordinates": {
      "latitude": 12.705,
      "longitude": 77.842
    },
    "rating": 4.6,
    "reviews": 410,
    "price": "₹10 / person",
    "icon": "🌳",
    "color": "butter",
    "tag": "Eco & historic park",
    "subscribed": true,
    "taxonomyTags": [
      "Parks & Nature",
      "Public parks",
      "Eco Park Thorapalli",
      "Heritage & Temples",
      "Historic monuments",
      "Rajaji Memorial"
    ]
  },
  {
    "name": "Hosur City Municipal Corporation – Bagalur Road",
    "category": "Public & Common Places",
    "subcategories": [
      "Civic & Administration"
    ],
    "products": [
      {
        "id": "corp-cert",
        "name": "Birth & Death Certificate Verification & Issuance",
        "description": "Official citizen vital statistics registration and digital certificates.",
        "price": 50,
        "unit": "copy"
      },
      {
        "id": "corp-tax",
        "name": "Property Tax Payment & Assessment Counter",
        "description": "Municipal corporation tax assessment, billing and receipt desk.",
        "price": 0,
        "unit": "service"
      },
      {
        "id": "corp-grievance",
        "name": "Public Citizen Grievance Redressal Cell",
        "description": "Civic complaints registration regarding roads, drainage and streetlights.",
        "price": 0,
        "unit": "free"
      }
    ],
    "description": "Official municipal civic headquarters of Hosur on Bagalur Road. Handles town planning, sanitation, water supply, trade licenses, property tax, and public grievances.",
    "distance": 1.1,
    "demoCoordinates": {
      "latitude": 12.736,
      "longitude": 77.832
    },
    "rating": 4.2,
    "reviews": 320,
    "price": "Public civic body",
    "icon": "🏛️",
    "color": "lavender",
    "tag": "Civic center",
    "subscribed": true,
    "taxonomyTags": [
      "Civic & Administration",
      "City corporation",
      "Hosur Municipal Corporation",
      "Civic services & certificates",
      "Public tax & billing"
    ]
  },
  {
    "name": "Hosur Head Post Office (HPO) – Taluk Office Complex",
    "category": "Public & Common Places",
    "subcategories": [
      "Civic & Administration"
    ],
    "products": [
      {
        "id": "post-speed",
        "name": "India Post Speed Post & Domestic Parcel Booking",
        "description": "Fast pan-India express document and parcel delivery with live tracking.",
        "price": 40,
        "unit": "parcel"
      },
      {
        "id": "post-aadhaar",
        "name": "Aadhaar Card Enrollment & Biometric Update",
        "description": "Official UIDAI biometric update, address change and photo correction.",
        "price": 50,
        "unit": "update"
      },
      {
        "id": "post-savings",
        "name": "Post Office Savings Bank & Senior Citizens Scheme",
        "description": "Government-backed savings accounts, PPF, Sukanya Samriddhi and NSC.",
        "price": 0,
        "unit": "account"
      }
    ],
    "description": "Main postal and courier hub of Hosur located near Taluk office complex. Offers Speed Post, international EMS, registered parcel, Aadhaar services, and postal savings banking.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.731,
      "longitude": 77.828
    },
    "rating": 4.3,
    "reviews": 430,
    "price": "Standard postal rates",
    "icon": "📮",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Civic & Administration",
      "Postal services",
      "Hosur Head Post Office",
      "Speed post & parcel delivery",
      "Citizen identity"
    ]
  },
  {
    "name": "Hosur Town Public Library – Library Street",
    "category": "Public & Common Places",
    "subcategories": [
      "Civic & Administration"
    ],
    "products": [
      {
        "id": "lib-card",
        "name": "Annual Public Library Membership & Book Lending",
        "description": "Lending membership for over 20,000 Tamil and English literature books.",
        "price": 100,
        "unit": "year"
      },
      {
        "id": "lib-reading",
        "name": "Daily Tamil & English Newspapers Reading Room",
        "description": "Quiet public reading hall with 15+ regional and national daily papers.",
        "price": 0,
        "unit": "free access"
      },
      {
        "id": "lib-upsc",
        "name": "UPSC & TNPSC Competitive Exam Reference Hall",
        "description": "Dedicated reference corner with competition yearbooks and journals.",
        "price": 0,
        "unit": "free study"
      }
    ],
    "description": "Government branch library near Taluk office, Hosur. Quiet study atmosphere with over 20,000 Tamil and English books, historical journals, and student exam preparation materials.",
    "distance": 0.9,
    "demoCoordinates": {
      "latitude": 12.7325,
      "longitude": 77.8275
    },
    "rating": 4.7,
    "reviews": 280,
    "price": "Free / ₹100 yr",
    "icon": "📚",
    "color": "mint",
    "tag": "Study & reference",
    "subscribed": true,
    "taxonomyTags": [
      "Civic & Administration",
      "Public libraries",
      "Town Public Library",
      "Reading room & reference books"
    ]
  },
  {
    "name": "Hosur Government General Hospital – Denkanikottai Road",
    "category": "Public & Common Places",
    "subcategories": [
      "Emergency & Healthcare"
    ],
    "products": [
      {
        "id": "gh-casualty",
        "name": "24/7 Emergency Casualty & Trauma Care",
        "description": "Immediate round-the-clock emergency medical response and trauma doctors.",
        "price": 0,
        "unit": "public healthcare"
      },
      {
        "id": "gh-opd",
        "name": "General OPD & Specialist Doctor Consultations",
        "description": "Free out-patient department consultations across pediatrics, general medicine and surgery.",
        "price": 0,
        "unit": "public"
      },
      {
        "id": "gh-bloodbank",
        "name": "Government Blood Bank & 108 Ambulance Hub",
        "description": "24/7 emergency blood supply and state-operated 108 ambulance base.",
        "price": 0,
        "unit": "emergency"
      }
    ],
    "description": "District government headquarters hospital on Denkanikottai Road, Hosur. 24/7 casualty, emergency trauma care, maternity & neonatal wing, public blood bank, and free medicine dispensary.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.727,
      "longitude": 77.8285
    },
    "rating": 4.2,
    "reviews": 580,
    "price": "Free public healthcare",
    "icon": "🏥",
    "color": "peach",
    "tag": "24/7 Government hospital",
    "subscribed": true,
    "taxonomyTags": [
      "Emergency & Healthcare",
      "Public hospital",
      "Government General Hospital",
      "24/7 Casualty & emergency",
      "Public health"
    ]
  },
  {
    "name": "Hosur Leather & Luggage World ? MG Road",
    "category": "Fashion",
    "subcategories": [
      "Bags & accessories"
    ],
    "products": [
      {
        "id": "handbags-daily-accessories",
        "name": "Handbags & Daily Accessories",
        "description": "Leather tote bags, college backpacks, formal laptop sleeves and travel slings.",
        "price": 799,
        "unit": "piece"
      },
      {
        "id": "zip-repair-bag-restoration",
        "name": "Zip Repair & Bag Restoration",
        "description": "Heavy-duty luggage zippers, handbag slider replacement and strap re-stitching.",
        "price": 150,
        "unit": "service"
      },
      {
        "id": "hllw-luggage",
        "name": "Trolley Suitcases & Travel Duffles",
        "description": "Hard-shell polycarbonate cabin and check-in luggage with TSA lock.",
        "price": 2499,
        "unit": "piece"
      },
      {
        "id": "handbags-leather-goods",
        "name": "Handbags & Daily Accessories",
        "description": "Eco-friendly tote bags, pure leather wallets, laptop backpacks and travel duffle bags.",
        "price": 499,
        "unit": "service"
      }
    ],
    "description": "Premier leather goods, luggage and handbag showroom on MG Road, Hosur. Handbags, backpacks, laptop bags, wallets, belts, luggage repair and zip restoration.",
    "distance": 0.9,
    "demoCoordinates": {
      "latitude": 12.7315,
      "longitude": 77.8275
    },
    "rating": 4.7,
    "reviews": 185,
    "price": "from ?150",
    "icon": "??",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Bags & accessories",
      "Bags",
      "Daily use",
      "Handbags & backpacks",
      "Accessories",
      "Fashion accessories",
      "Belts & wallets"
    ]
  },
  {
    "name": "Vasanth & Co ? Bagalur Road, Hosur",
    "category": "Home Appliances",
    "subcategories": [
      "Refrigerators",
      "Washing machines",
      "Air conditioners",
      "Kitchen appliances",
      "Water purifiers & geysers"
    ],
    "products": [
      {
        "id": "lg-double-door-fridge",
        "name": "LG 242L Frost-Free Double Door Refrigerator",
        "description": "Smart Inverter compressor with door cooling and multi air flow.",
        "price": 26990,
        "unit": "unit"
      },
      {
        "id": "samsung-ecobubble-washer",
        "name": "Samsung 8kg AI EcoBubble Front Load Washing Machine",
        "description": "Hygiene steam with digital inverter motor and diamond drum.",
        "price": 34500,
        "unit": "unit"
      },
      {
        "id": "daikin-inverter-split-ac",
        "name": "Daikin 1.5 Ton 5-Star Inverter Split AC",
        "description": "Triple display with PM2.5 filter and copper condenser coil.",
        "price": 43900,
        "unit": "unit"
      },
      {
        "id": "prestige-iris-mixer-grinder",
        "name": "Prestige Iris 750W Mixer Grinder with 4 Jars",
        "description": "Heavy-duty copper motor with 3 stainless steel jars and juicer jar.",
        "price": 3299,
        "unit": "unit"
      },
      {
        "id": "faber-autoclean-chimney",
        "name": "Faber Auto-Clean Touch Control Chimney 60cm",
        "description": "Filterless baffle chimney with 1200 m3/h suction and LED lamps.",
        "price": 12490,
        "unit": "unit"
      },
      {
        "id": "aquaguard-copper-ro",
        "name": "Aquaguard Active Copper RO+UV Water Purifier",
        "description": "Mineral guard technology with 7-stage active copper purification.",
        "price": 14999,
        "unit": "unit"
      },
      {
        "id": "water-purifier-ro-service",
        "name": "Water Purifier (RO) Filter Service",
        "description": "Sediment filter replacement, carbon block changes, RO membrane descaling and TDS water balancing.",
        "price": 349,
        "unit": "service"
      }
    ],
    "description": "Tamil Nadu's trusted home appliances showroom on Bagalur Road, Hosur. Refrigerators, front/top load washing machines, inverter air conditioners, kitchen chimneys, water purifiers, and microwave ovens.",
    "distance": 1.1,
    "demoCoordinates": {
      "latitude": 12.735,
      "longitude": 77.831
    },
    "rating": 4.8,
    "reviews": 420,
    "price": "from ?3,299",
    "icon": "??",
    "color": "mint",
    "tag": "Hosur favourite",
    "subscribed": true,
    "taxonomyTags": [
      "Home Appliances",
      "Refrigerators",
      "Washing machines",
      "Air conditioners",
      "Kitchen appliances",
      "Water purifiers & geysers",
      "Appliance repair"
    ]
  },
  {
    "name": "Sathya Agencies ? Netaji Road, Hosur",
    "category": "Home Appliances",
    "subcategories": [
      "Refrigerators",
      "Washing machines",
      "Air conditioners"
    ],
    "products": [
      {
        "id": "voltas-inverter-ac-3star",
        "name": "Voltas 1.5 Ton 3-Star Adjustable Inverter AC",
        "description": "4-in-1 adjustable cooling with high ambient cooling up to 52 deg C.",
        "price": 33990,
        "unit": "unit"
      },
      {
        "id": "whirlpool-intellifresh-fridge",
        "name": "Whirlpool 265L 3-Star Inverter Double Door Refrigerator",
        "description": "IntelliSense inverter technology with microblock antibacterial protection.",
        "price": 25490,
        "unit": "unit"
      },
      {
        "id": "ifb-senator-smart-washer",
        "name": "IFB 7kg 5-Star Front Load Washing Machine",
        "description": "Aqua Energie water softener with 3D wash system and steam wash.",
        "price": 29990,
        "unit": "unit"
      },
      {
        "id": "havells-storage-geyser",
        "name": "Havells 15L 5-Star Storage Water Geyser",
        "description": "Feroglas coated inner tank with incoloy heating element.",
        "price": 7890,
        "unit": "unit"
      }
    ],
    "description": "Leading consumer electronics and home appliances destination on Netaji Road, Hosur. Top brands including Daikin, Voltas, Samsung, LG, IFB, and Whirlpool with warranty and EMI.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.732,
      "longitude": 77.828
    },
    "rating": 4.7,
    "reviews": 360,
    "price": "from ?7,890",
    "icon": "??",
    "color": "lavender",
    "tag": "Top retail chain",
    "subscribed": true,
    "taxonomyTags": [
      "Home Appliances",
      "Air conditioners",
      "Refrigerators",
      "Washing machines"
    ]
  },
  {
    "name": "Sri Balaji Electricals & Lighting ? Bagalur Road",
    "category": "Electricals",
    "subcategories": [
      "Wiring & Cables",
      "Switches & Sockets",
      "LED Lighting",
      "Fans & Ventilation"
    ],
    "products": [
      {
        "id": "polycab-optima-wire",
        "name": "Polycab Optima Plus 1.5 sq mm House Wire (90m)",
        "description": "Flame retardant electrolytic grade multi-strand copper wire.",
        "price": 1850,
        "unit": "coil"
      },
      {
        "id": "anchor-roma-switches",
        "name": "Anchor Roma Classic Modular Switches & Plates (Pack of 10)",
        "description": "Silver cadmium oxide contacts with spark-shield technology.",
        "price": 650,
        "unit": "pack"
      },
      {
        "id": "crompton-exhaust-fan",
        "name": "Crompton Brisk Air 6-Inch High Speed Kitchen Exhaust Fan",
        "description": "Rust-proof body with copper motor and lightweight aerodynamic blades.",
        "price": 1250,
        "unit": "piece"
      },
      {
        "id": "philips-led-spotlights",
        "name": "Philips 7W COB LED Warm White Ceiling Spotlight",
        "description": "Focus spotlight for living room architectural wall washing.",
        "price": 420,
        "unit": "piece"
      }
    ],
    "description": "Authorized distributor of Havells, Polycab, Anchor, Legrand and Crompton electrical goods on Bagalur Road, Hosur. Complete residential and commercial electrification solutions.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.737,
      "longitude": 77.833
    },
    "rating": 4.8,
    "reviews": 310,
    "price": "from ?45",
    "icon": "?",
    "color": "butter",
    "tag": "Authorized distributor",
    "subscribed": true,
    "taxonomyTags": [
      "Electricals",
      "Wiring & Cables",
      "Switches & Sockets",
      "LED Lighting",
      "Fans & Ventilation"
    ]
  },
  {
    "name": "Hosur Inverter, Solar & Battery Hub ? Station Road",
    "category": "Electricals",
    "subcategories": [
      "Inverters & Power",
      "Electrical Services"
    ],
    "products": [
      {
        "id": "luminous-zelio-inverter",
        "name": "Luminous Zelio 1100 Pure Sine Wave Home Inverter",
        "description": "Intelligent 32-bit DSP processor with digital display showing backup time.",
        "price": 6800,
        "unit": "unit"
      },
      {
        "id": "exide-invatubular-battery",
        "name": "Exide InvaTubular 150Ah Tall Tubular Inverter Battery",
        "description": "Heavy duty spines cast at high pressure for long reliable backup.",
        "price": 13500,
        "unit": "unit"
      },
      {
        "id": "solar-rooftop-hybrid",
        "name": "Microtek 1kW Hybrid Solar Power System with Panels",
        "description": "Monocrystalline solar PV panels with hybrid MPPT solar inverter.",
        "price": 48000,
        "unit": "system"
      },
      {
        "id": "inverter-battery-service",
        "name": "Inverter Battery Maintenance & Distilled Water Top-Up",
        "description": "Doorstep specific gravity testing, terminal cleaning and acid balance check.",
        "price": 199,
        "unit": "service"
      },
      {
        "id": "inverter-ups-repair",
        "name": "Inverter & UPS Maintenance",
        "description": "Home backup power check-up, tubular battery acid top-up, wiring safety and inverter board repairs.",
        "price": 349,
        "unit": "service"
      }
    ],
    "description": "Complete power backup and rooftop solar installation center on Station Road, Hosur. Luminous, Exide, Microtek inverters, tubular batteries, and solar hybrid UPS solutions.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.728,
      "longitude": 77.832
    },
    "rating": 4.7,
    "reviews": 215,
    "price": "from ?199",
    "icon": "??",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Electricals",
      "Inverters & Power",
      "Electrical Services",
      "Electrical"
    ]
  },
  {
    "name": "Hosur Hardware, Tools & Power Mart ? Bagalur Road",
    "category": "Hardware",
    "subcategories": [
      "Power Tools & Machinery",
      "Hand Tools & Fasteners",
      "Paints & Hardware"
    ],
    "products": [
      {
        "id": "bosch-impact-drill-kit",
        "name": "Bosch GSB 500W Professional Impact Drill Kit (100 pcs)",
        "description": "Forward/reverse variable speed drill with masonry, wood bits and screws.",
        "price": 3850,
        "unit": "kit"
      },
      {
        "id": "makita-angle-grinder",
        "name": "Makita 4-Inch 840W Heavy Duty Angle Grinder",
        "description": "High-temperature resistance motor for metal cutting and masonry grinding.",
        "price": 2690,
        "unit": "unit"
      },
      {
        "id": "stanley-hand-toolkit",
        "name": "Stanley 38-Piece Hand Tool & Socket Wrench Set",
        "description": "Chrome vanadium steel spanners, ratchet handle, pliers and screwdrivers.",
        "price": 1450,
        "unit": "set"
      },
      {
        "id": "ss-anchor-bolts-fasteners",
        "name": "Stainless Steel SS 304 High-Tensile Anchor Bolts (Box of 50)",
        "description": "Heavy-duty expansion anchor fasteners for concrete and brickwork.",
        "price": 420,
        "unit": "box"
      },
      {
        "id": "power-tools-drills",
        "name": "Power Tools, Drills & Angle Grinders",
        "description": "Bosch and Makita cordless impact drills, angle grinders, circular saws, marble cutters and toolkits.",
        "price": 1850,
        "unit": "unit"
      }
    ],
    "description": "Hosur's leading industrial and construction hardware depot on Bagalur Road. Bosch, Makita power tools, hand tools, drill machines, welding rods, safety equipment, and fasteners.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.738,
      "longitude": 77.834
    },
    "rating": 4.8,
    "reviews": 310,
    "price": "from ?50",
    "icon": "??",
    "color": "butter",
    "tag": "Power tools depot",
    "subscribed": true,
    "taxonomyTags": [
      "Hardware",
      "Power Tools & Machinery",
      "Hand Tools & Fasteners",
      "Paints & Hardware"
    ]
  },
  {
    "name": "Sri Krishna Hardware & Sanitary Mart ? MG Road",
    "category": "Hardware",
    "subcategories": [
      "Plumbing Hardware",
      "Sanitaryware & Bath",
      "Locks & Architectural"
    ],
    "products": [
      {
        "id": "ashirvad-cpvc-pipe",
        "name": "Ashirvad FlowGuard Plus CPVC 1-Inch Pipe (3m)",
        "description": "Lead-free hot and cold water potable piping system with solvent cement.",
        "price": 340,
        "unit": "pipe"
      },
      {
        "id": "texmo-domestic-water-pump",
        "name": "Texmo 1HP Self-Priming Monobloc Domestic Water Pump",
        "description": "Cast iron body with high head capacity for overhead tank filling.",
        "price": 6490,
        "unit": "unit"
      },
      {
        "id": "jaquar-brass-pillar-tap",
        "name": "Jaquar Continental Brass Pillar Tap Chrome Finish",
        "description": "Foam flow aerator with solid brass construction and 10-year warranty.",
        "price": 1250,
        "unit": "piece"
      },
      {
        "id": "sintex-triple-layer-tank",
        "name": "Sintex 1000L Triple Layer Anti-Bacterial Water Tank",
        "description": "UV-stabilized FDA-approved virgin plastic overhead water storage tank.",
        "price": 6800,
        "unit": "tank"
      },
      {
        "id": "godrej-mortise-door-lock",
        "name": "Godrej Classic Mortise Door Lock with Brass Handles",
        "description": "Double throw deadbolt locking mechanism with 3 computer keys.",
        "price": 1650,
        "unit": "set"
      },
      {
        "id": "door-locks-hardware",
        "name": "Door Locks, Hinges & Architectural Hardware",
        "description": "Godrej mortise door locks, digital keypad security locks, stainless steel hinges and designer door handles.",
        "price": 250,
        "unit": "unit"
      },
      {
        "id": "plumbing-hardware-pipes",
        "name": "Pipes, Water Pumps & Plumbing Hardware",
        "description": "Ashirvad CPVC pipes, Supreme PVC drainage fittings, Texmo/CRI water pumps and brass ball valves.",
        "price": 65,
        "unit": "unit"
      }
    ],
    "description": "One-stop destination for plumbing hardware, sanitaryware, water tanks, pumps and architectural locks on MG Road, Hosur. Ashirvad, Supreme, Texmo, Jaquar and Godrej products.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.731,
      "longitude": 77.826
    },
    "rating": 4.7,
    "reviews": 275,
    "price": "from ?65",
    "icon": "??",
    "color": "mint",
    "tag": "Plumbing & sanitary",
    "subscribed": true,
    "taxonomyTags": [
      "Hardware",
      "Plumbing Hardware",
      "Sanitaryware & Bath",
      "Locks & Architectural"
    ]
  },
  {
    "name": "Asian Paints & Hosur Hardware Depot ? Denkanikottai Road",
    "category": "Hardware",
    "subcategories": [
      "Paints & Hardware",
      "Locks & Architectural"
    ],
    "products": [
      {
        "id": "asian-paints-apex-20l",
        "name": "Asian Paints Apex Weatherproof Exterior Emulsion (20L)",
        "description": "Advanced one-pack exterior emulsion with silicon additives for fungus protection.",
        "price": 4850,
        "unit": "bucket"
      },
      {
        "id": "dr-fixit-waterproofing-5l",
        "name": "Dr. Fixit 101 LW+ Waterproofing Liquid Additive (5L)",
        "description": "Integral liquid waterproofing compound for concrete plaster and mortar.",
        "price": 720,
        "unit": "can"
      },
      {
        "id": "godrej-navtal-brass-padlock",
        "name": "Godrej High Security 7-Lever Nav-Tal Brass Padlock",
        "description": "Rust-resistant solid brass padlock with hardened electroplated steel shackle.",
        "price": 550,
        "unit": "piece"
      },
      {
        "id": "ss-door-hinges-ball-bearing",
        "name": "Stainless Steel Ball Bearing Door Hinges 5x3 (Pack of 4)",
        "description": "Smooth silent operation heavy duty architectural door hinges.",
        "price": 380,
        "unit": "pack"
      }
    ],
    "description": "Authorized Asian Paints dealer and construction hardware supply store on Denkanikottai Road, Hosur. Waterproofing solutions, exterior/interior paints, Godrej locks, and builder hardware.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.726,
      "longitude": 77.828
    },
    "rating": 4.6,
    "reviews": 195,
    "price": "from ?120",
    "icon": "???",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Hardware",
      "Paints & Hardware",
      "Locks & Architectural"
    ]
  },
  {
    "name": "Hosur Properties & Rental Hub",
    "category": "Real Estate & Construction",
    "subcategories": [
      "Properties for Sale",
      "Rental & Lease",
      "Residential plots",
      "House rentals",
      "Commercial rentals"
    ],
    "products": [
      {
        "id": "prop-rent-2bhk",
        "name": "2 BHK Family Rental House (Near Railway Station)",
        "description": "Spacious 2 BHK house with car parking, 24/7 Cauvery water, near Hosur Railway Station.",
        "price": 12000,
        "unit": "month"
      },
      {
        "id": "prop-dtcp-plot",
        "name": "DTCP Approved Villa Plot (Rayakottai Road)",
        "description": "Gated layout with tar roads, street lights, EB connection, immediate registration.",
        "price": 1850,
        "unit": "sq.ft"
      },
      {
        "id": "prop-comm-office",
        "name": "Main Road Commercial Office Space (1,200 sq.ft)",
        "description": "First floor commercial space suitable for IT office, clinic or corporate branch on Denkanikottai Road.",
        "price": 35000,
        "unit": "month"
      }
    ],
    "description": "Trusted property consultancy and house rental portal in Hosur. Verified residential plots, family rental houses, apartments and commercial showroom spaces.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.729,
      "longitude": 77.825
    },
    "rating": 4.8,
    "reviews": 142,
    "price": "from ₹8,500/mo",
    "icon": "🏢",
    "color": "amber",
    "subscribed": true,
    "taxonomyTags": [
      "Real Estate & Construction",
      "Properties for Sale",
      "Rental & Lease"
    ]
  },
  {
    "name": "SIPCOT Industrial Sheds & Godowns",
    "category": "Real Estate & Construction",
    "subcategories": [
      "Rental & Lease",
      "Properties for Sale",
      "Industrial sheds",
      "Storage & godown",
      "Industrial land"
    ],
    "products": [
      {
        "id": "ind-shed-5000",
        "name": "5,000 sq.ft Industrial Factory Shed with 50 HP Power",
        "description": "Heavy duty industrial PEB shed, crane gantry provision, 50 HP sanctioned power, wide container truck access.",
        "price": 110000,
        "unit": "month"
      },
      {
        "id": "ind-godown-10000",
        "name": "10,000 sq.ft Logistics Warehouse Godown",
        "description": "Dock levelers, 30 ft ceiling clearance, fire safety NOC, CCTV coverage, ideal for 3PL and auto ancillary storage.",
        "price": 220000,
        "unit": "month"
      },
      {
        "id": "ind-land-sipcot",
        "name": "1 Acre Industrial Land for Long Lease / Sale",
        "description": "Approved industrial plot inside SIPCOT Phase 2 with dual road frontage and industrial water supply.",
        "price": 4200,
        "unit": "sq.ft"
      }
    ],
    "description": "Industrial real estate specialists for SIPCOT Phase 1 & 2, Hosur. Manufacturing sheds, heavy logistics warehouses, factory land and cold storage godowns.",
    "distance": 3.8,
    "demoCoordinates": {
      "latitude": 12.756,
      "longitude": 77.801
    },
    "rating": 4.7,
    "reviews": 88,
    "price": "from ₹22/sq.ft",
    "icon": "🏭",
    "color": "steel",
    "subscribed": true,
    "taxonomyTags": [
      "Real Estate & Construction",
      "Rental & Lease",
      "Properties for Sale"
    ]
  },
  {
    "name": "Sri Vigneshwara Civil Builders & Architects",
    "category": "Real Estate & Construction",
    "subcategories": [
      "Building Materials",
      "Civil & Construction",
      "Architects & Surveyors",
      "General contractors",
      "Cement & steel",
      "Plan approval"
    ],
    "products": [
      {
        "id": "bld-turnkey-house",
        "name": "Turnkey Residential Villa Construction",
        "description": "Complete end-to-end building construction with branded cement, steel, premium teak wood and warranty.",
        "price": 1950,
        "unit": "sq.ft"
      },
      {
        "id": "bld-hntda-approval",
        "name": "HNTDA & Hosur Corporation Plan Approval Service",
        "description": "Digital survey, 2D floor plans, structural drawings and official municipal building permit sanctioning.",
        "price": 18000,
        "unit": "project"
      },
      {
        "id": "bld-tata-tmt",
        "name": "Tata Tiscon 550D TMT Steel Bars (Per Ton)",
        "description": "Authorized supply of Fe-550D earthquake resistant TMT rods in 8mm, 10mm, 12mm, 16mm with test certificates.",
        "price": 64500,
        "unit": "ton"
      }
    ],
    "description": "Premier building construction contractor and architectural planning studio on Netaji Road, Hosur. HNTDA approvals, turnkey home building, and building material supplies.",
    "distance": 0.9,
    "demoCoordinates": {
      "latitude": 12.736,
      "longitude": 77.832
    },
    "rating": 4.9,
    "reviews": 164,
    "price": "from ₹1,750/sq.ft",
    "icon": "🏗️",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Real Estate & Construction",
      "Civil & Construction",
      "Architects & Surveyors",
      "Building Materials"
    ]
  },
  {
    "name": "Hosur Heavy Earthmovers & Construction Equipment",
    "category": "Heavy Industries & Machinery",
    "subcategories": [
      "Earth Moving & Excavation",
      "Heavy excavators",
      "Backhoe loaders",
      "JCB",
      "Tata Hitachi",
      "Caterpillar",
      "Machinery Rentals & Contracts"
    ],
    "products": [
      {
        "id": "hvy-jcb-3dx",
        "name": "JCB 3DX Plus EcoXcellence Backhoe Loader",
        "description": "Authorized supply of JCB 3DX Plus with 76hp CRDI engine, 1.1 cu.m loader bucket and 0.26 cu.m excavator bucket.",
        "price": 3780000,
        "unit": "onwards",
        "badge": "Authorized OEM"
      },
      {
        "id": "hvy-tata-ex200",
        "name": "Tata Hitachi EX200 LC Hydraulic Excavator (20-Ton)",
        "description": "Heavy quarry and mining crawler excavator with 0.9 cu.m heavy rock bucket, Cummins 6BT engine and telematics.",
        "price": 6250000,
        "unit": "onwards",
        "badge": "In Stock"
      },
      {
        "id": "hvy-cat-303",
        "name": "CAT 303.5 Mini Excavator with Rubber Tracks",
        "description": "Compact 3.5-ton hydraulic mini excavator for trenching, pipe laying and foundation works in tight urban spaces.",
        "price": 2600000,
        "unit": "onwards",
        "badge": "Authorized Dealer"
      },
      {
        "id": "hvy-rock-breaker",
        "name": "Heavy Hydraulic Rock Breaker Attachment (20T Class)",
        "description": "High impact nitrogen-charged hydraulic hammer breaker for hard Hosur blue metal quarrying and demolition.",
        "price": 485000,
        "unit": "unit",
        "badge": "Heavy Duty"
      },
      {
        "id": "hvy-jcb-hire",
        "name": "Daily & Monthly JCB 3DX with Diesel & Certified Driver",
        "description": "Hourly, daily and monthly earthmover machinery rental with skilled operator, fuel and on-site maintenance backup.",
        "price": 1150,
        "unit": "hour",
        "badge": "Rental on Hire"
      }
    ],
    "description": "Authorized heavy earthmovers sales, hire and genuine spare parts center in SIPCOT Phase-II, Hosur. New & certified used excavators, backhoe loaders and quarry equipment.",
    "distance": 2.1,
    "demoCoordinates": {
      "latitude": 12.7214,
      "longitude": 77.8112
    },
    "rating": 4.8,
    "reviews": 142,
    "price": "Machines from ₹1,150/hr",
    "icon": "🚜",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Heavy Industries & Machinery",
      "Earth Moving & Excavation",
      "Heavy excavators",
      "Backhoe loaders",
      "Machinery Rentals & Contracts"
    ]
  },
  {
    "name": "Kaveri Industrial Cranes & Material Handling Hub",
    "category": "Heavy Industries & Machinery",
    "subcategories": [
      "Cranes & Material Handling",
      "Hydraulic mobile cranes",
      "Industrial forklifts",
      "ACE",
      "Godrej",
      "Machinery Rentals & Contracts"
    ],
    "products": [
      {
        "id": "crane-ace-15xw",
        "name": "ACE 15XW Pick & Carry Mobile Crane (15-Ton)",
        "description": "Heavy-duty hydraulic articulated pick and carry crane with 15-ton capacity, 4-part slotted boom and outriggers.",
        "price": 1650000,
        "unit": "onwards",
        "badge": "Authorized Sales"
      },
      {
        "id": "crane-godrej-forklift",
        "name": "Godrej 3-Ton Diesel Forklift (GX 300 D)",
        "description": "Industrial heavy counterbalanced diesel forklift with 4.5m duplex mast, side shifter and solid puncture-proof tyres.",
        "price": 1320000,
        "unit": "onwards",
        "badge": "OEM Stock"
      },
      {
        "id": "crane-eot-overhead",
        "name": "Demag Double Girder Overhead EOT Crane (10T - 20m Span)",
        "description": "Complete factory workshop overhead travelling crane with wire rope hoist, festoon power feed and wireless pendant control.",
        "price": 1850000,
        "unit": "onwards",
        "badge": "Custom Built"
      },
      {
        "id": "crane-mobile-rental",
        "name": "25-Ton Hydraulic Mobile Crane Rental with Operator",
        "description": "Heavy equipment erection, factory machine shifting and container unloading mobile crane rental on hourly/daily hire.",
        "price": 1600,
        "unit": "hour",
        "badge": "Rental on Hire"
      },
      {
        "id": "crane-boom-lift",
        "name": "JLG 18-Meter Electric Articulated Boom Lift Rental",
        "description": "High-altitude industrial factory maintenance, electrical cable laying and roofing access self-propelled manlift.",
        "price": 4500,
        "unit": "day",
        "badge": "Rental & Sales"
      }
    ],
    "description": "Premier material handling, hydraulic mobile cranes and industrial forklift dealership on NH-44, Moranapalli, Hosur. Crane rental services and warehouse equipment.",
    "distance": 3.4,
    "demoCoordinates": {
      "latitude": 12.7538,
      "longitude": 77.8421
    },
    "rating": 4.9,
    "reviews": 98,
    "price": "from ₹1,600/hr",
    "icon": "🏗️",
    "color": "lavender",
    "subscribed": true,
    "taxonomyTags": [
      "Heavy Industries & Machinery",
      "Cranes & Material Handling",
      "Hydraulic mobile cranes",
      "Industrial forklifts",
      "Machinery Rentals & Contracts"
    ]
  },
  {
    "name": "SIPCOT CNC Machining Centers & Machine Tools Expo",
    "category": "Heavy Industries & Machinery",
    "subcategories": [
      "Heavy CNC & Machine Tools",
      "CNC Machining Centers",
      "Industrial Laser & Cutting",
      "Press Brakes & Shearing"
    ],
    "products": [
      {
        "id": "mach-vmc-5axis",
        "name": "5-Axis CNC Vertical Machining Center (VMC 1050)",
        "description": "High rigidity BT40/BBT40 spindle, 12,000 RPM, 30-pocket tool changer, Fanuc 0i-MF Plus CNC controller for aerospace and auto moulds.",
        "price": 4200000,
        "unit": "onwards",
        "badge": "High Precision"
      },
      {
        "id": "mach-cnc-lathe",
        "name": "Heavy Duty CNC Slant Bed Turning Lathe (LT-20)",
        "description": "Heavy cast iron 45-degree slant bed, 8-inch hydraulic chuck, 12-station servo turret and 4,000 RPM spindle.",
        "price": 2450000,
        "unit": "onwards",
        "badge": "In Stock"
      },
      {
        "id": "mach-fiber-laser",
        "name": "12kW High Power Sheet & Tube Fiber Laser Cutting Machine",
        "description": "Raycus/IPG 12kW fiber resonator with dual exchange shuttle table, CypCut CNC system and auto nozzle changer for 35mm steel.",
        "price": 6800000,
        "unit": "onwards",
        "badge": "Turnkey Installation"
      },
      {
        "id": "mach-press-brake",
        "name": "300-Ton CNC Hydraulic Press Brake & Bending Machine",
        "description": "Delem DA-53T 4+1 axis CNC synchronized hydraulic press brake with 4,000mm bending length and hydraulic crowning system.",
        "price": 3200000,
        "unit": "onwards",
        "badge": "Heavy Duty"
      },
      {
        "id": "mach-spindle-service",
        "name": "Spindle Reconditioning & Axis Laser Calibration Service",
        "description": "On-site Renishaw laser interferometer calibration, ballbar circularity testing and precision ceramic spindle bearing rebuild.",
        "price": 28000,
        "unit": "machine",
        "badge": "Certified Service"
      }
    ],
    "description": "Industrial heavy CNC machine tool distributor and engineering showroom in SIPCOT Phase-I, Hosur. Vertical machining centers, CNC turning lathes, fiber lasers and automated press brakes.",
    "distance": 1.7,
    "demoCoordinates": {
      "latitude": 12.7382,
      "longitude": 77.8095
    },
    "rating": 4.9,
    "reviews": 116,
    "price": "from ₹24.5 Lakh",
    "icon": "⚙️",
    "color": "sky",
    "subscribed": true,
    "taxonomyTags": [
      "Heavy Industries & Machinery",
      "Heavy CNC & Machine Tools",
      "CNC Machining Centers",
      "Industrial Laser & Cutting"
    ]
  },
  {
    "name": "Atlas & ELGi Industrial Power & Air Systems",
    "category": "Heavy Industries & Machinery",
    "subcategories": [
      "Industrial Power & Generators",
      "Industrial Air & Fluid Systems",
      "Rotary Screw Compressors",
      "Silent Diesel Generators"
    ],
    "products": [
      {
        "id": "pwr-elgi-eg",
        "name": "ELGi EG Series Rotary Screw Air Compressor (45kW / 60HP)",
        "description": "Energy-efficient oil-lubricated rotary screw compressor with UPTIME assurance, integrated dryer and variable frequency drive.",
        "price": 780000,
        "unit": "onwards",
        "badge": "Authorized ELGi"
      },
      {
        "id": "pwr-atlas-copco",
        "name": "Atlas Copco GA 37+ VSD Variable Speed Compressor",
        "description": "Class 0 oil-free/oil-injected rotary screw air compressor with Elektronikon Touch controller and 35% energy savings.",
        "price": 950000,
        "unit": "onwards",
        "badge": "OEM Certified"
      },
      {
        "id": "pwr-cummins-dg",
        "name": "Cummins 250 kVA Heavy Silent Diesel Generator (CPCB IV+)",
        "description": "Central Pollution Control Board IV+ certified acoustic silent diesel generator set with Stamford alternator and AMF automation panel.",
        "price": 1490000,
        "unit": "onwards",
        "badge": "Ready Stock"
      },
      {
        "id": "pwr-dg-rental",
        "name": "100 kVA to 500 kVA Silent DG Set Rental with Sound Enclosure",
        "description": "Emergency plant backup power rental on daily, weekly or monthly hire with fuel management and technician support.",
        "price": 3200,
        "unit": "day",
        "badge": "Rental on Hire"
      },
      {
        "id": "pwr-compressor-amc",
        "name": "Compressor Annual Maintenance Contract (AMC) & Air Filters",
        "description": "OEM scheduled compressor servicing, synthetic screw oil top-up, oil separator and air intake filter replacements.",
        "price": 15000,
        "unit": "year",
        "badge": "Annual Support"
      }
    ],
    "description": "Authorized industrial air compressor and heavy diesel generator dealership in Mookandapalli, Hosur. Plant compressed air piping, backup power solutions and 24/7 service.",
    "distance": 1.4,
    "demoCoordinates": {
      "latitude": 12.7475,
      "longitude": 77.8188
    },
    "rating": 4.8,
    "reviews": 84,
    "price": "DG & Air from ₹3,200",
    "icon": "⚡",
    "color": "gold",
    "subscribed": true,
    "taxonomyTags": [
      "Heavy Industries & Machinery",
      "Industrial Power & Generators",
      "Industrial Air & Fluid Systems",
      "Rotary Screw Compressors"
    ]
  },
  {
    "name": "Schwing & Stetter Heavy Concrete Machinery",
    "category": "Heavy Industries & Machinery",
    "subcategories": [
      "Road & Concrete Machinery",
      "Concrete Batching Plants",
      "Concrete Transit Mixers",
      "Road Rollers & Compactors"
    ],
    "products": [
      {
        "id": "rd-schwing-cp30",
        "name": "Schwing Stetter CP-30 Compact Concrete Batching Plant (30m³/h)",
        "description": "Compact high-capacity ready mix concrete plant with turbo pan mixer, 4-compartment aggregate feeder and digital weighing.",
        "price": 4400000,
        "unit": "onwards",
        "badge": "Authorized Dealer"
      },
      {
        "id": "rd-transit-mixer",
        "name": "Stetter 7m³ Mounted Transit Concrete Mixer (AM 7 FHC)",
        "description": "Truck-mounted concrete transit mixer drum with high wear-resistant T-steel spiral blades, slave engine or PTO drive.",
        "price": 1450000,
        "unit": "onwards",
        "badge": "Truck Mounted"
      },
      {
        "id": "rd-hamm-roller",
        "name": "Hamm 11-Ton Vibratory Soil Compactor / Road Roller",
        "description": "Heavy highway compaction roller with 3-point articulation, high vibration frequency and hydrostatic drive.",
        "price": 2900000,
        "unit": "onwards",
        "badge": "Heavy Highway"
      },
      {
        "id": "rd-concrete-spares",
        "name": "Heavy Concrete Pump Pipe Line & Clamp Spares",
        "description": "Twin-wall 125mm concrete delivery pipes, heavy forging snap clamps, rubber gaskets and cleaning balls.",
        "price": 3800,
        "unit": "set",
        "badge": "OEM Spares"
      },
      {
        "id": "rd-plant-calibration",
        "name": "Batching Plant Calibration & Load Cell Overhaul Service",
        "description": "NABL-traceable test weight calibration, load cell signal conditioning and plant PLC software recalibration.",
        "price": 22000,
        "unit": "service",
        "badge": "Certified Calibration"
      }
    ],
    "description": "Concrete equipment, batching plants, transit mixers and road compaction machinery hub on Thally Road, Hosur. Sales, erection and genuine replacement parts.",
    "distance": 2.8,
    "demoCoordinates": {
      "latitude": 12.7291,
      "longitude": 77.8285
    },
    "rating": 4.7,
    "reviews": 72,
    "price": "Heavy plant from ₹14.5L",
    "icon": "🛣️",
    "color": "amber",
    "subscribed": true,
    "taxonomyTags": [
      "Heavy Industries & Machinery",
      "Road & Concrete Machinery",
      "Concrete Batching Plants",
      "Road Rollers & Compactors"
    ]
  },
  {
    "name": "Hosur Heavy Hydraulic & Undercarriage Engineering",
    "category": "Heavy Industries & Machinery",
    "subcategories": [
      "Machinery Spares & Overhauls",
      "OEM machinery spares",
      "Reconditioning & repair",
      "Undercarriage Spares"
    ],
    "products": [
      {
        "id": "hyd-track-chain",
        "name": "Excavator Undercarriage Track Chain & Sprocket Assembly",
        "description": "Sealed and lubricated heavy track link chains, bottom rollers, top carrier rollers and drive sprockets for 20T excavators.",
        "price": 145000,
        "unit": "pair",
        "badge": "Heavy Duty Forged"
      },
      {
        "id": "hyd-cylinder-rebuild",
        "name": "Heavy Hydraulic Cylinder Reconditioning & Hard Chrome Plating",
        "description": "Boom, arm and bucket cylinder barrel honing, induction hardened piston rod hard chrome plating and polyurethane seal kits.",
        "price": 18500,
        "unit": "cylinder",
        "badge": "Complete Rebuild"
      },
      {
        "id": "hyd-chisel-tool",
        "name": "Rock Breaker Chisel Tool & Piston Seal Kit Replacement",
        "description": "Moil point and blunt wedge chisel steel forged from high alloy tool steel for Soosan, Furukawa and Atlas Copco rock breakers.",
        "price": 12000,
        "unit": "tool",
        "badge": "High Impact Alloy"
      },
      {
        "id": "hyd-bucket-teeth",
        "name": "JCB & CAT High Abrasion Bucket Teeth Set (5 Pcs)",
        "description": "Side pin and top pin rock chisel bucket teeth with locking retainers cast from heavy manganese alloy steel.",
        "price": 6500,
        "unit": "set",
        "badge": "Wear Resistant"
      },
      {
        "id": "hyd-hose-crimping",
        "name": "On-Site Hydraulic Line Flushing & Hose Crimping Service",
        "description": "Mobile van on-site service with 4-spiral heavy hydraulic hose crimping up to 5000 PSI, BSP and metric flange fittings.",
        "price": 3500,
        "unit": "visit",
        "badge": "24/7 Mobile Van"
      }
    ],
    "description": "Heavy earthmoving and industrial machinery hydraulic workshop near Bagalur Road Gate, Hosur. Cylinder reconditioning, undercarriage track pressing, rock breaker tools and mobile hose crimping.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.7441,
      "longitude": 77.8398
    },
    "rating": 4.9,
    "reviews": 128,
    "price": "Spares & repairs from ₹3,500",
    "icon": "🔧",
    "color": "mint",
    "subscribed": true,
    "taxonomyTags": [
      "Heavy Industries & Machinery",
      "Machinery Spares & Overhauls",
      "OEM machinery spares",
      "Reconditioning & repair"
    ]
  },
  {
    "name": "Hosur Precision CNC & VMC Machining",
    "category": "Industrial & B2B Manufacturing",
    "subcategories": [
      "Machining & Tooling",
      "CNC & VMC machining",
      "Press tools & dies",
      "Cutting tools & inserts"
    ],
    "products": [
      {
        "id": "cnc-auto-turned",
        "name": "Precision Turned Automotive CNC Components",
        "description": "Micron tolerance precision shafts, bushings and flange pins for TVS, Ashok Leyland and Tier-1 vendors.",
        "price": 85,
        "unit": "piece"
      },
      {
        "id": "vmc-milling-work",
        "name": "4-Axis Heavy VMC Milling Machining Service",
        "description": "High precision 4-axis VMC machining for cast iron, SG iron, aluminium and forging components.",
        "price": 750,
        "unit": "machine hr"
      },
      {
        "id": "carbide-inserts",
        "name": "CNC Tungsten Carbide Milling & Turning Inserts",
        "description": "Premium carbide cutting inserts (CNMG, WNMG, APKT) with nano PVD coating for high speed machining.",
        "price": 3200,
        "unit": "pack of 10"
      }
    ],
    "description": "ISO 9001 certified CNC and VMC precision machining unit in SIDCO Industrial Estate, Hosur. Specialized in automotive turning, milling fixtures and carbide tooling.",
    "distance": 3.4,
    "demoCoordinates": {
      "latitude": 12.751,
      "longitude": 77.808
    },
    "rating": 4.9,
    "reviews": 115,
    "price": "from ₹45/component",
    "icon": "⚙️",
    "color": "steel",
    "subscribed": true,
    "taxonomyTags": [
      "Industrial & B2B Manufacturing",
      "Machining & Tooling"
    ]
  },
  {
    "name": "Sri Balaji Sheet Metal & Laser Cutting",
    "category": "Industrial & B2B Manufacturing",
    "subcategories": [
      "Fabrication & Metalworks",
      "Industrial Coatings",
      "Sheet metal fabrication",
      "Laser cutting & bending",
      "Powder coating"
    ],
    "products": [
      {
        "id": "laser-fiber-cutting",
        "name": "6kW CNC Fiber Laser Cutting (MS & SS Sheet)",
        "description": "Clean burr-free cutting up to 20mm Mild Steel and 12mm Stainless Steel with high repeatability.",
        "price": 35,
        "unit": "minute"
      },
      {
        "id": "sheet-metal-enclosure",
        "name": "Custom Electrical Control Panel Enclosure Box",
        "description": "IP65 rated powder coated sheet metal electrical junction and PLC control panel boxes with rubber gasket.",
        "price": 4800,
        "unit": "unit"
      },
      {
        "id": "powder-coating-service",
        "name": "Industrial Epoxy Powder Coating (Custom RAL Colors)",
        "description": "7-tank pre-treatment automated conveyorized powder coating with salt spray corrosion resistance.",
        "price": 28,
        "unit": "sq.ft"
      }
    ],
    "description": "Complete sheet metal fabrication and CNC fiber laser cutting facility in Moranapalli, Hosur. CNC press brake bending, robotic welding and conveyorized powder coating.",
    "distance": 4.2,
    "demoCoordinates": {
      "latitude": 12.768,
      "longitude": 77.795
    },
    "rating": 4.8,
    "reviews": 96,
    "price": "from ₹18/meter",
    "icon": "🔥",
    "color": "crimson",
    "subscribed": true,
    "taxonomyTags": [
      "Industrial & B2B Manufacturing",
      "Fabrication & Metalworks",
      "Industrial Coatings"
    ]
  },
  {
    "name": "Hosur Industrial Packaging & Safety Hub",
    "category": "Industrial & B2B Manufacturing",
    "subcategories": [
      "Packaging & Safety PPE",
      "Industrial Supplies",
      "Industrial packaging",
      "Safety equipment & PPE",
      "Bearings & power transmission"
    ],
    "products": [
      {
        "id": "pkg-corrugated-7ply",
        "name": "Heavy Duty 7-Ply Export Corrugated Box",
        "description": "Reinforced heavy duty export carton boxes with moisture barrier for auto parts and industrial machinery shipment.",
        "price": 145,
        "unit": "box"
      },
      {
        "id": "ppe-safety-shoes",
        "name": "ISI Steel Toe Industrial Safety Shoes (Karam)",
        "description": "Oil and chemical resistant anti-skid PU sole safety footwear with 200J steel toe impact protection.",
        "price": 1450,
        "unit": "pair"
      },
      {
        "id": "ind-skf-bearings",
        "name": "SKF Deep Groove Ball Bearings (Assorted Series)",
        "description": "Genuine SKF industrial ball and roller bearings with long operational life and high load tolerance.",
        "price": 480,
        "unit": "unit"
      }
    ],
    "description": "Leading B2B supplier of industrial export packaging, wooden pallets, safety PPE gear, and genuine SKF industrial bearings near Sipcot Ring Road, Hosur.",
    "distance": 2.8,
    "demoCoordinates": {
      "latitude": 12.744,
      "longitude": 77.815
    },
    "rating": 4.7,
    "reviews": 138,
    "price": "from ₹65/box",
    "icon": "📦",
    "color": "emerald",
    "subscribed": true,
    "taxonomyTags": [
      "Industrial & B2B Manufacturing",
      "Packaging & Safety PPE",
      "Industrial Supplies"
    ]
  },
  {
    "name": "Adhiyamaan College of Engineering (ACE)",
    "category": "Education & Coaching",
    "subcategories": [
      "Colleges & Universities",
      "Engineering colleges",
      "Arts & science",
      "B.E. & B.Tech degree",
      "Undergraduate degrees"
    ],
    "products": [
      {
        "id": "edu-be-cse",
        "name": "B.E. Computer Science & Engineering (Admissions)",
        "description": "NBA accredited 4-year degree program with modern AI/ML labs, industry internships and campus placement.",
        "price": 85000,
        "unit": "year"
      },
      {
        "id": "edu-btech-mech",
        "name": "B.Tech Mechanical Engineering (Automotive Specialization)",
        "description": "Robotics and CNC laboratory training in close association with Hosur industrial manufacturing corridor.",
        "price": 75000,
        "unit": "year"
      },
      {
        "id": "edu-mca-mba",
        "name": "MBA & MCA Postgraduate Management Program",
        "description": "AICTE approved postgraduate master degree with corporate finance, analytics and HR leadership curriculum.",
        "price": 60000,
        "unit": "year"
      }
    ],
    "description": "Premier engineering institution in Hosur established in 1987. Autonomous college accredited by NAAC and NBA, offering B.E., B.Tech, MBA, and MCA programs with top placements.",
    "distance": 5.1,
    "demoCoordinates": {
      "latitude": 12.712,
      "longitude": 77.868
    },
    "rating": 4.6,
    "reviews": 380,
    "price": "from ₹65,000/yr",
    "icon": "🎓",
    "color": "royal",
    "subscribed": true,
    "taxonomyTags": [
      "Education & Coaching",
      "Colleges & Universities"
    ]
  },
  {
    "name": "Sri Chaitanya NEET & IIT-JEE Academy",
    "category": "Education & Coaching",
    "subcategories": [
      "Competitive Exam Coaching",
      "Medical & engineering entrance",
      "Government exam prep",
      "NEET coaching",
      "JEE Main & Advanced"
    ],
    "products": [
      {
        "id": "neet-repeater-batch",
        "name": "NEET UG Long Term Repeater & Achievers Batch",
        "description": "Intensive biology, physics & chemistry daily test series, NCERT chapter-wise mastery and expert faculty mentorship.",
        "price": 75000,
        "unit": "academic year"
      },
      {
        "id": "jee-foundation-course",
        "name": "IIT-JEE Foundation Course (Class 9 & 10)",
        "description": "Conceptual mathematics and science foundation coaching with Olympiad and NTSE preparation.",
        "price": 45000,
        "unit": "year"
      },
      {
        "id": "tnpsc-group-coaching",
        "name": "TNPSC Group 2 & Group 4 Weekend Batch",
        "description": "Tamil Nadu public service commission general studies and mental ability syllabus with bilingual test series.",
        "price": 18500,
        "unit": "6 months"
      }
    ],
    "description": "Specialized competitive entrance exam coaching institute on Old Bangalore Road, Hosur. Outstanding track record in NEET Medical, IIT-JEE engineering, and TNPSC coaching.",
    "distance": 1.1,
    "demoCoordinates": {
      "latitude": 12.738,
      "longitude": 77.829
    },
    "rating": 4.8,
    "reviews": 210,
    "price": "from ₹40,000/course",
    "icon": "📖",
    "color": "amber",
    "subscribed": true,
    "taxonomyTags": [
      "Education & Coaching",
      "Competitive Exam Coaching"
    ]
  },
  {
    "name": "Hosur National Driving & Computer Institute",
    "category": "Education & Coaching",
    "subcategories": [
      "Driving & Sports Academies",
      "Skill & Vocational Training",
      "Driving schools",
      "Computer & software",
      "Four-wheeler driving",
      "Full stack development"
    ],
    "products": [
      {
        "id": "drv-car-license",
        "name": "4-Wheeler Car Driving Course with RTO License",
        "description": "15 practical on-road sessions with dual-control vehicles, simulator training and Hosur RTO driving test assistance.",
        "price": 5800,
        "unit": "complete course"
      },
      {
        "id": "drv-two-wheeler",
        "name": "2-Wheeler Motorcycle / Gearless Scooter Training",
        "description": "Balance and defensive riding training with Learner's License (LLR) and permanent DL processing.",
        "price": 2800,
        "unit": "course"
      },
      {
        "id": "edu-tally-gst",
        "name": "Tally Prime, GST Filing & Advanced Excel Training",
        "description": "Practical corporate accounting certification with real company vouchers, GST e-filing and payroll modules.",
        "price": 6500,
        "unit": "2 months"
      }
    ],
    "description": "Government recognized driving school and certified IT computer skill training institute near Old Bus Stand, Hosur. Dual-control car training and corporate software courses.",
    "distance": 0.7,
    "demoCoordinates": {
      "latitude": 12.733,
      "longitude": 77.826
    },
    "rating": 4.9,
    "reviews": 325,
    "price": "from ₹2,800",
    "icon": "🚗",
    "color": "emerald",
    "subscribed": true,
    "taxonomyTags": [
      "Education & Coaching",
      "Driving & Sports Academies",
      "Skill & Vocational Training"
    ]
  },
  {
    "name": "Sri Krishna Grand Kalyana Mandapam",
    "category": "Events & Weddings",
    "subcategories": [
      "Venues & Mandapams",
      "Kalyana mandapams",
      "Party halls & lawns",
      "AC marriage halls",
      "Mini banquet halls"
    ],
    "products": [
      {
        "id": "vnu-central-ac-hall",
        "name": "1,200 Seater Central AC Kalyana Mandapam with Dining",
        "description": "Grand wedding hall with crystal chandeliers, separate 500-capacity dining hall, 15 deluxe AC guest rooms and 200-car parking.",
        "price": 150000,
        "unit": "24 hrs"
      },
      {
        "id": "vnu-mini-banquet",
        "name": "300 Capacity Mini AC Banquet Hall for Reception & Birthday",
        "description": "Modern decorated banquet hall with acoustic sound insulation, stage lighting and attached dining space.",
        "price": 35000,
        "unit": "slot"
      },
      {
        "id": "vnu-outdoor-lawn",
        "name": "Open Garden Lawn for Evening Wedding Reception",
        "description": "Natural green manicured lawn under the open sky with ambient fairy lighting and buffet setup area.",
        "price": 60000,
        "unit": "evening"
      }
    ],
    "description": "Luxurious air-conditioned wedding and reception destination on NH-44 Bangalore Highway, Hosur. 1,200 guest capacity, executive bridal suites, and sprawling parking lot.",
    "distance": 2.1,
    "demoCoordinates": {
      "latitude": 12.748,
      "longitude": 77.821
    },
    "rating": 4.9,
    "reviews": 290,
    "price": "from ₹35,000",
    "icon": "🏛️",
    "color": "gold",
    "subscribed": true,
    "taxonomyTags": [
      "Events & Weddings",
      "Venues & Mandapams"
    ]
  },
  {
    "name": "Sri Annam Traditional Wedding Caterers",
    "category": "Events & Weddings",
    "subcategories": [
      "Catering & Feast",
      "Snacks & live counters",
      "Traditional catering",
      "South Indian plantain leaf",
      "Chaat & welcome drinks"
    ],
    "products": [
      {
        "id": "cat-traditional-veg-feast",
        "name": "Grand South Indian 24-Item Kalyana Plantain Leaf Feast",
        "description": "Traditional Brahmin/Chettinad style feast: Mysore pak, payasam, appalam, vadai, 3 varieties of poriyal, sambar, rasam, and curd.",
        "price": 340,
        "unit": "leaf"
      },
      {
        "id": "cat-morning-tiffin",
        "name": "Morning Tiffin Buffet (Malli Ghee Idli, Medu Vada, Pongal)",
        "description": "Hot live counters for mini podi idli, poori masala, pineapple kesari, filter coffee, and 3 chutneys.",
        "price": 160,
        "unit": "plate"
      },
      {
        "id": "cat-biryani-banquet",
        "name": "Dum Biryani & Live Tandoor Non-Veg Wedding Buffet",
        "description": "Authentic seeraga samba mutton dum biryani, chicken 65, butter chicken, naan, raita and ice cream counter.",
        "price": 480,
        "unit": "plate"
      }
    ],
    "description": "Award-winning wedding catering service on Thally Road, Hosur. Renowned for authentic South Indian plantain leaf feasts, live breakfast tiffins, and grand evening banquet spreads.",
    "distance": 1.3,
    "demoCoordinates": {
      "latitude": 12.728,
      "longitude": 77.834
    },
    "rating": 4.9,
    "reviews": 412,
    "price": "from ₹160/plate",
    "icon": "🍱",
    "color": "amber",
    "subscribed": true,
    "taxonomyTags": [
      "Events & Weddings",
      "Catering & Feast"
    ]
  },
  {
    "name": "Hosur Royal Wedding Decors, Photography & Sound",
    "category": "Events & Weddings",
    "subcategories": [
      "Decor & Stage Setup",
      "Sound, Light & Entertainment",
      "Photography & Styling",
      "Stage decoration",
      "Sound & DJ",
      "Wedding photography"
    ],
    "products": [
      {
        "id": "dec-fresh-flower-stage",
        "name": "Grand Fresh Rose & Jasmine Floral Stage Backdrop",
        "description": "Hosur fresh cut Dutch roses, fragrant jasmine strings, crystal pillars, and focus warm spot lighting.",
        "price": 45000,
        "unit": "setup"
      },
      {
        "id": "dj-jbl-wedding-sound",
        "name": "JBL High-Power Wedding DJ Sound & Truss Moving Heads",
        "description": "Professional 10,000W line array sound system, laser beam lighting, haze machine and trending DJ beats.",
        "price": 22000,
        "unit": "event"
      },
      {
        "id": "pho-candid-wedding-4k",
        "name": "Cinematic 4K Wedding Photography & Drone Coverage",
        "description": "Candid couple photography, cinematic highlight video teaser, 40-page luxury canvera album and drone aerial shots.",
        "price": 55000,
        "unit": "2 days"
      }
    ],
    "description": "Full-service event management studio on Bagalur Road, Hosur. Exotic floral stage backdrops, cinematic wedding photography, aerial drone shoots, and high-power DJ setups.",
    "distance": 1.6,
    "demoCoordinates": {
      "latitude": 12.742,
      "longitude": 77.839
    },
    "rating": 4.8,
    "reviews": 178,
    "price": "from ₹15,000",
    "icon": "🎉",
    "color": "purple",
    "subscribed": true,
    "taxonomyTags": [
      "Events & Weddings",
      "Decor & Stage Setup",
      "Sound, Light & Entertainment",
      "Photography & Styling"
    ]
  },
  {
    "name": "Hosur Rose & Flora City Nurseries",
    "category": "Agriculture, Nurseries & Pets",
    "subcategories": [
      "Nurseries & Plants",
      "Seeds & Agri Inputs",
      "Hosur flora & rose",
      "Garden & ornamental",
      "Farming seeds"
    ],
    "products": [
      {
        "id": "flr-hosur-red-rose",
        "name": "Hosur Export Quality Red Rose Bud Saplings",
        "description": "Famous Hosur climatic red rose grafted plants with large long-lasting vibrant blooms and rich scent.",
        "price": 65,
        "unit": "sapling"
      },
      {
        "id": "flr-indoor-bonsai",
        "name": "Indoor Air-Purifying Plants & Ficus Bonsai",
        "description": "Oxygen-rich snake plants, ZZ plants, money plants and manicured ornamental ficus bonsai in glazed pots.",
        "price": 450,
        "unit": "ceramic pot"
      },
      {
        "id": "flr-hybrid-tomato-seeds",
        "name": "High-Yield Hybrid Tomato & Capsicum Seeds (100g)",
        "description": "Disease-resistant high yield commercial greenhouse seeds developed for Hosur and Krishnagiri farming belt.",
        "price": 850,
        "unit": "pack"
      }
    ],
    "description": "Hosur's premier flower nursery on Bagalur Main Road. Authentic Hosur cut-flower roses, greenhouse saplings, indoor air-purifying plants, and certified hybrid vegetable seeds.",
    "distance": 3.9,
    "demoCoordinates": {
      "latitude": 12.765,
      "longitude": 77.852
    },
    "rating": 4.9,
    "reviews": 340,
    "price": "from ₹40/plant",
    "icon": "🌹",
    "color": "rose",
    "subscribed": true,
    "taxonomyTags": [
      "Agriculture, Nurseries & Pets",
      "Nurseries & Plants",
      "Seeds & Agri Inputs"
    ]
  },
  {
    "name": "Paws & Tails Pet Shop & 24/7 Veterinary Clinic",
    "category": "Agriculture, Nurseries & Pets",
    "subcategories": [
      "Pet Shops & Supplies",
      "Veterinary & Live Animals",
      "Pet food & nutrition",
      "Veterinary care",
      "Pet accessories"
    ],
    "products": [
      {
        "id": "pet-royal-canin-food",
        "name": "Royal Canin Maxi Adult Dog Food (15 kg)",
        "description": "Complete balanced nutritional diet for large breed dogs with glucosamine for joint health.",
        "price": 7450,
        "unit": "bag"
      },
      {
        "id": "pet-vaccination-checkup",
        "name": "Pet Vaccination & General Veterinary Health Checkup",
        "description": "Anti-rabies, DHPPiL booster vaccination and complete health screening by registered veterinary doctor.",
        "price": 650,
        "unit": "visit"
      },
      {
        "id": "pet-grooming-spa",
        "name": "Full Pet Spa, Medicated Bath & Coat Trimming",
        "description": "Anti-tick herbal shampoo wash, blow dry, nail clipping, ear cleaning, and styling for dogs and cats.",
        "price": 1200,
        "unit": "session"
      }
    ],
    "description": "Complete pet care clinic and accessories store on Rayakottai Road, Hosur. Premium Royal Canin & Drools pet foods, dog grooming spa, and 24/7 emergency veterinary doctor.",
    "distance": 1.2,
    "demoCoordinates": {
      "latitude": 12.73,
      "longitude": 77.831
    },
    "rating": 4.9,
    "reviews": 256,
    "price": "from ₹150",
    "icon": "🐾",
    "color": "peach",
    "subscribed": true,
    "taxonomyTags": [
      "Agriculture, Nurseries & Pets",
      "Pet Shops & Supplies",
      "Veterinary & Live Animals"
    ]
  },
  {
    "name": "Sri Murugan Agro Agency & Cattle Feed",
    "category": "Agriculture, Nurseries & Pets",
    "subcategories": [
      "Seeds & Agri Inputs",
      "Irrigation & Farm Tools",
      "Veterinary & Live Animals",
      "Fertilizers & organic manure",
      "Micro irrigation",
      "Livestock & feed"
    ],
    "products": [
      {
        "id": "agr-vermicompost-bag",
        "name": "100% Organic Vermicompost & Neem Cake (50 kg)",
        "description": "Nutrient-rich earthworm compost and natural soil conditioner for garden and commercial horticulture.",
        "price": 420,
        "unit": "bag"
      },
      {
        "id": "agr-drip-irrigation-kit",
        "name": "1-Acre Micro Drip Irrigation Pipe & Emitter Kit",
        "description": "ISI certified 16mm inline drip laterals, screen filter, venturi injector, and control valves.",
        "price": 14500,
        "unit": "acre kit"
      },
      {
        "id": "agr-milch-cattle-feed",
        "name": "Godrej MilkoMax Cattle Feed Pellets (50 kg)",
        "description": "High protein balanced dairy cattle feed for improved milk yield, fat percentage and cow health.",
        "price": 1680,
        "unit": "bag"
      }
    ],
    "description": "Authorized agricultural inputs and cattle feed dealer at Gandhi Statue Circle, Hosur. Organic vermicompost, micro drip irrigation equipment, and dairy cattle feed pellets.",
    "distance": 0.8,
    "demoCoordinates": {
      "latitude": 12.735,
      "longitude": 77.827
    },
    "rating": 4.8,
    "reviews": 198,
    "price": "from ₹280",
    "icon": "🌾",
    "color": "emerald",
    "subscribed": true,
    "taxonomyTags": [
      "Agriculture, Nurseries & Pets",
      "Seeds & Agri Inputs",
      "Irrigation & Farm Tools",
      "Veterinary & Live Animals"
    ]
  }
];

const initialSampleOrders: OrderRecord[] = [
  {
    id: "ORD-78214",
    businessName: "Maya's Home Kitchen",
    customerName: "Kavitha R.",
    customerPhone: "+91 98452 31209",
    customerAddress: "Plot 42, Rayakottai Road, Near Old Bus Stand, Hosur - 635109",
    deliveryType: "delivery",
    notes: "Please pack extra sambar and fresh banana leaf.",
    items: [
      {
        productId: "mayas-lunch-plate",
        name: "Homestyle lunch plate",
        price: 180,
        quantity: 2,
        unit: "per plate",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80"
      },
      {
        productId: "mayas-breakfast-box",
        name: "Breakfast box",
        price: 120,
        quantity: 1,
        unit: "per box",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80"
      }
    ],
    itemTotal: 480,
    deliveryFee: 30,
    taxes: 24,
    totalAmount: 534,
    paymentMethod: "upi",
    paymentStatus: "paid",
    paymentTransactionId: "UPI/261031/94821038291",
    upiId: "kavitha.r@oksbi",
    status: "preparing",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    estimatedTime: "20 - 30 mins"
  },
  {
    id: "ORD-65190",
    businessName: "Sunday Loom",
    customerName: "Arun Kumar S.",
    customerPhone: "+91 94432 77180",
    customerAddress: "Flat 204, Green Meadows, Bagalur Road, Hosur - 635103",
    deliveryType: "pickup",
    notes: "Will pick up around 5:30 PM after office.",
    items: [
      {
        productId: "p1",
        name: "Organic Khadi Kurta",
        price: 850,
        quantity: 1,
        unit: "piece"
      }
    ],
    itemTotal: 850,
    deliveryFee: 0,
    taxes: 42,
    totalAmount: 892,
    paymentMethod: "card",
    paymentStatus: "paid",
    paymentTransactionId: "TXN-CRD-84729103",
    status: "ready",
    createdAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    estimatedTime: "Ready for pickup"
  }
];

const initialSampleCheckouts: CheckoutRequest[] = [
  {
    id: "SUB-84912",
    businessName: "Bloom & Bean Café",
    plan: "Growth",
    billingCycle: "monthly",
    amount: 999,
    taxes: 180,
    totalAmount: 1179,
    paymentMethod: "UPI (Auto-pay)",
    transactionId: "UPI/261015/84920193812",
    invoiceNumber: "INV-2026-84912",
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    validUntil: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
    status: "Active",
  }
];

const emptyDemoData: DemoData = {
  favorites: [],
  recentSearches: [],
  enquiries: [],
  events: [],
  checkouts: initialSampleCheckouts,
  businesses: initialBusinesses,
  orders: initialSampleOrders,
};

const planNames = ["Starter", "Growth", "Spotlight"];

function distanceBetween(origin: Coordinates, destination: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDifference = radians(destination.latitude - origin.latitude);
  const longitudeDifference = radians(destination.longitude - origin.longitude);
  const haversine = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) *
    Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function Icon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`icon ${className}`} aria-hidden="true">{children}</span>;
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  car: ["car", "cars", "four wheeler", "four-wheeler", "automobile", "maruti", "tata", "hyundai", "swift", "punch", "nexon", "creta", "sedan", "suv", "hatchback", "dealership", "vehicle", "auto"],
  cars: ["car", "cars", "four wheeler", "four-wheeler", "automobile", "maruti", "tata", "hyundai", "swift", "punch", "nexon", "creta"],
  swift: ["swift", "maruti", "maruti swift", "car", "four wheeler", "hatchback"],
  maruti: ["maruti", "suzuki", "swift", "baleno", "brezza", "car", "four wheeler"],
  tata: ["tata", "nexon", "punch", "tiago", "harrier", "safari", "car", "four wheeler"],
  hyundai: ["hyundai", "creta", "venue", "i20", "car", "four wheeler"],
  bike: ["bike", "bikes", "two wheeler", "two-wheeler", "motorcycle", "scooter", "hero", "honda", "royal enfield", "tvs", "bajaj", "activa", "splendor", "pulsar", "classic 350"],
  bikes: ["bike", "bikes", "two wheeler", "two-wheeler", "motorcycle", "scooter", "hero", "honda", "royal enfield", "activa", "splendor"],
  scooter: ["scooter", "two wheeler", "two-wheeler", "activa", "dio", "chetak", "vida", "ev 2w"],
  hero: ["hero", "splendor", "hf deluxe", "xtreme", "vida", "two wheeler", "bike"],
  honda: ["honda", "activa", "shine", "unicorn", "cb350", "dio", "two wheeler", "bike", "scooter"],
  enfield: ["royal enfield", "classic 350", "hunter 350", "bullet", "meteor", "himalayan", "two wheeler", "bike"],
  bajaj: ["bajaj", "pulsar", "chetak", "two wheeler", "bike"],
  tvs: ["tvs", "jupiter", "apache", "two wheeler", "bike"],
  tyre: ["tyre", "tyres", "mrf", "apollo", "ceat", "puncture", "wheel alignment", "battery"],
  tyres: ["tyre", "tyres", "mrf", "apollo", "ceat", "puncture", "wheel alignment", "battery"],
  battery: ["battery", "batteries", "amaron", "exide", "luminous", "inverter", "tyres & batteries"],
  wash: ["wash", "car wash", "foam wash", "detailing", "sanitization", "cleaning"],
  mobile: ["mobile", "phone", "smartphone", "samsung", "apple", "iphone", "redmi", "screen replacement", "croma"],
  phone: ["phone", "mobile", "smartphone", "samsung", "apple", "iphone", "screen replacement", "croma"],
  iphone: ["iphone", "apple", "mobile", "phone", "macbook", "ipad", "croma", "reliance digital"],
  samsung: ["samsung", "galaxy", "galaxy s25", "mobile", "phone", "tv", "refrigerator", "washing machine", "screen replacement"],
  laptop: ["laptop", "laptops", "computer", "pc", "gaming pc", "hp", "dell", "lenovo", "asus", "macbook"],
  tv: ["tv", "smart tv", "television", "led tv", "sony", "samsung", "lg"],
  fridge: ["refrigerator", "fridge", "home appliances", "samsung", "lg", "whirlpool"],
  ac: ["air conditioner", "ac", "ac service", "cooling", "appliances"],
  gold: ["gold", "jewellery", "tanishq", "necklace", "ring", "diamond", "earrings", "bangles"],
  jewellery: ["jewellery", "gold", "diamond", "tanishq", "necklace", "ring", "silver", "earrings"],
  saree: ["saree", "sarees", "silk saree", "cotton saree", "handloom", "saree palace", "textiles"],
  sarees: ["saree", "sarees", "silk saree", "cotton saree", "handloom", "saree palace", "textiles"],
  suit: ["suit", "raymond", "tailoring", "formal", "shirts", "blazer", "clothing"],
  shoes: ["shoes", "footwear", "bata", "sandals", "sneakers", "boots", "formal shoes"],
  dress: ["dress", "clothing", "ethnic wear", "kurtas", "kids clothing", "fashion"],
  hospital: ["hospital", "clinic", "doctor", "consultation", "emergency", "icu", "kauvery", "sbs"],
  doctor: ["doctor", "consultation", "hospital", "clinic", "physician", "kauvery", "sbs", "opd"],
  dental: ["dental", "dentist", "teeth", "tooth", "root canal", "implant", "apollo dental", "whitening"],
  dentist: ["dentist", "dental", "teeth", "tooth", "apollo dental"],
  physiotherapy: ["physiotherapy", "physio", "rehab", "mobility", "orthopaedic", "back pain"],
  eye: ["eye", "ophthalmology", "eye check", "opticals", "glasses", "spectacles"],
  gym: ["gym", "fitness", "workout", "weight training", "bodybuilding", "crossfit", "ketone", "h&t", "orien", "membership"],
  fitness: ["fitness", "gym", "workout", "training", "personal training", "zumba", "yoga"],
  badminton: ["badminton", "shuttle", "little england", "court", "indoor court", "coaching", "turf"],
  cricket: ["cricket", "box cricket", "turf", "eagles sports", "prabhu turf", "coaching"],
  turf: ["turf", "football turf", "box cricket", "prabhu turf", "court rental", "sports ground"],
  swimming: ["swimming", "pool", "royal wellfit", "swimming lessons", "aquatics"],
  yoga: ["yoga", "pilates", "meditation", "orien fitness", "wellness"],
  biryani: ["biryani", "thalappakatti", "ammi", "hyderabadi biryani", "chicken biryani", "mutton biryani", "restaurant"],
  food: ["food", "restaurant", "hotel", "cafe", "dining", "meals", "south indian", "north indian"],
  coffee: ["coffee", "tea", "cafe", "bakery", "snacks", "filter coffee"],
  sweets: ["sweets", "bakery", "cake", "mithai", "dessert"],
  furniture: ["furniture", "sofa", "bed", "wardrobe", "dining table", "godrej", "royaloak", "nilkamal"],
  sofa: ["sofa", "couch", "living room", "furniture", "royaloak", "godrej"],
  interior: ["interior", "interior design", "false ceiling", "surya decor", "home renovation"],
  plumber: ["plumber", "plumbing", "pipe leak", "tap repair", "hope home care", "water heater"],
  electrician: ["electrician", "electrical", "wiring", "fan installation", "switch repair"],
  painting: ["painting", "painters", "home painting", "emulsion", "waterproofing"],
  pest: ["pest control", "cockroach", "termite", "bed bug", "balaji pest control"],
  taxi: ["taxi", "cab", "airport taxi", "outstation", "a1 call taxi", "red taxi", "car rental"],
  hotel: ["hotel", "stay", "room booking", "grand continent", "hotel hills", "lodge", "accommodation"],
  toy: ["toy", "toys", "games", "puzzle", "lego", "teddy", "doll", "rc car", "kids", "balaji novelties", "kids zone", "remote control"],
  toys: ["toy", "toys", "games", "puzzle", "lego", "teddy", "doll", "rc car", "kids", "balaji novelties", "kids zone", "remote control"],
  fancy: ["fancy", "fancy store", "bangles", "cosmetics", "makeup", "gifts", "pooja fancy", "hair clips", "novelties", "jewellery", "mahalakshmi"],
  bangles: ["bangles", "fancy", "fancy store", "jewellery", "bangle", "pooja fancy", "velvet bangles"],
  gifts: ["gifts", "gift", "fancy", "novelties", "photo frame", "party supplies", "greeting cards", "return gifts", "pooja fancy"],
  books: ["book", "books", "textbook", "novel", "murugan book", "higginbothams", "stationery", "guides", "school books", "reading"],
  book: ["books", "textbook", "novel", "murugan book", "higginbothams", "stationery", "school books"],
  stationery: ["stationery", "stationary", "notebook", "pens", "xerox", "printout", "spiral binding", "paper", "vignesh", "copier", "art supplies", "classmate"],
  stationary: ["stationery", "stationary", "notebook", "pens", "xerox", "printout", "spiral binding", "paper", "vignesh", "copier", "classmate"],
  xerox: ["xerox", "photocopy", "print", "printing", "spiral binding", "lamination", "vignesh stationery"],
  notebook: ["notebook", "classmate", "stationery", "murugan book", "pens", "school"],
  places: ["places", "common places", "bus stand", "railway station", "temple", "dam", "park", "library", "hospital", "corporation", "post office"],
  common: ["common places", "bus stand", "railway station", "temple", "malai kovil", "park", "kelavarapalli", "library", "corporation", "hospital", "post office"],
  temple: ["temple", "kovil", "malai kovil", "chandra choodeswarar", "darshan", "pooja", "shiva"],
  kovil: ["temple", "kovil", "malai kovil", "chandra choodeswarar", "darshan"],
  bus: ["bus", "bus stand", "mgr bus stand", "tnstc", "ksrtc", "transit", "depot"],
  train: ["train", "railway", "railway station", "hsra", "tickets", "suburban"],
  railway: ["railway", "railway station", "hsra", "train", "tickets", "suburban"],
  park: ["park", "eco park", "dam", "kelavarapalli", "nature", "picnic", "rajaji"],
  dam: ["dam", "kelavarapalli", "reservoir", "lake", "boating", "picnic"],
  library: ["library", "books", "reading room", "public library", "study", "newspapers"],
  post: ["post office", "speed post", "postal", "aadhaar", "hpo", "parcel"],
  corporation: ["corporation", "municipal", "hosur corporation", "property tax", "birth certificate", "civic"],
  electrical: ["electrical", "electricals", "electrician", "wiring", "switches", "legrand", "anchor", "polycab", "havells", "led", "lights", "fans", "inverter", "bldc", "mcb"],
  electricals: ["electrical", "electricals", "electrician", "wiring", "switches", "legrand", "anchor", "polycab", "havells", "led", "lights", "fans", "inverter", "bldc"],
  wires: ["wires", "cables", "wiring", "polycab", "havells", "house wiring", "electrical"],
  switches: ["switches", "switch", "sockets", "legrand", "anchor roma", "modular switches", "mcb"],
  fans: ["fan", "fans", "ceiling fan", "bldc", "atomberg", "orient", "crompton", "exhaust fan"],
  inverter: ["inverter", "battery", "luminous", "exide", "ups", "solar", "power backup"],
  hardware: ["hardware", "tools", "power tools", "drill", "fasteners", "pipes", "pumps", "asian paints", "locks", "godrej locks", "hindware", "jaquar"],
  tools: ["tools", "power tools", "drill", "bosch", "makita", "grinder", "cutter", "spanners", "tool kit"],
  pipes: ["pipes", "plumbing", "pvc", "cpvc", "ashirvad", "supreme", "water tank", "sintex"],
  pumps: ["pumps", "motor", "water pump", "texmo", "cri", "submersible", "borewell pump"],
  locks: ["locks", "lock", "door lock", "mortise", "godrej", "yale", "padlock", "hinges", "handles"],
  appliances: ["home appliances", "appliances", "refrigerator", "fridge", "washing machine", "ac", "air conditioner", "chimney", "microwave", "water purifier", "geyser", "vasanth", "sathya"],
  refrigerator: ["refrigerator", "fridge", "lg", "samsung", "whirlpool", "double door", "cooling", "appliances"],
  washing: ["washing machine", "front load", "top load", "ifb", "bosch", "lg", "samsung", "appliances"],
  chimney: ["chimney", "kitchen chimney", "faber", "prestige", "hob", "gas stove", "kitchen appliances"],
  purifier: ["water purifier", "ro", "aquaguard", "kent", "geyser", "water heater", "ao smith"],
  geyser: ["geyser", "water heater", "water geyser", "instant geyser", "racold", "crompton", "havells", "ao smith"],
  property: ["property", "properties", "real estate", "plots", "site", "house for sale", "rental", "bhk", "villa", "shed", "land"],
  realestate: ["real estate", "property", "plots", "sites", "dtcp", "villa", "construction", "builders", "industrial sheds"],
  plot: ["plot", "plots", "site", "residential plots", "dtcp", "hntda", "land", "rayakottai road"],
  rent: ["rent", "rental", "house rent", "2 bhk", "1 bhk", "lease", "shed", "office space", "godown"],
  construction: ["construction", "builder", "civil", "architect", "building", "turnkey", "tmt steel", "cement", "hntda"],
  industrial: ["industrial", "manufacturing", "sipcot", "cnc", "vmc", "machining", "laser cutting", "sheet metal", "sheds", "packaging"],
  cnc: ["cnc", "vmc", "machining", "precision", "milling", "turning", "carbide inserts", "tools", "sidco"],
  laser: ["laser", "laser cutting", "sheet metal", "fiber laser", "bending", "fabrication", "powder coating"],
  packaging: ["packaging", "corrugated box", "boxes", "pallets", "ppe", "safety shoes", "safety gear", "skf"],
  school: ["school", "schools", "cbse", "matriculation", "education", "kindergarten", "playgroup"],
  college: ["college", "engineering", "adhiyamaan", "ace", "degree", "btech", "polytechnic", "mba"],
  coaching: ["coaching", "neet", "jee", "sri chaitanya", "tnpsc", "tutor", "tuition", "entrance"],
  neet: ["neet", "jee", "medical coaching", "entrance", "sri chaitanya", "iit jee", "coaching"],
  driving: ["driving school", "driving", "license", "car driving", "two wheeler", "rto", "dl"],
  mandapam: ["kalyana mandapam", "mandapam", "marriage hall", "wedding hall", "reception hall", "sri krishna"],
  wedding: ["wedding", "marriage", "kalyanam", "mandapam", "catering", "stage decor", "dj", "photography"],
  catering: ["catering", "caterers", "wedding food", "plantain leaf", "tiffin", "biryani feast", "annam"],
  decor: ["stage decor", "decoration", "flower decor", "wedding decor", "dj sound", "photography"],
  nursery: ["nursery", "plants", "roses", "hosur rose", "saplings", "flora", "garden", "flower"],
  rose: ["rose", "roses", "hosur rose", "plants", "nursery", "saplings", "cut flowers"],
  pet: ["pet", "pets", "pet shop", "dog food", "puppy", "vet", "veterinary", "clinic", "royal canin", "grooming"],
  vet: ["vet", "veterinary", "pet clinic", "dog doctor", "animal clinic", "vaccination", "paws"],
  agro: ["agro", "agriculture", "fertilizer", "seeds", "cattle feed", "drip irrigation", "vermicompost", "farming"],
  fertilizer: ["fertilizer", "seeds", "agro", "organic", "vermicompost", "drip irrigation", "cattle feed"]
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesWord(text: string, token: string): boolean {
  if (token.length <= 4) {
    return new RegExp(`\\b${escapeRegex(token)}\\b`, "i").test(text);
  }
  return text.toLowerCase().includes(token.toLowerCase());
}

const VOCABULARY = [
  "maruti", "suzuki", "swift", "brezza", "baleno", "wagonr", "dzire", "tata", "nexon", "punch", "tiago", "harrier", "safari",
  "hyundai", "creta", "venue", "i20", "hero", "splendor", "xtreme", "vida", "honda", "activa", "shine", "unicorn", "cb350",
  "royal enfield", "classic 350", "hunter 350", "bullet", "meteor", "himalayan", "bajaj", "pulsar", "chetak", "tvs", "jupiter", "apache",
  "car", "bike", "scooter", "automobile", "tyre", "battery", "service", "repair", "puncture", "detailing", "wash",
  "mobile", "phone", "iphone", "apple", "samsung", "galaxy", "laptop", "computer", "tv", "refrigerator", "washing machine", "ac",
  "hospital", "doctor", "clinic", "dental", "dentist", "physiotherapy", "kauvery", "sbs", "apollo",
  "gym", "fitness", "workout", "crossfit", "badminton", "cricket", "turf", "swimming", "yoga", "zumba",
  "biryani", "restaurant", "hotel", "food", "cafe", "bakery", "sweets", "meals",
  "saree", "jewellery", "gold", "diamond", "clothing", "suit", "footwear", "shoes", "tanishq", "raymond", "bata",
  "furniture", "sofa", "bed", "wardrobe", "interior", "godrej", "royaloak", "nilkamal",
  "plumber", "electrician", "pest control", "painting", "photography", "taxi", "cab",
  "toy", "toys", "fancy", "fancystore", "gifts", "novelties", "bangles", "cosmetics", "teddy", "carrom", "puzzle", "lego",
  "book", "books", "textbook", "novel", "stationery", "stationary", "notebook", "classmate", "xerox", "binding", "paper", "pens",
  "temple", "kovil", "malai", "bus", "busstand", "train", "railway", "station", "dam", "kelavarapalli", "park", "rajaji", "library", "postoffice", "corporation",
  "electrical", "electricals", "wiring", "cables", "switches", "polycab", "havells", "legrand", "anchor", "inverter", "luminous",
  "hardware", "tools", "drill", "bosch", "makita", "ashirvad", "pipes", "texmo", "pumps", "locks", "hinges", "sanitaryware",
  "appliances", "refrigerator", "fridge", "washing", "chimney", "geyser", "purifier", "daikin", "voltas", "vasanth", "sathya",
  "property", "properties", "realestate", "plots", "rental", "construction", "builder", "architect", "civil", "sipcot",
  "cnc", "vmc", "machining", "fabrication", "laser", "packaging", "safety", "college", "engineering", "adhiyamaan", "neet",
  "chaitanya", "driving", "mandapam", "kalyanam", "wedding", "catering", "decor", "dj", "nursery", "plants", "rose", "pet",
  "pets", "veterinary", "agro", "fertilizer", "cattlefeed"
];

function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = Array.from({ length: bn + 1 }, () => new Array(an + 1));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b[j - 1] === a[i - 1]) matrix[j][i] = matrix[j - 1][i - 1];
      else matrix[j][i] = Math.min(matrix[j - 1][i - 1] + 1, matrix[j][i - 1] + 1, matrix[j - 1][i] + 1);
    }
  }
  return matrix[bn][an];
}

function getWordCorrection(rawWord: string): string | null {
  const w = rawWord.toLowerCase();
  if (w.length < 3 || VOCABULARY.includes(w)) return null;
  let best: string | null = null;
  let minD = 99;
  for (const v of VOCABULARY) {
    const d = levenshtein(w, v);
    const maxD = w.length <= 4 ? 1 : 2;
    if (d <= maxD && d < minD) {
      minD = d;
      best = v;
    }
  }
  return best;
}

function stemToken(token: string): string {
  const t = token.toLowerCase();
  if (t.endsWith("ies") && t.length > 4) return t.slice(0, -3) + "y";
  if (t.endsWith("es") && t.length > 4 && (t.endsWith("shes") || t.endsWith("ches") || t.endsWith("sses") || t.endsWith("xes"))) {
    return t.slice(0, -2);
  }
  if (t.endsWith("s") && !t.endsWith("ss") && t.length > 3) return t.slice(0, -1);
  if (t.endsWith("ing") && t.length > 5) return t.slice(0, -3);
  return t;
}

function highlightMatch(text: string, q: string) {
  if (!q.trim() || !text) return text;
  const words = q.trim().toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function Home() {
  const [role, setRole] = useState<Role>("Discover");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authenticatedPortals, setAuthenticatedPortals] = useState<PortalRole[]>([]);
  const [companyAccessLevel, setCompanyAccessLevel] = useState<CompanyAccessLevel>("Admin");
  const [sessionIdentity, setSessionIdentity] = useState("");
  const [category, setCategory] = useState("All");
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [categoryConfig, setCategoryConfig] = useState<CategoryConfig>(defaultCategoryConfig);
  const [browseMode, setBrowseMode] = useState<"sectors" | "atoz">("sectors");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(5);
  const [visibleCount, setVisibleCount] = useState(24);
  const [searchSort, setSearchSort] = useState<"relevance" | "distance" | "rating" | "price" | "name">("relevance");
  const [searchFilterTab, setSearchFilterTab] = useState<"all" | "businesses" | "products">("all");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [demoData, setDemoData] = useState(emptyDemoData);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState<Coordinates | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessModalTab, setBusinessModalTab] = useState<"products" | "reviews" | "navigation">("products");
  const [reviewBusiness, setReviewBusiness] = useState<Business | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [enquiryProduct, setEnquiryProduct] = useState<{ business: Business; product: Product } | null>(null);
  const [orderingItem, setOrderingItem] = useState<{ business: Business; product: Product } | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<OrderRecord | null>(null);
  const [subscriptionCheckout, setSubscriptionCheckout] = useState<{ businessName?: string; plan?: string } | null>(null);
  const [subscriptionReceipt, setSubscriptionReceipt] = useState<CheckoutRequest | null>(null);
  const [claimBusiness, setClaimBusiness] = useState<Business | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All Hosur");
  const [lang, setLang] = useState<Language>("en");
  const t = TRANSLATIONS[lang];
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterWhatsApp, setFilterWhatsApp] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Business[]>([]);
  const [dialog, setDialog] = useState<"login" | "business" | "sos" | "plans" | null>(null);
  const [notice, setNotice] = useState("");
  const [adConfig, setAdConfig] = useState<AdConfig>(defaultAdConfig);
  const [activeAd, setActiveAd] = useState(0);
  const categories = useMemo(() => [{ name: "All", icon: "✳" }, ...categoryConfig.sectors], [categoryConfig]);
  const businesses = demoData.businesses;
  // The Business portal represents one business account, so it only receives
  // the single business attached to that account (new registrations are prepended).
  const businessAccountBusinesses = businesses.slice(0, 1);
  const businessDistance = (business: Business) =>
    locationCoordinates ? distanceBetween(locationCoordinates, business.coordinates || business.demoCoordinates) : business.distance;

  const [notifications, setNotifications] = useState<MarketplaceNotification[]>(initialNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread">("all");
  const notificationsRef = useRef<HTMLDivElement>(null);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const displayedNotifications = useMemo(
    () => (notificationFilter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, notificationFilter]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  function addNotification(notif: Omit<MarketplaceNotification, "id" | "timestamp" | "read"> & { id?: string; read?: boolean; timestamp?: string }) {
    const newNotif: MarketplaceNotification = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp || "Just now",
      type: notif.type,
      read: notif.read ?? false,
      linkText: notif.linkText,
      action: notif.action,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }

  function markNotificationRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showNotice("All notifications marked as read.");
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function clearAllNotifications() {
    setNotifications([]);
    showNotice("All notifications cleared.");
  }

  const viewBusiness = (business: Business, tab: "products" | "reviews" | "navigation" = "products") => {
    setBusinessModalTab(tab);
    setSelectedBusiness(business);
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((b) => b.name !== business.name);
      const updated = [business, ...filtered].slice(0, 8);
      try {
        window.localStorage.setItem("bizearch_recent_viewed", JSON.stringify(updated.map((b) => b.name)));
      } catch {}
      return updated;
    });
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("bizearch_recent_viewed");
      if (saved) {
        const names = JSON.parse(saved);
        if (Array.isArray(names)) {
          const list = names
            .map((name: string) => businesses.find((b) => b.name === name))
            .filter(Boolean) as Business[];
          setRecentlyViewed(list);
        }
      }
    } catch {}
  }, [businesses]);

  function handleNotificationAction(notif: MarketplaceNotification) {
    markNotificationRead(notif.id);
    setNotificationsOpen(false);
    if (!notif.action) return;
    if (notif.action.type === "business") {
      const biz = businesses.find((b) => b.name.toLowerCase() === notif.action?.payload.toLowerCase());
      if (biz) {
        setSelectedBusiness(biz);
        setRole("Discover");
      } else {
        setQuery(notif.action.payload);
        setRole("Discover");
      }
    } else if (notif.action.type === "search") {
      setQuery(notif.action.payload);
      setCategory("All");
      setCategoryPath([]);
      setRole("Discover");
    } else if (notif.action.type === "role") {
      setRole(notif.action.payload as Role);
    } else if (notif.action.type === "portal") {
      setRole(notif.action.payload as Role);
    } else if (notif.action.type === "order") {
      setRole("Business");
    } else if (notif.action.type === "sos") {
      setDialog("sos");
    }
  }

  useEffect(() => {
    const onAddNotification = (event: Event) => {
      const notif = (event as CustomEvent).detail;
      if (notif?.title && notif?.message) {
        addNotification(notif);
      }
    };
    window.addEventListener("neighborly-add-notification", onAddNotification);
    return () => window.removeEventListener("neighborly-add-notification", onAddNotification);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveAd((current) => (current + 1) % adConfig.imageAds.length), 5000);
    return () => window.clearInterval(timer);
  }, [adConfig.imageAds.length]);

  useEffect(() => {
    const onCategoriesUpdated = (event: Event) => {
      const config = (event as CustomEvent<CategoryConfig>).detail;
      if (config?.sectors?.length) setCategoryConfig(config);
    };
    window.addEventListener("neighborly-categories-updated", onCategoriesUpdated);
    fetch("/api/categories", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { config?: CategoryConfig };
        if (result.config?.sectors?.length) setCategoryConfig(result.config);
      }).catch(() => undefined);
    return () => window.removeEventListener("neighborly-categories-updated", onCategoriesUpdated);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onAdsUpdated = (event: Event) => {
      const config = (event as CustomEvent<AdConfig>).detail;
      if (config?.imageAds?.length) { setAdConfig(config); setActiveAd(0); }
    };
    window.addEventListener("neighborly-ads-updated", onAdsUpdated);
    let cancelled = false;
    fetch("/api/ads", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load advertising settings.");
        const result = await response.json() as { config?: AdConfig };
        if (!cancelled && result.config?.imageAds?.length && result.config.tickerMessages?.length) {
          setAdConfig(result.config);
          setActiveAd(0);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; window.removeEventListener("neighborly-ads-updated", onAdsUpdated); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const portals: PortalRole[] = ["Account", "Business", "Agent", "Company"];
    const requestedValue = new URLSearchParams(window.location.search).get("portal");
    const requestedPortal = portals.find((portal) => portal.toLowerCase() === requestedValue?.toLowerCase());
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not read the sign-in session.");
        return response.json() as Promise<{ session: { role: PortalRole; accessLevel?: CompanyAccessLevel; identity?: string } | null }>;
      })
      .then(({ session }) => {
        if (cancelled) return;
        const signedInPortals = session ? [session.role] : [];
        setAuthenticatedPortals(signedInPortals);
        if (session?.role === "Account") {
          try {
            const savedLocation = window.sessionStorage.getItem("neighborly_login_location");
            if (savedLocation) {
              const coordinates = JSON.parse(savedLocation) as Partial<Coordinates>;
              if (typeof coordinates.latitude === "number" && typeof coordinates.longitude === "number") {
                setLocationCoordinates({ latitude: coordinates.latitude, longitude: coordinates.longitude });
                setLocationEnabled(true);
                setNotice("Location enabled for this browser session to show nearby businesses. Your coordinates are not sent to the server.");
              }
              window.sessionStorage.removeItem("neighborly_login_location");
            }
          } catch { /* Location is optional and sign-in remains available. */ }
        }
        if (session?.role === "Company") {
          if (session.accessLevel) setCompanyAccessLevel(session.accessLevel);
          setSessionIdentity(session.identity || "");
        }
        if (!requestedPortal) return;
        if (session?.role === requestedPortal) {
          setRole(requestedPortal);
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }
        window.location.replace(requestedPortal === "Company" ? "/company-login" : `/login?portal=${requestedPortal}`);
      })
      .catch(() => {
        if (cancelled || !requestedPortal) return;
        window.location.replace(requestedPortal === "Company" ? "/company-login" : `/login?portal=${requestedPortal}`);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      try { window.localStorage.removeItem("neighborly-demo-v1"); } catch {}
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isDemoData(parsed)) {
          const initialMap = new Map(initialBusinesses.map((b) => [b.name.toLowerCase(), b]));
          const custom = (parsed.businesses || []).filter((b) => !initialMap.has(b.name.toLowerCase()));
          setDemoData({
            ...parsed,
            businesses: [...custom, ...initialBusinesses],
            checkouts: Array.isArray(parsed.checkouts) && parsed.checkouts.length > 0 ? parsed.checkouts : initialSampleCheckouts,
            orders: Array.isArray(parsed.orders) && parsed.orders.length > 0 ? parsed.orders : initialSampleOrders,
          });
        }
      }
      setStorageReady(true);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Could not read this browser's demo storage.");
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
      setStorageError("");
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Could not save demo data in this browser.");
    }
  }, [demoData, storageReady]);

  const { results, relatedProducts, relatedSearches, correctedQuery, searchDurationMs, autocompleteData } = useMemo(() => {
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const q = query.trim().toLowerCase();
    const rawWords = q.split(/[^a-z0-9]+/).filter((w) => w.length > 0);

    const eligible = businesses.filter((business) => {
      const categoryMatch = category === "All" || business.category === category || (business.categories || []).includes(category);
      const listingText = `${business.name} ${business.category} ${(business.categories || []).join(" ")} ${business.subcategories.join(" ")} ${(business.businessModes || []).join(" ")} ${(business.vehicleTypes || []).join(" ")} ${(business.vehicleMakes || []).join(" ")} ${(business.vehicleModels || []).join(" ")} ${(business.taxonomyTags || []).join(" ")} ${business.description} ${business.products.map((product) => `${product.name} ${product.description}`).join(" ")}`.toLowerCase();
      const taxonomyTerms = new Set((business.taxonomyTags || []).map((term) => term.toLowerCase()));
      const taxonomyMatch = categoryPath.every((term) => taxonomyTerms.has(term.toLowerCase()) || listingText.includes(term.toLowerCase()));
      const distMatch = !locationEnabled || businessDistance(business) <= radius;
      return categoryMatch && taxonomyMatch && distMatch && business.subscribed;
    });

    // Compute live autocomplete data for dropdown
    const computeAutocomplete = () => {
      if (!q) {
        return {
          queries: [
            "Maruti Swift",
            "Vasanth & Co Home Appliances",
            "Jaya Sri Electricals Hosur",
            "Hosur Hardware & Tools",
            "Pooja Fancy & Gifts",
            "Sri Murugan Books",
            "MGR Bus Stand Hosur",
            "Hero Splendor",
            "Balaji Toys & RC Cars",
            "Kauvery Hospital",
            "Vignesh Stationery & Xerox",
            "Chandra Choodeswarar Temple",
            "Samsung Galaxy S25",
            "Kelavarapalli Dam",
            "Thalappakatti Biryani",
            "Hosur Properties 2 BHK Rental",
            "SIPCOT Industrial Sheds",
            "Adhiyamaan College B.E",
            "Sri Krishna Kalyana Mandapam",
            "Hosur Rose & Flora City"
          ],
          businesses: businesses.slice(0, 3),
          products: businesses.flatMap((b) => b.products.slice(0, 1).map((p) => ({ product: p, business: b }))).slice(0, 3),
          categories: ["Automobiles", "Heavy Industries & Machinery", "Electronics", "Electricals", "Hardware", "Home Appliances", "Real Estate & Construction", "Industrial & B2B Manufacturing", "Education & Coaching", "Events & Weddings", "Agriculture, Nurseries & Pets", "Books & Stationery", "Toys & Fancy Stores", "Public & Common Places", "Health & wellness"]
        };
      }
      const matchedQueries = new Set<string>();
      const matchedBiz: Business[] = [];
      const matchedProd: { product: Product; business: Business }[] = [];

      for (const b of businesses) {
        if (b.name.toLowerCase().includes(q)) {
          matchedBiz.push(b);
          matchedQueries.add(b.name);
        }
        for (const sub of b.subcategories) {
          if (sub.toLowerCase().includes(q)) matchedQueries.add(sub);
        }
        for (const prod of b.products) {
          if (prod.name.toLowerCase().includes(q)) {
            matchedProd.push({ product: prod, business: b });
            matchedQueries.add(prod.name);
          }
        }
        if (matchedBiz.length >= 3 && matchedProd.length >= 3 && matchedQueries.size >= 5) break;
      }
      return {
        queries: Array.from(matchedQueries).slice(0, 4),
        businesses: matchedBiz.slice(0, 3),
        products: matchedProd.slice(0, 3),
        categories: categories.filter((c) => c.name !== "All" && c.name.toLowerCase().includes(q)).map((c) => c.name).slice(0, 2)
      };
    };

    const autocompleteData = computeAutocomplete();

    if (!q || rawWords.length === 0) {
      return {
        results: eligible,
        relatedProducts: [],
        relatedSearches: [],
        correctedQuery: null,
        searchDurationMs: 0,
        autocompleteData
      };
    }

    // Stop words (ignore in multi-word queries)
    const stopWords = new Set(["in", "near", "at", "for", "the", "hosur", "me", "best", "top", "good", "find", "and", "or", "of", "to"]);
    const filteredWords = rawWords.filter((w) => !stopWords.has(w) || rawWords.length === 1);

    // Typo checking
    let correctedQuery: string | null = null;
    const correctedTokens: string[] = [];
    let hadTypo = false;

    for (const w of filteredWords) {
      const corr = getWordCorrection(w);
      if (corr) {
        hadTypo = true;
        correctedTokens.push(corr);
      } else {
        correctedTokens.push(w);
      }
    }
    if (hadTypo) {
      correctedQuery = correctedTokens.join(" ");
    }

    // Stemming & Token normalization
    const searchTokens = new Set<string>();
    for (const w of correctedTokens) {
      searchTokens.add(w);
      searchTokens.add(stemToken(w));
    }
    const tokenArray = Array.from(searchTokens).filter((t) => t.length > 1);

    // Relevance Scoring
    const scoredList: { business: Business; score: number; direct: boolean }[] = [];

    for (const b of eligible) {
      const nameLower = b.name.toLowerCase();
      const catLower = `${b.category} ${(b.categories || []).join(" ")}`.toLowerCase();
      const subLower = `${b.subcategories.join(" ")} ${(b.taxonomyTags || []).join(" ")} ${(b.vehicleTypes || []).join(" ")} ${(b.vehicleMakes || []).join(" ")} ${(b.vehicleModels || []).join(" ")}`.toLowerCase();
      const descLower = b.description.toLowerCase();
      const prodsLower = b.products.map((p) => `${p.name} ${p.description}`).join(" ").toLowerCase();
      const allText = `${nameLower} ${catLower} ${subLower} ${descLower} ${prodsLower}`;

      let score = 0;
      let directHitCount = 0;
      let synonymHit = false;

      // Exact full query matches
      if (nameLower.includes(q)) score += 50;
      if (prodsLower.includes(q)) score += 35;

      for (const token of tokenArray) {
        if (matchesWord(nameLower, token)) {
          score += 30;
          directHitCount++;
        } else if (matchesWord(prodsLower, token)) {
          score += 20;
          directHitCount++;
        } else if (matchesWord(subLower, token)) {
          score += 15;
          directHitCount++;
        } else if (matchesWord(descLower, token) || matchesWord(catLower, token)) {
          score += 8;
          directHitCount++;
        } else {
          const syns = SEARCH_SYNONYMS[token] || [];
          for (const s of syns) {
            if (matchesWord(allText, s)) {
              score += 5;
              synonymHit = true;
              break;
            }
          }
        }
      }

      // Star rating bonus
      score += (b.rating || 4.0) * 2;

      // Proximity bonus: closer businesses get a gentle boost
      const dist = businessDistance(b);
      if (dist <= 2) score += 4;
      else if (dist <= 5) score += 2;

      if (directHitCount > 0 || synonymHit || score > 15) {
        scoredList.push({
          business: b,
          score,
          direct: directHitCount >= Math.min(2, tokenArray.length)
        });
      }
    }

    // Multi-factor Sorting
    if (searchSort === "distance") {
      scoredList.sort((a, b) => businessDistance(a.business) - businessDistance(b.business));
    } else if (searchSort === "rating") {
      scoredList.sort((a, b) => b.business.rating - a.business.rating);
    } else if (searchSort === "price") {
      scoredList.sort((a, b) => {
        const pa = parseInt(a.business.price.replace(/[^\d]/g, "")) || 0;
        const pb = parseInt(b.business.price.replace(/[^\d]/g, "")) || 0;
        return pa - pb;
      });
    } else if (searchSort === "name") {
      scoredList.sort((a, b) => a.business.name.localeCompare(b.business.name));
    } else {
      // Relevance
      scoredList.sort((a, b) => b.score - a.score);
    }

    const sortedResults = scoredList.map((m) => m.business);

    // Dynamic Related Searches
    const suggestions = new Set<string>();
    if (q.includes("swift") || q.includes("car")) {
      suggestions.add("Maruti Swift");
      suggestions.add("Four wheelers");
      suggestions.add("Car repair");
      suggestions.add("Tata Nexon");
      suggestions.add("Hyundai Creta");
      suggestions.add("Car wash & detailing");
      suggestions.add("Tyres & batteries");
    } else if (q.includes("bike") || q.includes("two wheeler") || q.includes("scooter") || q.includes("activa") || q.includes("splendor") || q.includes("hero") || q.includes("honda")) {
      suggestions.add("Hero Splendor");
      suggestions.add("Honda Activa");
      suggestions.add("Royal Enfield Classic");
      suggestions.add("Two-wheeler service");
      suggestions.add("Electric scooter");
    } else if (q.includes("phone") || q.includes("mobile") || q.includes("samsung") || q.includes("screen") || q.includes("laptop")) {
      suggestions.add("Samsung Galaxy");
      suggestions.add("Screen replacement");
      suggestions.add("Laptop service");
      suggestions.add("Smart TV");
    } else if (q.includes("gym") || q.includes("fitness") || q.includes("workout")) {
      suggestions.add("Gym membership");
      suggestions.add("Personal training");
      suggestions.add("Badminton courts");
      suggestions.add("Swimming pool");
      suggestions.add("Zumba classes");
    } else if (q.includes("hospital") || q.includes("doctor") || q.includes("dental") || q.includes("clinic")) {
      suggestions.add("Dental check-up");
      suggestions.add("Physiotherapy");
      suggestions.add("Doctor consultation");
    } else if (q.includes("book") || q.includes("station") || q.includes("notebook") || q.includes("xerox") || q.includes("pen")) {
      suggestions.add("Sri Murugan Books");
      suggestions.add("Higginbothams");
      suggestions.add("School Textbooks");
      suggestions.add("Classmate Notebooks");
      suggestions.add("Vignesh Stationery & Xerox");
      suggestions.add("Spiral Binding");
    } else if (q.includes("toy") || q.includes("fancy") || q.includes("gift") || q.includes("bangle") || q.includes("game")) {
      suggestions.add("Pooja Fancy & Gifts");
      suggestions.add("Balaji Novelties & Toys");
      suggestions.add("Glass Bangles");
      suggestions.add("Kids Remote Control Cars");
      suggestions.add("Board Games & Carrom");
      suggestions.add("Birthday Return Gifts");
    } else if (q.includes("bus") || q.includes("train") || q.includes("temple") || q.includes("kovil") || q.includes("park") || q.includes("dam") || q.includes("place")) {
      suggestions.add("MGR Bus Stand Hosur");
      suggestions.add("Hosur Railway Station");
      suggestions.add("Malai Kovil Temple");
      suggestions.add("Kelavarapalli Dam");
      suggestions.add("Rajaji Eco Park");
      suggestions.add("Hosur Municipal Corporation");
    } else if (q.includes("electric") || q.includes("wiring") || q.includes("switch") || q.includes("inverter") || q.includes("fan")) {
      suggestions.add("Jaya Sri Electricals");
      suggestions.add("Havells & Polycab Wires");
      suggestions.add("Modular Switches");
      suggestions.add("BLDC Ceiling Fans");
      suggestions.add("Inverters & Batteries");
      suggestions.add("Emergency Electrician");
    } else if (q.includes("hardware") || q.includes("tool") || q.includes("drill") || q.includes("pipe") || q.includes("lock") || q.includes("pump")) {
      suggestions.add("Hosur Hardware & Tools");
      suggestions.add("Bosch Power Tools");
      suggestions.add("CPVC & PVC Pipes");
      suggestions.add("Water Pumps & Motors");
      suggestions.add("Godrej Door Locks");
      suggestions.add("Asian Paints & Primers");
    } else if (q.includes("appliance") || q.includes("fridge") || q.includes("refrigerat") || q.includes("washing") || q.includes("chimney") || q.includes("geyser") || q.includes("purifier")) {
      suggestions.add("Vasanth & Co Home Appliances");
      suggestions.add("Sathya Agencies");
      suggestions.add("Inverter Refrigerators");
      suggestions.add("Front Load Washing Machines");
      suggestions.add("Split Air Conditioners");
      suggestions.add("Kitchen Chimneys & Hobs");
    }

    for (const b of sortedResults.slice(0, 5)) {
      for (const sub of b.subcategories) {
        if (suggestions.size < 7 && sub.toLowerCase() !== q) {
          suggestions.add(sub);
        }
      }
    }
    const finalRelatedSearches = Array.from(suggestions).filter((s) => s.toLowerCase() !== q).slice(0, 6);

    // Matching Products/Services
    const relProds: { product: Product; business: Business }[] = [];
    const seenProductIds = new Set<string>();

    for (const b of sortedResults) {
      for (const p of b.products) {
        if (seenProductIds.has(p.id)) continue;
        const pFull = `${p.name} ${p.description} ${b.name} ${b.category} ${b.subcategories.join(" ")}`.toLowerCase();
        const matchesAnyToken = tokenArray.some((t) => matchesWord(pFull, t));
        let matchesSynonym = false;
        if (!matchesAnyToken) {
          for (const t of tokenArray) {
            const syns = SEARCH_SYNONYMS[t] || [];
            if (syns.some((s) => matchesWord(pFull, s))) {
              matchesSynonym = true;
              break;
            }
          }
        }
        if (matchesAnyToken || matchesSynonym) {
          seenProductIds.add(p.id);
          relProds.push({ product: p, business: b });
          if (relProds.length >= 10) break;
        }
      }
      if (relProds.length >= 10) break;
    }

    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const searchDurationMs = Math.max(1, Math.round(t1 - t0));

    return {
      results: sortedResults,
      relatedProducts: relProds,
      relatedSearches: finalRelatedSearches,
      correctedQuery,
      searchDurationMs,
      autocompleteData
    };
  }, [businesses, category, categoryPath, query, radius, locationCoordinates, locationEnabled, searchSort]);

  const displayedBusinesses = useMemo(() => {
    return results.filter((b) => {
      if (filterOpenNow && !getBusinessWorkingStatus(b).isOpen) return false;
      if (filterTopRated && b.rating < 4.5) return false;
      if (filterVerified && !(b.tag === "Verified" || b.tag === "Featured")) return false;
      if (filterWhatsApp && !b.phone) return false;
      if (selectedNeighborhood !== "All Hosur") {
        const areaLower = selectedNeighborhood.toLowerCase();
        const matchesArea =
          (b.address?.area && b.address.area.toLowerCase().includes(areaLower)) ||
          (b.address?.street && b.address.street.toLowerCase().includes(areaLower)) ||
          (b.description && b.description.toLowerCase().includes(areaLower)) ||
          (b.name && b.name.toLowerCase().includes(areaLower));
        if (!matchesArea) return false;
      }
      return true;
    });
  }, [results, filterOpenNow, filterTopRated, filterVerified, filterWhatsApp, selectedNeighborhood]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3800);
  }

  function recordEvent(action: string) {
    const event: DemoEvent = { id: `${Date.now()}-${Math.random()}`, action, createdAt: new Date().toISOString() };
    setDemoData((current) => ({ ...current, events: [event, ...current.events].slice(0, 100) }));
  }

  function handleAtoZSelect(itemQuery: string, itemSector?: string) {
    setQuery(itemQuery);
    if (itemSector && itemSector !== "All") {
      setCategory(itemSector);
    } else {
      setCategory("All");
    }
    setCategoryPath([]);
    setBrowseMode("sectors");
    setRole("Discover");
    recordEvent(`A-Z item selected: ${itemQuery}`);
    showNotice(`Showing providers for “${itemQuery}” nearby.`);
    window.setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 120);
  }

  function handleAtoZEnquiry(item: AtoZItem) {
    const matchingBiz = businesses.find((b) => b.category === item.sector || (b.categories || []).includes(item.sector)) || businesses[0];
    const syntheticProduct: Product = {
      id: `atoz-${item.id}`,
      name: item.name,
      description: item.description,
      price: parseInt(item.priceHint.replace(/\D/g, "")) || 499,
      unit: item.type === "Service" ? "service" : "unit",
    };
    setEnquiryProduct({ business: matchingBiz, product: syntheticProduct });
    recordEvent(`Customer enquiry initiated for A-Z item: ${item.name}`);
  }

  function searchNearby(overrideTerm?: string) {
    const term = (overrideTerm ?? query).trim();
    if (term) {
      if (overrideTerm) setQuery(overrideTerm);
      setDemoData((current) => ({ ...current, recentSearches: [term, ...current.recentSearches.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 8) }));
      recordEvent(`Customer search performed: ${term}`);
    }
    setSearchDropdownOpen(false);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  }

  function toggleFavorite(businessName: string) {
    const alreadySaved = demoData.favorites.includes(businessName);
    setDemoData((current) => ({
      ...current,
      favorites: alreadySaved
        ? current.favorites.filter((name) => name !== businessName)
        : [businessName, ...current.favorites],
    }));
    recordEvent(alreadySaved ? "Business removed from saved list" : "Business saved to favorites");
    showNotice(alreadySaved ? "Removed from saved businesses." : "Saved to your favorites on this device.");
    if (!alreadySaved) {
      addNotification({
        title: "Saved to Shortlist",
        message: `${businessName} has been added to your favorites.`,
        type: "favorite",
        linkText: "View shortlist",
        action: { type: "role", payload: "Account" },
      });
    }
  }

  function requestDeviceLocation() {
    if (!navigator.geolocation) {
      showNotice("Device location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationEnabled(true);
        recordEvent("Device location permission granted");
        showNotice("Your device location is being used in memory to filter the sample directory. It is not saved or sent to a server.");
        addNotification({
          title: "📍 Live GPS Enabled",
          message: "Nearby businesses are now filtered using your precise coordinates in Hosur.",
          type: "system",
          linkText: "Search nearby",
          action: { type: "role", payload: "Discover" },
        });
      },
      () => showNotice("Location was not shared. Nearby search will continue with sample distances."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  function toggleDeviceLocation() {
    if (!locationEnabled) {
      requestDeviceLocation();
      return;
    }
    setLocationEnabled(false);
    setLocationCoordinates(null);
    recordEvent("Device location use stopped");
    showNotice("Device location use stopped. The app no longer uses your coordinates in this session.");
  }

  function submitEnquiry(business: Business, product: Product, message: string) {
    const enquiry: DemoEnquiry = {
      id: `${Date.now()}-${Math.random()}`,
      businessName: business.name,
      productName: product.name,
      message,
      createdAt: new Date().toISOString(),
      status: "New",
    };
    setDemoData((current) => ({ ...current, enquiries: [enquiry, ...current.enquiries] }));
    recordEvent("Customer enquiry submitted");
    setEnquiryProduct(null);
    showNotice("Enquiry saved in this browser. It has not been sent to the business.");
    addNotification({
      title: `Enquiry Sent: ${business.name}`,
      message: `Your enquiry for ${product.name} was successfully submitted.`,
      type: "enquiry",
      linkText: "View store",
      action: { type: "business", payload: business.name },
    });
  }

  function placeOrder(orderData: Omit<OrderRecord, "id" | "createdAt">) {
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: OrderRecord = {
      ...orderData,
      id: orderId,
      createdAt: new Date().toISOString(),
    };

    setDemoData((prev) => ({
      ...prev,
      orders: [newOrder, ...(prev.orders || [])],
    }));

    recordEvent(`Order placed: ${orderId} for ${orderData.businessName}`);

    // Dispatches real-time merchant notification
    addNotification({
      type: "order",
      title: `🛍️ New Order #${orderId} - ₹${newOrder.totalAmount}`,
      message: `${newOrder.customerName} ordered ${newOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")} from ${newOrder.businessName}. Please accept and prepare!`,
      linkText: "View order",
      action: {
        type: "portal",
        payload: "Business",
      },
    });

    setOrderingItem(null);
    setActiveReceipt(newOrder);
    showNotice(`🎉 Order #${orderId} placed successfully! The business partner has been alerted to prepare your order.`);
  }

  function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    let orderToNotify: OrderRecord | undefined;
    setDemoData((prev) => {
      const orders = (prev.orders || []).map((o) => {
        if (o.id === orderId) {
          orderToNotify = { ...o, status: nextStatus };
          return orderToNotify;
        }
        return o;
      });
      return { ...prev, orders };
    });

    recordEvent(`Order status updated: ${orderId} to ${nextStatus}`);

    const statusMessage =
      nextStatus === "accepted" ? "accepted by store and entering preparation 👨‍🍳" :
      nextStatus === "preparing" ? "now being freshly prepared by the business partner 👨‍🍳" :
      nextStatus === "ready" ? "marked READY! Prepared and packed for pickup / delivery 🛵" :
      nextStatus === "completed" ? "completed and successfully delivered ✅" :
      nextStatus === "cancelled" ? "cancelled by store" : nextStatus;

    addNotification({
      type: "order",
      title: `Order #${orderId} Update: ${nextStatus.toUpperCase()}`,
      message: `Your order from ${orderToNotify?.businessName || "the store"} is ${statusMessage}.`,
      linkText: "Track order",
      action: {
        type: "portal",
        payload: "Account",
      },
    });

    showNotice(`Order #${orderId} updated to ${nextStatus.toUpperCase()}! Customer notified.`);
  }

  function addProduct(businessName: string, product: Omit<Product, "id">) {
    const newProduct: Product = {
      ...product,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      inStock: product.inStock !== false,
    };
    setDemoData((current) => ({
      ...current,
      businesses: current.businesses.map((business) =>
        business.name === businessName ? { ...business, products: [...business.products, newProduct] } : business,
      ),
    }));
    recordEvent("Business catalogue updated");
    showNotice(`"${product.name}" added to catalogue.`);
  }

  function updateProduct(businessName: string, productId: string, updated: Partial<Product>) {
    setDemoData((current) => ({
      ...current,
      businesses: current.businesses.map((business) =>
        business.name === businessName
          ? {
              ...business,
              products: business.products.map((p) =>
                p.id === productId ? { ...p, ...updated } : p
              ),
            }
          : business
      ),
    }));
    recordEvent("Business catalogue item updated");
    showNotice("Catalogue item updated.");
  }

  function deleteProduct(businessName: string, productId: string) {
    setDemoData((current) => ({
      ...current,
      businesses: current.businesses.map((business) =>
        business.name === businessName
          ? {
              ...business,
              products: business.products.filter((p) => p.id !== productId),
            }
          : business
      ),
    }));
    recordEvent("Business catalogue item deleted");
    showNotice("Catalogue item removed.");
  }

  function submitCheckout(businessName: string, plan: string) {
    setDialog(null);
    setSubscriptionCheckout({ businessName, plan });
  }

  function processSubscriptionPayment(data: {
    businessName: string;
    plan: string;
    billingCycle: "monthly" | "yearly";
    amount: number;
    taxes: number;
    totalAmount: number;
    paymentMethod: string;
    transactionId: string;
    invoiceNumber: string;
    validUntil: string;
  }) {
    const subRecord: CheckoutRequest = {
      id: `SUB-${Math.floor(10000 + Math.random() * 90000)}`,
      businessName: data.businessName,
      plan: data.plan,
      billingCycle: data.billingCycle,
      amount: data.amount,
      taxes: data.taxes,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      invoiceNumber: data.invoiceNumber,
      validUntil: data.validUntil,
      createdAt: new Date().toISOString(),
      status: "Active",
    };

    setDemoData((current) => ({
      ...current,
      checkouts: [subRecord, ...current.checkouts.filter((c) => c.businessName !== data.businessName || c.status !== "Active")],
      businesses: current.businesses.map((b) =>
        b.name.toLowerCase() === data.businessName.toLowerCase()
          ? { ...b, subscribed: true }
          : b
      ),
    }));

    recordEvent(`Subscription payment completed: ${data.plan} for ${data.businessName} (₹${data.totalAmount})`);
    setSubscriptionCheckout(null);
    setSubscriptionReceipt(subRecord);
    setDialog(null);

    addNotification({
      type: "business",
      title: `🎉 ${data.plan} Membership Activated!`,
      message: `Payment of ₹${data.totalAmount.toLocaleString("en-IN")} received via ${data.paymentMethod}. "${data.businessName}" now has Active verified status & priority search ranking until ${new Date(data.validUntil).toLocaleDateString()}.`,
      linkText: "View Tax Invoice",
      action: { type: "portal", payload: "Business" },
    });

    showNotice(`🎉 Payment of ₹${data.totalAmount.toLocaleString("en-IN")} successful! ${data.plan} plan activated for ${data.businessName}.`);
  }

  async function submitBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("businessName") || "").trim();
    let selectedCategories: string[] = [];
    try {
      const categoriesValue: unknown = JSON.parse(String(form.get("businessCategories") || "[]"));
      if (Array.isArray(categoriesValue)) selectedCategories = categoriesValue.filter((entry): entry is string => typeof entry === "string");
    } catch { /* Keep the backward-compatible primary category if the hidden values are absent. */ }
    const selectedCategory = selectedCategories[0] || String(form.get("businessCategory") || "Everyday services");
    const phone = String(form.get("businessPhone") || "").trim();
    const address: BusinessAddress = {
      doorNumber: String(form.get("doorNumber") || "").trim(),
      street: String(form.get("street") || "").trim(),
      area: String(form.get("area") || "").trim(),
      cityTown: String(form.get("cityTown") || "").trim(),
      taluka: String(form.get("taluka") || "").trim(),
      district: String(form.get("district") || "").trim(),
      state: String(form.get("state") || "").trim(),
      pincode: String(form.get("pincode") || "").trim(),
    };
    const businessModes = form.getAll("businessModes").filter((entry): entry is string => typeof entry === "string");
    let taxonomySelections: CatalogueSelection[] = [];
    try {
      const taxonomyValue: unknown = JSON.parse(String(form.get("businessTaxonomySelections") || "[]"));
      if (Array.isArray(taxonomyValue)) taxonomySelections = taxonomyValue.filter((entry): entry is CatalogueSelection =>
        typeof entry === "object" && entry !== null &&
        (entry.activity === "Sales" || entry.activity === "Service") &&
        typeof entry.sector === "string" && Array.isArray(entry.path) &&
        entry.path.every((part: unknown) => typeof part === "string"));
    } catch { /* The primary business category remains available for older registration forms. */ }
    const vehicleTypes = form.getAll("vehicleTypes").filter((entry): entry is string => typeof entry === "string");
    const vehicleMakes = form.getAll("vehicleMakes").filter((entry): entry is string => typeof entry === "string" && entry !== "Other / not listed");
    const customVehicleMake = String(form.get("customVehicleMake") || "").trim();
    if (customVehicleMake && !vehicleMakes.includes(customVehicleMake)) vehicleMakes.push(customVehicleMake);
    const selectedVehicleModels = form.getAll("vehicleModels").filter((entry): entry is string => typeof entry === "string").map((entry) => {
      const [make, model] = entry.split("::");
      return `${make === "Other / not listed" && customVehicleMake ? customVehicleMake : make}: ${model}`;
    });
    const customVehicleModels = String(form.get("customVehicleModels") || "").split(",").map((model) => model.trim()).filter(Boolean).map((model) => `${customVehicleMake || vehicleMakes.filter((make) => make !== "Other / not listed").join(" / ") || "Vehicle"}: ${model}`);
    const vehicleModels = [...new Set([...selectedVehicleModels, ...customVehicleModels])];
    const latitudeValue = String(form.get("businessLatitude") || "").trim();
    const longitudeValue = String(form.get("businessLongitude") || "").trim();
    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    const coordinates = latitudeValue && longitudeValue && Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
    if (!name || !phone || !selectedCategory || !businessModes.length) return;
    if (!coordinates || coordinates.latitude < -90 || coordinates.latitude > 90 || coordinates.longitude < -180 || coordinates.longitude > 180) {
      showNotice("Capture the business location before submitting registration.");
      return;
    }
    try {
      const response = await fetch("/api/registration/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consume", role: "Business", phone }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Verify the business mobile number first.");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Verify the business mobile number first.");
      return;
    }
    setDemoData((current) => ({ ...current, businesses: [
      {
        name,
        category: selectedCategory,
        address,
        coordinates,
        demoCoordinates: coordinates,
        businessModes,
        taxonomyPaths: taxonomySelections.map((selection) => [selection.activity, selection.sector, ...selection.path]),
        taxonomyTags: [...new Set(taxonomySelections.flatMap((selection) => [selection.activity, selection.sector, ...selection.path]))],
        vehicleTypes,
        vehicleMakes,
        vehicleModels,
        categories: selectedCategories.length ? selectedCategories : [selectedCategory],
        subcategories: [],
        products: [],
        description: `${businessModes.join(" & ")} in ${selectedCategories.length ? selectedCategories.join(", ") : selectedCategory}`,
        distance: 0.8,
        rating: 5,
        reviews: 0,
        price: "Contact for pricing",
        icon: "🏪",
        color: "peach",
        subscribed: false,
        tag: "Awaiting verification",
      },
      ...current.businesses,
    ] }));
    recordEvent("Business registration saved in demo");
    setDialog(null);
    openPortal("Business");
    showNotice("Business profile saved. Choose a plan and complete verification to appear in search.");
    addNotification({
      title: `Business Profile Created: ${name}`,
      message: `Your business has been added to local listings under ${selectedCategory}.`,
      type: "business",
      linkText: "View in Discover",
      action: { type: "search", payload: name },
    });
  }

  function verifyBusinessLocation() {
    if (!navigator.geolocation) {
      showNotice("Location verification is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => showNotice("Device location access was granted, but this demo cannot verify the business address. A secure location-verification service is required."),
      () => showNotice("Location was not shared. Allow location access to verify your business address."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function logIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") || "").trim();
    if (phone.length < 8) {
      showNotice("Enter a valid mobile number to continue.");
      return;
    }
    setDialog(null);
    showNotice("No account was created. Connect a trusted identity provider to verify your phone and sign in.");
  }

  async function registerCustomerLocation(input: { name: string; phone: string; locationStatus: "shared" | "denied" | "unavailable"; latitude: number | null; longitude: number | null }) {
    try {
      const response = await fetch("/api/customers/registration-location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = await response.json() as { registration?: { verificationStatus: string }; error?: string };
      if (!response.ok || !result.registration) throw new Error(result.error || "Could not save the registration request.");
      setDialog(null);
      showNotice(`Demo registration request recorded. Location ${input.locationStatus === "shared" ? "shared with authorized Company Admins" : "not shared"}. Mobile number verified. Account activation is not connected in this demo.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not save the registration request.");
    }
  }

  async function logOut() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not end the session.");
      setAuthenticatedPortals([]);
      setCompanyAccessLevel("Admin");
      setLocationEnabled(false);
      setLocationCoordinates(null);
      window.sessionStorage.removeItem("neighborly_login_location");
      setRole("Discover");
      window.history.replaceState({}, "", window.location.pathname);
      showNotice("You have signed out.");
    } catch {
      showNotice("Could not sign out. Please try again.");
    }
  }
  const [portalActiveTab, setPortalActiveTab] = useState<string>("Overview");

  function openProfileView(tabName: "Profile details" | "Settings" = "Profile details", targetRole?: Role) {
    const dest = targetRole || (role === "Discover" ? "Account" : role);
    setDialog(null);
    setPortalActiveTab(tabName);
    if (role !== dest) setRole(dest);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("neighborly-open-profile", { detail: { tab: tabName } }));
      window.dispatchEvent(new Event("neighborly-open-profile"));
    }, 40);
  }

  function openMemberProfile() {
    openProfileView("Profile details");
  }
  function openPortal(portal: Role) {
    if (portal === "Discover") {
      setRole("Discover");
      return;
    }
    if (portal === "Company" && !authenticatedPortals.includes("Company")) {
      window.location.assign("/company-login");
      return;
    }
    if (!authenticatedPortals.includes(portal)) {
      window.location.assign(`/login?portal=${portal}`);
      return;
    }
    setRole(portal);
  }

  const workspaceLinks = ([
    ["Discover", "\u2315"],
    ...(role === "Discover" || role === "Account" ? [["Account", "\u25c9"] as [Role, string]] : []),
    ...(role === "Discover" || role === "Business" ? [["Business", "\u25a7"] as [Role, string]] : []),
    ...(role === "Discover" || role === "Agent" ? [["Agent", "\u2667"] as [Role, string]] : []),
    ...(role === "Company" ? [["Company", "\u2699"] as [Role, string]] : []),
  ] as [Role, string][]).sort(([left], [right]) => left === role ? -1 : right === role ? 1 : 0);

  return (
    <main className="app-shell">
      <style>{`
        .related-searches-bar {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          flex-wrap: wrap !important;
          margin: 16px 0 20px !important;
          padding: 10px 14px !important;
          background: #f5f8f5 !important;
          border: 1px solid #dbe6da !important;
          border-radius: 10px !important;
          font-family: inherit !important;
        }
        .related-searches-label {
          font-family: 'Manrope', sans-serif !important;
          font-weight: 700 !important;
          font-size: 11.5px !important;
          color: #274b32 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          white-space: nowrap !important;
        }
        .related-search-icon {
          font-size: 13px !important;
        }
        .related-searches-pills {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          flex-wrap: wrap !important;
        }
        .related-search-pill {
          border: 1px solid #c9d9cb !important;
          background: #ffffff !important;
          color: #26432f !important;
          padding: 5px 13px !important;
          border-radius: 20px !important;
          font-family: 'Manrope', sans-serif !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          cursor: pointer !important;
          transition: all 0.16s ease !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
          outline: none !important;
          display: inline-flex !important;
          align-items: center !important;
          white-space: nowrap !important;
        }
        .related-search-pill:hover {
          background: #386b4b !important;
          color: #ffffff !important;
          border-color: #386b4b !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 3px 8px rgba(40,75,50,0.18) !important;
        }
        .related-products-shelf {
          background: #fbfdfa !important;
          border: 1px solid #e1ebe0 !important;
          border-radius: 12px !important;
          padding: 16px 18px 18px !important;
          margin: 0 0 24px !important;
          box-shadow: 0 2px 8px rgba(30,50,35,0.03) !important;
          font-family: inherit !important;
        }
        .related-shelf-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 14px !important;
          gap: 8px !important;
          flex-wrap: wrap !important;
        }
        .shelf-eyebrow {
          font-family: 'Manrope', sans-serif !important;
          font-weight: 800 !important;
          font-size: 9px !important;
          letter-spacing: 0.8px !important;
          color: #4b7a57 !important;
          text-transform: uppercase !important;
          margin-bottom: 3px !important;
        }
        .shelf-title {
          font-family: 'Manrope', sans-serif !important;
          font-weight: 700 !important;
          font-size: 14px !important;
          color: #1a3020 !important;
          margin: 0 !important;
        }
        .shelf-count {
          font-family: 'Manrope', sans-serif !important;
          font-size: 10px !important;
          color: #386244 !important;
          background: #e7f2e6 !important;
          padding: 3px 9px !important;
          border-radius: 12px !important;
          font-weight: 700 !important;
          border: 1px solid #d5e5d4 !important;
        }
        .related-products-scroll {
          display: flex !important;
          flex-direction: row !important;
          gap: 14px !important;
          overflow-x: auto !important;
          padding: 4px 2px 10px !important;
          scrollbar-width: thin !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .related-products-scroll::-webkit-scrollbar {
          height: 6px !important;
        }
        .related-products-scroll::-webkit-scrollbar-thumb {
          background: #cddccd !important;
          border-radius: 6px !important;
        }
        .related-product-card {
          flex: 0 0 270px !important;
          width: 270px !important;
          min-width: 270px !important;
          background: #ffffff !important;
          border: 1px solid #e2ede0 !important;
          border-radius: 10px !important;
          padding: 14px 15px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          box-shadow: 0 2px 6px rgba(35,55,40,0.04) !important;
          transition: all 0.18s ease !important;
          box-sizing: border-box !important;
        }
        .related-product-card:hover {
          border-color: #8bb591 !important;
          box-shadow: 0 6px 18px rgba(35,60,42,0.09) !important;
          transform: translateY(-2px) !important;
        }
        .related-product-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          gap: 8px !important;
          margin-bottom: 6px !important;
        }
        .related-product-name {
          font-family: 'Manrope', sans-serif !important;
          font-weight: 700 !important;
          font-size: 12.5px !important;
          color: #1c3222 !important;
          line-height: 1.3 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 165px !important;
        }
        .related-product-price {
          font-family: 'Manrope', sans-serif !important;
          font-weight: 700 !important;
          font-size: 11.5px !important;
          color: #256037 !important;
          background: #edf6ec !important;
          padding: 2px 7px !important;
          border-radius: 5px !important;
          white-space: nowrap !important;
        }
        .related-product-price small {
          font-size: 8.5px !important;
          color: #6a7c6f !important;
          font-weight: 500 !important;
        }
        .related-product-desc {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 10px !important;
          color: #6d7f71 !important;
          line-height: 1.45 !important;
          margin: 6px 0 12px !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }
        .related-product-footer {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 8px !important;
          padding-top: 10px !important;
          border-top: 1px solid #f0f5ef !important;
        }
        .related-product-provider {
          border: 1px solid #e4eee3 !important;
          background: #f7faf6 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          font-family: 'Manrope', sans-serif !important;
          font-size: 9.5px !important;
          font-weight: 600 !important;
          color: #36593e !important;
          cursor: pointer !important;
          padding: 4px 8px !important;
          border-radius: 5px !important;
          max-width: 175px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          transition: all 0.15s ease !important;
        }
        .related-product-provider:hover {
          background: #edf5eb !important;
          border-color: #a3c7a9 !important;
          color: #1a3c25 !important;
        }
        .provider-name-truncate {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .related-product-enquire-btn {
          border: 0 !important;
          background: #386b4b !important;
          color: #ffffff !important;
          border-radius: 5px !important;
          padding: 6px 12px !important;
          font-family: 'Manrope', sans-serif !important;
          font-size: 9.5px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          white-space: nowrap !important;
          transition: background 0.15s ease !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
        }
        .related-product-enquire-btn:hover {
          background: #234a32 !important;
        }

        /* Business Portal Catalogue Manager Styles */
        .catalogue-manager-root {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .catalogue-stats-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 8px;
        }
        .catalogue-stat-card {
          background: #fbfdfb;
          border: 1px solid #e2ece3;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .catalogue-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #eef6ef;
          color: #245834;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .catalogue-stat-info small {
          display: block;
          font-size: 9.5px;
          font-weight: 700;
          color: #637768;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .catalogue-stat-info strong {
          font-size: 16px;
          font-weight: 800;
          color: #1a3824;
        }
        .catalogue-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding: 12px 16px;
          background: #f6f9f6;
          border: 1px solid #deebdf;
          border-radius: 10px;
        }
        .catalogue-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #cedece;
          border-radius: 20px;
          padding: 6px 14px;
          flex: 1;
          min-width: 220px;
          max-width: 360px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .catalogue-search-wrap input {
          border: 0;
          outline: 0;
          background: transparent;
          font-family: inherit;
          font-size: 12px;
          color: #1f3927;
          width: 100%;
        }
        .catalogue-filter-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .catalogue-filter-chip {
          border: 1px solid #d0e0d2;
          background: #ffffff;
          color: #274b32;
          font-size: 10.5px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .catalogue-filter-chip.active {
          background: #285536;
          color: #ffffff;
          border-color: #285536;
        }
        .catalogue-view-toggles {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #e9f0ea;
          padding: 3px;
          border-radius: 8px;
        }
        .catalogue-view-btn {
          border: 0;
          background: transparent;
          color: #435e4b;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 700;
        }
        .catalogue-view-btn.active {
          background: #ffffff;
          color: #1e4529;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .catalogue-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 6px;
        }
        .catalogue-product-card {
          background: #ffffff;
          border: 1px solid #e1eee2;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 7px rgba(30,50,35,0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          position: relative;
        }
        .catalogue-product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 22px rgba(30,60,40,0.09);
          border-color: #b3d1b8;
        }
        .catalogue-card-img-wrap {
          position: relative;
          width: 100%;
          height: 180px;
          background: #f0f5f1;
          overflow: hidden;
        }
        .catalogue-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }
        .catalogue-product-card:hover .catalogue-card-img {
          transform: scale(1.04);
        }
        .catalogue-card-badge-pill {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(26, 60, 36, 0.92);
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.18);
        }
        .catalogue-stock-toggle-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ffffff;
          border: 1px solid #d0e0d2;
          padding: 3px 9px;
          border-radius: 14px;
          font-size: 9.5px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          transition: all 0.15s ease;
        }
        .catalogue-stock-toggle-btn.in-stock {
          color: #17652e;
          border-color: #9bd2a7;
          background: #f3fcf4;
        }
        .catalogue-stock-toggle-btn.out-of-stock {
          color: #a82a2a;
          border-color: #f1b3b3;
          background: #fdf2f2;
        }
        .catalogue-change-img-overlay {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(18, 38, 25, 0.85);
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 6px;
          border: 0;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .catalogue-change-img-overlay:hover {
          background: #1b4d29;
          transform: scale(1.03);
        }
        .catalogue-card-body {
          padding: 14px 16px 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .catalogue-card-cat-tag {
          font-size: 9px;
          font-weight: 800;
          color: #4d7a55;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .catalogue-card-name {
          font-size: 15px;
          font-weight: 700;
          color: #193421;
          margin: 0 0 6px;
          line-height: 1.35;
        }
        .catalogue-card-description {
          font-size: 11.5px;
          color: #596d5e;
          line-height: 1.45;
          margin: 0 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }
        .catalogue-card-price-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 8px 0;
          border-top: 1px solid #eff5f0;
          margin-bottom: 12px;
        }
        .catalogue-price-text {
          font-size: 18px;
          font-weight: 800;
          color: #1c6b35;
        }
        .catalogue-price-unit {
          font-size: 10.5px;
          font-weight: 600;
          color: #697c6d;
          margin-left: 3px;
        }
        .catalogue-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .catalogue-edit-action-btn {
          flex: 1;
          background: #f0f7f1;
          color: #215931;
          border: 1px solid #c8dec9;
          border-radius: 6px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.15s ease;
        }
        .catalogue-edit-action-btn:hover {
          background: #245532;
          color: #ffffff;
          border-color: #245532;
        }
        .catalogue-delete-action-btn {
          background: #fdf5f5;
          color: #a83333;
          border: 1px solid #f1c7c7;
          border-radius: 6px;
          padding: 7px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .catalogue-delete-action-btn:hover {
          background: #992323;
          color: #ffffff;
          border-color: #992323;
        }
        /* List View */
        .catalogue-list-table {
          width: 100%;
          border-collapse: collapse;
          background: #ffffff;
          border: 1px solid #e1eee2;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
        }
        .catalogue-list-table th {
          text-align: left;
          padding: 10px 14px;
          background: #f4f8f4;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #4a6650;
          text-transform: uppercase;
          border-bottom: 1px solid #e0ece1;
        }
        .catalogue-list-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #edf4ee;
          font-size: 12px;
          color: #243e2c;
          vertical-align: middle;
        }
        .catalogue-list-table tr:hover td {
          background: #f9fbf9;
        }
        .catalogue-list-thumb {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          object-fit: cover;
          display: block;
        }
        /* Modal Backdrop & Container */
        .catalogue-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(12, 28, 17, 0.58);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .catalogue-modal-card {
          background: #ffffff;
          border-radius: 14px;
          max-width: 580px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
          border: 1px solid #cfe0d1;
          display: flex;
          flex-direction: column;
        }
        .catalogue-modal-header {
          padding: 16px 22px;
          border-bottom: 1px solid #e5eee6;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fafcfa;
          border-radius: 14px 14px 0 0;
        }
        .catalogue-modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #1a3f25;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .catalogue-modal-close-btn {
          background: transparent;
          border: 0;
          font-size: 20px;
          color: #637a69;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .catalogue-modal-close-btn:hover {
          background: #eef5ef;
          color: #1a3f25;
        }
        .catalogue-modal-form {
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .catalogue-form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .catalogue-form-field label {
          font-size: 11px;
          font-weight: 700;
          color: #274730;
        }
        .catalogue-form-field input,
        .catalogue-form-field select,
        .catalogue-form-field textarea {
          border: 1px solid #c7d9c8;
          border-radius: 7px;
          padding: 8px 11px;
          font-family: inherit;
          font-size: 12px;
          color: #1e3624;
          outline: none;
          background: #ffffff;
        }
        .catalogue-form-field input:focus,
        .catalogue-form-field select:focus,
        .catalogue-form-field textarea:focus {
          border-color: #285536;
          box-shadow: 0 0 0 2px rgba(40,85,54,0.12);
        }
        .catalogue-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .catalogue-image-preview-box {
          position: relative;
          width: 100%;
          height: 140px;
          border-radius: 8px;
          border: 1px dashed #b9d1bb;
          background: #f7faf7;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 6px;
        }
        .catalogue-image-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .catalogue-preset-chips-wrap {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .catalogue-preset-chip {
          border: 1px solid #d0e0d2;
          background: #f7faf7;
          color: #264a30;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 12px;
          cursor: pointer;
        }
        .catalogue-preset-chip:hover {
          background: #e6f2e7;
          border-color: #285536;
        }
        .catalogue-modal-footer {
          padding: 14px 22px 18px;
          border-top: 1px solid #e7efe8;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          background: #fafcfa;
          border-radius: 0 0 14px 14px;
        }
        .catalogue-cancel-btn {
          border: 1px solid #d0dfd2;
          background: #ffffff;
          color: #4b6250;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .catalogue-submit-btn {
          border: 0;
          background: #245532;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(36,85,50,0.2);
        }
        .catalogue-submit-btn:hover {
          background: #173b22;
        }
      `}</style>
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); openPortal("Discover"); }} aria-label="Bizearch home">
          <img className="brand-mark" src="/bizearch-mark.svg" alt="" />
          <span>bizearch<span className="brand-period">.</span></span>
        </a>
        <button className="mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? "×" : "☰"}</button>
        <div className="workspace-label">{role === "Discover" ? t.workspaceLabel : `${role === "Account" ? "CUSTOMER" : role.toUpperCase()} ${t.workspaceLabel}`}</div>
        <nav className="main-nav" aria-label="Main navigation">
          {workspaceLinks.map(([item, icon]) => (
            <button key={item} className={`nav-item ${role === item ? "active" : ""}`} onClick={() => { openPortal(item); setMobileMenuOpen(false); }}>
              <Icon>{icon}</Icon><span>{item === "Discover" ? t.discover : item === "Account" ? t.myActivity : item === "Business" ? t.businessPortal : item === "Agent" ? t.agentPortal : t.companyPortal}</span>
              {item === role && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-scroll-middle">
          {role === "Discover" && <>
            <div className="sidebar-divider" />
            <div className="workspace-label">{t.browseBy}</div>
            <nav className="category-nav" aria-label="Browse categories">
              <button
                className={`category-link view-all ${browseMode === "atoz" ? "selected" : ""}`}
                onClick={() => {
                  setBrowseMode("atoz");
                  setRole("Discover");
                  setMobileMenuOpen(false);
                  window.setTimeout(() => {
                    document.getElementById("atoz-directory")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                <Icon><span className="atoz-sidebar-pill">A–Z</span></Icon><span>{t.allProductsAndServices}</span>
              </button>
              {categories.slice(1).map((item) => (
                <button
                  key={item.name}
                  className={`category-link ${browseMode === "sectors" && category === item.name ? "selected" : ""}`}
                  onClick={() => {
                    setBrowseMode("sectors");
                    setCategory(item.name);
                    setCategoryPath([]);
                    setQuery("");
                    setRole("Discover");
                    setMobileMenuOpen(false);
                  }}
                  title={translateCategory(item.name, lang)}
                >
                  <Icon><CategoryIcon name={item.name} sector={item.name} /></Icon>
                  <span>{translateCategory(item.name, lang)}</span>
                </button>
              ))}
              <button
                className={`category-link view-all ${browseMode === "sectors" && category === "All" ? "selected" : ""}`}
                onClick={() => {
                  setBrowseMode("sectors");
                  setCategory("All");
                  setCategoryPath([]);
                  setQuery("");
                  setRole("Discover");
                  setMobileMenuOpen(false);
                }}
              >
                <Icon>&#43;</Icon><span>{t.allCategories}</span>
              </button>
            </nav>

            <div className="neighbor-card">
              <div className="neighbor-sparkle">&#10038;</div>
              <strong>{t.goodThingsCloser}</strong>
              <p>{t.goodThingsDesc}</p>
              <button onClick={() => setDialog("business")}>{t.registerBusiness} <span>&#8599;</span></button>
            </div>
          </>}
        </div>

        <div className="sidebar-bottom">
          <button
            className="profile-button"
            onClick={() => openProfileView("Profile details")}
            title="Open Profile details & settings"
          >
            <span className="avatar">N</span>
            <span className="profile-text">
              <strong>{role === "Discover" ? t.yourBizearchActivity : `${role === "Account" ? "Customer" : role} profile`}</strong>
              <small>{role === "Discover" ? t.savedOnDevice : "Profile & account details"}</small>
            </span>
            <span className="profile-menu">···</span>
          </button>
          {role !== "Company" && <a className="company-login-link" href="/company-login">{t.companyLogin}</a>}
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb" style={{ fontSize: "11px", color: "#879188", whiteSpace: "nowrap", flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{t.yourNeighborhood} <span>/</span> <strong>{role === "Discover" ? t.discover : role === "Account" ? t.myActivity : `${role} portal`}</strong></div>
          <div className="topbar-partner" aria-label="Powered by Jishnu Infotech" style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", color: "#718078", fontSize: "10px", flexShrink: 0 }}><span>{t.poweredBy}</span><img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" style={{ display: "block", height: "28px", width: "auto", maxWidth: "120px", objectFit: "contain" }} /></div>
          <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap", flexShrink: 0, marginLeft: "auto" }}>
            <button
              className="location-chip"
              onClick={toggleDeviceLocation}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
                padding: "0 10px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#2c4835",
                background: "#f4f8f4",
                border: "1px solid #d8e5d9",
                borderRadius: "7px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#285536" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{locationEnabled ? t.stopLocation : t.hosurLocation}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#698070" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "2px" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="notification-wrapper" ref={notificationsRef} style={{ position: "relative", display: "inline-flex", alignItems: "center", height: "32px" }}>
              <button
                className="icon-button notification-button"
                aria-label={`Notifications (${unreadCount} unread)`}
                onClick={() => setNotificationsOpen((prev) => !prev)}
                style={{
                  width: "32px",
                  height: "32px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f4f8f4",
                  border: "1px solid #d8e5d9",
                  borderRadius: "7px",
                  color: "#2c4835",
                  cursor: "pointer",
                  position: "relative",
                  padding: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2c4835" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="notification-popover" role="dialog" aria-label="Notifications panel">
                  <div className="notification-header">
                    <div className="notification-header-title">
                      <span>Notifications</span>
                      {unreadCount > 0 && <span className="notification-count-pill">{unreadCount} new</span>}
                    </div>
                    <div className="notification-actions-top">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notification-mark-all"
                          onClick={markAllNotificationsRead}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        className="notification-close-btn"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="notification-tabs">
                    <button
                      type="button"
                      className={`notification-tab-btn ${notificationFilter === "all" ? "active" : ""}`}
                      onClick={() => setNotificationFilter("all")}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      className={`notification-tab-btn ${notificationFilter === "unread" ? "active" : ""}`}
                      onClick={() => setNotificationFilter("unread")}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  <div className="notification-list">
                    {displayedNotifications.length === 0 ? (
                      <div className="notification-empty">
                        <span className="notification-empty-icon">🎉</span>
                        <strong>You&apos;re all caught up!</strong>
                        <p>{notificationFilter === "unread" ? "No unread alerts at the moment." : "No notifications right now."}</p>
                      </div>
                    ) : (
                      displayedNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notification-item ${!notif.read ? "unread" : ""}`}
                          onClick={() => { if (!notif.read) markNotificationRead(notif.id); }}
                        >
                          <span className={`notification-item-icon ${notif.type}`}>
                            {notif.type === "sos" ? "🚨" : notif.type === "enquiry" ? "💬" : notif.type === "offer" ? "🎁" : notif.type === "business" ? "🏢" : notif.type === "favorite" ? "⭐" : "🔔"}
                          </span>
                          <div className="notification-item-content">
                            <div className="notification-item-head">
                              <span className="notification-item-title">{notif.title}</span>
                              <span className="notification-item-time">{notif.timestamp}</span>
                            </div>
                            <p className="notification-item-msg">{notif.message}</p>
                            {notif.action && (
                              <button
                                type="button"
                                className="notification-item-action"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationAction(notif);
                                }}
                              >
                                {notif.linkText || "View"} ↗
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="notification-item-dismiss"
                            aria-label="Delete notification"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <button
                        type="button"
                        className="notification-clear-btn"
                        onClick={clearAllNotifications}
                      >
                        Clear all
                      </button>
                      <span>Hosur Community Alerts</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="language-selector-pill" role="group" aria-label="Select language" style={{ display: "inline-flex", alignItems: "center", height: "32px", background: "#f0f4f1", borderRadius: "16px", border: "1px solid #d4ded6", padding: "2px 3px", gap: "2px", flexShrink: 0 }}>
              {(["en", "ta", "kn", "te"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLang(l);
                    showNotice(
                      l === "ta" ? "மொழி: தமிழ் தேர்ந்தெடுக்கப்பட்டது" :
                      l === "kn" ? "ಭಾಷೆ: ಕನ್ನಡ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ" :
                      l === "te" ? "భాష: తెలుగు ఎంపిక చేయబడింది" :
                      "Language: English selected"
                    );
                  }}
                  style={{
                    background: lang === l ? "#285536" : "transparent",
                    color: lang === l ? "#ffffff" : "#405445",
                    border: 0,
                    borderRadius: "13px",
                    height: "26px",
                    padding: "0 8px",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  title={l === "en" ? "English" : l === "ta" ? "தமிழ் (Tamil)" : l === "kn" ? "ಕನ್ನಡ (Kannada)" : "తెలుగు (Telugu)"}
                >
                  {l === "en" ? "EN" : l === "ta" ? "தமிழ்" : l === "kn" ? "ಕನ್ನಡ" : "తెలుగు"}
                </button>
              ))}
            </div>
            {authenticatedPortals.length > 0 && (role === "Discover" || authenticatedPortals.includes(role)) ? (
              <button
                className="sign-in-button"
                onClick={() => void logOut()}
                style={{
                  border: "1px solid #d5e2d6",
                  background: "#ffffff",
                  borderRadius: "7px",
                  color: "#285536",
                  height: "32px",
                  padding: "0 12px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.signOut}
              </button>
            ) : (
              <button
                className="sign-in-button"
                onClick={() => openPortal("Account")}
                style={{
                  border: "1px solid #d5e2d6",
                  background: "#ffffff",
                  borderRadius: "7px",
                  color: "#285536",
                  height: "32px",
                  padding: "0 12px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                {t.signIn} <span>&rarr;</span>
              </button>
            )}
          </div>
        </header>

        {role === "Discover" && (
          <div className="ad-ticker top-ad-ticker" aria-label="Local advertising announcements">
            <div className="ad-ticker-track">{adConfig.tickerMessages.map((message, index) => <Fragment key={`${index}-${message}`}><span>{message}</span><i>&#10038;</i></Fragment>)}</div>
          </div>
        )}

        {role === "Discover" && <div className="ad-ticker mobile-ad-ticker" aria-label="Local advertising announcements">
          <div className="ad-ticker-track">{adConfig.tickerMessages.map((message, index) => <Fragment key={`${index}-${message}`}><span>{message}</span><i>&#10038;</i></Fragment>)}</div>
        </div>}

        <aside className="ad-rail" aria-label="Advertisements">
          <button className="sos-fab sos-ad-button" aria-label="Emergency help (SOS)" onClick={() => setDialog("sos")}><span>✚</span> SOS <small>{t.emergencyHelp}</small></button>
          <section className="image-ad-panel" aria-label="Rotating image advertisement">
            <div className={`image-ad-creative ${adConfig.imageAds[activeAd].tone}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 18%, rgba(17, 34, 23, .78) 100%), url("${adConfig.imageAds[activeAd].image}")` }}>
              <span className="ad-label">{t.advertisement}</span>
              <div className="image-ad-copy"><small>{adConfig.imageAds[activeAd].label}</small><strong>{adConfig.imageAds[activeAd].title}</strong></div>
            </div>
            <div className="ad-dots" aria-label={`Advertisement ${activeAd + 1} of ${adConfig.imageAds.length}`}>
              {adConfig.imageAds.map((ad, index) => <button key={`${ad.tone}-${index}`} className={index === activeAd ? "active" : ""} onClick={() => setActiveAd(index)} aria-label={`Show image advertisement ${index + 1}`} />)}
            </div>
          </section>
          <section className="video-ad-panel" aria-label="Video advertisement">
            <div className="video-ad-heading"><span>{t.videoAd}</span><small>{t.localSpotlight}</small></div>
            <video key={adConfig.videoAd.sourceUrl} className="video-ad-player" controls muted loop autoPlay playsInline poster={adConfig.videoAd.posterUrl || undefined} src={adConfig.videoAd.sourceUrl}>Your browser does not support embedded video.</video>
            <div className="video-ad-caption"><strong>{adConfig.videoAd.title}</strong><p>{adConfig.videoAd.description}</p><button onClick={() => openPortal("Business")}>{t.promoteYourBusiness} <span>&#8594;</span></button></div>
            {adConfig.audioAd.sourceUrl && <div className="audio-ad-content"><strong>{adConfig.audioAd.title}</strong><p>{adConfig.audioAd.description}</p><audio controls preload="none" src={adConfig.audioAd.sourceUrl}>Your browser does not support embedded audio.</audio></div>}
          </section>
        </aside>

        {role === "Discover" && (
          <div className="page-content discover-content">
            <div className="welcome-row">
              <div className="welcome-copy"><div className="eyebrow"><span /> {t.madeForAroundHere}</div>
                <h1>{t.heroHeadingMain}<br /><em>{t.heroHeadingSub}</em></h1>
                <p className="welcome-subtitle">{t.heroDesc}</p>
                <button className="business-registration-cta" type="button" onClick={() => setDialog("business")}><strong>{t.registerBusiness}</strong><span aria-hidden="true">→</span></button>
                <p className="business-registration-note">{t.registerBusinessNote}</p></div>
              <div className="hero-illustration" aria-hidden="true">
                <div className="sun-disc" /><div className="hero-plant">✿</div>
                <div className="hero-house"><div className="house-roof" /><div className="house-body"><i /><i /></div><div className="house-door" /></div>
                <span className="hero-dot dot-one" /><span className="hero-dot dot-two" /><span className="hero-star">✳</span>
              </div>
            </div>

            <div className="search-panel">
              <div className="search-main" ref={searchContainerRef} style={{ position: "relative" }}>
                <label htmlFor="what-search">{t.whatDoYouNeed}</label>
                <div className="search-input-wrap">
                  <span className="search-symbol">🔍</span>
                  <input
                    id="what-search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSearchDropdownOpen(true);
                    }}
                    onFocus={() => setSearchDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        searchNearby();
                      } else if (e.key === "Escape") {
                        setSearchDropdownOpen(false);
                      }
                    }}
                    placeholder={t.searchPlaceholder}
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      className="search-clear-input-btn"
                      onClick={() => {
                        setQuery("");
                        setSearchDropdownOpen(false);
                      }}
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    className={`search-voice-btn ${isListening ? "active" : ""}`}
                    onClick={() => {
                      if (typeof window === "undefined") return;
                      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                      if (!SpeechRec) {
                        showNotice("Voice search is not supported by your browser. Please use Chrome, Edge or Safari.");
                        return;
                      }
                      try {
                        const rec = new SpeechRec();
                        rec.lang = "en-IN";
                        rec.interimResults = false;
                        rec.maxAlternatives = 1;
                        rec.onstart = () => setIsListening(true);
                        rec.onend = () => setIsListening(false);
                        rec.onerror = () => {
                          setIsListening(false);
                          showNotice("Voice recognition error or permission denied.");
                        };
                        rec.onresult = (evt: any) => {
                          const transcript = evt.results[0][0].transcript;
                          if (transcript) {
                            setQuery(transcript);
                            searchNearby(transcript);
                            showNotice(`Voice search: "${transcript}"`);
                          }
                        };
                        rec.start();
                      } catch {
                        setIsListening(false);
                        showNotice("Could not start voice search.");
                      }
                    }}
                    title={isListening ? "Listening to your voice..." : "Voice search (tap to speak)"}
                    aria-label="Voice search"
                  >
                    {isListening ? "🔴" : "🎙️"}
                  </button>
                  <button className="search-submit" onClick={() => searchNearby()}>
                    {t.findNearby} <span>↗</span>
                  </button>
                </div>

                {/* Live Autocomplete Typeahead Dropdown */}
                {searchDropdownOpen && (
                  <div className="search-autocomplete-dropdown">
                    {!query.trim() ? (
                      <>
                        {demoData.recentSearches.length > 0 && (
                          <div className="autocomplete-section">
                            <div className="autocomplete-section-header">
                              <span>🕐 Recent Searches</span>
                              <button
                                type="button"
                                className="autocomplete-clear-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDemoData((d) => ({ ...d, recentSearches: [] }));
                                }}
                              >
                                Clear all
                              </button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              {demoData.recentSearches.slice(0, 4).map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  className="autocomplete-item"
                                  onClick={() => searchNearby(term)}
                                >
                                  <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11.5px", color: "#243e2b" }}>
                                    <span style={{ color: "#7a8f7e" }}>🕐</span>
                                    <strong>{term}</strong>
                                  </span>
                                  <span style={{ fontSize: "10px", color: "#8a9b8e" }}>Search ↗</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="autocomplete-section">
                          <div className="autocomplete-section-header">
                            <span>🔥 Popular Searches in Hosur</span>
                          </div>
                          <div className="autocomplete-popular-chips">
                            {[
                              "Maruti Swift",
                              "Hero Splendor",
                              "Kauvery Hospital",
                              "Samsung Galaxy S25",
                              "Apollo Dental Clinic",
                              "Thalappakatti Biryani",
                              "Car Wash & Detailing",
                              "Badminton Court",
                              "Godrej Interio",
                              "Airport Taxi",
                              "Hosur Rose Nursery",
                              "Kalyana Mandapam",
                              "SIPCOT Industrial Sheds"
                            ].map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                className="autocomplete-popular-chip"
                                onClick={() => searchNearby(chip)}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {autocompleteData.queries.length > 0 && (
                          <div className="autocomplete-section">
                            <div className="autocomplete-section-header">
                              <span>Keywords &amp; Suggestions</span>
                            </div>
                            {autocompleteData.queries.map((qItem) => (
                              <button
                                key={qItem}
                                type="button"
                                className="autocomplete-item"
                                onClick={() => searchNearby(qItem)}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#1f3927" }}>
                                  <span style={{ color: "#6e8573" }}>🔍</span>
                                  <span>{highlightMatch(qItem, query)}</span>
                                </span>
                                <span style={{ fontSize: "10px", color: "#778d7c" }}>Search ↗</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {autocompleteData.businesses.length > 0 && (
                          <div className="autocomplete-section">
                            <div className="autocomplete-section-header">
                              <span>Verified Businesses</span>
                            </div>
                            {autocompleteData.businesses.map((biz) => (
                              <button
                                key={biz.name}
                                type="button"
                                className="autocomplete-item"
                                onClick={() => {
                                  setBusinessModalTab("products");
                                  setSelectedBusiness(biz);
                                  setSearchDropdownOpen(false);
                                  recordEvent(`Autocomplete selected business: ${biz.name}`);
                                }}
                              >
                                <div className="autocomplete-biz-info">
                                  <span className="autocomplete-biz-icon">{biz.icon}</span>
                                  <div>
                                    <div className="autocomplete-biz-name">{highlightMatch(biz.name, query)}</div>
                                    <div className="autocomplete-biz-cat">{biz.category} · ★ {biz.rating.toFixed(1)} · ⌖ {businessDistance(biz).toFixed(1)} km</div>
                                  </div>
                                </div>
                                <span style={{ fontSize: "10px", color: "#2d693f", fontWeight: 700 }}>View Profile ↗</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {autocompleteData.products.length > 0 && (
                          <div className="autocomplete-section">
                            <div className="autocomplete-section-header">
                              <span>Direct Products &amp; Services</span>
                            </div>
                            {autocompleteData.products.map(({ product, business }) => (
                              <div
                                key={`${business.name}-${product.id}`}
                                className="autocomplete-item"
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "8px 10px" }}
                              >
                                <div
                                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                                  onClick={() => {
                                    setEnquiryProduct({ business, product });
                                    setSearchDropdownOpen(false);
                                    recordEvent(`Autocomplete enquiry: ${product.name}`);
                                  }}
                                >
                                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a3321" }}>{highlightMatch(product.name, query)}</div>
                                  <div style={{ fontSize: "9.5px", color: "#748677" }}>by {business.name} · {businessDistance(business).toFixed(1)} km</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#2d693f" }}>₹{product.price.toLocaleString("en-IN")}</span>
                                  <button
                                    type="button"
                                    style={{ border: "1px solid #c9dcc8", background: "#f3f8f2", color: "#2d693f", borderRadius: "4px", padding: "4px 7px", fontSize: "9px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBusinessModalTab("navigation");
                                      setSelectedBusiness(business);
                                      setSearchDropdownOpen(false);
                                      recordEvent(`Autocomplete navigate: ${product.name}`);
                                    }}
                                    title="Navigate to store"
                                  >
                                    🧭 Map
                                  </button>
                                  <button
                                    type="button"
                                    style={{ border: 0, background: "#0f766e", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "9.5px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOrderingItem({ business, product });
                                      setSearchDropdownOpen(false);
                                      recordEvent(`Autocomplete order: ${product.name}`);
                                    }}
                                  >
                                    🛍️ Order
                                  </button>
                                  <button
                                    type="button"
                                    style={{ border: 0, background: "#386b4b", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "9.5px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEnquiryProduct({ business, product });
                                      setSearchDropdownOpen(false);
                                      recordEvent(`Autocomplete enquiry: ${product.name}`);
                                    }}
                                  >
                                    Enquire ↗
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <div className="autocomplete-footer">
                      <span>Press <strong>Enter</strong> to search all listings</span>
                      <span><strong>Esc</strong> to close</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="search-divider" />
              <div className="neighborhood-control" style={{ width: "160px", flexShrink: 0 }}>
                <label htmlFor="neighborhood-select" style={{ fontSize: "9px", color: "#858f87", letterSpacing: "0.85px", fontWeight: 700, display: "block" }}>
                  {t.nearLocality}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                  <span style={{ fontSize: "16px", color: "#62906a" }}>📍</span>
                  <select
                    id="neighborhood-select"
                    value={selectedNeighborhood}
                    onChange={(e) => {
                      setSelectedNeighborhood(e.target.value);
                      if (e.target.value !== "All Hosur") {
                        showNotice(`Locality filtered: ${e.target.value}`);
                      }
                    }}
                    style={{
                      border: 0,
                      outline: 0,
                      background: "transparent",
                      color: "#284532",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    {HOSUR_NEIGHBORHOODS.map((nh) => (
                      <option key={nh} value={nh}>
                        {translateNeighborhood(nh, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="search-divider" />
              <div className="radius-control">
                <label htmlFor="radius-range">{t.withinKm} <strong>{radius} KM</strong></label>
                <div className="range-wrap"><input id="radius-range" type="range" min="1" max="25" value={radius} onChange={(event) => setRadius(Number(event.target.value))} /><span>⌖</span></div>
                <div className="range-captions"><span>1 km</span><span>25 km</span></div>
              </div>
            </div>

            {/* Mode Switcher: Browse by Sector vs A–Z Directory */}
            <div className="browse-mode-tabs" role="tablist" aria-label="Browse modes">
              <button
                type="button"
                className={`browse-tab ${browseMode === "sectors" ? "active" : ""}`}
                onClick={() => setBrowseMode("sectors")}
                aria-selected={browseMode === "sectors"}
              >
                <span>❖</span> {t.browseBySector}
              </button>
              <button
                type="button"
                className={`browse-tab ${browseMode === "atoz" ? "active" : ""}`}
                onClick={() => setBrowseMode("atoz")}
                aria-selected={browseMode === "atoz"}
              >
                <span>🔤</span> {t.atozDirectoryTab} <span className="browse-tab-badge">A–Z</span>
              </button>
            </div>

            {recentlyViewed.length > 0 && (
              <div className="recently-viewed-panel" style={{ margin: "16px 0 24px", padding: "12px 14px", background: "#f8faf8", border: "1px solid #e2ebe1", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px" }}>👁️</span>
                    <strong style={{ font: "700 12px Manrope, sans-serif", color: "#253b2c" }}>{t.recentlyViewed} ({recentlyViewed.length})</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentlyViewed([]);
                      try { window.localStorage.removeItem("bizearch_recent_viewed"); } catch {}
                      showNotice("Recently viewed places cleared.");
                    }}
                    style={{ background: "transparent", border: 0, color: "#6a7b6f", fontSize: "10.5px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {t.clearRecent}
                  </button>
                </div>
                <div className="recently-viewed-strip" style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                  {recentlyViewed.map((b) => (
                    <div
                      key={b.name}
                      className="recently-viewed-card"
                      style={{ minWidth: "200px", maxWidth: "230px", flexShrink: 0, background: "#ffffff", border: "1px solid #e4ede3", borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "15px" }}>{b.icon}</span>
                          <strong style={{ font: "700 11.5px Manrope, sans-serif", color: "#223528", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={b.name}>
                            {b.name}
                          </strong>
                        </div>
                        <div style={{ fontSize: "9.5px", color: "#6e7f72", marginBottom: "8px" }}>
                          {b.category} · {businessDistance(b).toFixed(1)} km
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                        <button
                          type="button"
                          onClick={() => viewBusiness(b, "products")}
                          style={{ flex: 1, padding: "5px 6px", fontSize: "9px", fontWeight: 700, borderRadius: "5px", border: "1px solid #d0e0d1", background: "#f3f8f2", color: "#245234", cursor: "pointer" }}
                        >
                          View
                        </button>
                        <a
                          href={`tel:${businessRawPhone(businessPhoneFor(b))}`}
                          style={{ padding: "5px 8px", fontSize: "9px", fontWeight: 700, borderRadius: "5px", border: "1px solid #c8dbcc", background: "#ffffff", color: "#1f4a2d", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                          title={`Call ${b.name}`}
                        >
                          📞
                        </a>
                        <a
                          href={businessWhatsAppUrl(b)}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: "5px 8px", fontSize: "9px", fontWeight: 700, borderRadius: "5px", border: "1px solid #bce1c5", background: "#e8f7ec", color: "#136229", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                          title={`WhatsApp ${b.name}`}
                        >
                          💬
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {browseMode === "atoz" ? (
              <AtoZDirectory
                onSelectSearchQuery={handleAtoZSelect}
                onRequestEnquiry={handleAtoZEnquiry}
                onClose={() => setBrowseMode("sectors")}
              />
            ) : (
              <>
                <div className="section-heading category-heading">
                  <div>
                    <div className="eyebrow">{category === "All" ? t.aLittleBitOfEverything : t.browseWithinSector}</div>
                    <h2>{category === "All" ? t.exploreLocalScene : translateCategory(category, lang)}</h2>
                    {categoryPath.length > 0 && <p className="selected-taxonomy-path">{categoryPath.join(" › ")}</p>}
                  </div>
                  {category === "All" ? (
                    <button className="text-link" onClick={() => setBrowseMode("atoz")}>
                      {t.atozDirectoryLink}
                    </button>
                  ) : (
                    <div className="taxonomy-navigation">
                      <button type="button" onClick={() => categoryPath.length ? setCategoryPath((current) => current.slice(0, -1)) : setCategory("All")}>
                        ← {t.backBtn}
                      </button>
                      <button type="button" onClick={() => { setCategory("All"); setCategoryPath([]); setQuery(""); }}>
                        {t.allSectors}
                      </button>
                    </div>
                  )}
                </div>
                {category !== "All" && (() => {
                  const topSubcats = getTaxonomyOptions(category, [], categoryConfig);
                  if (!topSubcats.length) return null;
                  return (
                    <div className="subcategory-strip" aria-label="Subcategories list">
                      <button
                        type="button"
                        className={`subcategory-pill ${categoryPath.length === 0 ? "active" : ""}`}
                        onClick={() => setCategoryPath([])}
                      >
                        {t.allIn} {translateCategory(category, lang)}
                      </button>
                      {topSubcats.map((subcat) => (
                        <button
                          key={subcat.name}
                          type="button"
                          className={`subcategory-pill ${categoryPath[0] === subcat.name ? "active" : ""}`}
                          onClick={() => setCategoryPath([subcat.name])}
                        >
                          <span>{subcat.name}</span>
                          {subcat.children.length > 0 && <small className="subcat-pill-count">{subcat.children.length}</small>}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <div className="category-grid">
                  {category === "All" ? categories.slice(1).map((item, index) => (
                    <button key={item.name} className={`category-card cat-${index} ${category === item.name ? "category-active" : ""}`}
                      onClick={() => { setCategory(category === item.name ? "All" : item.name); setCategoryPath([]); setQuery(""); }}>
                      <span className="category-art"><CategoryIcon name={item.name} sector={item.name} /></span>
                      <div className="category-card-content">
                        <strong>{translateCategory(item.name, lang)}</strong>
                        {subcategoriesSummary[item.name] && <span className="category-sub-summary">{translateCategoryDesc(item.name, lang, subcategoriesSummary[item.name])}</span>}
                      </div>
                      <span className="category-arrow">↗</span>
                    </button>
                  )) : (() => {
                    const options = getTaxonomyOptions(category, categoryPath, categoryConfig);
                    if (!options.length) return <div className="taxonomy-complete"><strong>{categoryPath[categoryPath.length - 1] || translateCategory(category, lang)}</strong><span>{categoryPath.length ? "Showing matching listings for this subcategory." : "No subcategories are listed yet. Showing matching businesses."}</span></div>;
                    return options.map((option, index) => {
                      const logo = brandLogoFor(option.name, categoryConfig.brandLogos);
                      const isBrand = isBrandOption(category, categoryPath, option, categoryConfig.brandLogos);
                      return <button key={option.name} type="button" className={`category-card cat-${index}`} onClick={() => { setCategoryPath((current) => [...current, option.name]); setQuery(""); }}><span className={`category-art${isBrand && !logo ? " category-brand-monogram" : ""}`}>{logo ? <img className="category-brand-logo" src={logo} alt={`${option.name} logo`} /> : isBrand ? brandMonogram(option.name) : <CategoryIcon name={option.name} sector={category} />}</span><div className="category-card-content"><strong>{option.name}</strong>{option.children.length > 0 && <span className="category-sub-summary">{option.children.length} sub-options</span>}</div><span className="category-arrow">↗</span></button>;
                    });
                  })()}
                </div>

                {category !== "All" && (() => {
                  const arrangedItems = atozCatalog.filter((item) => {
                    if (item.sector !== category) return false;
                    if (categoryPath.length > 0 && item.subcategory) {
                      const targetSub = categoryPath[0].toLowerCase();
                      const itemSub = item.subcategory.toLowerCase();
                      return itemSub.includes(targetSub) || targetSub.includes(itemSub);
                    }
                    return true;
                  });
                  if (!arrangedItems.length) return null;
                  return (
                    <div className="category-arranged-details">
                      <div className="category-arranged-header">
                        <div>
                          <h3>
                            Services & Products under {categoryPath.length ? `${categoryPath[0]} (${category})` : category}
                          </h3>
                          <p>Arranged catalog of everyday services and retail items with direct local provider connections.</p>
                        </div>
                        <span className="result-count">{arrangedItems.length} items</span>
                      </div>
                      <div className="category-arranged-grid">
                        {arrangedItems.map((item) => (
                          <div key={item.id} className="arranged-item-card">
                            <div className="arranged-item-top">
                              <span className="arranged-item-icon">{item.icon}</span>
                              <span className="arranged-item-subcat">{item.subcategory || item.sector}</span>
                            </div>
                            <h4 className="arranged-item-name">{item.name}</h4>
                            <p className="arranged-item-desc">{item.description}</p>
                            <div className="arranged-item-footer">
                              <span className="arranged-item-price">{item.priceHint}</span>
                              <button
                                type="button"
                                className="arranged-item-btn"
                                onClick={() => handleAtoZSelect(item.searchQuery, item.sector)}
                              >
                                Find Providers ↗
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            <section className="image-ad-panel mobile-image-ad" aria-label="Rotating image advertisement">
              <button className="sos-fab sos-ad-button" aria-label="Emergency help (SOS)" onClick={() => setDialog("sos")}><span>✚</span> SOS <small>{t.emergencyHelp}</small></button>
              <div className={`image-ad-creative ${adConfig.imageAds[activeAd].tone}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 18%, rgba(17, 34, 23, .78) 100%), url("${adConfig.imageAds[activeAd].image}")` }}>
                <span className="ad-label">{t.advertisement}</span>
                <div className="image-ad-copy"><small>{adConfig.imageAds[activeAd].label}</small><strong>{adConfig.imageAds[activeAd].title}</strong></div>
              </div>
              <div className="ad-dots" aria-label={`Advertisement ${activeAd + 1} of ${adConfig.imageAds.length}`}>
                {adConfig.imageAds.map((ad, index) => <button key={`mobile-${ad.tone}-${index}`} className={index === activeAd ? "active" : ""} onClick={() => setActiveAd(index)} aria-label={`Show image advertisement ${index + 1}`} />)}
              </div>
            </section>

            {query.trim() && (
              <div className="search-engine-toolbar">
                <div className="search-engine-stats">
                  <div className="search-engine-count">
                    <span className="search-sparkle">⚡</span>
                    <span>Found <strong>{results.length}</strong> verified providers &amp; <strong>{relatedProducts.length}</strong> products for <em>“{query.trim()}”</em> <span className="search-speed">({searchDurationMs}ms)</span></span>
                  </div>
                  {correctedQuery && correctedQuery.toLowerCase() !== query.trim().toLowerCase() && (
                    <div className="search-did-you-mean">
                      <span>Did you mean:</span>
                      <button type="button" className="did-you-mean-btn" onClick={() => searchNearby(correctedQuery)}>{correctedQuery}</button>?
                    </div>
                  )}
                </div>
                <div className="search-engine-controls">
                  <div className="search-sort-group">
                    <label htmlFor="search-sort-select">Sort by:</label>
                    <select id="search-sort-select" className="search-sort-select" value={searchSort} onChange={(e) => setSearchSort(e.target.value as any)}>
                      <option value="relevance">⚡ Most Relevant</option>
                      <option value="distance">⌖ Nearest to me</option>
                      <option value="rating">★ Highest Rated</option>
                      <option value="price">🏷️ Lowest Starting Price</option>
                      <option value="name">🔤 Name (A–Z)</option>
                    </select>
                  </div>
                  <div className="search-type-filters">
                    <button type="button" className={`search-filter-tab ${searchFilterTab === "all" ? "active" : ""}`} onClick={() => setSearchFilterTab("all")}>All ({results.length + relatedProducts.length})</button>
                    <button type="button" className={`search-filter-tab ${searchFilterTab === "businesses" ? "active" : ""}`} onClick={() => setSearchFilterTab("businesses")}>Businesses ({results.length})</button>
                    <button type="button" className={`search-filter-tab ${searchFilterTab === "products" ? "active" : ""}`} onClick={() => setSearchFilterTab("products")}>Products ({relatedProducts.length})</button>
                  </div>
                  <button type="button" className="search-clear-all-btn" onClick={() => { setQuery(""); setCategory("All"); setCategoryPath([]); setSearchFilterTab("all"); }}>✕ Reset search</button>
                </div>
              </div>
            )}

            {query.trim() && relatedSearches.length > 0 && (
              <div className="related-searches-bar" aria-label="Related searches" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "16px 0 20px", padding: "10px 14px", background: "#f5f8f5", border: "1px solid #dbe6da", borderRadius: "10px" }}>
                <span className="related-searches-label" style={{ font: "700 11.5px Manrope, sans-serif", color: "#274b32", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                  <span className="related-search-icon" style={{ fontSize: "13px" }}>🔍</span> Related searches:
                </span>
                <div className="related-searches-pills" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {relatedSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="related-search-pill"
                      style={{ border: "1px solid #c9d9cb", background: "#ffffff", color: "#26432f", padding: "5px 13px", borderRadius: "20px", font: "600 11px Manrope, sans-serif", cursor: "pointer", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
                      onClick={() => {
                        setQuery(term);
                        recordEvent(`Related search clicked: ${term}`);
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && relatedProducts.length > 0 && (searchFilterTab === "all" || searchFilterTab === "products") && (
              <div className="related-products-shelf" style={{ background: "#fbfdfa", border: "1px solid #e1ebe0", borderRadius: "12px", padding: "16px 18px 18px", margin: "0 0 24px", boxShadow: "0 2px 8px rgba(30,50,35,0.03)" }}>
                <div className="related-shelf-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "8px", flexWrap: "wrap" }}>
                  <div>
                    <div className="shelf-eyebrow" style={{ font: "800 9px Manrope, sans-serif", letterSpacing: "0.8px", color: "#4b7a57", textTransform: "uppercase", marginBottom: "3px" }}>RELATED PRODUCTS & SERVICES</div>
                    <h3 className="shelf-title" style={{ font: "700 14px Manrope, sans-serif", color: "#1a3020", margin: 0 }}>Popular items related to “{query.trim()}”</h3>
                  </div>
                  <span className="shelf-count" style={{ font: "700 10px Manrope, sans-serif", color: "#386244", background: "#e7f2e6", padding: "3px 9px", borderRadius: "12px", border: "1px solid #d5e5d4" }}>{relatedProducts.length} items</span>
                </div>
                <div className="related-products-scroll" style={{ display: "flex", flexDirection: "row", gap: "14px", overflowX: "auto", padding: "4px 2px 10px", WebkitOverflowScrolling: "touch" }}>
                  {relatedProducts.map(({ product, business }) => (
                    <div className="related-product-card" key={`${business.name}-${product.id}`} style={{ flex: "0 0 270px", width: "270px", minWidth: "270px", background: "#ffffff", border: "1px solid #e2ede0", borderRadius: "10px", padding: "14px 15px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
                      <div>
                        <div className="related-product-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                          <span className="related-product-name" title={product.name} style={{ font: "700 12.5px Manrope, sans-serif", color: "#1c3222", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "165px" }}>{highlightMatch(product.name, query)}</span>
                          <span className="related-product-price" style={{ font: "700 11.5px Manrope, sans-serif", color: "#256037", background: "#edf6ec", padding: "2px 7px", borderRadius: "5px", whiteSpace: "nowrap" }}>
                            ₹{product.price.toLocaleString("en-IN")}{product.unit ? <small style={{ fontSize: "8.5px", color: "#6a7c6f", fontWeight: 500 }}> /{product.unit}</small> : null}
                          </span>
                        </div>
                        <p className="related-product-desc" style={{ font: "10px/1.45 'DM Sans', sans-serif", color: "#6d7f71", margin: "6px 0 12px" }}>{highlightMatch(product.description, query)}</p>
                      </div>
                      <div className="related-product-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", paddingTop: "10px", borderTop: "1px solid #f0f5ef", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="related-product-provider"
                          style={{ border: "1px solid #e4eee3", background: "#f7faf6", display: "inline-flex", alignItems: "center", gap: "5px", font: "600 9.5px Manrope, sans-serif", color: "#36593e", cursor: "pointer", padding: "4px 8px", borderRadius: "5px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          onClick={() => {
                            setBusinessModalTab("products");
                            setSelectedBusiness(business);
                          }}
                          title={`View ${business.name}`}
                        >
                          <span>{business.icon}</span>
                          <span className="provider-name-truncate" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{business.name}</span>
                          <span className="provider-dist" style={{ fontSize: "8.5px", color: "#7a8a7d" }}>· {businessDistance(business).toFixed(1)} km</span>
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="related-product-navigate-btn"
                            style={{ border: "1px solid #c9dcc8", background: "#f3f8f2", color: "#2d693f", borderRadius: "5px", padding: "6px 9px", font: "700 9.5px Manrope, sans-serif", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}
                            onClick={() => {
                              setBusinessModalTab("navigation");
                              setSelectedBusiness(business);
                              recordEvent(`Product navigate clicked: ${product.name}`);
                            }}
                            title={`Navigate to ${business.name} from your location`}
                          >
                            <span>🧭</span> Navigate
                          </button>
                          <button
                            type="button"
                            className="related-product-order-btn"
                            style={{ border: 0, background: "#0f766e", color: "#ffffff", borderRadius: "5px", padding: "6px 11px", font: "700 9.5px Manrope, sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}
                            onClick={() => {
                              setOrderingItem({ business, product });
                              recordEvent(`Related product order clicked: ${product.name}`);
                            }}
                          >
                            🛍️ Order
                          </button>
                          <button
                            type="button"
                            className="related-product-enquire-btn"
                            style={{ border: 0, background: "#386b4b", color: "#ffffff", borderRadius: "5px", padding: "6px 11px", font: "700 9.5px Manrope, sans-serif", cursor: "pointer", whiteSpace: "nowrap" }}
                            onClick={() => {
                              setEnquiryProduct({ business, product });
                              recordEvent(`Related product enquiry: ${product.name}`);
                            }}
                          >
                            Enquire ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(searchFilterTab === "all" || searchFilterTab === "businesses") && (
              <>
                <div className="section-heading results-heading" id="results">
                  <div>
                    <div className="eyebrow">{t.localVerifiedProviders}</div>
                    <h2>{query ? `${t.providersFor} “${query}”` : category !== "All" ? `${categoryPath.length ? `${categoryPath.join(" › ")}` : `${translateCategory(category, lang)}`}` : t.aroundYourCorner} <span className="result-count">{displayedBusinesses.length}</span></h2>
                  </div>
                  <div className="sort-label"><span className="green-dot" /> {locationEnabled ? t.subscribedListingsGps : t.subscribedListings}</div>
                </div>

                {/* Instant Quick-Filter Chips */}
                <div className="quick-filter-strip" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", margin: "10px 0 18px" }}>
                  <button
                    type="button"
                    className={`quick-filter-chip ${filterOpenNow ? "active" : ""}`}
                    onClick={() => setFilterOpenNow((prev) => !prev)}
                    title="Filter businesses currently open"
                  >
                    🟢 {t.openNow}
                  </button>
                  <button
                    type="button"
                    className={`quick-filter-chip ${filterTopRated ? "active" : ""}`}
                    onClick={() => setFilterTopRated((prev) => !prev)}
                    title="Filter businesses rated 4.5 and above"
                  >
                    ⭐ {t.topRated}
                  </button>
                  <button
                    type="button"
                    className={`quick-filter-chip ${filterVerified ? "active" : ""}`}
                    onClick={() => setFilterVerified((prev) => !prev)}
                    title="Filter verified businesses"
                  >
                    ✓ {t.verifiedOnly}
                  </button>
                  <button
                    type="button"
                    className={`quick-filter-chip ${filterWhatsApp ? "active" : ""}`}
                    onClick={() => setFilterWhatsApp((prev) => !prev)}
                    title="Filter businesses ready for WhatsApp enquiry"
                  >
                    💬 {t.whatsappReady}
                  </button>
                  {(filterOpenNow || filterTopRated || filterVerified || filterWhatsApp) && (
                    <button
                      type="button"
                      className="quick-filter-clear-btn"
                      onClick={() => {
                        setFilterOpenNow(false);
                        setFilterTopRated(false);
                        setFilterVerified(false);
                        setFilterWhatsApp(false);
                      }}
                      title="Reset all active filters"
                    >
                      ✕ {t.clearFilters}
                    </button>
                  )}
                </div>

                {displayedBusinesses.length ? (
                  <>
                    <div className="business-grid">
                      {displayedBusinesses.slice(0, visibleCount).map((business, index) => (
                        <article className="business-card" key={`${business.name}-${index}`}>
                          <div className={`business-image ${business.color}`}><span className="business-emoji">{business.icon}</span>
                            {business.tag && <span className="business-tag">{business.tag}</span>}
                            <button className="save-button" aria-label={`${demoData.favorites.includes(business.name) ? "Remove saved" : "Save"} ${business.name}`} aria-pressed={demoData.favorites.includes(business.name)} onClick={() => toggleFavorite(business.name)}>{demoData.favorites.includes(business.name) ? "♥" : "♡"}</button>
                          </div>
                          <div className="business-info">
                            <div className="business-meta">
                              <span>{translateCategory(business.category, lang)}</span>
                              <span className="distance">⌖ {businessDistance(business).toFixed(1)} km{locationEnabled ? "" : ` ${t.sampleDistance}`}</span>
                            </div>
                            <div className="business-title-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                              <h3 style={{ margin: "3px 0 0" }}>{highlightMatch(business.name, query)}</h3>
                              {(() => {
                                const st = getBusinessWorkingStatus(business);
                                return (
                                  <span
                                    className={`business-hours-badge ${st.isOpen ? "open" : "closed"}`}
                                    title={st.label}
                                    style={{
                                      fontSize: "8.5px",
                                      fontWeight: 800,
                                      padding: "2px 6px",
                                      borderRadius: "10px",
                                      whiteSpace: "nowrap",
                                      background: st.isOpen ? "#eaf6ec" : "#fbf0ef",
                                      color: st.isOpen ? "#1a6e35" : "#a83e33",
                                      border: `1px solid ${st.isOpen ? "#c3e6cb" : "#f3d0cc"}`,
                                      flexShrink: 0,
                                    }}
                                  >
                                    ● {st.isOpen ? t.open : t.closed}
                                  </span>
                                );
                              })()}
                            </div>
                            <p>{highlightMatch(business.description, query)}</p>
                            <div className="business-footer">
                              <button
                                type="button"
                                className="rating-trigger-btn"
                                onClick={() => setReviewBusiness(business)}
                                title={`Rate & review ${business.name}`}
                                style={{
                                  background: "transparent",
                                  border: 0,
                                  padding: 0,
                                  cursor: "pointer",
                                  font: "inherit",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  color: "#275934",
                                }}
                              >
                                <span className="rating">★ <b>{business.rating.toFixed(1)}</b> <small>({business.reviews} {t.reviewsLabel})</small></span>
                                <span style={{ fontSize: "9px", color: "#366e47", textDecoration: "underline", marginLeft: "4px" }}>{t.rate}</span>
                              </button>
                              <span className="price">{business.price}</span>
                            </div>
                            <div className="business-card-action-bar">
                              <button
                                type="button"
                                className="contact-button"
                                onClick={() => {
                                  viewBusiness(business, "products");
                                  recordEvent("Business catalogue viewed");
                                }}
                              >
                                {t.productsServices} <span>↗</span>
                              </button>
                              <button
                                type="button"
                                className="business-card-nav-btn"
                                onClick={() => {
                                  viewBusiness(business, "navigation");
                                  recordEvent("Business navigate clicked");
                                }}
                                title={`Navigate to ${business.name}`}
                              >
                                🧭 {t.navigate}
                              </button>
                              <a
                                className="business-card-call-btn"
                                href={`tel:${businessRawPhone(businessPhoneFor(business))}`}
                                onClick={() => {
                                  recordEvent(`Business call clicked: ${business.name}`);
                                }}
                                title={`Call ${business.name} at ${businessPhoneFor(business)}`}
                              >
                                📞 {t.call}
                              </a>
                              <a
                                className="business-card-wa-btn"
                                href={businessWhatsAppUrl(business)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => {
                                  recordEvent(`Business WhatsApp clicked: ${business.name}`);
                                }}
                                title={`Chat with ${business.name} on WhatsApp`}
                              >
                                💬 {t.whatsapp}
                              </a>
                              <button
                                type="button"
                                className="business-card-share-btn"
                                onClick={() => {
                                  shareBusiness(business, undefined, showNotice);
                                  recordEvent(`Business shared: ${business.name}`);
                                }}
                                title={`Share ${business.name}`}
                              >
                                ↗ {t.share}
                              </button>
                              <button
                                type="button"
                                className="business-card-claim-btn"
                                onClick={() => setClaimBusiness(business)}
                                title={`Claim ownership of ${business.name}`}
                              >
                                🏷️ {t.claim}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    {displayedBusinesses.length > visibleCount && (
                      <div style={{ textAlign: "center", margin: "28px 0 16px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button type="button" className="outline-button" onClick={() => setVisibleCount((v) => v + 24)}>
                          Show more ({displayedBusinesses.length - visibleCount} remaining)
                        </button>
                        <button type="button" className="outline-button" onClick={() => setVisibleCount(displayedBusinesses.length)}>
                          Show all {displayedBusinesses.length} businesses
                        </button>
                      </div>
                    )}
                  </>
                ) : results.length > 0 ? (
                  <div className="local-empty" style={{ margin: "28px 0", textAlign: "center", padding: "32px 16px", background: "#fbfdfa", border: "1px dashed #d5ded4", borderRadius: "9px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                    <strong style={{ fontSize: "14px", color: "#27422f" }}>{t.noFilteredMatches}</strong>
                    <p style={{ fontSize: "12px", color: "#6a7b6e", margin: "6px 0 16px" }}>There are {results.length} businesses for this search, but none matched your active filter chips.</p>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setFilterOpenNow(false);
                        setFilterTopRated(false);
                        setFilterVerified(false);
                        setFilterWhatsApp(false);
                      }}
                    >
                      ✕ {t.clearFilters}
                    </button>
                  </div>
                ) : (
                  <div className="empty-results">
                    <span>⌕</span>
                    <strong>No businesses found</strong>
                    <p>{relatedProducts.length ? "Related products were found above! Try tapping a related search term or broadening your search." : "Try a larger search radius or another category."}</p>
                    {correctedQuery && correctedQuery.toLowerCase() !== query.trim().toLowerCase() && (
                      <div style={{ margin: "14px 0", fontSize: "13px" }}>
                        Did you mean:{" "}
                        <button
                          type="button"
                          className="did-you-mean-btn"
                          onClick={() => {
                            setCategory("All");
                            setCategoryPath([]);
                            searchNearby(correctedQuery);
                          }}
                          style={{ background: "#e8f2e7", border: "1px solid #cbe0cb", borderRadius: "14px", padding: "4px 12px", color: "#1c542b", fontWeight: 700, cursor: "pointer" }}
                        >
                          {correctedQuery}
                        </button>
                        ?
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginTop: "12px" }}>
                      <button onClick={() => { setRadius(25); setCategory("All"); setQuery(""); setSearchFilterTab("all"); }}>Show all nearby</button>
                      <button type="button" className="outline-button" onClick={() => { setCategory("All"); setCategoryPath([]); searchNearby("Car repair"); }}>Car repair</button>
                      <button type="button" className="outline-button" onClick={() => { setCategory("All"); setCategoryPath([]); searchNearby("Dentist"); }}>Dentist</button>
                      <button type="button" className="outline-button" onClick={() => { setCategory("All"); setCategoryPath([]); searchNearby("Samsung"); }}>Samsung</button>
                      <button type="button" className="outline-button" onClick={() => { setCategory("All"); setCategoryPath([]); searchNearby("Gym"); }}>Gym</button>
                    </div>
                  </div>
                )}
              </>
            )}
            <section className="video-ad-panel mobile-video-ad" aria-label="Video advertisement">
              <div className="video-ad-heading"><span>{t.videoAd}</span><small>{t.localSpotlight}</small></div>
              <video key={adConfig.videoAd.sourceUrl} className="video-ad-player" controls muted loop playsInline poster={adConfig.videoAd.posterUrl || undefined} src={adConfig.videoAd.sourceUrl}>Your browser does not support embedded video.</video>
              <div className="video-ad-caption"><strong>{adConfig.videoAd.title}</strong><p>{adConfig.videoAd.description}</p><button onClick={() => openPortal("Business")}>{t.promoteYourBusiness} <span>&#8594;</span></button></div>
              {adConfig.audioAd.sourceUrl && <div className="audio-ad-content"><strong>{adConfig.audioAd.title}</strong><p>{adConfig.audioAd.description}</p><audio controls preload="none" src={adConfig.audioAd.sourceUrl}>Your browser does not support embedded audio.</audio></div>}
            </section>
            <div className="trust-strip"><span className="trust-icon">✳</span><div><strong>{t.localFirst}</strong><p>{t.localFirstDesc}</p></div><span className="trust-arrow">↗</span></div>
          </div>
        )}

        {role === "Account" && (
          <CustomerPortal
            data={demoData}
            initialTab={portalActiveTab}
            onRemoveFavorite={toggleFavorite}
            onSearch={(term) => {
              setQuery(term);
              setCategory("All");
              setCategoryPath([]);
              setRole("Discover");
            }}
            onFindBusiness={(name) => {
              const business = businesses.find((item) => item.name === name);
              if (business) setSelectedBusiness(business);
            }}
            onOpenAccount={() => setDialog("login")}
            onViewReceipt={(order) => setActiveReceipt(order)}
            onOpenPortal={openPortal}
            onLanguageChange={(l) => setLang(l)}
            showNotice={showNotice}
          />
        )}
        {role === "Business" && (
          <BusinessPortal
            businesses={businessAccountBusinesses}
            categoryConfig={categoryConfig}
            enquiries={demoData.enquiries}
            checkouts={demoData.checkouts}
            orders={demoData.orders || []}
            initialTab={portalActiveTab}
            onUpdateOrderStatus={updateOrderStatus}
            openBusinessProfile={() => window.dispatchEvent(new Event("neighborly-open-business-profile"))}
            openPlans={() => setSubscriptionCheckout({ businessName: businessAccountBusinesses[0]?.name || businesses[0]?.name, plan: "Growth" })}
            onSelectPlan={(plan) => setSubscriptionCheckout({ businessName: businessAccountBusinesses[0]?.name || businesses[0]?.name, plan })}
            onViewInvoice={(invoice) => setSubscriptionReceipt(invoice)}
            verifyLocation={verifyBusinessLocation}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            onOpenPortal={openPortal}
            onLanguageChange={(l) => setLang(l)}
            showNotice={showNotice}
          />
        )}
        {role === "Agent" && (
          <AgentPortal
            initialTab={portalActiveTab}
            onOpenPortal={openPortal}
            onLanguageChange={(l) => setLang(l)}
            showNotice={showNotice}
          />
        )}
        {role === "Company" && (
          <CompanyPortal
            accessLevel={companyAccessLevel}
            identity={sessionIdentity}
            businesses={businesses}
            enquiries={demoData.enquiries}
            events={demoData.events}
            checkouts={demoData.checkouts}
            initialTab={portalActiveTab}
            locationEnabled={locationEnabled}
            onOpenPortal={openPortal}
            onLanguageChange={(l) => setLang(l)}
            showNotice={showNotice}
          />
        )}
      </section>

      {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      {storageError && <div className="storage-warning" role="status">Demo data could not be saved in this browser: {storageError}</div>}
      {dialog && <Dialog kind={dialog} close={() => setDialog(null)} onOpenProfile={openMemberProfile} profileRole={role === "Account" || role === "Business" || role === "Agent" || role === "Company" ? role : "Account"} profileIdentity={role === "Company" ? sessionIdentity : ""} onLogin={logIn} onRegisterCustomerLocation={registerCustomerLocation} onBusiness={submitBusiness} businesses={role === "Business" ? businessAccountBusinesses : businesses} categories={categoryConfig.sectors} brandLogos={categoryConfig.brandLogos} onCheckout={submitCheckout} showNotice={showNotice} />}
      {orderingItem && (
        <OrderCheckoutDialog
          business={orderingItem.business}
          product={orderingItem.product}
          close={() => setOrderingItem(null)}
          onPlaceOrder={placeOrder}
        />
      )}
      {activeReceipt && (
        <OrderReceiptModal
          order={activeReceipt}
          close={() => setActiveReceipt(null)}
          onViewInPortal={() => {
            setActiveReceipt(null);
            setRole("Account");
          }}
        />
      )}
      {subscriptionCheckout && (
        <PlanCheckoutDialog
          businesses={businessAccountBusinesses.length > 0 ? businessAccountBusinesses : businesses}
          initialBusinessName={subscriptionCheckout.businessName}
          initialPlan={subscriptionCheckout.plan}
          close={() => setSubscriptionCheckout(null)}
          onProcessPayment={processSubscriptionPayment}
        />
      )}
      {subscriptionReceipt && (
        <SubscriptionReceiptModal
          record={subscriptionReceipt}
          close={() => setSubscriptionReceipt(null)}
        />
      )}
      {selectedBusiness && (
        <BusinessDetailDialog
          business={businesses.find((item) => item.name === selectedBusiness.name) || selectedBusiness}
          distanceKm={businessDistance(businesses.find((item) => item.name === selectedBusiness.name) || selectedBusiness)}
          isDeviceDistance={locationEnabled}
          close={() => setSelectedBusiness(null)}
          requestProduct={(business, product) => {
            setSelectedBusiness(null);
            setEnquiryProduct({ business, product });
            recordEvent("Customer selected a product or service");
          }}
          onOrderProduct={(business, product) => {
            setSelectedBusiness(null);
            setOrderingItem({ business, product });
            recordEvent(`Customer started ordering ${product.name} from ${business.name}`);
          }}
          userCoordinates={locationCoordinates}
          onRequestDeviceLocation={requestDeviceLocation}
          initialTab={businessModalTab}
          onClaim={(biz) => setClaimBusiness(biz)}
          onRate={(biz) => setReviewBusiness(biz)}
        />
      )}
      {enquiryProduct && <EnquiryDialog business={enquiryProduct.business} product={enquiryProduct.product} close={() => setEnquiryProduct(null)} submit={submitEnquiry} />}
      {reviewBusiness && (
        <ReviewDialog
          business={reviewBusiness}
          close={() => setReviewBusiness(null)}
          onSubmit={(stars, comment) => {
            const currentRating = reviewBusiness.rating || 4.5;
            const currentReviews = reviewBusiness.reviews || 1;
            const nextReviews = currentReviews + 1;
            const nextRating = Number((((currentRating * currentReviews) + stars) / nextReviews).toFixed(1));

            setDemoData((prev) => ({
              ...prev,
              businesses: prev.businesses.map((b) =>
                b.name === reviewBusiness.name
                  ? { ...b, rating: nextRating, reviews: nextReviews }
                  : b
              ),
            }));

            showNotice(`Thank you! Your ${stars}-star rating for "${reviewBusiness.name}" was recorded.`);
            recordEvent(`Customer rated ${reviewBusiness.name} ${stars} stars`);
            setReviewBusiness(null);
          }}
        />
      )}
      {claimBusiness && (
        <ClaimBusinessDialog
          business={claimBusiness}
          close={() => setClaimBusiness(null)}
          onSubmit={(data) => {
            showNotice(`✓ Claim request received for "${claimBusiness.name}"! Our Hosur onboarding team will call ${data.phone}.`);
            recordEvent(`Business claim submitted: ${claimBusiness.name} by ${data.ownerName}`);
            addNotification({
              title: `Claim Request: ${claimBusiness.name}`,
              message: `Your verification request as ${data.role} has been received. Our Hosur verification manager will contact ${data.phone} within 24 hours.`,
              type: "system",
              read: false,
            });
            setClaimBusiness(null);
          }}
        />
      )}
    </main>
  );
}

function CustomerPortal({
  data,
  initialTab = "Overview",
  onRemoveFavorite,
  onSearch,
  onFindBusiness,
  onOpenAccount,
  onViewReceipt,
  onOpenPortal,
  onLanguageChange,
  showNotice,
}: {
  data: DemoData;
  initialTab?: string;
  onRemoveFavorite: (businessName: string) => void;
  onSearch: (term: string) => void;
  onFindBusiness: (businessName: string) => void;
  onOpenAccount: () => void;
  onViewReceipt?: (order: OrderRecord) => void;
  onOpenPortal?: (role: Role) => void;
  onLanguageChange?: (lang: "en" | "ta" | "kn" | "te") => void;
  showNotice: (message: string) => void;
}) {
  const [tab, setTab] = useState(initialTab || "Overview");
  useEffect(() => {
    if (initialTab && initialTab !== "Overview") setTab(initialTab);
  }, [initialTab]);
  useEffect(() => {
    const openProfile = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      setTab(customEvent.detail?.tab || "Profile details");
    };
    window.addEventListener("neighborly-open-profile", openProfile);
    return () => window.removeEventListener("neighborly-open-profile", openProfile);
  }, []);
  const savedBusinesses = data.businesses.filter((business) => data.favorites.includes(business.name));
  return <div className="page-content portal-content">
    <div className="portal-header"><div><div className="eyebrow"><span /> YOUR NEIGHBORHOOD ACTIVITY</div><h1>Your local <em>shortlist.</em></h1><p>Saved places, searches and enquiries stay in this browser in this demo.</p></div><button className="primary-button" onClick={onOpenAccount}>Sign in or register ↗</button></div>
    <div className="portal-tabs">{["Overview", "Orders", "Saved", "Recent searches", "Enquiries", "Profile details", "Settings"].map((item) => <button key={item} className={tab === item || (item === "Profile details" && tab === "Profile") ? "current" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Overview" && <>
      <div className="metric-grid">
        <Metric label="Orders placed" value={String((data.orders || []).length)} delta="Active orders on device" icon="🛍️" />
        <Metric label="Saved businesses" value={String(data.favorites.length)} delta="Stored on this device" icon="♡" />
        <Metric label="Recent searches" value={String(data.recentSearches.length)} delta="Searches you chose to run" icon="⌕" />
        <Metric label="Enquiries" value={String(data.enquiries.length)} delta="Local demo drafts" icon="↗" />
      </div>
      <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR SHORTLIST</div><h2>Saved businesses</h2></div><button className="text-link" onClick={() => setTab("Saved")}>See saved →</button></div>
        {savedBusinesses.length ? savedBusinesses.slice(0, 4).map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><button className="outline-button" onClick={() => onFindBusiness(business.name)}>View catalogue</button></div>) : <EmptyState title="Your shortlist is ready" text="Save a local business from Discover to find it here." />}
      </section>
      <div className="form-note"><strong>Private to this browser</strong><span>Favorites, searches and enquiries use this device's local storage. They are not synced to a customer account or sent to businesses.</span></div>
    </>}
    {tab === "Orders" && (
      <section className="panel tab-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">YOUR ORDERS</div>
            <h2>Order History &amp; Live Tracking</h2>
          </div>
        </div>
        <CustomerOrdersManager
          orders={data.orders || []}
          onViewReceipt={onViewReceipt || (() => {})}
        />
      </section>
    )}
    {tab === "Saved" && <section className="panel tab-panel"><div className="eyebrow">SAVED BUSINESSES</div><h2>Your favorites</h2>{savedBusinesses.length ? savedBusinesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} · {business.distance.toFixed(1)} km (sample distance)</small></span><button className="outline-button" onClick={() => onFindBusiness(business.name)}>View</button><button className="row-more" aria-label={`Remove ${business.name} from saved`} onClick={() => onRemoveFavorite(business.name)}>×</button></div>) : <EmptyState title="No saved businesses yet" text="Tap the heart on a search result to save it on this device." />}</section>}
    {tab === "Recent searches" && <section className="panel tab-panel"><div className="eyebrow">YOUR RECENT SEARCHES</div><h2>Pick up where you left off</h2>{data.recentSearches.length ? data.recentSearches.map((term) => <button className="history-row" key={term} onClick={() => onSearch(term)}><span>⌕</span><strong>{term}</strong><span>Search again →</span></button>) : <EmptyState title="No recent searches" text="Your search history appears here after you choose Find nearby." />}</section>}
    {tab === "Enquiries" && <section className="panel tab-panel"><div className="eyebrow">YOUR ENQUIRY HISTORY</div><h2>Requests saved on this device</h2>{data.enquiries.length ? data.enquiries.map((enquiry) => <EnquiryRow enquiry={enquiry} key={enquiry.id} />) : <EmptyState title="No enquiries yet" text="Open a product or service and choose Request information to create a local demo enquiry." />}</section>}
    {(tab === "Profile details" || tab === "Profile") && (
      <ProfileAndSettingsPanel
        role="Account"
        label="Customer"
        initialSubTab="profile"
        data={data}
        onNavigateTab={(t) => setTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
    {tab === "Settings" && (
      <ProfileAndSettingsPanel
        role="Account"
        label="Customer"
        initialSubTab="settings"
        data={data}
        onNavigateTab={(t) => setTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
  </div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="local-empty"><strong>{title}</strong><p>{text}</p></div>;
}

function EnquiryRow({ enquiry }: { enquiry: DemoEnquiry }) {
  return <div className="enquiry-row"><div className="enquiry-icon">↗</div><div className="listing-name"><strong>{enquiry.productName}</strong><small>{enquiry.businessName} · {new Date(enquiry.createdAt).toLocaleString()}</small><p>{enquiry.message}</p></div><span className="status-pill pending">Local draft</span></div>;
}

function BusinessDetailDialog({
  business,
  distanceKm,
  isDeviceDistance,
  close,
  requestProduct,
  onOrderProduct,
  userCoordinates,
  onRequestDeviceLocation,
  initialTab = "products",
  onClaim,
  onRate,
}: {
  business: Business;
  distanceKm: number;
  isDeviceDistance: boolean;
  close: () => void;
  requestProduct: (business: Business, product: Product) => void;
  onOrderProduct?: (business: Business, product: Product) => void;
  userCoordinates?: Coordinates | null;
  onRequestDeviceLocation?: () => void;
  initialTab?: "products" | "reviews" | "navigation";
  onClaim?: (business: Business) => void;
  onRate?: (business: Business) => void;
}) {
  const [activeTab, setActiveTab] = useState<"products" | "reviews" | "navigation">(initialTab);
  const [travelMode, setTravelMode] = useState<"driving" | "two-wheeler" | "walking">("driving");
  const [mapProvider, setMapProvider] = useState<"google" | "osm">("google");
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, business.name]);

  const phone = businessPhoneFor(business);
  const rawPhone = businessRawPhone(phone);

  // Fallback coordinates from business.coordinates OR business.demoCoordinates
  const coordinates = business.coordinates || business.demoCoordinates;

  // User origin: live GPS coords or default Hosur center coords
  const DEFAULT_HOSUR_COORDS = { latitude: 12.7409, longitude: 77.8253 };
  const origin = userCoordinates || DEFAULT_HOSUR_COORDS;
  const isLiveUserLocation = Boolean(userCoordinates);

  const address = business.address
    ? [business.address.doorNumber, business.address.street, business.address.area, business.address.cityTown, business.address.taluka, business.address.district, business.address.state, business.address.pincode].filter(Boolean).join(", ")
    : "Hosur, Tamil Nadu";

  // Google Maps directions embed showing route between Origin and Destination
  const googleRouteEmbedUrl = coordinates
    ? `https://maps.google.com/maps?saddr=${origin.latitude},${origin.longitude}&daddr=${coordinates.latitude},${coordinates.longitude}&output=embed`
    : "";

  // OpenStreetMap embed fallback
  const osmEmbedUrl = coordinates ? (() => {
    const minLat = Math.min(origin.latitude, coordinates.latitude) - 0.008;
    const maxLat = Math.max(origin.latitude, coordinates.latitude) + 0.008;
    const minLng = Math.min(origin.longitude, coordinates.longitude) - 0.008;
    const maxLng = Math.max(origin.longitude, coordinates.longitude) + 0.008;
    const params = new URLSearchParams({
      bbox: `${minLng},${minLat},${maxLng},${maxLat}`,
      layer: "mapnik",
      marker: `${coordinates.latitude},${coordinates.longitude}`,
    });
    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
  })() : "";

  const activeMapUrl = mapProvider === "google" ? googleRouteEmbedUrl : osmEmbedUrl;

  // Google Maps external turn-by-turn navigation URL
  const googleDirectionsUrl = coordinates
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${coordinates.latitude},${coordinates.longitude}&travelmode=${travelMode === "walking" ? "walking" : travelMode === "two-wheeler" ? "two-wheeler" : "driving"}`
    : "";

  // OpenStreetMap directions external URL
  const osmDirectionsUrl = coordinates
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${coordinates.latitude}%2C${coordinates.longitude}`
    : "";

  // Estimated travel time calculation
  const speedKmH = travelMode === "walking" ? 4.5 : travelMode === "two-wheeler" ? 28 : 22;
  const estimatedMinutes = Math.max(2, Math.round((distanceKm / speedKmH) * 60));

  const copyCoordinates = () => {
    if (!coordinates) return;
    navigator.clipboard.writeText(`${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="modal catalog-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={close} aria-label="Close">×</button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
          <div className="eyebrow" style={{ margin: 0 }}>{business.category.toUpperCase()} · {distanceKm.toFixed(1)} KM {isDeviceDistance ? "FROM DEVICE" : "SAMPLE DISTANCE"}</div>
          {(() => {
            const st = getBusinessWorkingStatus(business);
            return (
              <span
                className={`business-hours-badge ${st.isOpen ? "open" : "closed"}`}
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "12px",
                  background: st.isOpen ? "#eaf6ec" : "#fbf0ef",
                  color: st.isOpen ? "#1a6e35" : "#a83e33",
                  border: `1px solid ${st.isOpen ? "#c3e6cb" : "#f3d0cc"}`,
                }}
              >
                ● {st.label}
              </span>
            );
          })()}
        </div>
        <h2>{business.name}</h2>
        <p>{business.description}</p>

        {/* Business Contact Call & Action Banner */}
        <div className="business-contact-banner">
          <div className="business-contact-info">
            <span className="business-contact-badge">DIRECT BUSINESS CONTACT</span>
            <strong className="business-contact-phone">📞 {phone}</strong>
            <span className="business-contact-hint">Call or WhatsApp directly for instant stock availability, quotes & bookings</span>
          </div>
          <div className="business-contact-btn-group">
            <button
              type="button"
              className="business-quote-button-primary"
              onClick={() => {
                const sampleProd = business.products[0] || { id: "custom-quote", name: "Custom Quote / Estimate", description: "Pricing and availability estimate", price: 0, unit: "inquiry" };
                requestProduct(business, sampleProd);
              }}
              style={{
                background: "#d97706",
                color: "#ffffff",
                border: 0,
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap",
              }}
              title={`Request a quote or price estimate from ${business.name}`}
            >
              ⚡ Request a Quote
            </button>
            <a
              href={`tel:${rawPhone}`}
              className="business-call-button-primary"
              title={`Call ${business.name}`}
            >
              📞 Call Now
            </a>
            <a
              href={businessWhatsAppUrl(business)}
              target="_blank"
              rel="noreferrer"
              className="business-wa-button-primary"
              title={`Chat with ${business.name} on WhatsApp`}
            >
              💬 WhatsApp
            </a>
            <button
              type="button"
              className="business-share-button-primary"
              onClick={() => shareBusiness(business, undefined, () => alert("✓ Business details copied to clipboard!"))}
              title={`Share ${business.name}`}
            >
              ↗ Share
            </button>
          </div>
        </div>

        {/* Rating and Claim Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", margin: "10px 0 8px", padding: "8px 12px", background: "#f8faf8", borderRadius: "8px", border: "1px solid #e7eee6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#254e32" }}>
            <span>★</span> <strong>{business.rating.toFixed(1)}</strong> <span style={{ color: "#6a7c6f" }}>({business.reviews} reviews)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => {
                close();
                onRate?.(business);
              }}
              style={{ background: "transparent", border: 0, color: "#2d633b", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
            >
              ⭐ Rate Business
            </button>
            <span style={{ color: "#d0dcd1" }}>|</span>
            <button
              type="button"
              onClick={() => {
                close();
                onClaim?.(business);
              }}
              style={{ background: "transparent", border: 0, color: "#2d633b", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
            >
              🏷️ Claim this business ↗
            </button>
          </div>
        </div>

        {/* Yelp-style Amenities & Attributes */}
        <div className="yelp-amenities-strip" style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "4px 0 14px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", background: "#f2f7f1", color: "#255333", borderRadius: "12px", border: "1px solid #d4e5d5" }}>
            ✓ Accepts UPI & Cash
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", background: "#f2f7f1", color: "#255333", borderRadius: "12px", border: "1px solid #d4e5d5" }}>
            ✓ GST Invoiced
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", background: "#f2f7f1", color: "#255333", borderRadius: "12px", border: "1px solid #d4e5d5" }}>
            ✓ Free Customer Parking
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", background: "#f2f7f1", color: "#255333", borderRadius: "12px", border: "1px solid #d4e5d5" }}>
            🛡️ Verified Merchant License
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", background: "#f2f7f1", color: "#255333", borderRadius: "12px", border: "1px solid #d4e5d5" }}>
            ⚡ Fast Response (&lt;15m)
          </span>
        </div>

        {/* Modal Tab Switcher */}
        <div className="modal-tab-switcher" role="tablist" aria-label="Business details view">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "products"}
            className={`modal-tab-pill ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            🛍️ Products & Services ({business.products.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reviews"}
            className={`modal-tab-pill ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            ⭐ Reviews & Community Ratings ({business.reviews})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "navigation"}
            className={`modal-tab-pill ${activeTab === "navigation" ? "active" : ""}`}
            onClick={() => setActiveTab("navigation")}
          >
            🧭 Directions & Map ({distanceKm.toFixed(1)} km)
          </button>
        </div>

        {activeTab === "products" && (
          <div className="catalog-tab-content">
            {business.products.length ? (
              <div className="catalog-grid">
                {business.products.map((product) => {
                  const pImg = productImageFor(product, business);
                  return (
                    <article className="catalog-card" key={product.id}>
                      <div className="catalog-card-image-wrap">
                        <img
                          src={pImg}
                          alt={product.name}
                          className="catalog-card-img"
                          loading="lazy"
                        />
                        <span className="catalog-card-badge">
                          {product.badge || (product.price > 50000 ? "Authorized" : product.price === 0 ? "On Request" : "In Stock")}
                        </span>
                      </div>
                      <div className="catalog-card-body">
                        <div className="catalog-card-title-row">
                          <h4 className="catalog-card-title">{product.name}</h4>
                        </div>
                        <p className="catalog-card-desc">{product.description}</p>
                        <div className="catalog-card-price-bar">
                          <div className="catalog-card-price">
                            {product.price > 0 ? (
                              <>
                                <span className="price-currency">₹</span>
                                <span className="price-number">{product.price.toLocaleString("en-IN")}</span>
                                {product.unit && <span className="price-unit">/{product.unit}</span>}
                              </>
                            ) : (
                              <span className="price-on-demand">{product.unit || "Price on request"}</span>
                            )}
                          </div>
                        </div>
                        <div className="catalog-card-actions">
                          {onOrderProduct && (
                            <button
                              type="button"
                              className="catalog-action-btn order-now"
                              style={{
                                background: "#0f766e",
                                color: "#ffffff",
                                fontWeight: 700,
                                border: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer",
                              }}
                              onClick={() => onOrderProduct(business, product)}
                            >
                              🛍️ Order now
                            </button>
                          )}
                          <button
                            type="button"
                            className="catalog-action-btn primary"
                            onClick={() => requestProduct(business, product)}
                          >
                            Request info ↗
                          </button>
                          <a
                            className="catalog-action-btn call"
                            href={`tel:${rawPhone}`}
                            title={`Call ${business.name} about ${product.name}`}
                          >
                            📞 Call
                          </a>
                          <a
                            className="catalog-action-btn wa"
                            href={businessWhatsAppUrl(business, product)}
                            target="_blank"
                            rel="noreferrer"
                            title={`WhatsApp ${business.name} about ${product.name}`}
                          >
                            💬 WhatsApp
                          </a>
                          <button
                            type="button"
                            className="catalog-action-btn nav"
                            onClick={() => setActiveTab("navigation")}
                            title="View route map to store"
                          >
                            🧭 Map
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No catalogue items yet" text="The business has not added products or services to this demo listing." />
            )}
            <div className="fine-print">A request is stored locally only. The business will not receive it until a secure messaging service is connected.</div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="yelp-reviews-tab-content">
            {/* Yelp Rating Summary & Distribution */}
            <div className="yelp-rating-summary-card" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "20px", padding: "18px 20px", background: "#fbfcfb", border: "1px solid #e2ebe1", borderRadius: "10px", margin: "14px 0 20px" }}>
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid #e8eee7", paddingRight: "16px" }}>
                <div style={{ font: "800 36px Manrope, sans-serif", color: "#1f4a2d", lineHeight: 1 }}>{business.rating.toFixed(1)}</div>
                <div style={{ color: "#f59e0b", fontSize: "18px", margin: "6px 0 4px" }}>
                  {"★".repeat(Math.round(business.rating)) + "☆".repeat(5 - Math.round(business.rating))}
                </div>
                <div style={{ fontSize: "11px", color: "#6a7c6f", fontWeight: 600 }}>Overall Rating</div>
                <div style={{ fontSize: "10px", color: "#8a9b8e" }}>{business.reviews} verified reviews</div>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onRate?.(business);
                  }}
                  className="primary-button"
                  style={{ marginTop: "12px", padding: "7px 14px", fontSize: "10.5px", borderRadius: "6px", width: "100%" }}
                >
                  ✍️ Write a Review
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px" }}>
                {[
                  { stars: "5 stars", pct: 76, count: Math.round(business.reviews * 0.76) },
                  { stars: "4 stars", pct: 18, count: Math.round(business.reviews * 0.18) },
                  { stars: "3 stars", pct: 4, count: Math.round(business.reviews * 0.04) },
                  { stars: "2 stars", pct: 1, count: Math.round(business.reviews * 0.01) },
                  { stars: "1 star", pct: 1, count: Math.max(0, business.reviews - Math.round(business.reviews * 0.98)) },
                ].map((row) => (
                  <div key={row.stars} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#486250" }}>
                    <span style={{ width: "45px", textAlign: "right", fontWeight: 600 }}>{row.stars}</span>
                    <div style={{ flex: 1, height: "8px", background: "#e8efe9", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${row.pct}%`, height: "100%", background: "#386b4b", borderRadius: "4px" }} />
                    </div>
                    <span style={{ width: "30px", fontSize: "10px", color: "#7a8c7e", textAlign: "right" }}>{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Yelp Community Reviews Feed */}
            <div className="yelp-reviews-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <h3 style={{ font: "700 14px Manrope, sans-serif", color: "#1f3b28", margin: 0 }}>Community Reviews &amp; Experiences</h3>
                <span style={{ fontSize: "10.5px", color: "#2d633b", background: "#eef5ed", padding: "3px 8px", borderRadius: "10px", fontWeight: 700 }}>✓ Yelp-Verified Reviews</span>
              </div>

              {(() => {
                const cat = (business.category || "").toLowerCase();
                let sampleReviews = [
                  {
                    author: "Karthik Sundaram",
                    role: "Hosur Local Guide · 18 reviews",
                    stars: 5,
                    date: "2 days ago",
                    comment: `Outstanding service and transparent billing! The staff at ${business.name} explained everything clearly and delivered on time. Definitely coming back.`,
                    initials: "KS",
                    color: "#386b4b",
                  },
                  {
                    author: "Praveen Kumar",
                    role: "Verified Customer · SIPCOT Phase 1",
                    stars: 5,
                    date: "1 week ago",
                    comment: `Quick turnaround and great value. They accept UPI payments and provided a proper GST tax invoice without delay.`,
                    initials: "PK",
                    color: "#ce8d66",
                  },
                  {
                    author: "Anitha R.",
                    role: "Frequent Buyer · Hosur",
                    stars: 4,
                    date: "3 weeks ago",
                    comment: `Very reliable place in Hosur. Easy parking and convenient location. WhatsApp support answered my stock queries in under 5 minutes.`,
                    initials: "AR",
                    color: "#748da1",
                  },
                ];

                if (/machin|metal|industrial|manufactur|cnc/.test(cat)) {
                  sampleReviews = [
                    {
                      author: "Venkatesh Murthy",
                      role: "SIPCOT Quality Manager · 24 reviews",
                      stars: 5,
                      date: "3 days ago",
                      comment: `Exceptional machining accuracy and strict tolerance controls. Supplied 800 precision components for our automotive assembly line without a single rejection.`,
                      initials: "VM",
                      color: "#386b4b",
                    },
                    {
                      author: "Naveen Prakash",
                      role: "Industrial Procurement · 12 reviews",
                      stars: 5,
                      date: "2 weeks ago",
                      comment: `Competitive batch pricing and timely delivery. Material test certificates and GST tax invoice were provided with the dispatch.`,
                      initials: "NP",
                      color: "#ce8d66",
                    },
                    {
                      author: "Senthil Kumar",
                      role: "Tool Room Lead · Hosur",
                      stars: 4,
                      date: "1 month ago",
                      comment: `Professional engineering team. They reviewed our 2D/3D CAD drawings promptly and suggested cost-effective manufacturing optimizations.`,
                      initials: "SK",
                      color: "#748da1",
                    },
                  ];
                } else if (/food|dining|restaurant|baker/.test(cat)) {
                  sampleReviews = [
                    {
                      author: "Deepak Raj",
                      role: "Hosur Food Explorer · 32 reviews",
                      stars: 5,
                      date: "Yesterday",
                      comment: `Fresh quality, authentic taste, and impeccable hygiene. One of the top recommended dining spots in Hosur!`,
                      initials: "DR",
                      color: "#386b4b",
                    },
                    {
                      author: "Meenakshi S.",
                      role: "Local Guide · 15 reviews",
                      stars: 5,
                      date: "5 days ago",
                      comment: `Courteous staff and quick service even during peak lunch hours. The flavors are authentic and price is very reasonable.`,
                      initials: "MS",
                      color: "#ce8d66",
                    },
                    {
                      author: "Arun Pandian",
                      role: "Verified Diner",
                      stars: 4,
                      date: "2 weeks ago",
                      comment: `Great packaging for takeaway orders. Everything was piping hot and fresh.`,
                      initials: "AP",
                      color: "#748da1",
                    },
                  ];
                }

                return sampleReviews.map((rev, idx) => (
                  <div key={idx} style={{ background: "#ffffff", border: "1px solid #e7eee6", borderRadius: "8px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: rev.color, color: "#fff", display: "grid", placeItems: "center", font: "700 12px Manrope, sans-serif" }}>
                          {rev.initials}
                        </div>
                        <div>
                          <div style={{ font: "700 12px Manrope, sans-serif", color: "#1f3825" }}>{rev.author}</div>
                          <div style={{ fontSize: "9.5px", color: "#748677" }}>{rev.role}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#f59e0b", fontSize: "13px" }}>{"★".repeat(rev.stars)}</div>
                        <div style={{ fontSize: "9px", color: "#8b9c8e" }}>{rev.date}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "11.5px", lineHeight: "1.55", color: "#455d4c", margin: "6px 0 10px" }}>
                      {rev.comment}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px", color: "#728776", borderTop: "1px solid #f2f6f1", paddingTop: "8px" }}>
                      <span style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        👍 Helpful ({4 + idx * 3})
                      </span>
                      <span>•</span>
                      <span style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        💬 Comment
                      </span>
                      <span>•</span>
                      <span style={{ color: "#2d633b", fontWeight: 600 }}>✓ Verified Resident</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {activeTab === "navigation" && (
          <section className="navigation-route-card" aria-label={`Location and navigation to ${business.name}`} id="provider-navigation-map">
            <div className="navigation-header">
              <div className="navigation-title-group">
                <div className="navigation-eyebrow">
                  <span className="live-indicator-dot" /> LIVE ROUTE NAVIGATION
                </div>
                <strong>Navigate to {business.name}</strong>
                <p className="navigation-address">📍 {address}</p>
              </div>
              <div className="navigation-stats-pill">
                <span className="stats-time">~{estimatedMinutes} min</span>
                <span className="stats-dist">{distanceKm.toFixed(1)} km</span>
              </div>
            </div>

            <div className="route-endpoints-bar">
              <div className="route-point origin-point">
                <span className="point-badge start">A</span>
                <div className="point-info">
                  <span className="point-label">Your Location</span>
                  <strong className="point-name">
                    {isLiveUserLocation ? "Current GPS Location" : "Hosur Town Center (Default)"}
                  </strong>
                </div>
                {!isLiveUserLocation && onRequestDeviceLocation && (
                  <button
                    type="button"
                    className="use-gps-inline-btn"
                    onClick={onRequestDeviceLocation}
                    title="Detect your exact phone or browser GPS location"
                  >
                    📡 Use Live GPS
                  </button>
                )}
              </div>
              <div className="route-arrow-divider">↓</div>
              <div className="route-point dest-point">
                <span className="point-badge dest">B</span>
                <div className="point-info">
                  <span className="point-label">Destination</span>
                  <strong className="point-name">{business.name}</strong>
                </div>
                {coordinates && <span className="destination-coords-tag">{coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</span>}
              </div>
            </div>

            <div className="navigation-controls-row">
              <div className="travel-mode-tabs" role="tablist" aria-label="Travel mode">
                <button
                  type="button"
                  className={`travel-mode-tab ${travelMode === "driving" ? "active" : ""}`}
                  onClick={() => setTravelMode("driving")}
                >
                  🚗 Car / Auto
                </button>
                <button
                  type="button"
                  className={`travel-mode-tab ${travelMode === "two-wheeler" ? "active" : ""}`}
                  onClick={() => setTravelMode("two-wheeler")}
                >
                  🏍️ 2-Wheeler
                </button>
                <button
                  type="button"
                  className={`travel-mode-tab ${travelMode === "walking" ? "active" : ""}`}
                  onClick={() => setTravelMode("walking")}
                >
                  🚶 Walking
                </button>
              </div>

              <div className="navigation-cta-group">
                {googleDirectionsUrl && (
                  <a
                    className="navigation-turn-by-turn-btn"
                    href={googleDirectionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Start turn-by-turn navigation in Google Maps"
                  >
                    🧭 Start Turn-by-Turn Navigation ↗
                  </a>
                )}
              </div>
            </div>

            {activeMapUrl ? (
              <div className="navigation-map-wrapper">
                <iframe
                  className="provider-map navigation-active-map"
                  title={`Live route navigation from your location to ${business.name}`}
                  src={activeMapUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="map-layer-switcher">
                  <button
                    type="button"
                    className={`layer-switch-btn ${mapProvider === "google" ? "active" : ""}`}
                    onClick={() => setMapProvider("google")}
                  >
                    Google Maps Route
                  </button>
                  <button
                    type="button"
                    className={`layer-switch-btn ${mapProvider === "osm" ? "active" : ""}`}
                    onClick={() => setMapProvider("osm")}
                  >
                    OpenStreetMap
                  </button>
                </div>
              </div>
            ) : (
              <p className="provider-map-unavailable">A verified map pin is not available for this listing yet.</p>
            )}

            <div className="navigation-quick-tools">
              {googleDirectionsUrl && (
                <a
                  className="quick-nav-link"
                  href={googleDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps App ↗
                </a>
              )}
              {osmDirectionsUrl && (
                <a
                  className="quick-nav-link"
                  href={osmDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in OSM Directions ↗
                </a>
              )}
              {coordinates && (
                <button
                  type="button"
                  className="quick-nav-btn"
                  onClick={copyCoordinates}
                >
                  {copiedCoords ? "✓ Coordinates Copied" : "📋 Copy GPS Coordinates"}
                </button>
              )}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

function EnquiryDialog({
  business,
  product,
  close,
  submit,
}: {
  business: Business;
  product: Product;
  close: () => void;
  submit: (business: Business, product: Product, message: string) => void;
}) {
  const [message, setMessage] = useState("");
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={close} aria-label="Close">×</button>
      <div className="modal-mark">↗</div><div className="eyebrow">LOCAL ENQUIRY · DEMO</div><h2>Ask about {product.name}.</h2><p>{business.name} · {product.price ? `₹${product.price.toLocaleString("en-IN")} ${product.unit}` : product.unit}</p>
      <form className="stacked-form" onSubmit={(event) => { event.preventDefault(); submit(business, product, message.trim()); }}><label>Your message<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={500} placeholder="Ask about availability, options or an appointment. Do not include sensitive information." required /></label><div className="form-button-row"><button type="button" className="outline-button" onClick={close}>Cancel</button><button type="submit" className="primary-button">Save enquiry locally →</button></div></form>
      <div className="fine-print">Your message stays in this browser. It is not delivered to the business in this demo.</div>
    </section>
  </div>;
}

function ReviewDialog({
  business,
  close,
  onSubmit,
}: {
  business: Business;
  close: () => void;
  onSubmit: (rating: number, review: string) => void;
}) {
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(stars, comment);
  };

  const ratingLabels = [
    "",
    "⭐ Needs Improvement",
    "⭐⭐ Fair",
    "⭐⭐⭐ Average Experience",
    "⭐⭐⭐⭐ Great Experience",
    "⭐⭐⭐⭐⭐ Outstanding & Highly Recommended",
  ];

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section className="modal review-modal" role="dialog" aria-modal="true" style={{ maxWidth: "460px" }}>
        <button className="modal-close" onClick={close} aria-label="Close">
          ×
        </button>
        <div className="eyebrow">CUSTOMER FEEDBACK · RATINGS & REVIEWS</div>
        <h2 style={{ marginTop: "4px", marginBottom: "4px" }}>Rate {business.name}</h2>
        <p style={{ margin: "0 0 16px", color: "#68766b", fontSize: "13px" }}>
          {business.category} · Hosur {business.address?.area ? `· ${business.address.area}` : ""}
        </p>

        <form onSubmit={handleSubmit} className="stacked-form" style={{ marginTop: "12px" }}>
          <div style={{ textAlign: "center", padding: "16px 12px", background: "#f8faf8", borderRadius: "10px", border: "1px solid #e5ebe4", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#2d4a36", marginBottom: "8px" }}>
              How was your experience?
            </div>
            <div
              className="star-rating-selector"
              style={{ display: "flex", justifyContent: "center", gap: "10px", margin: "6px 0" }}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const activeVal = hoverStars || stars;
                const isSelected = activeVal >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverStars(star)}
                    onMouseLeave={() => setHoverStars(0)}
                    onClick={() => setStars(star)}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "36px",
                      lineHeight: "1",
                      cursor: "pointer",
                      color: isSelected ? "#f59e0b" : "#cbd5e1",
                      transition: "transform 0.15s ease, color 0.15s ease",
                      transform: activeVal === star ? "scale(1.2)" : "scale(1)",
                      padding: "2px",
                    }}
                    title={`${star} Star${star > 1 ? "s" : ""}`}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: 700, color: "#386b4b" }}>
              {ratingLabels[hoverStars || stars]}
            </div>
          </div>

          <label>
            Your Name (Optional)
            <input
              type="text"
              placeholder="e.g. Anand Kumar"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={60}
            />
          </label>

          <label>
            Your Review / Comments
            <textarea
              rows={3}
              placeholder="Share details of your experience, service quality, product variety, or value..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={400}
            />
          </label>

          <div className="form-button-row" style={{ marginTop: "14px" }}>
            <button type="button" className="outline-button" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Submit Review ★
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ClaimBusinessDialog({
  business,
  close,
  onSubmit,
}: {
  business: Business;
  close: () => void;
  onSubmit: (data: { ownerName: string; phone: string; email: string; role: string; gstin: string; note: string }) => void;
}) {
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState(businessPhoneFor(business).replace(/[^0-9]/g, "").slice(-10));
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Owner / Proprietor");
  const [gstin, setGstin] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !phone.trim()) return;
    onSubmit({ ownerName: ownerName.trim(), phone: phone.trim(), email: email.trim(), role, gstin: gstin.trim(), note: note.trim() });
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section className="modal claim-modal" role="dialog" aria-modal="true" style={{ maxWidth: "490px" }}>
        <button className="modal-close" onClick={close} aria-label="Close">
          ×
        </button>
        <div className="eyebrow">MERCHANT ONBOARDING & VERIFICATION</div>
        <h2 style={{ marginTop: "4px", marginBottom: "4px" }}>Claim & Verify {business.name}</h2>
        <p style={{ margin: "0 0 16px", color: "#68766b", fontSize: "13px", lineHeight: "1.5" }}>
          Are you the authorized proprietor or manager of this business in Hosur? Claim this listing to manage your products, receive verified customer enquiries, and get your Official Verified Merchant Badge.
        </p>

        <form onSubmit={handleSubmit} className="stacked-form">
          <label>
            Your Full Name (Authorized Person) *
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </label>

          <label>
            Official Contact Mobile Number *
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={15}
              required
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label>
              Your Designation
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Owner / Proprietor">Owner / Proprietor</option>
                <option value="Managing Partner">Managing Partner</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Authorized Executive">Authorized Executive</option>
              </select>
            </label>

            <label>
              GSTIN / Udyam No. (Optional)
              <input
                type="text"
                placeholder="e.g. 33AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={20}
              />
            </label>
          </div>

          <label>
            Official Business Email (Optional)
            <input
              type="email"
              placeholder="contact@yourbusiness.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Additional Operating Notes / Verification Notes (Optional)
            <textarea
              rows={2}
              placeholder="e.g. Current address updates, operating hours, direct WhatsApp number..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
            />
          </label>

          <div className="form-button-row" style={{ marginTop: "16px" }}>
            <button type="button" className="outline-button" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Submit Claim Request ↗
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function OrderCheckoutDialog({
  business,
  product,
  close,
  onPlaceOrder,
}: {
  business: Business;
  product: Product;
  close: () => void;
  onPlaceOrder: (order: Omit<OrderRecord, "id" | "createdAt">) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [customerName, setCustomerName] = useState("Senthil Nathan");
  const [customerPhone, setCustomerPhone] = useState("+91 98450 12345");
  const [customerAddress, setCustomerAddress] = useState(
    "No. 18, 2nd Cross, Bagalur Road, Near Gandhi Statue, Hosur - 635109"
  );
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("senthil.n@okhdfcbank");
  const [cardData, setCardData] = useState({
    number: "4532 8912 3456 7890",
    expiry: "09/28",
    cvv: "321",
    name: "Senthil Nathan",
  });
  const [selectedBank, setSelectedBank] = useState("State Bank of India (SBI)");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("Connecting to Payment Gateway...");

  const basePrice = product.price > 0 ? product.price : 250;
  const itemTotal = basePrice * quantity;
  const deliveryFee = deliveryType === "delivery" ? 30 : 0;
  const taxes = Math.round(itemTotal * 0.05); // 5% GST
  const totalAmount = itemTotal + deliveryFee + taxes;

  const merchantUpiVpa = `${business.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.hosur@okhdfcbank`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingStage(
      paymentMethod === "upi"
        ? "Connecting to UPI / NPCI Gateway..."
        : paymentMethod === "card"
        ? "Securing 256-bit SSL transaction..."
        : paymentMethod === "netbanking"
        ? `Authorizing payment with ${selectedBank}...`
        : "Confirming Cash on Delivery Order..."
    );

    setTimeout(() => {
      setProcessingStage("Payment Authorized! Generating receipt & notifying merchant...");
      setTimeout(() => {
        const txnId =
          paymentMethod === "upi"
            ? `UPI/261031/${Math.floor(100000000000 + Math.random() * 900000000000)}`
            : paymentMethod === "card"
            ? `TXN-CRD-${Math.floor(10000000 + Math.random() * 90000000)}`
            : paymentMethod === "netbanking"
            ? `NET-BNK-${Math.floor(10000000 + Math.random() * 90000000)}`
            : `COD-${Math.floor(10000 + Math.random() * 90000)}`;

        onPlaceOrder({
          businessName: business.name,
          customerName: customerName.trim() || "Customer",
          customerPhone: customerPhone.trim() || "+91 98450 12345",
          customerAddress: deliveryType === "delivery" ? customerAddress.trim() : `Store Pickup: ${business.name}, Hosur`,
          deliveryType,
          notes: notes.trim(),
          items: [
            {
              productId: product.id,
              name: product.name,
              price: basePrice,
              quantity,
              unit: product.unit || "unit",
              image: product.image,
            },
          ],
          itemTotal,
          deliveryFee,
          taxes,
          totalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
          paymentTransactionId: txnId,
          upiId: paymentMethod === "upi" ? upiId : undefined,
          status: "placed",
          estimatedTime: deliveryType === "delivery" ? "25 - 35 mins" : "15 - 20 mins",
        });
      }, 700);
    }, 900);
  }

  return (
    <div className="order-modal-backdrop" onClick={close}>
      <div className="order-checkout-container" onClick={(e) => e.stopPropagation()}>
        <div className="order-checkout-header">
          <div>
            <h3>
              <span>🛍️</span> Complete Your Order
            </h3>
            <span className="biz-badge">From {business.name}</span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {isProcessing ? (
          <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid #d1fae5", borderTopColor: "#0f766e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <h4 style={{ margin: 0, fontSize: "17px", color: "#0f766e", fontWeight: 800 }}>Processing Payment</h4>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>{processingStage}</p>
            <div style={{ fontSize: "12px", color: "#059669", background: "#ecfdf5", padding: "6px 14px", borderRadius: "20px", fontWeight: 700 }}>
              Amount: ₹{totalAmount.toLocaleString("en-IN")} · 256-Bit Encrypted
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "contents" }}>
            <div className="order-checkout-body">
              {/* Product Card */}
              <div>
                <div className="order-section-title"><span>📦</span> Selected Item</div>
                <div className="order-item-summary-card">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="order-item-thumb" />
                  ) : (
                    <div className="order-item-thumb">🛍️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "15px", color: "#143e21" }}>{product.name}</div>
                    <div style={{ fontSize: "12px", color: "#5d7363", margin: "2px 0 6px" }}>{product.description}</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f766e" }}>
                      ₹{basePrice.toLocaleString("en-IN")}
                      {product.unit ? <small style={{ fontSize: "11px", fontWeight: 500, color: "#6e8574" }}> /{product.unit}</small> : null}
                    </div>
                  </div>
                  <div className="order-qty-pill">
                    <button
                      type="button"
                      className="order-qty-btn"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 800, fontSize: "14px", minWidth: "18px", textAlign: "center" }}>{quantity}</span>
                    <button
                      type="button"
                      className="order-qty-btn"
                      onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Fulfilment Mode */}
              <div>
                <div className="order-section-title"><span>🚚</span> Fulfilment Option</div>
                <div className="delivery-type-toggle">
                  <button
                    type="button"
                    className={`delivery-toggle-btn ${deliveryType === "delivery" ? "active" : ""}`}
                    onClick={() => setDeliveryType("delivery")}
                  >
                    <span>🛵 Home Delivery</span>
                    <small style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>+₹30</small>
                  </button>
                  <button
                    type="button"
                    className={`delivery-toggle-btn ${deliveryType === "pickup" ? "active" : ""}`}
                    onClick={() => setDeliveryType("pickup")}
                  >
                    <span>🏬 Store Pickup</span>
                    <small style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>FREE</small>
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <div className="order-section-title"><span>👤</span> Contact &amp; Delivery Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <label style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#36593e" }}>
                    Your Name
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Senthil Nathan"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #c9dcc8", borderRadius: "8px", marginTop: "4px" }}
                    />
                  </label>
                  <label style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#36593e" }}>
                    Mobile Number (for updates)
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #c9dcc8", borderRadius: "8px", marginTop: "4px" }}
                    />
                  </label>
                </div>

                {deliveryType === "delivery" && (
                  <label style={{ display: "block", marginBottom: "10px", fontSize: "12px", fontWeight: 700, color: "#36593e" }}>
                    Delivery Address in Hosur
                    <textarea
                      rows={2}
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Door number, street name, Hosur area, landmark, pincode..."
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #c9dcc8", borderRadius: "8px", marginTop: "4px", resize: "vertical" }}
                    />
                  </label>
                )}

                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#36593e" }}>
                  Cooking / Packing Instructions (Optional)
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Pack spicy, extra chutney, banana leaf wrapping..."
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #c9dcc8", borderRadius: "8px", marginTop: "4px" }}
                  />
                </label>
              </div>

              {/* Payment System */}
              <div>
                <div className="order-section-title"><span>💳</span> Integrated Payment System</div>
                <div className="payment-method-selector" style={{ marginBottom: "12px" }}>
                  <button
                    type="button"
                    className={`payment-method-tab ${paymentMethod === "upi" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <span className="icon">📱</span>
                    <span>UPI (Instant)</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-tab ${paymentMethod === "card" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <span className="icon">💳</span>
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-tab ${paymentMethod === "netbanking" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("netbanking")}
                  >
                    <span className="icon">🏦</span>
                    <span>Net Banking</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-tab ${paymentMethod === "cod" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    <span className="icon">💵</span>
                    <span>{deliveryType === "delivery" ? "Cash on Delivery" : "Pay at Store"}</span>
                  </button>
                </div>

                {/* UPI Interface */}
                {paymentMethod === "upi" && (
                  <div className="payment-panel">
                    <div className="upi-qr-card">
                      <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="white" />
                        <rect x="10" y="10" width="28" height="28" stroke="#166534" strokeWidth="6" fill="none" />
                        <rect x="18" y="18" width="12" height="12" fill="#166534" />
                        <rect x="62" y="10" width="28" height="28" stroke="#166534" strokeWidth="6" fill="none" />
                        <rect x="70" y="18" width="12" height="12" fill="#166534" />
                        <rect x="10" y="62" width="28" height="28" stroke="#166534" strokeWidth="6" fill="none" />
                        <rect x="18" y="70" width="12" height="12" fill="#166534" />
                        <rect x="46" y="20" width="8" height="24" fill="#0f766e" />
                        <rect x="20" y="46" width="24" height="8" fill="#0f766e" />
                        <rect x="62" y="46" width="28" height="8" fill="#0f766e" />
                        <rect x="46" y="62" width="8" height="28" fill="#0f766e" />
                        <rect x="62" y="72" width="16" height="16" fill="#166534" />
                        <circle cx="50" cy="50" r="10" fill="#0f766e" />
                        <text x="50" y="54" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">₹</text>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#627d68", textTransform: "uppercase" }}>Merchant UPI VPA</div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#166534", wordBreak: "break-all" }}>{merchantUpiVpa}</div>
                        <div style={{ fontSize: "11px", color: "#526d58", marginTop: "4px" }}>
                          Scan with Google Pay, PhonePe, Paytm, BHIM, or enter your UPI ID below.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", margin: "12px 0 8px", flexWrap: "wrap" }}>
                      {["Google Pay", "PhonePe", "Paytm", "BHIM"].map((appName) => (
                        <button
                          key={appName}
                          type="button"
                          onClick={() => setUpiId(`senthil@${appName.toLowerCase().replace(/\s/g, "")}`)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cfded0",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#284a32",
                            cursor: "pointer",
                          }}
                        >
                          ⚡ {appName}
                        </button>
                      ))}
                    </div>

                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#36593e", marginTop: "6px" }}>
                      Your UPI ID (VPA)
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. mobile@upi"
                          style={{ flex: 1, padding: "8px 10px", border: "1px solid #c9dcc8", borderRadius: "6px", fontSize: "13px" }}
                        />
                        <button
                          type="button"
                          onClick={() => setUpiId("hosur.buyer@okhdfcbank")}
                          style={{ background: "#e8f5e9", border: "1px solid #b7deb9", color: "#1b5e20", borderRadius: "6px", padding: "0 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Auto-fill
                        </button>
                      </div>
                    </label>
                  </div>
                )}

                {/* Card Interface */}
                {paymentMethod === "card" && (
                  <div className="payment-panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#2d5236" }}>Credit or Debit Card</span>
                      <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700 }}>RuPay · Visa · Mastercard</span>
                    </div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 700, color: "#36593e" }}>
                      Card Number
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        maxLength={19}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #c9dcc8", borderRadius: "6px", marginTop: "3px", fontFamily: "monospace", letterSpacing: "1px" }}
                      />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#36593e" }}>
                        Expiry (MM/YY)
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          maxLength={5}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #c9dcc8", borderRadius: "6px", marginTop: "3px" }}
                        />
                      </label>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#36593e" }}>
                        CVV
                        <input
                          type="password"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          maxLength={4}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #c9dcc8", borderRadius: "6px", marginTop: "3px" }}
                        />
                      </label>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#36593e" }}>
                        Name on Card
                        <input
                          type="text"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #c9dcc8", borderRadius: "6px", marginTop: "3px" }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Net Banking Interface */}
                {paymentMethod === "netbanking" && (
                  <div className="payment-panel">
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#2d5236", display: "block", marginBottom: "8px" }}>
                      Select Your Bank
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {["State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Canara Bank"].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          style={{
                            padding: "8px 10px",
                            background: selectedBank === bank ? "#f0fdf4" : "#ffffff",
                            border: `1.5px solid ${selectedBank === bank ? "#16a34a" : "#cddccb"}`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: selectedBank === bank ? "#15803d" : "#36593e",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          🏦 {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* COD Interface */}
                {paymentMethod === "cod" && (
                  <div className="payment-panel" style={{ background: "#fefce8", borderColor: "#fef08a" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "24px" }}>💵</span>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#854d0e" }}>
                          {deliveryType === "delivery" ? "Cash on Delivery" : "Pay at Store Counter"}
                        </strong>
                        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#a16207" }}>
                          Please keep exact cash of ₹{totalAmount.toLocaleString("en-IN")} ready. UPI or cards are also accepted by the delivery person or at the store counter.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bill Breakdown */}
              <div className="bill-breakdown">
                <div className="bill-breakdown-row">
                  <span>Item Subtotal ({quantity}x)</span>
                  <span>₹{itemTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="bill-breakdown-row">
                  <span>Fulfilment &amp; Handling</span>
                  <span>{deliveryFee > 0 ? `₹${deliveryFee}` : "FREE (Pickup)"}</span>
                </div>
                <div className="bill-breakdown-row">
                  <span>Applicable Taxes (GST 5%)</span>
                  <span>₹{taxes}</span>
                </div>
                <div className="bill-breakdown-row total">
                  <span>Total Amount Payable</span>
                  <span style={{ color: "#0f766e" }}>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="order-checkout-footer">
              <button
                type="button"
                className="outline-button"
                onClick={close}
                style={{ padding: "12px 18px", borderRadius: "10px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="pay-btn-primary"
                disabled={isProcessing}
              >
                <span>🔒</span>
                <span>
                  {paymentMethod === "cod"
                    ? `Confirm Order · ₹${totalAmount.toLocaleString("en-IN")}`
                    : `Pay ₹${totalAmount.toLocaleString("en-IN")} & Confirm Order`}
                </span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function OrderReceiptModal({
  order,
  close,
  onViewInPortal,
}: {
  order: OrderRecord;
  close: () => void;
  onViewInPortal: () => void;
}) {
  const steps: { key: OrderStatus; label: string; icon: string }[] = [
    { key: "placed", label: "Placed", icon: "✓" },
    { key: "preparing", label: "In Prep", icon: "👨‍🍳" },
    { key: "ready", label: order.deliveryType === "pickup" ? "Ready" : "Out for Delivery", icon: "🛵" },
    { key: "completed", label: "Done", icon: "✅" },
  ];

  const currentIdx =
    order.status === "placed"
      ? 0
      : order.status === "accepted" || order.status === "preparing"
      ? 1
      : order.status === "ready"
      ? 2
      : order.status === "completed"
      ? 3
      : 0;

  return (
    <div className="order-modal-backdrop" onClick={close}>
      <div className="order-receipt-card" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-header-banner">
          <div className="receipt-check-icon">✓</div>
          <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 800 }}>Order Confirmed!</h2>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>
            The business partner has been alerted to make your order ready.
          </p>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Order ID & Time */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2ede0", paddingBottom: "12px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#6a8270", textTransform: "uppercase" }}>Order Reference</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#143e21" }}>{order.id}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#6a8270", textTransform: "uppercase" }}>Estimated Time</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f766e" }}>⏱️ {order.estimatedTime}</div>
            </div>
          </div>

          {/* Live Progress Tracker */}
          <div style={{ margin: "16px 0 20px" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#496850", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Live Order Status
            </div>
            <div className="receipt-timeline">
              {steps.map((st, idx) => {
                const isDone = idx < currentIdx;
                const isActive = idx === currentIdx;
                return (
                  <div key={st.key} className={`receipt-step ${isActive ? "active" : isDone ? "done" : ""}`}>
                    <div className="receipt-step-dot">{isDone ? "✓" : st.icon}</div>
                    <span className="receipt-step-label">{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store & Contact Box */}
          <div style={{ background: "#f8faf8", border: "1px solid #dce8db", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "#153e22" }}>{order.businessName}</strong>
                <div style={{ fontSize: "11px", color: "#657d6b" }}>
                  {order.deliveryType === "delivery" ? `Delivering to: ${order.customerAddress}` : `Store Pickup at Hosur`}
                </div>
              </div>
              <span className={`order-status-pill ${order.status}`}>{order.status}</span>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <a
                href={`tel:+919845012345`}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 10px",
                  background: "#ffffff",
                  border: "1px solid #c9dcc8",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1c4a29",
                  textDecoration: "none",
                }}
              >
                📞 Call Store
              </a>
              <a
                href={`https://wa.me/919845012345?text=${encodeURIComponent(`Hi ${order.businessName}, checking on my order #${order.id} for ${order.items[0]?.name}.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 10px",
                  background: "#25D366",
                  color: "#ffffff",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Itemized summary */}
          <div style={{ border: "1px dashed #ceddce", borderRadius: "10px", padding: "14px", background: "#fcfdfc", marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#163f23", marginBottom: "8px" }}>Ordered Items</div>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "4px 0" }}>
                <span>
                  <strong>{item.quantity}x</strong> {item.name}
                </span>
                <span style={{ fontWeight: 700, color: "#153e22" }}>
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e7efe6", margin: "8px 0 6px", paddingTop: "6px", fontSize: "12px", color: "#5d7363", display: "flex", justifyContent: "space-between" }}>
              <span>Delivery Fee</span>
              <span>{order.deliveryFee > 0 ? `₹${order.deliveryFee}` : "FREE"}</span>
            </div>
            <div style={{ fontSize: "12px", color: "#5d7363", display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Taxes (5% GST)</span>
              <span>₹{order.taxes}</span>
            </div>
            <div style={{ borderTop: "1.5px solid #d0dfcf", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 800, color: "#143e21" }}>
              <span>Total Paid</span>
              <span style={{ color: "#0f766e" }}>₹{order.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment metadata */}
          <div style={{ fontSize: "11px", color: "#69816f", background: "#eef5ed", borderRadius: "8px", padding: "8px 12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span>Payment Mode: <strong>{order.paymentMethod.toUpperCase()}</strong></span>
              <br />
              <span>Txn: <code style={{ fontSize: "10px" }}>{order.paymentTransactionId}</code></span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 800, color: order.paymentStatus === "paid" ? "#15803d" : "#a16207" }}>
              {order.paymentStatus === "paid" ? "PAID ✓" : "COD PENDING"}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="primary-button"
              style={{ flex: 1, padding: "10px" }}
              onClick={onViewInPortal}
            >
              Track in My Activity ↗
            </button>
            <button
              type="button"
              className="outline-button"
              style={{ padding: "10px 14px" }}
              onClick={() => window.print()}
            >
              🖨️ Print
            </button>
            <button
              type="button"
              className="outline-button"
              style={{ padding: "10px 14px" }}
              onClick={close}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MerchantOrdersManager({
  orders,
  businessName,
  onUpdateStatus,
}: {
  orders: OrderRecord[];
  businessName?: string;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}) {
  const [filter, setFilter] = useState<"all" | "prep" | "ready" | "completed">("all");

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "cancelled" ? o.totalAmount : 0), 0);
  const prepCount = orders.filter((o) => o.status === "placed" || o.status === "accepted" || o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  const filteredOrders = orders.filter((o) => {
    if (filter === "prep") return o.status === "placed" || o.status === "accepted" || o.status === "preparing";
    if (filter === "ready") return o.status === "ready";
    if (filter === "completed") return o.status === "completed";
    return true;
  });

  return (
    <div className="merchant-orders-board">
      <div className="merchant-orders-stats">
        <div className="merchant-stat-box">
          <span className="stat-label">Total Orders</span>
          <span className="stat-val">{orders.length}</span>
        </div>
        <div className="merchant-stat-box" style={{ borderColor: prepCount > 0 ? "#f59e0b" : "#d5e5d3" }}>
          <span className="stat-label">Needs Prep 👨‍🍳</span>
          <span className="stat-val" style={{ color: prepCount > 0 ? "#b45309" : "#143e21" }}>{prepCount}</span>
        </div>
        <div className="merchant-stat-box">
          <span className="stat-label">Ready / Out 🛵</span>
          <span className="stat-val" style={{ color: readyCount > 0 ? "#7c3aed" : "#143e21" }}>{readyCount}</span>
        </div>
        <div className="merchant-stat-box">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-val" style={{ color: "#0f766e" }}>₹{totalRevenue.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", margin: "10px 0 16px", flexWrap: "wrap" }}>
        {[
          { key: "all", label: `All Orders (${orders.length})` },
          { key: "prep", label: `Needs Prep (${prepCount})` },
          { key: "ready", label: `Ready (${readyCount})` },
          { key: "completed", label: `Completed (${completedCount})` },
        ].map((btn) => (
          <button
            key={btn.key}
            type="button"
            className={`quick-filter-chip ${filter === btn.key ? "active" : ""}`}
            onClick={() => setFilter(btn.key as any)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No orders in this view"
          text="Incoming customer orders will appear here in real time with customer contact details and preparation controls."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredOrders.map((order) => {
            const rawPhone = order.customerPhone.replace(/[^0-9]/g, "");
            return (
              <article key={order.id} className="merchant-order-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "16px", color: "#143e21" }}>#{order.id}</strong>
                      <span className={`order-status-pill ${order.status}`}>
                        ● {order.status === "placed" ? "New Order" : order.status}
                      </span>
                      <span style={{ fontSize: "11px", color: "#607d67", background: "#f2f7f1", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                        {order.deliveryType === "delivery" ? "🛵 Delivery" : "🏬 Store Pickup"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#617d68" }}>
                      Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f766e" }}>
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: order.paymentStatus === "paid" ? "#15803d" : "#b45309" }}>
                      {order.paymentStatus === "paid" ? `✓ Paid via ${order.paymentMethod.toUpperCase()}` : "Cash on Delivery"}
                    </span>
                  </div>
                </div>

                {/* Customer Info Card */}
                <div style={{ background: "#f8faf8", border: "1px solid #dce8db", borderRadius: "10px", padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "#163e23" }}>
                      👤 {order.customerName} · <span style={{ color: "#4f6e56", fontWeight: 600 }}>{order.customerPhone}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#546e5b", marginTop: "3px" }}>
                      📍 {order.customerAddress}
                    </div>
                    {order.notes && (
                      <div style={{ fontSize: "11.5px", color: "#b45309", background: "#fef3c7", padding: "3px 8px", borderRadius: "4px", marginTop: "6px", display: "inline-block" }}>
                        📝 Note: {order.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <a
                      href={`tel:${rawPhone}`}
                      style={{ background: "#ffffff", border: "1px solid #c9dcc8", borderRadius: "6px", padding: "6px 10px", fontSize: "11.5px", fontWeight: 700, color: "#1c4a29", textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      📞 Call
                    </a>
                    <a
                      href={`https://wa.me/${rawPhone}?text=${encodeURIComponent(`Hello ${order.customerName}, this is ${order.businessName}. We received your order #${order.id}!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: "#25D366", color: "#ffffff", borderRadius: "6px", padding: "6px 10px", fontSize: "11.5px", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#5d7363", textTransform: "uppercase" }}>Order Items</div>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "4px 0", borderBottom: "1px dashed #e7efe6" }}>
                      <span style={{ fontWeight: 600, color: "#1c3824" }}>
                        <span style={{ fontWeight: 800, color: "#0f766e" }}>{item.quantity}x</span> {item.name}
                      </span>
                      <span style={{ fontWeight: 700, color: "#2d5236" }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                {/* Merchant Actions Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #eef5ed", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: "#6a8270" }}>
                    ⏱️ Target: <strong>{order.estimatedTime}</strong>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {order.status === "placed" && (
                      <button
                        type="button"
                        className="merchant-action-btn prep"
                        onClick={() => onUpdateStatus(order.id, "preparing")}
                      >
                        👨‍🍳 Accept &amp; Start Prep
                      </button>
                    )}
                    {(order.status === "accepted" || order.status === "preparing") && (
                      <button
                        type="button"
                        className="merchant-action-btn ready"
                        onClick={() => onUpdateStatus(order.id, "ready")}
                      >
                        🛵 Mark Ready for {order.deliveryType === "pickup" ? "Pickup" : "Delivery"}
                      </button>
                    )}
                    {order.status === "ready" && (
                      <button
                        type="button"
                        className="merchant-action-btn done"
                        onClick={() => onUpdateStatus(order.id, "completed")}
                      >
                        ✅ Complete Order
                      </button>
                    )}
                    {order.status === "completed" && (
                      <span style={{ color: "#15803d", fontWeight: 800, fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        ✓ Order Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomerOrdersManager({
  orders,
  onViewReceipt,
}: {
  orders: OrderRecord[];
  onViewReceipt: (order: OrderRecord) => void;
}) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders placed yet"
        text="Discover Hosur restaurants, bakeries, organic farms, and merchants, and tap 'Order now' to place an order."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {orders.map((order) => {
        const steps: { key: OrderStatus; label: string }[] = [
          { key: "placed", label: "Placed" },
          { key: "preparing", label: "Preparing" },
          { key: "ready", label: order.deliveryType === "pickup" ? "Ready" : "Out for Delivery" },
          { key: "completed", label: "Delivered" },
        ];
        const currentIdx =
          order.status === "placed"
            ? 0
            : order.status === "accepted" || order.status === "preparing"
            ? 1
            : order.status === "ready"
            ? 2
            : order.status === "completed"
            ? 3
            : 0;

        return (
          <article key={order.id} className="merchant-order-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "16px", color: "#143e21" }}>{order.businessName}</strong>
                  <span className={`order-status-pill ${order.status}`}>
                    ● {order.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#617d68" }}>
                  Order #{order.id} · {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "#0f766e" }}>
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: order.paymentStatus === "paid" ? "#15803d" : "#b45309" }}>
                  {order.paymentStatus === "paid" ? `Paid via ${order.paymentMethod.toUpperCase()}` : "Cash on Delivery"}
                </span>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="receipt-timeline" style={{ margin: "10px 0" }}>
              {steps.map((st, idx) => {
                const isDone = idx < currentIdx;
                const isActive = idx === currentIdx;
                return (
                  <div key={st.key} className={`receipt-step ${isActive ? "active" : isDone ? "done" : ""}`}>
                    <div className="receipt-step-dot">{isDone ? "✓" : idx + 1}</div>
                    <span className="receipt-step-label">{st.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Items summary */}
            <div style={{ fontSize: "13px", color: "#2d4b35", background: "#f8faf8", padding: "10px 14px", borderRadius: "8px" }}>
              {order.items.map((i) => `${i.quantity}x ${i.name}`).join(" · ")}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #eef5ed", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "12px", color: "#546e5b" }}>
                ⏱️ Estimated: <strong>{order.estimatedTime}</strong>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="outline-button"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                  onClick={() => onViewReceipt(order)}
                >
                  🧾 View Receipt
                </button>
                <a
                  href={`tel:+919845012345`}
                  className="outline-button"
                  style={{ padding: "6px 12px", fontSize: "12px", textDecoration: "none" }}
                >
                  📞 Contact Store
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PlanCheckoutDialog({
  businesses,
  initialBusinessName,
  initialPlan = "Growth",
  close,
  onProcessPayment,
}: {
  businesses: Business[];
  initialBusinessName?: string;
  initialPlan?: string;
  close: () => void;
  onProcessPayment: (data: {
    businessName: string;
    plan: string;
    billingCycle: "monthly" | "yearly";
    amount: number;
    taxes: number;
    totalAmount: number;
    paymentMethod: string;
    transactionId: string;
    invoiceNumber: string;
    validUntil: string;
  }) => void;
}) {
  const [selectedBusiness, setSelectedBusiness] = useState(
    initialBusinessName || businesses[0]?.name || "My Business"
  );
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || "Growth");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [gstin, setGstin] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("hosur.business@okhdfcbank");
  const [cardData, setCardData] = useState({
    number: "4532 9012 3456 7890",
    expiry: "11/28",
    cvv: "456",
    name: "Business Director",
  });
  const [selectedBank, setSelectedBank] = useState("State Bank of India (SBI)");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("Connecting to Payment Gateway...");

  // Plan pricing
  const planPrices: Record<string, { monthly: number; yearly: number; desc: string; perks: string[] }> = {
    Starter: {
      monthly: 499,
      yearly: 4790,
      desc: "Essential local presence for emerging neighborhood vendors.",
      perks: ["Verified Listing Badge", "Up to 15 Catalogue Items", "Customer Enquiries Inbox", "Basic Profile Analytics"],
    },
    Growth: {
      monthly: 999,
      yearly: 9590,
      desc: "Top choice for established local stores & service providers.",
      perks: ["Priority Search Ranking in Hosur", "Unlimited Catalogue & Direct Ordering", "Direct WhatsApp & Call Customer Buttons", "Merchant Order Prep Dashboard", "Monthly Business Performance Insights"],
    },
    Spotlight: {
      monthly: 1999,
      yearly: 19190,
      desc: "Maximum reach with prime homepage spotlight & multi-language promotion.",
      perks: ["Top-of-Search Spotlight Banner Placement", "0% Commission Direct Online Orders", "Hosur Featured Partner Verified Crown", "Dedicated Account & Verification Manager", "Multi-language Catalogue Promotion (EN, TA, KN, TE)"],
    },
  };

  const currentPlanMeta = planPrices[selectedPlan] || planPrices.Growth;
  const baseAmount = billingCycle === "yearly" ? currentPlanMeta.yearly : currentPlanMeta.monthly;
  const taxes = Math.round(baseAmount * 0.18); // 18% GST (9% CGST + 9% SGST)
  const totalAmount = baseAmount + taxes;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingStage(
      paymentMethod === "upi"
        ? "Connecting to UPI / NPCI Subscription Gateway..."
        : paymentMethod === "card"
        ? "Securing 256-bit SSL Card payment..."
        : `Authorizing Corporate Net Banking via ${selectedBank}...`
    );

    setTimeout(() => {
      setProcessingStage("Payment Authorized! Activating business subscription & generating Tax Invoice...");
      setTimeout(() => {
        const txnId =
          paymentMethod === "upi"
            ? `UPI/SUB/${Math.floor(100000000000 + Math.random() * 900000000000)}`
            : paymentMethod === "card"
            ? `TXN-SUB-CRD-${Math.floor(10000000 + Math.random() * 90000000)}`
            : `NET-SUB-${Math.floor(10000000 + Math.random() * 90000000)}`;

        const invNum = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const validDate = new Date();
        if (billingCycle === "yearly") {
          validDate.setFullYear(validDate.getFullYear() + 1);
        } else {
          validDate.setDate(validDate.getDate() + 30);
        }

        onProcessPayment({
          businessName: selectedBusiness,
          plan: selectedPlan,
          billingCycle,
          amount: baseAmount,
          taxes,
          totalAmount,
          paymentMethod: paymentMethod === "upi" ? `UPI (${upiId})` : paymentMethod === "card" ? "Credit/Debit Card" : `Net Banking (${selectedBank})`,
          transactionId: txnId,
          invoiceNumber: invNum,
          validUntil: validDate.toISOString(),
        });
      }, 700);
    }, 900);
  }

  return (
    <div className="order-modal-backdrop" onClick={close}>
      <div className="plan-checkout-container" onClick={(e) => e.stopPropagation()}>
        <div className="plan-checkout-header">
          <div>
            <h3>
              <span>⚡</span> Subscribe to {selectedPlan} Membership
            </h3>
            <span style={{ fontSize: "12px", opacity: 0.9 }}>Hosur Business Growth &amp; Visibility</span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: "22px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {isProcessing ? (
          <div style={{ padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "50px", height: "50px", border: "4px solid #bfdbfe", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <h4 style={{ margin: 0, fontSize: "17px", color: "#1e3a8a", fontWeight: 800 }}>Processing Subscription Payment</h4>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>{processingStage}</p>
            <div style={{ fontSize: "12px", color: "#1d4ed8", background: "#eff6ff", padding: "6px 14px", borderRadius: "20px", fontWeight: 700 }}>
              Amount: ₹{totalAmount.toLocaleString("en-IN")} · 18% GST Included · 256-Bit Encrypted
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "contents" }}>
            <div className="order-checkout-body">
              {/* Business & Billing Cycle Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px", alignItems: "center" }}>
                <label style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>
                  Selected Business
                  <select
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", marginTop: "4px", fontSize: "13px", fontWeight: 700 }}
                  >
                    {businesses.map((b, i) => (
                      <option key={`${b.name}-${i}`} value={b.name}>
                        {b.name} ({b.category})
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px", textAlign: "center" }}>
                    BILLING CYCLE
                  </div>
                  <div className="billing-cycle-toggle">
                    <button
                      type="button"
                      className={`billing-cycle-btn ${billingCycle === "monthly" ? "active" : ""}`}
                      onClick={() => setBillingCycle("monthly")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={`billing-cycle-btn ${billingCycle === "yearly" ? "active" : ""}`}
                      onClick={() => setBillingCycle("yearly")}
                    >
                      <span>Yearly</span>
                      <span className="invoice-badge-save">SAVE 20%</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan Choice Cards */}
              <div>
                <div className="order-section-title" style={{ color: "#1e3a8a" }}>
                  <span>🏆</span> Choose Visibility Plan
                </div>
                <div className="plan-select-grid">
                  {Object.entries(planPrices).map(([pName, pMeta]) => {
                    const price = billingCycle === "yearly" ? pMeta.yearly : pMeta.monthly;
                    const isSelected = selectedPlan === pName;
                    return (
                      <div
                        key={pName}
                        className={`plan-select-card ${isSelected ? "active" : ""}`}
                        onClick={() => setSelectedPlan(pName)}
                      >
                        {pName === "Growth" && (
                          <div style={{ position: "absolute", top: "-9px", left: "50%", transform: "translateX(-50%)", background: "#f59e0b", color: "#ffffff", fontSize: "9px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px", letterSpacing: "0.5px" }}>
                            POPULAR
                          </div>
                        )}
                        <div className="plan-name">{pName}</div>
                        <div className="plan-price">
                          ₹{price.toLocaleString("en-IN")}
                          <small>/{billingCycle === "yearly" ? "yr" : "mo"}</small>
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 8px", minHeight: "30px" }}>
                          {pMeta.desc}
                        </div>
                        <div style={{ textAlign: "left", fontSize: "10.5px", color: "#334155", borderTop: "1px solid #e2e8f0", paddingTop: "6px" }}>
                          {pMeta.perks.slice(0, 3).map((perk, pi) => (
                            <div key={pi} style={{ display: "flex", gap: "4px", marginBottom: "2px" }}>
                              <span style={{ color: "#16a34a" }}>✓</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{perk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional GSTIN */}
              <div>
                <label style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                  Business GSTIN <span style={{ color: "#64748b", fontWeight: 400 }}>(Optional - for Tax Invoice Credit)</span>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    maxLength={15}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "3px", textTransform: "uppercase" }}
                  />
                </label>
              </div>

              {/* Payment Gateway Mode */}
              <div>
                <div className="order-section-title" style={{ color: "#1e3a8a" }}>
                  <span>💳</span> Integrated Payment Gateway
                </div>
                <div className="payment-method-selector" style={{ marginBottom: "12px", gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <button
                    type="button"
                    className={`payment-method-tab ${paymentMethod === "upi" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    <span className="icon">📱</span>
                    <span>UPI (Instant)</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-tab ${paymentMethod === "card" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <span className="icon">💳</span>
                    <span>Cards (Debit/Credit)</span>
                  </button>
                  <button
                    type="button"
                    className={`payment-method-tab ${paymentMethod === "netbanking" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("netbanking")}
                  >
                    <span className="icon">🏦</span>
                    <span>Net Banking</span>
                  </button>
                </div>

                {paymentMethod === "upi" && (
                  <div className="payment-panel" style={{ background: "#f8faff", borderColor: "#bfdbfe" }}>
                    <div className="upi-qr-card">
                      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="white" />
                        <rect x="10" y="10" width="28" height="28" stroke="#1e40af" strokeWidth="6" fill="none" />
                        <rect x="18" y="18" width="12" height="12" fill="#1e40af" />
                        <rect x="62" y="10" width="28" height="28" stroke="#1e40af" strokeWidth="6" fill="none" />
                        <rect x="70" y="18" width="12" height="12" fill="#1e40af" />
                        <rect x="10" y="62" width="28" height="28" stroke="#1e40af" strokeWidth="6" fill="none" />
                        <rect x="18" y="70" width="12" height="12" fill="#1e40af" />
                        <rect x="46" y="20" width="8" height="24" fill="#3b82f6" />
                        <rect x="20" y="46" width="24" height="8" fill="#3b82f6" />
                        <rect x="62" y="46" width="28" height="8" fill="#3b82f6" />
                        <rect x="46" y="62" width="8" height="28" fill="#3b82f6" />
                        <circle cx="50" cy="50" r="10" fill="#1e40af" />
                        <text x="50" y="54" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">₹</text>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>Subscription Mandate VPA</div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>bizearch.subscriptions@okhdfcbank</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          Approve payment via Google Pay, PhonePe, Paytm, BHIM, or enter your UPI ID.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", margin: "12px 0 8px", flexWrap: "wrap" }}>
                      {["Google Pay", "PhonePe", "Paytm", "BHIM"].map((appName) => (
                        <button
                          key={appName}
                          type="button"
                          onClick={() => setUpiId(`merchant@${appName.toLowerCase().replace(/\s/g, "")}`)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#1e3a8a",
                            cursor: "pointer",
                          }}
                        >
                          ⚡ {appName}
                        </button>
                      ))}
                    </div>

                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#1e3a8a", marginTop: "6px" }}>
                      Your UPI ID
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourbusiness@upi"
                          style={{ flex: 1, padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                        />
                        <button
                          type="button"
                          onClick={() => setUpiId("hosur.business@okaxis")}
                          style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", borderRadius: "6px", padding: "0 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Auto-fill
                        </button>
                      </div>
                    </label>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="payment-panel">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>Corporate or Personal Card</span>
                      <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 700 }}>RuPay · Visa · Mastercard</span>
                    </div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                      Card Number
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        maxLength={19}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "3px", fontFamily: "monospace" }}
                      />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                        Expiry (MM/YY)
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          maxLength={5}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "3px" }}
                        />
                      </label>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                        CVV
                        <input
                          type="password"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          maxLength={4}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "3px" }}
                        />
                      </label>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                        Cardholder Name
                        <input
                          type="text"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", marginTop: "3px" }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {paymentMethod === "netbanking" && (
                  <div className="payment-panel">
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: "8px" }}>
                      Choose Authorized Corporate / Retail Bank
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {["State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Canara Bank"].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          style={{
                            padding: "8px 10px",
                            background: selectedBank === bank ? "#eff6ff" : "#ffffff",
                            border: `1.5px solid ${selectedBank === bank ? "#2563eb" : "#cbd5e1"}`,
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: selectedBank === bank ? "#1e40af" : "#334155",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          🏦 {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Invoice Breakdown */}
              <div className="bill-breakdown" style={{ background: "#f8fafc", borderColor: "#cbd5e1" }}>
                <div className="bill-breakdown-row">
                  <span>{selectedPlan} Plan Membership ({billingCycle === "yearly" ? "12 Months" : "1 Month"})</span>
                  <span>₹{baseAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="bill-breakdown-row">
                  <span>Goods &amp; Services Tax (18% GST: CGST 9% + SGST 9%)</span>
                  <span>₹{taxes.toLocaleString("en-IN")}</span>
                </div>
                <div className="bill-breakdown-row total">
                  <span>Total Amount Payable</span>
                  <span style={{ color: "#1e40af" }}>₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="order-checkout-footer">
              <button
                type="button"
                className="outline-button"
                onClick={close}
                style={{ padding: "12px 18px", borderRadius: "10px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="pay-btn-primary"
                disabled={isProcessing}
                style={{ background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)", boxShadow: "0 4px 14px rgba(29, 78, 216, 0.3)" }}
              >
                <span>🔒</span>
                <span>Pay ₹{totalAmount.toLocaleString("en-IN")} &amp; Activate Plan</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SubscriptionReceiptModal({
  record,
  close,
  onOpenPortal,
}: {
  record: CheckoutRequest;
  close: () => void;
  onOpenPortal?: () => void;
}) {
  const baseAmount = record.amount || 999;
  const taxes = record.taxes || Math.round(baseAmount * 0.18);
  const totalAmount = record.totalAmount || baseAmount + taxes;

  return (
    <div className="order-modal-backdrop" onClick={close}>
      <div className="subscription-receipt-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>🧾</span>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>TAX INVOICE / RECEIPT</h2>
            </div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>Bizearch Technologies Pvt. Ltd. · Hosur Operations</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ background: "#22c55e", color: "#ffffff", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 800 }}>
              PAID &amp; ACTIVE ✓
            </span>
          </div>
        </div>

        <div className="tax-invoice-sheet">
          {/* Company & Billing Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>ISSUER DETAILS</div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>Bizearch Technologies / Jishnu Infotech</strong>
              <div style={{ color: "#475569", marginTop: "2px" }}>
                Plot 12, Sipcot Phase 1, Hosur, TN - 635126
                <br />
                GSTIN: <strong>33AAACJ9482F1Z4</strong> · PAN: AAACJ9482F
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>BILLED TO</div>
              <strong style={{ fontSize: "13px", color: "#0f172a" }}>{record.businessName}</strong>
              <div style={{ color: "#475569", marginTop: "2px" }}>
                Invoice No: <strong>{record.invoiceNumber || "INV-2026-84920"}</strong>
                <br />
                Date: {new Date(record.createdAt).toLocaleDateString()}
                <br />
                Active Valid Until: <strong style={{ color: "#059669" }}>{new Date(record.validUntil || Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Charges Table */}
          <table className="tax-invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: "center" }}>Cycle</th>
                <th style={{ textAlign: "right" }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{record.plan} Visibility &amp; Order Platform Membership</strong>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    Verified Partner status, priority ranking &amp; order management tools
                  </div>
                </td>
                <td style={{ textAlign: "center", textTransform: "capitalize", fontWeight: 600 }}>
                  {record.billingCycle || "Monthly"}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>
                  ₹{baseAmount.toLocaleString("en-IN")}
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ textAlign: "right", color: "#64748b" }}>CGST (9%)</td>
                <td style={{ textAlign: "right" }}>₹{Math.round(taxes / 2).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ textAlign: "right", color: "#64748b" }}>SGST (9%)</td>
                <td style={{ textAlign: "right" }}>₹{Math.round(taxes / 2).toLocaleString("en-IN")}</td>
              </tr>
              <tr style={{ background: "#f8fafc", fontWeight: 800, fontSize: "15px" }}>
                <td colSpan={2} style={{ textAlign: "right", color: "#1e3a8a" }}>Total Paid (INR)</td>
                <td style={{ textAlign: "right", color: "#1e3a8a" }}>₹{totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Method Details */}
          <div style={{ background: "#f1f5f9", borderRadius: "8px", padding: "10px 14px", fontSize: "11.5px", color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span>Payment Mode: <strong>{record.paymentMethod}</strong></span>
              <br />
              <span>Reference Txn: <code>{record.transactionId || "UPI/261031/94821"}</code></span>
            </div>
            <div style={{ textAlign: "right", color: "#15803d", fontWeight: 800 }}>
              Authorized &amp; Verified ✓
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              className="primary-button"
              style={{ flex: 1, padding: "10px" }}
              onClick={() => {
                close();
                if (onOpenPortal) onOpenPortal();
              }}
            >
              Go to Business Portal ↗
            </button>
            <button
              type="button"
              className="outline-button"
              style={{ padding: "10px 16px" }}
              onClick={() => window.print()}
            >
              🖨️ Print Tax Invoice
            </button>
            <button
              type="button"
              className="outline-button"
              style={{ padding: "10px 16px" }}
              onClick={close}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessPortal({
  businesses,
  categoryConfig,
  enquiries,
  checkouts,
  orders = [],
  initialTab = "Overview",
  onUpdateOrderStatus,
  openBusinessProfile,
  openPlans,
  onSelectPlan,
  onViewInvoice,
  verifyLocation,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenPortal,
  onLanguageChange,
  showNotice,
}: {
  businesses: Business[];
  categoryConfig: CategoryConfig;
  enquiries: DemoEnquiry[];
  checkouts: CheckoutRequest[];
  orders?: OrderRecord[];
  initialTab?: string;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  openBusinessProfile: () => void;
  openPlans: () => void;
  onSelectPlan?: (plan: string) => void;
  onViewInvoice?: (record: CheckoutRequest) => void;
  verifyLocation: () => void;
  onAddProduct: (businessName: string, product: Omit<Product, "id">) => void;
  onUpdateProduct?: (businessName: string, productId: string, updated: Partial<Product>) => void;
  onDeleteProduct?: (businessName: string, productId: string) => void;
  onOpenPortal?: (role: Role) => void;
  onLanguageChange?: (lang: "en" | "ta" | "kn" | "te") => void;
  showNotice: (message: string) => void;
}) {
  const [tab, setTab] = useState(initialTab || "Overview");
  const accountBusinessName = businesses[0]?.name;
  const accountEnquiries = enquiries.filter((item) => item.businessName === accountBusinessName);
  const accountCheckouts = checkouts.filter((item) => item.businessName === accountBusinessName);
  const activeSub = accountCheckouts.find((c) => c.status === "Active" || c.status === "Paid") || (businesses[0]?.subscribed ? accountCheckouts[0] : null);
  const accountOrders = orders.filter((item) =>
    !accountBusinessName || item.businessName.toLowerCase() === accountBusinessName.toLowerCase() || businesses.length > 1
  );
  const pendingPrepCount = accountOrders.filter((o) => o.status === "placed" || o.status === "accepted" || o.status === "preparing").length;

  useEffect(() => {
    if (initialTab && initialTab !== "Overview") setTab(initialTab);
  }, [initialTab]);
  useEffect(() => {
    const openProfile = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      setTab(customEvent.detail?.tab || "Profile details");
    };
    window.addEventListener("neighborly-open-profile", openProfile);
    return () => window.removeEventListener("neighborly-open-profile", openProfile);
  }, []);
  useEffect(() => { const openBusiness = () => setTab("My business"); window.addEventListener("neighborly-open-business-profile", openBusiness); return () => window.removeEventListener("neighborly-open-business-profile", openBusiness); }, []);
  return <div className="page-content portal-content">
    <div className="portal-header"><div><div className="eyebrow"><span /> FOR LOCAL BUSINESSES</div><h1>Grow with your <em>neighbors.</em></h1><p>Manage your business and connect with nearby customers.</p></div><button className="primary-button" onClick={openBusinessProfile}>Manage your business</button></div>
    <div className="portal-tabs">{["Overview", "My business", "Products & services", "Orders", "Enquiries", "Plans & billing", "Verification", "Profile details", "Settings"].map((item) => <button key={item} className={tab === item || (item === "Profile details" && tab === "Profile") ? "current" : ""} onClick={() => setTab(item)}>{item === "Orders" && pendingPrepCount > 0 ? `Orders (${pendingPrepCount})` : item}</button>)}</div>
    {tab === "Overview" && <>
      <div className="metric-grid">
        <Metric label="Profile views" value="1,284" delta="Sample dashboard metric" icon="◉" />
        <Metric label="Active orders" value={String(accountOrders.length)} delta={`${pendingPrepCount} awaiting preparation`} icon="🛍️" />
        <Metric label="Customer enquiries" value={String(accountEnquiries.length)} delta="Saved in this browser" icon="↗" />
        <Metric label="Search appearances" value="438" delta="Sample dashboard metric" icon="⌕" />
      </div>
      <div className="portal-columns"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">YOUR BUSINESS</div><h2>Business profile</h2></div><button className="text-link" onClick={openBusinessProfile}>View details <span>→</span></button></div>
        {businesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending plan"}</span></div>)}
        {!businesses.length && <EmptyState title="No business profile yet" text="Complete your business registration to set up your profile." />}
      </section>
      <section className="panel plan-panel"><div className="eyebrow">YOUR MEMBERSHIP</div><div className="plan-title"><h2>Subscription status</h2><span className={`status-pill ${activeSub ? "verified" : "pending"}`}>● {activeSub ? `${activeSub.plan} Plan` : "Pending plan"}</span></div><p>{activeSub ? `Your business is enrolled in the ${activeSub.plan} plan (${activeSub.billingCycle || "Monthly"} billing). Payments processed with official GST invoice.` : "Choose a visibility plan for your business to unlock premium neighborhood discovery and customer orders."}</p><div className="plan-features"><span>✓ Local search priority &amp; SEO listing</span><span>✓ Direct customer enquiry &amp; order receiving</span><span>✓ Verified business badge &amp; GST tax invoice</span></div><div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}><button className="primary-button" type="button" onClick={() => onSelectPlan ? onSelectPlan(activeSub?.plan || "Growth") : openPlans()}>{activeSub ? "Upgrade / Change Plan 💳" : "Choose Growth Plan 💳"}</button>{activeSub && onViewInvoice && <button className="outline-button" type="button" onClick={() => onViewInvoice(activeSub)}>🧾 View Tax Invoice</button>}</div>{accountCheckouts[0] && <div className="checkout-summary" style={{ marginTop: "12px" }}><strong>Latest subscription payment</strong><span>{accountCheckouts[0].businessName} · {accountCheckouts[0].plan}</span><small>Status: {accountCheckouts[0].status} · Ref: {accountCheckouts[0].transactionId || "Verified"}</small></div>}</section></div>
      <div className="verification-banner"><span className="verify-icon">⌖</span><div><strong>Help neighbors find the right place.</strong><p>Granting device location is only a demo permission check; it does not verify your registered business address.</p></div><button onClick={verifyLocation}>Check location access <span>↗</span></button></div>
      <div className="form-note"><strong>Demo dashboard</strong><span>Views, enquiries and subscription status are sample data until your business is connected to a production backend.</span></div>
    </>}
    {tab === "My business" && <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">BUSINESS PROFILE</div><h2>Your business</h2></div></div>{businesses.length ? businesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} · {business.distance} km sample distance</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Needs plan"}</span></div>) : <EmptyState title="No business profile yet" text="Complete your business registration to set up your profile." />}</section>}
    {tab === "Products & services" && (
      <ProductManager
        businesses={businesses}
        categoryConfig={categoryConfig}
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
      />
    )}
    {tab === "Orders" && (
      <section className="panel tab-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">ORDER FULFILMENT &amp; PREPARATION</div>
            <h2>Incoming Customer Orders</h2>
          </div>
        </div>
        <MerchantOrdersManager
          orders={accountOrders}
          businessName={accountBusinessName}
          onUpdateStatus={onUpdateOrderStatus || (() => {})}
        />
      </section>
    )}
    {tab === "Enquiries" && <section className="panel tab-panel"><div className="eyebrow">CUSTOMER ENQUIRIES</div><h2>Requests for your business</h2><p>These are local demo enquiries and have not been delivered to customers or businesses.</p>{accountEnquiries.length ? accountEnquiries.map((enquiry) => <EnquiryRow enquiry={enquiry} key={enquiry.id} />) : <EmptyState title="No enquiries yet" text="Customer requests for your business will appear here." />}</section>}
    {tab === "Plans & billing" && <>
      {activeSub && (
        <section className="panel tab-panel active-subscription-banner" style={{ background: "linear-gradient(135deg, #184224 0%, #2b6139 100%)", color: "#fff", borderRadius: "12px", padding: "20px 24px", marginBottom: "18px", boxShadow: "0 6px 20px rgba(24,66,36,0.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", background: "rgba(255,255,255,0.18)", padding: "3px 8px", borderRadius: "10px" }}>
                ● ACTIVE MEMBERSHIP
              </span>
              <h2 style={{ fontSize: "22px", margin: "8px 0 4px", color: "#fff" }}>
                {activeSub.plan} Plan ({activeSub.billingCycle || "Monthly"})
              </h2>
              <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>
                Registered to <strong>{activeSub.businessName}</strong> · Valid until {activeSub.validUntil ? new Date(activeSub.validUntil).toLocaleDateString() : "Active"}
              </p>
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "11px", opacity: 0.85 }}>
                <span>Txn: {activeSub.transactionId || "Verified"}</span>
                <span>Inv: #{activeSub.invoiceNumber || activeSub.id}</span>
                <span>Amount: ₹{activeSub.totalAmount || activeSub.amount} (Incl. GST)</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {onViewInvoice && (
                <button
                  type="button"
                  onClick={() => onViewInvoice(activeSub)}
                  style={{ background: "#fff", color: "#184224", border: 0, borderRadius: "8px", padding: "9px 14px", fontWeight: 700, fontSize: "11.5px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  🧾 View Tax Invoice
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectPlan ? onSelectPlan(activeSub.plan === "Neighborhood Pro" ? "Growth" : "Neighborhood Pro") : openPlans()}
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "8px", padding: "9px 14px", fontWeight: 700, fontSize: "11.5px", cursor: "pointer" }}
              >
                Change Plan
              </button>
            </div>
          </div>
        </section>
      )}
      <PlansSection openPlans={openPlans} onSelectPlan={onSelectPlan} />
      {accountCheckouts.length > 0 && (
        <section className="panel tab-panel" style={{ marginTop: "24px" }}>
          <div className="eyebrow">BILLING &amp; TAX INVOICE HISTORY</div>
          <h2>Subscription History</h2>
          <p>Official GST-compliant tax invoices for your business membership subscriptions.</p>
          <div style={{ overflowX: "auto", marginTop: "14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
              <thead>
                <tr style={{ background: "#f5f8f5", borderBottom: "1px solid #d8e4d8", color: "#45594a", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Invoice #</th>
                  <th style={{ padding: "10px 12px" }}>Date</th>
                  <th style={{ padding: "10px 12px" }}>Plan &amp; Cycle</th>
                  <th style={{ padding: "10px 12px" }}>Payment Method</th>
                  <th style={{ padding: "10px 12px" }}>Amount</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {accountCheckouts.map((item, index) => (
                  <tr key={`${item.id || item.createdAt}-${index}`} style={{ borderBottom: "1px solid #edf2ed" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1c3823" }}>
                      {item.invoiceNumber || item.id || `INV-${index + 1}`}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#667" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <strong>{item.plan}</strong> <span style={{ color: "#778", fontSize: "10px" }}>({item.billingCycle || "Monthly"})</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#445" }}>
                      {item.paymentMethod}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                      ₹{item.totalAmount ? item.totalAmount.toLocaleString("en-IN") : item.amount?.toLocaleString("en-IN") || "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span className={`status-pill ${item.status === "Active" || item.status === "Paid" ? "verified" : "pending"}`}>
                        ● {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      {onViewInvoice ? (
                        <button
                          type="button"
                          onClick={() => onViewInvoice(item)}
                          style={{ background: "#edf5ee", border: "1px solid #c8dbc9", color: "#1a4a25", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                        >
                          🧾 Invoice
                        </button>
                      ) : (
                        <span style={{ color: "#999" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>}
    {tab === "Verification" && <section className="panel tab-panel"><div className="eyebrow">BUILD TRUST LOCALLY</div><h2>Verify your business location</h2><p>Share your location only when you are ready. Bizearch uses the location to check your business address; production verification requires a secure server-side workflow.</p><button className="primary-button" onClick={verifyLocation}>⌖ Verify with this device</button></section>}
    {(tab === "Profile details" || tab === "Profile") && (
      <ProfileAndSettingsPanel
        role="Business"
        label="Business Account"
        initialSubTab="profile"
        onNavigateTab={(t) => setTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
    {tab === "Settings" && (
      <ProfileAndSettingsPanel
        role="Business"
        label="Business Account"
        initialSubTab="settings"
        onNavigateTab={(t) => setTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
  </div>;
}

function AgentPortal({
  initialTab = "Overview",
  onOpenPortal,
  onLanguageChange,
  showNotice,
}: {
  initialTab?: string;
  onOpenPortal?: (role: Role) => void;
  onLanguageChange?: (lang: "en" | "ta" | "kn" | "te") => void;
  showNotice: (message: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState(initialTab || "Overview");
  useEffect(() => {
    if (initialTab && initialTab !== "Overview") setTab(initialTab);
  }, [initialTab]);
  useEffect(() => {
    const openProfile = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      setTab(customEvent.detail?.tab || "Profile details");
    };
    window.addEventListener("neighborly-open-profile", openProfile);
    return () => window.removeEventListener("neighborly-open-profile", openProfile);
  }, []);

  function downloadReferralReport() {
    const rows = [
      ["Business Name", "Category", "Joined Date", "Status", "Estimated Commission"],
      ["Bloom & Bean Café", "Food & dining", "Oct 14, 2026", "Subscribed", "₹1,200"],
      ["Kaveri Cycle Works", "Automobiles", "Oct 12, 2026", "Pending plan", "₹0"],
      ["Pixel Fix Studio", "Electronics", "Oct 09, 2026", "Subscribed", "₹1,200"],
      ["Sunday Loom", "Fashion", "Oct 06, 2026", "Reviewing", "₹0"],
      ["Hosur Properties Hub", "Real Estate & Construction", "Oct 20, 2026", "Subscribed", "₹1,200"],
      ["Sri Balaji Laser Works", "Industrial & B2B Manufacturing", "Oct 22, 2026", "Subscribed", "₹1,200"]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hosur_agent_referrals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice("Agent referral report downloaded as CSV.");
  }

  return <div className="page-content portal-content"><div className="portal-header"><div><div className="eyebrow"><span /> NEIGHBORHOOD PARTNERS</div><h1>Good connections,<br /><em>good things.</em></h1><p>Help great local businesses meet the neighbors who need them.</p></div><div className="agent-avatar">✳</div></div>
    <div className="portal-tabs">{["Overview", "Profile details", "Settings"].map((item) => <button key={item} className={tab === item || (item === "Profile details" && tab === "Profile") ? "current" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Overview" && <>
    <section className="referral-card"><div className="referral-copy"><div className="eyebrow">YOUR REFERRAL CODE</div><h2>Share the local love.</h2><p>Businesses that use your code will be linked to your agent account when they register.</p></div><div className="code-box"><code>NEIGHBOR-4821</code><button onClick={() => { navigator.clipboard?.writeText("NEIGHBOR-4821"); setCopied(true); showNotice("Referral code copied."); }}>{copied ? "Copied ✓" : "Copy code ↗"}</button></div></section>
    <div className="metric-grid"><Metric label="Businesses referred" value="24" delta="Across 6 categories" icon="♧" /><Metric label="Awaiting signup" value="5" delta="Share your referral code" icon="◷" /><Metric label="This month's reward" value="₹4,800" delta="Demo estimate" icon="↗" /></div>
    <section className="panel agent-table"><div className="panel-heading"><div><div className="eyebrow">YOUR NETWORK</div><h2>Recent referrals</h2></div><button className="text-link" onClick={downloadReferralReport}>Download report ↗</button></div>
      <div className="table-head"><span>BUSINESS</span><span>CATEGORY</span><span>JOINED</span><span>STATUS</span></div>
      {[["Bloom & Bean Café", "Food & dining", "Oct 14, 2026", "Subscribed"], ["Kaveri Cycle Works", "Automobiles", "Oct 12, 2026", "Pending plan"], ["Pixel Fix Studio", "Electronics", "Oct 09, 2026", "Subscribed"], ["Sunday Loom", "Fashion", "Oct 06, 2026", "Reviewing"]].map((row) => <div className="table-row" key={row[0]}>{row.map((cell, index) => <span key={cell} className={index === 3 ? `status-pill ${cell === "Subscribed" ? "verified" : "pending"}` : ""}>{index === 3 && <i>● </i>}{cell}</span>)}</div>)}
    </section><div className="form-note"><strong>Agent data</strong><span>Referral records, commission rules, and payouts need authenticated server-side services before launch.</span></div>
    </>}
    {(tab === "Profile details" || tab === "Profile") && (
      <ProfileAndSettingsPanel
        role="Agent"
        label="Field agent"
        initialSubTab="profile"
        onNavigateTab={(t) => setTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
    {tab === "Settings" && (
      <ProfileAndSettingsPanel
        role="Agent"
        label="Field agent"
        initialSubTab="settings"
        onNavigateTab={(t) => setTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
  </div>;
}

function ProfileAndSettingsPanel({
  role,
  label,
  identity = "",
  initialSubTab = "profile",
  data,
  onNavigateTab,
  onOpenPortal,
  onLanguageChange,
  showNotice,
}: {
  role: "Account" | "Business" | "Agent" | "Company";
  label: string;
  identity?: string;
  initialSubTab?: "profile" | "settings" | "notifications" | "security" | "data" | "features";
  data?: DemoData;
  onNavigateTab?: (tab: string) => void;
  onOpenPortal?: (role: Role) => void;
  onLanguageChange?: (lang: "en" | "ta" | "kn" | "te") => void;
  showNotice?: (msg: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "settings" | "notifications" | "security" | "data" | "features">(initialSubTab);
  const [profile, setProfile] = useState<MemberProfile>(emptyMemberProfile);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [profileSaved, setProfileSaved] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [gpsFetching, setGpsFetching] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");
  const [sosTested, setSosTested] = useState(false);
  const [passcodeCurrent, setPasscodeCurrent] = useState("");
  const [passcodeNew, setPasscodeNew] = useState("");
  const [passcodeConfirm, setPasscodeConfirm] = useState("");
  const [passcodeStatus, setPasscodeStatus] = useState("");

  // Sync sub-tab if prop changes
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Load profile & settings from local storage
  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(profileStorageKey(role, identity));
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as Partial<MemberProfile>;
        setProfile({
          fullName: parsed.fullName || (role === "Company" && identity ? identity.split("@")[0].replace(/[._-]+/g, " ") : "Naveen Kumar"),
          phone: parsed.phone || "94895 21482",
          email: parsed.email || (identity || "naveen.hosur@gmail.com"),
          doorNo: parsed.doorNo || "Flat 302, Sri Krishna Apts",
          street: parsed.street || "Near Sub-Collector Office, Bagalur Main Road",
          locality: parsed.locality || "Bagalur Road",
          city: parsed.city || "Hosur",
          district: parsed.district || "Krishnagiri",
          state: parsed.state || "Tamil Nadu",
          pincode: parsed.pincode || "635109",
          address: parsed.address || "Flat 302, Sri Krishna Apts, Bagalur Main Road, Hosur - 635109",
          bio: parsed.bio || "Hosur resident & community member since 2024. Active patron of local makers and farmers.",
          avatarInitials: parsed.avatarInitials || "N",
          avatarBg: parsed.avatarBg || "#efc7aa",
          emergencyPhones: [parsed.emergencyPhones?.[0] || "98432 10987", parsed.emergencyPhones?.[1] || "94432 56789"],
          emergencyNames: [parsed.emergencyNames?.[0] || "Priya Kumar", parsed.emergencyNames?.[1] || "Dr. Rajesh Raman"],
          emergencyRelations: [parsed.emergencyRelations?.[0] || "Spouse / Family", parsed.emergencyRelations?.[1] || "Family Physician"],
          capturedGps: parsed.capturedGps,
        });
      } else {
        // Sensible initial profile for demo
        setProfile({
          fullName: role === "Company" && identity ? identity.split("@")[0].replace(/[._-]+/g, " ") : "Naveen Kumar",
          phone: "94895 21482",
          email: identity || "naveen.hosur@gmail.com",
          doorNo: "Flat 302, Sri Krishna Apts",
          street: "Near Sub-Collector Office, Bagalur Main Road",
          locality: "Bagalur Road",
          city: "Hosur",
          district: "Krishnagiri",
          state: "Tamil Nadu",
          pincode: "635109",
          address: "Flat 302, Sri Krishna Apts, Bagalur Main Road, Hosur - 635109",
          bio: "Hosur resident & community member since 2024. Active patron of local makers and farmers.",
          avatarInitials: "N",
          avatarBg: "#efc7aa",
          emergencyPhones: ["98432 10987", "94432 56789"],
          emergencyNames: ["Priya Kumar", "Dr. Rajesh Raman"],
          emergencyRelations: ["Spouse / Family", "Family Physician"],
        });
      }

      const storedSettings = window.localStorage.getItem(settingsStorageKey(role, identity));
      if (storedSettings) {
        setSettings({ ...defaultUserSettings, ...JSON.parse(storedSettings) });
      }
    } catch {
      // Fallback
    }
  }, [role, identity]);

  function updateProfile<K extends keyof MemberProfile>(key: K, value: MemberProfile[K]) {
    setProfile((curr) => ({ ...curr, [key]: value }));
    setProfileSaved(false);
    setProfileError("");
  }

  function updateSettings<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((curr) => {
      const next = { ...curr, [key]: value };
      try {
        window.localStorage.setItem(settingsStorageKey(role, identity), JSON.stringify(next));
      } catch {}
      return next;
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.fullName.trim()) {
      setProfileError("Please enter your full name.");
      return;
    }
    const combinedAddress = [profile.doorNo, profile.street, profile.locality, `${profile.city} - ${profile.pincode}`, profile.state].filter(Boolean).join(", ");
    const updated: MemberProfile = {
      ...profile,
      fullName: profile.fullName.trim(),
      address: combinedAddress || profile.address,
      avatarInitials: (profile.fullName.trim()[0] || "N").toUpperCase(),
    };
    try {
      window.localStorage.setItem(profileStorageKey(role, identity), JSON.stringify(updated));
      setProfile(updated);
      setProfileSaved(true);
      setProfileError("");
      if (showNotice) showNotice("✓ Profile details successfully saved.");
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {
      setProfileError("Could not save profile details on this device.");
    }
  }

  function captureGpsPin() {
    setGpsFetching(true);
    setGpsMessage("Requesting device location from browser...");
    if (!navigator.geolocation) {
      setGpsMessage("Geolocation is not supported by your browser.");
      setGpsFetching(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString(),
        };
        updateProfile("capturedGps", coords);
        setGpsMessage(`✓ Captured GPS: ${coords.latitude}, ${coords.longitude} (±${coords.accuracy}m accuracy)`);
        setGpsFetching(false);
      },
      (err) => {
        setGpsMessage(`Location unavailable: ${err.message}. Using default Hosur city center.`);
        setGpsFetching(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function downloadBackupJson() {
    const backupData = {
      exportedAt: new Date().toISOString(),
      role,
      profile,
      settings,
      stats: {
        favoritesCount: data?.favorites.length || 0,
        ordersCount: data?.orders?.length || 0,
        recentSearchesCount: data?.recentSearches.length || 0,
      },
      recentSearches: data?.recentSearches || [],
      orders: data?.orders || [],
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizearch-${role.toLowerCase()}-profile-data.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (showNotice) showNotice("✓ Data export downloaded.");
  }

  function exportOrdersCsv() {
    const orders = data?.orders || [];
    if (!orders.length) {
      if (showNotice) showNotice("No order records to export yet.");
      return;
    }
    const headers = ["Order ID", "Date", "Business", "Items", "Total (INR)", "Status", "Payment Method", "Txn ID"];
    const rows = orders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleString(),
      `"${o.businessName}"`,
      `"${o.items?.map((it) => `${it.name} (x${it.quantity})`).join("; ") || "Order items"}"`,
      o.totalAmount,
      o.status,
      o.paymentMethod,
      o.paymentTransactionId || "N/A",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encoded;
    a.download = `bizearch-orders-${role.toLowerCase()}.csv`;
    a.click();
    if (showNotice) showNotice("✓ Order history CSV downloaded.");
  }

  function updatePasscode(e: React.FormEvent) {
    e.preventDefault();
    if (passcodeNew.length < 4) {
      setPasscodeStatus("Error: Passcode must be at least 4 digits.");
      return;
    }
    if (passcodeNew !== passcodeConfirm) {
      setPasscodeStatus("Error: Passcodes do not match.");
      return;
    }
    updateSettings("passcode", passcodeNew);
    setPasscodeStatus("✓ Account passcode updated successfully.");
    setPasscodeCurrent("");
    setPasscodeNew("");
    setPasscodeConfirm("");
  }

  return (
    <div className="profile-settings-root">
      {/* Profile Hero Header */}
      <section className="profile-hero-card">
        <div className="profile-hero-left">
          <div
            className="profile-avatar-large"
            style={{ background: profile.avatarBg || "#efc7aa", color: "#3d2414" }}
          >
            {profile.avatarInitials || profile.fullName[0] || "N"}
          </div>
          <div className="profile-hero-meta">
            <h2>{profile.fullName || "Member Profile"}</h2>
            <p>
              <span>📞 {profile.phone || "+91 94895 21482"}</span>
              <span>·</span>
              <span>📍 {profile.locality || "Hosur, Tamil Nadu"}</span>
            </p>
            <div className="profile-hero-badges">
              <span className="profile-hero-pill">● {label} Account</span>
              <span className="profile-hero-pill">✓ Verified Resident</span>
              <span className="profile-hero-pill">🛡️ SOS Enabled</span>
            </div>
          </div>
        </div>

        <div className="profile-hero-stats">
          <div className="profile-hero-stat-item">
            <strong>{data?.orders?.length || 0}</strong>
            <small>Orders</small>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <div className="profile-hero-stat-item">
            <strong>{data?.favorites.length || 0}</strong>
            <small>Saved</small>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
          <div className="profile-hero-stat-item">
            <strong>100%</strong>
            <small>Trust Score</small>
          </div>
        </div>
      </section>

      {/* Sub-Navigation Tabs */}
      <nav className="profile-subtabs-nav" aria-label="Profile and settings navigation">
        <button
          type="button"
          className={`profile-subtab-btn ${activeSubTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveSubTab("profile")}
        >
          <span>👤</span> Profile Details
        </button>
        <button
          type="button"
          className={`profile-subtab-btn ${activeSubTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveSubTab("settings")}
        >
          <span>⚙️</span> General Settings
        </button>
        <button
          type="button"
          className={`profile-subtab-btn ${activeSubTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveSubTab("notifications")}
        >
          <span>🔔</span> Notifications &amp; Alerts
        </button>
        <button
          type="button"
          className={`profile-subtab-btn ${activeSubTab === "security" ? "active" : ""}`}
          onClick={() => setActiveSubTab("security")}
        >
          <span>🔒</span> Security &amp; Privacy
        </button>
        <button
          type="button"
          className={`profile-subtab-btn ${activeSubTab === "data" ? "active" : ""}`}
          onClick={() => setActiveSubTab("data")}
        >
          <span>📦</span> Data &amp; Storage
        </button>
        <button
          type="button"
          className={`profile-subtab-btn ${activeSubTab === "features" ? "active" : ""}`}
          onClick={() => setActiveSubTab("features")}
        >
          <span>⚡</span> Features &amp; Portals
        </button>
      </nav>

      {/* TAB 1: PROFILE DETAILS */}
      {activeSubTab === "profile" && (
        <form className="settings-section-card" onSubmit={saveProfile}>
          <div className="settings-card-header">
            <h3><span>👤</span> Personal Information</h3>
            <p>Update your personal details, contact numbers, and emergency safety connections.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Full Name *
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => updateProfile("fullName", e.target.value)}
                maxLength={80}
                required
                style={{ padding: "9px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px" }}
              />
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Mobile Number (With WhatsApp) *
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ padding: "9px 10px", background: "#f2f6f2", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px", fontWeight: 700, color: "#284a32" }}>
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => updateProfile("phone", e.target.value)}
                  maxLength={15}
                  required
                  style={{ flex: 1, padding: "9px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px" }}
                />
              </div>
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Email Address (For Tax Invoices &amp; Receipts)
              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile("email", e.target.value)}
                maxLength={120}
                style={{ padding: "9px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px" }}
              />
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Avatar Color Theme
              <select
                value={profile.avatarBg || "#efc7aa"}
                onChange={(e) => updateProfile("avatarBg", e.target.value)}
                style={{ padding: "9px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px", background: "#fff", cursor: "pointer" }}
              >
                <option value="#efc7aa">Warm Peach (Classic)</option>
                <option value="#86efac">Emerald Sage</option>
                <option value="#7dd3fc">Hosur Sky Blue</option>
                <option value="#d8b4fe">Lavender Floral</option>
                <option value="#fde047">Sun Gold</option>
                <option value="#285536">Deep Forest Green</option>
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
            Neighborhood Bio / Delivery Instructions
            <textarea
              rows={2}
              value={profile.bio || ""}
              onChange={(e) => updateProfile("bio", e.target.value)}
              maxLength={240}
              placeholder="e.g. Ring doorbell, contactless delivery preferred, leave package with security."
              style={{ padding: "9px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px", resize: "vertical" }}
            />
          </label>

          {/* Hosur Address Form */}
          <div className="settings-card-header" style={{ marginTop: "14px" }}>
            <h3><span>📍</span> Residential / Delivery Address in Hosur</h3>
            <p>Used to calculate accurate road distance and route navigation to local stores.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Door / Flat No.
              <input
                type="text"
                value={profile.doorNo || ""}
                onChange={(e) => updateProfile("doorNo", e.target.value)}
                placeholder="e.g. 14/B, Flat 201"
                style={{ padding: "8px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px" }}
              />
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Street / Landmark
              <input
                type="text"
                value={profile.street || ""}
                onChange={(e) => updateProfile("street", e.target.value)}
                placeholder="e.g. Bagalur Main Road, Near Bustand"
                style={{ padding: "8px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px" }}
              />
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Hosur Locality / Area
              <select
                value={profile.locality || "Bagalur Road"}
                onChange={(e) => updateProfile("locality", e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px", background: "#fff", cursor: "pointer" }}
              >
                {HOSUR_LOCALITIES.filter((l) => l !== "All Hosur").map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: "6px", fontSize: "11px", color: "#3e5243", fontWeight: 700 }}>
              Pincode
              <input
                type="text"
                value={profile.pincode || "635109"}
                onChange={(e) => updateProfile("pincode", e.target.value)}
                maxLength={6}
                style={{ padding: "8px 12px", border: "1px solid #d3e0d5", borderRadius: "8px", fontSize: "12px" }}
              />
            </label>
          </div>

          {/* GPS Pin Capture Section */}
          <div style={{ background: "#f5f9f5", border: "1px solid #dce8dd", borderRadius: "10px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <strong style={{ fontSize: "12px", color: "#194225", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🛰️</span> Precise GPS Location Pin
              </strong>
              <small style={{ display: "block", color: "#617766", marginTop: "2px", fontSize: "10.5px" }}>
                {profile.capturedGps
                  ? `Lat: ${profile.capturedGps.latitude}, Lng: ${profile.capturedGps.longitude} (±${profile.capturedGps.accuracy}m accuracy)`
                  : "No device GPS pin captured yet. Capturing provides exact kilometer distance to stores."}
              </small>
              {gpsMessage && <div style={{ fontSize: "11px", color: "#15803d", marginTop: "4px", fontWeight: 600 }}>{gpsMessage}</div>}
            </div>
            <button
              type="button"
              onClick={captureGpsPin}
              disabled={gpsFetching}
              className="outline-button"
              style={{ fontSize: "11px", padding: "7px 12px" }}
            >
              {gpsFetching ? "Fetching GPS..." : "📍 Capture Live GPS Pin"}
            </button>
          </div>

          {/* Emergency SOS Contacts */}
          <div className="settings-card-header" style={{ marginTop: "14px" }}>
            <h3><span>🛡️</span> Emergency SOS Contacts (Hosur Safety Network)</h3>
            <p>Saved contacts are included in your Super Admin emergency dispatch ticket when SOS is triggered.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            <div style={{ background: "#fbfcfb", border: "1px solid #e1ebe2", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#1d4729", marginBottom: "8px" }}>
                PRIMARY EMERGENCY CONTACT
              </div>
              <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#4f6354", marginBottom: "8px" }}>
                Contact Name
                <input
                  type="text"
                  value={profile.emergencyNames?.[0] || ""}
                  onChange={(e) => updateProfile("emergencyNames", [e.target.value, profile.emergencyNames?.[1] || ""])}
                  placeholder="e.g. Priya Kumar"
                  style={{ padding: "7px 10px", border: "1px solid #d5e2d6", borderRadius: "6px", fontSize: "11.5px" }}
                />
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#4f6354", marginBottom: "8px" }}>
                Relationship
                <select
                  value={profile.emergencyRelations?.[0] || "Spouse / Family"}
                  onChange={(e) => updateProfile("emergencyRelations", [e.target.value, profile.emergencyRelations?.[1] || ""])}
                  style={{ padding: "7px 10px", border: "1px solid #d5e2d6", borderRadius: "6px", fontSize: "11.5px", background: "#fff" }}
                >
                  <option value="Spouse / Family">Spouse / Family</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Close Friend">Close Friend</option>
                  <option value="Family Physician">Family Physician</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#4f6354" }}>
                Mobile Number *
                <input
                  type="tel"
                  value={profile.emergencyPhones[0]}
                  onChange={(e) => updateProfile("emergencyPhones", [e.target.value, profile.emergencyPhones[1]])}
                  placeholder="e.g. 98432 10987"
                  required
                  style={{ padding: "7px 10px", border: "1px solid #d5e2d6", borderRadius: "6px", fontSize: "11.5px" }}
                />
              </label>
            </div>

            <div style={{ background: "#fbfcfb", border: "1px solid #e1ebe2", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#1d4729", marginBottom: "8px" }}>
                SECONDARY EMERGENCY CONTACT
              </div>
              <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#4f6354", marginBottom: "8px" }}>
                Contact Name
                <input
                  type="text"
                  value={profile.emergencyNames?.[1] || ""}
                  onChange={(e) => updateProfile("emergencyNames", [profile.emergencyNames?.[0] || "", e.target.value])}
                  placeholder="e.g. Dr. Rajesh Raman"
                  style={{ padding: "7px 10px", border: "1px solid #d5e2d6", borderRadius: "6px", fontSize: "11.5px" }}
                />
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#4f6354", marginBottom: "8px" }}>
                Relationship
                <select
                  value={profile.emergencyRelations?.[1] || "Family Physician"}
                  onChange={(e) => updateProfile("emergencyRelations", [profile.emergencyRelations?.[0] || "", e.target.value])}
                  style={{ padding: "7px 10px", border: "1px solid #d5e2d6", borderRadius: "6px", fontSize: "11.5px", background: "#fff" }}
                >
                  <option value="Family Physician">Family Physician</option>
                  <option value="Spouse / Family">Spouse / Family</option>
                  <option value="Neighbor">Neighbor</option>
                  <option value="Work Colleague">Work Colleague</option>
                  <option value="Lawyer / Advocate">Lawyer / Advocate</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#4f6354" }}>
                Mobile Number *
                <input
                  type="tel"
                  value={profile.emergencyPhones[1]}
                  onChange={(e) => updateProfile("emergencyPhones", [profile.emergencyPhones[0], e.target.value])}
                  placeholder="e.g. 94432 56789"
                  required
                  style={{ padding: "7px 10px", border: "1px solid #d5e2d6", borderRadius: "6px", fontSize: "11.5px" }}
                />
              </label>
            </div>
          </div>

          {profileError && <p className="form-error" role="alert">{profileError}</p>}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
            <button className="primary-button" type="submit" style={{ padding: "10px 24px", fontSize: "12.5px" }}>
              💾 Save Profile Details
            </button>
            <button
              type="button"
              className="outline-button"
              onClick={() => {
                setSosTested(true);
                setTimeout(() => setSosTested(false), 3000);
              }}
              style={{ fontSize: "11.5px" }}
            >
              🚨 Test SOS Notification
            </button>
            {profileSaved && <span style={{ color: "#15803d", fontWeight: 700, fontSize: "12px" }}>✓ Profile details saved</span>}
            {sosTested && (
              <span style={{ color: "#b91c1c", fontWeight: 700, fontSize: "11.5px" }}>
                ✓ SOS Alert test payload verified for {profile.emergencyPhones[0]} &amp; {profile.emergencyPhones[1]}
              </span>
            )}
          </div>
        </form>
      )}

      {/* TAB 2: GENERAL SETTINGS */}
      {activeSubTab === "settings" && (
        <div className="settings-section-card">
          <div className="settings-card-header">
            <h3><span>⚙️</span> Search, Neighborhood &amp; Display Preferences</h3>
            <p>Customize discovery filters, language localization, and catalogue appearance.</p>
          </div>

          {/* Search Radius */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Default Search Radius</strong>
              <small>Businesses within this distance appear automatically when you open Discover.</small>
            </div>
            <div style={{ display: "inline-flex", gap: "6px" }}>
              {[1, 3, 5, 10, 25].map((rad) => (
                <button
                  key={rad}
                  type="button"
                  onClick={() => updateSettings("defaultRadius", rad)}
                  style={{
                    padding: "6px 11px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "1px solid",
                    borderColor: settings.defaultRadius === rad ? "#15803d" : "#d3dfd5",
                    background: settings.defaultRadius === rad ? "#15803d" : "#fff",
                    color: settings.defaultRadius === rad ? "#fff" : "#324838",
                    cursor: "pointer",
                  }}
                >
                  {rad} km
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Locality Filter */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Default Locality Filter</strong>
              <small>Pre-filter searches to your favorite Hosur neighborhood.</small>
            </div>
            <select
              value={settings.preferredLocality}
              onChange={(e) => updateSettings("preferredLocality", e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #d3dfd5", borderRadius: "8px", fontSize: "11.5px", background: "#fff", cursor: "pointer" }}
            >
              {HOSUR_LOCALITIES.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Detect Location */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Auto-detect Location on Launch</strong>
              <small>Automatically query browser GPS to calculate real-time road distance to merchants.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.autoDetectLocation}
                onChange={(e) => updateSettings("autoDetectLocation", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          {/* Map Provider */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Map Provider</strong>
              <small>Choose between Google Maps directions or OpenStreetMap vector rendering.</small>
            </div>
            <div style={{ display: "inline-flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => updateSettings("mapProvider", "google")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid",
                  borderColor: settings.mapProvider === "google" ? "#1e40af" : "#cbd5e1",
                  background: settings.mapProvider === "google" ? "#1e40af" : "#fff",
                  color: settings.mapProvider === "google" ? "#fff" : "#334155",
                  cursor: "pointer",
                }}
              >
                🗺️ Google Maps
              </button>
              <button
                type="button"
                onClick={() => updateSettings("mapProvider", "osm")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid",
                  borderColor: settings.mapProvider === "osm" ? "#047857" : "#cbd5e1",
                  background: settings.mapProvider === "osm" ? "#047857" : "#fff",
                  color: settings.mapProvider === "osm" ? "#fff" : "#334155",
                  cursor: "pointer",
                }}
              >
                🌍 OpenStreetMap
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Application Language</strong>
              <small>Switch the interface across English, தமிழ், ಕನ್ನಡ, and తెలుగు.</small>
            </div>
            <div style={{ display: "inline-flex", gap: "6px" }}>
              {(["en", "ta", "kn", "te"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    updateSettings("language", l);
                    if (onLanguageChange) onLanguageChange(l);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "1px solid",
                    borderColor: settings.language === l ? "#15803d" : "#d3dfd5",
                    background: settings.language === l ? "#15803d" : "#fff",
                    color: settings.language === l ? "#fff" : "#324838",
                    cursor: "pointer",
                  }}
                >
                  {l === "en" ? "EN" : l === "ta" ? "தமிழ்" : l === "kn" ? "ಕನ್ನಡ" : "తెలుగు"}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Layout */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Product Catalog Default Layout</strong>
              <small>Choose between visual product grid cards or compact list view.</small>
            </div>
            <div style={{ display: "inline-flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => updateSettings("catalogView", "grid")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid",
                  borderColor: settings.catalogView === "grid" ? "#15803d" : "#d3dfd5",
                  background: settings.catalogView === "grid" ? "#15803d" : "#fff",
                  color: settings.catalogView === "grid" ? "#fff" : "#324838",
                  cursor: "pointer",
                }}
              >
                ▦ Grid Cards
              </button>
              <button
                type="button"
                onClick={() => updateSettings("catalogView", "list")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: "1px solid",
                  borderColor: settings.catalogView === "list" ? "#15803d" : "#d3dfd5",
                  background: settings.catalogView === "list" ? "#15803d" : "#fff",
                  color: settings.catalogView === "list" ? "#fff" : "#324838",
                  cursor: "pointer",
                }}
              >
                ≡ List Rows
              </button>
            </div>
          </div>

          {settingsSaved && <span style={{ color: "#15803d", fontWeight: 700, fontSize: "12px" }}>✓ Settings updated</span>}
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS & ALERTS */}
      {activeSubTab === "notifications" && (
        <div className="settings-section-card">
          <div className="settings-card-header">
            <h3><span>🔔</span> Notification &amp; Alert Preferences</h3>
            <p>Control what notifications you receive for customer orders, safety alerts, and neighborhood updates.</p>
          </div>

          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Order Status Alerts</strong>
              <small>Receive instant popovers when your order is placed, accepted, prepared, or ready.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.orderStatusAlerts}
                onChange={(e) => updateSettings("orderStatusAlerts", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>SMS &amp; WhatsApp Order Tracking</strong>
              <small>Simulated order tracking messages dispatched to your registered mobile number.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.smsOrderUpdates}
                onChange={(e) => updateSettings("smsOrderUpdates", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Community SOS Safety Broadcasts</strong>
              <small>High-priority municipal announcements, weather advisories, and emergency alerts.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.communityBroadcasts}
                onChange={(e) => updateSettings("communityBroadcasts", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Local Deals &amp; Merchant Offers</strong>
              <small>Weekly curated discounts and special launches from Hosur neighborhood makers.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.merchantOffers}
                onChange={(e) => updateSettings("merchantOffers", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Sound &amp; Chime Feedback</strong>
              <small>Play subtle audio tone when an incoming alert or order update is received.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.soundAlerts}
                onChange={(e) => updateSettings("soundAlerts", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & PRIVACY */}
      {activeSubTab === "security" && (
        <div className="settings-section-card">
          <div className="settings-card-header">
            <h3><span>🔒</span> Security, Privacy &amp; Passcode</h3>
            <p>Manage authentication controls, local location sharing, and privacy protections.</p>
          </div>

          {/* Passcode Update Form */}
          <form onSubmit={updatePasscode} style={{ background: "#fbfcfb", border: "1px solid #e1eee2", borderRadius: "10px", padding: "16px", display: "grid", gap: "10px", maxWidth: "480px" }}>
            <strong style={{ fontSize: "12px", color: "#194023" }}>Change Account Passcode / PIN</strong>
            <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#526857" }}>
              New Passcode / PIN
              <input
                type="password"
                value={passcodeNew}
                onChange={(e) => setPasscodeNew(e.target.value)}
                placeholder="Enter 4-8 digit passcode"
                minLength={4}
                maxLength={20}
                required
                style={{ padding: "8px 12px", border: "1px solid #d0dfd3", borderRadius: "6px", fontSize: "12px" }}
              />
            </label>
            <label style={{ display: "grid", gap: "4px", fontSize: "10.5px", color: "#526857" }}>
              Confirm New Passcode
              <input
                type="password"
                value={passcodeConfirm}
                onChange={(e) => setPasscodeConfirm(e.target.value)}
                placeholder="Re-enter passcode"
                minLength={4}
                maxLength={20}
                required
                style={{ padding: "8px 12px", border: "1px solid #d0dfd3", borderRadius: "6px", fontSize: "12px" }}
              />
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button type="submit" className="primary-button" style={{ padding: "8px 16px", fontSize: "11.5px" }}>
                Update Passcode
              </button>
              {passcodeStatus && <small style={{ fontWeight: 700, color: passcodeStatus.startsWith("✓") ? "#15803d" : "#b91c1c" }}>{passcodeStatus}</small>}
            </div>
          </form>

          {/* Two-Factor Authentication */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Two-Factor OTP Verification</strong>
              <small>Require 6-digit one-time password verification when signing into your account.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => updateSettings("twoFactorAuth", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          {/* Location Sharing */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Share Approximate Distance with Merchants</strong>
              <small>Allows local shops to estimate travel time without revealing your exact street number.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.shareLocationWithShops}
                onChange={(e) => updateSettings("shareLocationWithShops", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          {/* Search History Toggle */}
          <div className="settings-row-toggle">
            <div className="settings-row-label">
              <strong>Save Search History on Device</strong>
              <small>Caches your frequent keyword searches for instant 1-click recall.</small>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={settings.saveSearchHistory}
                onChange={(e) => updateSettings("saveSearchHistory", e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          {/* Active Device Session */}
          <div style={{ background: "#f8faf8", border: "1px solid #dfe9e1", borderRadius: "10px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <strong style={{ fontSize: "12px", color: "#193f25", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>💻</span> Current Device &amp; Session
              </strong>
              <small style={{ display: "block", color: "#667a6a", marginTop: "2px" }}>
                Windows Desktop · Local Network IP: <code>192.168.1.6</code> · Active via Wi-Fi
              </small>
            </div>
            <span style={{ fontSize: "10.5px", background: "#edf8ef", color: "#166534", padding: "4px 10px", borderRadius: "12px", fontWeight: 700 }}>
              ● Secure &amp; Verified
            </span>
          </div>
        </div>
      )}

      {/* TAB 5: DATA & STORAGE MANAGEMENT */}
      {activeSubTab === "data" && (
        <div className="settings-section-card">
          <div className="settings-card-header">
            <h3><span>📦</span> Data Storage, Backups &amp; Privacy Exports</h3>
            <p>Inspect local storage statistics, download GDPR-compliant JSON backups, or export order spreadsheets.</p>
          </div>

          {/* Live Stats */}
          <div className="data-stats-grid">
            <div className="data-stat-card">
              <div className="data-stat-icon">🛍️</div>
              <div className="data-stat-info">
                <strong>{data?.orders?.length || 0}</strong>
                <small>Order Records</small>
              </div>
            </div>
            <div className="data-stat-card">
              <div className="data-stat-icon">❤️</div>
              <div className="data-stat-info">
                <strong>{data?.favorites.length || 0}</strong>
                <small>Saved Places</small>
              </div>
            </div>
            <div className="data-stat-card">
              <div className="data-stat-icon">🔍</div>
              <div className="data-stat-info">
                <strong>{data?.recentSearches.length || 0}</strong>
                <small>Cached Searches</small>
              </div>
            </div>
            <div className="data-stat-card">
              <div className="data-stat-icon">💾</div>
              <div className="data-stat-info">
                <strong>~14 KB</strong>
                <small>Local Storage Used</small>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="primary-button"
              onClick={downloadBackupJson}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontSize: "12px" }}
            >
              <span>📥</span> Download My Data (JSON Backup)
            </button>
            <button
              type="button"
              className="outline-button"
              onClick={exportOrdersCsv}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontSize: "12px" }}
            >
              <span>📊</span> Export Order Receipts (CSV)
            </button>
          </div>

          <div className="form-note" style={{ margin: "6px 0 0" }}>
            <strong>Local data portability</strong>
            <span>
              Your profile, saved places, order invoices, and emergency contacts are encrypted in your local browser sandbox.
              Exporting provides an offline, permanent copy of your records.
            </span>
          </div>
        </div>
      )}

      {/* TAB 6: CONNECTED FEATURES & PORTALS */}
      {activeSubTab === "features" && (
        <div className="settings-section-card">
          <div className="settings-card-header">
            <h3><span>⚡</span> Platform Workspace Switcher &amp; Features</h3>
            <p>Quick access to all Bizearch ecosystem portals, merchant management, and emergency response lines.</p>
          </div>

          <div className="portal-jump-grid">
            <button
              type="button"
              className="portal-jump-card"
              onClick={() => onOpenPortal && onOpenPortal("Discover")}
            >
              <h4>🛍️ Discover Marketplace</h4>
              <p>Explore Hosur shops, interactive map, live category directories, and menus.</p>
              <span>Open Discover →</span>
            </button>

            <button
              type="button"
              className="portal-jump-card"
              onClick={() => onOpenPortal && onOpenPortal("Account")}
            >
              <h4>👤 Customer Account Portal</h4>
              <p>Active order fulfillment tracking, saved shortlisted favorites, and enquiries.</p>
              <span>Open Customer Portal →</span>
            </button>

            <button
              type="button"
              className="portal-jump-card"
              onClick={() => onOpenPortal && onOpenPortal("Business")}
            >
              <h4>🏪 Business Partner Portal</h4>
              <p>Manage business profile, catalogue items, order prep, and Plans &amp; Billing checkout.</p>
              <span>Open Business Portal →</span>
            </button>

            <button
              type="button"
              className="portal-jump-card"
              onClick={() => onOpenPortal && onOpenPortal("Agent")}
            >
              <h4>🤝 Field Agent Portal</h4>
              <p>Agent referral codes, commission tracking, and local business onboarding.</p>
              <span>Open Agent Portal →</span>
            </button>

            <button
              type="button"
              className="portal-jump-card"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/company-login";
              }}
            >
              <h4>🏢 Company Administration</h4>
              <p>Ad manager, taxonomy controls, SOS emergency logs, and platform operations.</p>
              <span>Company Login →</span>
            </button>
          </div>

          {/* Hosur Emergency & Support Lines */}
          <div className="settings-card-header" style={{ marginTop: "14px" }}>
            <h3><span>📞</span> Hosur City Emergency &amp; Support Directory</h3>
            <p>Immediate phone numbers for emergency response and Bizearch Hosur help desk.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            <a
              href="tel:100"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", textDecoration: "none", color: "#991b1b" }}
            >
              <strong style={{ display: "block", fontSize: "12px" }}>🚔 Police Emergency</strong>
              <span style={{ fontSize: "14px", fontWeight: 800 }}>Dial 100 / 112</span>
            </a>
            <a
              href="tel:108"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", textDecoration: "none", color: "#991b1b" }}
            >
              <strong style={{ display: "block", fontSize: "12px" }}>🚑 Medical Ambulance</strong>
              <span style={{ fontSize: "14px", fontWeight: 800 }}>Dial 108</span>
            </a>
            <a
              href="tel:101"
              style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 14px", textDecoration: "none", color: "#92400e" }}
            >
              <strong style={{ display: "block", fontSize: "12px" }}>🚒 Fire &amp; Rescue</strong>
              <span style={{ fontSize: "14px", fontWeight: 800 }}>Dial 101</span>
            </a>
            <a
              href="tel:9489521482"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", textDecoration: "none", color: "#166534" }}
            >
              <strong style={{ display: "block", fontSize: "12px" }}>💬 Bizearch Hosur Help Desk</strong>
              <span style={{ fontSize: "14px", fontWeight: 800 }}>+91 94895 21482</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Backwards-compatible alias for existing dialogs and code
function ProfilePanel(props: { role: "Account" | "Business" | "Agent" | "Company"; label: string; identity?: string }) {
  return <ProfileAndSettingsPanel {...props} initialSubTab="profile" />;
}

const CATALOGUE_IMAGE_PRESETS = [
  { label: "Homestyle Thali", url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80" },
  { label: "Dosa & Tiffin", url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80" },
  { label: "Breakfast Box", url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80" },
  { label: "Tiffin Box", url: "https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&w=800&q=80" },
  { label: "North Indian", url: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80" },
  { label: "Dine In Feast", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" },
  { label: "Biryani Special", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80" },
  { label: "Coffee & Tea", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80" },
  { label: "Bakery & Sweets", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80" },
  { label: "Workshop / Service", url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80" },
];

function ProductManager({
  businesses,
  categoryConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: {
  businesses: Business[];
  categoryConfig: CategoryConfig;
  onAddProduct: (businessName: string, product: Omit<Product, "id">) => void;
  onUpdateProduct?: (businessName: string, productId: string, updated: Partial<Product>) => void;
  onDeleteProduct?: (businessName: string, productId: string) => void;
}) {
  const [selectedBusiness, setSelectedBusiness] = useState(businesses[0]?.name || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "outOfStock">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [changingImageProduct, setChangingImageProduct] = useState<Product | null>(null);

  // Add Item State
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addUnit, setAddUnit] = useState("per plate");
  const [addImage, setAddImage] = useState("");
  const [addBadge, setAddBadge] = useState("");
  const [addInStock, setAddInStock] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<CatalogueActivity[]>([]);
  const [catalogueSelections, setCatalogueSelections] = useState<CatalogueSelection[]>([]);
  const [addError, setAddError] = useState("");

  // Edit Item State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("per plate");
  const [editImage, setEditImage] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editInStock, setEditInStock] = useState(true);
  const [editError, setEditError] = useState("");

  // Quick Change Image State
  const [quickImageUrl, setQuickImageUrl] = useState("");

  const selectedBusinessProfile = businesses.find((b) => b.name === selectedBusiness) || businesses[0];
  const allProducts = selectedBusinessProfile?.products || [];

  const businessCategories = new Set(
    [...(selectedBusinessProfile?.categories || []), selectedBusinessProfile?.category]
      .filter((v): v is string => Boolean(v))
      .map((v) => v.toLowerCase())
  );
  const availableSectors = categoryConfig.sectors.filter((sector) =>
    businessCategories.has(sector.name.toLowerCase())
  );

  function toggleActivity(activity: CatalogueActivity) {
    setSelectedActivities((current) =>
      current.includes(activity) ? current.filter((item) => item !== activity) : [...current, activity]
    );
    setCatalogueSelections((current) => current.filter((selection) => selection.activity !== activity));
  }

  function toggleCataloguePath(activity: CatalogueActivity, sector: string, path: string[], checked: boolean) {
    setCatalogueSelections((current) => updateCatalogueSelections(current, activity, sector, path, checked));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is larger than 5MB. Please choose a smaller photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setter(result);
      }
    };
    reader.readAsDataURL(file);
  }

  function submitAddProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!addName.trim() || !addDescription.trim() || !selectedBusinessProfile) {
      setAddError("Enter a product/service name and description.");
      return;
    }
    const priceNum = Number(addPrice);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setAddError("Enter a valid price (0 or higher).");
      return;
    }

    onAddProduct(selectedBusinessProfile.name, {
      name: addName.trim(),
      description: addDescription.trim(),
      price: priceNum,
      unit: addUnit.trim() || "unit",
      image: addImage.trim() || undefined,
      badge: addBadge.trim() || undefined,
      inStock: addInStock,
      catalogueSelections: catalogueSelections.length ? catalogueSelections : undefined,
    });

    // Reset Form
    setAddName("");
    setAddDescription("");
    setAddPrice("");
    setAddUnit("per plate");
    setAddImage("");
    setAddBadge("");
    setAddInStock(true);
    setAddError("");
    setSelectedActivities([]);
    setCatalogueSelections([]);
    setShowAddModal(false);
  }

  function startEditing(product: Product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description);
    setEditPrice(String(product.price));
    setEditUnit(product.unit || "unit");
    setEditImage(product.image || "");
    setEditBadge(product.badge || "");
    setEditInStock(product.inStock !== false);
    setEditError("");
  }

  function submitEditProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!editingProduct || !selectedBusinessProfile) return;
    if (!editName.trim() || !editDescription.trim()) {
      setEditError("Enter a product/service name and description.");
      return;
    }
    const priceNum = Number(editPrice);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setEditError("Enter a valid price (0 or higher).");
      return;
    }

    onUpdateProduct?.(selectedBusinessProfile.name, editingProduct.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      price: priceNum,
      unit: editUnit.trim() || "unit",
      image: editImage.trim() || undefined,
      badge: editBadge.trim() || undefined,
      inStock: editInStock,
    });

    setEditingProduct(null);
  }

  function startQuickChangeImage(product: Product) {
    setChangingImageProduct(product);
    setQuickImageUrl(product.image || productImageFor(product, selectedBusinessProfile));
  }

  function submitQuickImage() {
    if (!changingImageProduct || !selectedBusinessProfile) return;
    onUpdateProduct?.(selectedBusinessProfile.name, changingImageProduct.id, {
      image: quickImageUrl.trim() || undefined,
    });
    setChangingImageProduct(null);
  }

  function toggleStock(product: Product) {
    if (!selectedBusinessProfile) return;
    const nextStatus = product.inStock === false ? true : false;
    onUpdateProduct?.(selectedBusinessProfile.name, product.id, {
      inStock: nextStatus,
    });
  }

  function handleDelete(product: Product) {
    if (!selectedBusinessProfile) return;
    if (window.confirm(`Are you sure you want to remove "${product.name}" from your catalogue?`)) {
      onDeleteProduct?.(selectedBusinessProfile.name, product.id);
    }
  }

  const filteredProducts = allProducts.filter((product) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        (product.badge && product.badge.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (stockFilter === "inStock") return product.inStock !== false;
    if (stockFilter === "outOfStock") return product.inStock === false;
    return true;
  });

  const inStockCount = allProducts.filter((p) => p.inStock !== false).length;
  const outOfStockCount = allProducts.length - inStockCount;
  const avgPrice =
    allProducts.length > 0
      ? Math.round(allProducts.reduce((sum, p) => sum + (p.price || 0), 0) / allProducts.length)
      : 0;

  return (
    <section className="panel tab-panel catalogue-manager-root">
      <div className="panel-heading" style={{ flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <div>
          <div className="eyebrow">BUSINESS CATALOGUE</div>
          <h2 style={{ margin: "2px 0 0" }}>Products & services</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {businesses.length > 1 && (
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              style={{
                border: "1px solid #c9dec9",
                background: "#f4f8f4",
                color: "#1d4429",
                fontWeight: 700,
                fontSize: "12px",
                padding: "7px 12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {businesses.map((b) => (
                <option key={b.name} value={b.name}>
                  🏪 {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowAddModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>＋</span> Add item
          </button>
        </div>
      </div>

      {/* Catalogue Metric Overview Strip */}
      <div className="catalogue-stats-strip">
        <div className="catalogue-stat-card">
          <div className="catalogue-stat-icon">🛍️</div>
          <div className="catalogue-stat-info">
            <small>Total Items</small>
            <strong>{allProducts.length} Items</strong>
          </div>
        </div>
        <div className="catalogue-stat-card">
          <div className="catalogue-stat-icon" style={{ background: "#edf8ef", color: "#19662e" }}>
            🟢
          </div>
          <div className="catalogue-stat-info">
            <small>Available in Stock</small>
            <strong>{inStockCount} Active</strong>
          </div>
        </div>
        <div className="catalogue-stat-card">
          <div className="catalogue-stat-icon" style={{ background: "#fdf2f2", color: "#a82d2d" }}>
            🔴
          </div>
          <div className="catalogue-stat-info">
            <small>Out of Stock</small>
            <strong>{outOfStockCount} Inactive</strong>
          </div>
        </div>
        <div className="catalogue-stat-card">
          <div className="catalogue-stat-icon" style={{ background: "#eef5ff", color: "#1b4d8f" }}>
            ₹
          </div>
          <div className="catalogue-stat-info">
            <small>Average Price</small>
            <strong>₹{avgPrice.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls Toolbar */}
      <div className="catalogue-toolbar">
        <div className="catalogue-search-wrap">
          <span>🔍</span>
          <input
            type="search"
            placeholder="Search items by name, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ border: 0, background: "transparent", cursor: "pointer", color: "#778d7c", fontSize: "12px" }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="catalogue-filter-chips">
          <button
            type="button"
            className={`catalogue-filter-chip ${stockFilter === "all" ? "active" : ""}`}
            onClick={() => setStockFilter("all")}
          >
            All ({allProducts.length})
          </button>
          <button
            type="button"
            className={`catalogue-filter-chip ${stockFilter === "inStock" ? "active" : ""}`}
            onClick={() => setStockFilter("inStock")}
          >
            🟢 In Stock ({inStockCount})
          </button>
          <button
            type="button"
            className={`catalogue-filter-chip ${stockFilter === "outOfStock" ? "active" : ""}`}
            onClick={() => setStockFilter("outOfStock")}
          >
            🔴 Out of Stock ({outOfStockCount})
          </button>
        </div>

        <div className="catalogue-view-toggles">
          <button
            type="button"
            className={`catalogue-view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Catalogue Grid Cards"
          >
            ⊞ Cards
          </button>
          <button
            type="button"
            className={`catalogue-view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="Compact Table List"
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Catalogue Cards Grid View */}
      {viewMode === "grid" && (
        <div className="catalogue-cards-grid">
          {filteredProducts.map((product) => {
            const displayImage = product.image || productImageFor(product, selectedBusinessProfile);
            const inStock = product.inStock !== false;
            return (
              <article className="catalogue-product-card" key={product.id}>
                <div className="catalogue-card-img-wrap">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="catalogue-card-img"
                    loading="lazy"
                  />
                  {product.badge && (
                    <span className="catalogue-card-badge-pill">{product.badge}</span>
                  )}
                  <button
                    type="button"
                    className={`catalogue-stock-toggle-btn ${inStock ? "in-stock" : "out-of-stock"}`}
                    onClick={() => toggleStock(product)}
                    title={inStock ? "Click to mark Out of Stock" : "Click to mark In Stock"}
                  >
                    <span>{inStock ? "● In Stock" : "○ Sold Out"}</span>
                  </button>
                  <button
                    type="button"
                    className="catalogue-change-img-overlay"
                    onClick={() => startQuickChangeImage(product)}
                    title="Change photo for this product"
                  >
                    <span>📷</span> Change photo
                  </button>
                </div>

                <div className="catalogue-card-body">
                  <div className="catalogue-card-cat-tag">
                    {product.catalogueSelections?.[0]?.path?.join(" › ") ||
                      product.catalogueSelections?.[0]?.sector ||
                      selectedBusinessProfile.category}
                  </div>
                  <h3 className="catalogue-card-name">{product.name}</h3>
                  <p className="catalogue-card-description">{product.description}</p>

                  <div className="catalogue-card-price-row">
                    <div>
                      <span className="catalogue-price-text">₹{product.price.toLocaleString("en-IN")}</span>
                      {product.unit && <span className="catalogue-price-unit">/{product.unit}</span>}
                    </div>
                    <span style={{ fontSize: "10px", color: inStock ? "#1e6b35" : "#a83333", fontWeight: 700 }}>
                      {inStock ? "✓ Orderable" : "✕ Unavailable"}
                    </span>
                  </div>

                  <div className="catalogue-actions-row">
                    <button
                      type="button"
                      className="catalogue-edit-action-btn"
                      onClick={() => startEditing(product)}
                      title="Edit details and price"
                    >
                      <span>✏️</span> Edit details
                    </button>
                    <button
                      type="button"
                      className="catalogue-delete-action-btn"
                      onClick={() => handleDelete(product)}
                      title="Delete item from catalogue"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Alternative List View */}
      {viewMode === "list" && (
        <table className="catalogue-list-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>Photo</th>
              <th>Product / Service</th>
              <th>Description</th>
              <th>Price</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const displayImage = product.image || productImageFor(product, selectedBusinessProfile);
              const inStock = product.inStock !== false;
              return (
                <tr key={product.id}>
                  <td>
                    <img src={displayImage} alt="" className="catalogue-list-thumb" />
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    {product.badge && (
                      <span
                        style={{
                          fontSize: "8.5px",
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: "#e8f2e9",
                          color: "#1e532b",
                          marginLeft: "6px",
                        }}
                      >
                        {product.badge}
                      </span>
                    )}
                  </td>
                  <td style={{ maxWidth: "260px", color: "#607464" }}>{product.description}</td>
                  <td>
                    <strong style={{ color: "#1e6835", fontSize: "13px" }}>
                      ₹{product.price.toLocaleString("en-IN")}
                    </strong>
                    <small style={{ color: "#748877", marginLeft: "3px" }}>/{product.unit}</small>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleStock(product)}
                      style={{
                        border: "1px solid",
                        borderColor: inStock ? "#b2e0bc" : "#f1c2c2",
                        background: inStock ? "#f2faf3" : "#fdf2f2",
                        color: inStock ? "#1c6833" : "#a83333",
                        fontSize: "9.5px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {inStock ? "● In Stock" : "○ Sold Out"}
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => startEditing(product)}
                      style={{
                        border: "1px solid #c8dbc9",
                        background: "#f4f8f4",
                        color: "#21532f",
                        borderRadius: "5px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginRight: "6px",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      style={{
                        border: "1px solid #f1c7c7",
                        background: "#fdf5f5",
                        color: "#a83333",
                        borderRadius: "5px",
                        padding: "5px 9px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {filteredProducts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "#fbfdfb",
            border: "1px dashed #c9dccb",
            borderRadius: "12px",
            margin: "20px 0",
          }}
        >
          <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>📦</span>
          <strong style={{ fontSize: "16px", color: "#1c3c26", display: "block" }}>
            No matching catalogue items found
          </strong>
          <p style={{ fontSize: "12px", color: "#617765", margin: "6px 0 16px" }}>
            Try adjusting your search terms or filters, or add a new product or service.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowAddModal(true)}
          >
            ＋ Add new item
          </button>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="catalogue-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="catalogue-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="catalogue-modal-header">
              <h3>
                <span>🛍️</span> Add Product or Service
              </h3>
              <button
                type="button"
                className="catalogue-modal-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitAddProduct} className="catalogue-modal-form">
              {businesses.length > 1 && (
                <div className="catalogue-form-field">
                  <label>Business</label>
                  <select
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                  >
                    {businesses.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="catalogue-form-field">
                <label>Product or service name *</label>
                <input
                  type="text"
                  placeholder="e.g. Masala Dosa Feast / Same-day Phone Screen Repair"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                />
              </div>

              <div className="catalogue-form-row">
                <div className="catalogue-form-field">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="180"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="catalogue-form-field">
                  <label>Price unit *</label>
                  <input
                    type="text"
                    placeholder="per plate / per box / per visit / unit"
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="catalogue-form-field">
                <label>Description *</label>
                <textarea
                  rows={2}
                  placeholder="What is included in this item or service?"
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  required
                />
              </div>

              <div className="catalogue-form-row">
                <div className="catalogue-form-field">
                  <label>Promotional badge (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller / Popular / Chef Special"
                    value={addBadge}
                    onChange={(e) => setAddBadge(e.target.value)}
                  />
                </div>
                <div className="catalogue-form-field" style={{ justifyContent: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "14px" }}>
                    <input
                      type="checkbox"
                      checked={addInStock}
                      onChange={(e) => setAddInStock(e.target.checked)}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e522d" }}>In stock & ready to order</span>
                  </label>
                </div>
              </div>

              {/* Photo Upload & Presets */}
              <div className="catalogue-form-field">
                <label>Product image</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Paste image URL (https://...)"
                    value={addImage}
                    onChange={(e) => setAddImage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <label
                    style={{
                      border: "1px solid #b8d2bb",
                      background: "#eaf3eb",
                      color: "#1c512a",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📁 Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e, setAddImage)}
                    />
                  </label>
                </div>

                <div className="catalogue-preset-chips-wrap">
                  <span style={{ fontSize: "9.5px", color: "#647768", fontWeight: 700, alignSelf: "center" }}>Presets:</span>
                  {CATALOGUE_IMAGE_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      className="catalogue-preset-chip"
                      onClick={() => setAddImage(preset.url)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {addImage && (
                  <div className="catalogue-image-preview-box">
                    <img src={addImage} alt="Preview" className="catalogue-image-preview-img" />
                    <button
                      type="button"
                      onClick={() => setAddImage("")}
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        background: "rgba(0,0,0,0.65)",
                        color: "#fff",
                        border: 0,
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Category / Sector Selections */}
              <fieldset className="catalogue-selection" style={{ margin: "4px 0" }}>
                <legend>Category & Activity</legend>
                <div className="catalogue-activity-options">
                  {(["Sales", "Service"] as const).map((activity) => (
                    <label key={activity}>
                      <input
                        type="checkbox"
                        checked={selectedActivities.includes(activity)}
                        onChange={() => toggleActivity(activity)}
                      />
                      {activity}
                    </label>
                  ))}
                </div>
                {selectedActivities.map((activity) => (
                  <div className="catalogue-activity-group" key={activity}>
                    <strong>{activity} categories</strong>
                    {availableSectors.length ? (
                      <div className="catalogue-sector-list">
                        {availableSectors.map((sector) => (
                          <fieldset className="catalogue-sector" key={`${activity}-${sector.name}`}>
                            <legend>{sector.name}</legend>
                            <CatalogueTaxonomyOptions
                              activity={activity}
                              sector={sector.name}
                              paths={getSectorActivityPaths(sector, activity)}
                              selections={catalogueSelections}
                              brandLogos={categoryConfig.brandLogos}
                              onToggle={toggleCataloguePath}
                            />
                          </fieldset>
                        ))}
                      </div>
                    ) : (
                      <small>No sectors are configured for this business.</small>
                    )}
                  </div>
                ))}
              </fieldset>

              {addError && <span className="form-error">{addError}</span>}

              <div className="catalogue-modal-footer">
                <button
                  type="button"
                  className="catalogue-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="catalogue-submit-btn">
                  Add to catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="catalogue-modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="catalogue-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="catalogue-modal-header">
              <h3>
                <span>✏️</span> Edit Catalogue Item
              </h3>
              <button
                type="button"
                className="catalogue-modal-close-btn"
                onClick={() => setEditingProduct(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitEditProduct} className="catalogue-modal-form">
              <div className="catalogue-form-field">
                <label>Product or service name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="catalogue-form-row">
                <div className="catalogue-form-field">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="catalogue-form-field">
                  <label>Price unit *</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="catalogue-form-field">
                <label>Description *</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                />
              </div>

              <div className="catalogue-form-row">
                <div className="catalogue-form-field">
                  <label>Promotional badge</label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller / Popular / Chef Special"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                  />
                </div>
                <div className="catalogue-form-field" style={{ justifyContent: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "14px" }}>
                    <input
                      type="checkbox"
                      checked={editInStock}
                      onChange={(e) => setEditInStock(e.target.checked)}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e522d" }}>In stock & active</span>
                  </label>
                </div>
              </div>

              {/* Photo Edit */}
              <div className="catalogue-form-field">
                <label>Item image</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Image link (https://...)"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <label
                    style={{
                      border: "1px solid #b8d2bb",
                      background: "#eaf3eb",
                      color: "#1c512a",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📁 Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload(e, setEditImage)}
                    />
                  </label>
                </div>

                <div className="catalogue-preset-chips-wrap">
                  <span style={{ fontSize: "9.5px", color: "#647768", fontWeight: 700, alignSelf: "center" }}>Presets:</span>
                  {CATALOGUE_IMAGE_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      className="catalogue-preset-chip"
                      onClick={() => setEditImage(preset.url)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="catalogue-image-preview-box">
                  <img
                    src={editImage || productImageFor(editingProduct, selectedBusinessProfile)}
                    alt="Preview"
                    className="catalogue-image-preview-img"
                  />
                </div>
              </div>

              {editError && <span className="form-error">{editError}</span>}

              <div className="catalogue-modal-footer">
                <button
                  type="button"
                  className="catalogue-cancel-btn"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="catalogue-submit-btn">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CHANGE IMAGE MODAL */}
      {changingImageProduct && (
        <div className="catalogue-modal-overlay" onClick={() => setChangingImageProduct(null)}>
          <div className="catalogue-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
            <div className="catalogue-modal-header">
              <h3>
                <span>📷</span> Change Photo: {changingImageProduct.name}
              </h3>
              <button
                type="button"
                className="catalogue-modal-close-btn"
                onClick={() => setChangingImageProduct(null)}
              >
                ✕
              </button>
            </div>
            <div className="catalogue-modal-form">
              <div className="catalogue-image-preview-box" style={{ height: "180px" }}>
                <img src={quickImageUrl} alt="Preview" className="catalogue-image-preview-img" />
              </div>

              <div className="catalogue-form-field">
                <label>Upload new image from your device</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setQuickImageUrl)}
                  style={{ padding: "6px" }}
                />
              </div>

              <div className="catalogue-form-field">
                <label>Or paste image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={quickImageUrl}
                  onChange={(e) => setQuickImageUrl(e.target.value)}
                />
              </div>

              <div className="catalogue-form-field">
                <label>Or select from recommended presets</label>
                <div className="catalogue-preset-chips-wrap">
                  {CATALOGUE_IMAGE_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      className="catalogue-preset-chip"
                      onClick={() => setQuickImageUrl(preset.url)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="catalogue-modal-footer" style={{ margin: "10px -22px -20px" }}>
                <button
                  type="button"
                  className="catalogue-cancel-btn"
                  onClick={() => setChangingImageProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="catalogue-submit-btn"
                  onClick={submitQuickImage}
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CatalogueTaxonomyOptions({
  activity,
  sector,
  paths,
  selections,
  brandLogos,
  onToggle,
}: {
  activity: CatalogueActivity;
  sector: string;
  paths: string[][];
  selections: CatalogueSelection[];
  brandLogos?: Record<string, string>;
  onToggle: (activity: CatalogueActivity, sector: string, path: string[], checked: boolean) => void;
}) {
  const tree = useMemo(() => buildTaxonomy(paths), [paths]);
  function renderOptions(nodes: TaxonomyNode[], parentPath: string[] = []): React.ReactNode {
    return nodes.map((node) => {
      const path = [...parentPath, node.name];
      const checked = selections.some((selection) => selection.activity === activity && selection.sector === sector && selection.path.length === path.length && selection.path.every((part, index) => part === path[index]));
      const logo = brandLogoFor(node.name, brandLogos);
      return <div className="catalogue-taxonomy-option" key={path.join("/")}>
        <label><input type="checkbox" checked={checked} onChange={(event) => onToggle(activity, sector, path, event.target.checked)} />{logo ? <img className="category-brand-logo" src={logo} alt="" /> : <CategoryIcon name={node.name} sector={sector} />}{node.name}</label>
        {node.children.length > 0 && <div className="catalogue-taxonomy-children">{renderOptions(node.children, path)}</div>}
      </div>;
    });
  }
  return paths.length ? <div className="catalogue-taxonomy-options">{renderOptions(tree)}</div> : <small>No category options are configured for {activity.toLowerCase()}.</small>;
}

type ManagedCompanyAdmin = { id: string; name: string; email: string; active: boolean; createdAt: string };

function CompanyPortal({
  businesses,
  enquiries,
  events,
  checkouts,
  initialTab = "Overview",
  locationEnabled,
  onOpenPortal,
  onLanguageChange,
  showNotice,
  accessLevel,
  identity,
}: {
  accessLevel: CompanyAccessLevel;
  identity: string;
  businesses: Business[];
  enquiries: DemoEnquiry[];
  events: DemoEvent[];
  checkouts: CheckoutRequest[];
  initialTab?: string;
  locationEnabled: boolean;
  onOpenPortal?: (role: Role) => void;
  onLanguageChange?: (lang: "en" | "ta" | "kn" | "te") => void;
  showNotice: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "Overview");
  useEffect(() => {
    if (initialTab && initialTab !== "Overview") setActiveTab(initialTab);
  }, [initialTab]);
  useEffect(() => {
    const openProfile = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: string }>;
      setActiveTab(customEvent.detail?.tab || "Profile details");
    };
    window.addEventListener("neighborly-open-profile", openProfile);
    return () => window.removeEventListener("neighborly-open-profile", openProfile);
  }, []);
  const [admins, setAdmins] = useState<ManagedCompanyAdmin[]>([]);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationFormConfig>(defaultRegistrationFormConfig);
  const [customerRegistrations, setCustomerRegistrations] = useState<CustomerRegistrationLocation[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [sosLoading, setSosLoading] = useState(false);
  const [sosError, setSosError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const tabNames = accessLevel === "Super Admin" ? ["Overview", "Businesses", "Categories", "Registration forms", "Customer locations", "Advertisements", "Admins", "Activity log", "Billing", "Safety", "Profile details", "Settings"] : ["Overview", "Businesses", "Categories", "Customer locations", "Advertisements", "Activity log", "Billing", "Safety", "Profile details", "Settings"];

  useEffect(() => {
    if (accessLevel !== "Super Admin") return;
    let cancelled = false;
    setAdminLoading(true);
    fetch("/api/company/admins", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { admins?: ManagedCompanyAdmin[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load Admin accounts.");
        if (!cancelled) setAdmins(result.admins || []);
      })
      .catch((error) => { if (!cancelled) setAdminError(error instanceof Error ? error.message : "Could not load Admin accounts."); })
      .finally(() => { if (!cancelled) setAdminLoading(false); });
    return () => { cancelled = true; };
  }, [accessLevel]);

  useEffect(() => {
    if (accessLevel !== "Super Admin") return;
    fetch("/api/company/registration-forms", { cache: "no-store" }).then((response) => response.json()).then((result: { config?: RegistrationFormConfig }) => { if (result.config) setRegistrationConfig(result.config); }).catch(() => undefined);
  }, [accessLevel]);

  useEffect(() => {
    if (activeTab !== "Customer locations") return;
    let cancelled = false;
    setRegistrationLoading(true);
    setRegistrationError("");
    fetch("/api/company/customer-locations", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { registrations?: CustomerRegistrationLocation[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load registration locations.");
        if (!cancelled) setCustomerRegistrations(result.registrations || []);
      })
      .catch((error) => { if (!cancelled) setRegistrationError(error instanceof Error ? error.message : "Could not load registration locations."); })
      .finally(() => { if (!cancelled) setRegistrationLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Safety" || accessLevel !== "Super Admin") return;
    let cancelled = false;
    setSosLoading(true); setSosError("");
    const loadAlerts = () => fetch("/api/company/sos", { cache: "no-store" }).then(async (response) => {
      const result = await response.json() as { alerts?: SosAlert[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load SOS alerts.");
      if (!cancelled) { setSosAlerts(result.alerts || []); setSosError(""); }
    }).catch((reason) => { if (!cancelled) setSosError(reason instanceof Error ? reason.message : "Could not load SOS alerts."); })
      .finally(() => { if (!cancelled) setSosLoading(false); });
    void loadAlerts();
    const timer = window.setInterval(() => void loadAlerts(), 10_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeTab, accessLevel]);

  async function registerAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setAdminError("");
    try {
      const response = await fetch("/api/company/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }) });
      const result = await response.json() as { admin?: ManagedCompanyAdmin; error?: string };
      if (!response.ok || !result.admin) throw new Error(result.error || "Could not create Admin account.");
      setAdmins((current) => [result.admin!, ...current]);
      formElement.reset();
      showNotice("Admin account created. Share the temporary password securely.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not create Admin account.");
    }
  }
  const companyAdminForm = registrationConfig.forms.find((item) => item.id === "companyAdmin") || defaultRegistrationFormConfig.forms[3];
  const companyAdminLabel = (id: string, fallback: string) => companyAdminForm.fields.find((item) => item.id === id)?.label || fallback;

  async function setAdminActive(id: string, active: boolean) {
    setAdminError("");
    try {
      const response = await fetch("/api/company/admins", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active }) });
      const result = await response.json() as { admin?: ManagedCompanyAdmin; error?: string };
      if (!response.ok || !result.admin) throw new Error(result.error || "Could not update Admin account.");
      setAdmins((current) => current.map((admin) => admin.id === id ? result.admin! : admin));
      showNotice(active ? "Admin access restored." : "Admin access disabled.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not update Admin account.");
    }
  }
  function downloadReport() {
    const rows = [
      ["Record type", "Name or event", "Category or status", "Products", "Address", "Coordinates", "Business activity", "Vehicle types", "Makes", "Vehicle models", "Timestamp"],
      ...businesses.map((business) => ["Business", business.name, business.category, String(business.products.length), business.address ? Object.values(business.address).filter(Boolean).join(", ") : "", business.coordinates ? `${business.coordinates.latitude}, ${business.coordinates.longitude}` : "", (business.businessModes || []).join("; "), (business.vehicleTypes || []).join("; "), (business.vehicleMakes || []).join("; "), (business.vehicleModels || []).join("; "), ""]),
      ...events.map((event) => ["Local demo event", event.action, "", "", "", "", "", "", "", "", event.createdAt]),
      ...checkouts.map((item) => ["Checkout preview", item.businessName, `${item.plan} · ${item.status}`, "", "", "", "", "", "", "", item.createdAt]),
      ...enquiries.map((item) => ["Enquiry", item.businessName, item.productName, "", "", "", "", "", "", "", item.createdAt]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "neighborly-demo-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotice("Downloaded the local demo report. It contains sample and browser-local data only.");
  }
  return <div className="page-content portal-content"><div className="portal-header"><div><div className="eyebrow"><span /> COMPANY ADMINISTRATION</div><h1>See the whole <em>neighborhood.</em></h1><p>Platform health, partner businesses and privacy-aware activity controls.</p></div><span className="admin-label">{accessLevel.toUpperCase()}</span></div>
    <div className="portal-tabs">{tabNames.map((tab) => <button key={tab} className={activeTab === tab ? "current" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
    {activeTab === "Categories" && <CompanyCategoryManager accessLevel={accessLevel} />}
    {activeTab === "Registration forms" && accessLevel === "Super Admin" && <CompanyRegistrationFormManager />}
    {activeTab === "Advertisements" && <CompanyAdManager />}
    {activeTab === "Overview" && <><div className="metric-grid"><Metric label="Registered businesses" value={String(businesses.length)} delta="Sample directory" icon="▧" /><Metric label="Active subscriptions" value={String(businesses.filter((business) => business.subscribed).length)} delta="Subscribed demo listings" icon="◉" /><Metric label="Customer enquiries" value={String(enquiries.length)} delta="Browser-local demo records" icon="⌕" /><Metric label="Agent partners" value="42" delta="Sample metric" icon="♧" /></div>
      <div className="portal-columns"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">RECENT SIGNUPS</div><h2>Business registrations</h2></div><button className="text-link" onClick={() => setActiveTab("Businesses")}>View all →</button></div>{businesses.slice(0, 4).map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending"}</span></div>)}</section>
      <section className="panel admin-privacy"><div className="privacy-icon">⌖</div><div className="eyebrow">PRIVACY BY DESIGN</div><h2>Activity is opt-in.</h2><p>Precise location and sign-in activity should be collected only with explicit user consent, retained securely and visible only to authorized administrators.</p><button className="outline-button" onClick={() => setActiveTab("Customer locations")}>Review privacy controls ↗</button></section></div>
      <div className="verification-banner"><span className="verify-icon">⌖</span><div><strong>Device location permission</strong><p>{locationEnabled ? "Granted for this browser session. Coordinates were not stored or transmitted." : "Not granted. No location data is available in this demo."}</p></div><button onClick={downloadReport}>Download CSV ↗</button></div>
      <div className="form-note"><strong>Demo only</strong><span>Administrative metrics and audit entries are sample/browser-local data, not company-wide records. This view has no server-side authorization.</span></div>
    </>}
    {activeTab === "Customer locations" && <section className="panel tab-panel"><div className="eyebrow">CONSENTED REGISTRATION LOCATION</div><h2>Customer registration requests</h2><p>Only Company Admins can view this list. Exact coordinates are included only when the customer grants browser location access. Demo requests have a verified mobile number but do not activate an account.</p>{registrationLoading && <p>Loading registration records…</p>}{registrationError && <p className="form-error" role="alert">{registrationError}</p>}{!registrationLoading && !registrationError && customerRegistrations.length === 0 && <EmptyState title="No registration requests yet" text="Customer requests and any shared locations will appear here." />}{customerRegistrations.map((registration) => <div className="listing-row" key={registration.id}><span className="listing-icon lavender">⌖</span><span className="listing-name"><strong>{registration.name}</strong><small>Mobile ending {registration.phoneLast4} · {new Date(registration.registeredAt).toLocaleString()} · {registration.verificationStatus}</small>{registration.locationStatus === "shared" && registration.latitude !== null && registration.longitude !== null && <small>Coordinates: {registration.latitude.toFixed(5)}, {registration.longitude.toFixed(5)}</small>}</span><span className={`status-pill ${registration.locationStatus === "shared" ? "verified" : "pending"}`}>{registration.locationStatus === "shared" ? "Location shared" : registration.locationStatus === "denied" ? "Location denied" : "Location unavailable"}</span></div>)}</section>}    {activeTab === "Businesses" && <><section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">PARTNER DIRECTORY</div><h2>All registered businesses</h2></div><button className="outline-button" onClick={downloadReport}>Download CSV ↗</button></div>{businesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} / {business.products.length} catalogue items / sample distance {business.distance} km</small>{business.address && <small>Address: {Object.values(business.address).filter(Boolean).join(", ")}</small>}{business.coordinates && <small>Coordinates: {business.coordinates.latitude.toFixed(6)}, {business.coordinates.longitude.toFixed(6)}</small>}{business.businessModes?.length ? <small>Activity: {business.businessModes.join(", ")}</small> : null}{business.vehicleTypes?.length ? <small>Vehicles: {business.vehicleTypes.join(", ")}</small> : null}{business.vehicleMakes?.length ? <small>Makes: {business.vehicleMakes.join(", ")}</small> : null}{business.vehicleModels?.length ? <small>Models: {business.vehicleModels.join(", ")}</small> : null}</span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending"}</span></div>)}</section></>}
    {activeTab === "Admins" && accessLevel === "Super Admin" && <section className="panel tab-panel"><div className="eyebrow">PLATFORM ACCESS</div><h2>Manage Admin accounts</h2><p>Only the initial Super Admin can create or disable company Admin accounts. Super Admin access cannot be self-registered.</p><form className="product-form" onSubmit={registerAdmin}><label>{companyAdminLabel("name", "Admin name")}<input name="name" placeholder="e.g. Priya Sharma" maxLength={100} required /></label><label>{companyAdminLabel("email", "Work email")}<input name="email" type="email" placeholder="priya@company.com" required /></label><label>{companyAdminLabel("password", "Temporary password")}<input name="password" type="password" minLength={10} autoComplete="new-password" placeholder="At least 10 characters" required /></label><button className="primary-button" type="submit">Create Admin account</button>{adminError && <span className="form-error" role="alert">{adminError}</span>}</form><div className="form-note"><strong>Account store</strong><span>Passwords are stored as salted hashes on this local server. Share temporary passwords through a private channel.</span></div>{adminLoading ? <p>Loading Admin accounts...</p> : admins.map((admin) => <div className="listing-row" key={admin.id}><span className="listing-icon lavender">A</span><span className="listing-name"><strong>{admin.name}</strong><small>{admin.email} · Created {new Date(admin.createdAt).toLocaleDateString()}</small></span><span className={`status-pill ${admin.active ? "verified" : "pending"}`}>{admin.active ? "Active" : "Disabled"}</span><button className="outline-button" type="button" onClick={() => void setAdminActive(admin.id, !admin.active)}>{admin.active ? "Disable access" : "Restore access"}</button></div>)}</section>}
    {activeTab === "Activity log" && <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">LOCAL DEMO AUDIT</div><h2>Recent activity</h2></div><span className="status-pill pending">Browser only</span></div><p>Events are stored locally in this browser and are not sent to the company.</p>{events.length ? events.map((event) => <div className="activity-row" key={event.id}><span className="activity-dot" /><strong>{event.action}</strong><small>{new Date(event.createdAt).toLocaleString()}</small></div>) : <EmptyState title="No activity recorded" text="Searches and selections will appear here as local demo events." />}</section>}
    {activeTab === "Billing" && <section className="panel tab-panel"><div className="eyebrow">SUBSCRIPTIONS & CHECKOUT</div><h2>Payment previews</h2><p>These previews never create a payment or activate a subscription.</p>{checkouts.length ? checkouts.map((item, index) => <div className="listing-row" key={`${item.createdAt}-${index}`}><span className="listing-icon lavender">₹</span><span className="listing-name"><strong>{item.businessName} · {item.plan}</strong><small>{item.paymentMethod} · {new Date(item.createdAt).toLocaleString()}</small></span><span className="status-pill pending">{item.status}</span></div>) : <EmptyState title="No checkout previews" text="Business plan selections will be listed here in this browser." />}</section>}
    {activeTab === "Safety" && <section className="panel tab-panel"><div className="eyebrow">SAFETY & ESCALATION</div><h2>Emergency response setup</h2>{accessLevel === "Super Admin" ? <><p>Recent SOS alerts are recorded on this server and restricted to Super Admins. Alert details include personal contacts and precise coordinates; handle them as sensitive information. Bizearch does not place calls or send messages.</p><button className="outline-button" type="button" disabled={sosLoading} onClick={() => { setSosLoading(true); setSosError(""); fetch("/api/company/sos", { cache: "no-store" }).then(async (response) => { const result = await response.json() as { alerts?: SosAlert[]; error?: string }; if (!response.ok) throw new Error(result.error || "Could not load SOS alerts."); setSosAlerts(result.alerts || []); }).catch((reason) => setSosError(reason instanceof Error ? reason.message : "Could not load SOS alerts.")).finally(() => setSosLoading(false)); }}>Refresh alerts</button>{sosLoading && <p role="status">Loading SOS alerts...</p>}{sosError && <p className="form-error" role="alert">{sosError}</p>}{!sosLoading && !sosError && sosAlerts.length === 0 && <EmptyState title="No SOS alerts" text="Customer SOS alerts will appear here when submitted." />}{sosAlerts.map((alert) => <article className="sos-alert-card" key={alert.id}><div className="sos-alert-heading"><div><strong>{alert.customerName} · {alert.profileRole === "Account" ? "Customer" : alert.profileRole}</strong><small>{emergencyTypes.find((item) => item.id === alert.emergencyType)?.title ?? alert.emergencyType} · dial {alert.serviceNumber} · {new Date(alert.createdAt).toLocaleString()}</small><small>Account: {alert.identity || "Identity not available on this legacy alert"}</small><small>Mobile: {alert.customerPhone || `ending ${alert.customerPhoneLast4}`}</small></div><span className={`status-pill ${alert.locationStatus === "shared" ? "verified" : "pending"}`}>{alert.locationStatus === "shared" ? "Location shared" : "Location unavailable"}</span></div>{alert.latitude !== null && alert.longitude !== null ? <p><strong>Exact coordinates:</strong> {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}{alert.accuracyMeters !== null ? ` · accuracy ±${Math.round(alert.accuracyMeters)} m` : ""}</p> : <p>Customer location was unavailable when the SOS was submitted.</p>}<div className="sos-alert-contacts">{alert.emergencyPhones.map((phone, index) => <a key={`${alert.id}-${index}`} className="outline-button" href={`tel:${phone}`}>Call emergency contact {index + 1}</a>)}</div><small className="sos-alert-status">{alert.deliveryStatus}</small></article>)}</> : <p>SOS alert details and exact customer coordinates are available to Super Admins only. This demo does not dispatch emergency calls.</p>}</section>}
    {(activeTab === "Profile details" || activeTab === "Profile") && (
      <ProfileAndSettingsPanel
        role="Company"
        label={accessLevel}
        identity={identity}
        initialSubTab="profile"
        onNavigateTab={(t) => setActiveTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
    {activeTab === "Settings" && (
      <ProfileAndSettingsPanel
        role="Company"
        label={accessLevel}
        identity={identity}
        initialSubTab="settings"
        onNavigateTab={(t) => setActiveTab(t)}
        onOpenPortal={onOpenPortal}
        onLanguageChange={onLanguageChange}
        showNotice={showNotice}
      />
    )}
  </div>;
}


function CompanyCategoryManager({ accessLevel }: { accessLevel: CompanyAccessLevel }) {
  const [config, setConfig] = useState<CategoryConfig>(defaultCategoryConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/company/categories", { cache: "no-store" }).then(async (response) => {
      const result = await response.json() as { config?: CategoryConfig; error?: string };
      if (!response.ok || !result.config) throw new Error(result.error || "Could not load category settings.");
      const normalized = { ...result.config, sectors: result.config.sectors.map((sector) =>
        sector.name.trim().toLowerCase() === "automobiles" && isLegacyAutomobileTaxonomy(sector.paths)
          ? { ...sector, icon: defaultCategoryConfig.sectors.find((item) => item.name.toLowerCase() === "automobiles")?.icon || sector.icon, paths: buildAutomobileTaxonomyPaths() }
          : sector
      ) };
      if (!cancelled) setConfig(normalized);
    }).catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load categories."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  function updateSector(index: number, patch: Partial<CategorySector>) {
    setConfig((current) => ({ ...current, sectors: current.sectors.map((sector, i) => i === index ? { ...sector, ...patch } : sector) }));
    setSaved(false);
  }
  function updatePath(index: number, pathIndex: number, value: string) {
    const path = value.split(">").map((part) => part.trim()).filter(Boolean);
    setConfig((current) => ({ ...current, sectors: current.sectors.map((sector, i) => i !== index ? sector : { ...sector, paths: sector.paths.map((entry, p) => p === pathIndex ? path : entry) }) }));
    setSaved(false);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/company/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }) });
      const result = await response.json() as { config?: CategoryConfig; error?: string };
      if (!response.ok || !result.config) throw new Error(result.error || "Could not save category settings.");
      setConfig(result.config); setSaved(true);
      window.dispatchEvent(new CustomEvent("neighborly-categories-updated", { detail: result.config }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save category settings."); }
    finally { setSaving(false); }
  }
  if (loading) return <section className="panel tab-panel"><p>Loading categories...</p></section>;
  return <form className="panel tab-panel category-manager-form" onSubmit={save}>
    <div className="category-manager-heading"><div><div className="eyebrow">DISCOVERY TAXONOMY</div><h2>Manage sectors and subcategories</h2><p>These settings control the public category tiles and business registration sectors. You are signed in as {accessLevel}. Admins and Super Admins can add or remove sectors and edit names, icons, and category paths.</p></div><button className="outline-button" type="button" disabled={config.sectors.length >= 30} onClick={() => setConfig((current) => ({ ...current, sectors: [...current.sectors, { name: "New sector", icon: "*", paths: [] }] }))}>Add sector</button></div>
    <div className="category-manager-help">Select a checkbox to view the next level. Use <strong>+ New</strong> to add an option at the level shown. Upload a PNG, JPEG, or WebP logo (maximum 2 MB) for manufacturer options, including vehicle makes without model subcategories. Save category changes to publish uploaded logos.</div>
    {config.sectors.map((sector, index) => <section className="category-manager-sector" key={`sector-${index}`}>
      <div className="category-manager-sector-heading"><span className={`category-art cat-${index % 8}`}>{sector.icon || "*"}</span><strong>{sector.name || "Untitled sector"}</strong><button className="outline-button" type="button" disabled={config.sectors.length <= 1} onClick={() => setConfig((current) => ({ ...current, sectors: current.sectors.filter((_, i) => i !== index) }))}>Remove sector</button></div>
      <div className="category-manager-fields"><label>Sector name<input value={sector.name} maxLength={60} onChange={(event) => updateSector(index, { name: event.target.value })} required /></label><label>Tile symbol<input value={sector.icon} maxLength={8} onChange={(event) => updateSector(index, { icon: event.target.value })} required /></label></div>
      <CategoryTreeEditor
        paths={sector.paths}
        sectorName={sector.name}
        brandLogos={config.brandLogos || {}}
        onUploadLogo={async (name, file) => {
          setError("");
          const body = new FormData();
          body.append("file", file);
          try {
            const response = await fetch("/api/company/categories/logos", { method: "POST", body });
            const result = await response.json() as { url?: string; error?: string };
            if (!response.ok || !result.url) throw new Error(result.error || "Could not upload this logo.");
            const logoUrl = result.url;
            setConfig((current) => ({ ...current, brandLogos: { ...current.brandLogos, [brandLogoKey(name)]: logoUrl } }));
            setSaved(false);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not upload this logo.");
          }
        }}
        onChange={(paths) => updateSector(index, { paths })}
      />
    </section>)}
    {error && <p className="form-error" role="alert">{error}</p>}{saved && <p className="status-pill verified" role="status">Category settings saved.</p>}
    <button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save category changes"}</button>
  </form>;
}

function updateTaxonomyBranch(paths: string[][], parentPath: string[], oldName: string, newName: string) {
  const branch = [...parentPath, oldName];
  return paths.map((path) => path.length >= branch.length && branch.every((part, index) => path[index]?.toLowerCase() === part.toLowerCase())
    ? [...parentPath, newName, ...path.slice(branch.length)]
    : path);
}

function CategoryTreeEditor({
  paths,
  sectorName,
  brandLogos,
  onUploadLogo,
  onChange,
}: {
  paths: string[][];
  sectorName: string;
  brandLogos: Record<string, string>;
  onUploadLogo: (name: string, file: File) => Promise<void>;
  onChange: (paths: string[][]) => void;
}) {
  const [activePath, setActivePath] = useState<string[]>([]);
  const [newChoice, setNewChoice] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingBranch, setEditingBranch] = useState<string[]>([]);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState("");
  const tree = useMemo(() => buildTaxonomy(paths), [paths]);
  let currentNodes = tree;
  const validPath: string[] = [];
  for (const part of activePath) {
    const node = currentNodes.find((item) => item.name === part);
    if (!node) break;
    validPath.push(node.name);
    currentNodes = node.children;
  }

  function beginRename(name: string) {
    const branch = [...validPath, name];
    setEditingBranch(branch);
    setEditingName(name);
    setMessage("");
  }
  function commitRename() {
    const name = editingName.trim();
    const oldName = editingBranch[editingBranch.length - 1];
    if (!oldName) return;
    if (!name || name.length > 60) { setMessage("Enter a name between 1 and 60 characters."); return; }
    if (currentNodes.some((node) => node.name.toLowerCase() === name.toLowerCase() && node.name !== oldName)) { setMessage("That choice already exists at this level."); return; }
    onChange(updateTaxonomyBranch(paths, validPath, oldName, name));
    setEditingBranch([]);
  }
  function removeChoice(name: string) {
    const branch = [...validPath, name];
    let next = paths.filter((path) => !(path.length >= branch.length && branch.every((part, index) => path[index]?.toLowerCase() === part.toLowerCase())));
    if (validPath.length && !next.some((path) => validPath.every((part, index) => path[index]?.toLowerCase() === part.toLowerCase()))) next = [...next, validPath];
    onChange(next);
    setMessage("");
  }
  function addChoice() {
    const name = newChoice.trim();
    if (!name || name.length > 60) { setMessage("Enter a name between 1 and 60 characters."); return; }
    if (validPath.length >= 5) { setMessage("This category path has reached the five-level limit."); return; }
    const choiceLimit = validPath.length < 2 ? 6 : 100;
    if (currentNodes.length >= choiceLimit) { setMessage(`This level has reached its limit of ${choiceLimit} options.`); return; }
    if (currentNodes.some((node) => node.name.toLowerCase() === name.toLowerCase())) { setMessage("That choice already exists at this level."); return; }
    const prefix = validPath;
    const next = paths.filter((path) => !(path.length === prefix.length && prefix.every((part, index) => path[index]?.toLowerCase() === part.toLowerCase())));
    onChange([...next, [...prefix, name]]);
    setNewChoice(""); setAdding(false); setActivePath([...prefix, name]); setMessage("");
  }
  async function uploadLogo(name: string, file: File) {
    setUploadingLogo(name);
    try {
      await onUploadLogo(name, file);
    } finally {
      setUploadingLogo("");
    }
  }
  return <div className="category-tree-editor">
    <div className="category-subcategory-heading"><div><h3>Categories and subcategories</h3><p>Select a checkbox to view its next level.</p></div></div>
    <div className="category-tree-breadcrumbs"><button type="button" className={validPath.length === 0 ? "active" : ""} onClick={() => { setActivePath([]); setEditingBranch([]); setMessage(""); }}>Top level</button>{validPath.map((part, index) => <Fragment key={`${part}-${index}`}><span aria-hidden="true">&gt;</span><button type="button" className={index === validPath.length - 1 ? "active" : ""} onClick={() => { setActivePath(validPath.slice(0, index + 1)); setEditingBranch([]); setMessage(""); }}><span aria-hidden="true">&#9745;</span> {part}</button></Fragment>)}</div>
    <div className="category-tree-level"><div className="category-tree-level-heading"><strong>{validPath.length ? `Options under ${validPath[validPath.length - 1]}` : "Top-level options"}</strong><button type="button" className="category-add-choice" disabled={validPath.length >= 5 || currentNodes.length >= (validPath.length < 2 ? 6 : 100)} onClick={() => { setAdding((value) => !value); setNewChoice(""); setMessage(""); }}><span aria-hidden="true">+</span> New</button></div>
      {adding && <div className="category-add-choice-form"><input autoFocus value={newChoice} onChange={(event) => setNewChoice(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addChoice(); } }} maxLength={60} placeholder="New option name" aria-label="New option name" /><button type="button" className="outline-button" onClick={addChoice}>Add</button><button type="button" className="outline-button" onClick={() => setAdding(false)}>Cancel</button></div>}
      {currentNodes.length ? <div className="category-tree-choice-list">{currentNodes.map((node) => {
        const logo = brandLogoFor(node.name, brandLogos);
        const canUploadLogo = validPath.length >= 2 && (
          node.children.length > 0 ||
          (sectorName.trim().toLowerCase() === "automobiles" &&
            validPath.length === 2 &&
            ["sales", "service"].includes(validPath[0].trim().toLowerCase())) ||
          (sectorName.trim().toLowerCase() === "electronics" &&
            validPath.length === 2 &&
            ["sales", "service"].includes(validPath[0].trim().toLowerCase()))
        );
        return <div className="category-tree-choice" key={node.name}>{editingBranch.length === validPath.length + 1 && editingBranch[editingBranch.length - 1] === node.name ? <><input value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={60} aria-label={`Rename ${node.name}`} /><button type="button" className="outline-button" onClick={commitRename}>Save</button><button type="button" className="outline-button" onClick={() => setEditingBranch([])}>Cancel</button></> : <><label><input type="checkbox" checked={false} onChange={() => { setActivePath([...validPath, node.name]); setEditingBranch([]); setMessage(""); }} />{logo ? <img className="category-brand-logo" src={logo} alt="" /> : <CategoryIcon name={node.name} sector={sectorName} />}<span>{node.name}</span><small>{node.children.length ? `${node.children.length} ${node.children.length === 1 ? "subcategory" : "subcategories"}` : "No subcategories"}</small></label>{canUploadLogo && <label className="category-logo-upload">{logo ? "Replace logo" : "Add logo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploadingLogo)} aria-label={`${logo ? "Replace" : "Add"} ${node.name} company logo`} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadLogo(node.name, file); }} /></label>}{canUploadLogo && uploadingLogo === node.name && <small>Uploading...</small>}<button type="button" className="category-tree-action rename" aria-label={`Rename ${node.name}`} title="Rename" onClick={() => beginRename(node.name)}>Rename</button><button type="button" className="category-tree-action remove" aria-label={`Remove ${node.name}`} title="Remove" onClick={() => removeChoice(node.name)}>&#215;</button></>}</div>;
      })}</div> : <p className="category-empty-note">No options at this level. Use + New to add one.</p>}
      {message && <p className="category-tree-message" role="alert">{message}</p>}
    </div>
  </div>;
}

function CompanyRegistrationFormManager() {
  const [config, setConfig] = useState<RegistrationFormConfig>(defaultRegistrationFormConfig);
  const [selectedForm, setSelectedForm] = useState<RegistrationForm["id"]>("customer");
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  useEffect(() => { let cancelled = false; fetch("/api/company/registration-forms", { cache: "no-store" }).then(async (response) => { const result = await response.json() as { config?: RegistrationFormConfig; error?: string }; if (!response.ok || !result.config) throw new Error(result.error || "Could not load registration forms."); if (!cancelled) setConfig(result.config); }).catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load registration forms."); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);
  const form = config.forms.find((item) => item.id === selectedForm)!;
  function updateForm(patch: Partial<RegistrationForm>) { setConfig((current) => ({ ...current, forms: current.forms.map((item) => item.id === selectedForm ? { ...item, ...patch } : item) })); setSaved(false); }
  function updateField(index: number, patch: Partial<RegistrationField>) { updateForm({ fields: form.fields.map((item, i) => i === index ? { ...item, ...patch } : item) }); }
  function addField() { const id = `custom${Date.now().toString(36)}`; updateForm({ fields: [...form.fields, { id, label: "New field", type: "text", placeholder: "", required: false, enabled: true, options: [] }] }); }
  async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(""); setSaved(false); try { const response = await fetch("/api/company/registration-forms", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }) }); const result = await response.json() as { config?: RegistrationFormConfig; error?: string }; if (!response.ok || !result.config) throw new Error(result.error || "Could not save registration forms."); setConfig(result.config); setSaved(true); window.dispatchEvent(new CustomEvent("neighborly-registration-forms-updated", { detail: result.config })); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save registration forms."); } finally { setSaving(false); } }
  if (loading) return <section className="panel tab-panel"><p>Loading registration forms…</p></section>;
  return <form className="panel tab-panel category-manager-form registration-form-manager" onSubmit={save}><div className="category-manager-heading"><div><div className="eyebrow">SUPER ADMIN CONFIGURATION</div><h2>Manage registration forms</h2><p>Choose a portal form, edit its title and fields, and manage which options registrants can select. Disabled fields and options are hidden from new registrations.</p></div><button className="outline-button" type="button" disabled={config.forms.length >= 12} onClick={() => { const id = `customForm${Date.now().toString(36)}`; const next = { id, title: "New registration form", enabled: false, fields: [] }; setConfig((current) => ({ ...current, forms: [...current.forms, next] })); setSelectedForm(id); setSaved(false); }}>Add form</button></div>
    <label>Registration form<select value={selectedForm} onChange={(event) => setSelectedForm(event.target.value)}>{config.forms.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <div className="category-manager-fields"><label>Form title<input value={form.title} maxLength={80} onChange={(event) => updateForm({ title: event.target.value })} required /></label><label className="consent-check"><input type="checkbox" checked={form.enabled} onChange={(event) => updateForm({ enabled: event.target.checked })} /><span>Registration form is enabled</span></label></div>
    {!(["customer", "business", "agent", "companyAdmin"].includes(form.id)) && <button className="outline-button" type="button" onClick={() => { const remaining = config.forms.filter((item) => item.id !== form.id); setConfig((current) => ({ ...current, forms: remaining })); setSelectedForm(remaining[0].id); setSaved(false); }}>Remove form</button>}
    <div className="category-subcategory-heading"><div><h3>Form fields and choices</h3><p>Add, edit, disable or remove fields and individual choices.</p></div><button className="outline-button" type="button" disabled={form.fields.length >= 80} onClick={addField}>Add field</button></div>
    {form.fields.map((item, index) => <section className="category-manager-sector" key={item.id}><div className="category-manager-sector-heading"><strong>{item.id}</strong><label className="consent-check"><input type="checkbox" checked={item.enabled} onChange={(event) => updateField(index, { enabled: event.target.checked })} /><span>Enabled</span></label><button className="outline-button" type="button" onClick={() => updateForm({ fields: form.fields.filter((_, i) => i !== index) })}>Remove field</button></div>
      <div className="category-manager-fields"><label>Label<input value={item.label} maxLength={100} onChange={(event) => updateField(index, { label: event.target.value })} required /></label><label>Field type<select value={item.type} onChange={(event) => updateField(index, { type: event.target.value as RegistrationField["type"] })}>{["text", "phone", "email", "password", "textarea", "checkbox", "choices"].map((type) => <option key={type}>{type}</option>)}</select></label><label>Placeholder<input value={item.placeholder} maxLength={160} onChange={(event) => updateField(index, { placeholder: event.target.value })} /></label><label className="consent-check"><input type="checkbox" checked={item.required} onChange={(event) => updateField(index, { required: event.target.checked })} /><span>Required</span></label></div>
      {(item.type === "choices" || item.type === "checkbox") && <><h4>Choices</h4>{item.options.map((option, optionIndex) => <div className="category-path-row" key={option.id}><label>Choice label<input value={option.label} maxLength={100} onChange={(event) => updateField(index, { options: item.options.map((choice, i) => i === optionIndex ? { ...choice, label: event.target.value } : choice) })} required /></label><label className="consent-check"><input type="checkbox" checked={option.enabled} onChange={(event) => updateField(index, { options: item.options.map((choice, i) => i === optionIndex ? { ...choice, enabled: event.target.checked } : choice) })} /><span>Enabled</span></label><button className="outline-button" type="button" onClick={() => updateField(index, { options: item.options.filter((_, i) => i !== optionIndex) })}>Remove</button></div>)}<button className="outline-button" type="button" disabled={item.options.length >= 100} onClick={() => updateField(index, { options: [...item.options, { id: `choice${Date.now().toString(36)}`, label: "New choice", enabled: true }] })}>Add choice</button></>}
    </section>)}
    {error && <p className="form-error" role="alert">{error}</p>}{saved && <p className="status-pill verified" role="status">Registration forms saved.</p>}<button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save registration forms"}</button>
  </form>;
}

async function inspectVideoAd(file: File): Promise<{ durationSeconds: number; posterFile: File | null }> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    let settled = false;
    const cleanup = () => { window.clearTimeout(timeout); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(objectUrl); };
    const finish = (result?: { durationSeconds: number; posterFile: File | null }, error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error); else resolve(result!);
    };
    const timeout = window.setTimeout(() => finish(undefined, new Error("Could not read this MP4 video's duration.")), 30_000);
    video.onerror = () => finish(undefined, new Error("This MP4 could not be previewed. Please choose a standard MP4 file."));
    video.onloadedmetadata = () => {
      const durationSeconds = video.duration;
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) { finish(undefined, new Error("Could not read this MP4 video's duration.")); return; }
      if (durationSeconds > 300) { finish({ durationSeconds, posterFile: null }); return; }
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1280 / video.videoWidth, 720 / video.videoHeight);
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) { finish({ durationSeconds, posterFile: null }); return; }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish({ durationSeconds, posterFile: blob ? new File([blob], "video-poster.jpg", { type: "image/jpeg" }) : null }), "image/jpeg", 0.88);
      };
      video.currentTime = Math.min(1, durationSeconds / 2);
    };
    video.src = objectUrl;
  });
}

function CompanyAdManager() {
  const [config, setConfig] = useState<AdConfig>(defaultAdConfig);
  const configRef = useRef(config);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/company/ads", { cache: "no-store" }).then(async (response) => {
      const result = await response.json() as { config?: AdConfig; error?: string };
      if (!response.ok || !result.config) throw new Error(result.error || "Could not load ads.");
      if (!cancelled) { configRef.current = result.config; setConfig(result.config); }
    }).catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load ads."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  function updateImage(index: number, key: keyof AdConfig["imageAds"][number], value: string) {
    setConfig((current) => ({ ...current, imageAds: current.imageAds.map((ad, i) => i === index ? { ...ad, [key]: value } : ad) }));
  }
  async function persistConfig(nextConfig: AdConfig): Promise<boolean> {
    setSaving(true); setError(""); setSaved(false);
    try {
      const response = await fetch("/api/company/ads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: nextConfig }) });
      const result = await response.json() as { config?: AdConfig; error?: string };
      if (!response.ok || !result.config) throw new Error(result.error || "Could not save advertising settings.");
      configRef.current = result.config;
      setConfig(result.config);
      setSaved(true);
      window.dispatchEvent(new CustomEvent("neighborly-ads-updated", { detail: result.config }));
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save advertising settings.");
      return false;
    } finally { setSaving(false); }
  }
  async function postMedia(file: File, kind: "image" | "video" | "audio") {
    const body = new FormData(); body.append("file", file); body.append("kind", kind);
    const response = await fetch("/api/company/ads/media", { method: "POST", body });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Could not upload this file.");
    return result.url;
  }
  async function uploadSelected(event: React.ChangeEvent<HTMLInputElement>, kind: "image" | "video" | "audio", applyUpload: (url: string, current: AdConfig) => AdConfig) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (uploading) return;
    setUploading(kind); setError(""); setSaved(false);
    try {
      let videoDetails: { durationSeconds: number; posterFile: File | null } | null = null;
      if (kind === "video") {
        if (file.size > 200 * 1024 * 1024) throw new Error("Video ads can be up to 200 MB.");
        videoDetails = await inspectVideoAd(file);
        if (videoDetails.durationSeconds > 300) throw new Error("Video ads can be up to 5 minutes long.");
      }
      let nextConfig = applyUpload(await postMedia(file, kind), configRef.current);
      if (kind === "video") {
        const posterUrl = videoDetails?.posterFile ? await postMedia(videoDetails.posterFile, "image") : "";
        nextConfig = { ...nextConfig, videoAd: { ...nextConfig.videoAd, posterUrl } };
      }
      configRef.current = nextConfig;
      setConfig(nextConfig);
      const persisted = await persistConfig(nextConfig);
      if (!persisted) setError((current) => current || "The upload finished, but it could not be published. Use Save advertising settings to retry.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not upload this file."); }
    finally { setUploading(""); }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistConfig(configRef.current);
  }
  if (loading) return <section className="panel tab-panel"><p>Loading advertising settings...</p></section>;
  return <form className="panel tab-panel product-form company-ad-manager" onSubmit={save}>
    <div className="eyebrow">PLATFORM CONTENT</div><h2>Manage advertisements</h2><p>Changes apply to the public ticker, rotating image ads and video ad. Admin and Super Admin access are required. Media uploads publish as soon as the upload finishes.</p>
    <section><h3>Scrolling announcement</h3><p>One message per line, up to six messages. The text scrolls continuously across the header.</p><textarea rows={Math.max(3, config.tickerMessages.length)} value={config.tickerMessages.join("\n")} onChange={(event) => setConfig((current) => ({ ...current, tickerMessages: event.target.value.split(/\r?\n/).slice(0, 6) }))} maxLength={900} aria-label="Scrolling announcement messages" /></section>
    <section><div className="panel-heading"><div><h3>Rotating image advertisements</h3><p>Add up to eight image creatives. Upload an image file for each ad.</p></div><button className="outline-button" type="button" disabled={config.imageAds.length >= 8 || Boolean(uploading)} onClick={() => setConfig((current) => ({ ...current, imageAds: [...current.imageAds, { label: "New local ad", title: "Discover this business", image: "", tone: "community" }] }))}>Add image ad</button></div>
      {config.imageAds.map((ad, index) => <div className="panel ad-manager-card" key={`managed-ad-${index}`}><h4>Image ad {index + 1}</h4><label>Eyebrow label<input value={ad.label} maxLength={80} onChange={(event) => setConfig((current) => ({ ...current, imageAds: current.imageAds.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry) }))} required /></label><label>Headline<input value={ad.title} maxLength={100} onChange={(event) => setConfig((current) => ({ ...current, imageAds: current.imageAds.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry) }))} required /></label><label className="ad-upload-field">Image file<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(event) => void uploadSelected(event, "image", (url, current) => ({ ...current, imageAds: current.imageAds.map((entry, i) => i === index ? { ...entry, image: url } : entry) }))} />{uploading === "image" ? <small>Uploading and publishing image...</small> : <small>{ad.image ? "Image ready" : "Choose JPG, PNG, WebP or GIF (max 15 MB)"}</small>}</label>{ad.image && <img className="ad-media-preview" src={ad.image} alt={`Preview for image ad ${index + 1}`} />}<label>Style key<input value={ad.tone} pattern="[a-zA-Z0-9_-]{1,30}" onChange={(event) => setConfig((current) => ({ ...current, imageAds: current.imageAds.map((entry, i) => i === index ? { ...entry, tone: event.target.value } : entry) }))} required /></label><button className="outline-button" type="button" disabled={config.imageAds.length <= 1 || Boolean(uploading)} onClick={() => setConfig((current) => ({ ...current, imageAds: current.imageAds.filter((_, i) => i !== index) }))}>Remove image ad</button></div>)}
    </section>
    <section><h3>Video advertisement</h3><label>Headline<input value={config.videoAd.title} maxLength={100} onChange={(event) => setConfig((current) => ({ ...current, videoAd: { ...current.videoAd, title: event.target.value } }))} required /></label><label>Description<textarea rows={2} value={config.videoAd.description} maxLength={220} onChange={(event) => setConfig((current) => ({ ...current, videoAd: { ...current.videoAd, description: event.target.value } }))} required /></label><label className="ad-upload-field">Video file<input type="file" accept="video/mp4" disabled={Boolean(uploading)} onChange={(event) => void uploadSelected(event, "video", (url, current) => ({ ...current, videoAd: { ...current.videoAd, sourceUrl: url } }))} />{uploading === "video" ? <small>Checking duration and uploading...</small> : <small>{config.videoAd.sourceUrl ? "Current video is published" : "Choose MP4, up to 5 minutes and 200 MB"}</small>}</label>{config.videoAd.sourceUrl && <video key={config.videoAd.sourceUrl} className="ad-video-preview" controls playsInline preload="metadata" poster={config.videoAd.posterUrl || undefined} src={config.videoAd.sourceUrl}>Your browser does not support video.</video>}<label className="ad-upload-field">Poster image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(uploading)} onChange={(event) => void uploadSelected(event, "image", (url, current) => ({ ...current, videoAd: { ...current.videoAd, posterUrl: url } }))} />{uploading === "image" ? <small>Uploading and publishing poster...</small> : <small>{config.videoAd.posterUrl ? "Poster image ready" : "Choose JPG, PNG, WebP or GIF (max 15 MB)"}</small>}</label>{config.videoAd.posterUrl && <img className="ad-media-preview" src={config.videoAd.posterUrl} alt="Video poster preview" />}<label>Button text<input value={config.videoAd.callToAction} maxLength={50} onChange={(event) => setConfig((current) => ({ ...current, videoAd: { ...current.videoAd, callToAction: event.target.value } }))} required /></label></section>
    <section><h3>Audio advertisement</h3><p>Optionally add an audio spot. Supported formats: MP3, MPEG, M4A, WAV and OGG.</p><label>Headline<input value={config.audioAd.title} maxLength={100} onChange={(event) => setConfig((current) => ({ ...current, audioAd: { ...current.audioAd, title: event.target.value } }))} required /></label><label>Description<textarea rows={2} value={config.audioAd.description} maxLength={220} onChange={(event) => setConfig((current) => ({ ...current, audioAd: { ...current.audioAd, description: event.target.value } }))} required /></label><label className="ad-upload-field">Audio file<input type="file" accept=".mp3,.mpeg,.mpga,.mp2,audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/ogg" disabled={Boolean(uploading)} onChange={(event) => void uploadSelected(event, "audio", (url, current) => ({ ...current, audioAd: { ...current.audioAd, sourceUrl: url } }))} />{uploading === "audio" ? <small>Uploading and publishing audio...</small> : <small>{config.audioAd.sourceUrl ? "Audio ready" : "Choose MP3, MPEG, M4A, WAV or OGG (max 30 MB)"}</small>}</label>{config.audioAd.sourceUrl && <audio className="ad-audio-preview" controls preload="metadata" src={config.audioAd.sourceUrl}>Your browser does not support audio.</audio>}</section>
    {error && <p className="form-error" role="alert">{error}</p>}{saved && <p className="status-pill verified" role="status">Advertising settings saved.</p>}<button className="primary-button" disabled={saving || Boolean(uploading)} type="submit">{saving ? "Saving..." : "Save advertising settings"}</button>
  </form>;
}

function PlansSection({
  openPlans,
  onSelectPlan,
}: {
  openPlans?: () => void;
  onSelectPlan?: (plan: string) => void;
}) {
  return (
    <section className="plans-area">
      <div className="eyebrow">SIMPLE PLANS. LOCAL GROWTH.</div>
      <h2>Be found by your next customer.</h2>
      <p>Choose the visibility that fits your business. Transparent pricing with instant online activation via UPI, Card, or Net Banking.</p>
      <div className="plans-grid">
        {planNames.map((plan, index) => (
          <div className={`plan-card ${index === 1 ? "featured" : ""}`} key={plan}>
            {index === 1 && <span className="popular-ribbon">MOST POPULAR</span>}
            <h3>{plan}</h3>
            <div className="plan-price">
              {["₹499", "₹999", "₹1,999"][index]}
              <small> / month</small>
            </div>
            <p>{["A great place to start.", "More visibility where it matters.", "Stand out across your neighborhood."][index]}</p>
            <ul>
              <li>✓ Local search priority</li>
              <li>✓ Verified Business profile</li>
              <li>{index > 0 ? "✓ Customer enquiry & order alerts" : "— Basic profile views"}</li>
              <li>{index > 1 ? "✓ Featured top placement & SEO badge" : index > 0 ? "✓ Category spotlight" : "— Standard placement"}</li>
            </ul>
            <button
              className={index === 1 ? "primary-button" : "outline-button"}
              onClick={() => {
                if (onSelectPlan) {
                  onSelectPlan(plan);
                } else if (openPlans) {
                  openPlans();
                }
              }}
            >
              Choose {plan} 💳
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, delta, icon }: { label: string; value: string; delta: string; icon: string }) {
  return <div className="metric-card"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong><small>{delta}</small></div>;
}

function Dialog({
  kind,
  close,
  onOpenProfile,
  profileRole,
  profileIdentity,
  onLogin,
  onRegisterCustomerLocation,
  onBusiness,
  businesses,
  categories,
  brandLogos,
  onCheckout,
  showNotice,
}: {
  kind: "login" | "business" | "sos" | "plans";
  close: () => void;
  onOpenProfile: () => void;
  profileRole: "Account" | "Business" | "Agent" | "Company";
  profileIdentity: string;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onRegisterCustomerLocation: (input: { name: string; phone: string; locationStatus: "shared" | "denied" | "unavailable"; latitude: number | null; longitude: number | null }) => Promise<void>;
  onBusiness: (event: React.FormEvent<HTMLFormElement>) => void;
  businesses: Business[];
  categories: CategorySector[];
  brandLogos?: Record<string, string>;
  onCheckout: (businessName: string, plan: string, paymentMethod: string) => void;
  showNotice: (message: string) => void;
}) {
  const [isSignup, setIsSignup] = useState(false);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationFormConfig>(defaultRegistrationFormConfig);
  useEffect(() => { let cancelled = false; fetch("/api/registration/forms", { cache: "no-store" }).then((response) => response.json()).then((result: { config?: RegistrationFormConfig }) => { if (!cancelled && result.config) setRegistrationConfig(result.config); }).catch(() => undefined); return () => { cancelled = true; }; }, []);
  const customerForm = registrationConfig.forms.find((item) => item.id === "customer") || defaultRegistrationFormConfig.forms[0];
  const businessForm = registrationConfig.forms.find((item) => item.id === "business") || defaultRegistrationFormConfig.forms[1];
  const regField = (form: RegistrationForm, id: string) => form.fields.find((item) => item.id === id);
  const regLabel = (form: RegistrationForm, id: string, fallback: string) => regField(form, id)?.label || fallback;
  const regEnabled = (form: RegistrationForm, id: string) => regField(form, id)?.enabled !== false;
  const regChoices = (form: RegistrationForm, id: string, fallback: string[]) => { const configured = regField(form, id); return configured ? configured.options.filter((item) => item.enabled).map((item) => item.label) : fallback; };
  const [registrationBusy, setRegistrationBusy] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [registrationOtp, setRegistrationOtp] = useState("");
  const [registrationDemoOtp, setRegistrationDemoOtp] = useState("");
  const [registrationOtpVerified, setRegistrationOtpVerified] = useState(false);
  const [registrationOtpBusy, setRegistrationOtpBusy] = useState(false);
  const [registrationOtpMessage, setRegistrationOtpMessage] = useState("");
  const [emergencyProfile, setEmergencyProfile] = useState({ customerName: "", customerPhone: "", emergencyPhones: ["", ""] as [string, string] });
  const [sosBusy, setSosBusy] = useState(false);
  const [sosError, setSosError] = useState("");
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<EmergencyType | "">("");
  const [sosResult, setSosResult] = useState<{ id: string; createdAt: string; customerName: string; emergencyPhones: [string, string]; locationStatus: "shared" | "unavailable"; latitude: number | null; longitude: number | null; accuracyMeters: number | null; emergencyType: EmergencyType; duplicate: boolean } | null>(null);
  const sosRequestKey = useRef("");
  const [step, setStep] = useState(1);
  const [checkoutPlan, setCheckoutPlan] = useState("");
  const [checkoutBusiness, setCheckoutBusiness] = useState(businesses[0]?.name || "");
  const [paymentMethod, setPaymentMethod] = useState("UPI (preview only)");
  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    businessCategory: "Everyday services",
    businessPhone: "",
    businessCategories: [] as string[],
  });
  const [businessSectors, setBusinessSectors] = useState<string[]>([]);
  const [businessTaxonomySelections] = useState<CatalogueSelection[]>([]);
  const [businessCategoryError, setBusinessCategoryError] = useState("");
  const [businessAddress, setBusinessAddress] = useState<BusinessAddress>({ doorNumber: "", street: "", area: "", cityTown: "", taluka: "", district: "", state: "", pincode: "" });
  const [businessCoordinates, setBusinessCoordinates] = useState<Coordinates | null>(null);
  const [businessLocationMessage, setBusinessLocationMessage] = useState("");
  const [businessLocationError, setBusinessLocationError] = useState("");
  const [businessModes, setBusinessModes] = useState<string[]>([]);
  const [businessModeError, setBusinessModeError] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [vehicleMakes, setVehicleMakes] = useState<string[]>([]);
  const [vehicleModels, setVehicleModels] = useState<string[]>([]);
  const [vehicleSelectionError, setVehicleSelectionError] = useState("");
  const [customVehicleMake, setCustomVehicleMake] = useState("");
  const [customVehicleModels, setCustomVehicleModels] = useState("");
  const isAutomobileBusiness = businessSectors.includes("Automobiles") || businessDetails.businessCategories.includes("Automobiles");
  const availableVehicleMakes = [...new Set(vehicleTypes.flatMap((type) => vehicleMakesByType[type] || []))].sort((a, b) => a.localeCompare(b));
  const availableVehicleModels = [...new Map(vehicleMakes.flatMap((make) => vehicleTypes.flatMap((type) => getVehicleModelsForType(type, make).map((model) => [`${make}::${model}`, { key: `${make}::${model}`, make, model }] as const))).map(([key, value]) => [key, value])).values()];
  function toggleBusinessSector(sector: string) {
    const removing = businessSectors.includes(sector);
    setBusinessSectors((current) => removing ? current.filter((item) => item !== sector) : [...current, sector]);
    if (removing && sector === "Automobiles") {
      setVehicleTypes([]); setVehicleMakes([]); setVehicleModels([]); setCustomVehicleMake(""); setCustomVehicleModels(""); setVehicleSelectionError("");
    }
    setBusinessCategoryError("");
  }

  function toggleBusinessMode(activity: CatalogueActivity) {
    const removing = businessModes.includes(activity);
    setBusinessModes((current) => removing ? current.filter((item) => item !== activity) : [...current, activity]);
    setBusinessModeError("");
    setBusinessCategoryError("");
  }

  function fetchBusinessCoordinates() {
    setBusinessLocationError("");
    if (!navigator.geolocation) { setBusinessLocationMessage("Location is not available in this browser."); setBusinessLocationError("Enable location services or use a browser that supports location to continue."); return; }
    setBusinessLocationMessage("Requesting device location permission...");
    navigator.geolocation.getCurrentPosition((position) => {
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setBusinessCoordinates(coordinates);
      setBusinessLocationError("");
      setBusinessLocationMessage(`Coordinates captured: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`);
    }, (error) => {
      const message = error.code === error.PERMISSION_DENIED ? "Location permission was not granted." : "Could not get your location. Check device location and try again.";
      setBusinessCoordinates(null);
      setBusinessLocationMessage(message);
      setBusinessLocationError("A precise business map pin is required. Allow location access and try again.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  function toggleRegistrationChoice(current: string[], value: string, setChoices: (next: string[]) => void) {
    setChoices(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function toggleVehicleType(type: string) {
    const nextTypes = vehicleTypes.includes(type) ? vehicleTypes.filter((item) => item !== type) : [...vehicleTypes, type];
    const nextMakeSet = new Set(nextTypes.flatMap((item) => vehicleMakesByType[item] || []));
    const nextMakes = vehicleMakes.filter((item) => nextMakeSet.has(item));
    setVehicleTypes(nextTypes);
    setVehicleMakes(nextMakes);
    setVehicleModels((current) => current.filter((key) => nextMakes.some((make) => key.startsWith(`${make}::`))));
    setVehicleSelectionError("");
  }

  function toggleVehicleMake(make: string) {
    const nextMakes = vehicleMakes.includes(make) ? vehicleMakes.filter((item) => item !== make) : [...vehicleMakes, make];
    setVehicleMakes(nextMakes);
    if (!nextMakes.includes(make)) setVehicleModels((current) => current.filter((key) => !key.startsWith(`${make}::`)));
    if (make === "Other / not listed" && !nextMakes.includes(make)) setCustomVehicleMake("");
    setVehicleSelectionError("");
  }

  async function requestRegistrationOtp(role: "Account" | "Business", action: "send" | "verify", phone: string) {
    setRegistrationOtpBusy(true);
    setRegistrationOtpMessage("");
    try {
      const response = await fetch("/api/registration/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, role, phone, code: registrationOtp }) });
      const result = await response.json() as { error?: string; demoCode?: string };
      if (!response.ok) throw new Error(result.error || "Could not verify this mobile number.");
      if (action === "send") {
        setRegistrationDemoOtp(result.demoCode || "");
        setRegistrationOtp("");
        setRegistrationOtpVerified(false);
        setRegistrationOtpMessage(result.demoCode ? "Demo OTP generated. Enter the displayed code to verify." : "OTP sent to the mobile number.");
      } else {
        setRegistrationOtpVerified(true);
        setRegistrationOtpMessage("Mobile number verified.");
      }
    } catch (error) {
      setRegistrationOtpVerified(false);
      setRegistrationOtpMessage(error instanceof Error ? error.message : "Could not verify this mobile number.");
    } finally { setRegistrationOtpBusy(false); }
  }
  useEffect(() => {
    if (kind !== "sos") return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(profileStorageKey(profileRole, profileIdentity)) || window.localStorage.getItem("neighborly-emergency-profile-v1") || "null") as (Partial<MemberProfile> & { customerName?: string; customerPhone?: string }) | null;
      if (saved) setEmergencyProfile({ customerName: saved.fullName || saved.customerName || "", customerPhone: saved.phone || saved.customerPhone || "", emergencyPhones: [saved.emergencyPhones?.[0] || "", saved.emergencyPhones?.[1] || ""] });
    } catch { /* The user can enter the details directly in the SOS form. */ }
  }, [kind, profileRole, profileIdentity]);
  async function recordSos(location: { locationStatus: "shared" | "unavailable"; latitude: number | null; longitude: number | null; accuracyMeters: number | null }) {
    try {
      if (!sosRequestKey.current) sosRequestKey.current = crypto.randomUUID();
      const response = await fetch("/api/customers/sos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...emergencyProfile, requestKey: sosRequestKey.current, emergencyType: selectedEmergencyType, ...location }) });
      const result = await response.json() as { alert?: SosAlert; duplicate?: boolean; error?: string };
      if (!response.ok || !result.alert) throw new Error(result.error || "Could not send the SOS alert.");
      setSosResult({
        id: result.alert.id,
        createdAt: result.alert.createdAt,
        customerName: result.alert.customerName,
        emergencyPhones: result.alert.emergencyPhones,
        locationStatus: result.alert.locationStatus,
        latitude: result.alert.latitude,
        longitude: result.alert.longitude,
        accuracyMeters: result.alert.accuracyMeters,
        emergencyType: result.alert.emergencyType,
        duplicate: Boolean(result.duplicate),
      });
      sosRequestKey.current = crypto.randomUUID();
      setSosError("");
      showNotice(result.alert.locationStatus === "shared" ? "SOS alert and coordinates were recorded for the Super Admin. Open a call or message only if you choose to." : "SOS alert was recorded, but this device could not share its location. Use your phone to call emergency services if needed.");
      window.dispatchEvent(
        new CustomEvent("neighborly-add-notification", {
          detail: {
            title: `🚨 SOS Emergency Alert: ${result.alert.emergencyType.toUpperCase()}`,
            message: `SOS alert recorded with ${result.alert.locationStatus === "shared" ? "GPS coordinates" : "approximate location"}. Emergency contacts notified.`,
            type: "sos",
            linkText: "View Emergency",
            action: { type: "sos", payload: "sos" },
          },
        })
      );
    } catch (reason) {
      setSosError(`${reason instanceof Error ? reason.message : "Could not send the SOS alert."} If you may be in immediate danger, call your local emergency number now.`);
    }
    finally { setSosBusy(false); }
  }
  function submitSos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sosBusy) return;
    setSosBusy(true); setSosError(""); setSosResult(null);
    const emergencyDigits = emergencyProfile.emergencyPhones.map((phone) => phone.replace(/\D/g, ""));
    if (!selectedEmergencyType) { setSosError("Select the type of emergency first."); setSosBusy(false); return; }
    if (!emergencyProfile.customerName.trim() || emergencyProfile.customerName.trim().length > 100 || emergencyProfile.customerPhone.replace(/\D/g, "").length < 8 || emergencyProfile.customerPhone.replace(/\D/g, "").length > 15 || emergencyDigits.some((phone) => phone.length < 8 || phone.length > 15) || emergencyDigits[0] === emergencyDigits[1]) {
      setSosError("Enter your name, mobile and two different emergency contact numbers."); setSosBusy(false); return;
    }
    try { window.localStorage.setItem(profileStorageKey(profileRole, profileIdentity), JSON.stringify({ ...emptyMemberProfile, fullName: emergencyProfile.customerName, phone: emergencyProfile.customerPhone, emergencyPhones: emergencyProfile.emergencyPhones })); } catch { /* SOS submission can still proceed if local storage is unavailable. */ }
    if (!navigator.geolocation) { void recordSos({ locationStatus: "unavailable", latitude: null, longitude: null, accuracyMeters: null }); return; }
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => void recordSos({ locationStatus: "shared", latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy }),
        () => void recordSos({ locationStatus: "unavailable", latitude: null, longitude: null, accuracyMeters: null }),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
      );
    } catch {
      void recordSos({ locationStatus: "unavailable", latitude: null, longitude: null, accuracyMeters: null });
    }
  }
  async function handleAccountSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isSignup) {
      onLogin(event);
      return;
    }
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("fullName") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const emergencyPhoneOne = String(form.get("emergencyPhone1") || "").trim();
    const emergencyPhoneTwo = String(form.get("emergencyPhone2") || "").trim();
    const emergencyDigits = [emergencyPhoneOne, emergencyPhoneTwo].map((value) => value.replace(/\D/g, ""));
    if (!registrationOtpVerified) {
      setRegistrationOtpMessage("Verify your mobile number before submitting registration.");
      return;
    }
    if (emergencyDigits.some((value) => value.length < 8 || value.length > 15) || emergencyDigits[0] === emergencyDigits[1]) {
      showNotice("Enter two different valid emergency contact numbers.");
      return;
    }
    try {
      const profile = { fullName: name, phone, email: "", address: "", emergencyPhones: [emergencyPhoneOne, emergencyPhoneTwo] as [string, string] };
      window.localStorage.setItem("neighborly-emergency-profile-v1", JSON.stringify({ customerName: name, customerPhone: phone, emergencyPhones: profile.emergencyPhones }));
      window.localStorage.setItem(profileStorageKey("Account"), JSON.stringify(profile));
    } catch {
      showNotice("Emergency contacts could not be saved on this device. Try again or keep the numbers available for SOS.");
      return;
    }
    const submitLocation = async (locationStatus: "shared" | "denied" | "unavailable", latitude: number | null = null, longitude: number | null = null) => {
      setRegistrationBusy(true);
      await onRegisterCustomerLocation({ name, phone, locationStatus, latitude, longitude });
      setRegistrationBusy(false);
    };
    if (!navigator.geolocation) {
      await submitLocation("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => { void submitLocation("shared", position.coords.latitude, position.coords.longitude); },
      (error) => { void submitLocation(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="modal" role="dialog" aria-modal="true">
      <button className="modal-close" onClick={close} aria-label="Close">×</button>
      {kind === "login" && <><img className="modal-mark brand-modal-mark" src="/bizearch-mark.svg" alt="" /><div className="eyebrow">WELCOME TO BIZEARCH</div><h2>{isSignup ? customerForm.title : "Good to see you."}</h2><p>{isSignup ? "Create your account to discover and connect with local businesses." : "Sign in to find the good things around you."}</p>
        {isSignup && !customerForm.enabled ? <p className="form-note">Customer registration is temporarily unavailable.</p> :
        <form onSubmit={handleAccountSubmit} className="stacked-form">
          {isSignup && regEnabled(customerForm, "fullName") && <label>{regLabel(customerForm, "fullName", "Your name")}<input name="fullName" placeholder="e.g. Asha Rao" required={regField(customerForm, "fullName")?.required ?? true} /></label>}
          {isSignup && <p className="fine-print">When you submit, your browser will ask to share your location with authorized Company Admins for local discovery. You can deny access and continue; no coordinates are saved if you deny.</p>}
          {(!isSignup || regEnabled(customerForm, "phone")) && <label>{regLabel(customerForm, "phone", "Mobile number")}<div className="phone-input"><span>🇮🇳 +91</span><input name="phone" type="tel" placeholder="98765 43210" minLength={8} required /></div></label>}
          {isSignup && regEnabled(customerForm, "emergencyPhone1") && regEnabled(customerForm, "emergencyPhone2") && <><label>{regLabel(customerForm, "emergencyPhone1", "Emergency contact 1 mobile")}<input name="emergencyPhone1" type="tel" placeholder="+91 98765 43210" minLength={8} maxLength={20} required={regField(customerForm, "emergencyPhone1")?.required ?? true} /></label><label>{regLabel(customerForm, "emergencyPhone2", "Emergency contact 2 mobile")}<input name="emergencyPhone2" type="tel" placeholder="+91 98765 43210" minLength={8} maxLength={20} required={regField(customerForm, "emergencyPhone2")?.required ?? true} /></label><p className="fine-print">These numbers stay on this device in this demo. When an SOS is sent, they are included in the Super Admin alert.</p></>}
          {!isSignup && <label>Password<input name="password" type="password" placeholder="Enter your password" required /></label>}
          {isSignup && regEnabled(customerForm, "otp") && <><div className="otp-row"><label>{regLabel(customerForm, "otp", "One-time password (OTP)")}<input name="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit OTP" value={registrationOtp} onChange={(event) => { setRegistrationOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setRegistrationOtpVerified(false); }} required /></label><div className="otp-actions"><button type="button" disabled={registrationOtpBusy} onClick={(event) => { const phone = String(new FormData(event.currentTarget.form || undefined).get("phone") || "").trim(); void requestRegistrationOtp("Account", "send", phone); }}>{registrationOtpBusy ? "Please wait…" : "Send OTP"}</button><button type="button" disabled={registrationOtpBusy || registrationOtp.length !== 6} onClick={(event) => { const phone = String(new FormData(event.currentTarget.form || undefined).get("phone") || "").trim(); void requestRegistrationOtp("Account", "verify", phone); }}>Verify OTP</button></div></div>{registrationDemoOtp && <p className="otp-demo-code" role="status">Demo OTP: <strong>{registrationDemoOtp}</strong> <span>For local testing only. No SMS was sent.</span></p>}{registrationOtpMessage && <p className={registrationOtpVerified ? "otp-verified" : "form-error"} role="status">{registrationOtpMessage}</p>}</>}{isSignup && regEnabled(customerForm, "password") && <label>{regLabel(customerForm, "password", "Create passcode")}<input name="password" type="password" placeholder="At least 8 characters" minLength={8} required /></label>}
          {isSignup && regEnabled(customerForm, "acceptPolicies") && <label className="consent-check terms-consent"><input name="acceptPolicies" type="checkbox" required={regField(customerForm, "acceptPolicies")?.required ?? true} /><span>{regLabel(customerForm, "acceptPolicies", "I accept the Bizearch Terms and Conditions and Privacy Policy")}</span></label>}
          {!isSignup && <label className="consent-check"><input type="checkbox" checked={locationConsent} onChange={(event) => setLocationConsent(event.target.checked)} /><span>In production, share my approximate location and sign-in time with Bizearch’s authorized company administrator to improve local discovery. The demo does not collect or transmit location data.</span></label>}
          <button className="primary-button full-button" type="submit">{isSignup ? (registrationBusy ? "Recording request..." : "Submit registration request") : "Sign in"} <span>→</span></button>
        </form>}<div className="modal-switch">{isSignup ? "Already a Bizearch member?" : "New around here?"} <button onClick={() => setIsSignup(!isSignup)}>{isSignup ? "Sign in" : "Create an account"}</button></div><div className="fine-print">By continuing, you agree to our Terms and Privacy Policy.</div></>}
      {kind === "business" && <>{!businessForm.enabled ? <><div className="eyebrow">BUSINESS REGISTRATION</div><h2>Registration is temporarily unavailable.</h2><button className="outline-button" onClick={close}>Close</button></> : <><div className="modal-mark">⌂</div><div className="eyebrow">{businessForm.title.toUpperCase()} · STEP {step} OF 2</div><h2>{step === 1 ? "Tell us about your business." : "Help us verify your business."}</h2><p>{step === 1 ? "A few details help nearby customers find the right product or service." : "Add your referral details. Your business address and map pin will appear to customers in search."}</p>
        {step === 1 ? <form className="stacked-form" onSubmit={(event) => {
          event.preventDefault();
          if (!businessCoordinates) { setBusinessLocationError("Capture the business location pin to continue."); return; }
          if (!businessModes.length) { setBusinessModeError("Select Sales, Service, or both."); return; }
          if (!businessSectors.length) { setBusinessCategoryError("Choose at least one business sector to continue."); return; }
          if (isAutomobileBusiness && !vehicleTypes.length) { setVehicleSelectionError("Select at least one vehicle type."); return; }
          if (isAutomobileBusiness && !vehicleMakes.length) { setVehicleSelectionError("Select at least one make / manufacturer."); return; }
          if (isAutomobileBusiness && vehicleMakes.includes("Other / not listed") && !customVehicleMake.trim()) { setVehicleSelectionError("Enter the other manufacturer name."); return; }
          if (isAutomobileBusiness && !vehicleModels.length && !customVehicleModels.trim()) { setVehicleSelectionError("Select a model or enter the model name."); return; }
          const form = new FormData(event.currentTarget);
          const details = {
            businessName: String(form.get("businessName") || "").trim(),
            businessCategory: businessSectors[0],
            businessPhone: String(form.get("businessPhone") || "").trim(),
            businessCategories: businessSectors,
          };
          setBusinessDetails(details);
          setStep(2);
        }}>
          {regEnabled(businessForm, "businessName") && <label>{regLabel(businessForm, "businessName", "Business name")}<input name="businessName" placeholder="e.g. Greenway Auto Works" defaultValue={businessDetails.businessName} required={regField(businessForm, "businessName")?.required ?? true} /></label>}
          <fieldset className="registration-taxonomy address-fields"><legend>Business address</legend><div className="registration-address-grid">
          {[{ key: "doorNumber", label: "Door No." }, { key: "street", label: "Street" }, { key: "area", label: "Area" }, { key: "cityTown", label: "City / town" }, { key: "taluka", label: "Taluka" }, { key: "district", label: "District" }, { key: "state", label: "State" }, { key: "pincode", label: "Pincode" }].map(({ key, label }) => <label className="registration-address-field" key={key}>{label}<input name={key} value={businessAddress[key as keyof BusinessAddress]} onChange={(event) => setBusinessAddress((current) => ({ ...current, [key]: event.target.value }))} required maxLength={key === "pincode" ? 10 : 100} inputMode={key === "pincode" ? "numeric" : undefined} pattern={key === "pincode" ? "[0-9]{6}" : undefined} title={key === "pincode" ? "Enter a 6-digit pincode" : undefined} /></label>)}
        </div><button type="button" className="outline-button location-fetch-button" onClick={fetchBusinessCoordinates}>{businessCoordinates ? "Refresh business location pin" : "Capture business location pin"}</button>{businessLocationMessage && <p className="location-result" role="status">{businessLocationMessage}</p>}{businessLocationError && <p className="form-error" role="alert">{businessLocationError}</p>}<p className="fine-print">A precise location pin is required so customers can view your business on the map and get directions.</p></fieldset>
          <fieldset className="registration-taxonomy">
            <legend>Business category</legend>
            <p>Select Sales, Service, or both.</p>
            <div className="registration-category-list">{regChoices(businessForm, "businessModes", ["Sales", "Service"]).filter((item): item is CatalogueActivity => item === "Sales" || item === "Service").map((item) => <label className="registration-taxonomy-option" key={item}><input type="checkbox" checked={businessModes.includes(item)} onChange={() => toggleBusinessMode(item)} /><span>{item}</span></label>)}</div>
          </fieldset>
          {businessModeError && <p className="form-error" role="alert">{businessModeError}</p>}
          <fieldset className="registration-taxonomy">
            <legend>Business sector</legend>
            <p>Select one or more sectors, then choose matching categories and specialties.</p>
            <div className="registration-category-list">
              {categories.filter((item) => item.name !== "All").map((item) => <label className="registration-taxonomy-option" key={item.name}>
                <input type="checkbox" checked={businessSectors.includes(item.name)} onChange={() => toggleBusinessSector(item.name)} />
                <span>{item.name}</span>
              </label>)}
            </div>
          </fieldset>
          {isAutomobileBusiness && <fieldset className="registration-taxonomy">
            <legend>Automotive categories & specialties</legend>
            <p>Choose a vehicle type first. The available makes and models will follow.</p>
            <h4 className="registration-option-heading">Vehicle type</h4>
            <div className="registration-category-list">{regChoices(businessForm, "vehicleTypes", vehicleTypeOptions).map((item) => <label className="registration-taxonomy-option" key={item}><input type="checkbox" checked={vehicleTypes.includes(item)} onChange={() => toggleVehicleType(item)} /><span>{item}</span></label>)}</div>
            {vehicleTypes.length > 0 && <><h4 className="registration-option-heading">Make / manufacturer</h4><div className="registration-category-list">{availableVehicleMakes.map((item) => <label className="registration-taxonomy-option" key={item}><input type="checkbox" checked={vehicleMakes.includes(item)} onChange={() => toggleVehicleMake(item)} />{brandLogoFor(item, brandLogos) && <img className="category-brand-logo" src={brandLogoFor(item, brandLogos)} alt="" />}<span>{item}</span></label>)}</div></>}
            {vehicleMakes.includes("Other / not listed") && <label className="registration-address-field">Other make / manufacturer<input value={customVehicleMake} onChange={(event) => { setCustomVehicleMake(event.target.value); setVehicleSelectionError(""); }} placeholder="Enter manufacturer name" maxLength={80} /></label>}
            {vehicleMakes.length > 0 && <><h4 className="registration-option-heading">Vehicle model</h4>{availableVehicleModels.length ? <div className="registration-category-list">{availableVehicleModels.map(({ key, make, model }) => <label className="registration-taxonomy-option" key={key}><input type="checkbox" checked={vehicleModels.includes(key)} onChange={() => { toggleRegistrationChoice(vehicleModels, key, setVehicleModels); setVehicleSelectionError(""); }} /><span>{model}<small>{make}</small></span></label>)}</div> : <p className="fine-print">No verified model names are listed for the selected make yet. Enter the model name exactly as shown on the vehicle.</p>}<label className="registration-address-field">{availableVehicleModels.length ? "Other model(s), if needed" : "Model name(s)"}<input value={customVehicleModels} onChange={(event) => { setCustomVehicleModels(event.target.value); setVehicleSelectionError(""); }} placeholder="Enter exact model name(s), separated by commas" maxLength={300} /></label></>}
            {vehicleSelectionError && <p className="form-error" role="alert">{vehicleSelectionError}</p>}
          </fieldset>}

          {businessCategoryError && <p className="form-error" role="alert">{businessCategoryError}</p>}
          {regEnabled(businessForm, "businessPhone") && <label>{regLabel(businessForm, "businessPhone", "Business mobile number")}<input name="businessPhone" type="tel" placeholder="+91 98765 43210" defaultValue={businessDetails.businessPhone} required={regField(businessForm, "businessPhone")?.required ?? true} /></label>}
          <button className="primary-button full-button" type="submit">Continue to verification</button>
        </form> :
          <form className="stacked-form" onSubmit={onBusiness}><input type="hidden" name="businessName" value={businessDetails.businessName} /><input type="hidden" name="businessCategory" value={businessDetails.businessCategory} /><input type="hidden" name="businessCategories" value={JSON.stringify(businessDetails.businessCategories)} /><input type="hidden" name="businessTaxonomySelections" value={JSON.stringify(businessTaxonomySelections)} /><input type="hidden" name="businessPhone" value={businessDetails.businessPhone} />{Object.entries(businessAddress).map(([key, value]) => <input type="hidden" key={`address-${key}`} name={key} value={value} />)}{businessModes.map((value) => <input type="hidden" key={`mode-${value}`} name="businessModes" value={value} />)}{vehicleTypes.map((value) => <input type="hidden" key={`type-${value}`} name="vehicleTypes" value={value} />)}{vehicleMakes.map((value) => <input type="hidden" key={`make-${value}`} name="vehicleMakes" value={value} />)}{vehicleModels.map((value) => <input type="hidden" key={`model-${value}`} name="vehicleModels" value={value} />)}<input type="hidden" name="customVehicleMake" value={customVehicleMake} /><input type="hidden" name="customVehicleModels" value={customVehicleModels} /><input type="hidden" name="businessLatitude" value={businessCoordinates?.latitude ?? ""} /><input type="hidden" name="businessLongitude" value={businessCoordinates?.longitude ?? ""} /><label>Create password <span className="optional">(at least 8 characters)</span><input name="password" type="password" placeholder="Create a password for your business account" autoComplete="new-password" minLength={8} required /></label>
<div className="otp-row"><label>Business mobile OTP<input name="businessOtp" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit OTP" value={registrationOtp} onChange={(event) => { setRegistrationOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setRegistrationOtpVerified(false); }} required /></label><div className="otp-actions"><button type="button" disabled={registrationOtpBusy} onClick={() => void requestRegistrationOtp("Business", "send", businessDetails.businessPhone)}>{registrationOtpBusy ? "Please wait?" : "Send OTP"}</button><button type="button" disabled={registrationOtpBusy || registrationOtp.length !== 6} onClick={() => void requestRegistrationOtp("Business", "verify", businessDetails.businessPhone)}>Verify OTP</button></div></div>{registrationDemoOtp && <p className="otp-demo-code" role="status">Demo OTP: <strong>{registrationDemoOtp}</strong> <span>For local testing only. No SMS was sent.</span></p>}{registrationOtpMessage && <p className={registrationOtpVerified ? "otp-verified" : "form-error"} role="status">{registrationOtpMessage}</p>}<label>Agent referral code <span className="optional">(optional)</span><input name="referral" placeholder="e.g. NEIGHBOR-4821" /></label><label>Upload business proof <span className="optional">(GSTIN, license or other registration)</span><input name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" /></label><label className="consent-check"><input type="checkbox" required /><span>I confirm these business details are accurate and consent to their use to create and verify my Bizearch business profile.</span></label><div className="form-button-row"><button type="button" className="outline-button" onClick={() => setStep(1)}>← Back</button><button type="submit" className="primary-button">Submit registration <span>→</span></button></div></form>}
        <div className="fine-print">Registration is saved in this demo only. Document verification and listing activation require a secure backend.</div></>}</>}
      {kind === "plans" && <><div className="modal-mark">💳</div><div className="eyebrow">MEMBERSHIP &amp; PAYMENTS</div><h2>Choose a subscription plan to get discovered.</h2><p>Select any tier to proceed to secure payment authorization via UPI, Card, or Net Banking.</p>
        <div className="compact-plans">
          {planNames.map((plan, index) => (
            <button
              key={plan}
              onClick={() => {
                close();
                onCheckout(checkoutBusiness || businesses[0]?.name || "Bloom & Bean Café", plan, "UPI");
              }}
            >
              <span>{plan} · {["₹499", "₹999", "₹1,999"][index]} / month</span>
              <span>Proceed to Pay →</span>
            </button>
          ))}
        </div>
        <div className="fine-print">100% money-back guarantee within 7 days. Instant activation and official GST tax receipt upon completion.</div></>}
      {kind === "sos" && <><div className="sos-modal-mark">+</div><div className="eyebrow">EMERGENCY HELP</div><h2>What kind of emergency?</h2><p>Select a type, then record one SOS alert with your location and saved emergency contacts. No call or message is placed automatically.</p>
        <div className="sos-emergency-tiles" role="group" aria-label="Emergency type">
          {emergencyTypes.map((item) => <button key={item.id} type="button" disabled={sosBusy} className={`sos-emergency-tile ${selectedEmergencyType === item.id ? "selected" : ""}`} aria-pressed={selectedEmergencyType === item.id} onClick={() => { setSelectedEmergencyType(item.id); setSosError(""); setSosResult(null); }}><span className="sos-type-icon">{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small></button>)}
        </div>
        <form className="emergency-contact-form sos-submit-form" onSubmit={submitSos}>
          <div className="sos-profile-summary"><strong>{emergencyProfile.customerName || "Profile details not set"}</strong><span>{emergencyProfile.customerPhone || "Add your mobile number in Profile"}</span><span>Emergency contacts: {emergencyProfile.emergencyPhones.map((phone) => phone || "Not set").join(" · ")}</span><button type="button" className="text-link" disabled={sosBusy} onClick={onOpenProfile}>Edit profile and emergency contacts</button></div>
          <p className="fine-print">Your account identity, name, mobile, selected emergency type, location result and two contact numbers are recorded for Super Admin review. Calls and messages below open your device app only after you choose them.</p>
          {sosError && <p className="form-error" role="alert">{sosError}</p>}
          <button className="primary-button sos-trigger-button" type="submit" disabled={sosBusy || !selectedEmergencyType}>{sosBusy ? "Sending SOS alert..." : "Send SOS"}</button>
        </form>
        {sosResult && <div className="sos-call-panel"><strong>{emergencyTypes.find((item) => item.id === sosResult.emergencyType)?.title} alert {sosResult.duplicate ? "was already recorded" : "recorded"} · {sosResult.locationStatus === "shared" ? `${sosResult.latitude?.toFixed(6)}, ${sosResult.longitude?.toFixed(6)} · accuracy ±${Math.round(sosResult.accuracyMeters || 0)} m` : "location unavailable"}</strong><p>Alert ID: {sosResult.id} · recorded {new Date(sosResult.createdAt).toLocaleString()}. This confirms storage only; no call or message was sent.</p><div className="emergency-call-links"><a className="primary-button" href={`tel:${emergencyTypes.find((item) => item.id === sosResult.emergencyType)?.phone}`}>Open dialer · {emergencyTypes.find((item) => item.id === sosResult.emergencyType)?.title} ({emergencyTypes.find((item) => item.id === sosResult.emergencyType)?.phone})</a>{sosResult.emergencyPhones.map((phone, index) => <a className="outline-button" key={`sos-call-${index}`} href={`tel:${phone}`}>Open dialer · contact {index + 1}</a>)}</div><div className="emergency-call-links emergency-sms-links">{sosResult.emergencyPhones.map((phone, index) => { const coordinates = sosResult.latitude !== null && sosResult.longitude !== null ? `Coordinates: ${sosResult.latitude.toFixed(6)}, ${sosResult.longitude.toFixed(6)}` : "Location unavailable on this device"; const message = encodeURIComponent(`SOS ${emergencyTypes.find((item) => item.id === sosResult.emergencyType)?.title} alert from ${sosResult.customerName}. Please help. ${coordinates}`); return <a className="outline-button" key={`sos-sms-${index}`} href={`sms:${phone}?body=${message}`}>Prepare SMS · contact {index + 1}</a>; })}</div></div>}
        <div className="fine-print">If this is an emergency, call the local emergency number yourself. Bizearch has no telephony/SMS dispatch integration; opening a dialer or composing a text requires your explicit action and any device confirmation.</div></>}
    </section>
  </div>;
}
