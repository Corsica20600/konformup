import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { buildPrivateAppUrl, type PublicUrlEnvironment } from "@/lib/public-config";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** The raw token is available only at generation time. A future resend must issue a new token or support multiple stored hashes. */
export function generateTrainingNeedsToken() { return randomBytes(TOKEN_BYTES).toString("base64url"); }
export function hashTrainingNeedsToken(token: string) { return createHash("sha256").update(token, "utf8").digest("hex"); }
export function isTrainingNeedsTokenFormat(token: string) { return TOKEN_PATTERN.test(token); }
export function matchesTrainingNeedsToken(token: string, storedHash: string) {
  const expected = Buffer.from(storedHash, "utf8");
  const actual = Buffer.from(hashTrainingNeedsToken(token), "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function isTrainingNeedsTokenExpired(expiresAt: Date | string | null | undefined, now = new Date()) {
  if (!expiresAt) return false;
  const date = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return Number.isNaN(date.getTime()) || date.getTime() <= now.getTime();
}
export function buildTrainingNeedsPublicUrl(token: string, environment: PublicUrlEnvironment = process.env) {
  const url = buildPrivateAppUrl(`/analyse-besoins/${encodeURIComponent(token)}`, environment);
  return url.toString();
}
