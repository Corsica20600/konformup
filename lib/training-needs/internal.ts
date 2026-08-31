import "server-only";

import { requireAuthenticatedUser, ResourceNotFoundError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildTrainingNeedsPublicUrl, generateTrainingNeedsToken, hashTrainingNeedsToken } from "./token";
import type { AccessibleQuote, TrainingNeedsRepository, TrainingNeedsRow } from "./service-types";
import { trainingNeedsTrainingTypes, type TrainingNeedsQuoteSnapshot, type TrainingNeedsTrainingType } from "./types";

const ACTIVE_STATUSES = new Set(["draft", "sent", "in_progress"]);
function isTrainingType(value: string): value is TrainingNeedsTrainingType { return trainingNeedsTrainingTypes.includes(value as TrainingNeedsTrainingType); }
function snapshot(quote: AccessibleQuote): TrainingNeedsQuoteSnapshot {
  return { quoteNumber: quote.quote_number, title: quote.title, companyName: quote.company_name, candidateCount: quote.candidate_count, sessionStartDate: quote.session_start_date, sessionEndDate: quote.session_end_date, location: quote.location };
}
const trainingTypeLabels: Record<TrainingNeedsTrainingType, string> = { sst_initial: "SST initial", mac_sst: "MAC SST", hygiene: "Hygiène" };

export async function createSupabaseInternalTrainingNeedsRepository(): Promise<TrainingNeedsRepository> {
  const supabase = await createClient();
  return {
    async getAccessibleQuote(quoteId) {
      const { data } = await supabase.from("quotes").select("id, company_id, training_type, quote_number, title, candidate_count, session_start_date, session_end_date, location, client_companies(company_name)").eq("id", quoteId).maybeSingle();
      const company = data && (Array.isArray(data.client_companies) ? data.client_companies[0] : data.client_companies);
      return data && company ? { ...data, company_name: company.company_name } as AccessibleQuote : null;
    },
    async findActiveByQuote(quoteId) { const { data } = await supabase.from("training_needs_analyses").select("*").eq("quote_id", quoteId).in("status", [...ACTIVE_STATUSES]).maybeSingle(); return data as TrainingNeedsRow | null; },
    async getLatestByQuote(quoteId) { const { data } = await supabase.from("training_needs_analyses").select("*").eq("quote_id", quoteId).order("created_at", { ascending: false }).limit(1).maybeSingle(); return data as TrainingNeedsRow | null; },
    async createAnalysis(input) { const { data, error } = await supabase.from("training_needs_analyses").insert(input).select("*").single(); if (error) throw Object.assign(new Error("Création impossible."), { code: error.code }); return data as TrainingNeedsRow; },
    async getInternalAnalysis(id) { const { data } = await supabase.from("training_needs_analyses").select("*").eq("id", id).maybeSingle(); return data as TrainingNeedsRow | null; },
    async listCompanyAnalyses(companyId) { const { data } = await supabase.from("training_needs_analyses").select("*").eq("company_id", companyId).order("created_at", { ascending: false }); return (data ?? []) as TrainingNeedsRow[]; },
    async updateInternal(id, values) { const { data } = await supabase.from("training_needs_analyses").update(values).eq("id", id).select("*").maybeSingle(); return data as TrainingNeedsRow | null; }
    ,async updateInternalIfTokenHash(id, expectedTokenHash, values) { const { data } = await supabase.from("training_needs_analyses").update(values).eq("id", id).eq("token_hash", expectedTokenHash).select("*").maybeSingle(); return data as TrainingNeedsRow | null; }
  };
}

export async function getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository(repository: TrainingNeedsRepository, quoteId: string, userId: string) {
  const quote = await repository.getAccessibleQuote(quoteId);
  if (!quote) throw new ResourceNotFoundError("Devis introuvable.");
  if (!isTrainingType(quote.training_type)) throw new Error("Type de formation non pris en charge.");
  const active = await repository.findActiveByQuote(quoteId);
  if (active) return active;
  try { return await repository.createAnalysis({ company_id: quote.company_id, quote_id: quote.id, training_type: quote.training_type, quote_snapshot: snapshot(quote), created_by: userId }); }
  catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "23505") { const concurrent = await repository.findActiveByQuote(quoteId); if (concurrent) return concurrent; } throw error; }
}
export async function getOrCreateActiveTrainingNeedsAnalysisForQuote(quoteId: string) {
  const { user } = await requireAuthenticatedUser();
  return getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository(await createSupabaseInternalTrainingNeedsRepository(), quoteId, user.id);
}
export async function createPreQuoteTrainingNeedsAnalysis(companyId: string, trainingType: TrainingNeedsTrainingType) {
  const { user } = await requireAuthenticatedUser();
  if (!isTrainingType(trainingType)) throw new Error("Type de formation non pris en charge.");
  const supabase = await createClient();
  const { data: company } = await supabase.from("client_companies").select("company_name").eq("id", companyId).maybeSingle();
  if (!company) throw new ResourceNotFoundError("Société introuvable.");
  const repository = await createSupabaseInternalTrainingNeedsRepository();
  return repository.createAnalysis({ company_id: companyId, quote_id: null, training_type: trainingType, quote_snapshot: { quoteNumber: "Devis à établir", title: `Analyse préalable — ${trainingTypeLabels[trainingType]}`, companyName: company.company_name, candidateCount: 0, sessionStartDate: null, sessionEndDate: null, location: null }, created_by: user.id });
}
export async function linkTrainingNeedsAnalysisToQuote(analysisId: string, quoteId: string) {
  await requireAuthenticatedUser();
  const repository = await createSupabaseInternalTrainingNeedsRepository();
  const [analysis, quote] = await Promise.all([repository.getInternalAnalysis(analysisId), repository.getAccessibleQuote(quoteId)]);
  if (!analysis || !quote || analysis.company_id !== quote.company_id || analysis.training_type !== quote.training_type) throw new Error("L’analyse ne correspond pas au devis.");
  if (analysis.status !== "completed") throw new Error("Finalisez l’analyse des besoins avant de créer le devis.");
  if (analysis.quote_id && analysis.quote_id !== quoteId) throw new Error("Cette analyse est déjà liée à un autre devis.");
  const updated = await repository.updateInternal(analysisId, { quote_id: quote.id, quote_snapshot: snapshot(quote) });
  if (!updated) throw new Error("Impossible de relier l’analyse au devis.");
  return updated;
}
export async function getInternalTrainingNeedsAnalysis(analysisId: string) { await requireAuthenticatedUser(); const row = await (await createSupabaseInternalTrainingNeedsRepository()).getInternalAnalysis(analysisId); if (!row) throw new ResourceNotFoundError("Analyse introuvable."); return row; }
export async function listTrainingNeedsAnalysesForCompany(companyId: string) { await requireAuthenticatedUser(); return (await createSupabaseInternalTrainingNeedsRepository()).listCompanyAnalyses(companyId); }
export async function getLatestTrainingNeedsAnalysisForQuote(quoteId: string) { await requireAuthenticatedUser(); return (await createSupabaseInternalTrainingNeedsRepository()).getLatestByQuote(quoteId); }
export async function prepareTrainingNeedsPublicAccess(analysisId: string, expiresInDays = 30) {
  await requireAuthenticatedUser();
  const repository = await createSupabaseInternalTrainingNeedsRepository(); const analysis = await repository.getInternalAnalysis(analysisId);
  if (!analysis) throw new ResourceNotFoundError("Analyse introuvable."); if (!ACTIVE_STATUSES.has(analysis.status)) throw new Error("Cette analyse ne peut plus recevoir de lien public.");
  const token = generateTrainingNeedsToken(); const expiresAt = new Date(Date.now() + Math.max(1, Math.min(expiresInDays, 90)) * 86_400_000).toISOString();
  const updated = await repository.updateInternal(analysis.id, { token_hash: hashTrainingNeedsToken(token), token_expires_at: expiresAt });
  if (!updated) throw new Error("Impossible de préparer l'accès public.");
  return { token, url: buildTrainingNeedsPublicUrl(token), expiresAt };
}
/** Rotation used only by the quote-email server workflow. The previous hash never crosses a public boundary. */
export async function rotateTrainingNeedsPublicAccessForEmail(analysisId: string, expiresInDays = 30) {
  await requireAuthenticatedUser();
  const repository = await createSupabaseInternalTrainingNeedsRepository(); const analysis = await repository.getInternalAnalysis(analysisId);
  if (!analysis) throw new ResourceNotFoundError("Analyse introuvable."); if (!ACTIVE_STATUSES.has(analysis.status)) throw new Error("Cette analyse ne peut plus recevoir de lien public.");
  const token = generateTrainingNeedsToken(); const tokenHash = hashTrainingNeedsToken(token); const expiresAt = new Date(Date.now() + Math.max(1, Math.min(expiresInDays, 90)) * 86_400_000).toISOString();
  if (!await repository.updateInternal(analysis.id, { token_hash: tokenHash, token_expires_at: expiresAt })) throw new Error("Impossible de préparer l'accès public.");
  return { token, url: buildTrainingNeedsPublicUrl(token), analysisId: analysis.id, tokenHash, previousTokenHash: analysis.token_hash, previousExpiresAt: analysis.token_expires_at, previousStatus: analysis.status };
}
export async function confirmTrainingNeedsEmailRotation(rotation: { analysisId: string; tokenHash: string; previousStatus: TrainingNeedsRow["status"] }) {
  await requireAuthenticatedUser(); const repository = await createSupabaseInternalTrainingNeedsRepository();
  return repository.updateInternalIfTokenHash(rotation.analysisId, rotation.tokenHash, { status: rotation.previousStatus === "draft" ? "sent" : rotation.previousStatus });
}
export async function rollbackTrainingNeedsEmailRotation(rotation: { analysisId: string; tokenHash: string; previousTokenHash: string | null; previousExpiresAt: string | null; previousStatus: TrainingNeedsRow["status"] }) {
  await requireAuthenticatedUser(); const repository = await createSupabaseInternalTrainingNeedsRepository();
  return repository.updateInternalIfTokenHash(rotation.analysisId, rotation.tokenHash, { token_hash: rotation.previousTokenHash, token_expires_at: rotation.previousExpiresAt, status: rotation.previousStatus });
}
export async function cancelTrainingNeedsAnalysis(analysisId: string) { await requireAuthenticatedUser(); const repository = await createSupabaseInternalTrainingNeedsRepository(); const analysis = await repository.getInternalAnalysis(analysisId); if (!analysis) throw new ResourceNotFoundError("Analyse introuvable."); if (analysis.status === "completed") throw new Error("Une analyse finalisée ne peut pas être annulée."); return repository.updateInternal(analysisId, { status: "cancelled" }); }
