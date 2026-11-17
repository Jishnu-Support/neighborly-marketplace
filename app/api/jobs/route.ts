import { NextResponse } from "next/server";
import {
  listJobs,
  createJob,
  updateJobStatus,
  deleteJob,
} from "@/app/lib/jobs";
import { saveActivityLog } from "@/app/lib/activity-logs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const jobType = searchParams.get("jobType") || undefined;
    const businessName = searchParams.get("businessName") || undefined;
    const locality = searchParams.get("locality") || undefined;
    const statusParam = searchParams.get("status") || "active";
    const status = statusParam === "all" ? "all" : statusParam === "closed" ? "closed" : "active";

    const jobs = await listJobs({
      query,
      category,
      jobType,
      status,
      businessName,
      locality,
    });

    return NextResponse.json({ jobs }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load job listings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "Other";
    const jobType = (typeof body.jobType === "string" && ["Full-Time", "Part-Time", "Contract", "Internship", "Shift-Based"].includes(body.jobType.trim()))
      ? (body.jobType.trim() as any)
      : "Full-Time";

    const salaryMin = typeof body.salaryMin === "number" ? body.salaryMin : body.salaryMin ? Number(body.salaryMin) : undefined;
    const salaryMax = typeof body.salaryMax === "number" ? body.salaryMax : body.salaryMax ? Number(body.salaryMax) : undefined;
    const salaryPeriod = (typeof body.salaryPeriod === "string" && ["Month", "Day", "Hour", "Year"].includes(body.salaryPeriod))
      ? (body.salaryPeriod as any)
      : "Month";
    const salaryNegotiable = Boolean(body.salaryNegotiable);

    const experienceLevel = typeof body.experienceLevel === "string" ? body.experienceLevel.trim() : "Fresher";
    const educationLevel = typeof body.educationLevel === "string" ? body.educationLevel.trim() : "Any";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "Hosur";
    const locality = typeof body.locality === "string" ? body.locality.trim() : undefined;
    const businessPhone = typeof body.businessPhone === "string" ? body.businessPhone.trim() : "";
    const businessWhatsapp = typeof body.businessWhatsapp === "string" ? body.businessWhatsapp.trim() : businessPhone;
    const contactPerson = typeof body.contactPerson === "string" ? body.contactPerson.trim() : "";
    const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : businessPhone;
    const contactWhatsapp = typeof body.contactWhatsapp === "string" ? body.contactWhatsapp.trim() : (contactPhone || businessWhatsapp);

    const openingsCount = typeof body.openingsCount === "number" ? body.openingsCount : body.openingsCount ? Number(body.openingsCount) : 1;
    const requirements = Array.isArray(body.requirements) ? (body.requirements as string[]) : [];
    const perks = Array.isArray(body.perks) ? (body.perks as string[]) : [];

    // Optional GPS coordinates
    let coordinates: { latitude: number; longitude: number } | undefined;
    if (body.coordinates && typeof body.coordinates === "object") {
      const coords = body.coordinates as Record<string, unknown>;
      const lat = Number(coords.latitude);
      const lng = Number(coords.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates = { latitude: lat, longitude: lng };
      }
    }

    if (!title) {
      return NextResponse.json({ error: "Job title is required." }, { status: 400 });
    }
    if (!businessName) {
      return NextResponse.json({ error: "Business / Employer name is required." }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }
    if (!contactPhone && !businessPhone) {
      return NextResponse.json({ error: "Contact phone number is required for applicants." }, { status: 400 });
    }

    const created = await createJob({
      businessName,
      businessPhone,
      businessWhatsapp,
      businessAddress: typeof body.businessAddress === "string" ? body.businessAddress.trim() : undefined,
      businessLocality: locality,
      businessCity: typeof body.businessCity === "string" ? body.businessCity.trim() : "Hosur",
      title,
      category,
      jobType,
      salaryMin: salaryMin && !isNaN(salaryMin) ? salaryMin : undefined,
      salaryMax: salaryMax && !isNaN(salaryMax) ? salaryMax : undefined,
      salaryPeriod,
      salaryNegotiable,
      experienceLevel,
      educationLevel,
      description,
      requirements,
      perks,
      location,
      locality,
      coordinates,
      contactPerson,
      contactPhone: contactPhone || businessPhone,
      contactWhatsapp,
      openingsCount,
    });

    try {
      await saveActivityLog({
        action: `Job Opening Posted: ${created.title} (${created.businessName})`,
        category: "General",
        actorName: created.businessName,
        actorRole: "Business",
        details: `Employer '${created.businessName}' posted opening for '${created.title}' in ${created.location}. Contact: ${created.contactPhone}.`,
      });
    } catch {
      // Non-blocking log
    }

    return NextResponse.json({ job: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create job posting." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" && ["active", "closed"].includes(body.status.trim())
      ? (body.status.trim() as "active" | "closed")
      : null;
    const businessName = typeof body.businessName === "string" ? body.businessName.trim() : undefined;

    if (!id || !status) {
      return NextResponse.json({ error: "Job ID and valid status ('active' or 'closed') are required." }, { status: 400 });
    }

    const updated = await updateJobStatus(id, status, businessName);
    if (!updated) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ job: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update job status." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const businessName = searchParams.get("businessName") || undefined;

    if (!id) {
      return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
    }

    const success = await deleteJob(id, businessName);
    if (!success) {
      return NextResponse.json({ error: "Job not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete job." },
      { status: 500 }
    );
  }
}
