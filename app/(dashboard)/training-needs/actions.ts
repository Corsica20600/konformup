"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseInternalTrainingNeedsRepository, getInternalTrainingNeedsAnalysis } from "@/lib/training-needs/internal";
import { getTrainingNeedsPartialSaveSchemaV1, validateTrainingNeedsFinalV1 } from "@/lib/training-needs/validation";

export type InternalTrainingNeedsActionState = { error?: string; data?: { answers: Record<string, unknown> } };

export async function saveInternalTrainingNeedsAction(analysisId: string, answers: unknown, final = false): Promise<InternalTrainingNeedsActionState> {
  try {
    const analysis = await getInternalTrainingNeedsAnalysis(analysisId);
    const partial = getTrainingNeedsPartialSaveSchemaV1(analysis.training_type).safeParse({ answers });
    if (!partial.success) return { error: "Certaines réponses ne sont pas valides." };
    const nextAnswers = partial.data.answers as Record<string, unknown>;
    const checked = final ? validateTrainingNeedsFinalV1(analysis.training_type, nextAnswers) : null;
    if (checked && !checked.success) return { error: "Certaines réponses obligatoires sont incomplètes." };
    const savedAnswers = (checked?.success ? checked.data : nextAnswers) as Record<string, unknown>;
    const respondent = savedAnswers.respondent as Record<string, unknown> | undefined;
    const repository = await createSupabaseInternalTrainingNeedsRepository();
    const updated = await repository.updateInternal(analysisId, {
      answers: savedAnswers,
      respondent_name: typeof respondent?.name === "string" ? respondent.name : null,
      respondent_role: typeof respondent?.role === "string" ? respondent.role : null,
      respondent_email: typeof respondent?.email === "string" ? respondent.email : null,
      last_saved_at: new Date().toISOString()
    });
    if (!updated) return { error: "Analyse introuvable." };
    revalidatePath(`/training-needs/${analysisId}`);
    return { data: { answers: updated.answers } };
  } catch {
    return { error: "Impossible d’enregistrer les modifications." };
  }
}
