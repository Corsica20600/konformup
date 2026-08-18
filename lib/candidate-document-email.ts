import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { getGeneratedDocumentLabel } from "@/lib/document-labels";
import { createClient } from "@/lib/supabase/server";
import { getTrainingTypeLabel } from "@/lib/training-programs";
import type { TrainingType } from "@/lib/database.types";
import { ensureCandidatePreTrainingDocuments } from "@/lib/candidate-pre-training-documents";
import { deduplicateDocumentsByType, getRequiredPreTrainingDocumentTypes } from "@/lib/pre-training-documents";

function buildDocumentLabel(type: string) {
  return getGeneratedDocumentLabel(type).toLocaleLowerCase("fr-FR");
}

function buildAttachmentName(type: string, ref: string) {
  if (type === "aide_memoire") {
    return "aide-memoire-sauveteur-secouriste-du-travail.pdf";
  }

  if (type === "welcome_pack") {
    return "livret_reglement.pdf";
  }

  return `${type}-${ref}.pdf`;
}

function buildCandidateDocumentEmailBody(candidateName: string, documentLabel: string, signatureLines: string[]) {
  return [
    `Bonjour ${candidateName},`,
    "",
    `Veuillez trouver ci-joint votre ${documentLabel}.`,
    "",
    "Nous restons a votre disposition pour toute question complementaire.",
    "",
    ...signatureLines
  ].join("\n");
}

function buildCandidateSessionDocumentsEmailBody(
  candidateName: string,
  documentLabels: string[],
  signatureLines: string[]
) {
  return [
    `Bonjour ${candidateName},`,
    "",
    "Veuillez trouver ci-joint vos documents de formation :",
    ...documentLabels.map((label) => `- ${label}`),
    "",
    "Nous restons a votre disposition pour toute question complementaire.",
    "",
    ...signatureLines
  ].join("\n");
}

export async function sendCandidateDocumentEmail(documentId: string) {
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("generated_documents")
    .select("id, document_type, document_ref, file_url, candidate_id, session_id")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !document) {
    throw new Error("Document introuvable.");
  }

  if (!document.candidate_id) {
    throw new Error("Ce document n'est pas rattache a un candidat.");
  }

  if (!document.file_url) {
    throw new Error("Aucun fichier n'est disponible pour ce document.");
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("first_name, last_name, email")
    .eq("id", document.candidate_id)
    .maybeSingle();

  if (candidateError || !candidate) {
    throw new Error("Candidat introuvable.");
  }

  if (!candidate.email) {
    throw new Error("Aucune adresse email n'est renseignee pour ce candidat.");
  }

  if (document.document_type === "aide_memoire" && document.session_id) {
    const { data: session } = await supabase
      .from("training_sessions")
      .select("training_type")
      .eq("id", document.session_id)
      .maybeSingle<{ training_type: TrainingType }>();

    if (session?.training_type === "hygiene") {
      throw new Error("L'aide memoire SST ne peut pas etre envoye pour une formation Hygiene.");
    }
  }

  const emailContext = await getTransactionalEmailContext();
  const pdf = await fetchExistingPdf(document.file_url);
  const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();
  const documentLabel = buildDocumentLabel(document.document_type);
  const body = buildCandidateDocumentEmailBody(candidateName || "Bonjour", documentLabel, emailContext.signatureLines);
  await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [
      {
        email: candidate.email,
        name: candidateName || candidate.email
      }
    ],
    subject: `Envoi de votre ${documentLabel}`,
    textContent: body,
    attachment: [
        {
          name: buildAttachmentName(document.document_type, document.document_ref),
          content: Buffer.from(pdf.buffer).toString("base64")
        }
      ],
    errorLabel: "l'envoi du document"
  });

  const { error: updateError } = await supabase
    .from("generated_documents")
    .update({
      status: "sent",
      updated_at: new Date().toISOString()
    })
    .eq("id", document.id);

  if (updateError) {
    throw new Error("Le document a ete envoye mais son statut n'a pas pu etre mis a jour.");
  }

  return {
    fileUrl: document.file_url
  };
}

export async function sendCandidateSessionDocumentsEmail(candidateId: string, sessionId: string) {
  const supabase = await createClient();
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("first_name, last_name, email")
    .eq("id", candidateId)
    .maybeSingle();

  if (candidateError || !candidate) {
    throw new Error("Candidat introuvable.");
  }

  if (!candidate.email) {
    throw new Error("Aucune adresse email n'est renseignee pour ce candidat.");
  }

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("training_type")
    .eq("id", sessionId)
    .maybeSingle<{ training_type: TrainingType }>();

  if (sessionError || !session) {
    throw new Error("Session introuvable pour l'envoi des documents.");
  }

  await ensureCandidatePreTrainingDocuments({ candidateId, sessionId, trainingType: session.training_type });

  const { data: preparedDocuments, error: preparedDocumentsError } = await supabase
    .from("generated_documents")
    .select("id, document_type, document_ref, file_url, created_at")
    .eq("candidate_id", candidateId)
    .eq("session_id", sessionId)
    .in("document_type", getRequiredPreTrainingDocumentTypes(session.training_type))
    .not("file_url", "is", null)
    .order("created_at", { ascending: false });

  if (preparedDocumentsError) {
    throw new Error("Impossible de charger les documents avant formation du candidat.");
  }

  const deliverableDocuments = deduplicateDocumentsByType(preparedDocuments ?? []);

  if (!deliverableDocuments.length) {
    throw new Error("Aucun document avant formation n'est disponible pour cet envoi.");
  }

  const emailContext = await getTransactionalEmailContext();
  const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();
  const body = buildCandidateSessionDocumentsEmailBody(
    candidateName || "Bonjour",
    deliverableDocuments.map((document) => buildDocumentLabel(document.document_type)),
    emailContext.signatureLines
  );

  const attachments = await Promise.all(
    deliverableDocuments.map(async (document) => {
      const pdf = await fetchExistingPdf(document.file_url!);
      return {
        name: buildAttachmentName(document.document_type, document.document_ref),
        content: Buffer.from(pdf.buffer).toString("base64")
      };
    })
  );

  await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [
      {
        email: candidate.email,
        name: candidateName || candidate.email
      }
    ],
    subject: `Envoi de vos documents de formation - ${getTrainingTypeLabel(session.training_type)}`,
    textContent: body,
    attachment: attachments,
    errorLabel: "l'envoi des documents"
  });

  const documentIds = deliverableDocuments.map((document) => document.id);
  const { error: updateError } = await supabase
    .from("generated_documents")
    .update({
      status: "sent",
      updated_at: new Date().toISOString()
    })
    .in("id", documentIds);

  if (updateError) {
    throw new Error("Les documents ont ete envoyes mais leur statut n'a pas pu etre mis a jour.");
  }

  return {
    fileUrl: deliverableDocuments[0]?.file_url ?? null
  };
}
