import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorePath } from "@/app/lib/storage-paths";

export type JobListing = {
  id: string;
  businessName: string;
  businessPhone?: string;
  businessWhatsapp?: string;
  businessAddress?: string;
  businessLocality?: string;
  businessCity?: string;
  title: string;
  category: string;
  jobType: "Full-Time" | "Part-Time" | "Contract" | "Internship" | "Shift-Based";
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: "Month" | "Day" | "Hour" | "Year";
  salaryNegotiable?: boolean;
  experienceLevel?: string;
  educationLevel?: string;
  description: string;
  requirements?: string[];
  perks?: string[];
  location: string;
  locality?: string;
  coordinates?: { latitude: number; longitude: number };
  contactPerson?: string;
  contactPhone: string;
  contactWhatsapp?: string;
  status: "active" | "closed";
  openingsCount?: number;
  createdAt: string;
  updatedAt?: string;
};

const storePath = resolveStorePath("NEIGHBORLY_JOBS_STORE", ".neighborly-jobs.json");

export async function readJobs(): Promise<JobListing[]> {
  try {
    const raw = await readFile(storePath, { encoding: "utf8" });
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any demo jobs that have IDs starting with 'job-hosur-' or contain demo titles/businesses
      const realJobs = parsed.filter((job) => {
        if (!job || typeof job !== "object") return false;
        if (typeof job.id === "string" && job.id.startsWith("job-hosur-")) {
          return false;
        }
        if (
          job.businessName === "Sri Krishna Precision Engineering" ||
          job.businessName === "Nilgiris Supermarket & Bakers" ||
          job.businessName === "Hosur Quick Express Logistics" ||
          job.businessName === "Cauvery Electricals & Automation" ||
          job.businessName === "Apex Auto Components Pvt Ltd"
        ) {
          return false;
        }
        return true;
      });

      // If any demo jobs were purged from disk, persist the clean array immediately
      if (realJobs.length !== parsed.length) {
        await writeJobs(realJobs);
      }
      return realJobs;
    }
    return [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await writeJobs([]);
      return [];
    }
    return [];
  }
}

export async function writeJobs(jobs: JobListing[]): Promise<void> {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(jobs, null, 2), { encoding: "utf8" });
}

export async function listJobs(options?: {
  query?: string;
  category?: string;
  jobType?: string;
  status?: "active" | "closed" | "all";
  businessName?: string;
  locality?: string;
}): Promise<JobListing[]> {
  const all = await readJobs();
  const q = options?.query?.trim().toLowerCase();
  const cat = options?.category?.trim().toLowerCase();
  const typeFilter = options?.jobType?.trim().toLowerCase();
  const statusFilter = options?.status || "active";
  const bizFilter = options?.businessName?.trim().toLowerCase();
  const locFilter = options?.locality?.trim().toLowerCase();

  return all.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }
    if (cat && cat !== "all" && job.category.toLowerCase() !== cat) {
      return false;
    }
    if (typeFilter && typeFilter !== "all" && job.jobType.toLowerCase() !== typeFilter) {
      return false;
    }
    if (bizFilter && !job.businessName.toLowerCase().includes(bizFilter)) {
      return false;
    }
    if (locFilter && locFilter !== "all" && locFilter !== "all localities" && locFilter !== "all hosur") {
      const matchLoc = job.location.toLowerCase().includes(locFilter) || (job.locality && job.locality.toLowerCase().includes(locFilter));
      if (!matchLoc) return false;
    }
    if (q) {
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchDesc = job.description.toLowerCase().includes(q);
      const matchBiz = job.businessName.toLowerCase().includes(q);
      const matchLoc = job.location.toLowerCase().includes(q);
      const matchCat = job.category.toLowerCase().includes(q);
      const matchReq = (job.requirements || []).some((r) => r.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchBiz && !matchLoc && !matchCat && !matchReq) {
        return false;
      }
    }
    return true;
  });
}

export async function createJob(input: {
  businessName: string;
  businessPhone?: string;
  businessWhatsapp?: string;
  businessAddress?: string;
  businessLocality?: string;
  businessCity?: string;
  title: string;
  category: string;
  jobType: "Full-Time" | "Part-Time" | "Contract" | "Internship" | "Shift-Based";
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: "Month" | "Day" | "Hour" | "Year";
  salaryNegotiable?: boolean;
  experienceLevel?: string;
  educationLevel?: string;
  description: string;
  requirements?: string[];
  perks?: string[];
  location: string;
  locality?: string;
  coordinates?: { latitude: number; longitude: number };
  contactPerson?: string;
  contactPhone: string;
  contactWhatsapp?: string;
  openingsCount?: number;
}): Promise<JobListing> {
  const jobs = await readJobs();
  const newJob: JobListing = {
    id: `job-${randomUUID().slice(0, 8)}`,
    businessName: input.businessName.trim(),
    businessPhone: input.businessPhone?.trim(),
    businessWhatsapp: input.businessWhatsapp?.trim(),
    businessAddress: input.businessAddress?.trim(),
    businessLocality: input.businessLocality?.trim(),
    businessCity: input.businessCity?.trim() || "Hosur",
    title: input.title.trim(),
    category: input.category.trim() || "Other",
    jobType: input.jobType || "Full-Time",
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    salaryPeriod: input.salaryPeriod || "Month",
    salaryNegotiable: Boolean(input.salaryNegotiable),
    experienceLevel: input.experienceLevel?.trim() || "Fresher",
    educationLevel: input.educationLevel?.trim() || "Any",
    description: input.description.trim(),
    requirements: input.requirements || [],
    perks: input.perks || [],
    location: input.location.trim() || "Hosur",
    locality: input.locality?.trim(),
    coordinates: input.coordinates,
    contactPerson: input.contactPerson?.trim(),
    contactPhone: input.contactPhone.trim(),
    contactWhatsapp: input.contactWhatsapp?.trim() || input.contactPhone.trim(),
    status: "active",
    openingsCount: input.openingsCount && input.openingsCount > 0 ? input.openingsCount : 1,
    createdAt: new Date().toISOString(),
  };

  jobs.unshift(newJob);
  await writeJobs(jobs);
  return newJob;
}

export async function updateJobStatus(id: string, status: "active" | "closed", businessName?: string): Promise<JobListing | null> {
  const jobs = await readJobs();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  if (businessName && jobs[index].businessName.toLowerCase() !== businessName.toLowerCase()) {
    throw new Error("Unauthorized to update this job listing.");
  }

  jobs[index].status = status;
  jobs[index].updatedAt = new Date().toISOString();
  await writeJobs(jobs);
  return jobs[index];
}

export async function deleteJob(id: string, businessName?: string): Promise<boolean> {
  const jobs = await readJobs();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return false;

  if (businessName && jobs[index].businessName.toLowerCase() !== businessName.toLowerCase()) {
    throw new Error("Unauthorized to delete this job listing.");
  }

  jobs.splice(index, 1);
  await writeJobs(jobs);
  return true;
}

export async function getJobById(id: string): Promise<JobListing | null> {
  const jobs = await readJobs();
  return jobs.find((j) => j.id === id) || null;
}
