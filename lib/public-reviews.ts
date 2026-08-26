import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PublicReview = {
  rating: number;
  comment: string;
  identity: string;
  publishedAt: string;
};

type CompanyReference = { company_name: string | null } | { company_name: string | null }[] | null;

function publicIdentity(identity: string | null, company: CompanyReference) {
  const resolvedCompany = Array.isArray(company) ? company[0] : company;
  if (identity === "company_name" && resolvedCompany?.company_name?.trim()) return resolvedCompany.company_name.trim();
  return "Client Konform’up";
}

/** Returns a deliberately minimal projection. Private contact, invoice, session and complaint data never cross this boundary. */
export async function listPublishedPublicReviews(): Promise<PublicReview[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_satisfaction_surveys")
    .select("overall_rating, comment, public_identity, published_at, client_companies(company_name)")
    .eq("status", "completed")
    .eq("publication_consent", true)
    .eq("moderation_status", "approved")
    .not("published_at", "is", null)
    .not("comment", "is", null)
    .not("overall_rating", "is", null)
    .order("published_at", { ascending: false });

  if (error) throw new Error("Impossible de charger les avis publics.");

  return (data ?? []).flatMap((survey) => {
    const rating = survey.overall_rating;
    const comment = survey.comment?.trim();
    const publishedAt = survey.published_at;
    if (!comment || !publishedAt || !Number.isInteger(rating) || rating < 1 || rating > 5) return [];

    return [{
      rating,
      comment,
      identity: publicIdentity(survey.public_identity, survey.client_companies as CompanyReference),
      publishedAt,
    }];
  });
}
