"use server";

import { revalidatePath } from "next/cache";

import { AuthorizationError, requireAuthenticatedUser } from "@/lib/auth";

export async function moderateCompanySatisfaction(formData: FormData) {
  const surveyId = formData.get("surveyId")?.toString();
  const companyId = formData.get("companyId")?.toString();
  const decision = formData.get("decision")?.toString();
  if (!surveyId || !companyId || (decision !== "approved" && decision !== "rejected")) throw new Error("Demande de modération invalide.");

  const { profile, supabase } = await requireAuthenticatedUser();
  if (profile.role !== "admin") throw new AuthorizationError("La modération des avis est réservée à l’administrateur.");

  const { data: survey, error: surveyError } = await supabase
    .from("company_satisfaction_surveys")
    .select("id, company_id, status, publication_consent")
    .eq("id", surveyId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (surveyError || !survey || survey.status !== "completed" || !survey.publication_consent) {
    throw new Error("Cet avis ne peut pas être modéré.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("company_satisfaction_surveys")
    .update({
      moderation_status: decision,
      moderated_at: now,
      moderated_by: profile.id,
      published_at: decision === "approved" ? now : null,
    })
    .eq("id", surveyId)
    .eq("company_id", companyId);

  if (error) throw new Error("Impossible de mettre à jour la modération.");
  revalidatePath(`/companies/${companyId}`);
}
