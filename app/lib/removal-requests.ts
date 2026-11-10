import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolveStorePath } from "./storage-paths";
import { deleteBusinessRecord, updateBusinessProfile, readBusinessRecords } from "./businesses";
import { saveActivityLog } from "./activity-logs";

export type RemovalRequestType = "Disable" | "Delete";
export type RemovalRequestStatus = "Pending" | "Approved" | "Rejected";

export type BusinessRemovalRequest = {
  id: string;
  businessId: string;
  businessName: string;
  businessPhone: string;
  businessAddress?: string;
  businessCategory?: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentReferralCode?: string;
  requestType: RemovalRequestType;
  reason: string;
  remarks: string;
  status: RemovalRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
};

const storePath = resolveStorePath("NEIGHBORLY_REMOVAL_REQUESTS_STORE", ".neighborly-removal-requests.json");

export async function readRemovalRequests(): Promise<BusinessRemovalRequest[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as BusinessRemovalRequest[];
    return [];
  } catch {
    return [];
  }
}

export async function writeRemovalRequests(requests: BusinessRemovalRequest[]): Promise<void> {
  await writeFile(storePath, JSON.stringify(requests, null, 2), "utf8");
}

export async function createRemovalRequest(input: {
  businessId: string;
  businessName?: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentReferralCode?: string;
  requestType: RemovalRequestType;
  reason: string;
  remarks: string;
}): Promise<BusinessRemovalRequest> {
  const records = await readBusinessRecords();
  const business = records.find(
    (b) => b.id === input.businessId || b.name.toLowerCase() === (input.businessName || "").toLowerCase()
  );

  const addressStr = business?.address
    ? [business.address.doorNumber, business.address.street, business.address.area, business.address.cityTown].filter(Boolean).join(", ")
    : undefined;

  const newRequest: BusinessRemovalRequest = {
    id: randomUUID(),
    businessId: business?.id || input.businessId,
    businessName: business?.name || input.businessName || "Unnamed Business",
    businessPhone: business?.phone || "",
    businessAddress: addressStr,
    businessCategory: business?.category,
    agentId: input.agentId,
    agentName: input.agentName,
    agentPhone: input.agentPhone,
    agentReferralCode: input.agentReferralCode,
    requestType: input.requestType,
    reason: input.reason.trim(),
    remarks: input.remarks.trim(),
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  const requests = await readRemovalRequests();
  requests.unshift(newRequest);
  await writeRemovalRequests(requests);

  try {
    await saveActivityLog({
      action: `Agent requested ${input.requestType} for ${newRequest.businessName}`,
      category: "Removal Request",
      actorName: input.agentName,
      actorPhone: input.agentPhone,
      actorRole: "Agent",
      locality: business?.address?.area || "Hosur",
      details: `Reason: ${input.reason} | Remarks: "${input.remarks}"`,
      metadata: {
        requestId: newRequest.id,
        businessId: newRequest.businessId,
        requestType: input.requestType,
      },
    });
  } catch (e) {
    console.warn("Could not save activity log for removal request:", e);
  }

  return newRequest;
}

export async function reviewRemovalRequest(input: {
  requestId: string;
  action: "Approved" | "Rejected";
  reviewerName: string;
  reviewerRole: "Admin" | "Super Admin";
  notes?: string;
}): Promise<{ request: BusinessRemovalRequest; businessUpdated: boolean }> {
  const requests = await readRemovalRequests();
  const index = requests.findIndex((r) => r.id === input.requestId);
  if (index === -1) {
    throw new Error("Removal request not found.");
  }

  const req = requests[index];
  if (req.status !== "Pending") {
    throw new Error(`This request has already been ${req.status.toLowerCase()}.`);
  }

  let businessUpdated = false;

  if (input.action === "Approved") {
    if (req.requestType === "Delete") {
      if (input.reviewerRole !== "Super Admin") {
        throw new Error("Only Super Administrators can approve permanent deletion requests.");
      }
      businessUpdated = await deleteBusinessRecord(req.businessId);
    } else {
      // Disable business
      const updated = await updateBusinessProfile(req.businessId, {
        active: false,
        disabledReason: `Agent Request: ${req.reason} (${req.remarks})`,
      });
      businessUpdated = Boolean(updated);
    }
  }

  req.status = input.action;
  req.reviewedBy = input.reviewerName;
  req.reviewedAt = new Date().toISOString();
  req.reviewNotes = input.notes?.trim() || undefined;

  requests[index] = req;
  await writeRemovalRequests(requests);

  try {
    await saveActivityLog({
      action: `${input.reviewerRole} ${input.action.toLowerCase()} ${req.requestType} request for ${req.businessName}`,
      category: "Removal Request",
      actorName: input.reviewerName,
      actorRole: input.reviewerRole,
      details: input.notes ? `Notes: "${input.notes}"` : `Status: ${input.action}`,
      metadata: {
        requestId: req.id,
        businessId: req.businessId,
        requestType: req.requestType,
        action: input.action,
      },
    });
  } catch (e) {
    console.warn("Could not save activity log for removal review:", e);
  }

  return { request: req, businessUpdated };
}
