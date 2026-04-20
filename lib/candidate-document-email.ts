import { fetchExistingPdf } from "@/lib/generated-documents";
import { getOrganizationSettings } from "@/lib/organization";
import { createClient } from "@/lib/supabase/server";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise pour envoyer un document candidat par email.`);
  }

  return value;
}

function buildDocumentLabel(type: string) {
  if (type === "aide_memoire") return "aide memoire SST";
  if (type === "welcome_pack") return "livret d'accueil et reglement interieur";
  if (type === "attestation") return "attestation de fin de formation";
  if (type === "certificat") return "certificat";
  if (type === "convocation") return "convocation";
  return "document";
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

async function buildCandidateDocumentEmailBody(candidateName: string, documentLabel: string) {
  const organization = await getOrganizationSettings();
  const signatoryName = organization.certificate_signatory_name || organization.organization_name;
  const organizationEmail = process.env.ORGANIZATION_EMAIL?.trim() || process.env.BREVO_SENDER_EMAIL?.trim() || "";
  const organizationPhone = process.env.ORGANIZATION_PHONE?.trim() || "";

  return [
    `Bonjour ${candidateName},`,
    "",
    `Veuillez trouver ci-joint votre ${documentLabel}.`,
    "",
    "Nous restons a votre disposition pour toute question complementaire.",
    "",
    "Cordialement,",
    organization.organization_name,
    signatoryName,
    organizationEmail,
    organizationPhone
  ].join("\n");
}

async function buildCandidateSessionDocumentsEmailBody(candidateName: string, documentLabels: string[]) {
  const organization = await getOrganizationSettings();
  const signatoryName = organization.certificate_signatory_name || organization.organization_name;
  const organizationEmail = process.env.ORGANIZATION_EMAIL?.trim() || process.env.BREVO_SENDER_EMAIL?.trim() || "";
  const organizationPhone = process.env.ORGANIZATION_PHONE?.trim() || "";

  return [
    `Bonjour ${candidateName},`,
    "",
    "Veuillez trouver ci-joint vos documents de formation :",
    ...documentLabels.map((label) => `- ${label}`),
    "",
    "Nous restons a votre disposition pour toute question complementaire.",
    "",
    "Cordialement,",
    organization.organization_name,
    signatoryName,
    organizationEmail,
    organizationPhone
  ].join("\n");
}

export async function sendCandidateDocumentEmail(documentId: string) {
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("generated_documents")
    .select("id, document_type, document_ref, file_url, candidate_id")
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

  const apiKey = requireEnv("BREVO_API_KEY");
  const fromEmail = requireEnv("BREVO_SENDER_EMAIL");
  const fromName = process.env.BREVO_SENDER_NAME?.trim() || (await getOrganizationSettings()).organization_name;
  const pdf = await fetchExistingPdf(document.file_url);
  const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();
  const documentLabel = buildDocumentLabel(document.document_type);
  const body = await buildCandidateDocumentEmailBody(candidateName || "Bonjour", documentLabel);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: fromEmail,
        name: fromName
      },
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
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Brevo a refuse l'envoi du document. ${errorText}`.trim());
  }

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

  const { data: documents, error: documentsError } = await supabase
    .from("generated_documents")
    .select("id, document_type, document_ref, file_url, created_at")
    .eq("candidate_id", candidateId)
    .eq("session_id", sessionId)
    .not("file_url", "is", null)
    .order("created_at", { ascending: true });

  if (documentsError) {
    throw new Error("Impossible de charger les documents du candidat.");
  }

  if (!documents?.length) {
    throw new Error("Aucun document genere n'est disponible pour cet envoi.");
  }

  const apiKey = requireEnv("BREVO_API_KEY");
  const fromEmail = requireEnv("BREVO_SENDER_EMAIL");
  const fromName = process.env.BREVO_SENDER_NAME?.trim() || (await getOrganizationSettings()).organization_name;
  const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim();
  const body = await buildCandidateSessionDocumentsEmailBody(
    candidateName || "Bonjour",
    documents.map((document) => buildDocumentLabel(document.document_type))
  );

  const attachments = await Promise.all(
    documents.map(async (document) => {
      const pdf = await fetchExistingPdf(document.file_url!);
      return {
        name: buildAttachmentName(document.document_type, document.document_ref),
        content: Buffer.from(pdf.buffer).toString("base64")
      };
    })
  );

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: fromEmail,
        name: fromName
      },
      to: [
        {
          email: candidate.email,
          name: candidateName || candidate.email
        }
      ],
      subject: "Envoi de vos documents de formation SST",
      textContent: body,
      attachment: attachments
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Brevo a refuse l'envoi des documents. ${errorText}`.trim());
  }

  const documentIds = documents.map((document) => document.id);
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
    fileUrl: documents[0]?.file_url ?? null
  };
}
