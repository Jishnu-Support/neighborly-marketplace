"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "Discover" | "Account" | "Business" | "Agent" | "Company";
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
};
type Coordinates = { latitude: number; longitude: number };
type Business = {
  name: string;
  category: string;
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

const STORAGE_KEY = "neighborly-demo-v1";
function isDemoData(value: unknown): value is DemoData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const isRecord = (item: unknown): item is Record<string, unknown> =>
    item !== null && typeof item === "object";
  const isStringArray = (items: unknown): items is string[] =>
    Array.isArray(items) && items.every((item) => typeof item === "string");
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
      typeof item.color === "string" && typeof item.subscribed === "boolean");
}

const categories = [
  { name: "All", icon: "✳" },
  { name: "Automobiles", icon: "⌁" },
  { name: "Electronics", icon: "▣" },
  { name: "Fashion", icon: "◇" },
  { name: "Home & furniture", icon: "⌂" },
  { name: "Food & dining", icon: "♨" },
  { name: "Health & wellness", icon: "✚" },
  { name: "Travel", icon: "↗" },
  { name: "Entertainment", icon: "♫" },
  { name: "Everyday services", icon: "✳" },
];

const subcategories: Record<string, string[]> = {
  Automobiles: ["Car repair", "Two-wheeler service", "Tyres & batteries", "Car wash", "Spare parts"],
  Electronics: ["Phone repair", "Computers", "Home appliances", "Accessories", "Electronics retail"],
  Fashion: ["Clothing", "Tailoring", "Footwear", "Jewellery", "Local textiles"],
  "Home & furniture": ["Furniture", "Home decor", "Repairs", "Appliances", "Interior design"],
  "Food & dining": ["Restaurants", "Groceries", "Bakeries", "Cafes", "Meal delivery"],
  "Health & wellness": ["Clinics", "Pharmacies", "Physiotherapy", "Fitness", "Personal care"],
  Travel: ["Travel agents", "Stays", "Local transport", "Tours", "Car rentals"],
  Entertainment: ["Events", "Movies", "Live music", "Activities", "Arts & crafts"],
  "Everyday services": ["Plumbing", "Electrical", "Cleaning", "Repairs", "Professional services"],
};

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
  const [category, setCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(5);
  const [demoData, setDemoData] = useState(emptyDemoData);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState<Coordinates | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [enquiryProduct, setEnquiryProduct] = useState<{ business: Business; product: Product } | null>(null);
  const [dialog, setDialog] = useState<"login" | "business" | "sos" | "plans" | null>(null);
  const [notice, setNotice] = useState("");
  const businesses = demoData.businesses;
  const businessDistance = (business: Business) =>
    locationCoordinates ? distanceBetween(locationCoordinates, business.demoCoordinates) : business.distance;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!isDemoData(parsed)) throw new Error("Saved Neighborly demo data has an unsupported format.");
        setDemoData(parsed);
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
      const categoryMatch = category === "All" || business.category === category;
      const subcategoryMatch = !activeSubcategory || business.subcategories.includes(activeSubcategory);
      const searchMatch =
        !search ||
        `${business.name} ${business.category} ${business.description} ${business.products.map((product) => `${product.name} ${product.description}`).join(" ")}`.toLowerCase().includes(search);
      return categoryMatch && subcategoryMatch && searchMatch && businessDistance(business) <= radius && business.subscribed;
    });
  }, [businesses, category, activeSubcategory, query, radius, locationCoordinates]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3800);
  }

  function recordEvent(action: string) {
    const event: DemoEvent = { id: `${Date.now()}-${Math.random()}`, action, createdAt: new Date().toISOString() };
    setDemoData((current) => ({ ...current, events: [event, ...current.events].slice(0, 100) }));
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
      businesses: current.businesses.map((business) =>
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

  function submitBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("businessName") || "").trim();
    const service = String(form.get("service") || "").trim();
    const selectedCategory = String(form.get("businessCategory") || "Everyday services");
    const phone = String(form.get("businessPhone") || "").trim();
    if (!name || !service || !phone) return;
    setDemoData((current) => ({ ...current, businesses: [
      {
        name,
        category: selectedCategory,
        subcategories: [],
        products: [],
        description: service,
        distance: 0.8,
        demoCoordinates: { latitude: 12.9716, longitude: 77.5946 },
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
    setRole("Business");
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

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setRole("Discover")} aria-label="Neighborly home">
          <span className="brand-mark"><span /></span>
          <span>neighborly<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {([
            ["Discover", "⌕"],
            ["Account", "◉"],
            ["Business", "▧"],
            ["Agent", "♧"],
            ["Company", "▦"],
          ] as [Role, string][]).map(([item, icon]) => (
            <button key={item} className={`nav-item ${role === item ? "active" : ""}`} onClick={() => setRole(item)}>
              <Icon>{icon}</Icon><span>{item === "Discover" ? "Discover" : item === "Account" ? "My activity" : `${item} portal`}</span>
              {item === role && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />
        <div className="workspace-label">BROWSE BY</div>
        <nav className="category-nav" aria-label="Browse categories">
          {categories.slice(1, 6).map((item) => (
            <button key={item.name} className={`category-link ${category === item.name && role === "Discover" ? "selected" : ""}`}
              onClick={() => { setCategory(item.name); setActiveSubcategory(""); setQuery(""); setRole("Discover"); }}>
              <Icon>{item.icon}</Icon><span>{item.name}</span>
            </button>
          ))}
          <button className="category-link view-all" onClick={() => { setCategory("All"); setActiveSubcategory(""); setQuery(""); setRole("Discover"); }}>
            <Icon>＋</Icon><span>All categories</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
        <div className="neighbor-card">
          <div className="neighbor-sparkle">✳</div>
          <strong>Good things are closer.</strong>
          <p>Every search supports a business in your neighborhood.</p>
          <button onClick={() => setDialog("business")}>List your business <span>↗</span></button>
        </div>
        <div className="sidebar-bottom">
          <button className="profile-button" onClick={() => setRole("Account")}>
            <span className="avatar">N</span>
            <span className="profile-text"><strong>Your Neighborly activity</strong><small>Saved on this device</small></span>
            <span className="profile-menu">···</span>
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Your neighborhood <span>/</span> <strong>{role === "Discover" ? "Discover" : role === "Account" ? "My activity" : `${role} portal`}</strong></div>
          <div className="topbar-actions">
            <button className="location-chip" onClick={toggleDeviceLocation}>
              <span className="location-pin">⌖</span> {locationEnabled ? "Stop using device location" : "Bengaluru demo area"} <span className="chevron">⌄</span>
            </button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => showNotice("You're all caught up.")}>♧<i /></button>
            <button className="sign-in-button" onClick={() => setDialog("login")}>Sign in <span>↗</span></button>
          </div>
        </header>

        {role === "Discover" && (
          <div className="page-content">
            <div className="welcome-row">
              <div><div className="eyebrow"><span /> MADE FOR AROUND HERE</div>
                <h1>Your neighborhood,<br /><em>in reach.</em></h1>
                <p className="welcome-subtitle">Find what you need. Meet the people who make it happen.</p></div>
              <div className="hero-illustration" aria-hidden="true">
                <div className="sun-disc" /><div className="hero-plant">✿</div>
                <div className="hero-house"><div className="house-roof" /><div className="house-body"><i /><i /></div><div className="house-door" /></div>
                <span className="hero-dot dot-one" /><span className="hero-dot dot-two" /><span className="hero-star">✳</span>
              </div>
            </div>

            <div className="search-panel">
              <div className="search-main">
                <label htmlFor="what-search">WHAT DO YOU NEED?</label>
                <div className="search-input-wrap"><span className="search-symbol">⌕</span>
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

            <div className="section-heading category-heading">
              <div><div className="eyebrow">A LITTLE BIT OF EVERYTHING</div><h2>Explore your local scene</h2></div>
              <button className="text-link" onClick={() => { setCategory("All"); setActiveSubcategory(""); setQuery(""); }}>All categories <span>→</span></button>
            </div>
            <div className="category-grid">
              {categories.slice(1).map((item, index) => (
                <button key={item.name} className={`category-card cat-${index} ${category === item.name ? "category-active" : ""}`}
                  onClick={() => { setCategory(category === item.name ? "All" : item.name); setActiveSubcategory(""); setQuery(""); }}>
                  <span className="category-art">{item.icon}</span><span>{item.name}</span><span className="category-arrow">↗</span>
                </button>
              ))}
            </div>
            {category !== "All" && <div className="subcategory-row" aria-label={`${category} subcategories`}>
              <span>POPULAR IN {category.toUpperCase()}</span>
              {(subcategories[category] || []).map((item) => <button key={item} className={activeSubcategory === item ? "subcategory-active" : ""} onClick={() => { setActiveSubcategory(activeSubcategory === item ? "" : item); setQuery(""); }}>{item}</button>)}
            </div>}

            <div className="section-heading results-heading" id="results">
              <div><div className="eyebrow">GOOD THINGS, CLOSE BY</div><h2>{query ? `Results for “${query}”` : "Around your corner"} <span className="result-count">{results.length}</span></h2></div>
              <div className="sort-label"><span className="green-dot" /> Subscribed listings · {locationEnabled ? "device radius" : "demo distances"}</div>
            </div>
            {results.length ? <div className="business-grid">
              {results.slice(0, 4).map((business) => (
                <article className="business-card" key={business.name}>
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
            </div> : <div className="empty-results"><span>⌕</span><strong>No matches in this radius yet</strong><p>Try a larger search radius or another category.</p><button onClick={() => { setRadius(25); setCategory("All"); setQuery(""); }}>Show more nearby</button></div>}
            <div className="trust-strip"><span className="trust-icon">✳</span><div><strong>Local first. People always.</strong><p>Every recommendation comes from a business that chose to be here.</p></div><span className="trust-arrow">↗</span></div>
          </div>
        )}

        {role === "Account" && <CustomerPortal data={demoData} onRemoveFavorite={toggleFavorite} onSearch={(term) => { setQuery(term); setCategory("All"); setActiveSubcategory(""); setRole("Discover"); }} onFindBusiness={(name) => { const business = businesses.find((item) => item.name === name); if (business) setSelectedBusiness(business); }} onOpenAccount={() => setDialog("login")} showNotice={showNotice} />}
        {role === "Business" && <BusinessPortal businesses={businesses} enquiries={demoData.enquiries} checkouts={demoData.checkouts} openRegistration={() => setDialog("business")} openPlans={() => setDialog("plans")} verifyLocation={verifyBusinessLocation} onAddProduct={addProduct} showNotice={showNotice} />}
        {role === "Agent" && <AgentPortal showNotice={showNotice} />}
        {role === "Company" && <CompanyPortal businesses={businesses} enquiries={demoData.enquiries} events={demoData.events} checkouts={demoData.checkouts} locationEnabled={locationEnabled} showNotice={showNotice} />}
      </section>

      <button className="sos-fab" onClick={() => setDialog("sos")}><span>✚</span> SOS <small>Emergency help</small></button>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      {storageError && <div className="storage-warning" role="status">Demo data could not be saved in this browser: {storageError}</div>}
      {dialog && <Dialog kind={dialog} close={() => setDialog(null)} onLogin={logIn} onBusiness={submitBusiness} businesses={businesses} onCheckout={submitCheckout} showNotice={showNotice} />}
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
  const savedBusinesses = data.businesses.filter((business) => data.favorites.includes(business.name));
  return <div className="page-content portal-content">
    <div className="portal-header"><div><div className="eyebrow"><span /> YOUR NEIGHBORHOOD ACTIVITY</div><h1>Your local <em>shortlist.</em></h1><p>Saved places, searches and enquiries stay in this browser in this demo.</p></div><button className="primary-button" onClick={onOpenAccount}>Sign in or register ↗</button></div>
    <div className="portal-tabs">{["Overview", "Saved", "Recent searches", "Enquiries"].map((item) => <button key={item} className={tab === item ? "current" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Overview" && <>
      <div className="metric-grid"><Metric label="Saved businesses" value={String(data.favorites.length)} delta="Stored on this device" icon="♡" /><Metric label="Recent searches" value={String(data.recentSearches.length)} delta="Searches you chose to run" icon="⌕" /><Metric label="Enquiries" value={String(data.enquiries.length)} delta="Local demo drafts" icon="↗" /></div>
      <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR SHORTLIST</div><h2>Saved businesses</h2></div><button className="text-link" onClick={() => setTab("Saved")}>See saved →</button></div>
        {savedBusinesses.length ? savedBusinesses.slice(0, 4).map((business) => <div className="listing-row" key={business.name}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><button className="outline-button" onClick={() => onFindBusiness(business.name)}>View catalogue</button></div>) : <EmptyState title="Your shortlist is ready" text="Save a local business from Discover to find it here." />}
      </section>
      <div className="form-note"><strong>Private to this browser</strong><span>Favorites, searches and enquiries use this device's local storage. They are not synced to a customer account or sent to businesses.</span></div>
    </>}
    {tab === "Saved" && <section className="panel tab-panel"><div className="eyebrow">SAVED BUSINESSES</div><h2>Your favorites</h2>{savedBusinesses.length ? savedBusinesses.map((business) => <div className="listing-row" key={business.name}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} · {business.distance.toFixed(1)} km (sample distance)</small></span><button className="outline-button" onClick={() => onFindBusiness(business.name)}>View</button><button className="row-more" aria-label={`Remove ${business.name} from saved`} onClick={() => onRemoveFavorite(business.name)}>×</button></div>) : <EmptyState title="No saved businesses yet" text="Tap the heart on a search result to save it on this device." />}</section>}
    {tab === "Recent searches" && <section className="panel tab-panel"><div className="eyebrow">YOUR RECENT SEARCHES</div><h2>Pick up where you left off</h2>{data.recentSearches.length ? data.recentSearches.map((term) => <button className="history-row" key={term} onClick={() => onSearch(term)}><span>⌕</span><strong>{term}</strong><span>Search again →</span></button>) : <EmptyState title="No recent searches" text="Your search history appears here after you choose Find nearby." />}</section>}
    {tab === "Enquiries" && <section className="panel tab-panel"><div className="eyebrow">YOUR ENQUIRY HISTORY</div><h2>Requests saved on this device</h2>{data.enquiries.length ? data.enquiries.map((enquiry) => <EnquiryRow enquiry={enquiry} key={enquiry.id} />) : <EmptyState title="No enquiries yet" text="Open a product or service and choose Request information to create a local demo enquiry." />}</section>}
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
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="modal catalog-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={close} aria-label="Close">×</button>
      <div className="eyebrow">{business.category.toUpperCase()} · {distanceKm.toFixed(1)} KM {isDeviceDistance ? "FROM DEVICE" : "SAMPLE DISTANCE"}</div><h2>{business.name}</h2><p>{business.description}</p>
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
  enquiries,
  checkouts,
  openRegistration,
  openPlans,
  verifyLocation,
  onAddProduct,
  showNotice,
}: {
  businesses: Business[];
  enquiries: DemoEnquiry[];
  checkouts: CheckoutRequest[];
  openRegistration: () => void;
  openPlans: () => void;
  verifyLocation: () => void;
  onAddProduct: (businessName: string, product: Omit<Product, "id">) => void;
  showNotice: (message: string) => void;
}) {
  const [tab, setTab] = useState("Overview");
  return <div className="page-content portal-content">
    <div className="portal-header"><div><div className="eyebrow"><span /> FOR LOCAL BUSINESSES</div><h1>Grow with your <em>neighbors.</em></h1><p>Get discovered by people who are already looking for what you do.</p></div><button className="primary-button" onClick={openRegistration}>＋ Add a business</button></div>
    <div className="portal-tabs">{["Overview", "My business", "Products & services", "Enquiries", "Plans & billing", "Verification"].map((item) => <button key={item} className={tab === item ? "current" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === "Overview" && <>
      <div className="metric-grid"><Metric label="Profile views" value="1,284" delta="Sample dashboard metric" icon="◉" /><Metric label="Customer enquiries" value={String(enquiries.length)} delta="Saved in this browser" icon="↗" /><Metric label="Search appearances" value="438" delta="Sample dashboard metric" icon="⌕" /></div>
      <div className="portal-columns"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">YOUR LISTINGS</div><h2>Business profiles</h2></div><button className="text-link" onClick={openRegistration}>Add new <span>＋</span></button></div>
        {businesses.slice(0, 3).map((business) => <div className="listing-row" key={business.name}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending plan"}</span><button className="row-more" onClick={() => showNotice(`Manage ${business.name} in your demo business profile.`)}>···</button></div>)}
        <button className="add-listing" onClick={openRegistration}>＋ Add another business</button>
      </section>
      <section className="panel plan-panel"><div className="eyebrow">YOUR MEMBERSHIP</div><div className="plan-title"><h2>Subscription checkout</h2><span className="status-pill pending">Demo</span></div><p>Choose a visibility plan for one of your businesses. Payments are not collected here.</p><div className="plan-features"><span>✓ Plans: Starter, Growth, Spotlight</span><span>✓ Preview UPI or card checkout</span><span>— No payment is processed</span></div><button className="outline-button" onClick={openPlans}>Explore plans <span>→</span></button>{checkouts[0] && <div className="checkout-summary"><strong>Latest preview</strong><span>{checkouts[0].businessName} · {checkouts[0].plan}</span><small>Not processed · {new Date(checkouts[0].createdAt).toLocaleString()}</small></div>}</section></div>
      <div className="verification-banner"><span className="verify-icon">⌖</span><div><strong>Help neighbors find the right place.</strong><p>Granting device location is only a demo permission check; it does not verify your registered business address.</p></div><button onClick={verifyLocation}>Check location access <span>↗</span></button></div>
      <div className="form-note"><strong>Demo dashboard</strong><span>Views, enquiries and subscription status are sample data until your business is connected to a production backend.</span></div>
    </>}
    {tab === "My business" && <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">BUSINESS PROFILE</div><h2>Your business listings</h2></div><button className="primary-button" onClick={openRegistration}>＋ Add a business</button></div>{businesses.map((business) => <div className="listing-row" key={business.name}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} · {business.distance} km sample distance</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Needs plan"}</span></div>)}</section>}
    {tab === "Products & services" && <ProductManager businesses={businesses} onAddProduct={onAddProduct} />}
    {tab === "Enquiries" && <section className="panel tab-panel"><div className="eyebrow">CUSTOMER ENQUIRIES</div><h2>Requests saved in this browser</h2><p>These are local demo enquiries and have not been delivered to customers or businesses.</p>{enquiries.length ? enquiries.map((enquiry) => <EnquiryRow enquiry={enquiry} key={enquiry.id} />) : <EmptyState title="No enquiries yet" text="Customer requests will appear here after they use Request info." />}</section>}
    {tab === "Plans & billing" && <><PlansSection openPlans={openPlans} />{checkouts.length > 0 && <section className="panel tab-panel"><div className="eyebrow">CHECKOUT PREVIEWS</div><h2>Subscription activity</h2>{checkouts.map((item, index) => <div className="listing-row" key={`${item.createdAt}-${index}`}><span className="listing-icon lavender">₹</span><span className="listing-name"><strong>{item.businessName} · {item.plan}</strong><small>{item.paymentMethod} · {new Date(item.createdAt).toLocaleString()}</small></span><span className="status-pill pending">{item.status}</span></div>)}</section>}</>}
    {tab === "Verification" && <section className="panel tab-panel"><div className="eyebrow">BUILD TRUST LOCALLY</div><h2>Verify your business location</h2><p>Share your location only when you are ready. Neighborly uses the location to check your business address; production verification requires a secure server-side workflow.</p><button className="primary-button" onClick={verifyLocation}>⌖ Verify with this device</button></section>}
  </div>;
}

function AgentPortal({ showNotice }: { showNotice: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  return <div className="page-content portal-content"><div className="portal-header"><div><div className="eyebrow"><span /> NEIGHBORHOOD PARTNERS</div><h1>Good connections,<br /><em>good things.</em></h1><p>Help great local businesses meet the neighbors who need them.</p></div><div className="agent-avatar">✳</div></div>
    <section className="referral-card"><div className="referral-copy"><div className="eyebrow">YOUR REFERRAL CODE</div><h2>Share the local love.</h2><p>Businesses that use your code will be linked to your agent account when they register.</p></div><div className="code-box"><code>NEIGHBOR-4821</code><button onClick={() => { navigator.clipboard?.writeText("NEIGHBOR-4821"); setCopied(true); showNotice("Referral code copied."); }}>{copied ? "Copied ✓" : "Copy code ↗"}</button></div></section>
    <div className="metric-grid"><Metric label="Businesses referred" value="24" delta="Across 6 categories" icon="♧" /><Metric label="Awaiting signup" value="5" delta="Share your referral code" icon="◷" /><Metric label="This month's reward" value="₹4,800" delta="Demo estimate" icon="↗" /></div>
    <section className="panel agent-table"><div className="panel-heading"><div><div className="eyebrow">YOUR NETWORK</div><h2>Recent referrals</h2></div><button className="text-link" onClick={() => showNotice("Referral export requires an agent account.")}>Download report ↗</button></div>
      <div className="table-head"><span>BUSINESS</span><span>CATEGORY</span><span>JOINED</span><span>STATUS</span></div>
      {[["Bloom & Bean Café", "Food & dining", "Oct 14, 2026", "Subscribed"], ["Kaveri Cycle Works", "Automobiles", "Oct 12, 2026", "Pending plan"], ["Pixel Fix Studio", "Electronics", "Oct 09, 2026", "Subscribed"], ["Sunday Loom", "Fashion", "Oct 06, 2026", "Reviewing"]].map((row) => <div className="table-row" key={row[0]}>{row.map((cell, index) => <span key={cell} className={index === 3 ? `status-pill ${cell === "Subscribed" ? "verified" : "pending"}` : ""}>{index === 3 && <i>● </i>}{cell}</span>)}</div>)}
    </section><div className="form-note"><strong>Agent data</strong><span>Referral records, commission rules, and payouts need authenticated server-side services before launch.</span></div>
  </div>;
}

function ProductManager({
  businesses,
  onAddProduct,
}: {
  businesses: Business[];
  onAddProduct: (businessName: string, product: Omit<Product, "id">) => void;
}) {
  const [selectedBusiness, setSelectedBusiness] = useState(businesses[0]?.name || "");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  return <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">BUSINESS CATALOGUE</div><h2>Products & services</h2></div><button className="primary-button" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "＋ Add item"}</button></div>
    {showForm && <form className="product-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("productName") || "").trim(); const description = String(form.get("productDescription") || "").trim(); const price = Number(form.get("productPrice")); if (!name || !description || !Number.isFinite(price) || price < 0 || !selectedBusiness) { setError("Enter a name, description, valid price and business."); return; } onAddProduct(selectedBusiness, { name, description, price, unit: String(form.get("productUnit") || "from") }); event.currentTarget.reset(); setError(""); setShowForm(false); }}>
      <label>Business<select value={selectedBusiness} onChange={(event) => setSelectedBusiness(event.target.value)}>{businesses.map((business) => <option key={business.name}>{business.name}</option>)}</select></label><label>Product or service<input name="productName" placeholder="e.g. Same-day phone repair" required /></label><label>Description<input name="productDescription" placeholder="What is included?" required /></label><label>Price (₹)<input name="productPrice" type="number" min="0" step="1" placeholder="499" required /></label><label>Price unit<input name="productUnit" placeholder="from / per visit / per item" defaultValue="from" required /></label><button className="primary-button" type="submit">Add to catalogue</button>{error && <span className="form-error">{error}</span>}
    </form>}
    {businesses.map((business) => <div className="catalog-business" key={business.name}><strong>{business.name}</strong>{business.products.length ? business.products.map((product) => <div className="catalog-row" key={product.id}><span>{product.name}</span><small>{product.price ? `₹${product.price.toLocaleString("en-IN")} ${product.unit}` : product.unit}</small></div>) : <small className="catalog-empty">No catalogue items added yet.</small>}</div>)}
  </section>;
}

function CompanyPortal({
  businesses,
  enquiries,
  events,
  checkouts,
  locationEnabled,
  showNotice,
}: {
  businesses: Business[];
  enquiries: DemoEnquiry[];
  events: DemoEvent[];
  checkouts: CheckoutRequest[];
  locationEnabled: boolean;
  showNotice: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const tabNames = ["Overview", "Businesses", "Activity log", "Billing", "Safety"];

  function downloadReport() {
    const rows = [
      ["Record type", "Name or event", "Category or status", "Products", "Timestamp"],
      ...businesses.map((business) => ["Business", business.name, business.category, String(business.products.length), ""]),
      ...events.map((event) => ["Local demo event", event.action, "", "", event.createdAt]),
      ...checkouts.map((item) => ["Checkout preview", item.businessName, `${item.plan} · ${item.status}`, "", item.createdAt]),
      ...enquiries.map((item) => ["Enquiry", item.businessName, item.productName, "", item.createdAt]),
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
  return <div className="page-content portal-content"><div className="portal-header"><div><div className="eyebrow"><span /> COMPANY ADMINISTRATION</div><h1>See the whole <em>neighborhood.</em></h1><p>Platform health, partner businesses and privacy-aware activity controls.</p></div><span className="admin-label">SUPER ADMIN</span></div>
    <div className="portal-tabs">{tabNames.map((tab) => <button key={tab} className={activeTab === tab ? "current" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
    {activeTab === "Overview" && <><div className="metric-grid"><Metric label="Registered businesses" value={String(businesses.length)} delta="Sample directory" icon="▧" /><Metric label="Active subscriptions" value={String(businesses.filter((business) => business.subscribed).length)} delta="Subscribed demo listings" icon="◉" /><Metric label="Customer enquiries" value={String(enquiries.length)} delta="Browser-local demo records" icon="⌕" /><Metric label="Agent partners" value="42" delta="Sample metric" icon="♧" /></div>
      <div className="portal-columns"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">RECENT SIGNUPS</div><h2>Business registrations</h2></div><button className="text-link" onClick={() => setActiveTab("Businesses")}>View all →</button></div>{businesses.slice(0, 4).map((business) => <div className="listing-row" key={business.name}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category}</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending"}</span></div>)}</section>
      <section className="panel admin-privacy"><div className="privacy-icon">⌖</div><div className="eyebrow">PRIVACY BY DESIGN</div><h2>Activity is opt-in.</h2><p>Precise location and sign-in activity should be collected only with explicit user consent, retained securely and visible only to authorized administrators.</p><button className="outline-button" onClick={() => showNotice("Live location is not collected in this demo.")}>Review privacy controls ↗</button></section></div>
      <div className="verification-banner"><span className="verify-icon">⌖</span><div><strong>Device location permission</strong><p>{locationEnabled ? "Granted for this browser session. Coordinates were not stored or transmitted." : "Not granted. No location data is available in this demo."}</p></div><button onClick={downloadReport}>Download CSV ↗</button></div>
      <div className="form-note"><strong>Demo only</strong><span>Administrative metrics and audit entries are sample/browser-local data, not company-wide records. This view has no server-side authorization.</span></div>
    </>}
    {activeTab === "Businesses" && <><section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">PARTNER DIRECTORY</div><h2>All registered businesses</h2></div><button className="outline-button" onClick={downloadReport}>Download CSV ↗</button></div>{businesses.map((business) => <div className="listing-row" key={business.name}><span className={`listing-icon ${business.color}`}>{business.icon}</span><span className="listing-name"><strong>{business.name}</strong><small>{business.category} · {business.products.length} catalogue items · sample distance {business.distance} km</small></span><span className={`status-pill ${business.subscribed ? "verified" : "pending"}`}>● {business.subscribed ? "Subscribed" : "Pending"}</span></div>)}</section></>}
    {activeTab === "Activity log" && <section className="panel tab-panel"><div className="panel-heading"><div><div className="eyebrow">LOCAL DEMO AUDIT</div><h2>Recent activity</h2></div><span className="status-pill pending">Browser only</span></div><p>Events are stored locally in this browser and are not sent to the company.</p>{events.length ? events.map((event) => <div className="activity-row" key={event.id}><span className="activity-dot" /><strong>{event.action}</strong><small>{new Date(event.createdAt).toLocaleString()}</small></div>) : <EmptyState title="No activity recorded" text="Searches and selections will appear here as local demo events." />}</section>}
    {activeTab === "Billing" && <section className="panel tab-panel"><div className="eyebrow">SUBSCRIPTIONS & CHECKOUT</div><h2>Payment previews</h2><p>These previews never create a payment or activate a subscription.</p>{checkouts.length ? checkouts.map((item, index) => <div className="listing-row" key={`${item.createdAt}-${index}`}><span className="listing-icon lavender">₹</span><span className="listing-name"><strong>{item.businessName} · {item.plan}</strong><small>{item.paymentMethod} · {new Date(item.createdAt).toLocaleString()}</small></span><span className="status-pill pending">{item.status}</span></div>) : <EmptyState title="No checkout previews" text="Business plan selections will be listed here in this browser." />}</section>}
    {activeTab === "Safety" && <section className="panel tab-panel"><div className="eyebrow">SAFETY & ESCALATION</div><h2>Emergency response setup</h2><p>Neighborly can provide a user-initiated SOS workflow, but emergency-service dispatch should use a verified regional provider and must not imply that a demo button has contacted police or ambulance services.</p><button className="outline-button" onClick={() => showNotice("Emergency dispatch integrations are not configured.")}>Review escalation setup ↗</button></section>}
  </div>;
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
  onLogin,
  onBusiness,
  businesses,
  onCheckout,
  showNotice,
}: {
  kind: "login" | "business" | "sos" | "plans";
  close: () => void;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onBusiness: (event: React.FormEvent<HTMLFormElement>) => void;
  businesses: Business[];
  onCheckout: (businessName: string, plan: string, paymentMethod: string) => void;
  showNotice: (message: string) => void;
}) {
  const [isSignup, setIsSignup] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [step, setStep] = useState(1);
  const [checkoutPlan, setCheckoutPlan] = useState("");
  const [checkoutBusiness, setCheckoutBusiness] = useState(businesses[0]?.name || "");
  const [paymentMethod, setPaymentMethod] = useState("UPI (preview only)");
  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    service: "",
    businessCategory: "Everyday services",
    businessPhone: "",
  });
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="modal" role="dialog" aria-modal="true">
      <button className="modal-close" onClick={close} aria-label="Close">×</button>
      {kind === "login" && <><div className="modal-mark">✳</div><div className="eyebrow">WELCOME TO NEIGHBORLY</div><h2>{isSignup ? "Join your neighborhood." : "Good to see you."}</h2><p>{isSignup ? "Create your account to discover and connect with local businesses." : "Sign in to find the good things around you."}</p>
        <form onSubmit={onLogin} className="stacked-form">
          {isSignup && <label>Your name<input name="fullName" placeholder="e.g. Asha Rao" required /></label>}
          <label>Mobile number<div className="phone-input"><span>🇮🇳 +91</span><input name="phone" type="tel" placeholder="98765 43210" minLength={8} required /></div></label>
          {!isSignup && <label>Password<input name="password" type="password" placeholder="Enter your password" required /></label>}
          {isSignup && <><div className="otp-row"><label>One-time password (OTP)<input name="otp" inputMode="numeric" placeholder="6-digit OTP" required /></label><button type="button" onClick={() => showNotice("OTP sending is not configured in this demo.")}>Send OTP</button></div><label>Create passcode<input name="password" type="password" placeholder="At least 8 characters" minLength={8} required /></label></>}
          {!isSignup && <label className="consent-check"><input type="checkbox" checked={locationConsent} onChange={(event) => setLocationConsent(event.target.checked)} /><span>In production, share my approximate location and sign-in time with Neighborly’s authorized company administrator to improve local discovery. The demo does not collect or transmit location data.</span></label>}
          <button className="primary-button full-button" type="submit">{isSignup ? "Verify & create account" : "Sign in"} <span>→</span></button>
        </form><div className="modal-switch">{isSignup ? "Already a neighbor?" : "New around here?"} <button onClick={() => setIsSignup(!isSignup)}>{isSignup ? "Sign in" : "Create an account"}</button></div><div className="fine-print">By continuing, you agree to our Terms and Privacy Policy.</div></>}
      {kind === "business" && <><div className="modal-mark">⌂</div><div className="eyebrow">BUSINESS REGISTRATION · STEP {step} OF 2</div><h2>{step === 1 ? "Tell us about your business." : "Help us verify your business."}</h2><p>{step === 1 ? "A few details help nearby customers find the right product or service." : "Add your location and referral details. Location access is optional until you choose to verify."}</p>
        {step === 1 ? <form className="stacked-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setBusinessDetails({ businessName: String(form.get("businessName")), service: String(form.get("service")), businessCategory: String(form.get("businessCategory")), businessPhone: String(form.get("businessPhone")) }); setStep(2); }}><label>Business name<input name="businessName" placeholder="e.g. Greenway Auto Works" required /></label><label>Products or services<textarea name="service" placeholder="What do you offer? Add products, services and specialties." rows={3} required /></label><label>Sector / category<select name="businessCategory" defaultValue="Everyday services">{categories.slice(1).map((item) => <option key={item.name}>{item.name}</option>)}</select></label><label>Business mobile number<input name="businessPhone" type="tel" placeholder="+91 98765 43210" required /></label><button className="primary-button full-button" type="submit">Continue to verification <span>→</span></button></form> :
          <form className="stacked-form" onSubmit={onBusiness}><input type="hidden" name="businessName" value={businessDetails.businessName} /><input type="hidden" name="service" value={businessDetails.service} /><input type="hidden" name="businessCategory" value={businessDetails.businessCategory} /><input type="hidden" name="businessPhone" value={businessDetails.businessPhone} /><label>Business address<input name="address" placeholder="Street, area, city, PIN code" required /></label><button type="button" className="outline-button full-button" onClick={() => { if (!navigator.geolocation) { showNotice("Location access is not available."); return; } navigator.geolocation.getCurrentPosition(() => setLocationConsent(true), () => showNotice("Location permission was not granted.")); }}>⌖ {locationConsent ? "Device location permission granted" : "Check device location permission"}</button><label>Agent referral code <span className="optional">(optional)</span><input name="referral" placeholder="e.g. NEIGHBOR-4821" /></label><label>Upload business proof <span className="optional">(GSTIN, license or other registration)</span><input name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" /></label><label className="consent-check"><input type="checkbox" required /><span>I confirm these business details are accurate and consent to their use to create and verify my Neighborly business profile.</span></label><div className="form-button-row"><button type="button" className="outline-button" onClick={() => setStep(1)}>← Back</button><button type="submit" className="primary-button">Submit registration <span>→</span></button></div></form>}
        <div className="fine-print">Registration is saved in this demo only. Document verification and listing activation require a secure backend.</div></>}
      {kind === "plans" && <><div className="modal-mark">↗</div><div className="eyebrow">MEMBERSHIP & PAYMENTS</div><h2>{checkoutPlan ? `Preview ${checkoutPlan} checkout.` : "Choose a plan to get discovered."}</h2><p>No charge is created. Do not enter real payment details in this demo.</p>
        {!checkoutPlan ? <div className="compact-plans">{planNames.map((plan, index) => <button key={plan} onClick={() => setCheckoutPlan(plan)}><span>{plan} · {["₹499", "₹999", "₹1,999"][index]} / month</span><span>→</span></button>)}</div> :
          <form className="stacked-form" onSubmit={(event) => { event.preventDefault(); if (!checkoutBusiness) { showNotice("Register a business before previewing a subscription."); return; } onCheckout(checkoutBusiness, checkoutPlan, paymentMethod); }}>
            <label>Business<select value={checkoutBusiness} onChange={(event) => setCheckoutBusiness(event.target.value)}>{businesses.map((business) => <option key={business.name}>{business.name}</option>)}</select></label>
            <label>Payment method preview<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option>UPI (preview only)</option><option>Card (preview only)</option></select></label>
            <div className="payment-preview">Secure provider checkout is not connected. This step records only a local preview; it will not charge, activate a plan or save payment credentials.</div>
            <div className="form-button-row"><button type="button" className="outline-button" onClick={() => setCheckoutPlan("")}>← Plans</button><button className="primary-button" type="submit">Preview checkout →</button></div>
          </form>}
        <div className="fine-print">Production payments require server-created orders, a payment provider, verified webhooks, refunds and secure billing records.</div></>}
      {kind === "sos" && <><div className="sos-modal-mark">✚</div><div className="eyebrow">EMERGENCY HELP</div><h2>Are you in immediate danger?</h2><p>This demo cannot dispatch emergency services. If you're in India, call <strong>112</strong> for emergency response.</p><div className="emergency-actions"><a href="tel:112" className="primary-button" onClick={() => showNotice("Opening your phone app to call emergency services.")}>Call 112 now <span>↗</span></a><form className="emergency-contact-form" onSubmit={(event) => { event.preventDefault(); const message = encodeURIComponent("I need emergency help. Please call me and contact local emergency services."); window.location.href = `sms:${emergencyPhone}?body=${message}`; close(); showNotice("SMS draft opened. Confirm sending in your messaging app; no message was sent by Neighborly."); }}><label>Emergency contact mobile number<input type="tel" value={emergencyPhone} onChange={(event) => setEmergencyPhone(event.target.value)} placeholder="+91 98765 43210" minLength={8} maxLength={20} required /></label><button className="outline-button" type="submit">Open SOS text message</button></form></div><div className="fine-print">The SMS opens on your device for you to review and send. This demo does not save the contact, send messages, or share location.</div></>}
    </section>
  </div>;
}
