import type { TrainingType } from "@/lib/database.types";

export const PRE_TRAINING_DOCUMENT_TYPES = ["convocation", "welcome_pack", "aide_memoire"] as const;

export type PreTrainingDocumentType = (typeof PRE_TRAINING_DOCUMENT_TYPES)[number];

export function getRequiredPreTrainingDocumentTypes(trainingType: TrainingType): PreTrainingDocumentType[] {
  return trainingType === "hygiene"
    ? ["convocation", "welcome_pack"]
    : ["convocation", "welcome_pack", "aide_memoire"];
}

export function isPreTrainingDocumentType(type: string): type is PreTrainingDocumentType {
  return PRE_TRAINING_DOCUMENT_TYPES.includes(type as PreTrainingDocumentType);
}

export function deduplicateDocumentsByType<T extends { document_type: string; created_at: string }>(documents: T[]) {
  const latestByType = new Map<string, T>();

  for (const document of documents) {
    const current = latestByType.get(document.document_type);
    if (!current || document.created_at > current.created_at) {
      latestByType.set(document.document_type, document);
    }
  }

  return Array.from(latestByType.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function deduplicateCandidateDocuments<
  T extends { id: string; session_id: string | null; candidate_id: string | null; document_type: string; created_at: string }
>(documents: T[]) {
  const latestByKey = new Map<string, T>();

  for (const document of documents) {
    const key = document.candidate_id
      ? `${document.session_id ?? "no-session"}:${document.candidate_id}:${document.document_type}`
      : document.id;
    const current = latestByKey.get(key);

    if (!current || document.created_at > current.created_at) {
      latestByKey.set(key, document);
    }
  }

  return Array.from(latestByKey.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
