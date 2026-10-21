import { createHash, randomInt, timingSafeEqual } from "node:crypto";

type Challenge = { digest: Buffer; expiresAt: number; verifiedUntil: number; attempts: number; sentAt: number };
const challenges = new Map<string, Challenge>();
const sendHistory = new Map<string, number[]>();
const CODE_TTL_MS = 5 * 60_000;
const VERIFIED_TTL_MS = 10 * 60_000;
const MIN_SEND_INTERVAL_MS = 30_000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function normalizedPhone(phone: string) { return phone.replace(/\D/g, ""); }
function challengeKey(role: "Account" | "Business" | "Agent", phone: string) { return `${role}:${normalizedPhone(phone)}`; }
function digest(key: string, code: string) { return createHash("sha256").update(`${key}:${code}:${process.env.NEIGHBORLY_AUTH_SECRET || "neighborly-local-otp-demo"}`).digest(); }

export function issueRegistrationOtp(role: "Account" | "Business" | "Agent", phone: string) {
  const normalized = normalizedPhone(phone);
  const key = challengeKey(role, normalized);
  const now = Date.now();
  const recentSends = (sendHistory.get(key) || []).filter((timestamp) => now - timestamp < 60 * 60_000);
  if (recentSends.length >= MAX_SENDS_PER_HOUR) throw new Error("Too many OTP requests. Try again in an hour.");
  if (recentSends.length && now - recentSends[recentSends.length - 1] < MIN_SEND_INTERVAL_MS) throw new Error("Please wait 30 seconds before requesting another OTP.");
  const code = String(randomInt(100000, 1000000));
  challenges.set(key, { digest: digest(key, code), expiresAt: now + CODE_TTL_MS, verifiedUntil: 0, attempts: 0, sentAt: now });
  sendHistory.set(key, [...recentSends, now]);
  return code;
}

export function verifyRegistrationOtp(role: "Account" | "Business" | "Agent", phone: string, code: string) {
  const key = challengeKey(role, phone);
  const challenge = challenges.get(key);
  if (!challenge || Date.now() > challenge.expiresAt || challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
    challenges.delete(key);
    return false;
  }
  const candidate = digest(key, code);
  if (candidate.length !== challenge.digest.length || !timingSafeEqual(candidate, challenge.digest)) {
    challenge.attempts += 1;
    if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) challenges.delete(key);
    return false;
  }
  challenge.verifiedUntil = Date.now() + VERIFIED_TTL_MS;
  return true;
}

export function consumeVerifiedRegistrationOtp(role: "Account" | "Business" | "Agent", phone: string) {
  const key = challengeKey(role, phone);
  const challenge = challenges.get(key);
  if (!challenge || !challenge.verifiedUntil || Date.now() > challenge.verifiedUntil) return false;
  challenges.delete(key);
  return true;
}

export function validRegistrationRole(value: unknown): value is "Account" | "Business" | "Agent" {
  return value === "Account" || value === "Business" || value === "Agent";
}
