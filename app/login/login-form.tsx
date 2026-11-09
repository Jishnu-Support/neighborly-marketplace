"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { MapPinModal, type Coordinates } from "../map-pin-modal";
import { TermsModal } from "../terms-modal";

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<"terms" | "privacy">("terms");

  // Controlled form inputs to prevent input leakage between Login and Registration
  const [loginIdentity, setLoginIdentity] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regLocality, setRegLocality] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regDoorNo, setRegDoorNo] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regEmergencyName, setRegEmergencyName] = useState("");
  const [regEmergencyPhone, setRegEmergencyPhone] = useState("");
  const [regEmergencyRelation, setRegEmergencyRelation] = useState("Family");

  const resetRegistrationFields = () => {
    setRegFullName("");
    setRegPhone("");
    setRegEmail("");
    setRegLocality("");
    setRegCity("");
    setRegDoorNo("");
    setRegStreet("");
    setRegEmergencyName("");
    setRegEmergencyPhone("");
    setRegEmergencyRelation("Family");
    setOtp("");
    setDemoOtp("");
    setOtpVerified(false);
    setTermsAccepted(false);
    setRegPassword("");
    setRegConfirmPassword("");
    setPinnedBusinessCoords(null);
  };
  const info = portalInfo[portal];

  // Forgot password flow states
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotIdentity, setForgotIdentity] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotDemoOtp, setForgotDemoOtp] = useState("");
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [forgotOtpBusy, setForgotOtpBusy] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotIsSuccess, setForgotIsSuccess] = useState(false);

  async function handleForgotOtp(action: "send-otp" | "verify-otp") {
    const id = forgotIdentity.trim();
    if (!id) {
      setForgotIsSuccess(false);
      setForgotMessage("Please enter your registered mobile number or email first.");
      return;
    }
    setForgotOtpBusy(true);
    setForgotMessage("");
    setForgotIsSuccess(false);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, role: portal, identity: id, otp: forgotOtp.trim() }),
      });
      const result = (await response.json()) as { error?: string; message?: string; demoCode?: string };
      if (!response.ok) throw new Error(result.error || "Failed to process OTP verification.");
      if (action === "send-otp") {
        setForgotDemoOtp(result.demoCode || "");
        if (result.demoCode) {
          setForgotOtp(result.demoCode);
        }
        setForgotOtpVerified(false);
        setForgotIsSuccess(true);
        setForgotMessage(result.message || `Demo OTP ${result.demoCode} generated. Click 'Verify OTP' to proceed.`);
      } else {
        setForgotOtpVerified(true);
        setForgotIsSuccess(true);
        setForgotMessage(result.message || "Mobile number verified ✓. Enter your new password below.");
      }
    } catch (error) {
      setForgotOtpVerified(false);
      setForgotIsSuccess(false);
      setForgotMessage(error instanceof Error ? error.message : "OTP request failed.");
    } finally {
      setForgotOtpBusy(false);
    }
  }

  async function handleForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = forgotIdentity.trim();
    if (!id) {
      setForgotIsSuccess(false);
      setForgotMessage("Please enter your registered mobile number or email.");
      return;
    }
    if (!forgotOtpVerified && forgotOtp.trim().length !== 6) {
      setForgotIsSuccess(false);
      setForgotMessage("Please click 'Verify OTP' first before changing your password.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotIsSuccess(false);
      setForgotMessage("New password must be at least 6 characters long.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotIsSuccess(false);
      setForgotMessage("New password and Confirm password do not match.");
      return;
    }

    setForgotBusy(true);
    setForgotMessage("");
    setForgotIsSuccess(false);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          role: portal,
          identity: id,
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });
      const result = (await response.json()) as { error?: string; message?: string; success?: boolean };
      if (!response.ok) throw new Error(result.error || "Failed to change password.");

      setForgotIsSuccess(true);
      setForgotMessage(result.message || "✓ Password changed successfully! You can now sign in with your new password.");
      setTimeout(() => {
        setForgotPassword(false);
        setMessage("✓ Password updated successfully! Please sign in with your new password.");
        setIsSuccess(true);
      }, 1600);
    } catch (error) {
      setForgotIsSuccess(false);
      setForgotMessage(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setForgotBusy(false);
    }
  }

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
      const locality = String(form.get("locality") || "").trim();
      const city = String(form.get("city") || "").trim();
      const doorNo = String(form.get("doorNo") || "").trim();
      const street = String(form.get("street") || "").trim();
      const emergencyContactName = String(form.get("emergencyContactName") || "").trim();
      const emergencyContactPhone = String(form.get("emergencyContactPhone") || "").trim();
      const emergencyContactRelation = String(form.get("emergencyContactRelation") || "Family").trim();
      const fullAddress = [doorNo, street, locality, city].filter(Boolean).join(", ");
      const password = String(form.get("password") || "").trim();
      const confirmPassword = String(form.get("confirmPassword") || "").trim();
      if (!otpVerified) {
        setIsSuccess(false);
        setMessage("Verify your mobile number before submitting registration.");
        setBusy(false);
        return;
      }
      if (!termsAccepted) {
        setIsSuccess(false);
        setMessage("Please read and accept the Terms and Conditions and Privacy Policy to complete registration.");
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

        // Mandatory Business GPS Coordinates
        if (
          !pinnedBusinessCoords ||
          typeof pinnedBusinessCoords.latitude !== "number" ||
          typeof pinnedBusinessCoords.longitude !== "number" ||
          !Number.isFinite(pinnedBusinessCoords.latitude) ||
          !Number.isFinite(pinnedBusinessCoords.longitude)
        ) {
          setIsSuccess(false);
          setMessage("Business location GPS coordinates are mandatory. Please click 'Pin location on map' to pin your storefront on the map.");
          setShowBusinessPinModal(true);
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
              agentCode: referralCode?.trim() || undefined,
              referralCode: referralCode?.trim() || undefined,
              password,
              coordinates: pinnedBusinessCoords,
            }),
          });
          const result = (await response.json()) as { error?: string; business?: any; message?: string };
          if (!response.ok) throw new Error(result.error || "Could not complete business registration.");
          setIsSuccess(true);
          setMessage(result.message || `✓ Business "${name}" registered successfully! Loading your business portal...`);
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
              city: city || "India",
              district: city || "",
              state: "",
              pincode: "",
              address: fullAddress,
              bio: "Verified community member.",
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
        <img className="brand-logo-img" src="/bizearch-logo.png" alt="Bizearch.in - Find • Connect • Grow" />
      </Link>
      <div className="login-page-powered"><span>Powered by</span><img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" /></div>
    </header>
    <section className="portal-login-card">
      <img className="login-brand-mark login-brand-mark-image" src="/bizearch-logo.png" alt="Bizearch.in" />
      <div className="eyebrow"><span /> {forgotPassword ? "FORGOT PASSWORD" : info.label}</div>
      <h1>
        {forgotPassword
          ? "Reset your password"
          : registering
          ? portal === "Business"
            ? "Register your business"
            : portal === "Agent"
            ? "Join as an Agent partner"
            : "Join your neighborhood"
          : info.title}
      </h1>
      <p className="portal-login-description">
        {forgotPassword
          ? "Enter your registered mobile number or email address, verify via Demo OTP, and set a new password."
          : registering
          ? portal === "Agent"
            ? "Apply to help local businesses reach their customers in your region."
            : portal === "Business"
            ? "Register your business to showcase products, receive customer orders, and reach customers anywhere."
            : "Create and activate your account to discover and connect with nearby businesses."
          : info.description}
      </p>

      {forgotPassword ? (
        <form className="stacked-form" onSubmit={handleForgotSubmit}>
          <label>
            Registered mobile number or email *
            <input
              type="text"
              autoComplete="username"
              placeholder={portal === "Business" ? "e.g. 9876543210 or business@example.com" : portal === "Agent" ? "e.g. 9876543210 or agent@example.com" : "e.g. 9876543210 or you@example.com"}
              value={forgotIdentity}
              onChange={(e) => {
                setForgotIdentity(e.target.value);
                setForgotOtpVerified(false);
              }}
              required
            />
          </label>

          <div className="otp-row">
            <label>
              Demo OTP verification *
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit OTP"
                maxLength={6}
                value={forgotOtp}
                onChange={(e) => {
                  setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setForgotOtpVerified(false);
                }}
                required
              />
            </label>
            <div className="otp-actions">
              <button
                type="button"
                disabled={forgotOtpBusy || !forgotIdentity.trim()}
                onClick={() => handleForgotOtp("send-otp")}
              >
                {forgotOtpBusy ? "Please wait…" : "Send OTP"}
              </button>
              <button
                type="button"
                disabled={forgotOtpBusy || forgotOtp.trim().length !== 6}
                onClick={() => handleForgotOtp("verify-otp")}
              >
                Verify OTP
              </button>
            </div>
          </div>

          {forgotDemoOtp && (
            <p className="otp-demo-code" role="status">
              Demo OTP: <strong>{forgotDemoOtp}</strong> <span>For testing only. Code generated for quick verification.</span>
            </p>
          )}

          {forgotOtpVerified && (
            <p className="otp-verified" role="status">
              ✓ Identity verified. Enter your new password below.
            </p>
          )}

          <label>
            New password *
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showForgotPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter new password (min. 6 characters)"
                minLength={6}
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                required
                style={{ width: "100%", paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowForgotPw((prev) => !prev)}
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
                title={showForgotPw ? "Hide password" : "Show password"}
                aria-label={showForgotPw ? "Hide password" : "Show password"}
              >
                {showForgotPw ? "👁️" : "🙈"}
              </button>
            </div>
          </label>

          <label>
            Confirm new password *
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type={showForgotPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your new password"
                minLength={6}
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                required
                style={{ width: "100%", paddingRight: "44px" }}
              />
            </div>
          </label>

          {forgotConfirmPassword && (
            <div style={{ marginTop: "-6px", marginBottom: "4px", fontSize: "11px", fontWeight: 600 }}>
              {forgotNewPassword === forgotConfirmPassword ? (
                <span style={{ color: "#166534" }}>✓ Passwords match</span>
              ) : (
                <span style={{ color: "#dc2626" }}>✕ Passwords do not match</span>
              )}
            </div>
          )}

          <button
            className="primary-button full-button"
            type="submit"
            disabled={forgotBusy || !forgotOtpVerified || forgotNewPassword.length < 6 || forgotNewPassword !== forgotConfirmPassword}
          >
            {forgotBusy ? "Changing password…" : "Change password"} <span>→</span>
          </button>
        </form>
      ) : (
      <form key={registering ? `register-form-${portal}` : `signin-form-${portal}`} className="stacked-form" onSubmit={handleSubmit}>
        {registering ? (
          <>
            <label>
              {portal === "Business" ? "Business Name *" : "Your full name *"}
              <input
                key="reg-fullName"
                name="fullName"
                autoComplete="name"
                placeholder={portal === "Business" ? "e.g. Sri Lakshmi Automotives" : "e.g. Asha Rao"}
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
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
                value={regPhone}
                onChange={(e) => {
                  setRegPhone(e.target.value);
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
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. contact@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
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
                Agent Referral Code <span className="optional">(optional — leave blank to let company assign an agent)</span>
                <input
                  name="referralCode"
                  placeholder="e.g. JIT (optional — leave blank for company selection)"
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
                    <input name="city" placeholder="e.g. Bengaluru, Mumbai, Hosur, Delhi" required style={{ background: "#fff" }} />
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

                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px 12px",
                    background: pinnedBusinessCoords ? "#f0fdf4" : "#fef2f2",
                    border: `1.5px solid ${pinnedBusinessCoords ? "#86efac" : "#fca5a5"}`,
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: pinnedBusinessCoords ? "#166534" : "#991b1b", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>📍 Storefront GPS Coordinates *</span>
                        <span style={{ fontSize: "9px", background: pinnedBusinessCoords ? "#dcfce7" : "#fee2e2", color: pinnedBusinessCoords ? "#166534" : "#991b1b", padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>
                          {pinnedBusinessCoords ? "MANDATORY PINNED" : "MANDATORY REQUIRED"}
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", color: pinnedBusinessCoords ? "#15803d" : "#b91c1c", marginTop: "3px" }}>
                        {pinnedBusinessCoords
                          ? `✓ Pinned: ${pinnedBusinessCoords.latitude.toFixed(6)}, ${pinnedBusinessCoords.longitude.toFixed(6)}`
                          : "⚠️ Store location must be pinned so customers can navigate accurately to your shop"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBusinessPinModal(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: pinnedBusinessCoords ? "#15803d" : "#dc2626",
                        color: "#ffffff",
                        padding: "7px 14px",
                        borderRadius: "7px",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: "none",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                      }}
                    >
                      <span>{pinnedBusinessCoords ? "📍 Adjust location pin" : "📍 Pin location on map *"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {portal === "Account" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label>
                    Locality / Area *
                    <input
                      name="locality"
                      placeholder="e.g. Indiranagar, Bagalur Road, Bandra"
                      value={regLocality}
                      onChange={(e) => setRegLocality(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    City / Town *
                    <input
                      name="city"
                      placeholder="e.g. Bengaluru, Hosur, Mumbai, Delhi"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label>
                    Door / Shop / Flat No. <span className="optional">(optional)</span>
                    <input
                      name="doorNo"
                      placeholder="e.g. Shop 4B / Flat 102"
                      value={regDoorNo}
                      onChange={(e) => setRegDoorNo(e.target.value)}
                    />
                  </label>
                  <label>
                    Street / Landmark <span className="optional">(optional)</span>
                    <input
                      name="street"
                      placeholder="e.g. Near Bus Stand"
                      value={regStreet}
                      onChange={(e) => setRegStreet(e.target.value)}
                    />
                  </label>
                </div>

                <div style={{ background: "#f8faf8", border: "1px solid #dbe6dc", borderRadius: "8px", padding: "12px", display: "grid", gap: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#285536" }}>🛡️ Emergency SOS Contact (Bizearch Safety Network)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <label style={{ fontSize: "10px", color: "#365c41" }}>
                      Emergency Contact Name <span className="optional">(optional)</span>
                      <input
                        name="emergencyContactName"
                        placeholder="e.g. Spouse / Parent"
                        value={regEmergencyName}
                        onChange={(e) => setRegEmergencyName(e.target.value)}
                        style={{ background: "#fff" }}
                      />
                    </label>
                    <label style={{ fontSize: "10px", color: "#365c41" }}>
                      Emergency Mobile Number <span className="optional">(optional)</span>
                      <input
                        name="emergencyContactPhone"
                        type="tel"
                        placeholder="e.g. 98432 12345"
                        value={regEmergencyPhone}
                        onChange={(e) => setRegEmergencyPhone(e.target.value)}
                        style={{ background: "#fff" }}
                      />
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

            <label
              className="consent-check terms-consent"
              style={{
                marginTop: "12px",
                marginBottom: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "9px",
                cursor: "pointer",
                background: "#f7faf7",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #dbe6dc",
              }}
            >
              <input
                type="checkbox"
                name="acceptTerms"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: "2px", width: "16px", height: "16px", flexShrink: 0, cursor: "pointer" }}
              />
              <span style={{ fontSize: "11.5px", lineHeight: "1.5", color: "#314535" }}>
                Please read and accept the{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTermsModalTab("terms");
                    setTermsModalOpen(true);
                  }}
                  style={{
                    background: "none",
                    border: 0,
                    padding: 0,
                    color: "#285536",
                    fontWeight: 800,
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "inherit",
                  }}
                >
                  Terms and Conditions
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTermsModalTab("privacy");
                    setTermsModalOpen(true);
                  }}
                  style={{
                    background: "none",
                    border: 0,
                    padding: 0,
                    color: "#285536",
                    fontWeight: 800,
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "inherit",
                  }}
                >
                  Privacy Policy
                </button>{" "}
                *
              </span>
            </label>
          </>
        ) : (
          <>
            <label>
              Email or mobile number
              <input
                key="login-identity"
                name="identity"
                autoComplete="username"
                placeholder="you@example.com or 9876543210"
                value={loginIdentity}
                onChange={(e) => setLoginIdentity(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                key="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(true);
                  setRegistering(false);
                  setForgotMessage("");
                  setForgotIsSuccess(false);
                  setForgotOtp("");
                  setForgotDemoOtp("");
                  setForgotOtpVerified(false);
                  setForgotNewPassword("");
                  setForgotConfirmPassword("");
                }}
                style={{
                  background: "none",
                  border: 0,
                  padding: "8px 4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#275937",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Forgot password?
              </button>
            </div>
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
      )}

      {forgotPassword ? (
        <>
          {forgotMessage && (
            <p className={forgotIsSuccess ? "company-login-success" : "company-login-message"} role={forgotIsSuccess ? "status" : "alert"}>
              {forgotMessage}
            </p>
          )}
          <button
            className="outline-button full-button"
            type="button"
            onClick={() => {
              setForgotPassword(false);
              setForgotMessage("");
              setIsSuccess(false);
            }}
          >
            ← Back to sign in
          </button>
        </>
      ) : (
        <>
          {(portal === "Account" || portal === "Agent" || portal === "Business") && (
            <button
              className="outline-button full-button"
              type="button"
              onClick={() => {
                resetRegistrationFields();
                setRegistering((value) => !value);
                setMessage("");
                setIsSuccess(false);
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
        </>
      )}
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

      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
        role={portal}
        initialTab={termsModalTab}
      />
    </section>
  </main>;
}
