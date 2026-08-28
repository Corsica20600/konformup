import { describe, expect, it } from "vitest";
import { getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository } from "./internal";
import { calculateTrainingNeedsProgress, finalizePublicTrainingNeedsAnalysisWithRepository, loadPublicTrainingNeedsAnalysisWithRepository, savePublicTrainingNeedsStepWithRepository } from "./public";
import { hashTrainingNeedsToken } from "./token";
import type { AccessibleQuote, PublicTrainingNeedsRepository, TrainingNeedsRepository, TrainingNeedsRow } from "./service-types";

const quote: AccessibleQuote = { id: "quote-1", company_id: "company-1", training_type: "sst_initial", quote_number: "DEV-1", title: "SST", candidate_count: 3, session_start_date: "2026-09-01", session_end_date: "2026-09-02", location: "Paris", company_name: "Acme" };
function row(overrides: Partial<TrainingNeedsRow> = {}): TrainingNeedsRow { return { id: "analysis-1", company_id: "company-1", quote_id: "quote-1", training_type: "sst_initial", status: "sent", answers: {}, current_step: 1, progress_percent: 0, respondent_name: null, respondent_role: null, respondent_email: null, first_opened_at: null, last_saved_at: null, completed_at: null, questionnaire_version: "1", quote_snapshot: { quoteNumber: "DEV-1", title: "SST", companyName: "Acme", candidateCount: 3, sessionStartDate: null, sessionEndDate: null, location: null }, token_hash: hashTrainingNeedsToken("A".repeat(43)), token_expires_at: "2099-01-01T00:00:00.000Z", created_by: "user-1", created_at: "2026-01-01", updated_at: "2026-01-01", ...overrides }; }
function publicRepo(current: TrainingNeedsRow): PublicTrainingNeedsRepository { return { findByTokenHash: async (hash) => current.token_hash === hash ? current : null, markFirstOpened: async () => { if (!current.first_opened_at) current.first_opened_at = "2026-01-01T00:00:00.000Z"; }, updateIfOpen: async (_id, values) => { if (current.status === "completed" || current.status === "cancelled") return null; Object.assign(current, values); return current; } }; }

describe("training needs services", () => {
  it("creates an analysis from the quote, then reuses it and handles uniqueness conflicts", async () => {
    let current: TrainingNeedsRow | null = null; let conflict = false;
    const repo: TrainingNeedsRepository = { getAccessibleQuote: async () => quote, findActiveByQuote: async () => current, getLatestByQuote: async () => current, createAnalysis: async (input) => { if (conflict) { current = row({ ...input }); const error = Object.assign(new Error("unique"), { code: "23505" }); throw error; } current = row({ ...input }); return current; }, getInternalAnalysis: async () => current, listCompanyAnalyses: async () => current ? [current] : [], updateInternal: async () => current, updateInternalIfTokenHash: async () => current };
    const created = await getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository(repo, quote.id, "user-1");
    expect(created.company_id).toBe("company-1"); expect(created.training_type).toBe("sst_initial");
    expect(await getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository(repo, quote.id, "user-1")).toBe(created);
    current = null; conflict = true; expect((await getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository(repo, quote.id, "user-1")).id).toBe("analysis-1");
  });
  it("rejects inaccessible quotes and unknown types", async () => {
    const base: TrainingNeedsRepository = { getAccessibleQuote: async () => null, findActiveByQuote: async () => null, getLatestByQuote: async () => null, createAnalysis: async () => row(), getInternalAnalysis: async () => null, listCompanyAnalyses: async () => [], updateInternal: async () => null, updateInternalIfTokenHash: async () => null };
    await expect(getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository(base, "other-company", "user-1")).rejects.toThrow("Devis introuvable");
    await expect(getOrCreateActiveTrainingNeedsAnalysisForQuoteWithRepository({ ...base, getAccessibleQuote: async () => ({ ...quote, training_type: "other" }) }, quote.id, "user-1")).rejects.toThrow("Type");
  });
  it("resolves a valid token idempotently without internal data", async () => {
    const current = row(); const view = await loadPublicTrainingNeedsAnalysisWithRepository(publicRepo(current), "A".repeat(43));
    expect(current.first_opened_at).not.toBeNull(); expect(view).not.toHaveProperty("tokenHash"); expect(view).not.toHaveProperty("companyId"); expect(view.isReadOnly).toBe(false);
    await loadPublicTrainingNeedsAnalysisWithRepository(publicRepo(current), "A".repeat(43)); expect(current.first_opened_at).toBe("2026-01-01T00:00:00.000Z");
  });
  it("returns public answers as ordinary serializable objects", async () => {
    const current = row({ answers: { respondent: { name: "Ada" } } });
    const view = await loadPublicTrainingNeedsAnalysisWithRepository(publicRepo(current), "A".repeat(43));
    expect(Object.getPrototypeOf(view.answers)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(view.answers.respondent)).toBe(Object.prototype);
    expect(JSON.parse(JSON.stringify(view.answers))).toEqual({ respondent: { name: "Ada" } });
  });
  it("rejects malformed, unknown, expired, and cancelled links", async () => {
    await expect(loadPublicTrainingNeedsAnalysisWithRepository(publicRepo(row()), "bad")).rejects.toThrow("Ce lien");
    await expect(loadPublicTrainingNeedsAnalysisWithRepository(publicRepo(row()), "B".repeat(43))).rejects.toThrow("Ce lien");
    await expect(loadPublicTrainingNeedsAnalysisWithRepository(publicRepo(row({ token_expires_at: "2000-01-01T00:00:00.000Z" })), "A".repeat(43))).rejects.toThrow("Ce lien");
    await expect(loadPublicTrainingNeedsAnalysisWithRepository(publicRepo(row({ status: "cancelled" })), "A".repeat(43))).rejects.toThrow("Ce lien");
  });
  it("saves a controlled partial answer and progresses", async () => {
    const current = row(); const view = await savePublicTrainingNeedsStepWithRepository(publicRepo(current), { token: "A".repeat(43), step: 1, data: { respondent: { name: " Ada ", role: " RH ", email: "ADA@EXAMPLE.TEST" } } });
    expect(current.status).toBe("in_progress"); expect((current.answers.respondent as { name: string }).name).toBe("Ada"); expect(view.progress.progressPercent).toBeGreaterThan(0);
    await expect(savePublicTrainingNeedsStepWithRepository(publicRepo(current), { token: "A".repeat(43), step: 2, data: { status: "completed" } })).rejects.toThrow("Données invalides");
  });
  it.each([
    ["mac_sst", { specific: { certificateStatus: "valid", lastTrainingDate: "2025-01-01", certificateReference: "SST-1", practiceNeeds: ["alert"] } }],
    ["hygiene", { specific: { sector: "retail", establishmentType: "Magasin", hygieneRisks: ["cleaning"] } }]
  ] as const)("saves a controlled %s partial answer", async (trainingType, data) => {
    const current = row({ training_type: trainingType });
    await savePublicTrainingNeedsStepWithRepository(publicRepo(current), { token: "A".repeat(43), step: 3, data });
    expect(current.answers.specific).toEqual(data.specific);
  });
  it("calculates type-specific progress and finalizes idempotently", async () => {
    const answers = { respondent: { name: "Ada", firstName: "Lovelace", role: "RH", email: "ada@example.test", phone: "0612345678" }, objectives: "Objectif", participantCount: 3, participantProfiles: ["Employé"], accessibilityNeeds: "Aucune", constraints: "Aucune", preferredDates: "Septembre", notes: "RAS", specific: { firstAidExperience: "none", workplaceRisks: ["falls"], emergencyEquipment: ["first_aid_kit"] } };
    expect(calculateTrainingNeedsProgress("sst_initial", answers).progressPercent).toBe(100);
    const current = row({ answers }); const repo = publicRepo(current);
    await expect(finalizePublicTrainingNeedsAnalysisWithRepository(repo, { token: "A".repeat(43), data: {} })).rejects.toThrow("incomplet");
  });
});
