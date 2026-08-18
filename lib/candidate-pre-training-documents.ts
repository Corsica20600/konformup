import {
  generateUniqueDocumentRef,
  getOrCreateDocument,
  insertGeneratedDocumentRecord,
  type GeneratedDocumentRow
} from "@/lib/generated-documents";
import { getRequiredPreTrainingDocumentTypes } from "@/lib/pre-training-documents";
import { createClient } from "@/lib/supabase/server";
import type { TrainingType } from "@/lib/database.types";

const SST_AIDE_MEMOIRE_URL = "/aide-memoire-sauveteur-secouriste-du-travail.pdf";

export async function ensureCandidateAideMemoireDocument(sessionId: string, candidateId: string) {
  const supabase = await createClient();
  const { data: existingDocument, error } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("session_id", sessionId)
    .eq("candidate_id", candidateId)
    .eq("document_type", "aide_memoire")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<GeneratedDocumentRow>();

  if (error) {
    throw new Error("Impossible de vérifier l'aide-mémoire du candidat.");
  }

  if (existingDocument) {
    return existingDocument;
  }

  const documentRef = await generateUniqueDocumentRef("attestation");
  return insertGeneratedDocumentRecord({
    sessionId,
    candidateId,
    documentType: "aide_memoire",
    documentRef: `AIDE-${documentRef}`,
    status: "generated",
    fileUrl: SST_AIDE_MEMOIRE_URL,
    metadata: {
      title: "Aide memoire sauveteur secouriste du travail",
      static_asset: true
    }
  });
}

export async function ensureCandidatePreTrainingDocuments(params: {
  sessionId: string;
  candidateId: string;
  trainingType: TrainingType;
}) {
  const requiredTypes = getRequiredPreTrainingDocumentTypes(params.trainingType);

  return Promise.all(
    requiredTypes.map((type) => {
      if (type === "aide_memoire") {
        return ensureCandidateAideMemoireDocument(params.sessionId, params.candidateId);
      }

      return getOrCreateDocument({
        sessionId: params.sessionId,
        candidateId: params.candidateId,
        type
      });
    })
  );
}
