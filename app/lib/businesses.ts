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

export async function readBusinessRecords(): Promise<StoredBusiness[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredBusiness[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
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
    if (b.email && b.email.toLowerCase() === normalizedIdentity) return true;
    const bDigits = b.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits))) {
      return true;
    }
    return b.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (!found) return null;
  const { salt, passwordHash, ...pub } = found;
  return pub;
}

export async function verifyBusinessCredentials(identity: string, password: string): Promise<boolean> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalizedIdentity = identity.trim().toLowerCase();
  const records = await readBusinessRecords();

  const found = records.find((b) => {
    if (b.email && b.email.toLowerCase() === normalizedIdentity) return true;
    const bDigits = b.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits))) {
      return true;
    }
    return b.phone.trim().toLowerCase() === normalizedIdentity;
  });

  if (!found) return false;
  return passwordsMatch(password, found.salt, found.passwordHash);
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
  pincode?: string;
  description?: string;
  website?: string;
  gstin?: string;
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

  const address: BusinessAddress = {
    doorNumber: (input.doorNo || input.doorNumber || "").trim() || (existingIndex >= 0 ? records[existingIndex].address.doorNumber : ""),
    street: input.street?.trim() || (existingIndex >= 0 ? records[existingIndex].address.street : ""),
    area: input.locality?.trim() || (existingIndex >= 0 ? records[existingIndex].address.area : "Bagalur Road"),
    cityTown: "Hosur",
    taluka: "Hosur",
    district: "Krishnagiri",
    state: "Tamil Nadu",
    pincode: input.pincode?.trim() || (existingIndex >= 0 ? records[existingIndex].address.pincode : "635109"),
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
    description: input.description?.trim() || `${input.category} in ${input.locality || "Hosur"}`,
    images: input.images || [],
    photos: input.images || [],
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
