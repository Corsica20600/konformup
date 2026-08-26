import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { listPublishedPublicReviews } from "@/lib/public-reviews";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.SITE_REVIEWS_API_TOKEN?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const reviews = await listPublishedPublicReviews();
    return NextResponse.json(reviews, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Avis indisponibles" }, { status: 503 });
  }
}
