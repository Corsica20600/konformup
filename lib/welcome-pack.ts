import { getOrCreateDocument } from "@/lib/generated-documents";

export async function ensureWelcomePackDocument(params: {
  sessionId: string;
  candidateId: string;
}) {
  return getOrCreateDocument({
    sessionId: params.sessionId,
    candidateId: params.candidateId,
    type: "welcome_pack"
  });
}
