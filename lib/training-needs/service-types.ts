import type { TrainingNeedsAnalysisStatus, TrainingNeedsQuoteSnapshot, TrainingNeedsTrainingType } from "./types";

export type TrainingNeedsRow = {
  id: string; company_id: string; quote_id: string | null; training_type: TrainingNeedsTrainingType;
  status: TrainingNeedsAnalysisStatus; answers: Record<string, unknown>; current_step: number; progress_percent: number;
  respondent_name: string | null; respondent_role: string | null; respondent_email: string | null;
  first_opened_at: string | null; last_saved_at: string | null; completed_at: string | null;
  questionnaire_version: "1"; quote_snapshot: TrainingNeedsQuoteSnapshot; token_hash: string | null; token_expires_at: string | null;
  created_by: string | null; created_at: string; updated_at: string;
};
export type AccessibleQuote = {
  id: string; company_id: string; training_type: string; quote_number: string; title: string; candidate_count: number;
  session_start_date: string | null; session_end_date: string | null; location: string | null; company_name: string;
};
export type TrainingNeedsRepository = {
  getAccessibleQuote(quoteId: string): Promise<AccessibleQuote | null>;
  findActiveByQuote(quoteId: string): Promise<TrainingNeedsRow | null>;
  findActivePreQuote(companyId: string, trainingType: TrainingNeedsTrainingType): Promise<TrainingNeedsRow | null>;
  getLatestByQuote(quoteId: string): Promise<TrainingNeedsRow | null>;
  createAnalysis(input: Pick<TrainingNeedsRow, "company_id" | "quote_id" | "training_type" | "quote_snapshot" | "created_by">): Promise<TrainingNeedsRow>;
  getInternalAnalysis(id: string): Promise<TrainingNeedsRow | null>;
  listCompanyAnalyses(companyId: string): Promise<TrainingNeedsRow[]>;
  updateInternal(id: string, values: Partial<TrainingNeedsRow>): Promise<TrainingNeedsRow | null>;
  updateInternalIfTokenHash(id: string, expectedTokenHash: string, values: Partial<TrainingNeedsRow>): Promise<TrainingNeedsRow | null>;
};
export type PublicTrainingNeedsRepository = {
  findByTokenHash(tokenHash: string): Promise<TrainingNeedsRow | null>;
  updateIfOpen(id: string, values: Partial<TrainingNeedsRow>): Promise<TrainingNeedsRow | null>;
  markFirstOpened(id: string): Promise<void>;
};
