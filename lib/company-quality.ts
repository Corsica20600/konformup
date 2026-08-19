import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCompanyQuality(companyId: string) {
  const supabase = await createClient();
  const [complaints, satisfaction] = await Promise.all([
    supabase.from("invoice_complaints").select("id, invoice_id, quote_id, status, severity, dissatisfaction_summary, customer_expectation, corrective_actions, preventive_actions, created_at, updated_at").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("company_satisfaction_surveys").select("id, invoice_id, session_id, status, sent_at, submitted_at, overall_rating, organization_rating, needs_rating, comment, publication_consent, public_identity, moderation_status, moderated_at, published_at").eq("company_id", companyId).order("created_at", { ascending: false })
  ]);
  const complaintRows = complaints.error ? [] : complaints.data ?? [];
  const attachmentResult = complaintRows.length ? await supabase.from("invoice_complaint_attachments").select("id, invoice_complaint_id, original_filename, mime_type, size_bytes, created_at").in("invoice_complaint_id", complaintRows.map((item) => item.id)).order("created_at", { ascending: false }) : { data: [], error: null };
  const attachments = new Map<string, { id: string; original_filename: string; mime_type: string; size_bytes: number; created_at: string }[]>();
  (attachmentResult.data ?? []).forEach((item) => attachments.set(item.invoice_complaint_id, [...(attachments.get(item.invoice_complaint_id) ?? []), item]));
  return { complaints: complaints.error ? null : complaintRows.map((item) => ({ ...item, attachments: attachments.get(item.id) ?? [] })), complaintsError: complaints.error || attachmentResult.error ? "Impossible de charger les réclamations." : null, satisfaction: satisfaction.error ? null : satisfaction.data ?? [], satisfactionError: satisfaction.error ? "Impossible de charger les satisfactions." : null };
}
