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
  Electronics: "Sales · Service → Mobiles · Laptops · Appliances · Cameras",
  Fashion: "Clothing · Footwear · Jewellery · Tailoring",
  "Home & furniture": "Furniture · Decor · Kitchen · Repairs",
  "Food & dining": "Restaurants · Meal delivery · Bakery · Cafes",
  "Health & wellness": "Clinics · Dental · Pharmacies · Physio",
  "Sports & fitness": "Gyms · Yoga · Sports coaching · Swimming · Turf",
  Travel: "Travel agents · Stays · Airport cabs · Tours",
  Entertainment: "Events · Music · Workshops · Gaming",
  "Everyday services": "Plumbing · Electrical · Cleaning · Repairs",
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
type MemberProfile = { fullName: string; phone: string; email: string; address: string; emergencyPhones: [string, string] };
const emptyMemberProfile: MemberProfile = { fullName: "", phone: "", email: "", address: "", emergencyPhones: ["", ""] };
const profileStorageKey = (role: "Account" | "Business" | "Agent" | "Company", identity = "") => `neighborly-profile-v1-${role.toLowerCase()}${role === "Company" && identity ? `-${encodeURIComponent(identity.trim().toLowerCase())}` : ""}`;
type PortalRole = Exclude<Role, "Discover">;
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
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
type CheckoutRequest = {
  businessName: string;
  plan: string;
  createdAt: string;
  paymentMethod: string;
  status: "Not processed";
};
type DemoData = {
  favorites: string[];
  recentSearches: string[];
  enquiries: DemoEnquiry[];
  events: DemoEvent[];
  checkouts: CheckoutRequest[];
  businesses: Business[];
};
type TaxonomyNode = { name: string; children: TaxonomyNode[] };

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
      item.status === "Not processed") &&
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
      (item.taxonomyTags === undefined || (Array.isArray(item.taxonomyTags) && item.taxonomyTags.every((entry) => typeof entry === "string"))));
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
  "home & furniture": "home",
  "food & dining": "food",
  "health & wellness": "health",
  travel: "plane",
  entertainment: "event",
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
  if (/event|celebration|party/.test(key)) return "event";
  if (/movie|cinema|film/.test(key)) return "cinema";
  if (/music|instrument|artist/.test(key)) return "music";
  if (/class|workshop|lesson|education|book/.test(key)) return "book";
  if (/repair|service|maintenance|diagnostic|installation|cleaning|plumbing|carpentry/.test(key)) return "tools";
  if (/professional|consult|account|business/.test(key)) return "briefcase";
  return categoryIconIds[sector.trim().toLowerCase()] || "default-category";
}

function CategoryIcon({ name, sector = "" }: { name: string; sector?: string }) {
  const iconId = categoryIconIdFor(name, sector);
  return <svg className="category-illustration" viewBox="0 0 48 48" aria-hidden="true"><use href={`/vehicle-category-icons.svg#${iconId}`} /></svg>;
}

const verifiedBrandLogos: Record<string, string> = {
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
  // For Electronics: Sales/Service → Device type → [BRAND] → Model
  if (sectorKey === "electronics") {
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

const initialBusinesses: Business[] = [
  {
    name: "Maya's Home Kitchen",
    category: "Food & dining",
    subcategories: ["Meal delivery", "Restaurants"],
    products: [
      { id: "maya-meals", name: "Homestyle lunch plate", description: "Seasonal thali with fresh sides.", price: 180, unit: "per plate" },
      { id: "maya-breakfast", name: "Breakfast box", description: "A rotating local breakfast, made fresh.", price: 120, unit: "per box" },
    ],
    description: "Fresh, homestyle meals made with local ingredients.",
    distance: 0.4,
    demoCoordinates: { latitude: 12.973, longitude: 77.591 },
    rating: 4.9,
    reviews: 128,
    price: "Meals from ₹180",
    icon: "🥘",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Meal delivery", "Lunch", "Thali", "Homestyle lunch plate", "Breakfast", "Regional specials", "Breakfast box", "Restaurants", "Indian", "South Indian"],
    tag: "Popular nearby",
  },
  {
    name: "NexGen Mobile Care",
    category: "Electronics",
    subcategories: ["Phone repair", "Accessories"],
    products: [
      { id: "nex-screen", name: "Screen replacement", description: "Device inspection and screen replacement quote.", price: 2499, unit: "from" },
      { id: "nex-diagnostic", name: "Phone diagnostics", description: "Same-day device health and repair assessment.", price: 299, unit: "per visit" },
    ],
    description: "Phone repair, accessories and same-day diagnostics.",
    distance: 1.2,
    demoCoordinates: { latitude: 12.981, longitude: 77.601 },
    rating: 4.8,
    reviews: 96,
    price: "Repairs from ₹299",
    icon: "📱",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Phone repair", "Mobile phones", "Screen & display", "Screen replacement", "Diagnostics", "Phone diagnostics", "Accessories", "Mobile accessories", "Chargers", "Fast chargers"],
  },
  {
    name: "Greenway Auto Works",
    category: "Automobiles",
    subcategories: ["Two-wheeler service", "Car repair"],
    products: [
      { id: "greenway-service", name: "Two-wheeler service", description: "Routine inspection and maintenance.", price: 499, unit: "from" },
      { id: "greenway-puncture", name: "Puncture repair", description: "Quick tyre repair and safety check.", price: 150, unit: "from" },
    ],
    description: "Trusted two-wheeler and car service, right around the corner.",
    distance: 2.1,
    demoCoordinates: { latitude: 12.99, longitude: 77.608 },
    rating: 4.7,
    reviews: 83,
    price: "Services from ₹499",
    icon: "🛵",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Two-wheeler service", "Motorcycles", "Routine service", "Oil & filter", "Scooters", "Brake & tyre care", "Brake pads", "Car repair", "Cars", "Engine & transmission", "Diagnostics", "Wheels & tyres", "Tyre replacement"],
    tag: "Verified business",
  },
  {
    name: "The Little Loom",
    category: "Fashion",
    subcategories: ["Clothing", "Local textiles"],
    products: [
      { id: "loom-kurta", name: "Everyday cotton kurta", description: "Locally made cotton clothing.", price: 899, unit: "from" },
      { id: "loom-textiles", name: "Handwoven textiles", description: "Small-batch textiles from local makers.", price: 650, unit: "from" },
    ],
    description: "Thoughtful everyday wear from independent local makers.",
    distance: 3.4,
    demoCoordinates: { latitude: 12.945, longitude: 77.61 },
    rating: 4.9,
    reviews: 57,
    price: "New arrivals in store",
    icon: "🧵",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Clothing", "Women", "Everyday wear", "Cotton kurta", "Men", "Tailoring", "Alterations", "Footwear", "Shoes", "Casual", "Everyday sneakers", "Local textiles", "Handloom", "Cotton", "Home textiles"],
  },
  {
    name: "Oak & Olive Living",
    category: "Home & furniture",
    subcategories: ["Furniture", "Home decor"],
    products: [
      { id: "oak-side-table", name: "Handcrafted side table", description: "Made-to-order solid wood furniture.", price: 4200, unit: "from" },
      { id: "oak-consult", name: "Furniture consultation", description: "Discuss a custom piece for your home.", price: 0, unit: "free enquiry" },
    ],
    description: "Handcrafted furniture and home finds, made to last.",
    distance: 4.8,
    demoCoordinates: { latitude: 12.94, longitude: 77.56 },
    rating: 4.6,
    reviews: 71,
    price: "Custom orders welcome",
    icon: "🪑",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Furniture", "Living room", "Tables", "Side table", "Home decor", "Wall decor", "Handmade", "Local art", "Repairs", "Carpentry", "Furniture repair", "Wood repair", "Interior design", "Home planning", "Room makeover", "Consultation"],
  },
  {
    name: "Neighbourhood Physio",
    category: "Health & wellness",
    subcategories: ["Physiotherapy", "Clinics"],
    products: [
      { id: "physio-assessment", name: "Physiotherapy assessment", description: "Initial mobility and movement consultation.", price: 400, unit: "per visit" },
      { id: "physio-followup", name: "Follow-up session", description: "One-on-one follow-up care.", price: 350, unit: "per visit" },
    ],
    description: "Friendly physiotherapy and mobility care from local experts.",
    distance: 2.7,
    demoCoordinates: { latitude: 12.96, longitude: 77.58 },
    rating: 4.8,
    reviews: 64,
    price: "Consultations from ₹400",
    icon: "🩺",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Physiotherapy", "Mobility care", "Assessment", "Physiotherapy assessment", "Follow-up", "Follow-up session"],
  },
  {
    name: "ProFix Home & Appliance Services",
    category: "Everyday services",
    subcategories: ["Appliance repair", "Plumbing", "Electrical", "Cleaning"],
    products: [
      { id: "profix-ac", name: "AC Repair & Servicing", description: "Filter clean, gas recharge and cooling coil inspection.", price: 499, unit: "from" },
      { id: "profix-elec", name: "Electrical Wiring & Fixing", description: "Switchboard repair, fan installation and emergency fixes.", price: 249, unit: "from" },
      { id: "profix-plumb", name: "Plumbing & Leak Repairs", description: "Tap, sink, toilet and drainage repair.", price: 299, unit: "from" },
      { id: "profix-ro", name: "Water Purifier (RO) Service", description: "Filter replacement and membrane service.", price: 349, unit: "from" },
    ],
    description: "Doorstep AC repair, electrical wiring, plumbing leak fixes and home appliance maintenance.",
    distance: 1.5,
    demoCoordinates: { latitude: 12.975, longitude: 77.620 },
    rating: 4.9,
    reviews: 142,
    price: "Services from ₹249",
    icon: "🛠️",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["AC repair", "Air conditioning", "Appliance repair", "Electrical", "Wiring repair", "Plumbing", "Leak repair", "Washing machine service", "Refrigerator service", "Water purifier", "Deep cleaning", "Handyman", "Carpentry", "Pest control"],
    tag: "Top rated nearby",
  },
  {
    name: "Urban Blossom & Fitness Studio",
    category: "Sports & fitness",
    subcategories: ["Gyms & fitness centers", "Yoga & pilates", "Sports coaching", "Dance fitness", "Personal training"],
    products: [
      { id: "ub-gym", name: "Gym Membership & Weight Training", description: "Full gym floor access, cardio equipment and strength weights.", price: 1500, unit: "per month" },
      { id: "ub-yoga", name: "Yoga Classes & Meditation", description: "Morning and evening Hatha & Vinyasa flow sessions.", price: 1000, unit: "per month" },
      { id: "ub-zumba", name: "Zumba & Cardio Dance", description: "High-energy rhythm cardio workout with certified instructors.", price: 1200, unit: "per month" },
      { id: "ub-turf", name: "Badminton Court & Turf Booking", description: "Hourly indoor wooden court slot with international mats.", price: 350, unit: "per hour" },
    ],
    description: "Community fitness center offering weight training, yoga, Zumba, badminton courts and personal training.",
    distance: 2.3,
    demoCoordinates: { latitude: 12.965, longitude: 77.615 },
    rating: 4.8,
    reviews: 110,
    price: "Sessions from ₹350",
    icon: "🏋️",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Sports & fitness", "Gyms & fitness centers", "Gym membership", "Weight training", "CrossFit", "Yoga & pilates", "Yoga classes", "Zumba", "Dance fitness", "Sports coaching", "Badminton", "Cricket", "Personal training"],
  },
  {
    name: "Apex City Travel & Logistics",
    category: "Travel",
    subcategories: ["Local transport", "Airport rides", "Moving help"],
    products: [
      { id: "apex-airport", name: "Airport Transfer Cab", description: "Prompt, sanitized airport pickup and drop.", price: 999, unit: "per ride" },
      { id: "apex-tour", name: "Local City Sightseeing Cab", description: "Full-day sightseeing with professional driver.", price: 1499, unit: "per day" },
      { id: "apex-movers", name: "Movers & Packers Assistance", description: "Household packing, transport and unpacking.", price: 2499, unit: "from" },
    ],
    description: "Reliable airport transfers, day tours, vehicle rentals and moving help across town.",
    distance: 3.1,
    demoCoordinates: { latitude: 12.985, longitude: 77.635 },
    rating: 4.7,
    reviews: 78,
    price: "Cabs from ₹999",
    icon: "✈️",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Airport transfer", "City tour", "Local transport", "Car hire", "Car rentals", "Hotels", "Guest houses", "Moving help", "Movers & packers", "Logistics", "Tours & experiences"],
  },

  // ── Hosur Local Businesses ─────────────────────────────────────────────────

  // ── Automobiles ──
  {
    name: "Jaya Bajaj – Hosur",
    category: "Automobiles",
    subcategories: ["Two-wheeler service", "Car repair"],
    products: [
      { id: "jb-chetak", name: "Chetak Electric Scooter (Sales)", description: "Latest Bajaj Chetak EV with full paperwork assistance.", price: 115000, unit: "onwards" },
      { id: "jb-service", name: "Bajaj 2-Wheeler Routine Service", description: "Oil change, brake check and full vehicle inspection.", price: 599, unit: "from" },
      { id: "jb-pulsar", name: "Pulsar 125 / NS200 (Sales)", description: "Authorized Bajaj showroom. Finance options available.", price: 75000, unit: "onwards" },
    ],
    description: "Authorized Bajaj dealership near Bagalur Circle, Hosur. Sales of Pulsar, Platina, Chetak EV and full after-sales service.",
    distance: 1.8,
    demoCoordinates: { latitude: 12.7326, longitude: 77.8281 },
    rating: 4.6,
    reviews: 187,
    price: "Bikes from ₹75,000",
    icon: "🏍️",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Two wheeler", "Bajaj", "Pulsar 125", "Pulsar NS200", "Chetak", "Sales", "Service", "Two-wheeler service", "Routine service", "Oil & filter", "Brake pads"],
    tag: "Authorized dealer",
  },
  {
    name: "Sree Velan TVS – Bagalur Circle",
    category: "Automobiles",
    subcategories: ["Two-wheeler service", "Car repair"],
    products: [
      { id: "tvs-jupiter", name: "TVS Jupiter (Sales)", description: "TVS Jupiter scooter – top comfort pick for families.", price: 88000, unit: "onwards" },
      { id: "tvs-iqube", name: "TVS iQube Electric (Sales)", description: "Authorized EV showroom with home charging support.", price: 145000, unit: "onwards" },
      { id: "tvs-svc", name: "TVS Annual Service Package", description: "Engine oil, air filter, chain lube and brake pads.", price: 799, unit: "per service" },
    ],
    description: "TVS Motors authorized showroom on Bagalur Road, Hosur. Sales, service and spare parts for all TVS two-wheelers.",
    distance: 1.2,
    demoCoordinates: { latitude: 12.7341, longitude: 77.8293 },
    rating: 4.7,
    reviews: 241,
    price: "Scooters from ₹88,000",
    icon: "🛵",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Two wheeler", "TVS", "Jupiter", "Ntorq 125", "iQube", "Sales", "Service", "Two-wheeler service", "Routine service", "Electric 2W", "Battery & motor check"],
    tag: "Verified business",
  },
  {
    name: "Amman Motors Maruti ARENA – Hosur",
    category: "Automobiles",
    subcategories: ["Four-wheeler sales", "Car repair"],
    products: [
      { id: "mm-swift", name: "Maruti Swift (Sales)", description: "New Swift with finance from 7.9% p.a. and exchange bonus.", price: 699000, unit: "onwards" },
      { id: "mm-brezza", name: "Maruti Brezza (Sales)", description: "Top-selling SUV — test drive available daily.", price: 1095000, unit: "onwards" },
      { id: "mm-service", name: "Maruti Car Service (Annual)", description: "Genuine spares, full inspection and car wash.", price: 3499, unit: "from" },
    ],
    description: "Maruti Suzuki ARENA authorized dealership on NH-7, Hosur. Full sales, exchange, finance and after-sales service.",
    distance: 3.4,
    demoCoordinates: { latitude: 12.7270, longitude: 77.8350 },
    rating: 4.5,
    reviews: 309,
    price: "Cars from ₹6.99 L",
    icon: "🚗",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Four wheeler", "Maruti Suzuki", "Swift", "Baleno", "Brezza", "WagonR", "Dzire", "Sales", "Service", "Car repair", "Engine & transmission", "Wheels & tyres"],
    tag: "Authorized dealer",
  },
  {
    name: "Himavasini Hyundai – Hosur",
    category: "Automobiles",
    subcategories: ["Four-wheeler sales", "Car repair"],
    products: [
      { id: "hh-creta", name: "Hyundai Creta (Sales)", description: "Hosur's most test-driven SUV — book your slot.", price: 1099000, unit: "onwards" },
      { id: "hh-exter", name: "Hyundai Exter (Sales)", description: "Compact SUV with top safety ratings.", price: 699000, unit: "onwards" },
      { id: "hh-svc", name: "Hyundai Periodic Service", description: "Genuine parts service with free health check.", price: 2999, unit: "from" },
    ],
    description: "Authorized Hyundai dealership on Krishnagiri Road, Hosur. Sales, test drives, trade-in and full workshop service.",
    distance: 2.9,
    demoCoordinates: { latitude: 12.7310, longitude: 77.8410 },
    rating: 4.6,
    reviews: 178,
    price: "Cars from ₹6.99 L",
    icon: "🚙",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Four wheeler", "Hyundai", "Creta", "Exter", "Venue", "i20", "Verna", "Aura", "Sales", "Service", "Car repair", "Wheels & tyres", "AC cooling recharge"],
  },
  {
    name: "Saraswathi Auto Engineering – Hosur",
    category: "Automobiles",
    subcategories: ["Car repair", "Tyres & batteries"],
    products: [
      { id: "sae-ac", name: "Car AC Repair & Gas Recharge", description: "Cooling system diagnosis and refrigerant refill.", price: 899, unit: "from" },
      { id: "sae-elect", name: "Auto Electrical Repair", description: "Wiring, alternator, starter motor and ECU diagnostics.", price: 499, unit: "from" },
      { id: "sae-battery", name: "Car Battery Replacement", description: "On-the-spot battery test and replacement service.", price: 3500, unit: "from" },
    ],
    description: "Multi-brand car repair and electrical workshop on Bagalur Road. Specialist in AC, wiring, battery and engine diagnostics.",
    distance: 2.2,
    demoCoordinates: { latitude: 12.7355, longitude: 77.8260 },
    rating: 4.8,
    reviews: 134,
    price: "Repairs from ₹499",
    icon: "🔧",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Car repair", "Cars", "Engine & transmission", "Diagnostics", "Air conditioning", "AC cooling recharge", "Tyres & batteries", "Vehicle batteries", "Battery replacement", "Car & bike battery"],
  },

  // ── Electronics ──
  {
    name: "Croma – Hosur",
    category: "Electronics",
    subcategories: ["Mobile phones", "Home appliances", "Laptops & computers"],
    products: [
      { id: "croma-phone", name: "Mobile Phone Sales & Demo", description: "All top brands — Apple, Samsung, Xiaomi, OnePlus — demo available.", price: 8999, unit: "from" },
      { id: "croma-laptop", name: "Laptop & Computer Sales", description: "Dell, HP, Lenovo, Apple — EMI from ₹0 down payment.", price: 34999, unit: "from" },
      { id: "croma-appliance", name: "Home Appliance Sales", description: "Washing machines, refrigerators, ACs from LG, Samsung and more.", price: 12999, unit: "from" },
    ],
    description: "Tata-owned Croma electronics superstore in Hosur. Large floor with phones, laptops, TVs, appliances and extended warranty service.",
    distance: 1.6,
    demoCoordinates: { latitude: 12.7318, longitude: 77.8301 },
    rating: 4.5,
    reviews: 412,
    price: "Electronics from ₹8,999",
    icon: "🖥️",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Sales", "Mobile phones", "Apple", "Samsung", "Xiaomi", "Laptops & computers", "Dell", "HP", "Lenovo", "Home appliances", "LG", "Whirlpool", "Audio & video", "Sony"],
    tag: "Popular nearby",
  },
  {
    name: "Bluewave Computers – Bagalur Road",
    category: "Electronics",
    subcategories: ["Laptops & computers", "Mobile phones"],
    products: [
      { id: "bw-laptop-service", name: "Laptop Repair & Service", description: "Motherboard, screen, keyboard and hinge repairs.", price: 499, unit: "from" },
      { id: "bw-custom-pc", name: "Custom PC Build", description: "Gaming or workstation build with warranty on all components.", price: 35000, unit: "from" },
      { id: "bw-cctv", name: "CCTV Installation (4/8 cam)", description: "HD camera setup for homes and shops with remote viewing.", price: 8999, unit: "from" },
    ],
    description: "Computer hardware, custom PC builds, laptop repair and CCTV installation on Bagalur Road, Hosur.",
    distance: 2.3,
    demoCoordinates: { latitude: 12.7345, longitude: 77.8278 },
    rating: 4.7,
    reviews: 98,
    price: "Repairs from ₹499",
    icon: "💻",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Service", "Laptops & computers", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Apple", "MacBook Air", "ThinkPad", "Phone repair", "Mobile phones"],
  },

  // ── Food & dining ──
  {
    name: "Vasavi Cafe – Hosur",
    category: "Food & dining",
    subcategories: ["Restaurants", "Cafes & beverages"],
    products: [
      { id: "vc-dosa", name: "Crispy Masala Dosa", description: "Paper-thin ghee dosa with authentic chutneys and sambar.", price: 55, unit: "per plate" },
      { id: "vc-rava-idli", name: "Rava Idli Platter", description: "Soft rava idlis with coconut chutney and gunpowder.", price: 60, unit: "per platter" },
      { id: "vc-coffee", name: "Filter Coffee", description: "Traditional South Indian drip coffee — strong and creamy.", price: 25, unit: "per cup" },
    ],
    description: "Iconic South Indian breakfast spot in Hosur. Famous for crispy masala dosas, rava idlis and filter coffee — open from 6 AM.",
    distance: 0.8,
    demoCoordinates: { latitude: 12.7330, longitude: 77.8335 },
    rating: 4.8,
    reviews: 563,
    price: "Breakfast from ₹25",
    icon: "🥞",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Restaurants", "Indian", "South Indian", "Dosa & idli", "Cafes & beverages", "Coffee & tea", "Hot drinks", "Coffee & tea", "Breakfast"],
    tag: "Local favourite",
  },
  {
    name: "Muneer Bakery – Hosur",
    category: "Food & dining",
    subcategories: ["Bakery & sweets", "Cafes & beverages"],
    products: [
      { id: "mb-paal-puff", name: "Paal Khova Puff", description: "Signature cream puff — viral Hosur favourite.", price: 30, unit: "per piece" },
      { id: "mb-dilpasand", name: "Dilpasand", description: "Sweet stuffed pastry — a Hosur must-try.", price: 35, unit: "per piece" },
      { id: "mb-cream-bun", name: "Fresh Cream Bun", description: "Soft pillowy bun with fresh whipped cream filling.", price: 28, unit: "per bun" },
    ],
    description: "Hosur's most-loved bakery — famous city-wide for paal khova puffs, cream buns and dilpasands. Open daily from 7 AM.",
    distance: 1.1,
    demoCoordinates: { latitude: 12.7322, longitude: 77.8318 },
    rating: 4.9,
    reviews: 871,
    price: "Snacks from ₹25",
    icon: "🥐",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Bakery & sweets", "Baked goods", "Breads & buns", "Fresh bread", "Cakes", "Celebrations", "Indian sweets", "Fresh sweets", "Traditional sweets"],
    tag: "Hosur favourite",
  },
  {
    name: "Rayalaseema Spice – Hosur",
    category: "Food & dining",
    subcategories: ["Restaurants", "Meal delivery"],
    products: [
      { id: "rs-biryani", name: "Andhra Chicken Biryani", description: "Spicy Rayalaseema-style dum biryani with raita.", price: 180, unit: "per plate" },
      { id: "rs-meals", name: "Andhra Meals (Unlimited)", description: "Full thali with rice, curries, pappad and dessert.", price: 130, unit: "per person" },
      { id: "rs-mutton", name: "Mutton Curry + Rice Combo", description: "Slow-cooked mutton in authentic Andhra masala.", price: 220, unit: "per plate" },
    ],
    description: "Popular Andhra-style restaurant in Hosur famous for fiery biryanis and unlimited Rayalaseema meals. Perfect for non-veg lovers.",
    distance: 1.4,
    demoCoordinates: { latitude: 12.7315, longitude: 77.8295 },
    rating: 4.7,
    reviews: 428,
    price: "Meals from ₹130",
    icon: "🍛",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Restaurants", "Indian", "Andhra", "Biryani", "Meals & thalis", "Meal delivery", "Daily meals", "Lunch", "Homestyle lunch"],
  },
  {
    name: "Hotel Junior Kuppanna – Hosur",
    category: "Food & dining",
    subcategories: ["Restaurants", "Catering"],
    products: [
      { id: "hk-kongu", name: "Kongunadu Meals", description: "Traditional Kongu-style non-veg thali — rice, curries, kuzhambu.", price: 160, unit: "per person" },
      { id: "hk-biryani", name: "Mutton / Chicken Biryani", description: "Authentic Kuppanna biryani — the Hosur crowd favourite.", price: 200, unit: "per plate" },
      { id: "hk-catering", name: "Event Catering Package", description: "Full catering for 50–500 guests. Traditional setup included.", price: 350, unit: "per head" },
    ],
    description: "Famous Kongunadu-style non-veg restaurant in Hosur. Beloved for authentic mutton biryani, kuzhambu meals and event catering.",
    distance: 1.9,
    demoCoordinates: { latitude: 12.7302, longitude: 77.8270 },
    rating: 4.8,
    reviews: 692,
    price: "Meals from ₹160",
    icon: "🍲",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Restaurants", "Indian", "South Indian", "Meals & thalis", "Catering", "Events", "Large gatherings", "Event catering", "Biryani"],
    tag: "Local favourite",
  },
  {
    name: "A2B – Adyar Ananda Bhavan, Hosur",
    category: "Food & dining",
    subcategories: ["Restaurants", "Bakery & sweets"],
    products: [
      { id: "a2b-thali", name: "Pure Veg Meals Thali", description: "Full South Indian veg thali with rice, kuzhambu and payasam.", price: 150, unit: "per person" },
      { id: "a2b-sweets", name: "Mysore Pak & Sweets Box", description: "Traditional South Indian sweets — perfect for gifting.", price: 380, unit: "per 500g" },
      { id: "a2b-snacks", name: "Tiffin Snacks Combo", description: "Vada, samosa, pongal and filter coffee set.", price: 120, unit: "per combo" },
    ],
    description: "A2B (Adyar Ananda Bhavan) Hosur branch. Pure vegetarian restaurant and sweet shop — family meals, sweets and festive orders.",
    distance: 1.3,
    demoCoordinates: { latitude: 12.7337, longitude: 77.8308 },
    rating: 4.6,
    reviews: 531,
    price: "Thali ₹150",
    icon: "🍮",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Restaurants", "Indian", "South Indian", "Vegetarian", "Meals & thalis", "Bakery & sweets", "Indian sweets", "Traditional sweets", "Meal delivery", "Tiffin"],
  },
  {
    name: "Uzhavar Santhai – Hosur Farmers Market",
    category: "Food & dining",
    subcategories: ["Groceries & produce"],
    products: [
      { id: "uz-veg", name: "Fresh Seasonal Vegetables", description: "Direct from Hosur farmers — zero middlemen.", price: 30, unit: "per kg from" },
      { id: "uz-fruits", name: "Fresh Local Fruits", description: "Seasonal fruits — mangoes, guava, tomatoes, bananas.", price: 40, unit: "per kg from" },
      { id: "uz-flowers", name: "Fresh Roses & Marigolds", description: "Bulk and retail flowers — Hosur is the rose capital of India.", price: 80, unit: "per bunch" },
    ],
    description: "Government-run Uzhavar Santhai (Farmers Market) in Hosur. Buy fresh vegetables, fruits and flowers directly from local farmers at below-market prices.",
    distance: 0.9,
    demoCoordinates: { latitude: 12.7335, longitude: 77.8355 },
    rating: 4.5,
    reviews: 631,
    price: "Vegetables from ₹30/kg",
    icon: "🥬",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Groceries & produce", "Fresh produce", "Vegetables", "Seasonal vegetables", "Fruits", "Fresh fruits", "Pantry", "Staples"],
    tag: "Government market",
  },

  // ── Health & wellness ──
  {
    name: "Apollo Pharmacy – Bagalur Road, Hosur",
    category: "Health & wellness",
    subcategories: ["Pharmacies"],
    products: [
      { id: "aph-rx", name: "Prescription Medicine Delivery", description: "Upload prescription and get medicines home-delivered same day.", price: 0, unit: "free delivery" },
      { id: "aph-otc", name: "OTC & Healthcare Products", description: "Vitamins, first aid, sanitizers and daily health essentials.", price: 49, unit: "from" },
      { id: "aph-bp", name: "Free BP / Sugar Screening", description: "Free BP and blood glucose check at store — no appointment needed.", price: 0, unit: "free" },
    ],
    description: "Apollo Pharmacy on Bagalur Road, Hosur. Extended hours, prescription refills, online ordering and free in-store health check-ups.",
    distance: 1.0,
    demoCoordinates: { latitude: 12.7348, longitude: 77.8285 },
    rating: 4.7,
    reviews: 289,
    price: "Medicines available",
    icon: "💊",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Pharmacies", "Medicines", "Prescription support", "Prescription medicines", "Local delivery", "Medicine delivery", "Health screening"],
    tag: "Verified business",
  },
  {
    name: "Sri Chandrasekara Hospital – Hosur",
    category: "Health & wellness",
    subcategories: ["Clinics", "Dental care"],
    products: [
      { id: "sch-consult", name: "General Doctor Consultation", description: "OPD consultation with experienced doctors. Walk-in welcome.", price: 200, unit: "per visit" },
      { id: "sch-dental", name: "Dental Consultation & Cleaning", description: "Oral examination, scaling and fluoride treatment.", price: 350, unit: "from" },
      { id: "sch-lab", name: "Diagnostic Lab Test Package", description: "Blood count, lipid profile, blood sugar and urine analysis.", price: 599, unit: "per package" },
    ],
    description: "Established multi-specialty hospital on Bagalur Road, Hosur. General medicine, dental, paediatrics, diagnostics and pharmacy under one roof.",
    distance: 2.1,
    demoCoordinates: { latitude: 12.7325, longitude: 77.8265 },
    rating: 4.6,
    reviews: 215,
    price: "Consult from ₹200",
    icon: "🏥",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Clinics", "General care", "Appointments", "Doctor consultation", "Paediatrics", "Dental care", "Dental clinics", "Check-ups", "Pharmacies", "Lab tests"],
  },
  {
    name: "Karthick Skin Hair & Laser Clinic – Hosur",
    category: "Health & wellness",
    subcategories: ["Clinics", "Personal care"],
    products: [
      { id: "ks-laser", name: "Laser Hair Removal (per session)", description: "FDA-approved diode laser for permanent hair reduction.", price: 1999, unit: "per session" },
      { id: "ks-acne", name: "Acne & Pigmentation Treatment", description: "Customized facial treatment with medicated serums.", price: 1499, unit: "per session" },
      { id: "ks-prp", name: "PRP Hair Loss Treatment", description: "Platelet-rich plasma therapy for hair regrowth.", price: 3999, unit: "per session" },
    ],
    description: "Specialist skin, hair and laser clinic on Bagalur Road, Hosur. Dermatology, laser therapy, PRP hair treatment and cosmetology.",
    distance: 1.7,
    demoCoordinates: { latitude: 12.7358, longitude: 77.8290 },
    rating: 4.8,
    reviews: 167,
    price: "Sessions from ₹1,499",
    icon: "🧴",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Clinics", "Skin care", "Personal care", "Salon services", "Hair care", "Wellness", "Consultation", "Wellness consultation"],
  },

  // ── Fashion ──
  {
    name: "Santhosh Instyle – Nethaji Road, Hosur",
    category: "Fashion",
    subcategories: ["Clothing", "Tailoring"],
    products: [
      { id: "si-mens", name: "Men's Casual & Formal Wear", description: "Shirts, trousers, denim and ethnic wear for men.", price: 599, unit: "from" },
      { id: "si-womens", name: "Women's Kurtas & Sarees", description: "Printed kurtas, cotton sarees and occasion wear.", price: 799, unit: "from" },
      { id: "si-kids", name: "Kids Clothing Collection", description: "Everyday school wear and festive outfits for children.", price: 349, unit: "from" },
    ],
    description: "Popular fashion retail store on Nethaji Road, Hosur. Men's, women's and kids' clothing with latest trends and festive collections.",
    distance: 1.5,
    demoCoordinates: { latitude: 12.7332, longitude: 77.8327 },
    rating: 4.5,
    reviews: 143,
    price: "Clothing from ₹349",
    icon: "👗",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Clothing", "Men", "Everyday wear", "Shirts & trousers", "Women", "Kurtas & kurtis", "Sarees & dresses", "Kids", "Ethnic wear", "Fashion accessories"],
  },
  {
    name: "GRT Jewellers – Hosur",
    category: "Fashion",
    subcategories: ["Jewellery"],
    products: [
      { id: "grt-gold", name: "Gold Jewellery (22K & 18K)", description: "Certified hallmarked gold — rings, chains, bangles.", price: 50000, unit: "from" },
      { id: "grt-diamond", name: "Diamond Jewellery", description: "BIS-hallmarked diamond solitaires, pendants and earrings.", price: 15000, unit: "from" },
      { id: "grt-exchange", name: "Old Gold Exchange", description: "Exchange old gold for new jewellery at fair melt value.", price: 0, unit: "free service" },
    ],
    description: "Trusted GRT Jewellers showroom in Hosur. Wide range of gold, diamond and platinum jewellery with BIS hallmark and easy exchange.",
    distance: 2.0,
    demoCoordinates: { latitude: 12.7320, longitude: 77.8340 },
    rating: 4.7,
    reviews: 386,
    price: "Gold from ₹50,000",
    icon: "💍",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Jewellery", "Traditional jewellery", "Earrings", "Necklaces", "Handcrafted necklaces", "Gold", "Diamond", "Bangles"],
    tag: "Trusted brand",
  },

  // ── Home & furniture ──
  {
    name: "Nilgiris Supermarket – Hosur",
    category: "Home & furniture",
    subcategories: ["Kitchen & storage", "Home decor"],
    products: [
      { id: "nil-grocery", name: "Daily Grocery & Pantry Staples", description: "Rice, pulses, oils, spices and packaged foods.", price: 50, unit: "from" },
      { id: "nil-homeware", name: "Kitchenware & Home Essentials", description: "Cookware, storage boxes, cleaning supplies.", price: 199, unit: "from" },
      { id: "nil-personal", name: "Personal Care & Hygiene", description: "Soaps, shampoos, face wash and daily care products.", price: 99, unit: "from" },
    ],
    description: "Nilgiris supermarket in Hosur — trusted for groceries, fresh produce, kitchenware, personal care and household daily needs.",
    distance: 1.1,
    demoCoordinates: { latitude: 12.7340, longitude: 77.8320 },
    rating: 4.4,
    reviews: 324,
    price: "Groceries from ₹50",
    icon: "🛒",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Kitchen & storage", "Storage solutions", "Shelving", "Storage racks", "Home decor", "Soft furnishings", "Cleaning", "Home cleaning", "Pantry", "Staples"],
  },

  // ── Sports & fitness ──
  {
    name: "The Muscle Empire Gym – Hosur",
    category: "Sports & fitness",
    subcategories: ["Gyms & fitness centers", "Personal training"],
    products: [
      { id: "tme-monthly", name: "Monthly Gym Membership", description: "Unlimited floor access — free weights, cardio, cable machines.", price: 1200, unit: "per month" },
      { id: "tme-pt", name: "Personal Training (1-on-1)", description: "Custom workout plan with certified personal trainer.", price: 3500, unit: "per month" },
      { id: "tme-diet", name: "Diet & Nutrition Consultation", description: "Customized macro plan for muscle gain or fat loss.", price: 800, unit: "per session" },
    ],
    description: "One of Hosur's top gyms with modern strength equipment, CrossFit zone and personal training. Open 5 AM – 11 PM every day.",
    distance: 1.6,
    demoCoordinates: { latitude: 12.7352, longitude: 77.8310 },
    rating: 4.7,
    reviews: 211,
    price: "Membership from ₹1,200",
    icon: "🏋️",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Sports & fitness", "Gyms & fitness centers", "Gym membership", "Weight training", "Strength conditioning", "CrossFit & functional", "HIIT workouts", "Personal training", "1-on-1 coaching"],
    tag: "Top rated nearby",
  },
  {
    name: "7 Eleven Badminton Academy – Hosur",
    category: "Sports & fitness",
    subcategories: ["Sports coaching", "Turf & facility rental"],
    products: [
      { id: "7e-coaching", name: "Badminton Coaching (Monthly)", description: "Beginner to advanced coaching by BWF-certified coaches.", price: 1500, unit: "per month" },
      { id: "7e-court", name: "Court Slot Booking (1 hr)", description: "Indoor synthetic mat court — well lit and ventilated.", price: 300, unit: "per hour" },
      { id: "7e-kids", name: "Kids Badminton Academy", description: "Structured coaching for children aged 6–15.", price: 1200, unit: "per month" },
    ],
    description: "Leading badminton coaching academy and court facility in Hosur. BWF-certified coaches, indoor courts and monthly training programs.",
    distance: 2.4,
    demoCoordinates: { latitude: 12.7298, longitude: 77.8268 },
    rating: 4.8,
    reviews: 176,
    price: "Coaching from ₹1,200",
    icon: "🏸",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Sports coaching", "Badminton", "Coaching academies", "Badminton coaching", "Turf & facility rental", "Badminton courts", "Indoor court rental", "Court booking"],
  },
  {
    name: "Pranava Nature Cure & Yoga – Hosur",
    category: "Sports & fitness",
    subcategories: ["Yoga & pilates", "Personal training"],
    products: [
      { id: "pnc-yoga", name: "Yoga Classes (Monthly)", description: "Hatha and Vinyasa yoga — morning and evening batches.", price: 1000, unit: "per month" },
      { id: "pnc-nature", name: "Nature Cure Therapy Session", description: "Holistic healing combining naturopathy and yoga therapy.", price: 1500, unit: "per session" },
      { id: "pnc-weight", name: "Weight Management Program", description: "30-day plan with diet, yoga and lifestyle coaching.", price: 4500, unit: "per month" },
    ],
    description: "Pranava Nature Cure & Yoga Clinic in Hosur. Holistic wellness center offering yoga, naturopathy, weight management and rejuvenation therapies.",
    distance: 3.1,
    demoCoordinates: { latitude: 12.7280, longitude: 77.8350 },
    rating: 4.9,
    reviews: 142,
    price: "Yoga from ₹1,000/mo",
    icon: "🧘",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Yoga & pilates", "Yoga studios", "Hatha & Vinyasa", "Yoga classes", "Personal training", "1-on-1 coaching", "Transformation"],
  },
  {
    name: "GameX 360 – Hosur Turf",
    category: "Sports & fitness",
    subcategories: ["Turf & facility rental", "Sports coaching"],
    products: [
      { id: "gx-football", name: "5-A-Side Football Turf (1 hr)", description: "Full synthetic grass turf with floodlights. All-weather facility.", price: 800, unit: "per hour" },
      { id: "gx-cricket", name: "Box Cricket Turf Booking", description: "Box cricket field with nets. Suitable for 6–12 players.", price: 600, unit: "per hour" },
      { id: "gx-package", name: "Group Event Package (2 hrs)", description: "Two sports slots + refreshments for up to 20 players.", price: 2500, unit: "per event" },
    ],
    description: "Multi-sport turf facility in Hosur with 5-a-side football, box cricket and badminton courts. Floodlights, changing rooms and parking.",
    distance: 2.8,
    demoCoordinates: { latitude: 12.7305, longitude: 77.8387 },
    rating: 4.6,
    reviews: 198,
    price: "Turf from ₹600/hr",
    icon: "⚽",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Turf & facility rental", "Box cricket turf", "Hourly rental", "Turf booking", "Sports coaching", "Cricket", "Net practice & coaching", "Badminton courts"],
  },

  // ── Travel ──
  {
    name: "Fortune Hosur – ITC Hotels",
    category: "Travel",
    subcategories: ["Stays", "Tours & experiences"],
    products: [
      { id: "fh-room", name: "Deluxe Room (Per Night)", description: "Air-conditioned room with breakfast and high-speed Wi-Fi.", price: 4500, unit: "per night" },
      { id: "fh-suite", name: "Executive Suite Stay", description: "Spacious suite with lounge access, minibar and city view.", price: 8000, unit: "per night" },
      { id: "fh-banquet", name: "Banquet Hall Booking", description: "Ideal for conferences, weddings and corporate events.", price: 50000, unit: "per day" },
    ],
    description: "Fortune Hosur — premium ITC Hotels property. Business and leisure hotel with spa, restaurant, conference rooms and modern amenities.",
    distance: 3.2,
    demoCoordinates: { latitude: 12.7275, longitude: 77.8320 },
    rating: 4.8,
    reviews: 522,
    price: "Rooms from ₹4,500",
    icon: "🏨",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Stays", "Hotels", "Family stays", "Hotel room booking", "Tours & experiences", "Local experiences", "Business hotel", "Conference"],
    tag: "Premium stay",
  },
  {
    name: "TGI Grand Fortuna – Hosur",
    category: "Travel",
    subcategories: ["Stays"],
    products: [
      { id: "tgi-std", name: "Standard Room (Per Night)", description: "Well-appointed room with TV, AC and complimentary breakfast.", price: 2800, unit: "per night" },
      { id: "tgi-corp", name: "Corporate Room Package (Weekly)", description: "7-night stay with breakfast, laundry and airport pick-up.", price: 16000, unit: "per week" },
    ],
    description: "TGI Grand Fortuna — top-rated upscale hotel in Hosur. Popular with corporate and leisure travelers. Restaurant, banquet and gym on-site.",
    distance: 2.6,
    demoCoordinates: { latitude: 12.7292, longitude: 77.8305 },
    rating: 4.7,
    reviews: 298,
    price: "Rooms from ₹2,800",
    icon: "🛏️",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Stays", "Hotels", "Family stays", "Hotel room booking", "Guest houses", "Short stays", "Corporate stay"],
  },

  // ── Everyday services ──
  {
    name: "Jaya Sri Electricals & Plumbing – Hosur",
    category: "Everyday services",
    subcategories: ["Electrical", "Plumbing"],
    products: [
      { id: "js-elec", name: "Electrical Wiring & Repair", description: "Fuse, switchboard, fan, light installation and emergency repair.", price: 249, unit: "from" },
      { id: "js-plumb", name: "Plumbing Leak & Pipe Repair", description: "Tap, overhead tank, drainage and toilet repairs.", price: 299, unit: "from" },
      { id: "js-geyser", name: "Geyser Installation & Repair", description: "Any brand geyser installation, thermostat fix and anode check.", price: 499, unit: "from" },
    ],
    description: "Trusted electrician and plumber in Hosur — same-day home visits. Licensed professionals covering all major residential areas.",
    distance: 0.7,
    demoCoordinates: { latitude: 12.7344, longitude: 77.8300 },
    rating: 4.8,
    reviews: 219,
    price: "Services from ₹249",
    icon: "⚡",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Electrical", "Home electrical", "Repairs", "Wiring repair", "Installation", "Lighting installation", "Plumbing", "Home plumbing", "Leak repair", "Bathroom plumbing", "Tap & fixture installation"],
    tag: "Same-day service",
  },
  {
    name: "Supreme Cool Tech AC Services – Hosur",
    category: "Everyday services",
    subcategories: ["Appliance repair", "Electrical"],
    products: [
      { id: "sct-service", name: "AC Service & Deep Cleaning", description: "Coil wash, filter clean and performance test.", price: 499, unit: "from" },
      { id: "sct-gas", name: "AC Gas Recharge (R-32 / R-22)", description: "Gas top-up with leak check and cooling test.", price: 999, unit: "from" },
      { id: "sct-install", name: "AC Installation (Split / Window)", description: "Professional 1.5 ton / 2 ton split AC fitting.", price: 1200, unit: "from" },
    ],
    description: "Specialist AC repair, deep cleaning, gas recharge and installation in Hosur. Covers all brands — Daikin, Voltas, LG, Samsung, Hitachi.",
    distance: 1.3,
    demoCoordinates: { latitude: 12.7360, longitude: 77.8265 },
    rating: 4.7,
    reviews: 181,
    price: "AC service from ₹499",
    icon: "❄️",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Appliance repair", "Kitchen appliances", "Repair", "Refrigerator service", "Laundry appliances", "Air conditioning", "AC cooling recharge", "Electrical", "Home electrical"],
  },
  {
    name: "AtoZ Home Services – Hosur",
    category: "Everyday services",
    subcategories: ["Cleaning", "Home services", "Plumbing", "Electrical"],
    products: [
      { id: "az-deep", name: "Full Home Deep Cleaning", description: "2–5 BHK deep clean including kitchen, bathrooms and windows.", price: 1999, unit: "from" },
      { id: "az-pest", name: "Pest Control Treatment", description: "Cockroach, bed bugs, termite and mosquito treatment.", price: 799, unit: "from" },
      { id: "az-sofa", name: "Sofa & Carpet Cleaning", description: "Steam-clean and shampoo for sofas, chairs and carpets.", price: 499, unit: "from" },
      { id: "az-movers", name: "Local Moving & Packing", description: "Professional packing, transport and unpacking in Hosur.", price: 2499, unit: "from" },
    ],
    description: "Full-service home care in Hosur — deep cleaning, pest control, sofa shampooing, plumbing, electrical and local movers.",
    distance: 1.8,
    demoCoordinates: { latitude: 12.7315, longitude: 77.8330 },
    rating: 4.6,
    reviews: 267,
    price: "Services from ₹499",
    icon: "🧹",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Cleaning", "Home cleaning", "Full home", "Deep cleaning", "Focused cleaning", "Kitchen cleaning", "Home services", "Pest control", "Treatment", "Home pest treatment", "Moving help", "Packing & moving", "Local move assistance"],
  },


  // ── AUTOMOBILES ──────────────────────────────────────────────────────────────
  {
    name: "Tarun Motors Hero – Mathigiri, Hosur",
    category: "Automobiles",
    subcategories: ["Two-wheeler service"],
    products: [
      { id: "tarun-hero-splendor", name: "Hero Splendor Plus (Sales)", description: "Authorized sales of Hero Splendor Plus.", price: 78000, unit: "ex-showroom" },
      { id: "tarun-hero-xtreme", name: "Hero Xtreme 160R (Sales)", description: "Authorized sales of Hero Xtreme 160R.", price: 130000, unit: "ex-showroom" },
      { id: "tarun-hero-service", name: "Hero Annual Service Package", description: "Full annual service for Hero two-wheelers.", price: 699, unit: "per service" },
    ],
    description: "Authorized Hero MotoCorp dealership near RC Church, Denkanikottai Main Road, Mathigiri. Sales of Splendor, HF Deluxe, Vida V1 EV and full service.",
    distance: 1.2,
    demoCoordinates: { latitude: 12.722, longitude: 77.831 },
    rating: 4.5,
    reviews: 203,
    price: "from ₹699",
    icon: "🏍️",
    color: "butter",
    subscribed: true,
    tag: "Authorized dealer",
    taxonomyTags: ["Two wheeler", "Hero", "Splendor Plus", "HF Deluxe", "Vida V1", "Xtreme 160R", "Sales", "Service", "Two-wheeler service", "Routine service", "Oil & filter"],
  },
  {
    name: "Velan Honda – Denkanikotta Road, Hosur",
    category: "Automobiles",
    subcategories: ["Two-wheeler service"],
    products: [
      { id: "velan-activa", name: "Honda Activa 6G (Sales)", description: "Authorized sales of Honda Activa 6G.", price: 82000, unit: "ex-showroom" },
      { id: "velan-cb350", name: "Honda CB350 (Sales)", description: "Authorized sales of Honda CB350.", price: 210000, unit: "ex-showroom" },
      { id: "velan-service", name: "Honda 2W Service", description: "Routine service for Honda two-wheelers.", price: 799, unit: "per service" },
    ],
    description: "Authorized Honda two-wheeler dealership on Denkanikotta Road near Railway Station, Hosur. Activa, Shine, Unicorn, CB350 sales and service.",
    distance: 0.9,
    demoCoordinates: { latitude: 12.724, longitude: 77.832 },
    rating: 4.6,
    reviews: 156,
    price: "from ₹799",
    icon: "🛵",
    color: "mint",
    subscribed: true,
    tag: "Authorized dealer",
    taxonomyTags: ["Two wheeler", "Honda", "Activa", "Dio", "Shine 125", "Unicorn", "CB350", "Sales", "Service", "Two-wheeler service", "Routine service", "Brake & tyre care"],
  },
  {
    name: "Sri Saravana Motors Royal Enfield – Hosur",
    category: "Automobiles",
    subcategories: ["Two-wheeler service"],
    products: [
      { id: "ssm-classic350", name: "Royal Enfield Classic 350 (Sales)", description: "Authorized sales of RE Classic 350.", price: 196000, unit: "ex-showroom" },
      { id: "ssm-hunter350", name: "RE Hunter 350 (Sales)", description: "Authorized sales of RE Hunter 350.", price: 155000, unit: "ex-showroom" },
      { id: "ssm-service", name: "RE Annual Service", description: "Complete annual service for Royal Enfield motorcycles.", price: 1299, unit: "per service" },
    ],
    description: "Authorized Royal Enfield dealer in Hosur. Full range — Classic 350, Hunter 350, Bullet, Meteor, Himalayan. Test rides available daily.",
    distance: 1.5,
    demoCoordinates: { latitude: 12.726, longitude: 77.834 },
    rating: 4.7,
    reviews: 312,
    price: "from ₹1299",
    icon: "🏍️",
    color: "peach",
    subscribed: true,
    tag: "Authorized dealer",
    taxonomyTags: ["Two wheeler", "Royal Enfield", "Classic 350", "Hunter 350", "Bullet 350", "Meteor 350", "Himalayan", "Sales", "Service", "Two-wheeler service", "Routine service"],
  },
  {
    name: "KHT Motors Tata – Hosur",
    category: "Automobiles",
    subcategories: ["Four-wheeler sales", "Car repair"],
    products: [
      { id: "kht-nexon", name: "Tata Nexon (Sales)", description: "Authorized sales of Tata Nexon SUV.", price: 850000, unit: "ex-showroom" },
      { id: "kht-punch", name: "Tata Punch (Sales)", description: "Authorized sales of Tata Punch.", price: 620000, unit: "ex-showroom" },
      { id: "kht-service", name: "Tata Periodic Service", description: "Authorized periodic service for Tata vehicles.", price: 3999, unit: "per service" },
    ],
    description: "Authorized Tata Motors passenger vehicle dealer in Hosur. Nexon, Punch, Tiago, Harrier, Safari — sales, test drives and full service.",
    distance: 2.0,
    demoCoordinates: { latitude: 12.728, longitude: 77.820 },
    rating: 4.4,
    reviews: 187,
    price: "from ₹3999",
    icon: "🚗",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Four wheeler", "Tata Motors", "Punch", "Nexon", "Tiago", "Altroz", "Harrier", "Safari", "Sales", "Service", "Car repair", "Engine & transmission"],
  },
  {
    name: "Akash Bajaj (Chetak EV) – Hosur",
    category: "Automobiles",
    subcategories: ["Two-wheeler service"],
    products: [
      { id: "akash-chetak", name: "Bajaj Chetak Electric (Sales)", description: "Authorized sales of Bajaj Chetak EV scooter.", price: 120000, unit: "ex-showroom" },
      { id: "akash-pulsar", name: "Bajaj Pulsar NS200 (Sales)", description: "Authorized sales of Bajaj Pulsar NS200.", price: 165000, unit: "ex-showroom" },
      { id: "akash-ev-diag", name: "Battery & Motor Diagnostics", description: "EV battery and motor health check.", price: 499, unit: "per visit" },
    ],
    description: "Bajaj and Chetak EV authorized dealer near Krishnagiri Main Road, Hosur. EV test rides, finance and after-sales support.",
    distance: 1.8,
    demoCoordinates: { latitude: 12.730, longitude: 77.824 },
    rating: 4.5,
    reviews: 142,
    price: "from ₹499",
    icon: "⚡",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Two wheeler", "Bajaj", "Chetak", "Pulsar 125", "Pulsar NS200", "Sales", "Service", "Two-wheeler service", "Electric 2W", "Battery & motor check", "Routine service"],
  },
  {
    name: "Hosur Tyre & Battery Hub",
    category: "Automobiles",
    subcategories: ["Tyres & batteries"],
    products: [
      { id: "htb-car-tyre", name: "MRF / Apollo Car Tyre", description: "Multi-brand car tyre supply and fitting.", price: 3500, unit: "per tyre" },
      { id: "htb-2w-tyre", name: "Two-Wheeler Tyre", description: "Multi-brand two-wheeler tyre supply and fitting.", price: 800, unit: "per tyre" },
      { id: "htb-battery", name: "Car Battery Replacement (Amaron/Exide)", description: "Car battery supply and replacement service.", price: 4200, unit: "per battery" },
    ],
    description: "Multi-brand tyre and battery shop on Bagalur Road. MRF, Apollo, CEAT tyres; Amaron, Exide, Luminous batteries. Free wheel balancing and alignment.",
    distance: 2.3,
    demoCoordinates: { latitude: 12.732, longitude: 77.826 },
    rating: 4.7,
    reviews: 198,
    price: "from ₹800",
    icon: "🔩",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Tyres & batteries", "Tyres & wheels", "Wheel balancing", "Puncture repair", "Vehicle batteries", "Battery replacement", "Car & bike battery"],
  },
  {
    name: "Chil Zone Car Wash & Detailing – Hosur",
    category: "Automobiles",
    subcategories: ["Car wash & detailing"],
    products: [
      { id: "chil-foam-wash", name: "Full Body Foam Wash", description: "Complete exterior foam wash for cars.", price: 399, unit: "per session" },
      { id: "chil-interior", name: "Interior Deep Vacuum & Sanitize", description: "Full interior vacuum and sanitization.", price: 599, unit: "per session" },
      { id: "chil-ppf", name: "Paint Protection Film (PPF)", description: "Full-body PPF application for paint protection.", price: 15000, unit: "per car" },
    ],
    description: "Professional car wash and auto detailing studio in Hosur. Foam wash, interior sanitization, ceramic coating and PPF available.",
    distance: 1.6,
    demoCoordinates: { latitude: 12.734, longitude: 77.828 },
    rating: 4.8,
    reviews: 176,
    price: "from ₹399",
    icon: "🚿",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Car wash & detailing", "Exterior care", "Wash packages", "Full service foam wash", "Interior care", "Deep sanitization", "Upholstery shampoo"],
  },

  // ── ELECTRONICS ──────────────────────────────────────────────────────────────
  {
    name: "Reliance Digital – Bagalur Road, Hosur",
    category: "Electronics",
    subcategories: ["Mobile phones", "Home appliances", "Audio & video"],
    products: [
      { id: "rd-tv", name: "Smart TV (Sales)", description: "Wide range of smart TVs from top brands.", price: 18999, unit: "from" },
      { id: "rd-ac", name: "Air Conditioner (Sales)", description: "Energy-efficient ACs from leading brands.", price: 32999, unit: "from" },
      { id: "rd-phone", name: "Mobile Phone (Sales)", description: "Latest smartphones across all price segments.", price: 9999, unit: "from" },
    ],
    description: "Reliance Digital large-format electronics store on Bagalur Road, Hosur. TVs, ACs, washing machines, phones, laptops and audio systems with EMI options.",
    distance: 2.5,
    demoCoordinates: { latitude: 12.736, longitude: 77.822 },
    rating: 4.4,
    reviews: 387,
    price: "from ₹9999",
    icon: "📺",
    color: "peach",
    subscribed: true,
    tag: "Popular nearby",
    taxonomyTags: ["Sales", "Mobile phones", "Samsung", "Audio & video", "Sony", "LG", "Home appliances", "Whirlpool", "Laptops & computers", "HP", "Lenovo"],
  },
  {
    name: "Samsung Experience Store – Bagalur Road, Hosur",
    category: "Electronics",
    subcategories: ["Mobile phones", "Home appliances"],
    products: [
      { id: "samsung-s25", name: "Samsung Galaxy S25 (Sales)", description: "Latest Samsung flagship smartphone.", price: 79999, unit: "ex-showroom" },
      { id: "samsung-fridge", name: "Samsung Bespoke Refrigerator", description: "Premium Bespoke series refrigerator.", price: 65000, unit: "ex-showroom" },
      { id: "samsung-repair", name: "Samsung Service & Repair", description: "Authorized Samsung device repair and service.", price: 499, unit: "from" },
    ],
    description: "Authorized Samsung Experience Store on Bagalur Road, Hosur. Full range of Samsung phones, tablets, TVs, appliances and official service.",
    distance: 2.6,
    demoCoordinates: { latitude: 12.738, longitude: 77.823 },
    rating: 4.6,
    reviews: 219,
    price: "from ₹499",
    icon: "📱",
    color: "mint",
    subscribed: true,
    tag: "Authorized store",
    taxonomyTags: ["Sales", "Service", "Mobile phones", "Samsung", "Galaxy S25", "Galaxy A56", "Home appliances", "Samsung", "Bespoke refrigerator", "Bespoke washing machine"],
  },
  {
    name: "Sri Mithuna Samsung Service – Hosur",
    category: "Electronics",
    subcategories: ["Mobile phones"],
    products: [
      { id: "mithuna-screen", name: "Samsung Screen Replacement", description: "Genuine Samsung screen replacement service.", price: 2999, unit: "from" },
      { id: "mithuna-battery", name: "Battery Replacement", description: "Genuine battery replacement for Samsung devices.", price: 999, unit: "from" },
      { id: "mithuna-software", name: "Software Repair & Flash", description: "Software troubleshooting and firmware flashing.", price: 499, unit: "per visit" },
    ],
    description: "Authorized Samsung service center in Indira Nagar, Hosur. Genuine spare parts, warranty repairs and software troubleshooting for all Samsung models.",
    distance: 1.4,
    demoCoordinates: { latitude: 12.727, longitude: 77.833 },
    rating: 4.7,
    reviews: 143,
    price: "from ₹499",
    icon: "🔧",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Service", "Mobile phones", "Samsung", "Galaxy S25", "Galaxy A56", "Phone repair", "Screen & display", "Screen replacement", "Diagnostics", "Phone diagnostics"],
  },
  {
    name: "Zenith PC – Hosur",
    category: "Electronics",
    subcategories: ["Laptops & computers"],
    products: [
      { id: "zenith-gaming-pc", name: "Custom Gaming PC Build", description: "Custom-built gaming desktop per your specs.", price: 45000, unit: "from" },
      { id: "zenith-laptop-repair", name: "Laptop Repair", description: "Hardware and software laptop repair service.", price: 599, unit: "from" },
      { id: "zenith-cctv", name: "CCTV & Network Setup", description: "CCTV camera installation and LAN/WiFi networking.", price: 12000, unit: "from" },
    ],
    description: "Computer hardware store and service center in Hosur. Custom builds, gaming rigs, laptop repair, CCTV, networking and printer solutions.",
    distance: 1.7,
    demoCoordinates: { latitude: 12.729, longitude: 77.821 },
    rating: 4.6,
    reviews: 89,
    price: "from ₹599",
    icon: "🖥️",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Sales", "Service", "Laptops & computers", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Apple", "MacBook Air", "Pavilion", "OmniBook", "IdeaPad"],
  },

  // ── FASHION ──────────────────────────────────────────────────────────────────
  {
    name: "Tanishq Jewellery – By-Pass Road, Hosur",
    category: "Fashion",
    subcategories: ["Jewellery"],
    products: [
      { id: "tanishq-necklace", name: "22K Gold Necklace", description: "Certified 22K gold necklace from Tanishq.", price: 75000, unit: "from" },
      { id: "tanishq-ring", name: "Diamond Solitaire Ring", description: "Certified diamond solitaire ring.", price: 25000, unit: "from" },
      { id: "tanishq-exchange", name: "Old Gold Exchange", description: "Exchange old gold jewellery at fair market value.", price: 0, unit: "free service" },
    ],
    description: "Tanishq by Tata — India's most trusted jewellery brand. Showroom on By-Pass Road, Hosur. Certified gold, diamond and platinum jewellery.",
    distance: 1.9,
    demoCoordinates: { latitude: 12.731, longitude: 77.836 },
    rating: 4.8,
    reviews: 489,
    price: "from ₹25000",
    icon: "💎",
    color: "lavender",
    subscribed: true,
    tag: "Trusted brand",
    taxonomyTags: ["Jewellery", "Traditional jewellery", "Earrings", "Necklaces", "Handcrafted necklaces", "Gold", "Diamond", "Everyday earrings"],
  },
  {
    name: "Raymond – The Complete Man, Hosur",
    category: "Fashion",
    subcategories: ["Clothing", "Tailoring"],
    products: [
      { id: "raymond-fabric", name: "Suit Fabric (2.5m)", description: "Premium Raymond suiting fabric.", price: 3500, unit: "per 2.5m" },
      { id: "raymond-shirt", name: "Readymade Formal Shirt", description: "Ready-to-wear formal shirt.", price: 1299, unit: "per piece" },
      { id: "raymond-suit", name: "Custom Suit Stitching", description: "Bespoke suit stitching service.", price: 2999, unit: "per suit" },
    ],
    description: "Raymond showroom in Hosur. Premium men's suiting fabric, readymade formals and custom tailoring. Corporate and ethnic wear collections.",
    distance: 2.1,
    demoCoordinates: { latitude: 12.733, longitude: 77.825 },
    rating: 4.6,
    reviews: 178,
    price: "from ₹1299",
    icon: "👔",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Clothing", "Men", "Everyday wear", "Shirts & trousers", "Occasion wear", "Ethnic wear", "Tailoring", "Custom stitching", "Women", "Blouse stitching"],
  },
  {
    name: "Planet Fashion – Hosur",
    category: "Fashion",
    subcategories: ["Clothing"],
    products: [
      { id: "planet-jeans", name: "Men's Branded Jeans", description: "Branded jeans for men from top labels.", price: 1499, unit: "from" },
      { id: "planet-ethnic", name: "Women's Ethnic Wear Set", description: "Ethnic wear sets for women.", price: 1999, unit: "from" },
      { id: "planet-kids", name: "Kids Festive Outfit", description: "Festive outfits for children.", price: 899, unit: "from" },
    ],
    description: "Planet Fashion multi-brand apparel store near Post Office Road, Hosur. Top national brands for men, women and kids — casual, formal and ethnic wear.",
    distance: 1.3,
    demoCoordinates: { latitude: 12.723, longitude: 77.829 },
    rating: 4.5,
    reviews: 231,
    price: "from ₹899",
    icon: "🛍️",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Clothing", "Men", "Everyday wear", "Shirts & trousers", "Women", "Kurtas & kurtis", "Sarees & dresses", "Kids", "Everyday wear", "Kids clothing"],
  },
  {
    name: "Bata Footwear – MG Road, Hosur",
    category: "Fashion",
    subcategories: ["Footwear"],
    products: [
      { id: "bata-formal", name: "Men's Formal Shoes", description: "Classic formal shoes for men.", price: 1499, unit: "from" },
      { id: "bata-sandals", name: "Women's Sandals", description: "Comfortable sandals for women.", price: 999, unit: "from" },
      { id: "bata-school", name: "School Shoes", description: "Durable school shoes for children.", price: 699, unit: "from" },
    ],
    description: "Bata footwear store on MG Road, Hosur. Affordable everyday shoes, formal footwear, sandals, slippers and school shoes for the whole family.",
    distance: 1.1,
    demoCoordinates: { latitude: 12.725, longitude: 77.830 },
    rating: 4.4,
    reviews: 312,
    price: "from ₹699",
    icon: "👟",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Footwear", "Shoes", "Formal", "Formal shoes", "Casual", "Everyday sneakers", "Sandals & slippers", "Daily wear", "Sandals"],
  },
  {
    name: "Saree Palace – Nethaji Road, Hosur",
    category: "Fashion",
    subcategories: ["Clothing", "Textiles"],
    products: [
      { id: "saree-cotton", name: "Cotton Saree", description: "Comfortable everyday cotton sarees.", price: 899, unit: "from" },
      { id: "saree-silk", name: "Silk Saree", description: "Elegant silk sarees for occasions.", price: 3500, unit: "from" },
      { id: "saree-handloom", name: "Handloom Dress Material", description: "Authentic handloom dress materials.", price: 750, unit: "from" },
    ],
    description: "Hosur's go-to saree store on Nethaji Road. Vast collection of cotton, silk and handloom sarees for daily wear, festivals and weddings.",
    distance: 0.8,
    demoCoordinates: { latitude: 12.721, longitude: 77.828 },
    rating: 4.6,
    reviews: 267,
    price: "from ₹750",
    icon: "🥻",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Clothing", "Women", "Occasion wear", "Sarees & dresses", "Textiles", "Handloom", "Cotton fabrics", "Dress materials", "Home textiles", "Bed & bath"],
  },

  // ── HOME & FURNITURE ─────────────────────────────────────────────────────────
  {
    name: "Godrej Interio – Bagalur Road, Hosur",
    category: "Home & furniture",
    subcategories: ["Furniture", "Kitchen & storage"],
    products: [
      { id: "godrej-kitchen", name: "Modular Kitchen Setup", description: "Complete modular kitchen design and installation.", price: 85000, unit: "from" },
      { id: "godrej-wardrobe", name: "Sliding Wardrobe", description: "Custom sliding door wardrobe.", price: 35000, unit: "from" },
      { id: "godrej-chair", name: "Office Chair", description: "Ergonomic office chair.", price: 8500, unit: "from" },
    ],
    description: "Godrej Interio showroom on Bagalur Road, Hosur. Modular kitchens, wardrobes, beds, sofas and ergonomic office furniture with installation.",
    distance: 2.8,
    demoCoordinates: { latitude: 12.737, longitude: 77.827 },
    rating: 4.6,
    reviews: 203,
    price: "from ₹8500",
    icon: "🪑",
    color: "mint",
    subscribed: true,
    tag: "Trusted brand",
    taxonomyTags: ["Furniture", "Bedroom", "Storage", "Wardrobes", "Kitchen & storage", "Kitchen fittings", "Modular kitchen cabinets", "Living room", "Seating", "Sofas & chairs"],
  },
  {
    name: "Royaloak Furniture – Hosur",
    category: "Home & furniture",
    subcategories: ["Furniture", "Home decor"],
    products: [
      { id: "royaloak-sofa", name: "5-Seater Sofa Set", description: "Premium 5-seater fabric or leather sofa set.", price: 32000, unit: "from" },
      { id: "royaloak-bed", name: "King Size Bed", description: "Solid wood king-size bed frame.", price: 18000, unit: "from" },
      { id: "royaloak-dining", name: "Dining Table (6-seater)", description: "6-seater dining table with chairs.", price: 22000, unit: "from" },
    ],
    description: "Royaloak large-format furniture showroom near Hosur. Wide range of living room, bedroom and dining furniture with free delivery and installation.",
    distance: 3.0,
    demoCoordinates: { latitude: 12.739, longitude: 77.829 },
    rating: 4.5,
    reviews: 318,
    price: "from ₹18000",
    icon: "🛋️",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Furniture", "Living room", "Seating", "Sofas & chairs", "Bedroom", "Beds", "Beds & headboards", "Dining", "Dining sets", "Dining tables & chairs"],
  },
  {
    name: "Surya Home Decor & Interior – Hosur",
    category: "Home & furniture",
    subcategories: ["Home decor", "Interior design"],
    products: [
      { id: "surya-consult", name: "Interior Design Consultation", description: "Free home interior design consultation.", price: 0, unit: "free" },
      { id: "surya-ceiling", name: "False Ceiling Design & Fit", description: "False ceiling design and installation.", price: 120, unit: "per sqft" },
      { id: "surya-wall", name: "Wall Art & Decor Panels", description: "Decorative wall art and paneling.", price: 2500, unit: "from" },
    ],
    description: "Full-home interior design studio in Hosur. False ceilings, modular furniture, lighting, wall paneling and 3D design planning from ₹0 consultation.",
    distance: 2.2,
    demoCoordinates: { latitude: 12.735, longitude: 77.832 },
    rating: 4.8,
    reviews: 142,
    price: "from ₹120/sqft",
    icon: "🏠",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Interior design", "Home planning", "Room design", "Design consultation", "Room makeover", "Space planning", "Home decor", "Wall decor", "Art & hangings", "Lighting", "Indoor lighting"],
  },
  {
    name: "Nilkamal Homes – Hosur",
    category: "Home & furniture",
    subcategories: ["Furniture", "Kitchen & storage"],
    products: [
      { id: "nilkamal-cabinet", name: "Plastic Storage Cabinet", description: "Durable plastic storage cabinet.", price: 3500, unit: "from" },
      { id: "nilkamal-study", name: "Study Table", description: "Study table for kids and adults.", price: 4999, unit: "from" },
      { id: "nilkamal-chairs", name: "Plastic Chair (set of 4)", description: "Set of 4 durable plastic chairs.", price: 2800, unit: "per set" },
    ],
    description: "Nilkamal Homes store near Hosur. Affordable plastic and wooden furniture, storage solutions, kids furniture and home essentials.",
    distance: 3.2,
    demoCoordinates: { latitude: 12.740, longitude: 77.820 },
    rating: 4.3,
    reviews: 187,
    price: "from ₹2800",
    icon: "📦",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Furniture", "Living room", "Tables", "Coffee & side tables", "Kitchen & storage", "Storage solutions", "Shelving", "Storage racks", "Repairs", "Furniture assembly"],
  },

  // ── HEALTH & WELLNESS ────────────────────────────────────────────────────────
  {
    name: "Kauvery Hospital – Hosur",
    category: "Health & wellness",
    subcategories: ["Clinics", "Dental care", "Physiotherapy"],
    products: [
      { id: "kauvery-opd", name: "General OPD Consultation", description: "Walk-in general physician consultation.", price: 300, unit: "per visit" },
      { id: "kauvery-dental", name: "Dental Check-up & X-ray", description: "Comprehensive dental check-up with X-ray.", price: 500, unit: "per visit" },
      { id: "kauvery-physio", name: "Physiotherapy Session", description: "Guided physiotherapy rehabilitation session.", price: 400, unit: "per session" },
    ],
    description: "NABH-accredited 125-bed multi-specialty Kauvery Hospital in Shanthi Nagar, Hosur. Emergency, dental, ophthalmology, physiotherapy, orthopaedics and ICU.",
    distance: 1.5,
    demoCoordinates: { latitude: 12.726, longitude: 77.835 },
    rating: 4.7,
    reviews: 423,
    price: "from ₹300",
    icon: "🏥",
    color: "peach",
    subscribed: true,
    tag: "NABH accredited",
    taxonomyTags: ["Clinics", "General care", "Appointments", "Doctor consultation", "Paediatrics", "Dental care", "Dental clinics", "Treatment", "Physiotherapy", "Mobility care", "Eye care"],
  },
  {
    name: "SBS Hospital – Hosur",
    category: "Health & wellness",
    subcategories: ["Clinics", "Physiotherapy"],
    products: [
      { id: "sbs-ortho", name: "Orthopaedic Consultation", description: "Specialist orthopaedic doctor consultation.", price: 350, unit: "per visit" },
      { id: "sbs-xray", name: "Bone & Joint X-ray", description: "Digital X-ray for bone and joint assessment.", price: 400, unit: "per scan" },
      { id: "sbs-physio", name: "Physiotherapy & Rehab Session", description: "Physical therapy and rehabilitation session.", price: 500, unit: "per session" },
    ],
    description: "SBS Hospital Pvt. Ltd. on Tank Street, Hosur. Multi-specialty care with orthopaedic specialization, emergency, general surgery and rehabilitation.",
    distance: 1.0,
    demoCoordinates: { latitude: 12.722, longitude: 77.830 },
    rating: 4.6,
    reviews: 287,
    price: "from ₹350",
    icon: "🩺",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Clinics", "General care", "Appointments", "Doctor consultation", "Physiotherapy", "Mobility care", "Assessment", "Physiotherapy assessment", "Physiotherapy session"],
  },
  {
    name: "Apollo Dental Clinic – Hosur",
    category: "Health & wellness",
    subcategories: ["Dental care"],
    products: [
      { id: "apollo-implant-consult", name: "Dental Implant Consultation", description: "Specialist consultation for dental implants.", price: 500, unit: "per visit" },
      { id: "apollo-rct", name: "Root Canal Treatment", description: "Complete root canal treatment.", price: 6000, unit: "per tooth" },
      { id: "apollo-whitening", name: "Teeth Whitening Session", description: "Professional teeth whitening treatment.", price: 3500, unit: "per session" },
    ],
    description: "Apollo Dental Clinic on Krishnagiri Bypass Road, Hosur. Implants, root canals, orthodontics, whitening and complete dental care under the Apollo brand.",
    distance: 2.4,
    demoCoordinates: { latitude: 12.734, longitude: 77.840 },
    rating: 4.7,
    reviews: 198,
    price: "from ₹500",
    icon: "🦷",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Dental care", "Dental clinics", "Check-ups", "Dental consultation", "Treatment", "Cleaning & fillings"],
  },
  {
    name: "Arokyam Lungs Care Centre – Hosur",
    category: "Health & wellness",
    subcategories: ["Clinics"],
    products: [
      { id: "arokyam-consult", name: "Pulmonology Consultation", description: "Specialist consultation for respiratory conditions.", price: 400, unit: "per visit" },
      { id: "arokyam-spirometry", name: "Spirometry Lung Function Test", description: "Lung capacity and function assessment.", price: 800, unit: "per test" },
      { id: "arokyam-asthma", name: "Asthma Treatment Plan", description: "Personalized asthma management plan.", price: 1200, unit: "per plan" },
    ],
    description: "Specialized respiratory and lungs care clinic near Avalapalli Hudco, Hosur. Treating asthma, COPD, bronchitis, sleep apnoea and lung infections.",
    distance: 1.8,
    demoCoordinates: { latitude: 12.730, longitude: 77.837 },
    rating: 4.8,
    reviews: 89,
    price: "from ₹400",
    icon: "🫁",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Clinics", "General care", "Appointments", "Doctor consultation", "Eye care", "Appointments", "Eye examination"],
  },

  // ── SPORTS & FITNESS ─────────────────────────────────────────────────────────
  {
    name: "Ketone Fitness – Shanthi Nagar, Hosur",
    category: "Sports & fitness",
    subcategories: ["Gyms & fitness centers", "Personal training"],
    products: [
      { id: "ketone-monthly", name: "Monthly Gym Membership", description: "Full gym access for one month.", price: 1000, unit: "per month" },
      { id: "ketone-pt", name: "Personal Training (10 sessions)", description: "10 one-on-one personal training sessions.", price: 4000, unit: "per package" },
      { id: "ketone-bca", name: "Body Composition Analysis", description: "Detailed body fat and muscle composition report.", price: 300, unit: "per test" },
    ],
    description: "Ketone Fitness gym in Shanthi Nagar, Denkanikottai Road, Hosur. Modern equipment, personal training and body transformation programs.",
    distance: 1.4,
    demoCoordinates: { latitude: 12.727, longitude: 77.838 },
    rating: 4.7,
    reviews: 198,
    price: "from ₹1000",
    icon: "💪",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Sports & fitness", "Gyms & fitness centers", "Gym membership", "Weight training", "Strength conditioning", "Personal training", "1-on-1 coaching", "Transformation"],
  },
  {
    name: "H&T Fitness – Navadhi, Hosur",
    category: "Sports & fitness",
    subcategories: ["Gyms & fitness centers"],
    products: [
      { id: "ht-monthly", name: "Monthly Unisex Membership", description: "Monthly gym access for all genders.", price: 900, unit: "per month" },
      { id: "ht-quarterly", name: "Quarterly Membership", description: "3-month gym membership at a discount.", price: 2400, unit: "per quarter" },
      { id: "ht-cardio", name: "Cardio & Abs Package", description: "Focused cardio and core training package.", price: 1500, unit: "per month" },
    ],
    description: "H&T Fitness — popular unisex gym on Denkanikottai Main Road, Navadhi, Hosur. Free weights, machines, cardio and group fitness sessions.",
    distance: 2.0,
    demoCoordinates: { latitude: 12.732, longitude: 77.839 },
    rating: 4.6,
    reviews: 154,
    price: "from ₹900",
    icon: "🏋️",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Sports & fitness", "Gyms & fitness centers", "Gym membership", "Weight training", "CrossFit & functional", "HIIT workouts", "Dance fitness", "Zumba studios"],
  },
  {
    name: "Royal Wellfit Health Club & Pool – Hosur",
    category: "Sports & fitness",
    subcategories: ["Gyms & fitness centers", "Swimming & aquatics"],
    products: [
      { id: "rwf-gym-pool", name: "Monthly Gym + Pool Access", description: "Combined gym and swimming pool monthly membership.", price: 2500, unit: "per month" },
      { id: "rwf-swim-lessons", name: "Swimming Lessons (monthly)", description: "Professional swimming coaching for all levels.", price: 1500, unit: "per month" },
      { id: "rwf-annual", name: "Annual Membership", description: "Full-year all-access membership.", price: 18000, unit: "per year" },
    ],
    description: "Royal Wellfit Health Club near Kumudepalli, Hosur. Full-scale gym, heated swimming pool, steam room and multi-purpose sports hall.",
    distance: 3.5,
    demoCoordinates: { latitude: 12.741, longitude: 77.824 },
    rating: 4.8,
    reviews: 267,
    price: "from ₹1500",
    icon: "🏊",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Sports & fitness", "Gyms & fitness centers", "Gym membership", "Swimming & aquatics", "Swimming pools", "Coaching", "Swimming lessons", "Personal training"],
  },
  {
    name: "Eagles Sports Club – Bagalur Circle, Hosur",
    category: "Sports & fitness",
    subcategories: ["Sports coaching", "Turf & facility rental"],
    products: [
      { id: "eagles-volleyball", name: "Volleyball Coaching (monthly)", description: "Professional volleyball coaching for all ages.", price: 1200, unit: "per month" },
      { id: "eagles-football", name: "Football Coaching (monthly)", description: "Structured football training program.", price: 1500, unit: "per month" },
      { id: "eagles-camp", name: "Multi-sport Summer Camp", description: "Multi-sport summer camp for kids.", price: 3500, unit: "per camp" },
    ],
    description: "Eagles Sports Club near Bagalur Circle, Hosur. Professional volleyball, football and athletics coaching. Summer camps and inter-school tournaments.",
    distance: 4.0,
    demoCoordinates: { latitude: 12.743, longitude: 77.826 },
    rating: 4.7,
    reviews: 143,
    price: "from ₹1200",
    icon: "🏐",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Sports coaching", "Badminton", "Coaching academies", "Cricket", "Net practice & coaching", "Turf & facility rental", "Box cricket turf", "Hourly rental"],
  },
  {
    name: "Little England Badminton Academy – Hosur",
    category: "Sports & fitness",
    subcategories: ["Sports coaching", "Turf & facility rental"],
    products: [
      { id: "leba-coaching", name: "Badminton Coaching (monthly)", description: "Professional badminton coaching for all ages.", price: 1400, unit: "per month" },
      { id: "leba-court", name: "Court Booking (1 hr)", description: "Hourly badminton court rental.", price: 280, unit: "per hour" },
      { id: "leba-kids", name: "Kids Shuttle Program", description: "Monthly badminton program for children.", price: 1000, unit: "per month" },
    ],
    description: "Little England Badminton Academy — well-lit indoor courts and professional coaches for kids and adults in Hosur. Flexible batch timings.",
    distance: 2.7,
    demoCoordinates: { latitude: 12.738, longitude: 77.835 },
    rating: 4.7,
    reviews: 128,
    price: "from ₹280",
    icon: "🏸",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Sports coaching", "Badminton", "Coaching academies", "Badminton coaching", "Turf & facility rental", "Badminton courts", "Indoor court rental", "Court booking"],
  },
  {
    name: "Prabhu's Turf 24/7 – Hosur",
    category: "Sports & fitness",
    subcategories: ["Turf & facility rental"],
    products: [
      { id: "prabhu-football", name: "Football Turf (1 hr)", description: "Synthetic football turf — hourly rental.", price: 700, unit: "per hour" },
      { id: "prabhu-box-cricket", name: "Box Cricket (1 hr)", description: "Box cricket turf — hourly rental.", price: 550, unit: "per hour" },
      { id: "prabhu-night", name: "Night-slot Turf (10 PM–2 AM)", description: "Floodlit turf — late night slot.", price: 900, unit: "per hour" },
    ],
    description: "24/7 multi-sport turf facility in Hosur. Synthetic football, box cricket and kabaddi courts available round the clock with floodlights.",
    distance: 3.1,
    demoCoordinates: { latitude: 12.740, longitude: 77.833 },
    rating: 4.5,
    reviews: 221,
    price: "from ₹550",
    icon: "⚽",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Turf & facility rental", "Box cricket turf", "Hourly rental", "Turf booking", "Badminton courts", "Indoor court rental", "Sports coaching"],
  },
  {
    name: "Orien Fitness – Muneeswara Nagar, Hosur",
    category: "Sports & fitness",
    subcategories: ["Gyms & fitness centers"],
    products: [
      { id: "orien-monthly", name: "Monthly Membership", description: "Full gym access for one month.", price: 800, unit: "per month" },
      { id: "orien-zumba", name: "Zumba Classes (monthly)", description: "Monthly Zumba dance fitness classes.", price: 900, unit: "per month" },
      { id: "orien-combo", name: "Yoga + Gym Combo", description: "Combined yoga and gym monthly package.", price: 1500, unit: "per month" },
    ],
    description: "Orien Fitness unisex gym near Muneeswara Nagar, Hosur. Strength training, Zumba, aerobics and yoga — all under one roof.",
    distance: 1.6,
    demoCoordinates: { latitude: 12.729, longitude: 77.836 },
    rating: 4.5,
    reviews: 109,
    price: "from ₹800",
    icon: "🧘",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Sports & fitness", "Gyms & fitness centers", "Gym membership", "Dance fitness", "Zumba studios", "Cardio dance", "Yoga & pilates", "Yoga studios"],
  },

  // ── TRAVEL ───────────────────────────────────────────────────────────────────
  {
    name: "A1 Call Taxi – Hosur",
    category: "Travel",
    subcategories: ["Local transport"],
    products: [
      { id: "a1-airport", name: "Airport Transfer to Bengaluru", description: "Cab transfer to Bengaluru Kempegowda International Airport.", price: 1200, unit: "per trip" },
      { id: "a1-outstation", name: "Outstation Day Trip", description: "Full-day outstation cab booking.", price: 2500, unit: "per day" },
      { id: "a1-local", name: "Local City Ride", description: "Local city cab ride within Hosur.", price: 199, unit: "from" },
    ],
    description: "A1 Call Taxi — 24/7 reliable cab service in Hosur. Airport drops to Bengaluru KIA, outstation tours, corporate travel and local rides.",
    distance: 0.7,
    demoCoordinates: { latitude: 12.721, longitude: 77.827 },
    rating: 4.7,
    reviews: 398,
    price: "from ₹199",
    icon: "🚖",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Local transport", "Airport rides", "Cars", "Airport transfer", "City rides", "Car rentals", "Self drive", "Daily rental", "Car hire", "Tours & experiences"],
  },
  {
    name: "Red Taxi – Hosur",
    category: "Travel",
    subcategories: ["Local transport"],
    products: [
      { id: "red-mini", name: "Mini Car Ride (local)", description: "Affordable mini car for local Hosur rides.", price: 150, unit: "from" },
      { id: "red-sedan", name: "Sedan Outstation", description: "Sedan car for outstation trips.", price: 3000, unit: "from" },
      { id: "red-pink", name: "Pink Taxi (women-only)", description: "Women-only cab with women driver.", price: 200, unit: "from" },
    ],
    description: "Red Taxi fleet service in Hosur. Sedans, mini cars and tempo travellers. Unique Pink Taxi option with women drivers for women passengers.",
    distance: 0.9,
    demoCoordinates: { latitude: 12.723, longitude: 77.832 },
    rating: 4.6,
    reviews: 287,
    price: "from ₹150",
    icon: "🚕",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Local transport", "Airport rides", "Cars", "Airport transfer", "City rides", "Two-wheelers", "Local bike rental", "Bus & rail services"],
  },
  {
    name: "Grand Royal Tours & Travel – Hosur",
    category: "Travel",
    subcategories: ["Travel agents", "Tours & experiences"],
    products: [
      { id: "grand-ooty", name: "Ooty & Kodaikanal Package (3N/4D)", description: "3 nights 4 days Ooty & Kodaikanal holiday package.", price: 8500, unit: "per person" },
      { id: "grand-kerala", name: "Kerala Backwaters Tour (5N/6D)", description: "5 nights 6 days Kerala backwaters tour.", price: 22000, unit: "per person" },
      { id: "grand-visa", name: "International Visa Assistance", description: "Visa application assistance for international travel.", price: 2500, unit: "per application" },
    ],
    description: "Grand Royal Tours in Hosur. Domestic and international holiday packages, visa assistance, hotel bookings and corporate travel management.",
    distance: 1.2,
    demoCoordinates: { latitude: 12.724, longitude: 77.826 },
    rating: 4.6,
    reviews: 156,
    price: "from ₹2500",
    icon: "✈️",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Travel agents", "Holiday planning", "Domestic trips", "Custom itinerary", "International trips", "Travel planning", "Tours & experiences", "Local experiences", "Guided tours"],
  },
  {
    name: "Nanban Tours & Travels – Hosur",
    category: "Travel",
    subcategories: ["Travel agents", "Tours & experiences"],
    products: [
      { id: "nanban-tirupati", name: "Tirupati Darshan Package", description: "Tirupati pilgrimage package with accommodation.", price: 2800, unit: "per person" },
      { id: "nanban-rameswaram", name: "Rameswaram Tour (2N/3D)", description: "2 nights 3 days Rameswaram pilgrimage tour.", price: 5500, unit: "per person" },
      { id: "nanban-bus", name: "Bus Ticket Booking", description: "Intercity bus ticket booking assistance.", price: 50, unit: "per booking" },
    ],
    description: "Nanban Tours and Travels in Hosur. Pilgrimage tours, family holiday packages, bus and train ticket booking and group travel coordination.",
    distance: 1.4,
    demoCoordinates: { latitude: 12.726, longitude: 77.833 },
    rating: 4.5,
    reviews: 198,
    price: "from ₹50",
    icon: "🗺️",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Travel agents", "Holiday planning", "Domestic trips", "Custom itinerary", "Bus & rail services", "Bus tickets", "Intercity travel", "Bus booking support", "Tours & experiences"],
  },
  {
    name: "Grand Continent Hosur (Sarovar Portico)",
    category: "Travel",
    subcategories: ["Stays"],
    products: [
      { id: "gc-standard", name: "Standard Room", description: "Standard hotel room with all amenities.", price: 2500, unit: "per night" },
      { id: "gc-superior", name: "Superior Room with Breakfast", description: "Superior room with complimentary breakfast.", price: 3200, unit: "per night" },
      { id: "gc-conference", name: "Conference Hall (full day)", description: "Full-day conference hall rental.", price: 35000, unit: "per day" },
    ],
    description: "Grand Continent Hosur — Sarovar Portico affiliated hotel. Centrally located, ideal for corporate and family travelers. Restaurant, conference and banquet facilities.",
    distance: 1.7,
    demoCoordinates: { latitude: 12.729, longitude: 77.834 },
    rating: 4.6,
    reviews: 341,
    price: "from ₹2500",
    icon: "🏨",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Stays", "Hotels", "Family stays", "Hotel room booking", "Guest houses", "Short stays", "Guest house booking", "Tours & experiences"],
  },
  {
    name: "Hotel Hills – Hosur",
    category: "Travel",
    subcategories: ["Stays"],
    products: [
      { id: "hills-standard", name: "Standard Room", description: "Clean and comfortable standard room.", price: 1800, unit: "per night" },
      { id: "hills-double", name: "Double Occupancy Room", description: "Room for two with double bed.", price: 2200, unit: "per night" },
      { id: "hills-dinner", name: "Room + Dinner Combo", description: "Room with complimentary dinner for two.", price: 2800, unit: "per night" },
    ],
    description: "Hotel Hills — reliable mid-range hotel near Hosur Bus Stand. Clean rooms, in-house restaurant and easy access to all major commercial areas.",
    distance: 0.5,
    demoCoordinates: { latitude: 12.720, longitude: 77.828 },
    rating: 4.3,
    reviews: 224,
    price: "from ₹1800",
    icon: "🛏️",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Stays", "Hotels", "Family stays", "Hotel room booking", "Guest houses", "Short stays", "Guest house booking"],
  },

  // ── ENTERTAINMENT ─────────────────────────────────────────────────────────────
  {
    name: "Lakshmi Cinemas – Hosur",
    category: "Entertainment",
    subcategories: ["Movies & cinema"],
    products: [
      { id: "lakshmi-regular", name: "Regular Ticket", description: "Standard cinema seat.", price: 120, unit: "per ticket" },
      { id: "lakshmi-premium", name: "Premium Seat", description: "Premium recliner seat.", price: 180, unit: "per ticket" },
      { id: "lakshmi-combo", name: "Movie + Popcorn Combo", description: "Ticket with large popcorn and drink.", price: 250, unit: "per combo" },
    ],
    description: "Lakshmi Cinemas in Hosur — Phase VII NHS. RGB Laser projection, QSC Dolby Atmos sound. Screening latest Tamil, Telugu, Hindi and English films.",
    distance: 1.3,
    demoCoordinates: { latitude: 12.725, longitude: 77.831 },
    rating: 4.6,
    reviews: 534,
    price: "from ₹120",
    icon: "🎬",
    color: "peach",
    subscribed: true,
    tag: "Dolby Atmos",
    taxonomyTags: ["Movies & cinema", "Cinema", "Show times", "Movie tickets", "Home viewing", "Equipment hire", "Projector rental"],
  },
  {
    name: "Grand Cinemas – Thally Road, Hosur",
    category: "Entertainment",
    subcategories: ["Movies & cinema"],
    products: [
      { id: "grand-standard", name: "Standard Ticket", description: "Standard cinema seat.", price: 110, unit: "per ticket" },
      { id: "grand-couple", name: "Couple Seat", description: "Special couple sofa seat.", price: 280, unit: "per pair" },
      { id: "grand-3d", name: "3D Movie Ticket", description: "3D movie experience ticket.", price: 200, unit: "per ticket" },
    ],
    description: "Grand Cinemas near Karnur Bus Stop, Thally Road, Hosur. 4K projection, Dolby Atmos and recliner seating for a premium movie experience.",
    distance: 2.9,
    demoCoordinates: { latitude: 12.739, longitude: 77.831 },
    rating: 4.7,
    reviews: 412,
    price: "from ₹110",
    icon: "🎥",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Movies & cinema", "Cinema", "Show times", "Movie tickets"],
  },
  {
    name: "Hosur Music & Arts Academy",
    category: "Entertainment",
    subcategories: ["Music", "Classes & workshops"],
    products: [
      { id: "hma-carnatic", name: "Carnatic Vocal Class (monthly)", description: "Monthly Carnatic music vocal training.", price: 800, unit: "per month" },
      { id: "hma-instrument", name: "Guitar / Keyboard Lessons", description: "Monthly guitar or keyboard lessons.", price: 1000, unit: "per month" },
      { id: "hma-art", name: "Drawing & Painting Class", description: "Monthly drawing and painting classes.", price: 700, unit: "per month" },
    ],
    description: "Music and arts learning center in Hosur. Carnatic vocal, keyboard, guitar, tabla, drawing and painting classes for kids and adults.",
    distance: 1.6,
    demoCoordinates: { latitude: 12.728, longitude: 77.840 },
    rating: 4.8,
    reviews: 87,
    price: "from ₹700",
    icon: "🎵",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Music", "Music lessons", "Instruments", "Music classes", "Live music", "Local artists", "Classes & workshops", "Arts & crafts", "Creative classes", "Craft workshop"],
  },
  {
    name: "Hosur Weekend Haat – Cultural Events",
    category: "Entertainment",
    subcategories: ["Events", "Classes & workshops"],
    products: [
      { id: "haat-event", name: "Event Planning (from)", description: "End-to-end event planning and coordination.", price: 5000, unit: "from" },
      { id: "haat-photo", name: "Photography Coverage", description: "Professional event photography.", price: 8000, unit: "per event" },
      { id: "haat-workshop", name: "Workshop Hosting (half day)", description: "Venue and coordination for half-day workshops.", price: 3000, unit: "per session" },
    ],
    description: "Community-run events platform in Hosur. Weekend haats, cultural workshops, local artisan expos and corporate team events coordination.",
    distance: 2.1,
    demoCoordinates: { latitude: 12.733, longitude: 77.827 },
    rating: 4.6,
    reviews: 76,
    price: "from ₹3000",
    icon: "🎪",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Events", "Community events", "Workshops", "Weekend workshop", "Celebrations", "Private events", "Event planning", "Classes & workshops", "Dance", "Dance classes"],
  },
  {
    name: "Hosur Gaming Zone – Arcade & VR",
    category: "Entertainment",
    subcategories: ["Gaming", "Outdoor activities"],
    products: [
      { id: "hgz-vr", name: "VR Gaming Session (30 min)", description: "30-minute virtual reality gaming experience.", price: 200, unit: "per session" },
      { id: "hgz-arcade", name: "Arcade Games Pass (1 hr)", description: "1-hour unlimited arcade games pass.", price: 150, unit: "per hour" },
      { id: "hgz-group", name: "Group Gaming Package", description: "Group gaming package for up to 5 players.", price: 500, unit: "per group" },
    ],
    description: "Indoor gaming and arcade zone in Hosur. VR headset games, racing simulators, arcade machines and skill games for kids and adults.",
    distance: 2.4,
    demoCoordinates: { latitude: 12.735, longitude: 77.836 },
    rating: 4.5,
    reviews: 198,
    price: "from ₹150",
    icon: "🎮",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Gaming", "Games & recreation", "Indoor activities", "Game session", "Outdoor activities", "Family activities", "Local outings", "Activity booking"],
  },

  // ── EVERYDAY SERVICES ────────────────────────────────────────────────────────
  {
    name: "Hope Home Care – Hosur",
    category: "Everyday services",
    subcategories: ["Plumbing", "Electrical", "Cleaning"],
    products: [
      { id: "hope-plumbing", name: "Plumbing Emergency Call-out", description: "Emergency plumbing repair visit.", price: 299, unit: "from" },
      { id: "hope-electrical", name: "Fan & Light Installation", description: "Ceiling fan and light fixture installation.", price: 199, unit: "per unit" },
      { id: "hope-painting", name: "Home Painting (per room)", description: "Full room painting with emulsion paint.", price: 3500, unit: "per room" },
    ],
    description: "Hope Home Care — multi-skilled home service professionals in Hosur. Plumbing, electrical, painting, carpentry and general home maintenance.",
    distance: 1.1,
    demoCoordinates: { latitude: 12.723, longitude: 77.834 },
    rating: 4.6,
    reviews: 189,
    price: "from ₹199",
    icon: "🏠",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Plumbing", "Home plumbing", "Repairs", "Leak repair", "Electrical", "Home electrical", "Installation", "Lighting installation", "Cleaning", "Home cleaning"],
  },
  {
    name: "Vijay Home Services – Hosur",
    category: "Everyday services",
    subcategories: ["Appliance repair", "Cleaning"],
    products: [
      { id: "vijay-washing", name: "Washing Machine Repair", description: "Doorstep washing machine repair.", price: 399, unit: "from" },
      { id: "vijay-fridge", name: "Refrigerator Service", description: "Refrigerator gas refill and full service.", price: 499, unit: "from" },
      { id: "vijay-chimney", name: "Chimney & Exhaust Fan Cleaning", description: "Kitchen chimney and exhaust fan deep clean.", price: 349, unit: "per unit" },
    ],
    description: "Vijay Home Services — doorstep appliance repair and home cleaning in Hosur. Washing machines, fridges, chimneys, RO filters and microwave repair.",
    distance: 1.3,
    demoCoordinates: { latitude: 12.725, longitude: 77.836 },
    rating: 4.7,
    reviews: 234,
    price: "from ₹349",
    icon: "🔨",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Appliance repair", "Kitchen appliances", "Repair", "Refrigerator service", "Laundry appliances", "Repair", "Washing machine service", "Cleaning", "Home cleaning", "Kitchen cleaning"],
  },
  {
    name: "Sri Balaji Pest Control – Hosur",
    category: "Everyday services",
    subcategories: ["Home services"],
    products: [
      { id: "balaji-cockroach", name: "Cockroach Treatment", description: "Professional cockroach eradication treatment.", price: 499, unit: "per session" },
      { id: "balaji-termite", name: "Termite Treatment (per room)", description: "Anti-termite chemical treatment.", price: 999, unit: "per room" },
      { id: "balaji-bedbug", name: "Bed Bug Elimination", description: "Complete bed bug treatment and follow-up.", price: 1299, unit: "per session" },
    ],
    description: "Professional pest control service covering all of Hosur. Government-certified chemicals, safe for children and pets. Annual AMC packages available.",
    distance: 1.9,
    demoCoordinates: { latitude: 12.731, longitude: 77.838 },
    rating: 4.7,
    reviews: 312,
    price: "from ₹499",
    icon: "🐛",
    color: "butter",
    subscribed: true,
    taxonomyTags: ["Home services", "Pest control", "Treatment", "Home pest treatment", "Professional services", "Consulting", "Local experts"],
  },
  {
    name: "Hosur Professional Painters & Carpenters",
    category: "Everyday services",
    subcategories: ["Home services", "Plumbing"],
    products: [
      { id: "hpc-painting", name: "Room Painting (2 coats emulsion)", description: "Two-coat emulsion painting for one room.", price: 3500, unit: "per room" },
      { id: "hpc-ceiling", name: "False Ceiling (per sqft)", description: "PVC or gypsum false ceiling installation.", price: 85, unit: "per sqft" },
      { id: "hpc-furniture", name: "Furniture Repair & Polish", description: "Wooden furniture repair and polishing.", price: 1500, unit: "from" },
    ],
    description: "Professional painters, carpenters and false ceiling contractors in Hosur. Home painting, furniture repair, false ceilings and waterproofing.",
    distance: 2.3,
    demoCoordinates: { latitude: 12.733, longitude: 77.822 },
    rating: 4.5,
    reviews: 143,
    price: "from ₹85/sqft",
    icon: "🪣",
    color: "peach",
    subscribed: true,
    taxonomyTags: ["Home services", "Gardening", "Garden care", "Garden maintenance", "Professional services", "Consulting", "Local experts", "Initial consultation", "Appliance repair"],
  },
  {
    name: "Hosur CA & Tax Services",
    category: "Everyday services",
    subcategories: ["Professional services"],
    products: [
      { id: "hosur-ca-itr", name: "ITR Filing (individual)", description: "Income tax return filing for individuals.", price: 999, unit: "per filing" },
      { id: "hosur-ca-gst", name: "GST Registration", description: "GST registration and setup for businesses.", price: 1999, unit: "per registration" },
      { id: "hosur-ca-accounting", name: "Business Accounting (monthly)", description: "Monthly bookkeeping and accounting service.", price: 3500, unit: "per month" },
    ],
    description: "Chartered accountants and tax consultants in Hosur. ITR filing, GST registration, business accounting, audit and company registration services.",
    distance: 0.8,
    demoCoordinates: { latitude: 12.721, longitude: 77.826 },
    rating: 4.8,
    reviews: 167,
    price: "from ₹999",
    icon: "📊",
    color: "lavender",
    subscribed: true,
    taxonomyTags: ["Professional services", "Accounting", "Small business", "Bookkeeping support", "Consulting", "Local experts", "Initial consultation"],
  },
  {
    name: "Hosur Event Photography & Videography",
    category: "Everyday services",
    subcategories: ["Professional services"],
    products: [
      { id: "hepv-wedding", name: "Wedding Photography (full day)", description: "Full-day wedding photography and editing.", price: 25000, unit: "per event" },
      { id: "hepv-corporate", name: "Corporate Event Photography", description: "Professional corporate event photography.", price: 8000, unit: "per event" },
      { id: "hepv-baby", name: "Baby / Birthday Shoot", description: "Studio or outdoor baby and birthday photography.", price: 5000, unit: "per session" },
    ],
    description: "Professional photography and videography services in Hosur. Wedding, corporate events, product shoots, baby photography and drone videography.",
    distance: 1.5,
    demoCoordinates: { latitude: 12.727, longitude: 77.822 },
    rating: 4.9,
    reviews: 198,
    price: "from ₹5000",
    icon: "📸",
    color: "mint",
    subscribed: true,
    taxonomyTags: ["Professional services", "Photography", "Events", "Event photography", "Consulting", "Local experts"],
  },

];

const emptyDemoData: DemoData = {
  favorites: [],
  recentSearches: [],
  enquiries: [],
  events: [],
  checkouts: [],
  businesses: initialBusinesses,
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
  const [demoData, setDemoData] = useState(emptyDemoData);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState<Coordinates | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [enquiryProduct, setEnquiryProduct] = useState<{ business: Business; product: Product } | null>(null);
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

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return businesses.filter((business) => {
      const categoryMatch = category === "All" || business.category === category || (business.categories || []).includes(category);
      const listingText = `${business.name} ${business.category} ${(business.categories || []).join(" ")} ${business.subcategories.join(" ")} ${(business.businessModes || []).join(" ")} ${(business.vehicleTypes || []).join(" ")} ${(business.vehicleMakes || []).join(" ")} ${(business.vehicleModels || []).join(" ")} ${(business.taxonomyTags || []).join(" ")} ${business.description} ${business.products.map((product) => `${product.name} ${product.description}`).join(" ")}`.toLowerCase();
      const taxonomyTerms = new Set((business.taxonomyTags || []).map((term) => term.toLowerCase()));
      const taxonomyMatch = categoryPath.every((term) => taxonomyTerms.has(term.toLowerCase()) || listingText.includes(term.toLowerCase()));
      const searchMatch =
        !search ||
        `${business.name} ${business.category} ${business.description} ${business.products.map((product) => `${product.name} ${product.description}`).join(" ")}`.toLowerCase().includes(search);
      return categoryMatch && taxonomyMatch && searchMatch && businessDistance(business) <= radius && business.subscribed;
    });
  }, [businesses, category, categoryPath, query, radius, locationCoordinates]);

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

  function searchNearby() {
    const term = query.trim();
    if (term) {
      setDemoData((current) => ({ ...current, recentSearches: [term, ...current.recentSearches.filter((item) => item !== term)].slice(0, 8) }));
      recordEvent("Customer search performed");
    }
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
  }

  function addProduct(businessName: string, product: Omit<Product, "id">) {
    const newProduct = { ...product, id: `${Date.now()}-${Math.random()}` };
    setDemoData((current) => ({
      ...current,
      businesses: current.businesses.map((business, index) =>
        business.name === businessName ? { ...business, products: [...business.products, newProduct] } : business,
      ),
    }));
    recordEvent("Business catalogue updated");
    showNotice("Product added to this browser's demo catalogue.");
  }

  function submitCheckout(businessName: string, plan: string, paymentMethod: string) {
    const checkout: CheckoutRequest = {
      businessName,
      plan,
      paymentMethod,
      createdAt: new Date().toISOString(),
      status: "Not processed",
    };
    setDemoData((current) => ({ ...current, checkouts: [checkout, ...current.checkouts] }));
    recordEvent("Subscription checkout previewed");
    setDialog(null);
    showNotice("Checkout preview saved. No payment was initiated or collected.");
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
  function openMemberProfile() {
    const target = role === "Account" || role === "Business" || role === "Agent" || role === "Company" ? role : "Account";
    setDialog(null);
    if (role !== target) setRole(target);
    window.setTimeout(() => window.dispatchEvent(new Event("neighborly-open-profile")), 0);
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
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); openPortal("Discover"); }} aria-label="Bizearch home">
          <img className="brand-mark" src="/bizearch-mark.svg" alt="" />
          <span>bizearch<span className="brand-period">.</span></span>
        </a>
        <button className="mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? "×" : "☰"}</button>
        <div className="workspace-label">{role === "Discover" ? "WORKSPACE" : `${role === "Account" ? "CUSTOMER" : role.toUpperCase()} WORKSPACE`}</div>
        <nav className="main-nav" aria-label="Main navigation">
          {workspaceLinks.map(([item, icon]) => (
            <button key={item} className={`nav-item ${role === item ? "active" : ""}`} onClick={() => { openPortal(item); setMobileMenuOpen(false); }}>
              <Icon>{icon}</Icon><span>{item === "Discover" ? "Discover" : item === "Account" ? "My activity" : `${item} portal`}</span>
              {item === role && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        {role === "Discover" && <>
          <div className="sidebar-divider" />
          <div className="workspace-label">BROWSE BY</div>
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
              <Icon><span className="atoz-sidebar-pill">A–Z</span></Icon><span>All Products & Services</span>
            </button>
            {categories.slice(1).map((item) => (
              <button key={item.name} className={`category-link ${browseMode === "sectors" && category === item.name ? "selected" : ""}`}
                onClick={() => { setBrowseMode("sectors"); setCategory(item.name); setCategoryPath([]); setQuery(""); setRole("Discover"); setMobileMenuOpen(false); }}>
                <Icon><CategoryIcon name={item.name} sector={item.name} /></Icon><span>{item.name}</span>
              </button>
            ))}
            <button className={`category-link view-all ${browseMode === "sectors" && category === "All" ? "selected" : ""}`} onClick={() => { setBrowseMode("sectors"); setCategory("All"); setCategoryPath([]); setQuery(""); setRole("Discover"); setMobileMenuOpen(false); }}>
              <Icon>&#43;</Icon><span>All categories</span>
            </button>
          </nav>
        </>}

        <div className="sidebar-spacer" />
        {role === "Discover" && <div className="neighbor-card">
          <div className="neighbor-sparkle">&#10038;</div>
          <strong>Good things are closer.</strong>
          <p>Every search supports a business in your neighborhood.</p>
          <button onClick={() => setDialog("business")}>Register your business <span>&#8599;</span></button>
        </div>}

        <div className="sidebar-bottom">
            <button className="profile-button" onClick={() => { if (role === "Discover") openPortal("Account"); else { openPortal(role); window.dispatchEvent(new Event("neighborly-open-profile")); } }}>
            <span className="avatar">N</span>
            <span className="profile-text"><strong>{role === "Discover" ? "Your Bizearch activity" : `${role === "Account" ? "Customer" : role} profile`}</strong><small>{role === "Discover" ? "Saved on this device" : "Profile and account details"}</small></span>
            <span className="profile-menu">···</span>
          </button>
          {role !== "Company" && <a className="company-login-link" href="/company-login">Company login</a>}
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Your neighborhood <span>/</span> <strong>{role === "Discover" ? "Discover" : role === "Account" ? "My activity" : `${role} portal`}</strong></div>
          <div className="topbar-partner" aria-label="Powered by Jishnu Infotech"><span>Powered by</span><img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" /></div>
          <div className="topbar-actions">
            <button className="location-chip" onClick={toggleDeviceLocation}>
              <span className="location-pin">📍</span> {locationEnabled ? "Stop using device location" : "Bengaluru demo area"} <span className="chevron">⌄</span>
            </button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => showNotice("You're all caught up.")}>🔔<i /></button>
            {authenticatedPortals.length > 0 && (role === "Discover" || authenticatedPortals.includes(role)) ?
              <button className="sign-in-button" onClick={() => void logOut()}>Sign out</button> :
              <button className="sign-in-button" onClick={() => openPortal("Account")}>Sign in <span>&rarr;</span></button>}
          </div>
        </header>

        <div className="ad-ticker top-ad-ticker" aria-label="Local advertising announcements">
          <div className="ad-ticker-track">{adConfig.tickerMessages.map((message, index) => <Fragment key={`${index}-${message}`}><span>{message}</span><i>&#10038;</i></Fragment>)}</div>
        </div>

        {role === "Discover" && <div className="ad-ticker mobile-ad-ticker" aria-label="Local advertising announcements">
          <div className="ad-ticker-track">{adConfig.tickerMessages.map((message, index) => <Fragment key={`${index}-${message}`}><span>{message}</span><i>&#10038;</i></Fragment>)}</div>
        </div>}

        <aside className="ad-rail" aria-label="Advertisements">
          <button className="sos-fab sos-ad-button" aria-label="Emergency help (SOS)" onClick={() => setDialog("sos")}><span>✚</span> SOS <small>Emergency help</small></button>
          <section className="image-ad-panel" aria-label="Rotating image advertisement">
            <div className={`image-ad-creative ${adConfig.imageAds[activeAd].tone}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 18%, rgba(17, 34, 23, .78) 100%), url("${adConfig.imageAds[activeAd].image}")` }}>
              <span className="ad-label">ADVERTISEMENT</span>
              <div className="image-ad-copy"><small>{adConfig.imageAds[activeAd].label}</small><strong>{adConfig.imageAds[activeAd].title}</strong></div>
            </div>
            <div className="ad-dots" aria-label={`Advertisement ${activeAd + 1} of ${adConfig.imageAds.length}`}>
              {adConfig.imageAds.map((ad, index) => <button key={`${ad.tone}-${index}`} className={index === activeAd ? "active" : ""} onClick={() => setActiveAd(index)} aria-label={`Show image advertisement ${index + 1}`} />)}
            </div>
          </section>
          <section className="video-ad-panel" aria-label="Video advertisement">
            <div className="video-ad-heading"><span>VIDEO ADVERTISEMENT</span><small>Local spotlight</small></div>
            <video key={adConfig.videoAd.sourceUrl} className="video-ad-player" controls muted loop autoPlay playsInline poster={adConfig.videoAd.posterUrl || undefined} src={adConfig.videoAd.sourceUrl}>Your browser does not support embedded video.</video>
            <div className="video-ad-caption"><strong>{adConfig.videoAd.title}</strong><p>{adConfig.videoAd.description}</p><button onClick={() => openPortal("Business")}>{adConfig.videoAd.callToAction} <span>&#8594;</span></button></div>
            {adConfig.audioAd.sourceUrl && <div className="audio-ad-content"><strong>{adConfig.audioAd.title}</strong><p>{adConfig.audioAd.description}</p><audio controls preload="none" src={adConfig.audioAd.sourceUrl}>Your browser does not support embedded audio.</audio></div>}
          </section>
        </aside>

        {role === "Discover" && (
          <div className="page-content discover-content">
            <div className="welcome-row">
              <div className="welcome-copy"><div className="eyebrow"><span /> MADE FOR AROUND HERE</div>
                <h1>Your neighborhood,<br /><em>in reach.</em></h1>
                <p className="welcome-subtitle">Find what you need. Meet the people who make it happen.</p>
                <button className="business-registration-cta" type="button" onClick={() => setDialog("business")}><strong>Register your business</strong><span aria-hidden="true">→</span></button>
                <p className="business-registration-note">No customer account needed to start. One business profile per business account.</p></div>
              <div className="hero-illustration" aria-hidden="true">
                <div className="sun-disc" /><div className="hero-plant">✿</div>
                <div className="hero-house"><div className="house-roof" /><div className="house-body"><i /><i /></div><div className="house-door" /></div>
                <span className="hero-dot dot-one" /><span className="hero-dot dot-two" /><span className="hero-star">✳</span>
              </div>
            </div>

            <div className="search-panel">
              <div className="search-main">
                <label htmlFor="what-search">WHAT DO YOU NEED?</label>
                <div className="search-input-wrap"><span className="search-symbol">🔍</span>
                  <input id="what-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “phone repair” or “fresh dosa”…" />
                  <button className="search-submit" onClick={searchNearby}>Find nearby <span>↗</span></button>
                </div>
              </div>
              <div className="search-divider" />
              <div className="radius-control">
                <label htmlFor="radius-range">WITHIN <strong>{radius} KM</strong></label>
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
                <span>❖</span> Browse by Sector
              </button>
              <button
                type="button"
                className={`browse-tab ${browseMode === "atoz" ? "active" : ""}`}
                onClick={() => setBrowseMode("atoz")}
                aria-selected={browseMode === "atoz"}
              >
                <span>🔤</span> A–Z Directory (All Products & Services) <span className="browse-tab-badge">A–Z</span>
              </button>
            </div>

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
                    <div className="eyebrow">{category === "All" ? "A LITTLE BIT OF EVERYTHING" : "BROWSE WITHIN SECTOR"}</div>
                    <h2>{category === "All" ? "Explore your local scene" : category}</h2>
                    {categoryPath.length > 0 && <p className="selected-taxonomy-path">{categoryPath.join(" › ")}</p>}
                  </div>
                  {category === "All" ? (
                    <button className="text-link" onClick={() => setBrowseMode("atoz")}>
                      A–Z Directory <span>→</span>
                    </button>
                  ) : (
                    <div className="taxonomy-navigation">
                      <button type="button" onClick={() => categoryPath.length ? setCategoryPath((current) => current.slice(0, -1)) : setCategory("All")}>
                        ← Back
                      </button>
                      <button type="button" onClick={() => { setCategory("All"); setCategoryPath([]); setQuery(""); }}>
                        All sectors
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
                        All in {category}
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
                        <strong>{item.name}</strong>
                        {subcategoriesSummary[item.name] && <span className="category-sub-summary">{subcategoriesSummary[item.name]}</span>}
                      </div>
                      <span className="category-arrow">↗</span>
                    </button>
                  )) : (() => {
                    const options = getTaxonomyOptions(category, categoryPath, categoryConfig);
                    if (!options.length) return <div className="taxonomy-complete"><strong>{categoryPath[categoryPath.length - 1] || category}</strong><span>{categoryPath.length ? "Showing matching listings for this subcategory." : "No subcategories are listed yet. Showing matching businesses."}</span></div>;
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
              <button className="sos-fab sos-ad-button" aria-label="Emergency help (SOS)" onClick={() => setDialog("sos")}><span>✚</span> SOS <small>Emergency help</small></button>
              <div className={`image-ad-creative ${adConfig.imageAds[activeAd].tone}`} style={{ backgroundImage: `linear-gradient(180deg, transparent 18%, rgba(17, 34, 23, .78) 100%), url("${adConfig.imageAds[activeAd].image}")` }}>
                <span className="ad-label">ADVERTISEMENT</span>
                <div className="image-ad-copy"><small>{adConfig.imageAds[activeAd].label}</small><strong>{adConfig.imageAds[activeAd].title}</strong></div>
              </div>
              <div className="ad-dots" aria-label={`Advertisement ${activeAd + 1} of ${adConfig.imageAds.length}`}>
                {adConfig.imageAds.map((ad, index) => <button key={`mobile-${ad.tone}-${index}`} className={index === activeAd ? "active" : ""} onClick={() => setActiveAd(index)} aria-label={`Show image advertisement ${index + 1}`} />)}
              </div>
            </section>

            <div className="section-heading results-heading" id="results">
              <div>
                <div className="eyebrow">LOCAL VERIFIED PROVIDERS</div>
                <h2>{query ? `Results for “${query}”` : category !== "All" ? `${categoryPath.length ? `${categoryPath.join(" › ")} providers` : `${category} providers`}` : "Around your corner"} <span className="result-count">{results.length}</span></h2>
              </div>
              <div className="sort-label"><span className="green-dot" /> Subscribed listings · {locationEnabled ? "device radius" : "demo distances"}</div>
            </div>
            {results.length ? (
              <>
                <div className="business-grid">
                  {results.slice(0, visibleCount).map((business, index) => (
                    <article className="business-card" key={`${business.name}-${index}`}>
                      <div className={`business-image ${business.color}`}><span className="business-emoji">{business.icon}</span>
                        {business.tag && <span className="business-tag">{business.tag}</span>}
                        <button className="save-button" aria-label={`${demoData.favorites.includes(business.name) ? "Remove saved" : "Save"} ${business.name}`} aria-pressed={demoData.favorites.includes(business.name)} onClick={() => toggleFavorite(business.name)}>{demoData.favorites.includes(business.name) ? "♥" : "♡"}</button>
                      </div>
                      <div className="business-info">
                        <div className="business-meta"><span>{business.category}</span><span className="distance">⌖ {businessDistance(business).toFixed(1)} km{locationEnabled ? "" : " sample"}</span></div>
                        <h3>{business.name}</h3><p>{business.description}</p>
                        <div className="business-footer"><span className="rating">★ <b>{business.rating.toFixed(1)}</b> <small>({business.reviews})</small></span>
                          <span className="price">{business.price}</span></div>
                        <button className="contact-button" onClick={() => { setSelectedBusiness(business); recordEvent("Business catalogue viewed"); }}>View products & services <span>↗</span></button>
                      </div>
                    </article>
                  ))}
                </div>
                {results.length > visibleCount && (
                  <div style={{ textAlign: "center", margin: "28px 0 16px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button type="button" className="outline-button" onClick={() => setVisibleCount((v) => v + 24)}>
                      Show more ({results.length - visibleCount} remaining)
                    </button>
                    <button type="button" className="outline-button" onClick={() => setVisibleCount(results.length)}>
                      Show all {results.length} businesses
                    </button>
                  </div>
                )}
              </>
            ) : <div className="empty-results"><span>⌕</span><strong>No matches in this radius yet</strong><p>Try a larger search radius or another category.</p><button onClick={() => { setRadius(25); setCategory("All"); setQuery(""); }}>Show more nearby</button></div>}
            <section className="video-ad-panel mobile-video-ad" aria-label="Video advertisement">
              <div className="video-ad-heading"><span>VIDEO ADVERTISEMENT</span><small>Local spotlight</small></div>
              <video key={adConfig.videoAd.sourceUrl} className="video-ad-player" controls muted loop playsInline poster={adConfig.videoAd.posterUrl || undefined} src={adConfig.videoAd.sourceUrl}>Your browser does not support embedded video.</video>
              <div className="video-ad-caption"><strong>{adConfig.videoAd.title}</strong><p>{adConfig.videoAd.description}</p><button onClick={() => openPortal("Business")}>{adConfig.videoAd.callToAction} <span>&#8594;</span></button></div>
              {adConfig.audioAd.sourceUrl && <div className="audio-ad-content"><strong>{adConfig.audioAd.title}</strong><p>{adConfig.audioAd.description}</p><audio controls preload="none" src={adConfig.audioAd.sourceUrl}>Your browser does not support embedded audio.</audio></div>}
            </section>
            <div className="trust-strip"><span className="trust-icon">✳</span><div><strong>Local first. People always.</strong><p>Every recommendation comes from a business that chose to be here.</p></div><span className="trust-arrow">↗</span></div>
          </div>
        )}

        {role === "Account" && <CustomerPortal data={demoData} onRemoveFavorite={toggleFavorite} onSearch={(term) => { setQuery(term); setCategory("All"); setCategoryPath([]); setRole("Discover"); }} onFindBusiness={(name) => { const business = businesses.find((item) => item.name === name); if (business) setSelectedBusiness(business); }} onOpenAccount={() => showNotice("You are viewing this account in demo mode.")} showNotice={showNotice} />}
        {role === "Business" && <BusinessPortal businesses={businessAccountBusinesses} categoryConfig={categoryConfig} enquiries={demoData.enquiries} checkouts={demoData.checkouts} openBusinessProfile={() => window.dispatchEvent(new Event("neighborly-open-business-profile"))} openPlans={() => setDialog("plans")} verifyLocation={verifyBusinessLocation} onAddProduct={addProduct} showNotice={showNotice} />}
        {role === "Agent" && <AgentPortal showNotice={showNotice} />}
        {role === "Company" && <CompanyPortal accessLevel={companyAccessLevel} identity={sessionIdentity} businesses={businesses} enquiries={demoData.enquiries} events={demoData.events} checkouts={demoData.checkouts} locationEnabled={locationEnabled} showNotice={showNotice} />}
      </section>

      {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      {storageError && <div className="storage-warning" role="status">Demo data could not be saved in this browser: {storageError}</div>}
      {dialog && <Dialog kind={dialog} close={() => setDialog(null)} onOpenProfile={openMemberProfile} profileRole={role === "Account" || role === "Business" || role === "Agent" || role === "Company" ? role : "Account"} profileIdentity={role === "Company" ? sessionIdentity : ""} onLogin={logIn} onRegisterCustomerLocation={registerCustomerLocation} onBusiness={submitBusiness} businesses={role === "Business" ? businessAccountBusinesses : businesses} categories={categoryConfig.sectors} brandLogos={categoryConfig.brandLogos} onCheckout={submitCheckout} showNotice={showNotice} />}
      {selectedBusiness && <BusinessDetailDialog business={businesses.find((item) => item.name === selectedBusiness.name) || selectedBusiness} distanceKm={businessDistance(businesses.find((item) => item.name === selectedBusiness.name) || selectedBusiness)} isDeviceDistance={locationEnabled} close={() => setSelectedBusiness(null)} requestProduct={(business, product) => { setSelectedBusiness(null); setEnquiryProduct({ business, product }); recordEvent("Customer selected a product or service"); }} />}
      {enquiryProduct && <EnquiryDialog business={enquiryProduct.business} product={enquiryProduct.product} close={() => setEnquiryProduct(null)} submit={submitEnquiry} />}
    </main>
  );
}

function CustomerPortal({
  data,
  onRemoveFavorite,
  onSearch,
  onFindBusiness,
  onOpenAccount,
  showNotice,
}: {
  data: DemoData;
  onRemoveFavorite: (businessName: string) => void;
  onSearch: (term: string) => void;
  onFindBusiness: (businessName: string) => void;
  onOpenAccount: () => void;
  showNotice: (message: string) => void;
}) {
  const [tab, setTab] = useState("Overview");
  useEffect(() => { const openProfile = () => setTab("Profile"); window.addEventListener("neighborly-open-profile", openProfile); return () => window.removeEventListener("neighborly-open-profile", openProfile); }, []);
  const savedBusinesses = data.businesses.filter((business) => data.favorites.includes(business.name));
  return <div className="page-content portal-content">
    <div className="portal-header"><div><div className="eyebrow"><span /> YOUR NEIGHBORHOOD ACTIVITY</div><h1>Your local <em>shortlist.</em></h1><p>Saved places, searches and enquiries stay in this browser in this demo.</p></div><button className="primary-button" onClick={onOpenAccount}>Sign in or register ↗</button></div>
    <div className="portal-tabs">{["Overview", "Saved", "Recent searches", "Enquiries", "Profile"].map((item) => <button key={item} className={tab === item ? "current" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Overview" && <>
      <div className="metric-grid"><Metric label="Saved businesses" value={String(data.favorites.length)} delta="Stored on this device" icon="♡" /><Metric label="Recent searches" value={String(data.recentSearches.length)} delta="Searches you chose to run" icon="⌕" /><Metric label="Enquiries" value={String(data.enquiries.length)} delta="Local demo drafts" icon="↗" /></div>
      <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR SHORTLIST</div><h2>Saved businesses</h2></div><button className="text-link" onClick={() => setTab("Saved")}>See saved →</button></div>
        {savedBusinesses.length ? savedBusinesses.slice(0, 4).map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><button className="outline-button" onClick={() => onFindBusiness(business.name)}>View catalogue</button></div>) : <EmptyState title="Your shortlist is ready" text="Save a local business from Discover to find it here." />}
      </section>
      <div className="form-note"><strong>Private to this browser</strong><span>Favorites, searches and enquiries use this device's local storage. They are not synced to a customer account or sent to businesses.</span></div>
    </>}
    {tab === "Saved" && <section className="panel tab-panel"><div className="eyebrow">SAVED BUSINESSES</div><h2>Your favorites</h2>{savedBusinesses.length ? savedBusinesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} · {business.distance.toFixed(1)} km (sample distance)</small></span><button className="outline-button" onClick={() => onFindBusiness(business.name)}>View</button><button className="row-more" aria-label={`Remove ${business.name} from saved`} onClick={() => onRemoveFavorite(business.name)}>×</button></div>) : <EmptyState title="No saved businesses yet" text="Tap the heart on a search result to save it on this device." />}</section>}
    {tab === "Recent searches" && <section className="panel tab-panel"><div className="eyebrow">YOUR RECENT SEARCHES</div><h2>Pick up where you left off</h2>{data.recentSearches.length ? data.recentSearches.map((term) => <button className="history-row" key={term} onClick={() => onSearch(term)}><span>⌕</span><strong>{term}</strong><span>Search again →</span></button>) : <EmptyState title="No recent searches" text="Your search history appears here after you choose Find nearby." />}</section>}
    {tab === "Enquiries" && <section className="panel tab-panel"><div className="eyebrow">YOUR ENQUIRY HISTORY</div><h2>Requests saved on this device</h2>{data.enquiries.length ? data.enquiries.map((enquiry) => <EnquiryRow enquiry={enquiry} key={enquiry.id} />) : <EmptyState title="No enquiries yet" text="Open a product or service and choose Request information to create a local demo enquiry." />}</section>}
    {tab === "Profile" && <ProfilePanel role="Account" label="Customer" />}
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
}: {
  business: Business;
  distanceKm: number;
  isDeviceDistance: boolean;
  close: () => void;
  requestProduct: (business: Business, product: Product) => void;
}) {
  const coordinates = business.coordinates;
  const address = business.address
    ? [business.address.doorNumber, business.address.street, business.address.area, business.address.cityTown, business.address.taluka, business.address.district, business.address.state, business.address.pincode].filter(Boolean).join(", ")
    : "";
  const mapUrl = coordinates ? (() => {
    const latitudeOffset = 0.008;
    const longitudeOffset = 0.008;
    const params = new URLSearchParams({
      bbox: `${coordinates.longitude - longitudeOffset},${coordinates.latitude - latitudeOffset},${coordinates.longitude + longitudeOffset},${coordinates.latitude + latitudeOffset}`,
      layer: "mapnik",
      marker: `${coordinates.latitude},${coordinates.longitude}`,
    });
    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
  })() : "";
  const directionsUrl = coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`
    : "";
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="modal catalog-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={close} aria-label="Close">×</button>
      <div className="eyebrow">{business.category.toUpperCase()} · {distanceKm.toFixed(1)} KM {isDeviceDistance ? "FROM DEVICE" : "SAMPLE DISTANCE"}</div><h2>{business.name}</h2><p>{business.description}</p>
      <section className="provider-map-section" aria-label={`Location for ${business.name}`}>
        <div className="provider-map-heading"><div><strong>Provider location</strong>{address && <p>{address}</p>}</div>
          {directionsUrl && <a className="outline-button" href={directionsUrl} target="_blank" rel="noreferrer">Navigate to provider ↗</a>}
        </div>
        {mapUrl ? <iframe className="provider-map" title={`Map showing ${business.name}`} src={mapUrl} loading="lazy" referrerPolicy="no-referrer" /> : <p className="provider-map-unavailable">A verified map pin is not available for this listing yet.</p>}
      </section>
      <div className="catalog-list">{business.products.length ? business.products.map((product) => <article className="catalog-item" key={product.id}><div><strong>{product.name}</strong><p>{product.description}</p><span>{product.price ? `₹${product.price.toLocaleString("en-IN")} ${product.unit}` : product.unit}</span></div><button className="outline-button" onClick={() => requestProduct(business, product)}>Request info</button></article>) : <EmptyState title="No catalogue items yet" text="The business has not added products or services to this demo listing." />}</div>
      <div className="fine-print">A request is stored locally only. The business will not receive it until a secure messaging service is connected.</div>
    </section>
  </div>;
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

function BusinessPortal({
  businesses,
  categoryConfig,
  enquiries,
  checkouts,
  openBusinessProfile,
  openPlans,
  verifyLocation,
  onAddProduct,
  showNotice,
}: {
  businesses: Business[];
  categoryConfig: CategoryConfig;
  enquiries: DemoEnquiry[];
  checkouts: CheckoutRequest[];
  openBusinessProfile: () => void;
  openPlans: () => void;
  verifyLocation: () => void;
  onAddProduct: (businessName: string, product: Omit<Product, "id">) => void;
  showNotice: (message: string) => void;
}) {
  const [tab, setTab] = useState("Overview");
  const accountBusinessName = businesses[0]?.name;
  const accountEnquiries = enquiries.filter((item) => item.businessName === accountBusinessName);
  const accountCheckouts = checkouts.filter((item) => item.businessName === accountBusinessName);
  useEffect(() => { const openProfile = () => setTab("Profile"); window.addEventListener("neighborly-open-profile", openProfile); return () => window.removeEventListener("neighborly-open-profile", openProfile); }, []);
  useEffect(() => { const openBusiness = () => setTab("My business"); window.addEventListener("neighborly-open-business-profile", openBusiness); return () => window.removeEventListener("neighborly-open-business-profile", openBusiness); }, []);
  return <div className="page-content portal-content">
    <div className="portal-header"><div><div className="eyebrow"><span /> FOR LOCAL BUSINESSES</div><h1>Grow with your <em>neighbors.</em></h1><p>Manage your business and connect with nearby customers.</p></div><button className="primary-button" onClick={openBusinessProfile}>Manage your business</button></div>
    <div className="portal-tabs">{["Overview", "My business", "Products & services", "Enquiries", "Plans & billing", "Verification", "Profile"].map((item) => <button key={item} className={tab === item ? "current" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Overview" && <>
      <div className="metric-grid"><Metric label="Profile views" value="1,284" delta="Sample dashboard metric" icon="◉" /><Metric label="Customer enquiries" value={String(accountEnquiries.length)} delta="Saved in this browser" icon="↗" /><Metric label="Search appearances" value="438" delta="Sample dashboard metric" icon="⌕" /></div>
      <div className="portal-columns"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">YOUR BUSINESS</div><h2>Business profile</h2></div><button className="text-link" onClick={openBusinessProfile}>View details <span>→</span></button></div>
        {businesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending plan"}</span></div>)}
        {!businesses.length && <EmptyState title="No business profile yet" text="Complete your business registration to set up your profile." />}
      </section>
      <section className="panel plan-panel"><div className="eyebrow">YOUR MEMBERSHIP</div><div className="plan-title"><h2>Subscription checkout</h2><span className="status-pill pending">Demo</span></div><p>Choose a visibility plan for your business. Payments are not collected here.</p><div className="plan-features"><span>✓ Plans: Starter, Growth, Spotlight</span><span>✓ Preview UPI or card checkout</span><span>— No payment is processed</span></div><button className="outline-button" onClick={openPlans}>Explore plans <span>→</span></button>{accountCheckouts[0] && <div className="checkout-summary"><strong>Latest preview</strong><span>{accountCheckouts[0].businessName} · {accountCheckouts[0].plan}</span><small>Not processed · {new Date(accountCheckouts[0].createdAt).toLocaleString()}</small></div>}</section></div>
      <div className="verification-banner"><span className="verify-icon">⌖</span><div><strong>Help neighbors find the right place.</strong><p>Granting device location is only a demo permission check; it does not verify your registered business address.</p></div><button onClick={verifyLocation}>Check location access <span>↗</span></button></div>
      <div className="form-note"><strong>Demo dashboard</strong><span>Views, enquiries and subscription status are sample data until your business is connected to a production backend.</span></div>
    </>}
    {tab === "My business" && <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">BUSINESS PROFILE</div><h2>Your business</h2></div></div>{businesses.length ? businesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} · {business.distance} km sample distance</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Needs plan"}</span></div>) : <EmptyState title="No business profile yet" text="Complete your business registration to set up your profile." />}</section>}
    {tab === "Products & services" && <ProductManager businesses={businesses} categoryConfig={categoryConfig} onAddProduct={onAddProduct} />}
    {tab === "Enquiries" && <section className="panel tab-panel"><div className="eyebrow">CUSTOMER ENQUIRIES</div><h2>Requests for your business</h2><p>These are local demo enquiries and have not been delivered to customers or businesses.</p>{accountEnquiries.length ? accountEnquiries.map((enquiry) => <EnquiryRow enquiry={enquiry} key={enquiry.id} />) : <EmptyState title="No enquiries yet" text="Customer requests for your business will appear here." />}</section>}
    {tab === "Plans & billing" && <><PlansSection openPlans={openPlans} />{accountCheckouts.length > 0 && <section className="panel tab-panel"><div className="eyebrow">CHECKOUT PREVIEWS</div><h2>Subscription activity</h2>{accountCheckouts.map((item, index) => <div className="listing-row" key={`${item.createdAt}-${index}`}><span className="listing-icon lavender">₹</span><span className="listing-name"><strong>{item.businessName} · {item.plan}</strong><small>{item.paymentMethod} · {new Date(item.createdAt).toLocaleString()}</small></span><span className="status-pill pending">{item.status}</span></div>)}</section>}</>}
    {tab === "Verification" && <section className="panel tab-panel"><div className="eyebrow">BUILD TRUST LOCALLY</div><h2>Verify your business location</h2><p>Share your location only when you are ready. Bizearch uses the location to check your business address; production verification requires a secure server-side workflow.</p><button className="primary-button" onClick={verifyLocation}>⌖ Verify with this device</button></section>}
    {tab === "Profile" && <ProfilePanel role="Business" label="Business account" />}
  </div>;
}

function AgentPortal({ showNotice }: { showNotice: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("Overview");
  useEffect(() => { const openProfile = () => setTab("Profile"); window.addEventListener("neighborly-open-profile", openProfile); return () => window.removeEventListener("neighborly-open-profile", openProfile); }, []);
  return <div className="page-content portal-content"><div className="portal-header"><div><div className="eyebrow"><span /> NEIGHBORHOOD PARTNERS</div><h1>Good connections,<br /><em>good things.</em></h1><p>Help great local businesses meet the neighbors who need them.</p></div><div className="agent-avatar">✳</div></div>
    <div className="portal-tabs">{["Overview", "Profile"].map((item) => <button key={item} className={tab === item ? "current" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Overview" && <>
    <section className="referral-card"><div className="referral-copy"><div className="eyebrow">YOUR REFERRAL CODE</div><h2>Share the local love.</h2><p>Businesses that use your code will be linked to your agent account when they register.</p></div><div className="code-box"><code>NEIGHBOR-4821</code><button onClick={() => { navigator.clipboard?.writeText("NEIGHBOR-4821"); setCopied(true); showNotice("Referral code copied."); }}>{copied ? "Copied ✓" : "Copy code ↗"}</button></div></section>
    <div className="metric-grid"><Metric label="Businesses referred" value="24" delta="Across 6 categories" icon="♧" /><Metric label="Awaiting signup" value="5" delta="Share your referral code" icon="◷" /><Metric label="This month's reward" value="₹4,800" delta="Demo estimate" icon="↗" /></div>
    <section className="panel agent-table"><div className="panel-heading"><div><div className="eyebrow">YOUR NETWORK</div><h2>Recent referrals</h2></div><button className="text-link" onClick={() => showNotice("Referral export requires an agent account.")}>Download report ↗</button></div>
      <div className="table-head"><span>BUSINESS</span><span>CATEGORY</span><span>JOINED</span><span>STATUS</span></div>
      {[["Bloom & Bean Café", "Food & dining", "Oct 14, 2026", "Subscribed"], ["Kaveri Cycle Works", "Automobiles", "Oct 12, 2026", "Pending plan"], ["Pixel Fix Studio", "Electronics", "Oct 09, 2026", "Subscribed"], ["Sunday Loom", "Fashion", "Oct 06, 2026", "Reviewing"]].map((row) => <div className="table-row" key={row[0]}>{row.map((cell, index) => <span key={cell} className={index === 3 ? `status-pill ${cell === "Subscribed" ? "verified" : "pending"}` : ""}>{index === 3 && <i>● </i>}{cell}</span>)}</div>)}
    </section><div className="form-note"><strong>Agent data</strong><span>Referral records, commission rules, and payouts need authenticated server-side services before launch.</span></div>
    </>}
    {tab === "Profile" && <ProfilePanel role="Agent" label="Field agent" />}
  </div>;
}

function ProfilePanel({ role, label, identity = "" }: { role: "Account" | "Business" | "Agent" | "Company"; label: string; identity?: string }) {
  const [profile, setProfile] = useState<MemberProfile>(emptyMemberProfile);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(profileStorageKey(role, identity));
      if (!stored) {
        if (role === "Company" && identity) {
          const localName = identity.split("@")[0].replace(/[._-]+/g, " ");
          setProfile({ ...emptyMemberProfile, fullName: localName, email: identity });
        }
        return;
      }
      const parsed = JSON.parse(stored) as Partial<MemberProfile>;
      setProfile({ fullName: parsed.fullName || "", phone: parsed.phone || "", email: parsed.email || "", address: parsed.address || "", emergencyPhones: [parsed.emergencyPhones?.[0] || "", parsed.emergencyPhones?.[1] || ""] });
    } catch { setSaved(false); }
  }, [role, identity]);
  function update<K extends keyof MemberProfile>(key: K, value: MemberProfile[K]) { setProfile((current) => ({ ...current, [key]: value })); setSaved(false); setProfileError(""); }
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phoneDigits = profile.phone.replace(/\D/g, "");
    const contactDigits = profile.emergencyPhones.map((value) => value.replace(/\D/g, ""));
    if (!profile.fullName.trim() || profile.fullName.trim().length > 100 || phoneDigits.length < 8 || phoneDigits.length > 15) {
      setProfileError("Enter your name and a valid mobile number.");
      return;
    }
    if (contactDigits.some((value) => value.length < 8 || value.length > 15) || contactDigits[0] === contactDigits[1]) {
      setProfileError("Enter two different valid emergency contact numbers.");
      return;
    }
    try {
      window.localStorage.setItem(profileStorageKey(role, identity), JSON.stringify({ ...profile, fullName: profile.fullName.trim(), phone: profile.phone.trim() }));
      setSaved(true);
      setProfileError("");
    } catch { setProfileError("Could not save the profile on this device."); }
  }
  return <section className="panel tab-panel"><div className="eyebrow">{label.toUpperCase()} PROFILE</div><h2>Your details and emergency contacts</h2><p>Profile details and emergency contacts are saved in this browser. When you send an SOS, its contact and location details are recorded server-side for Super Admin review.</p><form className="stacked-form" onSubmit={save}><label>Full name<input value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} maxLength={100} required /></label><label>Mobile number<input type="tel" value={profile.phone} onChange={(event) => update("phone", event.target.value)} minLength={8} maxLength={20} required /></label><label>Email address<input type="email" value={profile.email} onChange={(event) => update("email", event.target.value)} maxLength={254} /></label><label>{role === "Business" ? "Business address" : "Address"}<input value={profile.address} onChange={(event) => update("address", event.target.value)} maxLength={300} /></label><div className="eyebrow">SOS CONTACTS</div><label>Emergency contact 1<input type="tel" value={profile.emergencyPhones[0]} onChange={(event) => update("emergencyPhones", [event.target.value, profile.emergencyPhones[1]])} minLength={8} maxLength={20} required /></label><label>Emergency contact 2<input type="tel" value={profile.emergencyPhones[1]} onChange={(event) => update("emergencyPhones", [profile.emergencyPhones[0], event.target.value])} minLength={8} maxLength={20} required /></label>{profileError && <p className="form-error" role="alert">{profileError}</p>}<div className="form-button-row"><button className="primary-button" type="submit">Save profile</button>{saved && <span role="status">Profile saved</span>}</div></form><p className="fine-print">Calls and messages open your device apps for confirmation. This demo never automatically calls or messages contacts.</p></section>;
}

function ProductManager({
  businesses,
  categoryConfig,
  onAddProduct,
}: {
  businesses: Business[];
  categoryConfig: CategoryConfig;
  onAddProduct: (businessName: string, product: Omit<Product, "id">) => void;
}) {
  const [selectedBusiness, setSelectedBusiness] = useState(businesses[0]?.name || "");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<CatalogueActivity[]>([]);
  const [catalogueSelections, setCatalogueSelections] = useState<CatalogueSelection[]>([]);
  const selectedBusinessProfile = businesses.find((business) => business.name === selectedBusiness);
  const businessCategories = new Set([...(selectedBusinessProfile?.categories || []), selectedBusinessProfile?.category].filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase()));
  const availableSectors = categoryConfig.sectors.filter((sector) => businessCategories.has(sector.name.toLowerCase()));
  function toggleActivity(activity: CatalogueActivity) {
    setSelectedActivities((current) => current.includes(activity) ? current.filter((item) => item !== activity) : [...current, activity]);
    setCatalogueSelections((current) => current.filter((selection) => selection.activity !== activity));
  }
  function toggleCataloguePath(activity: CatalogueActivity, sector: string, path: string[], checked: boolean) {
    setCatalogueSelections((current) => updateCatalogueSelections(current, activity, sector, path, checked));
  }
  return <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">BUSINESS CATALOGUE</div><h2>Products & services</h2></div><button className="primary-button" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "＋ Add item"}</button></div>
    {showForm && <form className="product-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("productName") || "").trim(); const description = String(form.get("productDescription") || "").trim(); const price = Number(form.get("productPrice")); if (!name || !description || !Number.isFinite(price) || price < 0 || !selectedBusiness) { setError("Enter a name, description, valid price and business."); return; } if (!selectedActivities.length || !catalogueSelections.length) { setError("Select Sales or Service and at least one category or subcategory."); return; } onAddProduct(selectedBusiness, { name, description, price, unit: String(form.get("productUnit") || "from"), catalogueSelections }); event.currentTarget.reset(); setError(""); setSelectedActivities([]); setCatalogueSelections([]); setShowForm(false); }}>
      <label>Business<select value={selectedBusiness} onChange={(event) => { setSelectedBusiness(event.target.value); setSelectedActivities([]); setCatalogueSelections([]); setError(""); }}>{businesses.map((business, index) => <option key={`${business.name}-${index}`}>{business.name}</option>)}</select></label><label>Product or service<input name="productName" placeholder="e.g. Same-day phone repair" required /></label>
      <fieldset className="catalogue-selection"><legend>Choose what you offer</legend><div className="catalogue-activity-options">{(["Sales", "Service"] as const).map((activity) => <label key={activity}><input type="checkbox" checked={selectedActivities.includes(activity)} onChange={() => toggleActivity(activity)} />{activity}</label>)}</div>
        {selectedActivities.map((activity) => <div className="catalogue-activity-group" key={activity}><strong>{activity} categories</strong>{availableSectors.length ? <div className="catalogue-sector-list">{availableSectors.map((sector) => <fieldset className="catalogue-sector" key={`${activity}-${sector.name}`}><legend>{sector.name}</legend><CatalogueTaxonomyOptions activity={activity} sector={sector.name} paths={getSectorActivityPaths(sector, activity)} selections={catalogueSelections} brandLogos={categoryConfig.brandLogos} onToggle={toggleCataloguePath} /></fieldset>)}</div> : <small>No categories are configured for this business.</small>}</div>)}
      </fieldset>
      <label>Description<input name="productDescription" placeholder="What is included?" required /></label><label>Price (₹)<input name="productPrice" type="number" min="0" step="1" placeholder="499" required /></label><label>Price unit<input name="productUnit" placeholder="from / per visit / per item" defaultValue="from" required /></label><button className="primary-button" type="submit">Add to catalogue</button>{error && <span className="form-error">{error}</span>}
    </form>}
    {businesses.map((business, index) => <div className="catalog-business" key={`${business.name}-${index}`}><strong>{business.name}</strong>{business.products.length ? business.products.map((product) => <div className="catalog-row" key={product.id}><span>{product.name}{product.catalogueSelections?.length ? <small className="catalogue-item-categories">{product.catalogueSelections.map((selection) => `${selection.activity}: ${selection.sector ? `${selection.sector} › ` : ""}${selection.path.join(" › ")}`).join(" · ")}</small> : null}</span><small>{product.price ? `₹${product.price.toLocaleString("en-IN")} ${product.unit}` : product.unit}</small></div>) : <small className="catalog-empty">No catalogue items added yet.</small>}</div>)}
  </section>;
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
  locationEnabled,
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
  locationEnabled: boolean;
  showNotice: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  useEffect(() => { const openProfile = () => setActiveTab("Profile"); window.addEventListener("neighborly-open-profile", openProfile); return () => window.removeEventListener("neighborly-open-profile", openProfile); }, []);
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
  const tabNames = accessLevel === "Super Admin" ? ["Overview", "Businesses", "Categories", "Registration forms", "Customer locations", "Advertisements", "Admins", "Activity log", "Billing", "Safety", "Profile"] : ["Overview", "Businesses", "Categories", "Customer locations", "Advertisements", "Activity log", "Billing", "Safety", "Profile"];

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
      <section className="panel admin-privacy"><div className="privacy-icon">⌖</div><div className="eyebrow">PRIVACY BY DESIGN</div><h2>Activity is opt-in.</h2><p>Precise location and sign-in activity should be collected only with explicit user consent, retained securely and visible only to authorized administrators.</p><button className="outline-button" onClick={() => showNotice("Review the Customer locations tab for registration locations shared with Company Admins.")}>Review privacy controls ↗</button></section></div>
      <div className="verification-banner"><span className="verify-icon">⌖</span><div><strong>Device location permission</strong><p>{locationEnabled ? "Granted for this browser session. Coordinates were not stored or transmitted." : "Not granted. No location data is available in this demo."}</p></div><button onClick={downloadReport}>Download CSV ↗</button></div>
      <div className="form-note"><strong>Demo only</strong><span>Administrative metrics and audit entries are sample/browser-local data, not company-wide records. This view has no server-side authorization.</span></div>
    </>}
    {activeTab === "Customer locations" && <section className="panel tab-panel"><div className="eyebrow">CONSENTED REGISTRATION LOCATION</div><h2>Customer registration requests</h2><p>Only Company Admins can view this list. Exact coordinates are included only when the customer grants browser location access. Demo requests have a verified mobile number but do not activate an account.</p>{registrationLoading && <p>Loading registration records…</p>}{registrationError && <p className="form-error" role="alert">{registrationError}</p>}{!registrationLoading && !registrationError && customerRegistrations.length === 0 && <EmptyState title="No registration requests yet" text="Customer requests and any shared locations will appear here." />}{customerRegistrations.map((registration) => <div className="listing-row" key={registration.id}><span className="listing-icon lavender">⌖</span><span className="listing-name"><strong>{registration.name}</strong><small>Mobile ending {registration.phoneLast4} · {new Date(registration.registeredAt).toLocaleString()} · {registration.verificationStatus}</small>{registration.locationStatus === "shared" && registration.latitude !== null && registration.longitude !== null && <small>Coordinates: {registration.latitude.toFixed(5)}, {registration.longitude.toFixed(5)}</small>}</span><span className={`status-pill ${registration.locationStatus === "shared" ? "verified" : "pending"}`}>{registration.locationStatus === "shared" ? "Location shared" : registration.locationStatus === "denied" ? "Location denied" : "Location unavailable"}</span></div>)}</section>}    {activeTab === "Businesses" && <><section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">PARTNER DIRECTORY</div><h2>All registered businesses</h2></div><button className="outline-button" onClick={downloadReport}>Download CSV ↗</button></div>{businesses.map((business, index) => <div className="listing-row" key={`${business.name}-${index}`}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} / {business.products.length} catalogue items / sample distance {business.distance} km</small>{business.address && <small>Address: {Object.values(business.address).filter(Boolean).join(", ")}</small>}{business.coordinates && <small>Coordinates: {business.coordinates.latitude.toFixed(6)}, {business.coordinates.longitude.toFixed(6)}</small>}{business.businessModes?.length ? <small>Activity: {business.businessModes.join(", ")}</small> : null}{business.vehicleTypes?.length ? <small>Vehicles: {business.vehicleTypes.join(", ")}</small> : null}{business.vehicleMakes?.length ? <small>Makes: {business.vehicleMakes.join(", ")}</small> : null}{business.vehicleModels?.length ? <small>Models: {business.vehicleModels.join(", ")}</small> : null}</span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending"}</span></div>)}</section></>}
    {activeTab === "Admins" && accessLevel === "Super Admin" && <section className="panel tab-panel"><div className="eyebrow">PLATFORM ACCESS</div><h2>Manage Admin accounts</h2><p>Only the initial Super Admin can create or disable company Admin accounts. Super Admin access cannot be self-registered.</p><form className="product-form" onSubmit={registerAdmin}><label>{companyAdminLabel("name", "Admin name")}<input name="name" placeholder="e.g. Priya Sharma" maxLength={100} required /></label><label>{companyAdminLabel("email", "Work email")}<input name="email" type="email" placeholder="priya@company.com" required /></label><label>{companyAdminLabel("password", "Temporary password")}<input name="password" type="password" minLength={10} autoComplete="new-password" placeholder="At least 10 characters" required /></label><button className="primary-button" type="submit">Create Admin account</button>{adminError && <span className="form-error" role="alert">{adminError}</span>}</form><div className="form-note"><strong>Account store</strong><span>Passwords are stored as salted hashes on this local server. Share temporary passwords through a private channel.</span></div>{adminLoading ? <p>Loading Admin accounts...</p> : admins.map((admin) => <div className="listing-row" key={admin.id}><span className="listing-icon lavender">A</span><span className="listing-name"><strong>{admin.name}</strong><small>{admin.email} · Created {new Date(admin.createdAt).toLocaleDateString()}</small></span><span className={`status-pill ${admin.active ? "verified" : "pending"}`}>{admin.active ? "Active" : "Disabled"}</span><button className="outline-button" type="button" onClick={() => void setAdminActive(admin.id, !admin.active)}>{admin.active ? "Disable access" : "Restore access"}</button></div>)}</section>}
    {activeTab === "Activity log" && <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">LOCAL DEMO AUDIT</div><h2>Recent activity</h2></div><span className="status-pill pending">Browser only</span></div><p>Events are stored locally in this browser and are not sent to the company.</p>{events.length ? events.map((event) => <div className="activity-row" key={event.id}><span className="activity-dot" /><strong>{event.action}</strong><small>{new Date(event.createdAt).toLocaleString()}</small></div>) : <EmptyState title="No activity recorded" text="Searches and selections will appear here as local demo events." />}</section>}
    {activeTab === "Billing" && <section className="panel tab-panel"><div className="eyebrow">SUBSCRIPTIONS & CHECKOUT</div><h2>Payment previews</h2><p>These previews never create a payment or activate a subscription.</p>{checkouts.length ? checkouts.map((item, index) => <div className="listing-row" key={`${item.createdAt}-${index}`}><span className="listing-icon lavender">₹</span><span className="listing-name"><strong>{item.businessName} · {item.plan}</strong><small>{item.paymentMethod} · {new Date(item.createdAt).toLocaleString()}</small></span><span className="status-pill pending">{item.status}</span></div>) : <EmptyState title="No checkout previews" text="Business plan selections will be listed here in this browser." />}</section>}
    {activeTab === "Safety" && <section className="panel tab-panel"><div className="eyebrow">SAFETY & ESCALATION</div><h2>Emergency response setup</h2>{accessLevel === "Super Admin" ? <><p>Recent SOS alerts are recorded on this server and restricted to Super Admins. Alert details include personal contacts and precise coordinates; handle them as sensitive information. Bizearch does not place calls or send messages.</p><button className="outline-button" type="button" disabled={sosLoading} onClick={() => { setSosLoading(true); setSosError(""); fetch("/api/company/sos", { cache: "no-store" }).then(async (response) => { const result = await response.json() as { alerts?: SosAlert[]; error?: string }; if (!response.ok) throw new Error(result.error || "Could not load SOS alerts."); setSosAlerts(result.alerts || []); }).catch((reason) => setSosError(reason instanceof Error ? reason.message : "Could not load SOS alerts.")).finally(() => setSosLoading(false)); }}>Refresh alerts</button>{sosLoading && <p role="status">Loading SOS alerts...</p>}{sosError && <p className="form-error" role="alert">{sosError}</p>}{!sosLoading && !sosError && sosAlerts.length === 0 && <EmptyState title="No SOS alerts" text="Customer SOS alerts will appear here when submitted." />}{sosAlerts.map((alert) => <article className="sos-alert-card" key={alert.id}><div className="sos-alert-heading"><div><strong>{alert.customerName} · {alert.profileRole === "Account" ? "Customer" : alert.profileRole}</strong><small>{emergencyTypes.find((item) => item.id === alert.emergencyType)?.title ?? alert.emergencyType} · dial {alert.serviceNumber} · {new Date(alert.createdAt).toLocaleString()}</small><small>Account: {alert.identity || "Identity not available on this legacy alert"}</small><small>Mobile: {alert.customerPhone || `ending ${alert.customerPhoneLast4}`}</small></div><span className={`status-pill ${alert.locationStatus === "shared" ? "verified" : "pending"}`}>{alert.locationStatus === "shared" ? "Location shared" : "Location unavailable"}</span></div>{alert.latitude !== null && alert.longitude !== null ? <p><strong>Exact coordinates:</strong> {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}{alert.accuracyMeters !== null ? ` · accuracy ±${Math.round(alert.accuracyMeters)} m` : ""}</p> : <p>Customer location was unavailable when the SOS was submitted.</p>}<div className="sos-alert-contacts">{alert.emergencyPhones.map((phone, index) => <a key={`${alert.id}-${index}`} className="outline-button" href={`tel:${phone}`}>Call emergency contact {index + 1}</a>)}</div><small className="sos-alert-status">{alert.deliveryStatus}</small></article>)}</> : <p>SOS alert details and exact customer coordinates are available to Super Admins only. This demo does not dispatch emergency calls.</p>}</section>}
    {activeTab === "Profile" && <ProfilePanel role="Company" label={accessLevel} identity={identity} />}
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

function PlansSection({ openPlans }: { openPlans: () => void }) {
  return <section className="plans-area"><div className="eyebrow">SIMPLE PLANS. LOCAL GROWTH.</div><h2>Be found by your next customer.</h2><p>Choose the visibility that fits your business. Payments are demo-only until a payment provider is connected.</p><div className="plans-grid">{planNames.map((plan, index) => <div className={`plan-card ${index === 1 ? "featured" : ""}`} key={plan}>{index === 1 && <span className="popular-ribbon">MOST POPULAR</span>}<h3>{plan}</h3><div className="plan-price">{["₹499", "₹999", "₹1,999"][index]}<small> / month</small></div><p>{["A great place to start.", "More visibility where it matters.", "Stand out across your neighborhood."][index]}</p><ul><li>✓ Local search listing</li><li>✓ Business profile</li><li>{index > 0 ? "✓" : "—"} {index > 0 ? "Customer enquiry insights" : "Basic profile views"}</li><li>{index > 1 ? "✓ Featured in search" : "— Featured placement"}</li></ul><button className={index === 1 ? "primary-button" : "outline-button"} onClick={openPlans}>Choose {plan}</button></div>)}</div></section>;
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
      {kind === "plans" && <><div className="modal-mark">↗</div><div className="eyebrow">MEMBERSHIP & PAYMENTS</div><h2>{checkoutPlan ? `Preview ${checkoutPlan} checkout.` : "Choose a plan to get discovered."}</h2><p>No charge is created. Do not enter real payment details in this demo.</p>
        {!checkoutPlan ? <div className="compact-plans">{planNames.map((plan, index) => <button key={plan} onClick={() => setCheckoutPlan(plan)}><span>{plan} · {["₹499", "₹999", "₹1,999"][index]} / month</span><span>→</span></button>)}</div> :
          <form className="stacked-form" onSubmit={(event) => { event.preventDefault(); if (!checkoutBusiness) { showNotice("Register a business before previewing a subscription."); return; } onCheckout(checkoutBusiness, checkoutPlan, paymentMethod); }}>
            <label>Business<select value={checkoutBusiness} onChange={(event) => setCheckoutBusiness(event.target.value)}>{businesses.map((business, index) => <option key={`${business.name}-${index}`}>{business.name}</option>)}</select></label>
            <label>Payment method preview<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option>UPI (preview only)</option><option>Card (preview only)</option></select></label>
            <div className="payment-preview">Secure provider checkout is not connected. This step records only a local preview; it will not charge, activate a plan or save payment credentials.</div>
            <div className="form-button-row"><button type="button" className="outline-button" onClick={() => setCheckoutPlan("")}>← Plans</button><button className="primary-button" type="submit">Preview checkout →</button></div>
          </form>}
        <div className="fine-print">Production payments require server-created orders, a payment provider, verified webhooks, refunds and secure billing records.</div></>}
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
