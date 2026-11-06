"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { MapPinModal, type Coordinates } from "../map-pin-modal";

export type PortalRole = "Account" | "Business" | "Agent";

const portalInfo: Record<PortalRole, { title: string; description: string; label: string }> = {
  Account: {
    title: "Sign in to your account",
    description: "Access your saved businesses, recent searches and enquiries.",
    label: "CUSTOMER ACCOUNT",
  },
  Business: {
    title: "Business portal sign in",
    description: "Manage your business listing, products, enquiries and plan.",
    label: "BUSINESS PARTNER ACCESS",
  },
  Agent: {
    title: "Agent portal sign in",
    description: "Access referrals and your neighborhood partner activity.",
    label: "NEIGHBORHOOD AGENT ACCESS",
  },
};

export default function LoginForm({ portal }: { portal: PortalRole }) {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showBusinessPinModal, setShowBusinessPinModal] = useState(false);
  const [pinnedBusinessCoords, setPinnedBusinessCoords] = useState<Coordinates | null>(null);
  const [businessNameInput, setBusinessNameInput] = useState("");
  const info = portalInfo[portal];

  async function handleOtp(action: "send" | "verify", phone: string) {
    setOtpBusy(true);
    setMessage("");
    setIsSuccess(false);
    try {
      const response = await fetch("/api/registration/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, role: portal, phone, code: otp }) });
      const result = await response.json() as { error?: string; demoCode?: string };
      if (!response.ok) throw new Error(result.error || "Could not verify this mobile number.");
      if (action === "send") {
        setDemoOtp(result.demoCode || "");
        if (result.demoCode) {
          setOtp(result.demoCode);
        } else {
          setOtp("");
        }
        setOtpVerified(false);
        setIsSuccess(true);
        setMessage(result.demoCode ? `Verification code ${result.demoCode} generated. Click 'Verify OTP' to proceed.` : "OTP sent to your mobile number.");
      } else {
        setOtpVerified(true);
        setIsSuccess(true);
        setMessage("Mobile number verified ✓. Enter your password to complete registration.");
      }
    } catch (error) {
      setOtpVerified(false);
      setIsSuccess(false);
      setMessage(error instanceof Error ? error.message : "Could not verify this mobile number.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsSuccess(false);
    const form = new FormData(event.currentTarget);
    if (registering) {
      const name = String(form.get("fullName") || "").trim();
      const phone = String(form.get("phone") || "").trim();
      const email = String(form.get("email") || "").trim();
      const locality = String(form.get("locality") || "Bagalur Road").trim();
      const doorNo = String(form.get("doorNo") || "").trim();
      const street = String(form.get("street") || "").trim();
      const emergencyContactName = String(form.get("emergencyContactName") || "").trim();
      const emergencyContactPhone = String(form.get("emergencyContactPhone") || "").trim();
      const emergencyContactRelation = String(form.get("emergencyContactRelation") || "Family").trim();
      const fullAddress = [doorNo, street, locality, "Hosur - 635109"].filter(Boolean).join(", ");
      const password = String(form.get("password") || "").trim();
      const confirmPassword = String(form.get("confirmPassword") || "").trim();
      if (!otpVerified) {
        setIsSuccess(false);
        setMessage("Verify your mobile number before submitting registration.");
        setBusy(false);
        return;
      }
      if (password.length < 6) {
        setIsSuccess(false);
        setMessage("Password must be at least 6 characters long.");
        setBusy(false);
        return;
      }
      if (password !== confirmPassword) {
        setIsSuccess(false);
        setMessage("Passwords do not match. Please ensure both passwords match.");
        setBusy(false);
        return;
      }
      if (portal === "Agent") {
        try {
          const response = await fetch("/api/agents/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, password, email }),
          });
          const result = (await response.json()) as { error?: string; message?: string; agent?: { referralCode: string } };
          if (!response.ok) throw new Error(result.error || "Could not complete agent registration.");
          setIsSuccess(true);
          setMessage(result.message || "✓ Agent registered successfully! Loading your agent portal...");
          try {
            localStorage.setItem("bizearch_registered_user", JSON.stringify({ name, phone, email, role: "Agent", registeredAt: new Date().toISOString() }));
          } catch { /* Browser storage */ }
          setTimeout(() => {
            window.location.assign("/?portal=Agent");
          }, 800);
        } catch (error) {
          setIsSuccess(false);
          setMessage(error instanceof Error ? error.message : "Could not submit the agent request.");
        } finally {
          setBusy(false);
        }
        return;
      }
      if (portal === "Business") {
        const category = String(form.get("category") || "Everyday services").trim();
        const ownerName = String(form.get("ownerName") || "").trim();
        const gstin = String(form.get("gstin") || "").trim().toUpperCase();
        const referralCode = String(form.get("referralCode") || form.get("referral") || "").trim().toUpperCase();
        const entityType = String(form.get("entityType") || "Sole Proprietorship").trim();
        const city = String(form.get("city") || "").trim();
        const state = String(form.get("state") || "").trim();
        const pincode = String(form.get("pincode") || "").trim();
        const website = String(form.get("website") || "").trim();

        // Mandatory address validation
        if (!doorNo) {
          setIsSuccess(false);
          setMessage("Door / Shop / Building No. is mandatory.");
          setBusy(false);
          return;
        }
        if (!street) {
          setIsSuccess(false);
          setMessage("Street / Road / Landmark is mandatory.");
          setBusy(false);
          return;
        }
        if (!locality) {
          setIsSuccess(false);
          setMessage("Locality / Area is mandatory.");
          setBusy(false);
          return;
        }
        if (!city) {
          setIsSuccess(false);
          setMessage("City / Town is mandatory.");
          setBusy(false);
          return;
        }
        if (!state) {
          setIsSuccess(false);
          setMessage("State / Province is mandatory.");
          setBusy(false);
          return;
        }
        if (!pincode) {
          setIsSuccess(false);
          setMessage("Pincode / Postal code is mandatory.");
          setBusy(false);
          return;
        }

        // Mandatory GST No. validation
        if (!gstin) {
          setIsSuccess(false);
          setMessage("GST Number / Business Tax ID is mandatory.");
          setBusy(false);
          return;
        }

        try {
          const response = await fetch("/api/businesses/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              category,
              phone,
              email,
              doorNo,
              street,
              locality,
              city,
              state,
              pincode,
              gstin,
              ownerName,
              entityType,
              website,
              agentCode: referralCode?.trim() || "JIT",
              referralCode: referralCode?.trim() || "JIT",
              password,
              coordinates: pinnedBusinessCoords,
            }),
          });
          const result = (await response.json()) as { error?: string; business?: any };
          if (!response.ok) throw new Error(result.error || "Could not complete business registration.");
          setIsSuccess(true);
          setMessage(`✓ Business "${name}" registered successfully! Loading your business portal...`);
          try {
            const combinedAddr = [doorNo, street, locality, city, state, pincode].filter(Boolean).join(", ");
            const freshBizProfile = {
              fullName: name,
              phone: phone,
              email: email || "",
              doorNo: doorNo || "",
              street: street || "",
              locality: locality || "",
              city: city || "",
              district: city || "",
              state: state || "",
              pincode: pincode || "",
              address: combinedAddr || "",
              bio: `${category} · Pending Verification`,
              avatarInitials: (name ? name[0] : "B").toUpperCase(),
              avatarBg: "#0f766e",
              emergencyPhones: ["", ""],
              emergencyNames: ["", ""],
              emergencyRelations: ["", ""],
            };
            localStorage.setItem("neighborly_profile_Business", JSON.stringify(freshBizProfile));
            localStorage.setItem("neighborly-profile-v1-business", JSON.stringify(freshBizProfile));
            localStorage.setItem(`neighborly-profile-v1-business-${encodeURIComponent(phone.trim().toLowerCase())}`, JSON.stringify(freshBizProfile));
            localStorage.setItem("bizearch_registered_user", JSON.stringify({ name, phone, email, role: "Business", registeredAt: new Date().toISOString() }));
          } catch { /* Browser storage */ }
          setTimeout(() => {
            window.location.assign("/?portal=Business");
          }, 800);
        } catch (error) {
          setIsSuccess(false);
          setMessage(error instanceof Error ? error.message : "Could not complete business registration.");
        } finally {
          setBusy(false);
        }
        return;
      }
      const recordRequest = async (locationStatus: "shared" | "denied" | "unavailable", latitude: number | null = null, longitude: number | null = null) => {
        try {
          const response = await fetch("/api/customers/registration-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              phone,
              email,
              password,
              doorNo,
              street,
              locality,
              pincode: "635109",
              address: fullAddress,
              emergencyContactName,
              emergencyContactPhone,
              emergencyContactRelation,
              locationStatus,
              latitude,
              longitude,
            }),
          });
          const result = await response.json() as { error?: string; message?: string };
          if (!response.ok) throw new Error(result.error || "Could not complete registration.");
          
          setIsSuccess(true);
          setMessage(`✓ Account activated! Welcome to Bizearch, ${name}. Loading your neighborhood...`);
          
          try {
            const customerProfileData = {
              fullName: name,
              phone,
              email,
              doorNo,
              street,
              locality,
              city: "Hosur",
              district: "Krishnagiri",
              state: "Tamil Nadu",
              pincode: "635109",
              address: fullAddress,
              bio: "Hosur resident & verified community member.",
              avatarInitials: (name[0] || "C").toUpperCase(),
              avatarBg: "#285536",
              emergencyPhones: [emergencyContactPhone, ""],
              emergencyNames: [emergencyContactName, ""],
              emergencyRelations: [emergencyContactRelation, ""],
            };
            localStorage.setItem("bizearch_registered_user", JSON.stringify({ name, phone, email, registeredAt: new Date().toISOString() }));
            localStorage.setItem("neighborly_profile_Account", JSON.stringify(customerProfileData));
            localStorage.setItem("neighborly-profile-v1-account", JSON.stringify(customerProfileData));
            sessionStorage.removeItem("neighborly_login_location");
            if (latitude !== null && longitude !== null) {
              sessionStorage.setItem("neighborly_login_location", JSON.stringify({ latitude, longitude }));
            }
          } catch { /* Browser storage */ }

          setTimeout(() => {
            window.location.assign("/");
          }, 800);
        } catch (error) {
          setIsSuccess(false);
          setMessage(error instanceof Error ? error.message : "Could not complete registration.");
          setBusy(false);
        }
      };
      if (!navigator.geolocation) {
        await recordRequest("unavailable");
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => { void recordRequest("shared", position.coords.latitude, position.coords.longitude); },
          (error) => { void recordRequest(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"); },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
        );
      }
      return;
    }
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: portal, identity: form.get("identity"), password: form.get("password") }),
      });
      const result = await response.json() as {
        error?: string;
        redirectPortal?: string;
        redirectUrl?: string;
        session?: { role?: string; identity?: string };
      };
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      setIsSuccess(true);
      const targetRole = result.redirectPortal || result.session?.role || portal;
      const targetUrl = result.redirectUrl || (targetRole === "Account" ? "/" : `/?portal=${targetRole}`);
      if (targetRole === "Account") {
        try { sessionStorage.removeItem("neighborly_login_location"); } catch { /* Sign-in does not depend on browser storage. */ }
        setMessage("Sign in successful. Redirecting to portal…");
      }
      setTimeout(() => { window.location.href = targetUrl; }, 150);
    } catch (error) {
      setIsSuccess(false);
      setMessage(error instanceof Error ? error.message : "Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return <main className="login-page">
    <header className="login-page-header">
      <Link className="brand" href="/" aria-label="Bizearch home">
        <img className="brand-mark" src="/bizearch-mark.svg" alt="" />
        <span>bizearch<span className="brand-period">.</span></span>
      </Link>
      <div className="login-page-powered"><span>Powered by</span><img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" /></div>
    </header>
    <section className="portal-login-card">
      <img className="login-brand-mark login-brand-mark-image" src="/bizearch-mark.svg" alt="" />
      <div className="eyebrow"><span /> {info.label}</div>
      <h1>{registering ? (portal === "Business" ? "Register your business" : portal === "Agent" ? "Join as an Agent partner" : "Join your neighborhood") : info.title}</h1>
      <p className="portal-login-description">
        {registering
          ? portal === "Agent"
            ? "Apply to help local businesses reach their customers in your region."
            : portal === "Business"
            ? "Register your business to showcase products, receive customer orders, and reach customers anywhere."
            : "Create and activate your account to discover and connect with nearby businesses."
          : info.description}
      </p>
      <form className="stacked-form" onSubmit={handleSubmit}>
        {registering ? (
          <>
            <label>
              {portal === "Business" ? "Business Name *" : "Your full name *"}
              <input
                name="fullName"
                autoComplete="name"
                placeholder={portal === "Business" ? "e.g. Sri Lakshmi Automotives" : "e.g. Asha Rao"}
                required
              />
            </label>

            {portal === "Business" && (
              <>
                <label>
                  Owner / Authorized Contact Person *
                  <input
                    name="ownerName"
                    autoComplete="name"
                    placeholder="e.g. Ramesh Kumar"
                    required
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  <label>
                    Business Category / Sector *
                    <select
                      name="category"
                      defaultValue="Automobiles"
                      style={{ background: "#fff", cursor: "pointer", padding: "10px", borderRadius: "5px", border: "1px solid #e1e7e0" }}
                      required
                    >
                      {[
                        "Automobiles",
                        "Electronics",
                        "Electricals",
                        "Hardware",
                        "Home appliances",
                        "Fashion",
                        "Food & dining",
                        "Health & wellness",
                        "Sports & fitness",
                        "Travel",
                        "Entertainment",
                        "Everyday services",
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Business Entity Type *
                    <select
                      name="entityType"
                      defaultValue="Sole Proprietorship"
                      style={{ background: "#fff", cursor: "pointer", padding: "10px", borderRadius: "5px", border: "1px solid #e1e7e0" }}
                      required
                    >
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                      <option value="LLP">Limited Liability Partnership (LLP)</option>
                      <option value="Individual / Freelancer">Individual / Freelancer</option>
                      <option value="Other">Other / Commercial Enterprise</option>
                    </select>
                  </label>
                </div>

                <label>
                  GST Number / Business Tax ID *
                  <input
                    name="gstin"
                    placeholder="e.g. 33AAAAA0000A1Z5 (15-digit GSTIN or Tax ID)"
                    required
                    style={{ textTransform: "uppercase" }}
                  />
                </label>
              </>
            )}

            <label>
              Mobile number *
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                minLength={8}
                maxLength={20}
                required
                onChange={() => {
                  setOtpVerified(false);
                  setDemoOtp("");
                }}
              />
            </label>
            <div className="otp-row">
              <label>
                One-time password (OTP) *
                <input
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpVerified(false);
                  }}
                  required
                />
              </label>
              <div className="otp-actions">
                <button
                  type="button"
                  disabled={otpBusy || busy}
                  onClick={(event) => {
                    const phone = String(new FormData(event.currentTarget.form || undefined).get("phone") || "").trim();
                    void handleOtp("send", phone);
                  }}
                >
                  {otpBusy ? "Please wait…" : "Send OTP"}
                </button>
                <button
                  type="button"
                  disabled={otpBusy || busy || otp.length !== 6}
                  onClick={(event) => {
                    const phone = String(new FormData(event.currentTarget.form || undefined).get("phone") || "").trim();
                    void handleOtp("verify", phone);
                  }}
                >
                  Verify OTP
                </button>
              </div>
            </div>
            {demoOtp && (
              <p className="otp-demo-code" role="status">
                Verification OTP: <strong>{demoOtp}</strong> <span>Auto-filled. Click &apos;Verify OTP&apos; to continue.</span>
              </p>
            )}
            {otpVerified && <p className="otp-verified" role="status">Mobile number verified ✓</p>}

            {(portal === "Account" || portal === "Business" || portal === "Agent") && (
              <label>
                Email address <span className="optional">(optional - for invoices &amp; notifications)</span>
                <input name="email" type="email" autoComplete="email" placeholder="e.g. contact@example.com" />
              </label>
            )}

            {portal === "Business" && (
              <label>
                Website / Online Store <span className="optional">(optional)</span>
                <input name="website" type="url" placeholder="e.g. https://mybusiness.com" />
              </label>
            )}

            {portal === "Business" && (
              <label>
                Agent Code <span className="optional">(optional — defaults to JIT)</span>
                <input
                  name="referralCode"
                  placeholder="e.g. JIT (leave blank for default JIT)"
                  style={{ textTransform: "uppercase" }}
                />
              </label>
            )}

            {portal === "Business" && (
              <div style={{ background: "#f8fbf8", border: "1px solid #d4e4d6", borderRadius: "8px", padding: "14px", display: "grid", gap: "10px", margin: "4px 0" }}>
                <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#1b4426", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📍</span> Business Physical Address (Mandatory)
                </div>
                <div style={{ fontSize: "10px", color: "#617565", marginTop: "-4px" }}>
                  Provide your complete physical store / office address for local customer discovery and agent field verification.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#27432f" }}>
                    Door / Shop / Building No. *
                    <input name="doorNo" placeholder="e.g. Shop 4B / Plot 12" required style={{ background: "#fff" }} />
                  </label>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#27432f" }}>
                    Street / Road / Landmark *
                    <input name="street" placeholder="e.g. MG Road, Near Central Bus Stand" required style={{ background: "#fff" }} />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#27432f" }}>
                    Locality / Area *
                    <input name="locality" placeholder="e.g. Indiranagar / Bagalur Road" required style={{ background: "#fff" }} />
                  </label>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#27432f" }}>
                    City / Town *
                    <input name="city" placeholder="e.g. Hosur, Bengaluru, London" required style={{ background: "#fff" }} />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#27432f" }}>
                    State / Province *
                    <input name="state" placeholder="e.g. Tamil Nadu, Karnataka" required style={{ background: "#fff" }} />
                  </label>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#27432f" }}>
                    Pincode / Postal Code *
                    <input name="pincode" placeholder="e.g. 635109" required maxLength={10} style={{ background: "#fff" }} />
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginTop: "4px", paddingTop: "8px", borderTop: "1px dashed #d4e4d6" }}>
                  <button
                    type="button"
                    onClick={() => setShowBusinessPinModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#285536",
                      color: "#ffffff",
                      padding: "7px 14px",
                      borderRadius: "7px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    <span>📍 Pin location on map</span>
                  </button>
                  {pinnedBusinessCoords ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#166534", fontWeight: 700 }}>
                        ✓ Pinned: {pinnedBusinessCoords.latitude.toFixed(6)}, {pinnedBusinessCoords.longitude.toFixed(6)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBusinessPinModal(true)}
                        style={{ background: "none", border: "none", color: "#15803d", textDecoration: "underline", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                      >
                        Adjust
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "10.5px", color: "#617565" }}>
                      Pinpoint exact storefront on interactive map
                    </span>
                  )}
                </div>
              </div>
            )}

            {portal === "Account" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label>
                    Locality / Area *
                    <input name="locality" placeholder="e.g. Bagalur Road" defaultValue="Bagalur Road" required />
                  </label>
                  <label>
                    City / Town *
                    <input name="city" placeholder="e.g. Hosur" defaultValue="Hosur" required />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label>
                    Door / Shop / Flat No. <span className="optional">(optional)</span>
                    <input name="doorNo" placeholder="e.g. Shop 4B / Flat 102" />
                  </label>
                  <label>
                    Street / Landmark <span className="optional">(optional)</span>
                    <input name="street" placeholder="e.g. Near Bus Stand" />
                  </label>
                </div>

                <div style={{ background: "#f8faf8", border: "1px solid #dbe6dc", borderRadius: "8px", padding: "12px", display: "grid", gap: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#285536" }}>🛡️ Emergency SOS Contact (Safety Network)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ fontSize: "10px", color: "#365c41" }}>
                      Emergency Contact Name <span className="optional">(optional)</span>
                      <input name="emergencyContactName" placeholder="e.g. Spouse / Parent" style={{ background: "#fff" }} />
                    </label>
                    <label style={{ fontSize: "10px", color: "#365c41" }}>
                      Emergency Mobile Number <span className="optional">(optional)</span>
                      <input name="emergencyContactPhone" type="tel" placeholder="e.g. 98432 12345" style={{ background: "#fff" }} />
                    </label>
                  </div>
                </div>
              </>
            )}

            <label>
              Password
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password (min. 6 characters)"
                  minLength={6}
                  required
                  value={regPassword}
                  onChange={(event) => setRegPassword(event.target.value)}
                  style={{ width: "100%", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#6b7d70",
                    padding: "4px",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </label>

            <label>
              Confirm password
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  minLength={6}
                  required
                  value={regConfirmPassword}
                  onChange={(event) => setRegConfirmPassword(event.target.value)}
                  style={{ width: "100%", paddingRight: "44px" }}
                />
              </div>
            </label>
            {regConfirmPassword && (
              <div style={{ marginTop: "-6px", marginBottom: "4px", fontSize: "11px", fontWeight: 600 }}>
                {regPassword === regConfirmPassword ? (
                  <span style={{ color: "#166534" }}>✓ Passwords match</span>
                ) : (
                  <span style={{ color: "#dc2626" }}>✕ Passwords do not match</span>
                )}
              </div>
            )}

            {portal === "Account" ? (
              <p className="portal-login-demo-note">
                Your location helps discover nearby businesses and services. You can deny access and continue.
              </p>
            ) : portal === "Business" ? (
              <p className="portal-login-demo-note">
                Once registered, field verification and Admin approval will publish your profile live in the directory, accessible to nearby customers anywhere.
              </p>
            ) : (
              <p className="portal-login-demo-note">
                OTP verification is required before your Agent partner account is activated.
              </p>
            )}
          </>
        ) : (
          <>
            <label>
              Email or mobile number
              <input name="identity" autoComplete="username" placeholder="you@example.com or 9876543210" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
            </label>
          </>
        )}
        <button className="primary-button full-button" type="submit" disabled={busy}>
          {busy
            ? registering
              ? "Activating account…"
              : "Signing in…"
            : registering
            ? portal === "Business"
              ? "Register business"
              : portal === "Agent"
              ? "Submit agent application"
              : "Create & activate account"
            : "Sign in"}{" "}
          <span>→</span>
        </button>
      </form>
      {(portal === "Account" || portal === "Agent" || portal === "Business") && (
        <button
          className="outline-button full-button"
          type="button"
          onClick={() => {
            setRegistering((value) => !value);
            setMessage("");
            setIsSuccess(false);
            setOtp("");
            setDemoOtp("");
            setOtpVerified(false);
            setRegPassword("");
            setRegConfirmPassword("");
          }}
        >
          {registering
            ? "Back to sign in"
            : portal === "Agent"
            ? "Apply as an agent"
            : portal === "Business"
            ? "Register your business"
            : "Create an account"}
        </button>
      )}
      {message && <p className={isSuccess ? "company-login-success" : "company-login-message"} role={isSuccess ? "status" : "alert"}>{message}</p>}
      {portal === "Account" && !registering && <p className="portal-login-demo-note">After sign in, your browser will ask to use your location for nearby results. Location is optional; declining will not block sign in.</p>}
      <Link className="portal-login-back" href="/">← Back to Discover</Link>
      <nav className="login-portal-options" aria-label="Choose a portal">
        <span>Choose a portal</span>
        <Link href="/login?portal=Account">Customer</Link>
        <Link href="/login?portal=Business">Business</Link>
        <Link href="/login?portal=Agent">Agent</Link>
        <Link href="/company-login">Company</Link>
      </nav>

      <MapPinModal
        isOpen={showBusinessPinModal}
        onClose={() => setShowBusinessPinModal(false)}
        onConfirm={(coords) => {
          setPinnedBusinessCoords(coords);
          setShowBusinessPinModal(false);
        }}
        initialCoordinates={pinnedBusinessCoords}
        title="Pin Business Location on Map"
        businessName={businessNameInput || "Business Registration"}
      />
    </section>
  </main>;
}
