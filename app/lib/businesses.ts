import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { readAgentRecords, writeAgentRecords, createDefaultJitAgent } from "./agents";
import { resolveStorePath } from "./storage-paths";
import { NEIGHBORHOOD_CENTROIDS, calculateDistanceMeters } from "./ad-booking.shared";

export type VerificationStatus =
  | "Pending Agent Assignment"
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
  distanceMeters?: number;
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

export type BusinessReview = {
  id: string;
  userName: string;
  userPhone?: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type DayOperatingSchedule = {
  open: string;
  close: string;
  isClosed?: boolean;
};

export type WeeklyOperatingSchedule = {
  monday: DayOperatingSchedule;
  tuesday: DayOperatingSchedule;
  wednesday: DayOperatingSchedule;
  thursday: DayOperatingSchedule;
  friday: DayOperatingSchedule;
  saturday: DayOperatingSchedule;
  sunday: DayOperatingSchedule;
};

export type StoredBusiness = {
  id: string;
  name: string;
  category: string;
  phone: string;
  emergencyPhone?: string;
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
  operatingHours?: WeeklyOperatingSchedule;
  products: BusinessProduct[];
  subscribed: boolean;
  active: boolean;
  verificationStatus?: VerificationStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
  agentReferralCode?: string;
  agentVerification?: AgentVerificationDetails;
  adminApproval?: AdminApprovalDetails;
  rejectionReason?: string;
  disabledReason?: string;
  createdAt: string;
  rating?: number;
  reviews?: number;
  customerReviews?: BusinessReview[];
};

export type PublicBusiness = Omit<StoredBusiness, "salt" | "passwordHash">;

const storePath = resolveStorePath("NEIGHBORLY_BUSINESS_STORE", ".neighborly-businesses.json");

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
    if (Array.isArray(parsed)) {
      const records = parsed as StoredBusiness[];
      let modified = false;

      // Purge deleted/requested removal businesses (e.g. Glitterr&Glow)
      const DELETED_IDS = ["61d65069-f00c-47fe-90c4-d8b241dfd865"];
      const DELETED_NAMES = ["glitterr&glow", "glitter&glow"];
      const initialCount = records.length;
      const retained = records.filter(
        (b) =>
          !DELETED_IDS.includes(b.id) &&
          !DELETED_NAMES.includes((b.name || "").trim().toLowerCase())
      );
      if (retained.length !== initialCount) {
        records.length = 0;
        records.push(...retained);
        modified = true;
      }

      for (const b of records) {
        if (!b.coordinates || typeof b.coordinates.latitude !== "number" || typeof b.coordinates.longitude !== "number") {
          if (b.agentVerification?.verifiedGps?.latitude && b.agentVerification?.verifiedGps?.longitude) {
            b.coordinates = {
              latitude: b.agentVerification.verifiedGps.latitude,
              longitude: b.agentVerification.verifiedGps.longitude,
            };
            modified = true;
          } else {
            const areaKey = b.address?.area || "";
            const centroid = NEIGHBORHOOD_CENTROIDS[areaKey] || { latitude: 12.7409, longitude: 77.8253 };
            b.coordinates = { latitude: centroid.latitude, longitude: centroid.longitude };
            modified = true;
          }
        }
      }
      if (modified) {
        try {
          await writeBusinessRecords(records);
        } catch {}
      }
      return records;
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
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
    if (b.name && b.name.toLowerCase() === normalizedIdentity) return true;
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
    if (b.id === identity) return true;
    if (b.name && b.name.toLowerCase() === normalizedIdentity) return true;
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
  emergencyPhone?: string;
  email?: string;
  password?: string;
  ownerName?: string;
  referralCode?: string;
  agentReferralCode?: string;
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
  creatorRole?: "Company" | "Agent" | "Business" | "Customer";
  creatorIdentity?: string;
  creatorName?: string;
}): Promise<PublicBusiness> {
  if (
    !input.coordinates ||
    typeof input.coordinates.latitude !== "number" ||
    typeof input.coordinates.longitude !== "number" ||
    !Number.isFinite(input.coordinates.latitude) ||
    !Number.isFinite(input.coordinates.longitude)
  ) {
    throw new Error("Business location GPS coordinates are mandatory. Please pin your storefront location on the map.");
  }

  const cleanPhone = (input.phone || "").replace(/\D/g, "");
  const normalizedEmail = (input.email || "").trim().toLowerCase();
  if (!cleanPhone && !normalizedEmail) {
    throw new Error("A valid mobile number or email address is required as the business username.");
  }
  const records = await readBusinessRecords();

  const existingIndex = records.findIndex((b) => {
    const bPhoneClean = (b.phone || "").replace(/\D/g, "");
    if (cleanPhone.length >= 8 && (bPhoneClean === cleanPhone || bPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(bPhoneClean))) {
      return true;
    }
    if (normalizedEmail && b.email && b.email.toLowerCase() === normalizedEmail) {
      return true;
    }
    return false;
  });

  const salt = randomBytes(16).toString("hex");
  const defaultPassword = input.password && input.password.length >= 6
    ? input.password
    : (cleanPhone ? `Biz@${cleanPhone.slice(-4) || "1234"}` : "Biz@2026");
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

  // Handle agent assignment & verification status based on creator role and referral code
  const rawRef = (input.referralCode || input.agentReferralCode || "").trim().toUpperCase();
  let assignedAgentId: string = "";
  let assignedAgentName: string = "Unassigned (Pending Company Assignment)";
  let assignedAgentPhone: string = "";
  let matchedAgentReferralCode: string = "";
  let verificationStatus: VerificationStatus = "Pending Agent Assignment";
  let isActive = false;
  let adminApprovalDetails: AdminApprovalDetails | undefined = undefined;
  let agentVerificationDetails: AgentVerificationDetails | undefined = undefined;

  const agents = await readAgentRecords();

  if (input.creatorRole === "Company") {
    // Registered directly by Company Admin or Super Admin: Auto-approved and immediately active!
    isActive = true;
    verificationStatus = "Approved";
    assignedAgentId = "company-admin";
    assignedAgentName = input.creatorName || "Company Admin";
    assignedAgentPhone = input.creatorIdentity || "";
    matchedAgentReferralCode = "";
    adminApprovalDetails = {
      adminEmail: input.creatorIdentity || "admin@bizearch.in",
      adminName: input.creatorName || "Company Admin",
      approvedAt: new Date().toISOString(),
      notes: "Created directly by Company Admin — Auto-approved",
    };
    agentVerificationDetails = {
      agentId: "company-admin",
      agentName: input.creatorName || "Company Admin",
      agentPhone: input.creatorIdentity || "",
      visitedAt: new Date().toISOString(),
      uploadedImages: input.images || [],
      verifiedGps: input.coordinates,
      notes: "Onboarded directly by Company Administrator",
      distanceMeters: 0,
    };
  } else if (input.creatorRole === "Agent") {
    // Registered by an Agent: Auto-verified on-site by this agent, ready for Company approval!
    isActive = false;
    verificationStatus = "Pending Admin Approval";
    const agentMatch = agents.find(
      (a) =>
        a.id === input.creatorIdentity ||
        (input.creatorIdentity && a.phone.replace(/\D/g, "") === input.creatorIdentity.replace(/\D/g, "")) ||
        (input.creatorIdentity && a.email && a.email.toLowerCase() === input.creatorIdentity.toLowerCase()) ||
        (input.creatorIdentity && a.name.toLowerCase() === input.creatorIdentity.toLowerCase())
    );
    assignedAgentId = agentMatch?.id || input.creatorIdentity || "agent";
    assignedAgentName = agentMatch?.name || input.creatorName || "Agent Partner";
    assignedAgentPhone = agentMatch?.phone || "";
    matchedAgentReferralCode = agentMatch?.referralCode || "";
    agentVerificationDetails = {
      agentId: assignedAgentId,
      agentName: assignedAgentName,
      agentPhone: assignedAgentPhone,
      agentReferralCode: matchedAgentReferralCode,
      visitedAt: new Date().toISOString(),
      uploadedImages: input.images || [],
      verifiedGps: input.coordinates,
      notes: `Onboarded and verified on-site by Agent ${assignedAgentName}`,
      distanceMeters: 0,
    };
  } else {
    // Standard public or business self-registration
    const findJit = () => {
      let jit = agents.find(
        (a) => (a.referralCode || "").trim().toUpperCase() === "JIT" || (a.name || "").trim().toUpperCase() === "JIT"
      );
      if (!jit) {
        jit = createDefaultJitAgent();
        agents.push(jit);
      }
      return jit;
    };

    if (rawRef) {
      const matchedAgent = agents.find(
        (a) =>
          (a.referralCode || "").trim().toUpperCase() === rawRef ||
          (a.name || "").trim().toUpperCase() === rawRef
      );

      if (matchedAgent) {
        assignedAgentId = matchedAgent.id;
        assignedAgentName = matchedAgent.name;
        assignedAgentPhone = matchedAgent.phone;
        matchedAgentReferralCode = matchedAgent.referralCode;
        matchedAgent.referredCount = (matchedAgent.referredCount || 0) + 1;
        verificationStatus = "Pending Agent Visit";
        await writeAgentRecords(agents);
      } else {
        // If referral code is not found, automatically assign to default JIT agent
        const jitAgent = findJit();
        assignedAgentId = jitAgent.id;
        assignedAgentName = jitAgent.name;
        assignedAgentPhone = jitAgent.phone;
        matchedAgentReferralCode = "JIT";
        jitAgent.referredCount = (jitAgent.referredCount || 0) + 1;
        verificationStatus = "Pending Agent Visit";
        await writeAgentRecords(agents);
      }
    } else {
      // If the business does not enter any referral code, assign verification to default JIT agent!
      const jitAgent = findJit();
      assignedAgentId = jitAgent.id;
      assignedAgentName = jitAgent.name;
      assignedAgentPhone = jitAgent.phone;
      matchedAgentReferralCode = "JIT";
      jitAgent.referredCount = (jitAgent.referredCount || 0) + 1;
      verificationStatus = "Pending Agent Visit";
      await writeAgentRecords(agents);
    }
  }

  const newRecord: StoredBusiness = {
    id: existingIndex >= 0 ? records[existingIndex].id : randomUUID(),
    name: input.name.trim(),
    category: input.category.trim() || "Everyday services",
    phone: input.phone.trim(),
    emergencyPhone: input.emergencyPhone?.trim() || (existingIndex >= 0 ? records[existingIndex].emergencyPhone : undefined) || input.phone.trim(),
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
    active: isActive,
    verificationStatus,
    assignedAgentId,
    assignedAgentName,
    assignedAgentPhone,
    agentReferralCode: matchedAgentReferralCode,
    agentVerification: agentVerificationDetails || (assignedAgentId ? {
      agentId: assignedAgentId,
      agentName: assignedAgentName,
      agentPhone: assignedAgentPhone,
      agentReferralCode: matchedAgentReferralCode,
      visitedAt: "",
      uploadedImages: [],
    } : undefined),
    adminApproval: adminApprovalDetails,
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
  const agents = await readAgentRecords();
  const cleanId = (agentIdentity || "").replace(/\D/g, "");
  const normId = (agentIdentity || "").trim().toLowerCase();

  const currentAgent = agents.find((a) => {
    if (a.id === agentIdentity) return true;
    if (a.email && a.email.toLowerCase() === normId) return true;
    if (a.name && a.name.toLowerCase() === normId) return true;
    if (a.referralCode && a.referralCode.toLowerCase() === normId) return true;
    const aDigits = a.phone.replace(/\D/g, "");
    if (cleanId.length >= 8 && (aDigits === cleanId || aDigits.endsWith(cleanId) || cleanId.endsWith(aDigits))) return true;
    return false;
  });

  return records
    .filter((b) => {
      // Must not be Pending Agent Assignment (unassigned) for agent visit queue
      if (b.verificationStatus === "Pending Agent Assignment") return false;

      // If an agent is logged in, show businesses assigned to this agent
      if (currentAgent) {
        const isAssigned =
          b.assignedAgentId === currentAgent.id ||
          (b.assignedAgentPhone && b.assignedAgentPhone.replace(/\D/g, "") === currentAgent.phone.replace(/\D/g, "")) ||
          (b.agentReferralCode && b.agentReferralCode.toUpperCase() === currentAgent.referralCode.toUpperCase());
        if (!isAssigned) return false;
      }

      return (
        b.verificationStatus === "Pending Agent Visit" ||
        b.verificationStatus === "Pending Admin Approval" ||
        b.verificationStatus === "Approved" ||
        b.verificationStatus === "Rejected"
      );
    })
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

  // GPS Proximity Check: coordinates recorded at registration should match approximately 20-50 meters of agent verification GPS
  if (!input.verifiedGps || typeof input.verifiedGps.latitude !== "number" || typeof input.verifiedGps.longitude !== "number") {
    throw new Error("Live storefront GPS location is required to complete agent verification.");
  }

  let distanceMeters = 0;
  if (current.coordinates && typeof current.coordinates.latitude === "number" && typeof current.coordinates.longitude === "number") {
    distanceMeters = calculateDistanceMeters(current.coordinates, input.verifiedGps);
    if (distanceMeters > 50) {
      throw new Error(
        `Agent location mismatch: You are ${distanceMeters}m away from the registered storefront. You must be on-site within 20–50 metres of the registered business location to complete verification.`
      );
    }
  }

  current.verificationStatus = "Pending Admin Approval";
  current.assignedAgentId = input.agentId;
  current.assignedAgentName = input.agentName;
  current.assignedAgentPhone = input.agentPhone;
  current.agentReferralCode = input.agentReferralCode || current.agentReferralCode;

  current.agentVerification = {
    agentId: input.agentId,
    agentName: input.agentName,
    agentPhone: input.agentPhone,
    agentReferralCode: input.agentReferralCode || current.agentReferralCode,
    visitedAt: new Date().toISOString(),
    uploadedImages: input.uploadedImages,
    notes: input.notes,
    verifiedGps: input.verifiedGps,
    distanceMeters,
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

export async function assignBusinessAgent(input: {
  businessId: string;
  agentId: string;
  adminName?: string;
  adminEmail?: string;
}): Promise<PublicBusiness> {
  const records = await readBusinessRecords();
  const index = records.findIndex((b) => b.id === input.businessId);
  if (index === -1) {
    throw new Error("Business not found.");
  }

  if (input.agentId === "company" || input.agentId === "self") {
    const current = records[index];
    current.assignedAgentId = "company";
    current.assignedAgentName = input.adminName || "Company Admin (Self)";
    current.assignedAgentPhone = "";
    current.agentReferralCode = "COMPANY";
    if (current.verificationStatus === "Pending Agent Assignment" || !current.verificationStatus) {
      current.verificationStatus = "Approved";
      current.active = true;
    }
    records[index] = current;
    await writeBusinessRecords(records);
    const { salt, passwordHash, ...pub } = current;
    return pub;
  }

  const agents = await readAgentRecords();
  const agent = agents.find((a) => a.id === input.agentId || (a.referralCode && a.referralCode.toUpperCase() === input.agentId.toUpperCase()));
  if (!agent) {
    throw new Error("Agent partner not found.");
  }

  const current = records[index];
  current.assignedAgentId = agent.id;
  current.assignedAgentName = agent.name;
  current.assignedAgentPhone = agent.phone;
  current.agentReferralCode = agent.referralCode;

  // Move status from Pending Agent Assignment to Pending Agent Visit
  if (current.verificationStatus === "Pending Agent Assignment" || !current.verificationStatus) {
    current.verificationStatus = "Pending Agent Visit";
  }

  if (!current.agentVerification) {
    current.agentVerification = {
      agentId: agent.id,
      agentName: agent.name,
      agentPhone: agent.phone,
      agentReferralCode: agent.referralCode,
      visitedAt: "",
      uploadedImages: [],
    };
  } else {
    current.agentVerification.agentId = agent.id;
    current.agentVerification.agentName = agent.name;
    current.agentVerification.agentPhone = agent.phone;
    current.agentVerification.agentReferralCode = agent.referralCode;
  }

  records[index] = current;
  await writeBusinessRecords(records);

  const { salt: _s, passwordHash: _p, ...pub } = current;
  return pub;
}

export async function listBusinessesForAdminApproval(): Promise<PublicBusiness[]> {
  const records = await readBusinessRecords();
  return records
    .filter(
      (b) =>
        b.verificationStatus === "Pending Agent Assignment" ||
        b.verificationStatus === "Pending Admin Approval" ||
        b.verificationStatus === "Pending Agent Visit" ||
        b.verificationStatus === "Approved" ||
        b.verificationStatus === "Rejected"
    )
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
  emergencyPhone?: string;
  email: string;
  ownerName: string;
  description: string;
  address: Partial<BusinessAddress>;
  images: string[];
  photos?: string[];
  website?: string;
  gstin?: string;
  hours?: string;
  operatingHours?: WeeklyOperatingSchedule;
  products: BusinessProduct[];
  coordinates: { latitude: number; longitude: number } | null;
  rating?: number;
  reviews?: number;
  customerReviews?: BusinessReview[];
  active?: boolean;
  disabledReason?: string;
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
  if (updates.emergencyPhone !== undefined) current.emergencyPhone = updates.emergencyPhone.trim();
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
  if (updates.operatingHours !== undefined) current.operatingHours = updates.operatingHours;
  if (updates.products !== undefined) current.products = updates.products;
  if (updates.rating !== undefined) current.rating = updates.rating;
  if (updates.reviews !== undefined) current.reviews = updates.reviews;
  if (updates.customerReviews !== undefined) current.customerReviews = updates.customerReviews;
  if (updates.active !== undefined) current.active = Boolean(updates.active);
  if (updates.disabledReason !== undefined) current.disabledReason = updates.disabledReason.trim();
  if (updates.address) {
    const rawAddr = updates.address as Record<string, unknown>;
    current.address = {
      doorNumber: String(rawAddr.doorNumber ?? rawAddr.doorNo ?? current.address?.doorNumber ?? "").trim(),
      street: String(rawAddr.street ?? current.address?.street ?? "").trim(),
      area: String(rawAddr.area ?? rawAddr.locality ?? current.address?.area ?? "").trim(),
      cityTown: String(rawAddr.cityTown ?? rawAddr.city ?? current.address?.cityTown ?? "Hosur").trim(),
      taluka: String(rawAddr.taluka ?? current.address?.taluka ?? "Hosur").trim(),
      district: String(rawAddr.district ?? current.address?.district ?? "Krishnagiri").trim(),
      state: String(rawAddr.state ?? current.address?.state ?? "Tamil Nadu").trim(),
      pincode: String(rawAddr.pincode ?? current.address?.pincode ?? "635109").trim(),
    };
  }

  records[index] = current;
  await writeBusinessRecords(records);

  const { salt: _s, passwordHash: _p, ...pub } = current;
  return pub;
}

export async function deleteBusinessRecord(idOrName: string): Promise<boolean> {
  const records = await readBusinessRecords();
  const normalized = idOrName.trim().toLowerCase();
  const initialCount = records.length;
  const filtered = records.filter(
    (b) => b.id.toLowerCase() !== normalized && b.name.toLowerCase() !== normalized
  );
  if (filtered.length !== initialCount) {
    await writeBusinessRecords(filtered);
    return true;
  }
  return false;
}

export async function resetBusinessPassword(identity: string, newPassword: string): Promise<boolean> {
  const cleanDigits = identity.replace(/\D/g, "");
  const normalized = identity.trim().toLowerCase();
  const records = await readBusinessRecords();
  const index = records.findIndex((b) => {
    if (b.id === identity) return true;
    if (b.email && b.email.toLowerCase() === normalized) return true;
    const bDigits = b.phone.replace(/\D/g, "");
    if (cleanDigits.length >= 8 && (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits))) return true;
    return b.phone.trim().toLowerCase() === normalized;
  });
  if (index === -1) return false;
  const salt = randomBytes(16).toString("hex");
  records[index].salt = salt;
  records[index].passwordHash = hashPassword(newPassword, salt);
  await writeBusinessRecords(records);
  return true;
}
