import type { CandidateValidationStatus, QuoteStatus } from "@/lib/database.types";

export type UserRole = "admin" | "trainer";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
};

export type SessionItem = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  status: "draft" | "scheduled" | "in_progress" | "completed" | "cancelled";
  source_quote_id: string | null;
  trainer_id: string | null;
  trainer_user_id: string | null;
  trainer_name: string | null;
  duration_hours: number | null;
  created_at: string;
};

export type Candidate = {
  id: string;
  session_id: string | null;
  company_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  job_title: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  validation_status: CandidateValidationStatus;
  validated_at: string | null;
};

export type SessionCandidate = {
  id: string;
  session_id: string;
  global_progress: number;
  candidate: Candidate;
};

export type ClientCompany = {
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
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyOption = {
  id: string;
  company_name: string;
};

export type OrganizationSettings = {
  id?: string;
  organization_name: string;
  address: string;
  siret: string | null;
  training_declaration_number: string | null;
  qualiopi_mention: string | null;
  logo_url: string | null;
  signature_url: string | null;
  certificate_signatory_name: string | null;
  certificate_signatory_title: string | null;
};

export type OrganizationBranding = OrganizationSettings & {
  resolved_logo_url: string | null;
  resolved_signature_url: string | null;
};

export type SessionModule = {
  id: string;
  title: string;
  summary: string | null;
  module_order: number;
  estimated_minutes: number | null;
  content_text: string | null;
  video_url: string | null;
  pdf_url: string | null;
  trainer_guidance: string | null;
  parent_module_id: string | null;
  module_type: "parent" | "child";
  is_active: boolean;
  is_completed: boolean;
  completed_at: string | null;
};

export type SessionModuleGroup = {
  parent: SessionModule;
  children: SessionModule[];
};

export type DashboardStats = {
  totalSessions: number;
  inProgressSessions: number;
  totalCandidates: number;
  completedSessions: number;
};

export type GeneratedDocumentItem = {
  id: string;
  session_id: string | null;
  candidate_id: string | null;
  company_id: string | null;
  document_type: string;
  document_ref: string;
  version: number;
  status: "draft" | "generated" | "sent" | "signed" | "archived";
  file_url: string | null;
  metadata: unknown;
  quote_id?: string | null;
  quote_status?: QuoteStatus | null;
  invoice_id?: string | null;
  invoice_number?: string | null;
  program_quote_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionSourceQuote = {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  company_id: string;
  company_name: string;
  title: string;
};

export type TrainerOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};
