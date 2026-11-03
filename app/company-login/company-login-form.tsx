"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type CompanyAccessLevel = "Admin" | "Super Admin";

export default function CompanyLoginForm() {
  const [accessLevel, setAccessLevel] = useState<CompanyAccessLevel>("Admin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const identity = String(form.get("identity") || "");
    const password = String(form.get("password") || "");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "Company", accessLevel, identity, password }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(data.error || "Could not sign in with these company credentials.");
      setBusy(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="login-page company-login-page">
      <header className="login-page-header">
        <Link className="brand" href="/" aria-label="Bizearch home">
          <img className="brand-mark" src="/bizearch-mark.svg" alt="" />
          <span>
            bizearch<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="login-page-powered">
          <span>Powered by</span>
          <img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" />
        </div>
      </header>

      <section className="portal-login-card">
        <img className="login-brand-mark login-brand-mark-image" src="/bizearch-mark.svg" alt="" />
        <span className="portal-login-pill">COMPANY PORTAL</span>
        <h1>Company secure sign in</h1>
        <p className="portal-login-description">
          Select your administrative role and sign in with your enterprise credentials.
        </p>

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
              }}
            >
              {level === "Super Admin" ? "👑 Super Admin" : "🛡️ Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="stacked-form">
          <label>
            <span>Work email</span>
            <input
              name="identity"
              type="email"
              autoComplete="username"
              placeholder={accessLevel === "Super Admin" ? "superadmin@neighborly.demo or admin@bizearch.in" : "name@company.com"}
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

          <button className="primary-button full-button" type="submit" disabled={busy}>
            {busy ? "Signing in…" : `Sign in as ${accessLevel}`} <span>&rarr;</span>
          </button>
        </form>

        {message && <p className="company-login-message" role="alert">{message}</p>}

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
