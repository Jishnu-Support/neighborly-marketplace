"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type CompanyAccessLevel = "Admin" | "Super Admin";

export default function CompanyLoginForm() {
  const [accessLevel, setAccessLevel] = useState<CompanyAccessLevel>("Admin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      const data = await response.json().catch(() => ({})) as { error?: string };
      setMessage(data.error || "Could not sign in with these company credentials.");
      setBusy(false);
      return;
    }

    window.location.href = "/";
  }

  return <main className="login-page company-login-page">
    <header className="login-page-header">
      <Link className="brand" href="/" aria-label="Bizearch home">
        <img className="brand-mark" src="/bizearch-mark.svg" alt="" />
        <span>bizearch<span className="brand-period">.</span></span>
      </Link>
      <div className="login-page-powered"><span>Powered by</span><img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" /></div>
    </header>
    <section className="portal-login-card">
      <img className="login-brand-mark login-brand-mark-image" src="/bizearch-mark.svg" alt="" />
      <span className="portal-login-pill">COMPANY PORTAL</span>
      <h1>Company secure sign in</h1>
      <p className="portal-login-description">Select your administrative role and sign in with your enterprise credentials.</p>
      <div className="company-login-role-switch" role="tablist" aria-label="Company account type">
        {(["Admin", "Super Admin"] as const).map((level) => <button key={level} type="button" role="tab" aria-selected={accessLevel === level} className={accessLevel === level ? "active" : ""} onClick={() => { setAccessLevel(level); setMessage(""); }}>{level}</button>)}
      </div>
      <form onSubmit={handleSubmit} className="portal-login-form">
        <label>Work email<input name="identity" type="email" autoComplete="username" placeholder="name@company.com" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label>
        <button className="primary-button full-button" type="submit" disabled={busy}>{busy ? "Signing in" : "Sign in"} <span>&rarr;</span></button>
      </form>
      {message && <p className="company-login-message" role="alert">{message}</p>}
      <p className="portal-login-demo-note">Super Admin accounts manage and provision Admin accounts in the Company terminal.</p>
      <Link className="portal-login-back" href="/">&larr; Back to Bizearch</Link>
    </section>
  </main>;
}
