import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

const ARCHIVE_BUCKET = "session-archives";
const MANIFEST_VERSION = "1";

export type ArchiveBlockers = {
  openSlots: number;
  pendingAttendance: number;
  incompleteEvaluations: number;
  missingDocuments: string[];
};

export function canCreateFinalArchive(blockers: ArchiveBlockers) {
  return blockers.openSlots === 0 && blockers.pendingAttendance === 0 && blockers.incompleteEvaluations === 0 && blockers.missingDocuments.length === 0;
}

export async function getSessionArchiveBlockers(sessionId: string): Promise<ArchiveBlockers> {
  const supabase = await createClient();
  const [{ data: slots }, { data: candidates }, { data: documents }] = await Promise.all([
    supabase.from("attendance_slots").select("id, status").eq("session_id", sessionId),
    supabase.from("candidates").select("id").eq("session_id", sessionId),
    supabase.from("generated_documents").select("candidate_id, document_type, status").eq("session_id", sessionId)
  ]);
  const slotIds = (slots ?? []).map((slot) => slot.id);
  const { data: responses } = slotIds.length
    ? await supabase.from("attendance_responses").select("response_status, trainer_override_status").in("attendance_slot_id", slotIds)
    : { data: [] as Array<{ response_status: string; trainer_override_status: string | null }> };
  const candidateIds = (candidates ?? []).map((candidate) => candidate.id);
  const { data: evaluations } = candidateIds.length
    ? await supabase.from("candidate_evaluations").select("candidate_id, evaluation_type, status, result, evaluated_at").eq("session_id", sessionId).in("candidate_id", candidateIds)
    : { data: [] as Array<{ candidate_id: string; evaluation_type: string; status: string; result: string; evaluated_at: string | null }> };
  const openSlots = (slots ?? []).filter((slot) => slot.status !== "closed").length;
  const pendingAttendance = (responses ?? []).filter((response) => (response.trainer_override_status ?? response.response_status) === "pending").length;
  const incompleteEvaluations = candidateIds.filter((candidateId) => {
    const entries = (evaluations ?? []).filter((entry) => entry.candidate_id === candidateId);
    const latest = (type: string) => entries.filter((entry) => entry.evaluation_type === type).sort((a, b) => (b.evaluated_at ?? "").localeCompare(a.evaluated_at ?? ""))[0];
    const global = latest("globale");
    if (!global || !["admis", "non_admis", "absent", "partiel"].includes(global.result)) return true;
    if (global.result === "absent") return false;
    return ["theorique", "pratique"].some((type) => !latest(type) || latest(type)?.status === "non_evalue");
  }).length;
  const documentRows = documents ?? [];
  const missingDocuments: string[] = [];
  if (!documentRows.some((document) => document.document_type === "bilan_session" && ["generated", "sent", "signed", "archived"].includes(document.status))) missingDocuments.push("Bilan de session");
  for (const candidateId of candidateIds) {
    const global = (evaluations ?? []).filter((entry) => entry.candidate_id === candidateId && entry.evaluation_type === "globale").sort((a, b) => (b.evaluated_at ?? "").localeCompare(a.evaluated_at ?? ""))[0];
    if (global?.result === "admis" && !documentRows.some((document) => document.candidate_id === candidateId && document.document_type === "attestation" && ["generated", "sent", "signed", "archived"].includes(document.status))) missingDocuments.push(`Attestation candidat ${candidateId}`);
  }
  return { openSlots, pendingAttendance, incompleteEvaluations, missingDocuments };
}

function hashManifest(manifest: object) {
  return createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
}

export async function createOrGetSessionArchive({ sessionId, archivedBy, trainerReport, administrativeObservations }: { sessionId: string; archivedBy: string; trainerReport?: string | null; administrativeObservations?: string | null }) {
  const supabase = await createClient();
  const blockers = await getSessionArchiveBlockers(sessionId);
  if (!canCreateFinalArchive(blockers)) return { ok: false as const, blockers };
  const { data: existing } = await supabase.from("session_archives").select("id, status, manifest_hash").eq("session_id", sessionId).eq("status", "complete").order("version", { ascending: false }).limit(1).maybeSingle();
  if (existing) return { ok: true as const, existing: true, archiveId: existing.id, manifestHash: existing.manifest_hash };

  const { data: session, error: sessionError } = await supabase.from("training_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (sessionError || !session) return { ok: false as const, blockers: { ...blockers, missingDocuments: [...blockers.missingDocuments, "Session inaccessible"] } };
  const [{ data: candidates }, { data: slots }, { data: evaluations }, { data: documents }, { data: surveys }] = await Promise.all([
    supabase.from("candidates").select("*").eq("session_id", sessionId),
    supabase.from("attendance_slots").select("*").eq("session_id", sessionId),
    supabase.from("candidate_evaluations").select("*").eq("session_id", sessionId),
    supabase.from("generated_documents").select("id, session_id, candidate_id, company_id, document_type, document_ref, version, status, file_url, metadata, created_at, updated_at").eq("session_id", sessionId),
    supabase.from("company_satisfaction_surveys").select("id, invoice_id, quote_id, status, sent_at, submitted_at, overall_rating, organization_rating, needs_rating, comment, publication_consent, public_identity, moderation_status").eq("session_id", sessionId)
  ]);
  const slotIds = (slots ?? []).map((slot) => slot.id);
  const { data: attendance } = slotIds.length ? await supabase.from("attendance_responses").select("*").in("attendance_slot_id", slotIds) : { data: [] };
  const candidateIds = (candidates ?? []).map((candidate) => candidate.id);
  const { data: candidateSurveys } = candidateIds.length ? await supabase.from("candidate_satisfaction_surveys").select("id, attendance_response_id, candidate_id, session_id, answers, submitted_at, created_at, updated_at").eq("session_id", sessionId) : { data: [] };
  const { data: sourceQuote } = session.source_quote_id ? await supabase.from("quotes").select("id, quote_number, company_id, company_name, title, status").eq("id", session.source_quote_id).maybeSingle() : { data: null };
  const { data: invoices } = session.source_quote_id ? await supabase.from("invoices").select("id, invoice_number, status, sent_at").eq("quote_id", session.source_quote_id) : { data: [] };
  const invoiceIds = (invoices ?? []).map((invoice) => invoice.id);
  const { data: complaints } = invoiceIds.length ? await supabase.from("invoice_complaints").select("id, invoice_id, status, severity, dissatisfaction_summary, created_at, updated_at").in("invoice_id", invoiceIds) : { data: [] };
  const complaintIds = (complaints ?? []).map((complaint) => complaint.id);
  const { data: complaintAttachments } = complaintIds.length ? await supabase.from("invoice_complaint_attachments").select("id, invoice_complaint_id, bucket_id, storage_path, original_filename, mime_type, size_bytes, created_at").in("invoice_complaint_id", complaintIds) : { data: [] };
  const archiveId = randomUUID();
  const { data: previous } = await supabase.from("session_archives").select("id, version").eq("session_id", sessionId).order("version", { ascending: false }).limit(1).maybeSingle();
  const version = (previous?.version ?? 0) + 1;
  const manifestSession = { ...session, trainer_report: trainerReport ?? session.trainer_report, administrative_observations: administrativeObservations ?? session.administrative_observations };
  const complaintFileHashes = new Map<string, string | null>();
  await Promise.all((complaintAttachments ?? []).map(async (attachment) => {
    const download = await supabase.storage.from(attachment.bucket_id).download(attachment.storage_path);
    if (download.error || !download.data) { complaintFileHashes.set(attachment.id, null); return; }
    complaintFileHashes.set(attachment.id, createHash("sha256").update(Buffer.from(await download.data.arrayBuffer())).digest("hex"));
  }));
  const manifestFiles = [
    ...(documents ?? []).map((document) => ({ id: document.id, type: document.document_type, reference: document.document_ref, bucket: null, storage_path: null, size_bytes: null, sha256: null })),
    ...(complaintAttachments ?? []).map((attachment) => ({ id: attachment.id, type: "complaint_attachment", reference: attachment.original_filename, bucket: attachment.bucket_id, storage_path: attachment.storage_path, size_bytes: attachment.size_bytes, sha256: complaintFileHashes.get(attachment.id) ?? null }))
  ];
  const manifest = { version: MANIFEST_VERSION, archived_at: new Date().toISOString(), session: manifestSession, source_quote: sourceQuote, invoices: invoices ?? [], candidates: candidates ?? [], attendance_slots: slots ?? [], attendance_responses: attendance ?? [], evaluations: evaluations ?? [], candidate_satisfaction: candidateSurveys ?? [], company_satisfaction: surveys ?? [], invoice_complaints: complaints ?? [], complaint_attachments: complaintAttachments ?? [], generated_documents: documents ?? [], files: manifestFiles, missing_items: [] as string[] };
  const manifestHash = hashManifest(manifest);
  const path = `sessions/${sessionId}/archives/${archiveId}/manifest.json`;
  const { error: insertError } = await supabase.from("session_archives").insert({ id: archiveId, session_id: sessionId, version, previous_archive_id: previous?.id ?? null, status: "building", manifest_version: MANIFEST_VERSION, manifest: manifest as unknown as Json, manifest_hash: null, manifest_storage_path: null, missing_items: [] as unknown as Json, archived_by: archivedBy });
  if (insertError) return { ok: false as const, blockers: { ...blockers, missingDocuments: [...blockers.missingDocuments, "Registre d’archive indisponible"] } };
  const upload = await supabase.storage.from(ARCHIVE_BUCKET).upload(path, Buffer.from(JSON.stringify(manifest)), { contentType: "application/json", upsert: false });
  if (upload.error) {
    await supabase.from("session_archives").update({ status: "error", error_summary: "Impossible d’enregistrer le manifeste privé." }).eq("id", archiveId);
    return { ok: false as const, blockers: { ...blockers, missingDocuments: [...blockers.missingDocuments, "Manifeste d’archive indisponible"] } };
  }
  const now = new Date().toISOString();
  const { error: completeError } = await supabase.from("session_archives").update({ status: "complete", manifest: manifest as unknown as Json, manifest_hash: manifestHash, manifest_storage_path: path, archived_at: now }).eq("id", archiveId);
  if (completeError) return { ok: false as const, blockers: { ...blockers, missingDocuments: [...blockers.missingDocuments, "Vérification d’archive échouée"] } };
  return { ok: true as const, existing: false, archiveId, manifestHash };
}

export async function createSessionArchiveSignedUrl(archiveId: string) {
  const supabase = await createClient();
  const { data: archive, error } = await supabase.from("session_archives").select("storage_bucket, manifest_storage_path").eq("id", archiveId).eq("status", "complete").maybeSingle();
  if (error || !archive?.manifest_storage_path) throw new Error("Archive indisponible.");
  const { data, error: signedError } = await supabase.storage.from(archive.storage_bucket).createSignedUrl(archive.manifest_storage_path, 300);
  if (signedError || !data?.signedUrl) throw new Error("Archive indisponible.");
  return data.signedUrl;
}
