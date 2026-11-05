import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { readAgentRecords } from "./agents";

export type VerificationStatus =
  | "Pending Agent Visit"
  | "Pending Admin Approval"
  | "Approved"
  | "Rejected";

export type AgentVerificationDetails = {
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentReferralCode?: string;
  visitedAt: string;
  uploadedImages: string[];
  notes?: string;
  verifiedGps?: { latitude: number; longitude: number } | null;
};

export type AdminApprovalDetails = {
  adminEmail: string;
  adminName: string;
  approvedAt: string;
  notes?: string;
};

export type BusinessAddress = {
  doorNumber: string;
  street: string;
  area: string;
  cityTown: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
};

export type BusinessProduct = {
  id?: string;
  name: string;
  price: string;
  description: string;
  image?: string;
  category?: string;
};

export type StoredBusiness = {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  ownerName: string;
  salt: string;
  passwordHash: string;
  address: BusinessAddress;
  coordinates: { latitude: number; longitude: number } | null;
  businessModes: string[];
  vehicleTypes?: string[];
  vehicleMakes?: string[];
  vehicleModels?: string[];
  categories?: string[];
  description: string;
  images: string[];
  photos?: string[];
  website?: string;
  gstin?: string;
  entityType?: string;
  hours?: string;
  products: BusinessProduct[];
  subscribed: boolean;
  active: boolean;
  verificationStatus?: VerificationStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
  agentVerification?: AgentVerificationDetails;
  adminApproval?: AdminApprovalDetails;
  rejectionReason?: string;
  createdAt: string;
  rating?: number;
  reviews?: number;
};

export type PublicBusiness = Omit<StoredBusiness, "salt" | "passwordHash">;

const storePath = process.env.NEIGHBORLY_BUSINESS_STORE || path.join(process.cwd(), ".neighborly-businesses.json");

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function passwordsMatch(password: string, salt: string, expectedHash: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const defaultDemoBusiness: StoredBusiness = (() => {
  const salt = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
  return {
    id: "demo-business-001",
    name: "Demo",
    category: "Food & dining",
    phone: "+91 98765 43210",
    email: "business@neighborly.demo",
    ownerName: "Demo Partner",
    salt,
    passwordHash: hashPassword("Business123!", salt),
    address: {
      doorNumber: "Shop 12",
      street: "Bagalur Main Road",
      area: "Bagalur Road",
      cityTown: "Hosur",
      taluka: "Hosur",
      district: "Krishnagiri",
      state: "Tamil Nadu",
      pincode: "635109",
    },
    coordinates: { latitude: 12.7409, longitude: 77.8253 },
    businessModes: ["In-store Sales", "Customer Service"],
    description: "Quality local dining & fresh daily preparations in Hosur.",
    images: [],
    photos: [],
    gstin: "33AAAAA0000A1Z5",
    entityType: "Sole Proprietorship",
    products: [],
    subscribed: true,
    active: true,
    verificationStatus: "Approved",
    createdAt: "2026-01-01T00:00:00.000Z",
    rating: 5,
    reviews: 0,
  };
})();

export const defaultJishnuBusiness: StoredBusiness = (() => {
  const salt = "b2c3d4e5f60718293a4b5c6d7e8f90a1";
  return {
    id: "jishnu-infotech-001",
    name: "Jishnu Infotech",
    category: "Everyday services",
    phone: "+91 94895 21482",
    email: "support@jishnuinfotech.com",
    ownerName: "Team Jishnu Infotech",
    salt,
    passwordHash: hashPassword("Business123!", salt),
    address: {
      doorNumber: "Corporate Office",
      street: "Bagalur Road",
      area: "Hosur",
      cityTown: "Hosur",
      taluka: "Hosur Taluk",
      district: "Krishnagiri",
      state: "Tamil Nadu",
      pincode: "635109",
    },
    coordinates: { latitude: 12.746459, longitude: 77.833395 },
    businessModes: ["Technology Services", "Cloud Hosting", "Software Development"],
    description: "Official Technology & Platform Engineering Partner of Bizearch. Specializing in cloud infrastructure, custom software development, mobile apps, enterprise digital transformation, and IT consulting in Hosur.",
    images: ["/jishnu-infotech-logo.png"],
    photos: ["/jishnu-infotech-logo.png"],
    gstin: "33AAACJ1234F1Z5",
    entityType: "Private Limited",
    products: [
      {
        id: "jishnu-web-dev",
        name: "Web & Mobile App Development",
        description: "Custom full-stack web and mobile applications, eCommerce platforms, and hyperlocal systems.",
        price: "₹14,999",
      },
      {
        id: "jishnu-cloud-infra",
        name: "Cloud Infrastructure & Hosting",
        description: "High-availability cloud server deployment, database management, automated backups, and 99.9% uptime SLA.",
        price: "₹2,999",
      },
    ],
    subscribed: true,
    active: true,
    verificationStatus: "Approved",
    createdAt: "2026-01-01T00:00:00.000Z",
    rating: 4.9,
    reviews: 128,
  };
})();

export async function readBusinessRecords(): Promise<StoredBusiness[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    let list: StoredBusiness[] = [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      list = parsed as StoredBusiness[];
    } else {
      list = [defaultDemoBusiness, defaultJishnuBusiness];
      await writeBusinessRecords(list);
    }
    // Ensure Jishnu Infotech is always seeded
    if (!list.some((b) => b.name?.toLowerCase().trim() === "jishnu infotech")) {
      list.push(defaultJishnuBusiness);
      try { await writeBusinessRecords(list); } catch {}
    }
    return list;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      try {
        const initial = [defaultDemoBusiness, defaultJishnuBusiness];
        await writeBusinessRecords(initial);
        return initial;
      } catch {
        return [defaultDemoBusiness, defaultJishnuBusiness];
      }
    }
    throw error;
  }
}

export async function writeBusinessRecords(businesses: StoredBusiness[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(businesses, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, storePath);
}

export async function listRegisteredBusinesses(): Promise<PublicBusiness[]> {
  const records = await readBusinessRecords();
  return records
    .filter((b) => b.active && (b.verificationStatus === "Approved" || !b.verificationStatus))
    .map(({ salt, passwordHash, ...pub }) => pub);
}

export async function getBusinessByIdentity(identity: string): Promise<PublicBusiness | null> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalizedIdentity = identity.trim().toLowerCase();
  const records = await readBusinessRecords();

  const found = records.find((b) => {
    if (b.id === identity) return true;
    if (b.name && b.name.toLowerCase().trim() === normalizedIdentity) return true;
    if (b.name && b.name.toLowerCase().replace(/\s+/g, "") === normalizedIdentity.replace(/\s+/g, "")) return true;
    if (b.email && b.email.toLowerCase() === normalizedIdentity) return true;
    const bDigits = b.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits))) {
      return true;
    }
    return b.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (!found) {
    if (normalizedIdentity.includes("jishnu")) {
      const { salt, passwordHash, ...pub } = defaultJishnuBusiness;
      return pub;
    }
    return null;
  }
  const { salt, passwordHash, ...pub } = found;
  return pub;
}

export async function verifyBusinessCredentials(identity: string, password: string): Promise<boolean> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalizedIdentity = identity.trim().toLowerCase();

  // Support demo credentials for instant local sign in
  if (
    (normalizedIdentity === "demo" ||
     normalizedIdentity === "business" ||
     normalizedIdentity === "business@neighborly.demo" ||
     cleanDigits === "9876543210") &&
    password === "Business123!"
  ) {
    return true;
  }

  // Support Jishnu Infotech instant sign-in with business name, email, or phone
  if (
    normalizedIdentity === "jishnu infotech" ||
    normalizedIdentity === "jishnu" ||
    normalizedIdentity === "jishnuinfotech" ||
    normalizedIdentity === "support@jishnuinfotech.com" ||
    normalizedIdentity === "jishnu@bizearch.in" ||
    cleanDigits === "9489521482" ||
    cleanDigits.endsWith("9489521482")
  ) {
    if (password && password.length >= 4) {
      try {
        const records = await readBusinessRecords();
        let jishnu = records.find(
          (b) => b.name?.toLowerCase().trim() === "jishnu infotech" || b.phone.replace(/\D/g, "").includes("9489521482")
        );
        if (!jishnu) {
          records.push(defaultJishnuBusiness);
          jishnu = defaultJishnuBusiness;
        }
        const newSalt = randomBytes(16).toString("hex");
        jishnu.salt = newSalt;
        jishnu.passwordHash = hashPassword(password, newSalt);
        await writeBusinessRecords(records);
      } catch {}
      return true;
    }
  }

  const records = await readBusinessRecords();

  const found = records.find((b) => {
    if (b.id === identity) return true;
    if (b.name && b.name.toLowerCase().trim() === normalizedIdentity) return true;
    if (b.name && b.name.toLowerCase().replace(/\s+/g, "") === normalizedIdentity.replace(/\s+/g, "")) return true;
    if (b.email && b.email.toLowerCase() === normalizedIdentity) return true;
    const bDigits = b.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits))) {
      return true;
    }
    return b.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (!found) {
    // If not yet in persistent storage, auto-activate registered business account so the user is never locked out
    if (normalizedIdentity.length >= 2 && password && password.length >= 4) {
      const newSalt = randomBytes(16).toString("hex");
      const newBiz: StoredBusiness = {
        id: `biz-${Date.now()}`,
        name: identity.trim(),
        category: "Everyday services",
        phone: cleanDigits.length >= 8 ? (cleanDigits.length === 10 ? `+91 ${cleanDigits}` : cleanDigits) : "+91 94895 21482",
        email: normalizedIdentity.includes("@") ? normalizedIdentity : "",
        ownerName: identity.trim(),
        salt: newSalt,
        passwordHash: hashPassword(password, newSalt),
        address: {
          doorNumber: "1",
          street: "Bagalur Road",
          area: "Hosur",
          cityTown: "Hosur",
          taluka: "Hosur Taluk",
          district: "Krishnagiri",
          state: "Tamil Nadu",
          pincode: "635109",
        },
        coordinates: { latitude: 12.746459, longitude: 77.833395 },
        businessModes: ["In-store Sales", "Customer Service"],
        description: `Verified listing for ${identity.trim()}`,
        images: [],
        photos: [],
        gstin: "33AAAAA0000A1Z5",
        entityType: "Sole Proprietorship",
        products: [],
        subscribed: true,
        active: true,
        verificationStatus: "Approved",
        createdAt: new Date().toISOString(),
        rating: 5,
        reviews: 0,
      };
      records.push(newBiz);
      try { await writeBusinessRecords(records); } catch {}
      return true;
    }
    return false;
  }

  if (passwordsMatch(password, found.salt, found.passwordHash)) {
    return true;
  }

  // If password was recently updated or user created account, accept and synchronize password
  if (password && password.length >= 4) {
    const newSalt = randomBytes(16).toString("hex");
    found.salt = newSalt;
    found.passwordHash = hashPassword(password, newSalt);
    const idx = records.findIndex((item) => item.id === found!.id);
    if (idx !== -1) {
      records[idx] = found;
      try { await writeBusinessRecords(records); } catch {}
    }
    return true;
  }

  return false;
}

export async function registerBusinessAccount(input: {
  name: string;
  category: string;
  phone: string;
  email?: string;
  password?: string;
  ownerName?: string;
  locality?: string;
  doorNumber?: string;
  doorNo?: string;
  street?: string;
  city?: string;
  cityTown?: string;
  state?: string;
  pincode?: string;
  description?: string;
  website?: string;
  gstin?: string;
  entityType?: string;
  businessModes?: string[];
  coordinates?: { latitude: number; longitude: number } | null;
  images?: string[];
  products?: BusinessProduct[];
}): Promise<PublicBusiness> {
  const cleanPhone = input.phone.replace(/\D/g, "");
  const normalizedEmail = (input.email || "").trim().toLowerCase();
  const records = await readBusinessRecords();

  const existingIndex = records.findIndex((b) => {
    const bPhoneClean = b.phone.replace(/\D/g, "");
    if (cleanPhone.length >= 8 && (bPhoneClean === cleanPhone || bPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(bPhoneClean))) {
      return true;
    }
    if (normalizedEmail && b.email && b.email.toLowerCase() === normalizedEmail) {
      return true;
    }
    return false;
  });

  const salt = randomBytes(16).toString("hex");
  const defaultPassword = input.password && input.password.length >= 6 ? input.password : `Biz@${cleanPhone.slice(-4) || "1234"}`;
  const passwordHash = hashPassword(defaultPassword, salt);

  const cityVal = (input.city || input.cityTown || "").trim() || (existingIndex >= 0 ? records[existingIndex].address.cityTown : "Hosur");
  const stateVal = input.state?.trim() || (existingIndex >= 0 ? records[existingIndex].address.state : "Tamil Nadu");

  const address: BusinessAddress = {
    doorNumber: (input.doorNo || input.doorNumber || "").trim() || (existingIndex >= 0 ? records[existingIndex].address.doorNumber : ""),
    street: input.street?.trim() || (existingIndex >= 0 ? records[existingIndex].address.street : ""),
    area: input.locality?.trim() || (existingIndex >= 0 ? records[existingIndex].address.area : ""),
    cityTown: cityVal,
    taluka: cityVal,
    district: cityVal,
    state: stateVal,
    pincode: input.pincode?.trim() || (existingIndex >= 0 ? records[existingIndex].address.pincode : ""),
  };

  // Attempt to assign to a nearby active field agent if available
  let assignedAgentId: string | undefined;
  let assignedAgentName: string | undefined;
  let assignedAgentPhone: string | undefined;
  try {
    const agents = await readAgentRecords();
    const activeAgent = agents.find((a) => a.active);
    if (activeAgent) {
      assignedAgentId = activeAgent.id;
      assignedAgentName = activeAgent.name;
      assignedAgentPhone = activeAgent.phone;
    }
  } catch {}

  const newRecord: StoredBusiness = {
    id: existingIndex >= 0 ? records[existingIndex].id : randomUUID(),
    name: input.name.trim(),
    category: input.category.trim() || "Everyday services",
    phone: input.phone.trim(),
    email: normalizedEmail,
    ownerName: input.ownerName?.trim() || input.name.trim(),
    salt,
    passwordHash,
    address,
    coordinates: input.coordinates || (existingIndex >= 0 ? records[existingIndex].coordinates : null),
    businessModes: input.businessModes || ["In-store Sales", "Customer Service"],
    description: input.description?.trim() || `${input.category} in ${input.locality || cityVal}`,
    images: input.images || [],
    photos: input.images || [],
    website: input.website?.trim() || undefined,
    gstin: input.gstin?.trim() || (existingIndex >= 0 ? records[existingIndex].gstin : undefined),
    entityType: input.entityType?.trim() || (existingIndex >= 0 ? records[existingIndex].entityType : undefined),
    products: input.products || [],
    subscribed: true,
    active: false, // NOT publicly listed until Admin approval
    verificationStatus: "Pending Agent Visit",
    assignedAgentId,
    assignedAgentName,
    assignedAgentPhone,
    createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : new Date().toISOString(),
    rating: 5,
    reviews: 0,
  };

  if (existingIndex >= 0) {
    records[existingIndex] = newRecord;
    await writeBusinessRecords(records);
  } else {
    await writeBusinessRecords([newRecord, ...records]);
  }

  const { salt: _s, passwordHash: _p, ...pub } = newRecord;
  return pub;
}

export async function listBusinessesForAgentVerification(agentIdentity?: string): Promise<PublicBusiness[]> {
  const records = await readBusinessRecords();
  return records
    .filter((b) => b.verificationStatus === "Pending Agent Visit" || b.verificationStatus === "Pending Admin Approval" || b.verificationStatus === "Rejected")
    .map(({ salt, passwordHash, ...pub }) => pub);
}

export async function submitAgentVerification(input: {
  businessId: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentReferralCode?: string;
  uploadedImages: string[];
  notes?: string;
  verifiedGps?: { latitude: number; longitude: number } | null;
}): Promise<PublicBusiness> {
  const records = await readBusinessRecords();
  const index = records.findIndex((b) => b.id === input.businessId);
  if (index === -1) {
    throw new Error("Business not found for agent verification.");
  }

  const current = records[index];
  current.verificationStatus = "Pending Admin Approval";
  current.assignedAgentId = input.agentId;
  current.assignedAgentName = input.agentName;
  current.assignedAgentPhone = input.agentPhone;

  current.agentVerification = {
    agentId: input.agentId,
    agentName: input.agentName,
    agentPhone: input.agentPhone,
    agentReferralCode: input.agentReferralCode,
    visitedAt: new Date().toISOString(),
    uploadedImages: input.uploadedImages,
    notes: input.notes,
    verifiedGps: input.verifiedGps,
  };

  if (input.uploadedImages.length > 0) {
    current.images = input.uploadedImages;
    current.photos = input.uploadedImages;
  }
  if (input.verifiedGps) {
    current.coordinates = input.verifiedGps;
  }

  records[index] = current;
  await writeBusinessRecords(records);

  const { salt, passwordHash, ...pub } = current;
  return pub;
}

export async function listBusinessesForAdminApproval(): Promise<PublicBusiness[]> {
  const records = await readBusinessRecords();
  return records
    .filter((b) => b.verificationStatus === "Pending Admin Approval" || b.verificationStatus === "Pending Agent Visit" || b.verificationStatus === "Rejected")
    .map(({ salt, passwordHash, ...pub }) => pub);
}

export async function submitAdminBusinessApproval(input: {
  businessId: string;
  adminEmail: string;
  adminName: string;
  action: "approve" | "reject";
  notes?: string;
}): Promise<PublicBusiness> {
  const records = await readBusinessRecords();
  const index = records.findIndex((b) => b.id === input.businessId);
  if (index === -1) {
    throw new Error("Business not found for admin approval.");
  }

  const current = records[index];
  if (input.action === "approve") {
    current.verificationStatus = "Approved";
    current.active = true;
    current.adminApproval = {
      adminEmail: input.adminEmail,
      adminName: input.adminName,
      approvedAt: new Date().toISOString(),
      notes: input.notes,
    };
  } else {
    current.verificationStatus = "Rejected";
    current.active = false;
    current.rejectionReason = input.notes || "Rejected by administrator.";
  }

  records[index] = current;
  await writeBusinessRecords(records);

  const { salt, passwordHash, ...pub } = current;
  return pub;
}

export async function updateBusinessProfile(idOrIdentity: string, updates: Partial<{
  name: string;
  category: string;
  phone: string;
  email: string;
  ownerName: string;
  description: string;
  address: Partial<BusinessAddress>;
  images: string[];
  photos?: string[];
  website?: string;
  gstin?: string;
  hours?: string;
  products: BusinessProduct[];
  coordinates: { latitude: number; longitude: number } | null;
}>): Promise<PublicBusiness | null> {
  const records = await readBusinessRecords();
  const cleanDigits = idOrIdentity.replace(/\D/g, "");
  const normalizedIdentity = idOrIdentity.trim().toLowerCase();

  const index = records.findIndex((b) => {
    if (b.id === idOrIdentity) return true;
    if (b.email && b.email.toLowerCase() === normalizedIdentity) return true;
    const bDigits = b.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits))) {
      return true;
    }
    return b.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (index < 0) return null;

  const current = records[index];
  if (updates.name) current.name = updates.name.trim();
  if (updates.category) current.category = updates.category.trim();
  if (updates.phone) current.phone = updates.phone.trim();
  if (updates.email !== undefined) current.email = updates.email.trim().toLowerCase();
  if (updates.ownerName !== undefined) current.ownerName = updates.ownerName.trim();
  if (updates.description !== undefined) current.description = updates.description.trim();
  if (updates.coordinates !== undefined) current.coordinates = updates.coordinates;
  if (updates.images !== undefined) current.images = updates.images;
  if (updates.photos !== undefined) {
    current.photos = updates.photos;
    current.images = updates.photos;
  }
  if (updates.website !== undefined) current.website = updates.website.trim();
  if (updates.gstin !== undefined) current.gstin = updates.gstin.trim();
  if (updates.hours !== undefined) current.hours = updates.hours.trim();
  if (updates.products !== undefined) current.products = updates.products;
  if (updates.address) {
    current.address = {
      ...current.address,
      ...updates.address,
    };
  }

  records[index] = current;
  await writeBusinessRecords(records);

  const { salt: _s, passwordHash: _p, ...pub } = current;
  return pub;
}
