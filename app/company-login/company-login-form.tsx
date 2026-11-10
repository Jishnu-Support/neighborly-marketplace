"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type CompanyAccessLevel = "Admin" | "Super Admin";

export default function CompanyLoginForm() {
  const [accessLevel, setAccessLevel] = useState<CompanyAccessLevel>("Admin");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states (Admin only - Super Admin explicitly excluded)
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
      setForgotMessage("Please enter your registered work email or Admin ID first.");
      return;
    }
    setForgotOtpBusy(true);
    setForgotMessage("");
    setForgotIsSuccess(false);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, role: "Company", identity: id, otp: forgotOtp.trim() }),
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
        setForgotMessage(result.message || "Admin identity verified ✓. Enter your new password below.");
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
      setForgotMessage("Please enter your registered work email or Admin ID.");
      return;
    }
    if (!forgotOtpVerified && forgotOtp.trim().length !== 6) {
      setForgotIsSuccess(false);
      setForgotMessage("Please verify the OTP first before changing your password.");
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
          role: "Company",
          identity: id,
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });
      const result = (await response.json()) as { error?: string; message?: string; success?: boolean };
      if (!response.ok) throw new Error(result.error || "Failed to change password.");

      setForgotIsSuccess(true);
      setForgotMessage(result.message || "✓ Password changed successfully! You can now sign in.");
      setTimeout(() => {
        setForgotPassword(false);
        setMessage("✓ Admin password updated successfully! Please sign in with your new password.");
        setIsSuccess(true);
      }, 1600);
    } catch (error) {
      setForgotIsSuccess(false);
      setForgotMessage(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setForgotBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const identity = String(form.get("identity") || "").trim();
    const password = String(form.get("password") || "");

    const normalizedIdentity = identity.toLowerCase();
    const isSuperAdminEmail = normalizedIdentity === "admin@bizearch.in";

    if (accessLevel === "Admin" && isSuperAdminEmail) {
      setMessage("These credentials belong to a Super Admin account. Please switch to the 'Super Admin' tab above to sign in.");
      setIsSuccess(false);
      setBusy(false);
      return;
    }

    if (accessLevel === "Super Admin" && !isSuperAdminEmail) {
      setMessage("These credentials belong to a regular Admin account. Please switch to the 'Admin' tab above to sign in.");
      setIsSuccess(false);
      setBusy(false);
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "Company", accessLevel, identity, password }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error || "Could not sign in with these company credentials.");
      setIsSuccess(false);
      setBusy(false);
      return;
    }

    window.location.assign("/?portal=Company");
  }

  return (
    <main className="login-page company-login-page">
      <header className="login-page-header">
        <Link className="brand" href="/" aria-label="Bizearch home">
          <img className="brand-logo-img" src="/bizearch-logo.png" alt="Bizearch.in - Find • Connect • Grow" />
        </Link>
        <div className="login-page-powered">
          <span>Powered by</span>
          <img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" />
        </div>
      </header>

      <section className="portal-login-card">
        <img className="login-brand-mark login-brand-mark-image" src="/bizearch-logo.png" alt="Bizearch.in" />
        <span className="portal-login-pill">{forgotPassword ? "ADMIN PASSWORD RECOVERY" : "COMPANY PORTAL"}</span>
        <h1>{forgotPassword ? "Reset Admin password" : "Company secure sign in"}</h1>
        <p className="portal-login-description">
          {forgotPassword
            ? "Enter your registered work email or Admin ID, verify via Demo OTP, and create your new password."
            : "Select your administrative role and sign in with your enterprise credentials."}
        </p>

        {!forgotPassword && (
          <div className="company-login-role-switch" role="tablist" aria-label="Company account type">
            {(["Admin", "Super Admin"] as const).map((level) => (
              <button
                key={level}
                type="button"
                role="tab"
                aria-selected={accessLevel === level}
                className={accessLevel === level ? "active" : ""}
                onClick={() => {
                  setAccessLevel(level);
                  setMessage("");
                  setIsSuccess(false);
                  setForgotPassword(false);
                }}
              >
                {level === "Super Admin" ? "👑 Super Admin" : "🛡️ Admin"}
              </button>
            ))}
          </div>
        )}

        {forgotPassword ? (
          <form onSubmit={handleForgotSubmit} className="stacked-form">
            <label>
              <span>Work email or Admin ID *</span>
              <input
                name="identity"
                type="text"
                autoComplete="username"
                placeholder="e.g. admin@company.com or Admin-001"
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
                <span>Demo OTP verification *</span>
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
                ✓ Admin identity verified. Enter your new password below.
              </p>
            )}

            <label>
              <span>New password *</span>
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
              <span>Confirm new password *</span>
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
              {forgotBusy ? "Changing password…" : "Change password"} <span>&rarr;</span>
            </button>

            {forgotMessage && (
              <p className={forgotIsSuccess ? "company-login-success" : "company-login-message"} role={forgotIsSuccess ? "status" : "alert"}>
                {forgotMessage}
              </p>
            )}

            <button
              type="button"
              className="outline-button full-button"
              onClick={() => {
                setForgotPassword(false);
                setForgotMessage("");
              }}
            >
              &larr; Back to Admin sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="stacked-form">
            <label>
              <span>Work email</span>
              <input
                name="identity"
                type="email"
                autoComplete="username"
                placeholder={accessLevel === "Super Admin" ? "admin@bizearch.in" : "name@company.com"}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
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

            {accessLevel === "Admin" ? (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(true);
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
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
                <span style={{ fontSize: "10px", color: "#8a968d", fontStyle: "italic" }}>
                  🔒 Super Admin recovery managed via server configuration only
                </span>
              </div>
            )}

            <button className="primary-button full-button" type="submit" disabled={busy}>
              {busy ? "Signing in…" : `Sign in as ${accessLevel}`} <span>&rarr;</span>
            </button>
          </form>
        )}

        {message && (
          <div
            className={isSuccess ? "company-login-success" : "company-login-message"}
            role={isSuccess ? "status" : "alert"}
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <span>{message}</span>
            {message.includes("Super Admin") && accessLevel !== "Super Admin" && (
              <button
                type="button"
                onClick={() => {
                  setAccessLevel("Super Admin");
                  setMessage("");
                }}
                style={{
                  alignSelf: "flex-start",
                  background: "#b45309",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Switch to Super Admin 👑
              </button>
            )}
            {message.includes("regular Admin") && accessLevel !== "Admin" && (
              <button
                type="button"
                onClick={() => {
                  setAccessLevel("Admin");
                  setMessage("");
                }}
                style={{
                  alignSelf: "flex-start",
                  background: "#15803d",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Switch to Admin 🛡️
              </button>
            )}
          </div>
        )}

        <p className="portal-login-demo-note">
          Super Admin accounts manage categories, advertisement placements, and provision Admin accounts in the Company terminal.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "8px" }}>
          <Link className="portal-login-back" href="/">
            &larr; Back to Bizearch
          </Link>
          <Link className="portal-login-back" href="/login" style={{ color: "#546e5b", fontWeight: 500 }}>
            Customer & Business Login &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}
