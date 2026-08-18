import { describe, expect, it } from "vitest";
import { buildTrainingNeedsPublicUrl, generateTrainingNeedsToken, hashTrainingNeedsToken, isTrainingNeedsTokenExpired, isTrainingNeedsTokenFormat, matchesTrainingNeedsToken } from "./token";

describe("training needs tokens", () => {
  it("generates distinct, long URL-safe tokens", () => {
    const first = generateTrainingNeedsToken(); const second = generateTrainingNeedsToken();
    expect(first).not.toBe(second); expect(first).toHaveLength(43); expect(isTrainingNeedsTokenFormat(first)).toBe(true);
  });
  it("hashes deterministically and compares in constant time", () => {
    const token = generateTrainingNeedsToken(); const hash = hashTrainingNeedsToken(token);
    expect(hash).toHaveLength(64); expect(hash).toBe(hashTrainingNeedsToken(token));
    expect(hash).not.toBe(hashTrainingNeedsToken(generateTrainingNeedsToken()));
    expect(matchesTrainingNeedsToken(token, hash)).toBe(true); expect(matchesTrainingNeedsToken("wrong-token", hash)).toBe(false);
  });
  it("recognizes expiration", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    expect(isTrainingNeedsTokenExpired("2026-08-18T11:59:59.000Z", now)).toBe(true);
    expect(isTrainingNeedsTokenExpired("2026-08-18T12:00:01.000Z", now)).toBe(false); expect(isTrainingNeedsTokenExpired(null, now)).toBe(false);
  });
  it("builds the configured private application URL", () => {
    expect(buildTrainingNeedsPublicUrl("safe-token", { APP_URL: "https://app.example.test/path" })).toBe("https://app.example.test/analyse-besoins/safe-token");
  });
});
