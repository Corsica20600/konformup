import { cookies, headers } from "next/headers";
import type { Database, Json } from "@/lib/database.types";
import { persistGeneratedDocumentPdfToStorage } from "@/lib/document-storage";
import { getOrganizationSettings } from "@/lib/organization";
import { getSessionById, SessionNotFoundError } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export type DocumentLifecycleStatus = "draft" | "generated" | "sent" | "signed" | "archived";
export type SupportedGeneratedDocumentType =
  | "attestation"
  | "certificat"
  | "convocation"
  | "feuille_presence"
  | "invoice"
  | "training_agreement"
  | "programme"
  | "quote";
export type GeneratedDocumentRow = Database["public"]["Tables"]["generated_documents"]["Row"];

type CreateGeneratedDocumentRecordInput = {
  sessionId?: string | null;
  candidateId?: string | null;
  companyId?: string | null;
  documentType: string;
  documentRef: string;
  version?: number;
  status?: DocumentLifecycleStatus;
  fileUrl?: string | null;
  metadata?: Json;
};

type CreateDocumentInput = {
  sessionId: string;
  candidateId?: string | null;
  type: SupportedGeneratedDocumentType;
};

const DOCUMENT_CONFIG: Record<
  SupportedGeneratedDocumentType,
  {
    prefix: string;
    buildPath?: (params: { sessionId: string; candidateId: string | null }) => string;
    requiresCandidate: boolean;
  }
> = {
  attestation: {
    prefix: "ATTEST",
    buildPath: ({ candidateId }) => `/api/pdf/certificate/${candidateId}`,
    requiresCandidate: true
  },
  certificat: {
    prefix: "CERT",
    buildPath: ({ candidateId }) => `/api/pdf/certificate/${candidateId}`,
    requiresCandidate: true
  },
  convocation: {
    prefix: "CONVOC",
    buildPath: ({ candidateId }) => `/api/pdf/convocation/${candidateId}`,
    requiresCandidate: true
  },
  feuille_presence: {
    prefix: "PRES",
    buildPath: ({ sessionId }) => `/api/pdf/attendance/${sessionId}`,
    requiresCandidate: false
  },
  invoice: {
    prefix: "FACT",
    requiresCandidate: false
  },
  training_agreement: {
    prefix: "CONV",
    requiresCandidate: false
  },
  programme: {
    prefix: "PROG",
    requiresCandidate: false
  },
  quote: {
    prefix: "DEVIS",
    requiresCandidate: false
  }
};

export class DocumentGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentGenerationError";
  }
}

function isLocalHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  );
}

export function normalizePublicAppOrigin(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (isLocalHostname(url.hostname)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function resolvePublicAppOrigin() {
  return (
    normalizePublicAppOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizePublicAppOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizePublicAppOrigin(process.env.APP_URL) ||
    normalizePublicAppOrigin(process.env.VERCEL_URL)
  );
}

export function buildDocumentVerificationUrl(publicOrigin: string, ref: string) {
  const url = new URL("/documents/verify", publicOrigin);
  url.searchParams.set("ref", ref);
  return url.toString();
}

function appendQueryParams(pathname: string, params: Record<string, string | null | undefined>) {
  const [basePath, queryString = ""] = pathname.split("?");
  const searchParams = new URLSearchParams(queryString);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const nextQuery = searchParams.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveStoredSourcePath(document: Pick<GeneratedDocumentRow, "file_url" | "metadata">) {
  const metadata = isRecordObject(document.metadata) ? document.metadata : null;
  const storage = metadata && isRecordObject(metadata.storage) ? metadata.storage : null;
  const sourcePath = storage && typeof storage.source_path === "string" ? storage.source_path : null;

  if (sourcePath) {
    return sourcePath;
  }

  if (document.file_url?.startsWith("/api/documents/generated/")) {
    return null;
  }

  return document.file_url;
}

function logDocumentGenerationError(
  step: string,
  details: {
    sessionId?: string | null;
    candidateId?: string | null;
    type?: string;
    pathname?: string;
    status?: number;
    statusText?: string;
    message?: string;
    responseText?: string;
    code?: string;
    details?: string;
    hint?: string;
  }
) {
  console.error("[document-generation-error]", {
    step,
    ...details
  });
}

export async function insertGeneratedDocumentRecord({
  sessionId = null,
  candidateId = null,
  companyId = null,
  documentType,
  documentRef,
  version = 1,
  status = "generated",
  fileUrl = null,
  metadata = {}
}: CreateGeneratedDocumentRecordInput) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("generated_documents")
    .insert({
      session_id: sessionId,
      candidate_id: candidateId,
      company_id: companyId,
      document_type: documentType.trim(),
      document_ref: documentRef.trim(),
      version,
      status,
      file_url: fileUrl,
      metadata,
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single();

  if (error || !data) {
    logDocumentGenerationError("insert-generated-document", {
      sessionId,
      candidateId,
      type: documentType,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });
    throw new DocumentGenerationError("Impossible d'enregistrer le document généré.");
  }

  return data;
}

async function resolveAppOrigin() {
  const forwardedHeaders = await headers();
  const forwardedProto = forwardedHeaders.get("x-forwarded-proto");
  const forwardedHost = forwardedHeaders.get("x-forwarded-host") || forwardedHeaders.get("host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (forwardedHost) {
    return `https://${forwardedHost}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return vercelUrl.startsWith("http://") || vercelUrl.startsWith("https://")
      ? vercelUrl
      : `https://${vercelUrl}`;
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  try {
    return new URL(origin).origin;
  } catch {
    throw new DocumentGenerationError(
      "L'URL de l'application est invalide. Vérifie NEXT_PUBLIC_APP_URL ou NEXT_PUBLIC_SITE_URL."
    );
  }
}

export async function generateUniqueDocumentRef(documentType: SupportedGeneratedDocumentType) {
  const supabase = await createClient();
  const prefix = DOCUMENT_CONFIG[documentType].prefix;
  const year = new Date().getUTCFullYear();
  const startOfYear = `${year}-01-01T00:00:00.000Z`;
  const startOfNextYear = `${year + 1}-01-01T00:00:00.000Z`;

  const { count, error } = await supabase
    .from("generated_documents")
    .select("*", { count: "exact", head: true })
    .eq("document_type", documentType)
    .gte("created_at", startOfYear)
    .lt("created_at", startOfNextYear);

  if (error) {
    throw new DocumentGenerationError("Impossible de calculer la référence du document.");
  }

  const sequence = String((count ?? 0) + 1).padStart(3, "0");
  return `${prefix}-${year}-${sequence}`;
}

async function ensureGenerationContext({
  sessionId,
  candidateId,
  type
}: CreateDocumentInput) {
  let sessionData;

  try {
    sessionData = await getSessionById(sessionId);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      throw new DocumentGenerationError("Session introuvable.");
    }

    throw error;
  }

  const organization = await getOrganizationSettings();
  const candidate = candidateId
    ? sessionData.candidates.find((item) => item.candidate.id === candidateId)?.candidate ?? null
    : null;

  if (DOCUMENT_CONFIG[type].requiresCandidate && !candidate) {
    throw new DocumentGenerationError("Le candidat demandé est introuvable pour cette session.");
  }

  return {
    session: sessionData.session,
    candidate,
    companyId: candidate?.company_id ?? null,
    organization
  };
}

export async function callExistingPdfGeneration(pathname: string) {
  const pdf = await fetchExistingPdf(pathname);

  const contentType = pdf.contentType ?? "";
  if (!contentType.includes("application/pdf")) {
    const responseText = Buffer.from(pdf.buffer).toString("utf-8");
    logDocumentGenerationError("invalid-pdf-response", {
      pathname,
      message: `Unexpected content-type: ${contentType}`,
      responseText
    });
    throw new DocumentGenerationError("La route PDF n'a pas retourné un document PDF valide.");
  }
}

export async function fetchExistingPdf(pathname: string) {
  const origin = await resolveAppOrigin();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const response = await fetch(new URL(pathname, origin), {
    method: "GET",
    headers: {
      Accept: "application/pdf",
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    logDocumentGenerationError("call-pdf-route", {
      pathname,
      status: response.status,
      statusText: response.statusText,
      responseText
    });
    throw new DocumentGenerationError(
      "Impossible de recuperer le PDF du devis. Verifie l'URL publique de l'application en production (APP_URL, NEXT_PUBLIC_APP_URL ou configuration Vercel)."
    );
  }

  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get("content-type"),
    origin
  };
}

export async function regenerateGeneratedDocument(documentId: string): Promise<GeneratedDocumentRow> {
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle<GeneratedDocumentRow>();

  if (error || !document) {
    throw new DocumentGenerationError("Document introuvable.");
  }

  const sourcePath = resolveStoredSourcePath(document);

  if (!sourcePath) {
    throw new DocumentGenerationError("Aucune route PDF n'est enregistrée pour ce document.");
  }

  await callExistingPdfGeneration(sourcePath);

  const { error: updateError } = await supabase
    .from("generated_documents")
    .update({
      status: "generated",
      updated_at: new Date().toISOString()
    })
    .eq("id", documentId)
    .select("id")
    .single();

  if (updateError) {
    throw new DocumentGenerationError("Le document a été régénéré mais son historique n'a pas pu être mis à jour.");
  }

  await persistGeneratedDocumentPdfToStorage({
    documentId,
    sourcePath
  });

  const { data: refreshedDocument, error: refreshedError } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle<GeneratedDocumentRow>();

  if (refreshedError || !refreshedDocument) {
    throw new DocumentGenerationError("Le document a ete regenere mais n'a pas pu etre recharge.");
  }

  return refreshedDocument;
}

export async function getLatestGeneratedDocumentByType(params: {
  sessionId: string;
  type: SupportedGeneratedDocumentType;
  candidateId?: string | null;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("generated_documents")
    .select("*")
    .eq("session_id", params.sessionId)
    .eq("document_type", params.type)
    .order("created_at", { ascending: false })
    .limit(1);

  query = params.candidateId ? query.eq("candidate_id", params.candidateId) : query.is("candidate_id", null);

  const { data, error } = await query.maybeSingle<GeneratedDocumentRow>();

  if (error) {
    throw new DocumentGenerationError("Impossible de charger le document existant.");
  }

  return data;
}

export async function getOrCreateDocument({
  sessionId,
  candidateId = null,
  type
}: CreateDocumentInput): Promise<GeneratedDocumentRow> {
  const existingDocument = await getLatestGeneratedDocumentByType({
    sessionId,
    candidateId,
    type
  });

  if (existingDocument) {
    return existingDocument;
  }

  return createDocument({
    sessionId,
    candidateId,
    type
  });
}

export async function createDocument({
  sessionId,
  candidateId = null,
  type
}: CreateDocumentInput): Promise<GeneratedDocumentRow> {
  try {
    const config = DOCUMENT_CONFIG[type];
    const context = await ensureGenerationContext({ sessionId, candidateId, type });
    const documentRef = await generateUniqueDocumentRef(type);
    const rawFilePath = config.buildPath?.({ sessionId, candidateId }) ?? null;
    const publicOrigin =
      type === "attestation" || type === "certificat" ? resolvePublicAppOrigin() : null;
    const verificationUrl =
      publicOrigin && (type === "attestation" || type === "certificat")
        ? buildDocumentVerificationUrl(publicOrigin, documentRef)
        : null;
    const filePath = rawFilePath
      ? appendQueryParams(rawFilePath, {
          ref: documentRef
        })
      : null;

    if (!filePath) {
      throw new DocumentGenerationError(
        `La génération du document "${type}" n'est pas encore disponible car aucune route PDF existante ne la prend en charge.`
      );
    }

    await callExistingPdfGeneration(filePath);

    const generatedDocument = await insertGeneratedDocumentRecord({
      sessionId,
      candidateId,
      companyId: context.companyId,
      documentType: type,
      documentRef,
      status: "generated",
      fileUrl: filePath,
      metadata: {
        session: {
          id: context.session.id,
          title: context.session.title
        },
        candidate: context.candidate
          ? {
              id: context.candidate.id,
              first_name: context.candidate.first_name,
              last_name: context.candidate.last_name
            }
          : null,
        organization: {
          name: context.organization.organization_name,
          siret: context.organization.siret,
          training_declaration_number: context.organization.training_declaration_number
        },
        verification: verificationUrl
          ? {
              ref: documentRef,
              url: verificationUrl
            }
          : null,
        document: {
          ref: documentRef
        }
      }
    });

    await persistGeneratedDocumentPdfToStorage({
      documentId: generatedDocument.id,
      sourcePath: filePath
    });

    const supabase = await createClient();
    const { data: refreshedDocument, error: refreshedError } = await supabase
      .from("generated_documents")
      .select("*")
      .eq("id", generatedDocument.id)
      .maybeSingle<GeneratedDocumentRow>();

    if (refreshedError || !refreshedDocument) {
      throw new DocumentGenerationError("Le document a ete genere mais n'a pas pu etre recharge.");
    }

    return refreshedDocument;
  } catch (error) {
    if (error instanceof DocumentGenerationError) {
      logDocumentGenerationError("create-document", {
        sessionId,
        candidateId,
        type,
        message: error.message
      });
      throw error;
    }

    logDocumentGenerationError("create-document-unexpected", {
      sessionId,
      candidateId,
      type,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    throw new DocumentGenerationError("Impossible de générer le document.");
  }
}
