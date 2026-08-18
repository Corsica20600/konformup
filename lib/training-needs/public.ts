import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashTrainingNeedsToken, isTrainingNeedsTokenExpired, isTrainingNeedsTokenFormat } from "./token";
import type { PublicTrainingNeedsRepository, TrainingNeedsRow } from "./service-types";
import type { PublicTrainingNeedsAnalysisView, TrainingNeedsTrainingType } from "./types";
import { getTrainingNeedsPartialSaveSchemaV1, validateTrainingNeedsFinalV1 } from "./validation";

const PUBLIC_ERROR = "Ce lien n'est plus accessible.";
const MAX_STEP = 5;
type AnswerRecord = Record<string, unknown>;
function isRecord(value: unknown): value is AnswerRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function safeClone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(safeClone);
  if (!isRecord(value)) return value;
  const result: AnswerRecord = Object.create(null);
  for (const [key, child] of Object.entries(value)) { if (key !== "__proto__" && key !== "prototype" && key !== "constructor") result[key] = safeClone(child); }
  return result;
}
function mergeAnswers(existing: unknown, patch: unknown): AnswerRecord {
  const base = isRecord(existing) ? safeClone(existing) as AnswerRecord : Object.create(null);
  if (!isRecord(patch)) return base;
  for (const [key, value] of Object.entries(patch)) {
    if (key === "__proto__" || key === "prototype" || key === "constructor") continue;
    base[key] = isRecord(base[key]) && isRecord(value) ? mergeAnswers(base[key], value) : safeClone(value);
  }
  return base;
}
function filled(value: unknown) { return Array.isArray(value) ? value.length > 0 : typeof value === "number" ? value > 0 : typeof value === "string" ? value.length > 0 : Boolean(value); }
export function calculateTrainingNeedsProgress(trainingType: TrainingNeedsTrainingType, answers: unknown) {
  const data = isRecord(answers) ? answers : {}; const respondent = isRecord(data.respondent) ? data.respondent : {}; const specific = isRecord(data.specific) ? data.specific : {};
  const specificKeys = trainingType === "sst_initial" ? ["firstAidExperience", "workplaceRisks", "emergencyEquipment"] : trainingType === "mac_sst" ? ["certificateStatus", "lastTrainingDate", "certificateReference", "practiceNeeds"] : ["sector", "establishmentType", "hygieneRisks"];
  const groups = [Object.values(respondent).length === 3 && Object.values(respondent).every(filled), ["objectives", "participantCount", "participantProfiles"].every((key) => filled(data[key])), specificKeys.every((key) => filled(specific[key])), ["accessibilityNeeds", "constraints", "preferredDates"].every((key) => filled(data[key])), filled(data.notes)];
  const completed = groups.filter(Boolean).length;
  return { currentStep: Math.min(MAX_STEP, completed + 1), progressPercent: Math.round((completed / MAX_STEP) * 100) };
}
function publicView(row: TrainingNeedsRow): PublicTrainingNeedsAnalysisView {
  return { id: row.id, trainingType: row.training_type, status: row.status === "completed" ? "in_progress" : row.status === "sent" ? "sent" : "in_progress", questionnaireVersion: "1", quote: { quoteNumber: row.quote_snapshot.quoteNumber, title: row.quote_snapshot.title, companyName: row.quote_snapshot.companyName, sessionStartDate: row.quote_snapshot.sessionStartDate, sessionEndDate: row.quote_snapshot.sessionEndDate, location: row.quote_snapshot.location }, progress: { currentStep: row.current_step, progressPercent: row.progress_percent }, answers: safeClone(row.answers) as PublicTrainingNeedsAnalysisView["answers"], tokenExpiresAt: row.token_expires_at, isReadOnly: row.status === "completed" };
}
export function createSupabasePublicTrainingNeedsRepository(): PublicTrainingNeedsRepository {
  const supabase = createAdminClient();
  return {
    async findByTokenHash(tokenHash) { const { data } = await supabase.from("training_needs_analyses").select("id, company_id, quote_id, training_type, status, answers, current_step, progress_percent, respondent_name, respondent_role, respondent_email, first_opened_at, last_saved_at, completed_at, questionnaire_version, quote_snapshot, token_expires_at, created_by, created_at, updated_at").eq("token_hash", tokenHash).maybeSingle(); return data ? { ...data, token_hash: null } as TrainingNeedsRow : null; },
    async markFirstOpened(id) { await supabase.from("training_needs_analyses").update({ first_opened_at: new Date().toISOString() }).eq("id", id).is("first_opened_at", null); },
    async updateIfOpen(id, values) { const { data } = await supabase.from("training_needs_analyses").update(values).eq("id", id).in("status", ["draft", "sent", "in_progress"]).select("id, company_id, quote_id, training_type, status, answers, current_step, progress_percent, respondent_name, respondent_role, respondent_email, first_opened_at, last_saved_at, completed_at, questionnaire_version, quote_snapshot, token_expires_at, created_by, created_at, updated_at").maybeSingle(); return data ? { ...data, token_hash: null } as TrainingNeedsRow : null; }
  };
}
async function resolve(repository: PublicTrainingNeedsRepository, token: string, open = true) {
  if (!isTrainingNeedsTokenFormat(token)) throw new Error(PUBLIC_ERROR);
  const row = await repository.findByTokenHash(hashTrainingNeedsToken(token));
  if (!row || isTrainingNeedsTokenExpired(row.token_expires_at) || row.status === "cancelled") throw new Error(PUBLIC_ERROR);
  if (open && !row.first_opened_at) await repository.markFirstOpened(row.id);
  return row;
}
export async function loadPublicTrainingNeedsAnalysisWithRepository(repository: PublicTrainingNeedsRepository, token: string) { return publicView(await resolve(repository, token)); }
export async function loadPublicTrainingNeedsAnalysis(token: string) { return loadPublicTrainingNeedsAnalysisWithRepository(createSupabasePublicTrainingNeedsRepository(), token); }
export async function savePublicTrainingNeedsStepWithRepository(repository: PublicTrainingNeedsRepository, input: { token: string; step: number; data: unknown }) {
  if (!Number.isInteger(input.step) || input.step < 1 || input.step > MAX_STEP) throw new Error("Données invalides.");
  const row = await resolve(repository, input.token); if (row.status === "completed") throw new Error(PUBLIC_ERROR);
  const parsed = getTrainingNeedsPartialSaveSchemaV1(row.training_type).safeParse({ answers: input.data }); if (!parsed.success) throw new Error("Données invalides.");
  const answers = mergeAnswers(row.answers, parsed.data.answers); const progress = calculateTrainingNeedsProgress(row.training_type, answers);
  const updated = await repository.updateIfOpen(row.id, { answers, current_step: Math.max(row.current_step, input.step, progress.currentStep), progress_percent: progress.progressPercent, last_saved_at: new Date().toISOString(), status: "in_progress" });
  if (!updated) throw new Error(PUBLIC_ERROR); return publicView(updated);
}
export async function savePublicTrainingNeedsStep(input: { token: string; step: number; data: unknown }) { return savePublicTrainingNeedsStepWithRepository(createSupabasePublicTrainingNeedsRepository(), input); }
export async function finalizePublicTrainingNeedsAnalysisWithRepository(repository: PublicTrainingNeedsRepository, input: { token: string; data: unknown }) {
  const row = await resolve(repository, input.token); if (row.status === "completed") return publicView(row);
  const partial = getTrainingNeedsPartialSaveSchemaV1(row.training_type).safeParse({ answers: input.data }); if (!partial.success) throw new Error("Données invalides.");
  const answers = mergeAnswers(row.answers, partial.data.answers); const final = validateTrainingNeedsFinalV1(row.training_type, { ...answers, specific: answers.specific }); if (!final.success) throw new Error("Le questionnaire est incomplet ou invalide.");
  const now = new Date().toISOString(); const updated = await repository.updateIfOpen(row.id, { answers, respondent_name: final.data.respondent.name, respondent_role: final.data.respondent.role, respondent_email: final.data.respondent.email, current_step: MAX_STEP, progress_percent: 100, status: "completed", completed_at: now, last_saved_at: now });
  if (!updated) { const current = await resolve(repository, input.token, false); if (current.status === "completed") return publicView(current); throw new Error(PUBLIC_ERROR); }
  return publicView(updated);
}
export async function finalizePublicTrainingNeedsAnalysis(input: { token: string; data: unknown }) { return finalizePublicTrainingNeedsAnalysisWithRepository(createSupabasePublicTrainingNeedsRepository(), input); }
export async function getPublicTrainingNeedsSummary(token: string) { const row = await resolve(createSupabasePublicTrainingNeedsRepository(), token); if (row.status !== "completed") throw new Error(PUBLIC_ERROR); return publicView(row); }
