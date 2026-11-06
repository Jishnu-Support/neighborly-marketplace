import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import {
  isSuperAdminIdentity,
  resetCustomerPassword,
  resetAdminPassword,
  readCustomerRecords,
  readAdminRecords,
} from "@/app/lib/auth";
import { resetBusinessPassword, readBusinessRecords } from "@/app/lib/businesses";
import { resetAgentPassword, readAgentRecords } from "@/app/lib/agents";

type ForgotChallenge = {
  code: string;
  expiresAt: number;
  verified: boolean;
};

// In-memory challenge store for demo OTP verification
const challengeMap = new Map<string, ForgotChallenge>();

function makeKey(role: string, identity: string) {
  return `${role.trim().toLowerCase()}:${identity.trim().toLowerCase()}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      role?: string;
      identity?: string;
      otp?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const action = body.action || "reset-password";
    const role = body.role || "Account";
    const identity = String(body.identity || "").trim();

    if (!identity) {
      return NextResponse.json(
        { error: "Please enter your registered mobile number or email address." },
        { status: 400 }
      );
    }

    // Explicit requirement: "except super admin"
    if (isSuperAdminIdentity(identity) || identity.toLowerCase() === "admin@bizearch.in") {
      return NextResponse.json(
        {
          error:
            "Super Admin password recovery is disabled via this form for security. Please manage Super Admin credentials via secure server configuration.",
        },
        { status: 403 }
      );
    }

    const key = makeKey(role, identity);
    const cleanDigits = identity.replace(/\D/g, "");
    const normalized = identity.toLowerCase();

    // Verify account exists
    let accountExists = false;
    if (role === "Account") {
      const customers = await readCustomerRecords();
      accountExists = customers.some((c) => {
        const cPhone = c.phone.replace(/\D/g, "");
        if (cleanDigits.length >= 8 && (cPhone === cleanDigits || cPhone.endsWith(cleanDigits) || cleanDigits.endsWith(cPhone))) return true;
        if (c.email && c.email.toLowerCase() === normalized) return true;
        return c.phone.trim() === identity;
      });
    } else if (role === "Business") {
      const businesses = await readBusinessRecords();
      accountExists = businesses.some((b) => {
        if (b.id === identity) return true;
        if (b.email && b.email.toLowerCase() === normalized) return true;
        const bDigits = b.phone.replace(/\D/g, "");
        if (cleanDigits.length >= 8 && (bDigits === cleanDigits || bDigits.endsWith(cleanDigits) || cleanDigits.endsWith(bDigits))) return true;
        return b.phone.trim().toLowerCase() === normalized;
      });
    } else if (role === "Agent") {
      const agents = await readAgentRecords();
      accountExists = agents.some((a) => {
        if (a.id === identity) return true;
        if (a.email && a.email.toLowerCase() === normalized) return true;
        if (a.referralCode && a.referralCode.toLowerCase() === normalized) return true;
        const aDigits = a.phone.replace(/\D/g, "");
        if (cleanDigits.length >= 8 && (aDigits === cleanDigits || aDigits.endsWith(cleanDigits) || cleanDigits.endsWith(aDigits))) return true;
        return a.phone.trim().toLowerCase() === normalized;
      });
    } else if (role === "Company") {
      const admins = await readAdminRecords();
      accountExists = admins.some(
        (a: { email: string; name: string; id: string }) => a.email.toLowerCase() === normalized || a.name.toLowerCase() === normalized || a.id === identity
      );
    }

    if (!accountExists) {
      return NextResponse.json(
        { error: `No registered ${role === "Account" ? "customer" : role === "Business" ? "business" : role === "Agent" ? "agent" : "admin"} account found matching "${identity}".` },
        { status: 404 }
      );
    }

    if (action === "send-otp") {
      const code = String(randomInt(100000, 1000000));
      challengeMap.set(key, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        verified: false,
      });

      return NextResponse.json({
        success: true,
        demoCode: code,
        message: `Demo OTP ${code} generated. Enter code to verify.`,
      });
    }

    if (action === "verify-otp") {
      const challenge = challengeMap.get(key);
      const code = String(body.otp || "").replace(/\D/g, "");

      if (!challenge || Date.now() > challenge.expiresAt) {
        challengeMap.delete(key);
        return NextResponse.json(
          { error: "OTP expired or not requested. Please click 'Send OTP' first." },
          { status: 400 }
        );
      }

      if (challenge.code !== code) {
        return NextResponse.json(
          { error: "Invalid OTP code. Please enter the 6-digit code shown." },
          { status: 400 }
        );
      }

      challenge.verified = true;
      return NextResponse.json({
        success: true,
        message: "Mobile number verified ✓. Enter your new password below.",
      });
    }

    if (action === "change-password" || action === "reset-password") {
      const challenge = challengeMap.get(key);
      const code = String(body.otp || "").replace(/\D/g, "");

      // Verify OTP was verified or matches code directly
      const isCodeValid = challenge && (challenge.verified || challenge.code === code) && Date.now() <= challenge.expiresAt;
      if (!isCodeValid) {
        return NextResponse.json(
          { error: "Please verify the demo OTP first before changing password." },
          { status: 400 }
        );
      }

      const newPassword = String(body.newPassword || "").trim();
      const confirmPassword = String(body.confirmPassword || "").trim();

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: "New password and Confirm password do not match." },
          { status: 400 }
        );
      }

      let updated = false;
      if (role === "Account") {
        updated = await resetCustomerPassword(identity, newPassword);
      } else if (role === "Business") {
        updated = await resetBusinessPassword(identity, newPassword);
      } else if (role === "Agent") {
        updated = await resetAgentPassword(identity, newPassword);
      } else if (role === "Company") {
        updated = await resetAdminPassword(identity, newPassword);
      }

      if (!updated) {
        return NextResponse.json(
          { error: "Could not update password. Account not found." },
          { status: 400 }
        );
      }

      challengeMap.delete(key);
      return NextResponse.json({
        success: true,
        message: "✓ Password changed successfully! You can now sign in with your new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to process password reset request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
