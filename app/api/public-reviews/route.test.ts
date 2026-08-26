import { afterEach, describe, expect, it, vi } from "vitest";

import { listPublishedPublicReviews } from "@/lib/public-reviews";
import { GET } from "./route";

vi.mock("@/lib/public-reviews", () => ({ listPublishedPublicReviews: vi.fn() }));

describe("public reviews route", () => {
  const originalToken = process.env.SITE_REVIEWS_API_TOKEN;

  afterEach(() => {
    process.env.SITE_REVIEWS_API_TOKEN = originalToken;
    vi.mocked(listPublishedPublicReviews).mockReset();
  });

  it("refuses a request without the connector token", async () => {
    process.env.SITE_REVIEWS_API_TOKEN = "review-connector-secret";
    const response = await GET(new Request("https://app.konformup.com/api/public-reviews"));

    expect(response.status).toBe(401);
    expect(listPublishedPublicReviews).not.toHaveBeenCalled();
  });

  it("returns only the already filtered public projection", async () => {
    process.env.SITE_REVIEWS_API_TOKEN = "review-connector-secret";
    vi.mocked(listPublishedPublicReviews).mockResolvedValue([{ rating: 5, comment: "Formation très concrète.", identity: "Client Konform’up", publishedAt: "2026-08-26T10:00:00.000Z" }]);
    const response = await GET(new Request("https://app.konformup.com/api/public-reviews", { headers: { authorization: "Bearer review-connector-secret" } }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ rating: 5, comment: "Formation très concrète.", identity: "Client Konform’up", publishedAt: "2026-08-26T10:00:00.000Z" }]);
  });
});
