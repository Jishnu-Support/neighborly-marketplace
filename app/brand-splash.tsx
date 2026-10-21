"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function BrandSplash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const isLogin = pathname === "/login" || pathname.startsWith("/company-login");

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), isLogin ? 5000 : 3000);
    return () => window.clearTimeout(timer);
  }, [pathname, isLogin]);

  if (!visible) return null;

  return (
    <div className={`brand-splash${isLogin ? " brand-splash-login" : ""}`} role="status" aria-label="Loading Neighborly">
      <div className="brand-splash-lockup">
        <span>Powered by</span>
        <img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech — Innovate, Integrate, Inspire" />
      </div>
    </div>
  );
}
