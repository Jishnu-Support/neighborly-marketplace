"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { JobListing } from "@/app/lib/jobs";

export const JOB_CATEGORIES = [
  "All",
  "Manufacturing & Industrial",
  "Retail & Supermarket",
  "Logistics & Delivery",
  "Hospitality & Restaurant",
  "Office & Administration",
  "IT & Tech",
  "Healthcare",
  "Education",
  "Automotive & Garage",
  "Construction & Real Estate",
  "Other",
];

export const JOB_TYPES = [
  "All",
  "Full-Time",
  "Part-Time",
  "Shift-Based",
  "Contract",
  "Internship",
];

export const COMMON_PERKS = [
  "PF & ESI Provided",
  "Free Food / Accommodation",
  "Overtime Allowance",
  "Performance Bonus",
  "Staff Discount",
  "Company Transport",
  "Day Shift Only",
  "Health Insurance",
];

function formatSalary(job: JobListing) {
  if (job.salaryMin && job.salaryMax) {
    return `₹${job.salaryMin.toLocaleString("en-IN")} – ₹${job.salaryMax.toLocaleString("en-IN")} / ${job.salaryPeriod || "Month"}`;
  }
  if (job.salaryMin) {
    return `From ₹${job.salaryMin.toLocaleString("en-IN")} / ${job.salaryPeriod || "Month"}`;
  }
  if (job.salaryMax) {
    return `Up to ₹${job.salaryMax.toLocaleString("en-IN")} / ${job.salaryPeriod || "Month"}`;
  }
  if (job.salaryNegotiable) {
    return "Salary Negotiable";
  }
  return "Competitive Salary";
}

/**
 * Single Card for displaying a job in public lists and modals.
 */
export function JobCard({
  job,
  onSelect,
}: {
  job: JobListing;
  onSelect?: (job: JobListing) => void;
}) {
  const cleanPhone = (job.contactPhone || job.businessPhone || "").replace(/\D/g, "");
  const whatsappNumber = (job.contactWhatsapp || job.businessWhatsapp || job.contactPhone || "").replace(/\D/g, "");

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cleanPhone) {
      window.location.href = `tel:+91${cleanPhone.slice(-10)}`;
    }
  };

  const handleWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (whatsappNumber) {
      const msg = encodeURIComponent(
        `Hi, I saw your job opening for "${job.title}" at ${job.businessName} on Bizearch.in. Is this position still open? I would like to apply.`
      );
      window.open(`https://wa.me/91${whatsappNumber.slice(-10)}?text=${msg}`, "_blank");
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(job)}
      style={{
        background: "#ffffff",
        border: "1.5px solid #e2e8f0",
        borderRadius: "14px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onSelect ? "pointer" : "default",
        transition: "all 0.18s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        if (onSelect) {
          e.currentTarget.style.borderColor = "#10b981";
          e.currentTarget.style.boxShadow = "0 6px 16px -4px rgba(16,185,129,0.18)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onSelect) {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
          e.currentTarget.style.transform = "none";
        }
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: "6px",
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #a7f3d0",
            }}
          >
            💼 {job.jobType}
          </span>
          {job.openingsCount && job.openingsCount > 1 ? (
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "10px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
              }}
            >
              🔥 {job.openingsCount} Openings
            </span>
          ) : (
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {new Date(job.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        {/* Title & Employer */}
        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.3 }}>
          {job.title}
        </h3>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#166534", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
          <span>🏢</span>
          <span>{job.businessName}</span>
        </div>

        {/* Locality & Salary */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "12px", color: "#475569", marginBottom: "12px" }}>
          <span>📍 {job.locality || job.location}</span>
          <span>•</span>
          <span style={{ fontWeight: 700, color: "#059669" }}>💰 {formatSalary(job)}</span>
          {job.experienceLevel && (
            <>
              <span>•</span>
              <span>🎓 {job.experienceLevel}</span>
            </>
          )}
        </div>

        {/* Perks / Tags preview */}
        {job.perks && job.perks.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
            {job.perks.slice(0, 3).map((perk) => (
              <span
                key={perk}
                style={{
                  fontSize: "10.5px",
                  background: "#f1f5f9",
                  color: "#334155",
                  padding: "2px 7px",
                  borderRadius: "5px",
                  fontWeight: 600,
                }}
              >
                ✓ {perk}
              </span>
            ))}
            {job.perks.length > 3 && (
              <span style={{ fontSize: "10px", color: "#64748b", alignSelf: "center" }}>
                +{job.perks.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Description snippet */}
        <p
          style={{
            fontSize: "12.5px",
            color: "#4b5563",
            margin: "0 0 14px",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {job.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
        <button
          type="button"
          onClick={handleCall}
          style={{
            padding: "8px 10px",
            background: "#f8fafc",
            border: "1.5px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#0f172a",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          📞 Call
        </button>
        <button
          type="button"
          onClick={handleWhatsapp}
          style={{
            padding: "8px 10px",
            background: "#22c55e",
            border: "none",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          💬 WhatsApp
        </button>
      </div>
    </div>
  );
}

/**
 * Detailed Modal for viewing a complete job opening with full duties & direct apply options.
 */
export function JobDetailModal({
  job,
  onClose,
}: {
  job: JobListing;
  onClose: () => void;
}) {
  const cleanPhone = (job.contactPhone || job.businessPhone || "").replace(/\D/g, "");
  const whatsappNumber = (job.contactWhatsapp || job.businessWhatsapp || job.contactPhone || "").replace(/\D/g, "");

  const handleCall = () => {
    if (cleanPhone) {
      window.location.href = `tel:+91${cleanPhone.slice(-10)}`;
    }
  };

  const handleWhatsapp = () => {
    if (whatsappNumber) {
      const msg = encodeURIComponent(
        `Hi, I saw your job opening for "${job.title}" at ${job.businessName} on Bizearch.in. I am interested and would like to apply. My contact number is: `
      );
      window.open(`https://wa.me/91${whatsappNumber.slice(-10)}?text=${msg}`, "_blank");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "24px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
          }}
        >
          ✕
        </button>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", background: "#ecfdf5", color: "#065f46" }}>
            💼 {job.jobType}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "6px", background: "#f8fafc", color: "#475569" }}>
            📁 {job.category}
          </span>
          {job.openingsCount && job.openingsCount > 1 && (
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", background: "#fef3c7", color: "#92400e" }}>
              🔥 {job.openingsCount} Openings
            </span>
          )}
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
          {job.title}
        </h2>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#166534", marginBottom: "16px" }}>
          🏢 {job.businessName}
        </div>

        {/* Highlight Stats Box */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "20px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Salary / Pay</div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
              {formatSalary(job)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Location</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
              📍 {job.locality || job.location}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Experience</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
              🎓 {job.experienceLevel || "Any Experience"}
            </div>
          </div>
          {job.educationLevel && (
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Education</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>
                📜 {job.educationLevel}
              </div>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#334155", textTransform: "uppercase", margin: "0 0 8px" }}>
            Job Description & Responsibilities
          </h4>
          <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-line", margin: 0 }}>
            {job.description}
          </p>
        </div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#334155", textTransform: "uppercase", margin: "0 0 8px" }}>
              Key Candidate Requirements
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
              {job.requirements.map((req, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Perks & Benefits */}
        {job.perks && job.perks.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#334155", textTransform: "uppercase", margin: "0 0 8px" }}>
              Perks & Benefits Provided
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.perks.map((perk) => (
                <span
                  key={perk}
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #bbf7d0",
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  ✓ {perk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Employer Contact Card */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: "4px" }}>
            EMPLOYER HIRING CONTACT
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#065f46" }}>
            {job.contactPerson ? `${job.contactPerson} · ` : ""}{job.businessName}
          </div>
          {job.businessAddress && (
            <div style={{ fontSize: "12px", color: "#475569", marginTop: "3px" }}>
              📍 {job.businessAddress}
            </div>
          )}
          <div style={{ fontSize: "12.5px", color: "#15803d", fontWeight: 600, marginTop: "4px" }}>
            📞 {job.contactPhone || job.businessPhone}
          </div>
        </div>

        {/* Apply CTA Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            type="button"
            onClick={handleCall}
            style={{
              padding: "11px 16px",
              background: "#ffffff",
              border: "1.5px solid #cbd5e1",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#0f172a",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            📞 Call Employer
          </button>
          <button
            type="button"
            onClick={handleWhatsapp}
            style={{
              padding: "11px 16px",
              background: "#22c55e",
              border: "none",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
            }}
          >
            💬 Apply via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Job Posting Form for Business Owners.
 */
export function JobPostForm({
  businessName,
  businessPhone = "",
  businessWhatsapp = "",
  businessAddress = "",
  businessLocality = "Hosur",
  onSuccess,
  onCancel,
  showNotice,
}: {
  businessName: string;
  businessPhone?: string;
  businessWhatsapp?: string;
  businessAddress?: string;
  businessLocality?: string;
  onSuccess?: (job: JobListing) => void;
  onCancel?: () => void;
  showNotice?: (msg: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Manufacturing & Industrial");
  const [jobType, setJobType] = useState<"Full-Time" | "Part-Time" | "Contract" | "Internship" | "Shift-Based">("Full-Time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState<"Month" | "Day" | "Hour" | "Year">("Month");
  const [salaryNegotiable, setSalaryNegotiable] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState("1-2 Years");
  const [educationLevel, setEducationLevel] = useState("10th / 12th Pass");
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [selectedPerks, setSelectedPerks] = useState<string[]>(["PF & ESI Provided"]);
  const [location, setLocation] = useState(businessLocality || "Hosur");
  const [locality, setLocality] = useState(businessLocality || "Hosur");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState(businessPhone || "");
  const [contactWhatsapp, setContactWhatsapp] = useState(businessWhatsapp || businessPhone || "");
  const [openingsCount, setOpeningsCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const togglePerk = (perk: string) => {
    setSelectedPerks((prev) =>
      prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Please enter a job title (e.g., CNC Operator, Cashier, Accounts Executive).");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please write a brief job description explaining the duties and timing.");
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMsg("Please provide a contact phone number for candidate calls.");
      return;
    }

    setSubmitting(true);
    try {
      const requirements = requirementsText
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessPhone,
          businessWhatsapp,
          businessAddress,
          businessLocality: locality,
          title: title.trim(),
          category,
          jobType,
          salaryMin: salaryMin ? Number(salaryMin) : undefined,
          salaryMax: salaryMax ? Number(salaryMax) : undefined,
          salaryPeriod,
          salaryNegotiable,
          experienceLevel,
          educationLevel,
          description: description.trim(),
          requirements,
          perks: selectedPerks,
          location: location.trim(),
          locality: locality.trim(),
          contactPerson: contactPerson.trim(),
          contactPhone: contactPhone.trim(),
          contactWhatsapp: contactWhatsapp.trim() || contactPhone.trim(),
          openingsCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create job posting.");
      }

      if (showNotice) {
        showNotice(`✓ Job "${data.job.title}" posted successfully! Candidates can now apply via Call & WhatsApp.`);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("neighborly-jobs-updated"));
      }
      if (onSuccess) {
        onSuccess(data.job);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong while posting the job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#ffffff",
        border: "1.5px solid #d1fae5",
        borderRadius: "16px",
        padding: "20px 22px",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.06)",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
          EMPLOYER JOB POSTING FORM
        </span>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "2px 0 4px" }}>
          Post a New Job Opening
        </h3>
        <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
          Hiring for <strong>{businessName}</strong>. Candidates will directly contact you via Phone & WhatsApp with zero commission fees.
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Grid Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Job Title / Role *
          </label>
          <input
            type="text"
            placeholder="e.g. CNC Operator, Cashier, Sales Exec"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Industry / Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
          >
            {JOB_CATEGORIES.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Job Type
          </label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value as any)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
          >
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Shift-Based">Shift-Based (Rotational / Night)</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Number of Openings
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={openingsCount}
            onChange={(e) => setOpeningsCount(Number(e.target.value) || 1)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Salary Section */}
      <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>
          💰 Salary / Pay Range
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: "10px", alignItems: "center" }}>
          <div>
            <input
              type="number"
              placeholder="Min (e.g. 15000)"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max (e.g. 22000)"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
            />
          </div>
          <div>
            <select
              value={salaryPeriod}
              onChange={(e) => setSalaryPeriod(e.target.value as any)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px", background: "#fff" }}
            >
              <option value="Month">/ Month</option>
              <option value="Day">/ Day</option>
              <option value="Hour">/ Hour</option>
              <option value="Year">/ Year</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: "8px" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={salaryNegotiable}
              onChange={(e) => setSalaryNegotiable(e.target.checked)}
            />
            Salary is negotiable based on candidate experience
          </label>
        </div>
      </div>

      {/* Qualifications & Location */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Experience Required
          </label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px", background: "#fff" }}
          >
            <option value="Fresher (0 years)">Fresher (0 years)</option>
            <option value="1-2 Years">1-2 Years</option>
            <option value="3-5 Years">3-5 Years</option>
            <option value="5+ Years">5+ Years</option>
            <option value="Any Experience">Any Experience</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Education Required
          </label>
          <select
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px", background: "#fff" }}
          >
            <option value="Any">Any Qualification</option>
            <option value="10th / 12th Pass">10th / 12th Pass</option>
            <option value="ITI / Diploma">ITI / Diploma</option>
            <option value="Graduate (Any Degree)">Graduate (Any Degree)</option>
            <option value="Post-Graduate / B.E.">Post-Graduate / B.E.</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
            Job Locality (Hosur area)
          </label>
          <input
            type="text"
            placeholder="e.g. SIPCOT Phase 1, Bagalur Road"
            value={locality}
            onChange={(e) => {
              setLocality(e.target.value);
              setLocation(e.target.value);
            }}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
          />
        </div>
      </div>

      {/* Perks Checkboxes */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
          Perks & Facilities Offered (Select all that apply)
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {COMMON_PERKS.map((perk) => {
            const isSelected = selectedPerks.includes(perk);
            return (
              <button
                key={perk}
                type="button"
                onClick={() => togglePerk(perk)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  border: isSelected ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                  background: isSelected ? "#ecfdf5" : "#ffffff",
                  color: isSelected ? "#166534" : "#475569",
                  fontSize: "11.5px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {isSelected ? "✓ " : "+ "} {perk}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
          Job Description & Duties *
        </label>
        <textarea
          rows={3}
          placeholder="Describe daily work, shifts, machine types, or responsibilities..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", resize: "vertical" }}
        />
      </div>

      {/* Requirements (One per line) */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
          Key Requirements (Optional - one per line)
        </label>
        <textarea
          rows={2}
          placeholder="e.g.&#10;Must know 2-wheeler riding&#10;Basic computer billing skills"
          value={requirementsText}
          onChange={(e) => setRequirementsText(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12.5px", resize: "vertical" }}
        />
      </div>

      {/* Contact Details */}
      <div style={{ background: "#f0fdf4", padding: "12px 14px", borderRadius: "10px", border: "1px solid #bbf7d0", marginBottom: "18px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: "6px" }}>
          Candidate Application Contacts
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#334155", marginBottom: "2px" }}>
              Contact Person / HR Name
            </label>
            <input
              type="text"
              placeholder="e.g. Mr. Ramesh (HR)"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#334155", marginBottom: "2px" }}>
              Phone Number for Calls *
            </label>
            <input
              type="tel"
              placeholder="+91 94432 10987"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#334155", marginBottom: "2px" }}>
              WhatsApp Number
            </label>
            <input
              type="tel"
              placeholder="+91 94432 10987"
              value={contactWhatsapp}
              onChange={(e) => setContactWhatsapp(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: "10px 18px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 22px",
            background: "#16a34a",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
          }}
        >
          {submitting ? "Publishing Job..." : "Publish Job Opening 🚀"}
        </button>
      </div>
    </form>
  );
}

/**
 * Dedicated Business Portal Job Openings Manager.
 * Displays all openings posted by this business with active/closed status toggles and + Post Job button.
 */
export function BusinessJobsManager({
  businessName,
  businessPhone = "",
  businessWhatsapp = "",
  businessAddress = "",
  businessLocality = "Hosur",
  showNotice,
}: {
  businessName: string;
  businessPhone?: string;
  businessWhatsapp?: string;
  businessAddress?: string;
  businessLocality?: string;
  showNotice?: (msg: string) => void;
}) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const loadBusinessJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs?status=all&businessName=${encodeURIComponent(businessName)}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [businessName]);

  useEffect(() => {
    loadBusinessJobs();
    const handleUpdated = () => loadBusinessJobs();
    if (typeof window !== "undefined") {
      window.addEventListener("neighborly-jobs-updated", handleUpdated);
      return () => window.removeEventListener("neighborly-jobs-updated", handleUpdated);
    }
  }, [loadBusinessJobs]);

  const handleToggleStatus = async (job: JobListing) => {
    const nextStatus = job.status === "active" ? "closed" : "active";
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: job.id,
          status: nextStatus,
          businessName,
        }),
      });
      if (res.ok) {
        if (showNotice) {
          showNotice(`Job "${job.title}" marked as ${nextStatus === "active" ? "Active (Accepting candidates)" : "Closed (Role filled)"}`);
        }
        loadBusinessJobs();
      }
    } catch {
      if (showNotice) showNotice("Failed to update status.");
    }
  };

  const handleDeleteJob = async (job: JobListing) => {
    if (!window.confirm(`Are you sure you want to permanently delete the job opening "${job.title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/jobs?id=${encodeURIComponent(job.id)}&businessName=${encodeURIComponent(businessName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (showNotice) showNotice(`Job "${job.title}" deleted.`);
        loadBusinessJobs();
      }
    } catch {
      if (showNotice) showNotice("Failed to delete job.");
    }
  };

  const activeJobs = jobs.filter((j) => j.status === "active");

  return (
    <div>
      {isPosting ? (
        <JobPostForm
          businessName={businessName}
          businessPhone={businessPhone}
          businessWhatsapp={businessWhatsapp}
          businessAddress={businessAddress}
          businessLocality={businessLocality}
          showNotice={showNotice}
          onCancel={() => setIsPosting(false)}
          onSuccess={() => {
            setIsPosting(false);
            loadBusinessJobs();
          }}
        />
      ) : (
        <>
          {/* Header Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div>
              <div className="eyebrow">RECRUITMENT & HIRING</div>
              <h2 style={{ margin: "2px 0 0" }}>Job Openings ({jobs.length})</h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Post openings for your store, workshop, or office. Job seekers in Hosur can reach you directly on Phone & WhatsApp.
              </p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsPosting(true)}
              style={{ fontSize: "12.5px", padding: "8px 16px" }}
            >
              + Post a Job Opening
            </button>
          </div>

          {/* Metrics summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Active Openings</span>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#065f46", marginTop: "2px" }}>
                {activeJobs.length} Live
              </div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 14px", borderRadius: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Posted</span>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {jobs.length} Positions
              </div>
            </div>
          </div>

          {/* List of Jobs */}
          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading job openings...</p>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", background: "#f8fafc", borderRadius: "14px", border: "1.5px dashed #cbd5e1" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>💼</div>
              <h4 style={{ margin: "0 0 4px", fontSize: "16px" }}>No job openings posted yet</h4>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b", maxWidth: "400px", marginInline: "auto" }}>
                Need helpers, machine operators, technicians, cashiers, or delivery partners? Post a free job listing now!
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setIsPosting(true)}
                style={{ fontSize: "13px", padding: "9px 18px" }}
              >
                + Post Your First Job Opening
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    background: "#ffffff",
                    border: job.status === "active" ? "1.5px solid #bbf7d0" : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    opacity: job.status === "closed" ? 0.75 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: job.status === "active" ? "#dcfce7" : "#f1f5f9",
                          color: job.status === "active" ? "#15803d" : "#64748b",
                        }}
                      >
                        ● {job.status === "active" ? "ACTIVE / LIVE" : "CLOSED / FILLED"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {job.jobType} · {job.category}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                      {job.title}
                    </h4>

                    <div style={{ fontSize: "12.5px", color: "#475569", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      <span>💰 {formatSalary(job)}</span>
                      <span>📍 {job.locality || job.location}</span>
                      <span>📞 {job.contactPhone}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      style={{
                        padding: "7px 12px",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      View Preview 👁️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(job)}
                      style={{
                        padding: "7px 12px",
                        background: job.status === "active" ? "#fffbeb" : "#ecfdf5",
                        border: `1px solid ${job.status === "active" ? "#fde68a" : "#a7f3d0"}`,
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: job.status === "active" ? "#92400e" : "#065f46",
                        cursor: "pointer",
                      }}
                    >
                      {job.status === "active" ? "Mark as Filled / Close" : "Re-open Position"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job)}
                      style={{
                        padding: "7px 10px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#991b1b",
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedJob && (
            <JobDetailModal
              job={selectedJob}
              onClose={() => setSelectedJob(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Public Job Directory Modal - Allows all users & job seekers to browse, search, and apply for jobs.
 */
export function JobsDirectoryModal({
  isOpen,
  onClose,
  currentLocality = "Hosur",
  showNotice,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentLocality?: string;
  showNotice?: (msg: string) => void;
}) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedJobType, setSelectedJobType] = useState("All");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?status=active", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadJobs();
    }
  }, [isOpen, loadJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedCategory !== "All" && job.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (selectedJobType !== "All" && job.jobType.toLowerCase() !== selectedJobType.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const mTitle = job.title.toLowerCase().includes(q);
        const mBiz = job.businessName.toLowerCase().includes(q);
        const mDesc = job.description.toLowerCase().includes(q);
        const mLoc = (job.locality || job.location).toLowerCase().includes(q);
        if (!mTitle && !mBiz && !mDesc && !mLoc) return false;
      }
      return true;
    });
  }, [jobs, selectedCategory, selectedJobType, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(5px)",
        zIndex: 99990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          maxWidth: "1050px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              LOCAL EMPLOYMENT HUB
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
              💼 Jobs & Hiring in {currentLocality || "Hosur"}
            </h2>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0" }}>
              Explore verified local openings. Apply directly to business owners & HRs via WhatsApp or Phone.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#e2e8f0",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              fontSize: "15px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
            }}
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
            <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
              <input
                type="text"
                placeholder="Search job title, business name, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  background: "#ffffff",
                }}
              />
              <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                🔍
              </span>
            </div>

            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12.5px",
                background: "#ffffff",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t === "All" ? "All Job Types" : t}</option>
              ))}
            </select>
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
            {JOB_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "18px",
                    border: active ? "1.5px solid #166534" : "1px solid #cbd5e1",
                    background: active ? "#ecfdf5" : "#ffffff",
                    color: active ? "#166534" : "#475569",
                    fontSize: "11.5px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Job List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              <p>Loading local job openings...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "#f8fafc", borderRadius: "16px", border: "1.5px dashed #cbd5e1" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>💼</div>
              <h3 style={{ fontSize: "16px", color: "#0f172a", margin: "0 0 6px" }}>
                No active jobs found {selectedCategory !== "All" ? `in "${selectedCategory}"` : ""}
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Try adjusting your category filter or search query. Local businesses regularly post new openings!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelect={(j) => setSelectedJob(j)}
                />
              ))}
            </div>
          )}
        </div>

        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Customer Shortlist Tab Panel: Shows jobs in customer portal.
 */
export function JobsPanel({
  onOpenDirectory,
  showNotice,
}: {
  onOpenDirectory?: () => void;
  showNotice?: (msg: string) => void;
}) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?status=active", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    const handleUpdated = () => loadJobs();
    if (typeof window !== "undefined") {
      window.addEventListener("neighborly-jobs-updated", handleUpdated);
      return () => window.removeEventListener("neighborly-jobs-updated", handleUpdated);
    }
  }, [loadJobs]);

  return (
    <section className="panel tab-panel">
      <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div className="eyebrow">LOCAL OPPORTUNITIES</div>
          <h2>Verified Job Listings ({jobs.length})</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Browse local openings in Hosur & apply directly via WhatsApp or Call with zero fee.
          </p>
        </div>
        {onOpenDirectory && (
          <button
            type="button"
            className="primary-button"
            onClick={onOpenDirectory}
            style={{ fontSize: "12.5px", padding: "8px 14px" }}
          >
            Open Jobs Directory ↗
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "13px" }}>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💼</div>
          <h4 style={{ margin: "0 0 4px", fontSize: "15px" }}>No job openings posted currently</h4>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Check back soon as local businesses frequently post new openings.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px", marginTop: "14px" }}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onSelect={(j) => setSelectedJob(j)} />
          ))}
        </div>
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </section>
  );
}
