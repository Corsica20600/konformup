"use server";

import { submitCompanySatisfaction } from "@/lib/company-satisfaction";

export type CompanySatisfactionActionState = { error?: string; success?: string; completed?: boolean };

export async function submitCompanySatisfactionAction(
  _: CompanySatisfactionActionState,
  formData: FormData
): Promise<CompanySatisfactionActionState> {
  const token = formData.get("token")?.toString() ?? "";
  const result = await submitCompanySatisfaction(token, {
    overallRating: Number(formData.get("overallRating")),
    organizationRating: Number(formData.get("organizationRating")),
    needsRating: Number(formData.get("needsRating")),
    comment: formData.get("comment")?.toString() ?? null,
    publicationConsent: formData.getAll("publicationConsent").at(-1)?.toString() === "true",
    publicIdentity: formData.get("publicIdentity")?.toString() as "company_name" | "first_name_initial" | "anonymous" | undefined
  });
  if (result === "submitted") return { success: "Merci, votre avis a bien été transmis.", completed: true };
  if (result === "already_completed") return { success: "Ce questionnaire a déjà été complété. Merci pour votre retour.", completed: true };
  return { error: "Le questionnaire est indisponible ou comporte des réponses invalides." };
}
