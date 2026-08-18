"use server";

import { finalizePublicTrainingNeedsAnalysis, loadPublicTrainingNeedsAnalysis, savePublicTrainingNeedsStep } from "@/lib/training-needs/public";

export type TrainingNeedsPublicActionState<T> = { data?: T; error?: string };
function isSmallPayload(value: unknown) { try { return JSON.stringify(value).length <= 32_000; } catch { return false; } }
export async function loadTrainingNeedsPublicAction(token: string): Promise<TrainingNeedsPublicActionState<Awaited<ReturnType<typeof loadPublicTrainingNeedsAnalysis>>>> { try { return { data: await loadPublicTrainingNeedsAnalysis(token) }; } catch { return { error: "Ce lien n'est plus accessible." }; } }
export async function saveTrainingNeedsPublicAction(token: string, step: number, data: unknown) {
  if (!isSmallPayload(data)) return { error: "Données invalides." };
  try { return { data: await savePublicTrainingNeedsStep({ token, step, data }) }; } catch { return { error: "Impossible d'enregistrer cette étape." }; }
}
export async function finalizeTrainingNeedsPublicAction(token: string, data: unknown) {
  if (!isSmallPayload(data)) return { error: "Données invalides." };
  try { return { data: await finalizePublicTrainingNeedsAnalysis({ token, data }) }; } catch { return { error: "Impossible de finaliser le questionnaire." }; }
}
