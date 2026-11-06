"use client";

import React, { useEffect, useState } from "react";

export type TermsRole = "Customer" | "Business" | "Agent" | "Account";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  role: TermsRole;
  initialTab?: "terms" | "privacy";
}

interface RolePolicyContent {
  title: string;
  badge: string;
  termsTitle: string;
  privacyTitle: string;
  termsSections: Array<{ heading: string; points: string[] }>;
  privacySections: Array<{ heading: string; points: string[] }>;
}

export const ROLE_POLICIES: Record<string, RolePolicyContent> = {
  Business: {
    title: "Business Partner Terms & Privacy Policy",
    badge: "BUSINESS PARTNER",
    termsTitle: "Business Partner Terms & Conditions",
    privacyTitle: "Business Partner Privacy & Data Policy",
    termsSections: [
      {
        heading: "1. Authenticity of Listing & Merchant Identity",
        points: [
          "You certify that you are the lawful proprietor, director, or authorized representative of the business entity being registered on Bizearch.",
          "All submitted profile details—including legal business name, trade name, owner/manager name, physical storefront address, contact numbers, email, GSTIN/tax identification, and operating hours—must be 100% accurate, complete, and current.",
          "You agree to maintain and promptly update your profile information should any address, contact number, or ownership change occur.",
        ],
      },
      {
        heading: "2. Physical Storefront GPS Pinning & On-Site Verification",
        points: [
          "You agree to provide accurate GPS coordinates pinned at your physical customer entrance or store doorstep.",
          "You grant permission for authorized Bizearch field verification agents to conduct on-site physical audits, inspect registered commercial signage, and photograph the storefront facade for directory verification.",
          "Providing misleading, fraudulent, or residential-masked coordinates to deceive local customers or search algorithms is strictly prohibited.",
        ],
      },
      {
        heading: "3. Product & Pricing Integrity & Prohibited Items",
        points: [
          "You are solely accountable for the catalog items, pricing, inventory availability, and descriptions published under your business account.",
          "Prices and promotional discounts shown to customers on Bizearch must be honored in good faith during customer visits or orders.",
          "The advertisement, listing, or sale of counterfeit items, illicit substances, weapons, hazardous chemical products, or unlicensed services is strictly forbidden and subject to instant blacklisting and legal reporting.",
        ],
      },
      {
        heading: "4. Customer Communication & Orders",
        points: [
          "You agree to handle all customer interactions, WhatsApp chat inquiries, phone calls, and quotation requests with promptness, honesty, and courtesy.",
          "Customer contact information obtained via Bizearch may only be used for the direct fulfillment of customer inquiries or orders. Unsolicited commercial broadcasts or third-party data reselling are strictly prohibited.",
        ],
      },
      {
        heading: "5. Review & Rating Non-Interference",
        points: [
          "Customers possess the fundamental right to leave authentic feedback and ratings regarding their personal purchasing or service experience.",
          "Merchants are strictly prohibited from manipulating reviews through self-reviews, coerced employee reviews, or incentivized positive rating rings.",
          "Disputes regarding defamatory or abusive customer reviews must be escalated through the official Bizearch Support Portal for impartial moderation.",
        ],
      },
      {
        heading: "6. Platform Subscription & Delisting",
        points: [
          "Bizearch reserves the right to suspend, demote, or terminate any listing found guilty of fraud, statutory tax non-compliance, consumer harassment, or breach of platform standards.",
          "Featured placement, banner campaigns, and verified badges are subject to active platform subscriptions and verified field audit status.",
        ],
      },
    ],
    privacySections: [
      {
        heading: "1. What Business Data We Collect",
        points: [
          "Commercial Information: Business name, trade category, entity type, owner full name, mobile number, email address, physical address, and exact pinned GPS coordinates.",
          "Statutory & Tax Records: 15-digit GSTIN, trade licenses, or business proof documents submitted during registration or agent verification.",
          "Media & Showcase: Storefront exterior/interior photographs, brand logo, catalog images, and product pricing.",
        ],
      },
      {
        heading: "2. How We Use and Display Your Data",
        points: [
          "Public Directory Visibility: Business contact number, address, catalog, and photos are displayed publicly in the Bizearch directory so nearby customers can discover and navigate to your business.",
          "Navigation & Map Routing: Storefront GPS coordinates are used to calculate distances for nearby customers and provide live turn-by-turn driving directions.",
          "Confidential Documents: Statutory tax certificates, GST invoices, and internal verification audit notes are retained solely for internal compliance and are never shown publicly.",
        ],
      },
      {
        heading: "3. Data Security & Your Rights",
        points: [
          "You retain full access to manage, edit, or update your public profile and inventory at any time through your Business Portal account.",
          "Bizearch does not sell your merchant database to third-party telemarketing or data brokerage firms.",
        ],
      },
    ],
  },
  Agent: {
    title: "Field Agent Partner Terms & Privacy Policy",
    badge: "FIELD AGENT PARTNER",
    termsTitle: "Field Agent Partner Terms of Service",
    privacyTitle: "Field Agent Privacy & Location Tracking Policy",
    termsSections: [
      {
        heading: "1. Professional Representation & Code of Conduct",
        points: [
          "As an authorized Bizearch Field Agent, you represent the brand, integrity, and values of Jishnu Infotech in the field.",
          "You must treat every merchant, entrepreneur, and local customer with respect, transparency, and high professionalism.",
          "You shall carry your official digital Agent verification ID and present it when introducing yourself to merchants.",
        ],
      },
      {
        heading: "2. Mandatory On-Site Physical Verification",
        points: [
          "Every business verification task must be conducted in person at the actual physical store or commercial premises.",
          "Remote verification, approving businesses without visiting the physical doorstep, or relying on phone calls is grounds for immediate contract revocation.",
          "You must record the exact live device GPS coordinates while standing at the store entrance to ensure geo-fencing accuracy.",
        ],
      },
      {
        heading: "3. Authentic Photographic Evidence",
        points: [
          "You must capture clear, real-time, in-person photos of the shop exterior, official storefront board, and merchant interaction using the live agent camera tool.",
          "Uploading pre-downloaded images, stock photos, or manipulated pictures is strictly forbidden and treated as gross professional misconduct.",
        ],
      },
      {
        heading: "4. Zero Tolerance for Bribery or Extortion",
        points: [
          "Agents are strictly forbidden from demanding, soliciting, or receiving cash payments, tips, personal favors, or bribes from business owners.",
          "All onboarding fees or subscription charges must be processed transparently through official Bizearch platform payment links with automated digital receipts.",
        ],
      },
      {
        heading: "5. Referral Commissions & Disqualification",
        points: [
          "Agent commissions, milestone bonuses, and payout distributions are issued strictly for genuine, validated merchant onboardings that successfully pass Admin audit.",
          "Creating fictitious shops, dummy phone accounts, or colluding with unregistered traders will lead to immediate account blacklisting and forfeiture of all accrued earnings.",
        ],
      },
      {
        heading: "6. Confidentiality & Non-Disclosure",
        points: [
          "All business contact registries, merchant records, and company audit metrics accessed via the Agent Portal are strictly confidential property of Bizearch.",
          "Exporting, leaking, or sharing merchant data with competing directories or third parties is prohibited and subject to legal prosecution.",
        ],
      },
    ],
    privacySections: [
      {
        heading: "1. Agent Information We Collect",
        points: [
          "Identity & Contact: Full name, mobile phone number, email address, official government ID proof, and residential locality.",
          "Live GPS Location: Real-time device location when you are actively logging field audits or checking in to a merchant storefront.",
          "Payout Records: UPI ID, bank account details, and transaction logs for crediting referral incentives and monthly commissions.",
        ],
      },
      {
        heading: "2. Use of Field Geolocation",
        points: [
          "Your device coordinates are captured only during active merchant verification visits to validate on-site physical presence and prevent fraudulent approvals.",
          "We do not continuously monitor or track agent movements outside active field verification workflows.",
        ],
      },
      {
        heading: "3. Security & Access",
        points: [
          "Your personal identity and banking details are encrypted and restricted solely to authorized Company Super Admins.",
        ],
      },
    ],
  },
  Customer: {
    title: "Customer Terms & Privacy Policy",
    badge: "CUSTOMER ACCOUNT",
    termsTitle: "Customer Terms of Service & Community Guidelines",
    privacyTitle: "Customer Privacy & Location Policy",
    termsSections: [
      {
        heading: "1. Personal Account Usage & Security",
        points: [
          "Your Bizearch customer account is intended solely for personal, non-commercial use to discover local businesses, access products, and engage with neighborhood services.",
          "You are responsible for keeping your login credentials and OTP codes confidential. Any activity conducted under your account is your responsibility.",
        ],
      },
      {
        heading: "2. Honest & Lawful Engagement with Merchants",
        points: [
          "When contacting businesses via direct phone call, WhatsApp chat, or order forms, you agree to make genuine commercial enquiries in good faith.",
          "Harassment, abusive communication, fraudulent claims, or sending spam to local shopkeepers is strictly prohibited and results in immediate account suspension.",
        ],
      },
      {
        heading: "3. Authentic Reviews & Feedback",
        points: [
          "Reviews, star ratings, and comments you publish must reflect your own genuine, first-hand shopping or service experience.",
          "Posting false reviews, defamatory remarks, extortion attempts, or hate speech against businesses or fellow community members will not be tolerated.",
        ],
      },
      {
        heading: "4. Emergency SOS Safety Network",
        points: [
          "The SOS Emergency Help feature is provided as a community life-safety tool for genuine emergency situations requiring urgent community or contact assistance.",
          "Triggering prank alerts, false emergency alarms, or malicious misuse of the SOS button is an offense and will result in immediate permanent banning and notification of local authorities.",
        ],
      },
      {
        heading: "5. Proximity & Hyper-Local Search",
        points: [
          "Bizearch provides approximate distances and neighborhood recommendations to assist your daily shopping and service discovery.",
          "Always confirm specific opening hours, stock availability, and service details directly with the merchant before traveling.",
        ],
      },
    ],
    privacySections: [
      {
        heading: "1. Information We Collect from Customers",
        points: [
          "Account Profile: Full name, mobile number, optional email address, and home locality/neighborhood.",
          "Optional Device GPS: When you grant location permission, your coordinates are used solely to sort nearby businesses by distance.",
          "Safety Network: Emergency contact names and mobile numbers provided for the SOS broadcast feature.",
        ],
      },
      {
        heading: "2. How Your Data is Used & Protected",
        points: [
          "Hyper-Local Discovery: Calculating distance to shops, showing neighborhood recommendations, and offering navigation routing.",
          "Direct Merchant Contact: When you initiate a phone call or WhatsApp message, you connect directly with the merchant using standard carrier channels.",
          "No Third-Party Sale: We do not sell your personal data, phone number, or location history to commercial advertisers or third-party telemarketers.",
        ],
      },
      {
        heading: "3. Location Privacy & Your Controls",
        points: [
          "Location sharing is optional. You may decline browser GPS permission and manually choose your locality (e.g., Bagalur Road, Mathigiri) to browse nearby businesses without sharing live coordinates.",
        ],
      },
    ],
  },
};

export function TermsModal({
  isOpen,
  onClose,
  onAccept,
  role,
  initialTab = "terms",
}: TermsModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);

  const policyKey = role === "Account" ? "Customer" : role;
  const content = ROLE_POLICIES[policyKey] || ROLE_POLICIES.Customer;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="terms-modal-backdrop"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(14, 28, 18, 0.65)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        zIndex: 14000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
        overscrollBehavior: "contain",
        touchAction: "none",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="terms-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="terms-modal-title"
        aria-modal="true"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.28)",
          boxSizing: "border-box",
          overflow: "hidden",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
          position: "relative",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5ebe5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8faf8",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "#285536",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                display: "inline-block",
                padding: "2px 8px",
                background: "#eaf3eb",
                borderRadius: "4px",
                marginBottom: "4px",
              }}
            >
              ● {content.badge}
            </div>
            <h2
              id="terms-modal-title"
              style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: 800,
                color: "#183921",
                letterSpacing: "-0.3px",
              }}
            >
              {activeTab === "terms" ? content.termsTitle : content.privacyTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Terms and Conditions"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid #d9e3da",
              background: "#ffffff",
              color: "#46594b",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e8ede8",
            background: "#ffffff",
            padding: "4px 16px 0",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            style={{
              padding: "10px 14px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "terms" ? "3px solid #285536" : "3px solid transparent",
              color: activeTab === "terms" ? "#194d27" : "#657668",
              fontWeight: activeTab === "terms" ? 800 : 600,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📄</span>
            <span>Terms &amp; Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            style={{
              padding: "10px 14px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "privacy" ? "3px solid #285536" : "3px solid transparent",
              color: activeTab === "privacy" ? "#194d27" : "#657668",
              fontWeight: activeTab === "privacy" ? 800 : 600,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔒</span>
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: "18px 20px",
            overflowY: "auto",
            flex: 1,
            maxHeight: "calc(88vh - 140px)",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
            fontSize: "12.5px",
            lineHeight: 1.65,
            color: "#304234",
          }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "#f2f8f3",
              border: "1px solid #d5e6d7",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "11.5px",
              color: "#1f4728",
            }}
          >
            <strong>Role Focus:</strong> This policy applies to all <strong>{content.badge}</strong> registrations on Bizearch. Please review your roles, operational responsibilities, and data protections carefully before accepting.
          </div>

          {activeTab === "terms" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {content.termsSections.map((sec, idx) => (
                <div key={idx} style={{ background: "#ffffff" }}>
                  <h3
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#184524",
                    }}
                  >
                    {sec.heading}
                  </h3>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#3a4d3f",
                      fontSize: "12px",
                    }}
                  >
                    {sec.points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {content.privacySections.map((sec, idx) => (
                <div key={idx} style={{ background: "#ffffff" }}>
                  <h3
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#184524",
                    }}
                  >
                    {sec.heading}
                  </h3>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      color: "#3a4d3f",
                      fontSize: "12px",
                    }}
                  >
                    {sec.points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              paddingTop: "12px",
              borderTop: "1px dashed #d5ded6",
              fontSize: "11px",
              color: "#6b7d6f",
              textAlign: "center",
            }}
          >
            Published by Jishnu Infotech · Hosur, Tamil Nadu · Last updated: November 2026
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e5ebe5",
            background: "#fbfcfb",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid #ced8cf",
              background: "#ffffff",
              color: "#3d5242",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>

          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#285536",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(40, 85, 54, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>✓ I Read &amp; Accept Terms</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
