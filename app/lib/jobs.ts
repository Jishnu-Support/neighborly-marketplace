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

export const DEFAULT_INITIAL_JOBS: JobListing[] = [
  {
    id: "job-hosur-1",
    businessName: "Sri Krishna Precision Engineering",
    businessPhone: "+91 94432 10987",
    businessWhatsapp: "+91 94432 10987",
    businessAddress: "Plot 42, SIPCOT Phase 1, Near TVS Factory, Hosur",
    businessLocality: "SIPCOT Phase 1",
    businessCity: "Hosur",
    title: "CNC & VMC Machine Operator",
    category: "Manufacturing & Industrial",
    jobType: "Full-Time",
    salaryMin: 18000,
    salaryMax: 26000,
    salaryPeriod: "Month",
    salaryNegotiable: false,
    experienceLevel: "1-2 Years",
    educationLevel: "ITI / Diploma (Mechanical)",
    description: "Looking for skilled CNC & VMC operators for high-precision automotive component machining. Must have hands-on experience in setting, offset adjustment, and Fanuc/Siemens controls.",
    requirements: [
      "Operating CNC Lathe / VMC milling machines",
      "Knowledge of vernier caliper, micrometer & bore gauge",
      "Willingness to work in rotational shifts (Morning/Evening)"
    ],
    perks: ["PF & ESI Provided", "Overtime Allowance (1.5x)", "Canteen Meal Facility", "Safety Gear Provided"],
    location: "SIPCOT Phase 1, Hosur",
    locality: "SIPCOT Phase 1",
    coordinates: { latitude: 12.7485, longitude: 77.8210 },
    contactPerson: "Mr. Sundaram (Works Manager)",
    contactPhone: "+91 94432 10987",
    contactWhatsapp: "+91 94432 10987",
    status: "active",
    openingsCount: 3,
    createdAt: "2026-03-01T09:00:00.000Z",
  },
  {
    id: "job-hosur-2",
    businessName: "Nilgiris Supermarket & Bakers",
    businessPhone: "+91 98421 55678",
    businessWhatsapp: "+91 98421 55678",
    businessAddress: "14/2, Bagalur Road, Opp. Sub-Collector Office, Hosur",
    businessLocality: "Bagalur Road",
    businessCity: "Hosur",
    title: "Retail Billing Cashier & Store Associate",
    category: "Retail & Supermarket",
    jobType: "Full-Time",
    salaryMin: 13000,
    salaryMax: 17000,
    salaryPeriod: "Month",
    salaryNegotiable: true,
    experienceLevel: "Fresher (0-1 Year)",
    educationLevel: "12th Pass / Any Degree",
    description: "Immediate opening for energetic billing counter staff and shelf merchandise organizer. Friendly environment with straightforward barcode billing operations.",
    requirements: [
      "Basic computer and keyboard typing skills",
      "Good communication in Tamil and basic English / Kannada",
      "Customer-friendly approach and honesty"
    ],
    perks: ["Day Shift Only (No Night Shifts)", "Staff Purchase Discount (10%)", "Weekly Off", "ESI Health Coverage"],
    location: "Bagalur Road, Hosur",
    locality: "Bagalur Road",
    coordinates: { latitude: 12.7350, longitude: 77.8320 },
    contactPerson: "Store Manager",
    contactPhone: "+91 98421 55678",
    contactWhatsapp: "+91 98421 55678",
    status: "active",
    openingsCount: 2,
    createdAt: "2026-03-02T10:30:00.000Z",
  },
  {
    id: "job-hosur-3",
    businessName: "Hosur Quick Express Logistics",
    businessPhone: "+91 97890 23456",
    businessWhatsapp: "+91 97890 23456",
    businessAddress: "77, Mathigiri Road, Near Old Bus Stand, Hosur",
    businessLocality: "Mathigiri",
    businessCity: "Hosur",
    title: "Two-Wheeler Delivery Partner",
    category: "Logistics & Delivery",
    jobType: "Shift-Based",
    salaryMin: 16000,
    salaryMax: 24000,
    salaryPeriod: "Month",
    salaryNegotiable: false,
    experienceLevel: "Any",
    educationLevel: "10th Pass",
    description: "Deliver packages and local merchant orders across Hosur residential and commercial neighborhoods. Flexible shifts, timely weekly payouts, and fuel allowance.",
    requirements: [
      "Must own a 2-wheeler with valid driving license",
      "Android smartphone for delivery tracking app",
      "Good familiarity with Hosur roads and landmarks"
    ],
    perks: ["Fuel Allowance Reimbursed", "Flexible Shift Timings (Part-time or Full-time)", "Performance Delivery Bonus", "Accidental Insurance Coverage"],
    location: "Mathigiri, Hosur",
    locality: "Mathigiri",
    coordinates: { latitude: 12.7230, longitude: 77.8420 },
    contactPerson: "Logistics Coordinator",
    contactPhone: "+91 97890 23456",
    contactWhatsapp: "+91 97890 23456",
    status: "active",
    openingsCount: 5,
    createdAt: "2026-03-03T11:15:00.000Z",
  },
  {
    id: "job-hosur-4",
    businessName: "Cauvery Electricals & Automation",
    businessPhone: "+91 94860 88765",
    businessWhatsapp: "+91 94860 88765",
    businessAddress: "28, Railway Station Road, Near Anna Statue, Hosur",
    businessLocality: "Railway Station Road",
    businessCity: "Hosur",
    title: "Junior Accountant (Tally Prime & GST)",
    category: "Office & Administration",
    jobType: "Full-Time",
    salaryMin: 16000,
    salaryMax: 22000,
    salaryPeriod: "Month",
    salaryNegotiable: true,
    experienceLevel: "1-2 Years",
    educationLevel: "B.Com / M.Com",
    description: "Seeking an organized Junior Accountant for day-to-day invoice generation, vendor payment reconciliations, GST data entry, and bank transactions.",
    requirements: [
      "Working knowledge of Tally Prime / ERP 9",
      "Experience with purchase/sales invoices and GST E-way bills",
      "Proficiency in MS Excel"
    ],
    perks: ["Comfortable Air-conditioned Office", "Sunday Off & Public Holidays", "Annual Deepavali Bonus", "On-the-job training on latest tax filings"],
    location: "Railway Station Road, Hosur",
    locality: "Railway Station Road",
    coordinates: { latitude: 12.7380, longitude: 77.8280 },
    contactPerson: "Mr. Rajasekaran",
    contactPhone: "+91 94860 88765",
    contactWhatsapp: "+91 94860 88765",
    status: "active",
    openingsCount: 1,
    createdAt: "2026-03-04T12:00:00.000Z",
  },
  {
    id: "job-hosur-5",
    businessName: "Apex Auto Components Pvt Ltd",
    businessPhone: "+91 96290 44321",
    businessWhatsapp: "+91 96290 44321",
    businessAddress: "Plot 88, SIPCOT Phase 2, Moranapalli, Hosur",
    businessLocality: "SIPCOT Phase 2",
    businessCity: "Hosur",
    title: "Quality Inspector (In-Process & Final Inspection)",
    category: "Manufacturing & Industrial",
    jobType: "Full-Time",
    salaryMin: 20000,
    salaryMax: 28000,
    salaryPeriod: "Month",
    salaryNegotiable: false,
    experienceLevel: "2-3 Years",
    educationLevel: "Diploma / BE (Mechanical / Automobile)",
    description: "Responsible for in-process inspection and line quality checks of stamped and machined automotive parts. Prepare quality check sheets and coordinate with production team.",
    requirements: [
      "Reading mechanical drawings and GD&T symbols",
      "Proficiency with height gauges, profile projectors, and surface roughness testers",
      "Knowledge of 5S and basic QC tools"
    ],
    perks: ["Company Bus / Transport Pickup in Hosur", "PF, ESI & Medical Insurance", "Subsidized Canteen", "Quarterly Attendance Bonus"],
    location: "SIPCOT Phase 2, Hosur",
    locality: "SIPCOT Phase 2",
    coordinates: { latitude: 12.7560, longitude: 77.8100 },
    contactPerson: "HR Department",
    contactPhone: "+91 96290 44321",
    contactWhatsapp: "+91 96290 44321",
    status: "active",
    openingsCount: 2,
    createdAt: "2026-03-05T14:30:00.000Z",
  }
];

export async function readJobs(): Promise<JobListing[]> {
  try {
    const raw = await readFile(storePath, { encoding: "utf8" });
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array or file just created, seed default Hosur jobs
    await writeJobs(DEFAULT_INITIAL_JOBS);
    return DEFAULT_INITIAL_JOBS;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await writeJobs(DEFAULT_INITIAL_JOBS);
      return DEFAULT_INITIAL_JOBS;
    }
    return DEFAULT_INITIAL_JOBS;
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
