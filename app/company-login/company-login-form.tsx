"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const companyDemoCredentials = {
  Admin: { username: "manager@neighborly.demo", password: "Manager123!" },
  "Super Admin": { username: "superadmin@neighborly.demo", password: "SuperAdmin123!" },
} as const;
type CompanyAccessLevel = keyof typeof companyDemoCredentials;

export default function CompanyLoginForm() {
  const [accessLevel, setAccessLevel] = useState<CompanyAccessLevel>("Admin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "Company", accessLevel, identity: form.get("identity"), password: form.get("password") }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      window.location.assign("/?portal=Company");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  const credentials = companyDemoCredentials[accessLevel];

  return <main className="login-page company-login-page">
    <header className="login-page-header">
      <Link className="brand" href="/" aria-label="Bizearch home">
        <img className="brand-mark" src="/bizearch-mark.svg" alt="" />
        <span>bizearch<span className="brand-period">.</span></span>
      </Link>
    </header>
    <section className="portal-login-card">
      <div className="eyebrow"><span /> PRIVATE COMPANY ACCESS</div>
      <h1>Company sign in</h1>
      <p className="portal-login-description">Sign in as an Admin or Super Admin. Admin accounts are created and managed by the platform's initial Super Admin.</p>
      <form className="stacked-form" onSubmit={handleSubmit}>
        <label>Account type<select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as CompanyAccessLevel)}><option>Admin</option><option>Super Admin</option></select></label>
        <label>Work email<input name="identity" type="email" autoComplete="username" placeholder="name@company.com" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label>
        <button className="primary-button full-button" type="submit" disabled={busy}>{busy ? "Signing in" : "Sign in"} <span>&rarr;</span></button>
      </form>
      {message && <p className="company-login-message" role="alert">{message}</p>}
      <div className="demo-credentials"><strong>{accessLevel} demo credentials</strong><span>Login: <code>{credentials.username}</code></span><span>Password: <code>{credentials.password}</code></span></div>
      <p className="portal-login-demo-note">The initial Super Admin is seeded for this demo. Only that account can create or disable Admin accounts. Configure NEIGHBORLY_SUPER_ADMIN_EMAIL and NEIGHBORLY_SUPER_ADMIN_PASSWORD before deployment.</p>
      <Link className="portal-login-back" href="/">&larr; Back to Bizearch</Link>
    </section>
  </main>;
}