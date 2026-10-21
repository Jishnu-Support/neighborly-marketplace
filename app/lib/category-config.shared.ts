export type CategorySector = { name: string; icon: string; paths: string[][] };
export type CategoryConfig = { sectors: CategorySector[] };
const categories = [
  { name: "All", icon: "✳" },
  { name: "Automobiles", icon: "\u{1F697}" },
  { name: "Electronics", icon: "▣" },
  { name: "Fashion", icon: "◇" },
  { name: "Home & furniture", icon: "⌂" },
  { name: "Food & dining", icon: "♨" },
  { name: "Health & wellness", icon: "✚" },
  { name: "Travel", icon: "↗" },
  { name: "Entertainment", icon: "♫" },
  { name: "Everyday services", icon: "✳" },
];

const electronicsDeviceGroups: [string, [string, string[]][]][] = [
  ["Mobile phones", [["Apple", ["iPhone 17", "iPhone 16"]], ["Samsung", ["Galaxy S25", "Galaxy A56"]], ["Google", ["Pixel 10", "Pixel 10 Pro"]], ["Motorola", ["Edge 60", "Moto G86"]], ["Xiaomi", ["Redmi Note 14", "Xiaomi 15"]], ["OnePlus", ["OnePlus 13", "OnePlus 13R"]]]],
  ["Laptops & computers", [["Apple", ["MacBook Air", "MacBook Pro"]], ["Dell", ["Inspiron", "XPS"]], ["HP", ["Pavilion", "OmniBook"]], ["Lenovo", ["ThinkPad", "IdeaPad"]], ["ASUS", ["Vivobook", "Zenbook"]], ["Acer", ["Aspire", "Swift"]]]],
  ["Home appliances", [["LG", ["InstaView refrigerator", "AI DD washing machine"]], ["Samsung", ["Bespoke refrigerator", "Bespoke washing machine"]], ["Whirlpool", ["IntelliFresh refrigerator", "Stainwash washing machine"]], ["Bosch", ["Series 6 washing machine", "Series 6 dishwasher"]], ["IFB", ["Senator washing machine", "Neptune dishwasher"]], ["Godrej", ["Edge refrigerator", "Eon washing machine"]]]],
  ["Audio & video", [["Sony", ["BRAVIA television", "WH-1000XM6 headphones"]], ["Samsung", ["Crystal UHD television", "Q-series soundbar"]], ["LG", ["OLED evo television", "XBOOM speaker"]], ["JBL", ["Flip portable speaker", "Tune headphones"]], ["Bose", ["QuietComfort headphones", "SoundLink speaker"]], ["Philips", ["TAB soundbar", "TAT earbuds"]]]],
  ["Cameras", [["Canon", ["EOS R50", "EOS R6 Mark III"]], ["Sony", ["Alpha a6400", "Alpha a7 IV"]], ["Nikon", ["Z50II", "Z6III"]], ["Fujifilm", ["X-S20", "X-T5"]], ["Panasonic", ["LUMIX G97", "LUMIX S5II"]], ["GoPro", ["HERO13 Black", "MAX2"]]]],
];

const taxonomyPaths: Record<string, string[][]> = {
  Automobiles: [
    ["Car repair", "Cars", "Engine & transmission", "Diagnostics"],
    ["Car repair", "Cars", "Wheels & tyres", "Tyre replacement"],
    ["Two-wheeler service", "Motorcycles", "Routine service", "Oil & filter"],
    ["Two-wheeler service", "Scooters", "Brake & tyre care", "Brake pads"],
    ["Tyres & batteries", "Vehicle batteries", "Battery replacement", "Car battery"],
    ["Car wash", "Exterior care", "Wash packages", "Full service wash"],
  ],
  Electronics: [
    ...["Sales", "Service"].flatMap((activity) => electronicsDeviceGroups.flatMap(([productType, companies]) =>
      companies.flatMap(([company, models]) => models.map((model) => [activity, productType, company, model]))
    )),
  ],
  Fashion: [
    ["Clothing", "Women", "Everyday wear", "Kurtas & kurtis"],
    ["Clothing", "Women", "Occasion wear", "Sarees & dresses"],
    ["Clothing", "Men", "Everyday wear", "Shirts & trousers"],
    ["Clothing", "Men", "Occasion wear", "Ethnic wear"],
    ["Clothing", "Kids", "Everyday wear", "Kids clothing"],
    ["Footwear", "Shoes", "Casual", "Everyday sneakers"],
    ["Footwear", "Shoes", "Formal", "Formal shoes"],
    ["Footwear", "Sandals & slippers", "Daily wear", "Sandals"],
    ["Jewellery", "Traditional jewellery", "Earrings", "Everyday earrings"],
    ["Jewellery", "Handmade jewellery", "Necklaces", "Handcrafted necklaces"],
    ["Bags & accessories", "Bags", "Daily use", "Handbags & backpacks"],
    ["Bags & accessories", "Accessories", "Fashion accessories", "Belts & wallets"],
    ["Tailoring", "Clothing alterations", "Repairs", "Alterations & fitting"],
    ["Tailoring", "Custom stitching", "Women", "Blouse stitching"],
    ["Textiles", "Handloom", "Cotton fabrics", "Dress materials"],
    ["Textiles", "Home textiles", "Bed & bath", "Bedsheets & towels"],
  ],
  "Home & furniture": [
    ["Furniture", "Living room", "Seating", "Sofas & chairs"],
    ["Furniture", "Living room", "Tables", "Coffee & side tables"],
    ["Furniture", "Bedroom", "Beds", "Beds & headboards"],
    ["Furniture", "Bedroom", "Storage", "Wardrobes"],
    ["Furniture", "Dining", "Dining sets", "Dining tables & chairs"],
    ["Home decor", "Wall decor", "Art & hangings", "Wall art"],
    ["Home decor", "Lighting", "Indoor lighting", "Lamps & fixtures"],
    ["Home decor", "Soft furnishings", "Windows", "Curtains & blinds"],
    ["Kitchen & storage", "Kitchen fittings", "Cabinets", "Modular kitchen cabinets"],
    ["Kitchen & storage", "Storage solutions", "Shelving", "Storage racks"],
    ["Repairs", "Carpentry", "Furniture repair", "Wood repair"],
    ["Repairs", "Furniture assembly", "Installation", "Furniture fitting"],
    ["Interior design", "Home planning", "Room design", "Design consultation"],
    ["Interior design", "Home planning", "Room makeover", "Space planning"],
  ],
  "Food & dining": [
    ["Restaurants", "Indian", "South Indian", "Dosa & idli"],
    ["Restaurants", "Indian", "North Indian", "Meals & thalis"],
    ["Restaurants", "International", "Asian", "Chinese meals"],
    ["Meal delivery", "Daily meals", "Lunch", "Homestyle lunch"],
    ["Meal delivery", "Daily meals", "Dinner", "Dinner meals"],
    ["Meal delivery", "Breakfast", "Regional specials", "Breakfast box"],
    ["Groceries & produce", "Fresh produce", "Vegetables", "Seasonal vegetables"],
    ["Groceries & produce", "Fresh produce", "Fruits", "Fresh fruits"],
    ["Groceries & produce", "Pantry", "Staples", "Rice & pulses"],
    ["Bakery & sweets", "Baked goods", "Breads & buns", "Fresh bread"],
    ["Bakery & sweets", "Cakes", "Celebrations", "Custom cakes"],
    ["Bakery & sweets", "Indian sweets", "Fresh sweets", "Traditional sweets"],
    ["Cafes & beverages", "Coffee & tea", "Hot drinks", "Coffee & tea"],
    ["Cafes & beverages", "Cold drinks", "Juices", "Fresh juice"],
    ["Catering", "Events", "Small gatherings", "Party catering"],
    ["Catering", "Events", "Large gatherings", "Event catering"],
  ],
  "Health & wellness": [
    ["Clinics", "General care", "Appointments", "Doctor consultation"],
    ["Clinics", "Paediatrics", "Appointments", "Child health consultation"],
    ["Clinics", "Eye care", "Appointments", "Eye examination"],
    ["Dental care", "Dental clinics", "Check-ups", "Dental consultation"],
    ["Dental care", "Dental clinics", "Treatment", "Cleaning & fillings"],
    ["Pharmacies", "Medicines", "Prescription support", "Prescription medicines"],
    ["Pharmacies", "Medicines", "Local delivery", "Medicine delivery"],
    ["Physiotherapy", "Mobility care", "Assessment", "Physiotherapy assessment"],
    ["Physiotherapy", "Mobility care", "Treatment", "Physiotherapy session"],
    ["Fitness", "Personal training", "Strength", "Strength training"],
    ["Fitness", "Group exercise", "Classes", "Yoga classes"],
    ["Personal care", "Wellness", "Consultation", "Wellness consultation"],
    ["Personal care", "Salon services", "Hair care", "Haircut & styling"],
  ],
  Travel: [
    ["Travel agents", "Holiday planning", "Domestic trips", "Custom itinerary"],
    ["Travel agents", "Holiday planning", "International trips", "Travel planning"],
    ["Stays", "Hotels", "Family stays", "Hotel room booking"],
    ["Stays", "Guest houses", "Short stays", "Guest house booking"],
    ["Local transport", "Airport rides", "Cars", "Airport transfer"],
    ["Local transport", "City rides", "Two-wheelers", "Local bike rental"],
    ["Tours & experiences", "Local experiences", "Guided tours", "City tour"],
    ["Tours & experiences", "Outdoor trips", "Day trips", "Local day trip"],
    ["Car rentals", "Self drive", "Daily rental", "Car hire"],
    ["Car rentals", "With driver", "Local travel", "Car with driver"],
    ["Bus & rail services", "Bus tickets", "Intercity travel", "Bus booking support"],
  ],
  Entertainment: [
    ["Events", "Community events", "Workshops", "Weekend workshop"],
    ["Events", "Celebrations", "Private events", "Event planning"],
    ["Movies & cinema", "Cinema", "Show times", "Movie tickets"],
    ["Movies & cinema", "Home viewing", "Equipment hire", "Projector rental"],
    ["Music", "Live music", "Local artists", "Live performance"],
    ["Music", "Music lessons", "Instruments", "Music classes"],
    ["Classes & workshops", "Arts & crafts", "Creative classes", "Craft workshop"],
    ["Classes & workshops", "Dance", "Dance classes", "Dance lesson"],
    ["Outdoor activities", "Family activities", "Local outings", "Activity booking"],
    ["Outdoor activities", "Sports", "Coaching", "Sports coaching"],
    ["Gaming", "Games & recreation", "Indoor activities", "Game session"],
  ],
  "Everyday services": [
    ["Plumbing", "Home plumbing", "Repairs", "Leak repair"],
    ["Plumbing", "Bathroom plumbing", "Installation", "Tap & fixture installation"],
    ["Electrical", "Home electrical", "Repairs", "Wiring repair"],
    ["Electrical", "Home electrical", "Installation", "Lighting installation"],
    ["Cleaning", "Home cleaning", "Full home", "Deep cleaning"],
    ["Cleaning", "Home cleaning", "Focused cleaning", "Kitchen cleaning"],
    ["Appliance repair", "Kitchen appliances", "Repair", "Refrigerator service"],
    ["Appliance repair", "Laundry appliances", "Repair", "Washing machine service"],
    ["Home services", "Pest control", "Treatment", "Home pest treatment"],
    ["Home services", "Moving help", "Packing & moving", "Local move assistance"],
    ["Home services", "Gardening", "Garden care", "Garden maintenance"],
    ["Professional services", "Consulting", "Local experts", "Initial consultation"],
    ["Professional services", "Accounting", "Small business", "Bookkeeping support"],
    ["Professional services", "Photography", "Events", "Event photography"],
  ],
};

function addSalesAndService(paths: string[][]): string[][] {
  return paths.flatMap((path) => ["Sales", "Service"].map((activity) => [activity, ...path]));
}

// Used to safely migrate saved defaults without overwriting admin-customized paths.
export const legacyDefaultCategoryConfig: CategoryConfig = {
  sectors: categories.slice(1).map(({ name, icon }) => ({ name, icon, paths: taxonomyPaths[name] || [] })),
};

export const defaultCategoryConfig: CategoryConfig = {
  sectors: categories.slice(1).map(({ name, icon }) => ({
    name,
    icon,
    paths: name === "Electronics" || name === "Automobiles"
      ? taxonomyPaths[name] || []
      : addSalesAndService(taxonomyPaths[name] || []),
  })),
};
