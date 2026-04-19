import type { Json } from "@/lib/database.types";
import { callExistingPdfGeneration, generateUniqueDocumentRef, insertGeneratedDocumentRecord } from "@/lib/generated-documents";
import { persistGeneratedDocumentPdfToStorage } from "@/lib/document-storage";
import { getOrganizationSettings } from "@/lib/organization";
import { getSessionById, SessionNotFoundError } from "@/lib/queries";
import type { QuotePdfData } from "@/lib/quotes";
import { QuoteError, getQuoteById } from "@/lib/quotes";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange, formatDurationHours } from "@/lib/utils";

type GeneratedAgreementDocumentRow = {
  id: string;
  file_url: string | null;
  document_ref: string;
  version: number;
  status: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type TrainingAgreementParticipant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
};

export type TrainingAgreementPdfData = {
  quote: QuotePdfData;
  agreementRef: string;
  generatedAt: string;
  organization: {
    name: string;
    address: string;
    postalCode: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    siret: string | null;
    declarationNumber: string | null;
    representativeName: string | null;
    representativeTitle: string | null;
  };
  client: {
    companyName: string;
    legalName: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    siret: string | null;
  };
  training: {
    title: string;
    objectives: string[];
    programmeLines: string[];
    durationHours: number | null;
    durationLabel: string;
    dateRangeLabel: string;
    locationLabel: string;
    modality: string;
    prerequisites: string;
    pedagogicalMeans: string[];
    evaluationMethods: string[];
    trainerName: string;
    participantCount: number;
    participantLabel: string;
    participants: TrainingAgreementParticipant[];
  };
  financial: {
    priceHt: number;
    vatRate: number;
    totalTtc: number;
    paymentTerms: string;
    depositTerms: string | null;
  };
  clauses: {
    purpose: string;
    organization: string;
    pedagogicalMeans: string;
    followUp: string;
    financialTerms: string;
    cancellation: string;
    obligations: string;
  };
  missingFields: string[];
};

function safeTrim(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function splitTextToLines(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n|•|-/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function deriveObjectives(quote: QuotePdfData) {
  const descriptionLines = splitTextToLines(quote.description);

  if (descriptionLines.length >= 2) {
    return descriptionLines.slice(0, 4);
  }

  return [
    `Permettre aux participants de suivre la formation "${quote.title}".`,
    "Acquerir les competences visees par le programme pedagogique transmis par l'organisme de formation.",
    "Permettre une mise en pratique immediate dans le contexte professionnel du client."
  ];
}

function deriveProgrammeLines(params: {
  quote: QuotePdfData;
  sessionModuleTitles: string[];
}) {
  if (params.sessionModuleTitles.length) {
    return params.sessionModuleTitles;
  }

  const descriptionLines = splitTextToLines(params.quote.description);
  if (descriptionLines.length) {
    return descriptionLines.slice(0, 8);
  }

  return [
    "Accueil des participants et cadrage de l'action de formation.",
    "Apports theoriques et methodologiques sur les competences cibles.",
    "Mises en situation, exercices pratiques et analyses de cas.",
    "Evaluation des acquis et bilan de fin de formation."
  ];
}

function deriveModality(quote: QuotePdfData) {
  const haystack = `${quote.location ?? ""} ${quote.session?.location ?? ""}`.toLowerCase();

  if (haystack.includes("distanc")) {
    return "Distanciel";
  }

  if (haystack.includes("mixte") || haystack.includes("hybride")) {
    return "Mixte";
  }

  return "Presentiel";
}

function derivePaymentTerms(notes: string | null | undefined) {
  const normalizedNotes = safeTrim(notes);
  if (normalizedNotes) {
    return `Reglement selon les conditions convenues au devis et aux mentions suivantes : ${normalizedNotes}`;
  }

  return "Reglement a reception de facture, par virement bancaire, dans un delai de 30 jours fin de mois sauf conditions particulieres convenues entre les parties.";
}

function buildDepositTerms(notes: string | null | undefined) {
  const normalizedNotes = safeTrim(notes)?.toLowerCase();
  if (normalizedNotes?.includes("acompte")) {
    return safeTrim(notes);
  }

  return null;
}

async function getTrainerDisplayName(trainerId: string | null | undefined) {
  const normalizedTrainerId = safeTrim(trainerId);

  if (!normalizedTrainerId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainers")
    .select("first_name, last_name")
    .eq("id", normalizedTrainerId)
    .maybeSingle<{ first_name: string; last_name: string }>();

  if (error || !data) {
    return null;
  }

  return [data.first_name, data.last_name].map((value) => value.trim()).filter(Boolean).join(" ") || null;
}

async function resolveAgreementTrainerName(params: {
  trainerId?: string | null;
  trainerName?: string | null;
}) {
  const trainerFromRelation = await getTrainerDisplayName(params.trainerId);

  if (trainerFromRelation) {
    return trainerFromRelation;
  }

  return safeTrim(params.trainerName) || "Formateur a confirmer";
}

async function resolveAgreementSessionId(quote: QuotePdfData) {
  if (quote.session?.id) {
    return quote.session.id;
  }

  const supabase = await createClient();

  const bySourceQuote = await supabase
    .from("training_sessions")
    .select("id")
    .eq("source_quote_id", quote.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (bySourceQuote.data?.id) {
    return bySourceQuote.data.id;
  }

  const hasDateRange = Boolean(quote.session_start_date && quote.session_end_date);
  const hasLocation = Boolean(safeTrim(quote.location));

  if (!hasDateRange && !hasLocation) {
    return null;
  }

  let query = supabase
    .from("training_sessions")
    .select("id, source_quote_id, start_date, end_date, location, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (quote.session_start_date) {
    query = query.eq("start_date", quote.session_start_date);
  }

  if (quote.session_end_date) {
    query = query.eq("end_date", quote.session_end_date);
  }

  const normalizedLocation = safeTrim(quote.location);

  if (normalizedLocation) {
    query = query.eq("location", normalizedLocation);
  }

  const { data } = await query;

  return data?.[0]?.id ?? null;
}

async function getSessionAgreementContext(quote: QuotePdfData) {
  const resolvedSessionId = await resolveAgreementSessionId(quote);

  if (!resolvedSessionId) {
    return {
      modules: [] as string[],
      participants: [] as TrainingAgreementParticipant[],
      trainerName: await resolveAgreementTrainerName({
        trainerId: quote.session?.trainer_id,
        trainerName: quote.session?.trainer_name
      }),
      durationHours: quote.session?.duration_hours ?? null
    };
  }

  try {
    const sessionData = await getSessionById(resolvedSessionId);
    const companyParticipants = sessionData.candidates.filter(
      (candidateSession) => candidateSession.candidate.company_id === quote.company.id
    );
    const selectedParticipants = companyParticipants.length ? companyParticipants : sessionData.candidates;

    return {
      modules: sessionData.modules.map((module) => module.title),
      participants: selectedParticipants.map((candidateSession) => ({
        id: candidateSession.candidate.id,
        first_name: candidateSession.candidate.first_name,
        last_name: candidateSession.candidate.last_name,
        email: candidateSession.candidate.email,
        company: candidateSession.candidate.company
      })),
      trainerName: await resolveAgreementTrainerName({
        trainerId: sessionData.session.trainer_id ?? quote.session?.trainer_id,
        trainerName: sessionData.session.trainer_name || quote.session?.trainer_name
      }),
      durationHours: sessionData.session.duration_hours ?? quote.session?.duration_hours ?? null
    };
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return {
        modules: [] as string[],
        participants: [] as TrainingAgreementParticipant[],
        trainerName: await resolveAgreementTrainerName({
          trainerId: quote.session?.trainer_id,
          trainerName: quote.session?.trainer_name
        }),
        durationHours: quote.session?.duration_hours ?? null
      };
    }

    throw error;
  }
}

function buildMissingFields(data: {
  organizationEmail: string | null;
  organizationPhone: string | null;
  companyAddress: string | null;
  sessionDates: string | null;
  location: string | null;
  trainerName: string;
}) {
  const missing: string[] = [];

  if (!data.organizationEmail) missing.push("Email organisme");
  if (!data.organizationPhone) missing.push("Telephone organisme");
  if (!data.companyAddress) missing.push("Adresse client");
  if (!data.sessionDates) missing.push("Dates de formation");
  if (!data.location) missing.push("Lieu de formation");
  if (data.trainerName === "Formateur a confirmer") missing.push("Formateur");

  return missing;
}

function buildTrainingAgreementSnapshot(data: TrainingAgreementPdfData): Json {
  return {
    agreement_ref: data.agreementRef,
    generated_at: data.generatedAt,
    organization: data.organization,
    client: data.client,
    training: {
      title: data.training.title,
      objectives: data.training.objectives,
      programme_lines: data.training.programmeLines,
      duration_hours: data.training.durationHours,
      duration_label: data.training.durationLabel,
      date_range_label: data.training.dateRangeLabel,
      location_label: data.training.locationLabel,
      modality: data.training.modality,
      prerequisites: data.training.prerequisites,
      pedagogical_means: data.training.pedagogicalMeans,
      evaluation_methods: data.training.evaluationMethods,
      trainer_name: data.training.trainerName,
      participant_count: data.training.participantCount,
      participants: data.training.participants.map((participant) => ({
        id: participant.id,
        first_name: participant.first_name,
        last_name: participant.last_name,
        email: participant.email,
        company: participant.company
      }))
    },
    financial: {
      price_ht: data.financial.priceHt,
      vat_rate: data.financial.vatRate,
      total_ttc: data.financial.totalTtc,
      payment_terms: data.financial.paymentTerms,
      deposit_terms: data.financial.depositTerms
    },
    clauses: data.clauses,
    missing_fields: data.missingFields
  } satisfies Json;
}

export async function buildTrainingAgreementPdfData(quoteId: string, agreementRef?: string): Promise<TrainingAgreementPdfData> {
  const [quote, organizationSettings] = await Promise.all([getQuoteById(quoteId), getOrganizationSettings()]);
  const sessionContext = await getSessionAgreementContext(quote);
  const organizationEmail =
    safeTrim(organizationSettings.contact_email) ||
    safeTrim(process.env.ORGANIZATION_EMAIL) ||
    safeTrim(process.env.BREVO_SENDER_EMAIL);
  const organizationPhone = safeTrim(organizationSettings.contact_phone) || safeTrim(process.env.ORGANIZATION_PHONE);
  const representativeName =
    safeTrim(organizationSettings.certificate_signatory_name) || safeTrim(process.env.ORGANIZATION_REPRESENTATIVE_NAME);
  const representativeTitle =
    safeTrim(organizationSettings.certificate_signatory_title) || safeTrim(process.env.ORGANIZATION_REPRESENTATIVE_TITLE);
  const agreementGeneratedAt = new Date().toISOString();
  const resolvedAgreementRef = agreementRef || `CONV-${quote.quote_number}`;
  const sessionDateLabel =
    quote.session_start_date || quote.session_end_date
      ? formatDateRange(quote.session_start_date, quote.session_end_date)
      : null;
  const locationLabel = safeTrim(quote.location) || safeTrim(quote.session?.location) || "Lieu a confirmer";
  const participantCount = sessionContext.participants.length || quote.candidate_count || 0;
  const missingFields = buildMissingFields({
    organizationEmail,
    organizationPhone,
    companyAddress: safeTrim(quote.company.billing_address),
    sessionDates: sessionDateLabel,
    location: locationLabel,
    trainerName: sessionContext.trainerName
  });

  return {
    quote,
    agreementRef: resolvedAgreementRef,
    generatedAt: agreementGeneratedAt,
    organization: {
      name: organizationSettings.organization_name,
      address: organizationSettings.address,
      postalCode: organizationSettings.postal_code ?? null,
      city: organizationSettings.city ?? null,
      email: organizationEmail,
      phone: organizationPhone,
      siret: organizationSettings.siret ?? null,
      declarationNumber: organizationSettings.training_declaration_number ?? null,
      representativeName,
      representativeTitle
    },
    client: {
      companyName: quote.company.company_name,
      legalName: quote.company.legal_name,
      address: quote.company.billing_address,
      postalCode: quote.company.postal_code,
      city: quote.company.city,
      contactName: quote.company.contact_name,
      contactEmail: quote.company.contact_email,
      contactPhone: quote.company.contact_phone,
      siret: quote.company.siret
    },
    training: {
      title: quote.title,
      objectives: deriveObjectives(quote),
      programmeLines: deriveProgrammeLines({
        quote,
        sessionModuleTitles: sessionContext.modules
      }),
      durationHours: sessionContext.durationHours,
      durationLabel: formatDurationHours(sessionContext.durationHours),
      dateRangeLabel: sessionDateLabel || "Dates a definir",
      locationLabel,
      modality: deriveModality(quote),
      prerequisites: "Aucun prerequis particulier sauf mention contraire au devis ou au programme.",
      pedagogicalMeans: [
        "Apports theoriques et methodologiques animes par un formateur qualifie.",
        "Supports pedagogiques, demonstrations, echanges et etudes de cas.",
        "Exercices pratiques, mises en situation et evaluation des acquis."
      ],
      evaluationMethods: [
        "Feuilles d'emargement et suivi de la participation.",
        "Evaluations formatives pendant la formation.",
        "Evaluation finale ou validation des acquis selon le programme de formation."
      ],
      trainerName: sessionContext.trainerName,
      participantCount,
      participantLabel: participantCount > 0 ? `${participantCount} participant(s)` : "Effectif a confirmer",
      participants: sessionContext.participants
    },
    financial: {
      priceHt: quote.price_ht,
      vatRate: quote.vat_rate,
      totalTtc: quote.total_ttc,
      paymentTerms: derivePaymentTerms(quote.notes),
      depositTerms: buildDepositTerms(quote.notes)
    },
    clauses: {
      purpose: `La presente convention a pour objet de definir les conditions dans lesquelles l'organisme de formation realise l'action de formation intitulee "${quote.title}" au benefice du client.`,
      organization:
        "L'action de formation est organisee selon les dates, horaires, modalites et conditions logistiques definis au devis et/ou precises ulterieurement d'un commun accord entre les parties.",
      pedagogicalMeans:
        "L'organisme met en oeuvre les moyens pedagogiques, techniques et d'encadrement necessaires a la bonne execution de l'action de formation, en coherence avec le programme transmis au client.",
      followUp:
        "Le suivi de l'execution de l'action est assure au moyen de feuilles d'emargement, d'outils de suivi, d'evaluations des acquis et, le cas echeant, d'attestations ou certificats remis aux participants.",
      financialTerms:
        "Le client s'engage a regler le cout de la formation selon les modalites prevues au devis et reprises dans la presente convention. Toute prise en charge partielle ou totale par un financeur demeure a la charge du client en cas de defaillance de ce dernier.",
      cancellation:
        "En cas d'annulation ou de report par le client moins de 7 jours ouvres avant le debut prevu, l'organisme se reserve la possibilite de facturer les frais deja engages et/ou une indemnite forfaitaire, sauf cas de force majeure ou accord particulier ecrit.",
      obligations:
        "Chaque partie s'engage a cooperer loyalement a la bonne execution de la formation, a communiquer en temps utile les informations utiles, et a respecter les obligations legales, reglementaires et de securite applicables."
    },
    missingFields
  };
}

export async function getTrainingAgreementDocumentByQuoteId(quoteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_documents")
    .select("id, file_url, document_ref, version, status, metadata, created_at, updated_at")
    .eq("document_type", "training_agreement")
    .contains("metadata", { quote_id: quoteId })
    .maybeSingle<GeneratedAgreementDocumentRow>();

  if (error) {
    throw new QuoteError("Impossible de retrouver la convention liee a ce devis.");
  }

  return data ?? null;
}

export async function createTrainingAgreementDocumentForQuote(
  quoteId: string,
  options?: { forceRegenerate?: boolean }
) {
  const existingDocument = await getTrainingAgreementDocumentByQuoteId(quoteId);

  if (existingDocument && !options?.forceRegenerate) {
    return {
      id: existingDocument.id,
      fileUrl: existingDocument.file_url ?? `/api/pdf/training-agreement/${quoteId}`,
      documentRef: existingDocument.document_ref,
      version: existingDocument.version,
      status: existingDocument.status
    };
  }

  const agreementRef = existingDocument?.document_ref ?? (await generateUniqueDocumentRef("training_agreement"));
  const agreementData = await buildTrainingAgreementPdfData(quoteId, agreementRef);
  const fileUrl = `/api/pdf/training-agreement/${quoteId}`;
  await callExistingPdfGeneration(fileUrl);

  const metadata = {
    quote_id: agreementData.quote.id,
    quote_number: agreementData.quote.quote_number,
    company: {
      id: agreementData.quote.company.id,
      company_name: agreementData.quote.company.company_name
    },
    session: agreementData.quote.session
      ? {
          id: agreementData.quote.session.id,
          title: agreementData.quote.session.title
        }
      : null,
    candidate_ids: agreementData.training.participants.map((participant) => participant.id),
    content_snapshot: buildTrainingAgreementSnapshot(agreementData),
    missing_fields: agreementData.missingFields
  } satisfies Json;

  if (existingDocument) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("generated_documents")
      .update({
        session_id: agreementData.quote.session?.id ?? null,
        company_id: agreementData.quote.company.id,
        document_ref: agreementRef,
        file_url: fileUrl,
        version: existingDocument.version + 1,
        status: "generated",
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingDocument.id);

    if (error) {
      throw new QuoteError("Impossible de mettre a jour la convention de formation.");
    }

    const persistedDocument = await persistGeneratedDocumentPdfToStorage({
      documentId: existingDocument.id,
      sourcePath: fileUrl
    });

    return {
      id: existingDocument.id,
      fileUrl: persistedDocument.fileUrl,
      documentRef: agreementRef,
      version: existingDocument.version + 1,
      status: "generated"
    };
  }

  const document = await insertGeneratedDocumentRecord({
    sessionId: agreementData.quote.session?.id ?? null,
    companyId: agreementData.quote.company.id,
    documentType: "training_agreement",
    documentRef: agreementRef,
    status: "generated",
    fileUrl,
    metadata
  });

  const persistedDocument = await persistGeneratedDocumentPdfToStorage({
    documentId: document.id,
    sourcePath: fileUrl
  });

  return {
    id: document.id,
    fileUrl: persistedDocument.fileUrl,
    documentRef: agreementRef,
    version: document.version,
    status: document.status
  };
}
