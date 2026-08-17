import type { Database } from "@/lib/database.types";
import { getOrganizationSettings } from "@/lib/organization";
import {
  callExistingPdfGeneration,
  generateUniqueDocumentRef,
  insertGeneratedDocumentRecord
} from "@/lib/generated-documents";
import { persistGeneratedDocumentPdfToStorage } from "@/lib/document-storage";
import {
  buildDefaultQuoteDescription,
  buildDefaultQuoteTitle,
  computeQuoteTotalTtc,
  computeQuoteVatAmount
} from "@/lib/quote-utils";
import { initializeSessionModuleProgress } from "@/lib/session-modules";
import { createClient } from "@/lib/supabase/server";
import {
  getTrainingDocumentTitle,
  getTrainingProgramDefaults,
  normalizeTrainingType
} from "@/lib/training-programs";

export type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];

type CreateQuoteInput = {
  sessionId?: string | null;
  companyId?: string | null;
  candidateId?: string | null;
  title: string;
  description: string;
  trainingType?: Database["public"]["Tables"]["quotes"]["Insert"]["training_type"];
  durationHours?: number | null;
  prerequisites?: string;
  objectives?: string;
  programmeOutline?: string;
  accessibilityDetails?: string;
  macPreviousCertificateDate?: string;
  macPreviousCertificateRef?: string;
  candidateCount: number;
  trainerName?: string;
  priceHt: number;
  vatRate: number;
  notes: string;
};

type QuoteCompanyRow = {
  id: string;
  company_name: string;
  legal_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_address: string | null;
  postal_code: string | null;
  city: string | null;
  siret: string | null;
};

type QuoteSessionRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  trainer_id: string | null;
  trainer_name: string | null;
  duration_hours: number | null;
  training_type: Database["public"]["Tables"]["training_sessions"]["Row"]["training_type"];
  training_family: string;
  prerequisites: string | null;
  objectives: string | null;
  programme_outline: string | null;
  accessibility_details: string | null;
  mac_previous_certificate_date: string | null;
  mac_previous_certificate_ref: string | null;
};

type QuoteBaseRow = Omit<QuoteRow, "price_ht" | "vat_rate" | "total_ttc"> & {
  price_ht: number;
  vat_rate: number;
  total_ttc: number;
};

export type QuotePdfData = QuoteBaseRow & {
  session: QuoteSessionRow | null;
  company: QuoteCompanyRow;
};

export type QuoteEditData = QuoteBaseRow & {
  company: QuoteCompanyRow;
};

type TrainingSessionInsertRow = Database["public"]["Tables"]["training_sessions"]["Insert"];

type QuoteCompanyResolutionInput = {
  companyId?: string | null;
  candidateId?: string | null;
  sessionId?: string | null;
};

type QuoteCompanyResolutionResult = {
  company: QuoteCompanyRow;
  resolutionSource: "direct" | "candidate" | "session";
};

type CandidateCompanyLookup = {
  id: string;
  company_id: string | null;
  session_id: string | null;
};

export class QuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteError";
  }
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function isMissingColumnError(error: { message?: string; details?: string } | null) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return text.includes("column") && text.includes("does not exist");
}

function logQuoteResolutionError(
  step: string,
  details: {
    companyId?: string | null;
    candidateId?: string | null;
    sessionId?: string | null;
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  }
) {
  console.error("[quote-resolution-error]", {
    step,
    ...details
  });
}

export {
  buildDefaultQuoteDescription,
  buildDefaultQuoteTitle,
  computeQuoteTotalTtc,
  computeQuoteVatAmount
};

async function selectSessionForQuote(sessionId: string) {
  const supabase = await createClient();
  const primary = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, trainer_id, trainer_name, duration_hours, training_type, training_family, prerequisites, objectives, programme_outline, accessibility_details, mac_previous_certificate_date, mac_previous_certificate_ref")
    .eq("id", sessionId)
    .maybeSingle<QuoteSessionRow>();

  if (!isMissingColumnError(primary.error)) {
    return primary;
  }

  const fallback = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, trainer_id, trainer_name, duration_hours")
    .eq("id", sessionId)
    .maybeSingle();

  return {
    data: fallback.data
      ? ({
          ...fallback.data,
          training_type: "sst_initial",
          training_family: "sst",
          prerequisites: null,
          objectives: null,
          programme_outline: null,
          accessibility_details: null,
          mac_previous_certificate_date: null,
          mac_previous_certificate_ref: null
        } as QuoteSessionRow)
      : null,
    error: fallback.error
  };
}

async function selectCompanyById(companyId: string): Promise<QuoteCompanyRow | null> {
  const supabase = await createClient();
  const primary = await supabase
    .from("client_companies")
    .select("id, company_name, legal_name, contact_name, contact_email, contact_phone, billing_address, postal_code, city, siret")
    .eq("id", companyId)
    .maybeSingle<QuoteCompanyRow>();

  if (!primary.error) {
    return primary.data ?? null;
  }

  if (!isMissingColumnError(primary.error)) {
    logQuoteResolutionError("select-company-primary", {
      companyId,
      code: primary.error.code,
      message: primary.error.message,
      details: primary.error.details,
      hint: primary.error.hint
    });
    throw new QuoteError("Impossible de charger la société sélectionnée pour ce devis.");
  }

  const fallback = await supabase
    .from("client_companies")
    .select("id, company_name, contact_first_name, contact_last_name, contact_email, contact_phone, address, postal_code, city, siret")
    .eq("id", companyId)
    .maybeSingle();

  if (fallback.error) {
    logQuoteResolutionError("select-company-fallback", {
      companyId,
      code: fallback.error.code,
      message: fallback.error.message,
      details: fallback.error.details,
      hint: fallback.error.hint
    });
    throw new QuoteError("Impossible de charger la société sélectionnée pour ce devis.");
  }

  if (!fallback.data) {
    return null;
  }

  const contactName = [fallback.data.contact_first_name, fallback.data.contact_last_name].filter(Boolean).join(" ") || null;

  return {
    id: fallback.data.id,
    company_name: fallback.data.company_name,
    legal_name: null,
    contact_name: contactName,
    contact_email: fallback.data.contact_email,
    contact_phone: fallback.data.contact_phone,
    billing_address: fallback.data.address,
    postal_code: fallback.data.postal_code,
    city: fallback.data.city,
    siret: fallback.data.siret
  };
}

async function selectCandidateForCompany(candidateId: string): Promise<CandidateCompanyLookup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("id, company_id, session_id")
    .eq("id", candidateId)
    .maybeSingle<CandidateCompanyLookup>();

  if (error) {
    logQuoteResolutionError("select-candidate-for-company", {
      candidateId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new QuoteError("Impossible de retrouver le candidat utilisé pour ce devis.");
  }

  return data ?? null;
}

async function selectSessionCompanyIds(sessionId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("company_id")
    .eq("session_id", sessionId)
    .not("company_id", "is", null);

  if (error) {
    logQuoteResolutionError("select-session-company-ids", {
      sessionId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new QuoteError("Impossible de déterminer les sociétés rattachées à cette session.");
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.company_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );
}

export async function resolveQuoteCompany(input: QuoteCompanyResolutionInput): Promise<QuoteCompanyResolutionResult> {
  const companyId = input.companyId?.trim() || null;
  const candidateId = input.candidateId?.trim() || null;
  const sessionId = input.sessionId?.trim() || null;

  if (companyId) {
    const company = await selectCompanyById(companyId);

    if (!company) {
      throw new QuoteError("La société sélectionnée est introuvable ou n'existe plus.");
    }

    return {
      company,
      resolutionSource: "direct"
    };
  }

  if (candidateId) {
    const candidate = await selectCandidateForCompany(candidateId);

    if (!candidate) {
      throw new QuoteError("Le candidat sélectionné est introuvable.");
    }

    if (!candidate.company_id) {
      throw new QuoteError("Le candidat sélectionné n'est rattaché à aucune société.");
    }

    const company = await selectCompanyById(candidate.company_id);

    if (!company) {
      throw new QuoteError("La société du candidat sélectionné est introuvable.");
    }

    return {
      company,
      resolutionSource: "candidate"
    };
  }

  if (sessionId) {
    const companyIds = await selectSessionCompanyIds(sessionId);

    if (companyIds.length === 0) {
      throw new QuoteError("Aucune société n'est rattachée à cette session. Sélectionne une société pour créer le devis.");
    }

    if (companyIds.length > 1) {
      throw new QuoteError("Plusieurs sociétés sont rattachées à cette session. Sélectionne explicitement la société du devis.");
    }

    const company = await selectCompanyById(companyIds[0]);

    if (!company) {
      throw new QuoteError("La société rattachée à cette session est introuvable.");
    }

    return {
      company,
      resolutionSource: "session"
    };
  }

  throw new QuoteError("Une société valide est obligatoire pour créer un devis.");
}

async function fetchQuoteCreationContext(input: QuoteCompanyResolutionInput) {
  const [resolvedCompany, sessionResult] = await Promise.all([
    resolveQuoteCompany(input),
    input.sessionId ? selectSessionForQuote(input.sessionId) : Promise.resolve({ data: null, error: null })
  ]);

  if (sessionResult.error || (input.sessionId && !sessionResult.data)) {
    throw new QuoteError("La session sélectionnée est introuvable pour ce devis.");
  }

  return {
    company: resolvedCompany.company,
    resolutionSource: resolvedCompany.resolutionSource,
    session: sessionResult.data ?? null
  };
}

async function insertQuote({
  quoteNumber,
  session,
  companyId,
  title,
  description,
  trainingType,
  durationHours,
  prerequisites,
  objectives,
  programmeOutline,
  accessibilityDetails,
  macPreviousCertificateDate,
  macPreviousCertificateRef,
  candidateCount,
  trainerName,
  priceHt,
  vatRate,
  notes
}: CreateQuoteInput & {
  quoteNumber: string;
  companyId: string;
  session: QuoteSessionRow | null;
}) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const resolvedTrainingType = normalizeTrainingType(trainingType ?? session?.training_type);
  const defaults = getTrainingProgramDefaults(resolvedTrainingType);
  const resolvedDurationHours = durationHours ?? session?.duration_hours ?? defaults.durationHours;
  const resolvedPrerequisites = prerequisites?.trim() || session?.prerequisites || defaults.prerequisites;
  const resolvedObjectives = objectives?.trim() || session?.objectives || defaults.objectives.join("\n");
  const resolvedProgrammeOutline =
    programmeOutline?.trim() || session?.programme_outline || defaults.programmeLines.join("\n");
  const resolvedAccessibility =
    accessibilityDetails?.trim() || session?.accessibility_details || defaults.accessibility;
  const resolvedMacDate = macPreviousCertificateDate?.trim() || session?.mac_previous_certificate_date || null;
  const resolvedMacRef = macPreviousCertificateRef?.trim() || session?.mac_previous_certificate_ref || null;

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      quote_number: quoteNumber,
      status: "draft",
      training_type: resolvedTrainingType,
      training_family: defaults.family,
      session_id: session?.id ?? null,
      company_id: companyId,
      title: getTrainingDocumentTitle(resolvedTrainingType, title),
      description: description.trim() || null,
      candidate_count: candidateCount,
      session_start_date: session?.start_date ?? null,
      session_end_date: session?.end_date ?? null,
      location: session?.location ?? null,
      trainer_name: session?.trainer_name ?? (trainerName?.trim() || null),
      duration_hours: resolvedDurationHours,
      prerequisites: resolvedPrerequisites,
      objectives: resolvedObjectives,
      programme_outline: resolvedProgrammeOutline,
      accessibility_details: resolvedAccessibility,
      mac_previous_certificate_date: resolvedTrainingType === "mac_sst" ? resolvedMacDate : null,
      mac_previous_certificate_ref: resolvedTrainingType === "mac_sst" ? resolvedMacRef : null,
      price_ht: roundCurrency(priceHt),
      vat_rate: roundCurrency(vatRate),
      notes: notes.trim() || null,
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single<QuoteRow>();

  if (error || !data) {
    throw new QuoteError("Impossible d'enregistrer le devis.");
  }

  return data;
}

async function selectQuoteById(quoteId: string): Promise<QuoteBaseRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, quote_number, status, training_type, training_family, session_id, company_id, title, description, candidate_count, session_start_date, session_end_date, location, trainer_name, duration_hours, prerequisites, objectives, programme_outline, accessibility_details, mac_previous_certificate_date, mac_previous_certificate_ref, price_ht, vat_rate, total_ttc, notes, created_at, updated_at")
    .eq("id", quoteId)
    .maybeSingle();

  if (error) {
    throw new QuoteError("Devis introuvable.");
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    training_type: normalizeTrainingType(data.training_type),
    training_family: data.training_family || getTrainingProgramDefaults(data.training_type).family,
    price_ht: Number(data.price_ht),
    duration_hours: data.duration_hours == null ? null : Number(data.duration_hours),
    vat_rate: Number(data.vat_rate),
    total_ttc: Number(data.total_ttc)
  };
}

export async function getQuoteById(quoteId: string): Promise<QuotePdfData> {
  const quote = await selectQuoteById(quoteId);

  if (!quote) {
    throw new QuoteError("Devis introuvable.");
  }

  const [company, sessionResult] = await Promise.all([
    selectCompanyById(quote.company_id),
    quote.session_id ? selectSessionForQuote(quote.session_id) : Promise.resolve({ data: null, error: null })
  ]);

  if (!company) {
    throw new QuoteError("La société liée à ce devis est introuvable.");
  }

  if (sessionResult.error) {
    throw new QuoteError("La session liée à ce devis est introuvable.");
  }

  return {
    ...quote,
    company,
    session: sessionResult.data ?? null
  };
}

export async function getQuoteForEdit(quoteId: string): Promise<QuoteEditData> {
  const quote = await selectQuoteById(quoteId);

  if (!quote) {
    throw new QuoteError("Devis introuvable.");
  }

  const company = await selectCompanyById(quote.company_id);

  if (!company) {
    throw new QuoteError("La société liée à ce devis est introuvable.");
  }

  return {
    ...quote,
    company
  };
}

export async function createQuote(input: CreateQuoteInput) {
  const context = await fetchQuoteCreationContext({
    companyId: input.companyId,
    candidateId: input.candidateId,
    sessionId: input.sessionId
  });
  const quoteNumber = await generateUniqueDocumentRef("quote");
  const quote = await insertQuote({
    ...input,
    companyId: context.company.id,
    quoteNumber,
    session: context.session
  });

  const fileUrl = `/api/pdf/quote/${quote.id}`;
  await callExistingPdfGeneration(fileUrl);
  const organization = await getOrganizationSettings();

  const document = await insertGeneratedDocumentRecord({
    sessionId: quote.session_id,
    candidateId: null,
    companyId: context.company.id,
    documentType: "quote",
    documentRef: quote.quote_number,
    status: "generated",
    fileUrl,
    metadata: {
      quote_id: quote.id,
      company: {
        id: context.company.id,
        company_name: context.company.company_name,
        resolution_source: context.resolutionSource
      },
      training: {
        type: quote.training_type,
        family: quote.training_family
      },
      session: context.session
        ? {
            id: context.session.id,
            title: context.session.title
          }
        : null,
      totals: {
        price_ht: quote.price_ht,
        vat_rate: quote.vat_rate,
        total_ttc: quote.total_ttc
      },
      organization: {
        name: organization.organization_name
      }
    }
  });

  const persistedDocument = await persistGeneratedDocumentPdfToStorage({
    documentId: document.id,
    sourcePath: fileUrl
  });

  return {
    quote,
    fileUrl: persistedDocument.fileUrl
  };
}

export async function duplicateQuote(quoteId: string) {
  const sourceQuote = await selectQuoteById(quoteId);

  if (!sourceQuote) {
    throw new QuoteError("Devis introuvable.");
  }

  const company = await selectCompanyById(sourceQuote.company_id);

  if (!company) {
    throw new QuoteError("La société liée à ce devis est introuvable.");
  }

  const duplicatedQuoteNumber = await generateUniqueDocumentRef("quote");
  const now = new Date().toISOString();
  const supabase = await createClient();

  const { data: duplicatedQuote, error } = await supabase
    .from("quotes")
    .insert({
      quote_number: duplicatedQuoteNumber,
      status: "draft",
      session_id: null,
      company_id: sourceQuote.company_id,
      title: getTrainingDocumentTitle(sourceQuote.training_type, sourceQuote.title),
      description: sourceQuote.description,
      training_type: sourceQuote.training_type,
      training_family: sourceQuote.training_family,
      candidate_count: sourceQuote.candidate_count,
      session_start_date: sourceQuote.session_start_date,
      session_end_date: sourceQuote.session_end_date,
      location: sourceQuote.location,
      trainer_name: sourceQuote.trainer_name,
      duration_hours: sourceQuote.duration_hours,
      prerequisites: sourceQuote.prerequisites,
      objectives: sourceQuote.objectives,
      programme_outline: sourceQuote.programme_outline,
      accessibility_details: sourceQuote.accessibility_details,
      mac_previous_certificate_date: sourceQuote.mac_previous_certificate_date,
      mac_previous_certificate_ref: sourceQuote.mac_previous_certificate_ref,
      price_ht: roundCurrency(sourceQuote.price_ht),
      vat_rate: roundCurrency(sourceQuote.vat_rate),
      notes: sourceQuote.notes,
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single<QuoteRow>();

  if (error || !duplicatedQuote) {
    throw new QuoteError("Impossible de dupliquer le devis.");
  }

  const fileUrl = `/api/pdf/quote/${duplicatedQuote.id}`;

  const document = await insertGeneratedDocumentRecord({
    sessionId: null,
    candidateId: null,
    companyId: duplicatedQuote.company_id,
    documentType: "quote",
    documentRef: duplicatedQuote.quote_number,
    status: "draft",
    fileUrl,
    metadata: {
      quote_id: duplicatedQuote.id,
      duplicated_from_quote_id: sourceQuote.id,
      company: {
        id: company.id,
        company_name: company.company_name
      },
      training: {
        type: duplicatedQuote.training_type,
        family: duplicatedQuote.training_family
      },
      session: null,
      totals: {
        price_ht: duplicatedQuote.price_ht,
        vat_rate: duplicatedQuote.vat_rate,
        total_ttc: duplicatedQuote.total_ttc
      }
    }
  });

  const persistedDocument = await persistGeneratedDocumentPdfToStorage({
    documentId: document.id,
    sourcePath: fileUrl
  });

  return {
    quote: duplicatedQuote,
    fileUrl: persistedDocument.fileUrl
  };
}

export async function getProgrammeDocumentByQuoteId(quoteId: string): Promise<{
  id: string;
  fileUrl: string | null;
  documentRef: string;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_documents")
    .select("id, file_url, document_ref")
    .eq("document_type", "programme")
    .contains("metadata", { quote_id: quoteId })
    .maybeSingle();

  if (error) {
    throw new QuoteError("Impossible de retrouver le programme lie a ce devis.");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fileUrl: data.file_url,
    documentRef: data.document_ref
  };
}

export async function createProgrammeDocumentForQuote(quoteId: string) {
  const quote = await getQuoteById(quoteId);
  const fileUrl = `/api/pdf/programme/${quote.id}`;

  await callExistingPdfGeneration(fileUrl);

  const existingDocument = await getProgrammeDocumentByQuoteId(quoteId);

  if (existingDocument) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("generated_documents")
      .update({
        session_id: quote.session?.id ?? null,
        company_id: quote.company.id,
        file_url: fileUrl,
        status: "generated",
        updated_at: new Date().toISOString()
      })
      .eq("id", existingDocument.id);

    if (error) {
      throw new QuoteError("Impossible de synchroniser le programme lie a ce devis.");
    }

    const persistedDocument = await persistGeneratedDocumentPdfToStorage({
      documentId: existingDocument.id,
      sourcePath: fileUrl
    });

    return {
      id: existingDocument.id,
      fileUrl: persistedDocument.fileUrl,
      documentRef: existingDocument.documentRef
    };
  }

  const documentRef = await generateUniqueDocumentRef("programme");
  const document = await insertGeneratedDocumentRecord({
    sessionId: quote.session?.id ?? null,
    candidateId: null,
    companyId: quote.company.id,
    documentType: "programme",
    documentRef,
    status: "generated",
    fileUrl,
    metadata: {
      quote_id: quote.id,
      quote_number: quote.quote_number,
      company: {
        id: quote.company.id,
        company_name: quote.company.company_name
      },
      training: {
        type: quote.training_type,
        family: quote.training_family
      },
      session: quote.session
        ? {
            id: quote.session.id,
            title: quote.session.title
          }
        : null
    }
  });

  const persistedDocument = await persistGeneratedDocumentPdfToStorage({
    documentId: document.id,
    sourcePath: fileUrl
  });

  return {
    id: document.id,
    fileUrl: persistedDocument.fileUrl,
    documentRef
  };
}

export async function updateQuote({
  quoteId,
  title,
  description,
  trainingType,
  durationHours,
  prerequisites,
  objectives,
  programmeOutline,
  accessibilityDetails,
  macPreviousCertificateDate,
  macPreviousCertificateRef,
  candidateCount,
  sessionStartDate,
  sessionEndDate,
  location,
  trainerName,
  priceHt,
  vatRate,
  notes
}: {
  quoteId: string;
  title: string;
  description: string;
  trainingType: Database["public"]["Tables"]["quotes"]["Update"]["training_type"];
  durationHours?: number | "";
  prerequisites: string;
  objectives: string;
  programmeOutline: string;
  accessibilityDetails: string;
  macPreviousCertificateDate: string;
  macPreviousCertificateRef: string;
  candidateCount: number;
  sessionStartDate: string;
  sessionEndDate: string;
  location: string;
  trainerName: string;
  priceHt: number;
  vatRate: number;
  notes: string;
}) {
  const supabase = await createClient();
  const resolvedTrainingType = normalizeTrainingType(trainingType);
  const defaults = getTrainingProgramDefaults(resolvedTrainingType);
  const { data, error } = await supabase
    .from("quotes")
    .update({
      title: getTrainingDocumentTitle(resolvedTrainingType, title),
      description: description.trim() || null,
      training_type: resolvedTrainingType,
      training_family: defaults.family,
      candidate_count: candidateCount,
      session_start_date: sessionStartDate || null,
      session_end_date: sessionEndDate || null,
      location: location.trim() || null,
      trainer_name: trainerName.trim() || null,
      duration_hours: durationHours === "" || typeof durationHours === "undefined" ? null : durationHours,
      prerequisites: prerequisites.trim() || defaults.prerequisites,
      objectives: objectives.trim() || defaults.objectives.join("\n"),
      programme_outline: programmeOutline.trim() || defaults.programmeLines.join("\n"),
      accessibility_details: accessibilityDetails.trim() || defaults.accessibility,
      ...(resolvedTrainingType === "mac_sst"
        ? {
            mac_previous_certificate_date: macPreviousCertificateDate.trim() || null,
            mac_previous_certificate_ref: macPreviousCertificateRef.trim() || null
          }
        : {}),
      price_ht: roundCurrency(priceHt),
      vat_rate: roundCurrency(vatRate),
      notes: notes.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", quoteId)
    .select("*")
    .single<QuoteRow>();

  if (error || !data) {
    throw new QuoteError("Impossible de mettre a jour le devis.");
  }

  return data;
}

async function upsertGeneratedDocumentForQuote(quote: QuoteRow, status: "draft" | "generated") {
  const supabase = await createClient();
  const company = await selectCompanyById(quote.company_id);
  const fileUrl = `/api/pdf/quote/${quote.id}`;
  const metadata = {
    quote_id: quote.id,
    company: company
      ? {
          id: company.id,
          company_name: company.company_name
        }
      : null,
    session: null,
    training: {
      type: quote.training_type,
      family: quote.training_family
    },
    totals: {
      price_ht: quote.price_ht,
      vat_rate: quote.vat_rate,
      total_ttc: quote.total_ttc
    }
  };

  const { data: existingDocument, error: existingError } = await supabase
    .from("generated_documents")
    .select("id")
    .eq("document_type", "quote")
    .contains("metadata", { quote_id: quote.id })
    .maybeSingle();

  if (existingError) {
    throw new QuoteError("Impossible de synchroniser le document du devis.");
  }

  if (!existingDocument) {
    const document = await insertGeneratedDocumentRecord({
      sessionId: quote.session_id,
      candidateId: null,
      companyId: quote.company_id,
      documentType: "quote",
      documentRef: quote.quote_number,
      status,
      fileUrl,
      metadata
    });

    await persistGeneratedDocumentPdfToStorage({
      documentId: document.id,
      sourcePath: fileUrl
    });

    return;
  }

  const { error: updateError } = await supabase
    .from("generated_documents")
    .update({
      session_id: quote.session_id,
      company_id: quote.company_id,
      document_ref: quote.quote_number,
      status,
      file_url: fileUrl,
      metadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", existingDocument.id);

  if (updateError) {
    throw new QuoteError("Impossible de synchroniser le document du devis.");
  }

  await persistGeneratedDocumentPdfToStorage({
    documentId: existingDocument.id,
    sourcePath: fileUrl
  });
}

export async function regenerateQuotePdf(quoteId: string) {
  const quote = await getQuoteForEdit(quoteId);
  const fileUrl = `/api/pdf/quote/${quote.id}`;

  await callExistingPdfGeneration(fileUrl);
  await upsertGeneratedDocumentForQuote(quote, "generated");

  return {
    quote,
    fileUrl
  };
}

export async function updateQuoteStatus(quoteId: string, status: QuoteRow["status"]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", quoteId)
    .select("id, session_id, company_id, status")
    .single<Pick<QuoteRow, "id" | "session_id" | "company_id" | "status">>();

  if (error || !data) {
    throw new QuoteError("Impossible de mettre a jour le statut du devis.");
  }

  return data;
}

export function buildSessionPayloadFromQuote(quote: QuoteBaseRow, trainerUserId: string): TrainingSessionInsertRow {
  return {
    title: quote.title,
    start_date: quote.session_start_date!,
    end_date: quote.session_end_date!,
    location: quote.location!,
    status: "draft",
    training_type: quote.training_type,
    training_family: quote.training_family,
    source_quote_id: quote.id,
    trainer_user_id: trainerUserId,
    trainer_name: quote.trainer_name,
    duration_hours: quote.duration_hours,
    prerequisites: quote.prerequisites,
    objectives: quote.objectives,
    programme_outline: quote.programme_outline,
    accessibility_details: quote.accessibility_details,
    mac_previous_certificate_date: quote.mac_previous_certificate_date,
    mac_previous_certificate_ref: quote.mac_previous_certificate_ref
  };
}

export async function createSessionFromQuote(quoteId: string, trainerUserId: string) {
  const quote = await selectQuoteById(quoteId);

  if (!quote) {
    throw new QuoteError("Devis introuvable.");
  }

  if (quote.status !== "accepted") {
    throw new QuoteError("Seul un devis accepte peut etre transforme en session.");
  }

  if (quote.session_id) {
    throw new QuoteError("Une session est deja liee a ce devis.");
  }

  if (!quote.session_start_date || !quote.session_end_date || !quote.location) {
    throw new QuoteError("Renseigne les dates et le lieu du devis avant de creer la session.");
  }

  const supabase = await createClient();
  const sessionPayload = buildSessionPayloadFromQuote(quote, trainerUserId);

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .insert(sessionPayload)
    .select("id, title")
    .single<{ id: string; title: string }>();

  if (sessionError || !session) {
    throw new QuoteError("Impossible de creer la session a partir du devis.");
  }

  try {
    await initializeSessionModuleProgress(session.id);
  } catch {
    throw new QuoteError("Session creee, mais la progression des modules n'a pas pu etre initialisee.");
  }

  const now = new Date().toISOString();
  const { error: quoteUpdateError } = await supabase
    .from("quotes")
    .update({
      session_id: session.id,
      updated_at: now
    })
    .eq("id", quote.id);

  if (quoteUpdateError) {
    throw new QuoteError("Session creee, mais le devis n'a pas pu etre lie.");
  }

  const { error: documentUpdateError } = await supabase
    .from("generated_documents")
    .update({
      session_id: session.id,
      updated_at: now
    })
    .in("document_type", ["quote", "programme", "training_agreement"])
    .contains("metadata", { quote_id: quote.id });

  if (documentUpdateError) {
    throw new QuoteError("Session creee, mais la trace documentaire du devis n'a pas pu etre mise a jour.");
  }

  return {
    quote,
    session
  };
}
