"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function BrandSplash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const isLogin = pathname === "/login" || pathname.startsWith("/company-login");

  useEffect(() => {
    if (isLogin || pathname !== "/") {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, [pathname, isLogin]);

  if (!visible || isLogin) return null;

  return (
    <div className="brand-splash" role="status" aria-label="Loading Bizearch">
      <div className="brand-splash-lockup">
        <div className="brand-splash-bizearch">
          <img src="/bizearch-mark.svg" alt="" />
          <span>bizearch<span className="brand-period">.</span></span>
        </div>
        <span>Powered by</span>
        <img src="/jishnu-infotech-logo.png" alt="Jishnu Infotech — Innovate, Integrate, Inspire" />
      </div>
    </div>
  );
}
