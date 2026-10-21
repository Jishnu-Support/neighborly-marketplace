"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export type PortalRole = "Account" | "Business" | "Agent";

const portalInfo: Record<PortalRole, { title: string; description: string; label: string; username: string; password: string }> = {
  Account: {
    title: "Sign in to your account",
    description: "Access your saved businesses, recent searches and enquiries.",
    label: "CUSTOMER ACCOUNT",
    username: "customer@neighborly.demo",
    password: "Neighbor123!",
  },
  Business: {
    title: "Business portal sign in",
    description: "Manage your business listing, products, enquiries and plan.",
    label: "BUSINESS PARTNER ACCESS",
    username: "business@neighborly.demo",
    password: "Business123!",
  },
  Agent: {
    title: "Agent portal sign in",
    description: "Access referrals and your neighborhood partner activity.",
    label: "NEIGHBORHOOD AGENT ACCESS",
    username: "agent@neighborly.demo",
    password: "Agent123!",
  },
};

export default function LoginForm({ portal }: { portal: PortalRole }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const info = portalInfo[portal];

  async function handleOtp(action: "send" | "verify", phone: string) {
    setOtpBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/registration/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, role: portal, phone, code: otp }) });
      const result = await response.json() as { error?: string; demoCode?: string };
      if (!response.ok) throw new Error(result.error || "Could not verify this mobile number.");
      if (action === "send") {
        setDemoOtp(result.demoCode || "");
        setOtp("");
        setOtpVerified(false);
        setMessage(result.demoCode ? "Demo OTP generated. Enter the displayed code to verify." : "OTP sent to your mobile number.");
      } else {
        setOtpVerified(true);
        setMessage("Mobile number verified. Complete the registration form to submit your request.");
      }
    } catch (error) { setOtpVerified(false); setMessage(error instanceof Error ? error.message : "Could not verify this mobile number."); }
    finally { setOtpBusy(false); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    if (registering) {
      const name = String(form.get("fullName") || "").trim();
      const phone = String(form.get("phone") || "").trim();
      if (!otpVerified) {
        setMessage("Verify your mobile number before submitting registration.");
        setBusy(false);
        return;
      }
      if (portal === "Agent") {
        try {
          const response = await fetch("/api/registration/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consume", role: "Agent", phone }) });
          const result = await response.json() as { error?: string };
          if (!response.ok) throw new Error(result.error || "Could not submit the agent request.");
          setMessage("Your mobile number is verified. This demo does not store Agent applications or create Agent accounts yet.");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Could not submit the agent request."); }
        finally { setBusy(false); }
        return;
      }
      const recordRequest = async (locationStatus: "shared" | "denied" | "unavailable", latitude: number | null = null, longitude: number | null = null) => {
        try {
          const response = await fetch("/api/customers/registration-location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, locationStatus, latitude, longitude }) });
          const result = await response.json() as { error?: string };
          if (!response.ok) throw new Error(result.error || "Could not record the registration request.");
          setMessage(`Demo registration request recorded. Mobile number verified. Location ${locationStatus === "shared" ? "shared with authorized Company Admins" : "not shared"}. Account activation is not connected in this demo.`);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Could not record the registration request.");
        } finally {
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
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: portal, identity: form.get("identity"), password: form.get("password") }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      if (portal === "Account") {
        try { sessionStorage.removeItem("neighborly_login_location"); } catch { /* Sign-in does not depend on browser storage. */ }
        setMessage("Sign in successful. Your browser will ask whether to share your location for nearby results. You can decline and continue.");
        if (navigator.geolocation) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                try {
                  sessionStorage.setItem("neighborly_login_location", JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
                } catch { /* Continue sign-in if browser storage is unavailable. */ }
                resolve();
              },
              () => resolve(),
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
            );
          });
        }
      }
      window.location.assign(`/?portal=${portal}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return <main className="login-page">
    <header className="login-page-header">
      <Link className="brand" href="/" aria-label="Neighborly home">
        <span className="brand-mark"><span /></span>
        <span>neighborly<span className="brand-period">.</span></span>
      </Link>
      <div className="login-page-powered"><span>Powered by</span><img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech" /></div>
    </header>
    <section className="portal-login-card">
      <div className="login-brand-mark">✳</div>
      <div className="eyebrow"><span /> {info.label}</div>
      <h1>{registering ? "Join your neighborhood" : info.title}</h1>
      <p className="portal-login-description">{registering ? portal === "Agent" ? "Apply to help local businesses reach their neighbors." : "Submit a demo registration request to discover and connect with nearby businesses." : info.description}</p>
      <form className="stacked-form" onSubmit={handleSubmit}>
        {registering ? <><label>Your name<input name="fullName" autoComplete="name" placeholder="e.g. Asha Rao" required /></label><label>Mobile number<input name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" minLength={8} maxLength={20} required onChange={() => { setOtpVerified(false); setDemoOtp(""); }} /></label><div className="otp-row"><label>One-time password (OTP)<input name="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit OTP" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setOtpVerified(false); }} required /></label><div className="otp-actions"><button type="button" disabled={otpBusy || busy} onClick={(event) => { const phone = String(new FormData(event.currentTarget.form || undefined).get("phone") || "").trim(); void handleOtp("send", phone); }}>{otpBusy ? "Please wait…" : "Send OTP"}</button><button type="button" disabled={otpBusy || busy || otp.length !== 6} onClick={(event) => { const phone = String(new FormData(event.currentTarget.form || undefined).get("phone") || "").trim(); void handleOtp("verify", phone); }}>Verify OTP</button></div></div>{demoOtp && <p className="otp-demo-code" role="status">Demo OTP: <strong>{demoOtp}</strong> <span>For local testing only. No SMS was sent.</span></p>}{otpVerified && <p className="otp-verified" role="status">Mobile number verified ✓</p>}{portal === "Account" ? <p className="portal-login-demo-note">On submission, your browser will ask for location access. If granted, precise coordinates are shown only to authorized Company Admins. You can deny access and continue.</p> : <p className="portal-login-demo-note">OTP verification is required before the demo Agent registration request can be submitted.</p>}</> : <><label>Email or mobile number<input name="identity" autoComplete="username" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></label></>}
        <button className="primary-button full-button" type="submit" disabled={busy}>{busy ? (registering ? "Waiting for location permission…" : "Signing in…") : (registering ? "Submit registration request" : "Sign in")} <span>→</span></button>
      </form>
      {(portal === "Account" || portal === "Agent") && <button className="outline-button full-button" type="button" onClick={() => { setRegistering((value) => !value); setMessage(""); setOtp(""); setDemoOtp(""); setOtpVerified(false); }}>{registering ? "Back to sign in" : portal === "Agent" ? "Apply as an agent" : "Create an account"}</button>}
      {message && <p className="company-login-message" role="alert">{message}</p>}
      {!registering && <div className="demo-credentials"><strong>Demo credentials</strong><span>Login: <code>{info.username}</code></span><span>Password: <code>{info.password}</code></span></div>}
      {portal === "Account" && !registering && <p className="portal-login-demo-note">After sign in, your browser will ask to use your location for nearby results. Location is optional; declining will not block sign in.</p>}
      {!registering && <p className="portal-login-demo-note">Demo access only. Credentials are checked on the server and the session is stored in an HTTP-only cookie.</p>}
      <Link className="portal-login-back" href="/">← Back to Discover</Link>
      <div className="company-login-shortcut"><span>Company administrator?</span> <Link href="/company-login">Company login</Link></div>
    </section>
  </main>;
}
