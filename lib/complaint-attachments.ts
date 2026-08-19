import "server-only";

import { randomUUID } from "node:crypto";
import { requireAuthenticatedUser, AuthenticationError, AuthorizationError, ResourceNotFoundError } from "@/lib/auth";
import { validateComplaintFile } from "@/lib/complaint-attachment-validation";

const BUCKET = "complaint-attachments";
const SIGNED_URL_SECONDS = 5 * 60;
export type ComplaintAttachmentFailure = "unauthenticated" | "unauthorized" | "invalid_file" | "upload_failed" | "registry_failed_cleaned" | "registry_failed_cleanup_failed" | "not_found";
export class ComplaintAttachmentError extends Error { constructor(public readonly code: ComplaintAttachmentFailure, message: string) { super(message); this.name = "ComplaintAttachmentError"; } }

type AttachmentRow = { id: string; invoice_complaint_id: string; bucket_id: string; storage_path: string; original_filename: string; mime_type: string; size_bytes: number; uploaded_by: string; created_at: string };

async function complaintContext(complaintId: string) {
  try {
    const context = await requireAuthenticatedUser();
    const { data, error } = await context.supabase.from("invoice_complaints").select("id, company_id").eq("id", complaintId).maybeSingle<{ id: string; company_id: string }>();
    if (error || !data) throw new AuthorizationError();
    return { ...context, complaint: data };
  } catch (error) {
    if (error instanceof AuthenticationError) throw new ComplaintAttachmentError("unauthenticated", "Authentification requise.");
    if (error instanceof AuthorizationError || error instanceof ResourceNotFoundError) throw new ComplaintAttachmentError("unauthorized", "Accès refusé.");
    throw error;
  }
}

export async function uploadComplaintAttachment(complaintId: string, file: File) {
  const context = await complaintContext(complaintId);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let validated;
  try { validated = validateComplaintFile({ name: file.name, type: file.type, size: file.size, bytes }); }
  catch (error) { throw new ComplaintAttachmentError("invalid_file", error instanceof Error ? error.message : "Fichier invalide."); }
  const id = randomUUID();
  const path = `companies/${context.complaint.company_id}/complaints/${complaintId}/${id}.${validated.extension}`;
  const { error: uploadError } = await context.supabase.storage.from(BUCKET).upload(path, bytes, { contentType: validated.mime, upsert: false });
  if (uploadError) throw new ComplaintAttachmentError("upload_failed", "Impossible de téléverser le fichier.");
  const payload = { id, invoice_complaint_id: complaintId, bucket_id: BUCKET, storage_path: path, original_filename: validated.filename, mime_type: validated.mime, size_bytes: validated.size, uploaded_by: context.user.id };
  const { data, error } = await context.supabase.from("invoice_complaint_attachments").insert(payload).select("*").maybeSingle<AttachmentRow>();
  if (error || !data) {
    const { error: cleanupError } = await context.supabase.storage.from(BUCKET).remove([path]);
    throw new ComplaintAttachmentError(cleanupError ? "registry_failed_cleanup_failed" : "registry_failed_cleaned", "Le registre de la pièce n'a pas pu être enregistré.");
  }
  return data;
}

export async function listComplaintAttachments(complaintId: string) {
  const context = await complaintContext(complaintId);
  const { data, error } = await context.supabase.from("invoice_complaint_attachments").select("id, original_filename, mime_type, size_bytes, uploaded_by, created_at").eq("invoice_complaint_id", complaintId).order("created_at", { ascending: false });
  if (error) throw new ComplaintAttachmentError("unauthorized", "Impossible de charger les pièces.");
  return data;
}

export async function createComplaintAttachmentSignedUrl(attachmentId: string) {
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase.from("invoice_complaint_attachments").select("id, bucket_id, storage_path").eq("id", attachmentId).maybeSingle<Pick<AttachmentRow, "id" | "bucket_id" | "storage_path">>();
  if (error || !data) throw new ComplaintAttachmentError("not_found", "Pièce introuvable.");
  const { data: signed, error: signedError } = await supabase.storage.from(data.bucket_id).createSignedUrl(data.storage_path, SIGNED_URL_SECONDS);
  if (signedError || !signed?.signedUrl) throw new ComplaintAttachmentError("not_found", "Impossible d’ouvrir la pièce.");
  return { url: signed.signedUrl, expiresIn: SIGNED_URL_SECONDS };
}
