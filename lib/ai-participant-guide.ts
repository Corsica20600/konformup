import "server-only";

import { getOrCreateDocument, type GeneratedDocumentRow } from "@/lib/generated-documents";
import { createClient } from "@/lib/supabase/server";
import { getParticipantGuidePolicy } from "@/lib/training-programs";
import type { TrainingType } from "@/lib/database.types";

export async function ensureAIParticipantGuideDocument(sessionId: string, candidateId: string): Promise<GeneratedDocumentRow> {
  const supabase = await createClient();
  const { data: session, error } = await supabase.from("training_sessions").select("training_type").eq("id", sessionId).maybeSingle<{ training_type: TrainingType }>();
  if (error || !session) throw new Error("Session introuvable pour le livret participant.");
  const policy = getParticipantGuidePolicy(session.training_type);
  if (!policy.enabled || !policy.documentType || !policy.availableAfterTraining) {
    throw new Error("Aucun livret participant n’est configuré pour cette formation.");
  }
  return getOrCreateDocument({ sessionId, candidateId, type: policy.documentType });
}
