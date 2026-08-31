"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPreQuoteTrainingNeedsAnalysis, createSupabaseInternalTrainingNeedsRepository, getInternalTrainingNeedsAnalysis } from "@/lib/training-needs/internal";
import { trainingNeedsTrainingTypes, type TrainingNeedsTrainingType } from "@/lib/training-needs/types";
import { getTrainingNeedsPartialSaveSchemaV1, validateTrainingNeedsFinalV1 } from "@/lib/training-needs/validation";

export type InternalTrainingNeedsActionState = { error?: string; data?: { answers: Record<string, unknown> } };

export async function createPreQuoteTrainingNeedsAction(formData: FormData) {
  const companyId = formData.get("companyId")?.toString().trim();
  const trainingType = formData.get("trainingType")?.toString().trim();
  if (!companyId || !trainingNeedsTrainingTypes.includes(trainingType as TrainingNeedsTrainingType)) return;
  const analysis = await createPreQuoteTrainingNeedsAnalysis(companyId, trainingType as TrainingNeedsTrainingType);
  revalidatePath(`/companies/${companyId}`);
  redirect(`/training-needs/${analysis.id}`);
}

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
    const now = new Date().toISOString();
    const updated = await repository.updateInternal(analysisId, {
      answers: savedAnswers,
      respondent_name: typeof respondent?.name === "string" ? respondent.name : null,
      respondent_role: typeof respondent?.role === "string" ? respondent.role : null,
      respondent_email: typeof respondent?.email === "string" ? respondent.email : null,
      last_saved_at: now,
      ...(final ? { status: "completed", completed_at: now, current_step: 5, progress_percent: 100 } : { status: analysis.status === "draft" ? "in_progress" : analysis.status })
    });
    if (!updated) return { error: "Analyse introuvable." };
    revalidatePath(`/training-needs/${analysisId}`);
    return { data: { answers: updated.answers } };
  } catch {
    return { error: "Impossible d’enregistrer les modifications." };
  }
}
