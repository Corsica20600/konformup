import { fetchExistingPdf } from "@/lib/generated-documents";
import { createClient } from "@/lib/supabase/server";

const GENERATED_DOCUMENTS_BUCKET = "generated-documents";

type GeneratedDocumentStorageRow = {
  id: string;
  session_id: string | null;
  candidate_id: string | null;
  company_id: string | null;
  document_type: string;
  document_ref: string;
  version: number;
  file_url: string | null;
  metadata: unknown;
};

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document";
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeStorageMetadata(existing: unknown, storage: Record<string, unknown>) {
  if (isRecordObject(existing)) {
    return {
      ...existing,
      storage
    };
  }

  return { storage };
}

function resolveEntityPath(document: GeneratedDocumentStorageRow, metadata: unknown) {
  if (isRecordObject(metadata) && typeof metadata.quote_id === "string" && metadata.quote_id.length > 0) {
    return `quotes/${metadata.quote_id}/${sanitizeSegment(document.document_type)}`;
  }

  if (isRecordObject(metadata) && typeof metadata.invoice_id === "string" && metadata.invoice_id.length > 0) {
    return `invoices/${metadata.invoice_id}/${sanitizeSegment(document.document_type)}`;
  }

  if (document.session_id && document.candidate_id) {
    return `sessions/${document.session_id}/candidates/${document.candidate_id}/${sanitizeSegment(document.document_type)}`;
  }

  if (document.candidate_id) {
    return `candidates/${document.candidate_id}/${sanitizeSegment(document.document_type)}`;
  }

  const sessionValue = isRecordObject(metadata) ? metadata.session : null;
  if (isRecordObject(sessionValue) && typeof sessionValue.id === "string") {
    return `sessions/${sessionValue.id}/${sanitizeSegment(document.document_type)}`;
  }

  if (document.session_id) {
    return `sessions/${document.session_id}/${sanitizeSegment(document.document_type)}`;
  }

  if (document.company_id) {
    return `companies/${document.company_id}/${sanitizeSegment(document.document_type)}`;
  }

  return `documents/${sanitizeSegment(document.document_type)}/${document.id}`;
}

function buildStorageObjectPath(document: GeneratedDocumentStorageRow) {
  const basePath = resolveEntityPath(document, document.metadata);
  const fileName = `v${document.version}-${sanitizeSegment(document.document_ref)}.pdf`;

  return `${basePath}/${fileName}`;
}

export function buildGeneratedDocumentDeliveryUrl(documentId: string) {
  return `/api/documents/generated/${documentId}`;
}

export async function persistGeneratedDocumentPdfToStorage(params: {
  documentId: string;
  sourcePath: string;
}) {
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("generated_documents")
    .select("id, session_id, candidate_id, company_id, document_type, document_ref, version, file_url, metadata")
    .eq("id", params.documentId)
    .maybeSingle<GeneratedDocumentStorageRow>();

  if (error || !document) {
    throw new Error("Document genere introuvable pour la persistance Storage.");
  }

  const pdf = await fetchExistingPdf(params.sourcePath);
  const objectPath = buildStorageObjectPath(document);
  const upload = await supabase.storage
    .from(GENERATED_DOCUMENTS_BUCKET)
    .upload(objectPath, pdf.buffer, {
      contentType: "application/pdf",
      upsert: true
    });

  if (upload.error) {
    throw new Error(`Impossible d'envoyer le PDF dans Supabase Storage. ${upload.error.message}`.trim());
  }

  const storageMetadata = {
    bucket: GENERATED_DOCUMENTS_BUCKET,
    path: objectPath,
    source_path: params.sourcePath,
    persisted_at: new Date().toISOString()
  };

  const { data: updatedDocument, error: updateError } = await supabase
    .from("generated_documents")
    .update({
      file_url: buildGeneratedDocumentDeliveryUrl(document.id),
      metadata: mergeStorageMetadata(document.metadata, storageMetadata),
      updated_at: new Date().toISOString()
    })
    .eq("id", document.id)
    .select("id, file_url, metadata")
    .single();

  if (updateError || !updatedDocument) {
    throw new Error("Le PDF a ete stocke, mais la trace documentaire n'a pas pu etre mise a jour.");
  }

  return {
    fileUrl: updatedDocument.file_url ?? buildGeneratedDocumentDeliveryUrl(document.id),
    storagePath: objectPath
  };
}

export async function downloadStoredGeneratedDocument(documentId: string) {
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("generated_documents")
    .select("id, document_type, document_ref, metadata")
    .eq("id", documentId)
    .maybeSingle<{
      id: string;
      document_type: string;
      document_ref: string;
      metadata: unknown;
    }>();

  if (error || !document) {
    throw new Error("Document genere introuvable.");
  }

  const metadata = isRecordObject(document.metadata) ? document.metadata : null;
  const storage = metadata && isRecordObject(metadata.storage) ? metadata.storage : null;
  const storageBucket = storage && typeof storage.bucket === "string" ? storage.bucket : null;
  const storagePath = storage && typeof storage.path === "string" ? storage.path : null;

  if (storageBucket && storagePath) {
    const downloaded = await supabase.storage.from(storageBucket).download(storagePath);

    if (downloaded.error) {
      throw new Error(`Impossible de lire le document depuis Supabase Storage. ${downloaded.error.message}`.trim());
    }

    return {
      buffer: Buffer.from(await downloaded.data.arrayBuffer()),
      fileName: `${sanitizeSegment(document.document_ref)}.pdf`
    };
  }

  const fallbackPath = storage && typeof storage.source_path === "string" ? storage.source_path : null;
  if (!fallbackPath) {
    throw new Error("Aucune source documentaire n'est disponible pour ce document.");
  }

  const pdf = await fetchExistingPdf(fallbackPath);

  return {
    buffer: Buffer.from(pdf.buffer),
    fileName: `${sanitizeSegment(document.document_ref)}.pdf`
  };
}
