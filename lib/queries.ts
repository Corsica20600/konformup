import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/lib/database.types";
import { initializeSessionModuleProgress } from "@/lib/session-modules";
import type {
  ClientCompany,
  CompanyOption,
  DashboardStats,
  GeneratedDocumentItem,
  SessionCandidate,
  SessionItem,
  SessionModule,
  SessionSourceQuote,
  TrainingQuiz,
  TrainerOption
} from "@/lib/types";

type SessionModuleRow = {
  is_completed: boolean;
  completed_at: string | null;
  training_modules:
    | {
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
      }
    | {
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
      }[]
    | null;
};

export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} not found`);
    this.name = "SessionNotFoundError";
  }
}

export class RecoverableSessionQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecoverableSessionQueryError";
  }
}

export class CompanyNotFoundError extends Error {
  constructor(companyId: string) {
    super(`Company ${companyId} not found`);
    this.name = "CompanyNotFoundError";
  }
}

async function selectGeneratedDocumentsByForeignKey(
  field: "company_id" | "candidate_id" | "session_id",
  value: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_documents")
    .select("id, session_id, candidate_id, company_id, document_type, document_ref, version, status, file_url, metadata, created_at, updated_at")
    .eq(field, value)
    .order("created_at", { ascending: false });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "generated_documents",
    query: `select("id, session_id, candidate_id, company_id, document_type, document_ref, version, status, file_url, metadata, created_at, updated_at").eq("${field}", value).order("created_at")`,
    error
  });

  if (error) throw error;
  const documents = (data ?? []) as GeneratedDocumentItem[];
  const quoteIds = documents
    .map((document) => extractQuoteIdFromMetadata(document.metadata))
    .filter((quoteId): quoteId is string => Boolean(quoteId));
  const quoteStatuses = await selectQuoteStatusesByIds(quoteIds);
  const invoicesByQuoteId = await selectInvoicesByQuoteIds(quoteIds);
  const enrichedDocuments = documents.map((document) => {
    const quoteId = extractQuoteIdFromMetadata(document.metadata);
    const invoiceIdFromMetadata = extractInvoiceIdFromMetadata(document.metadata);
    const invoice = quoteId ? invoicesByQuoteId.get(quoteId) ?? null : null;

    return {
      ...document,
      quote_id: quoteId,
      quote_status: quoteId ? (quoteStatuses.get(quoteId) ?? null) : null,
      invoice_id: invoiceIdFromMetadata ?? invoice?.id ?? null,
      program_quote_id: document.document_type === "programme" ? extractProgramQuoteIdFromMetadata(document.metadata) : null,
      invoice_number:
        document.document_type === "invoice"
          ? document.document_ref
          : (invoice?.invoice_number ?? null)
    };
  });

  if (field !== "company_id") {
    return enrichedDocuments;
  }

  const companyInvoices = await selectInvoicesByCompanyId(value);
  const existingInvoiceIds = new Set(
    enrichedDocuments
      .map((document) => document.invoice_id)
      .filter((invoiceId): invoiceId is string => typeof invoiceId === "string" && invoiceId.length > 0)
  );
  const syntheticInvoiceDocuments = companyInvoices.map((invoice) => ({
    id: `invoice-${invoice.id}`,
    session_id: null,
    candidate_id: null,
    company_id: value,
    document_type: "invoice",
    document_ref: invoice.invoice_number,
    version: 1,
    status: "generated" as const,
    file_url: `/api/pdf/invoice/${invoice.id}`,
    metadata: {
      invoice_id: invoice.id,
      quote_id: invoice.quote_id
    },
    quote_id: invoice.quote_id,
    quote_status: null,
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at
  })).filter((document) => !existingInvoiceIds.has(document.invoice_id)) satisfies GeneratedDocumentItem[];

  return [...syntheticInvoiceDocuments, ...enrichedDocuments].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

function logSupabaseQueryError({
  file,
  table,
  query,
  error
}: {
  file: string;
  table: string;
  query: string;
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
}) {
  if (!error) {
    return;
  }

  const logLevel = isRecoverableSessionQueryError(error) ? console.warn : console.error;

  logLevel("[supabase-query-error]", {
    file,
    table,
    query,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}

function isMissingColumnError(error: { message?: string; details?: string } | null) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return text.includes("column") && text.includes("does not exist");
}

function isRecoverableSessionQueryError(error: {
  code?: string;
  message?: string;
  details?: string;
} | null) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();

  return (
    isMissingColumnError(error) ||
    error?.code === "42P01" ||
    error?.code === "PGRST200" ||
    error?.code === "PGRST116" ||
    text.includes("relationship") ||
    text.includes("schema cache") ||
    text.includes("does not exist")
  );
}

function logRecoverableSessionFallback({
  scope,
  error
}: {
  scope: "getSessions" | "getSessionById";
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
}) {
  console.warn("[recoverable-session-query-error]", {
    scope,
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint
  });
}

function extractQuoteIdFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const quoteId = (metadata as { quote_id?: unknown }).quote_id;
  return typeof quoteId === "string" && quoteId.length > 0 ? quoteId : null;
}

function extractInvoiceIdFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const invoiceId = (metadata as { invoice_id?: unknown }).invoice_id;
  return typeof invoiceId === "string" && invoiceId.length > 0 ? invoiceId : null;
}

function extractProgramQuoteIdFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const quoteId = (metadata as { quote_id?: unknown }).quote_id;
  return typeof quoteId === "string" && quoteId.length > 0 ? quoteId : null;
}

async function selectQuoteStatusesByIds(quoteIds: string[]) {
  if (!quoteIds.length) {
    return new Map<string, QuoteStatus>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, status")
    .in("id", Array.from(new Set(quoteIds)));

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "quotes",
    query: 'select("id, status").in("id", quoteIds)',
    error
  });

  if (isMissingColumnError(error)) {
    return new Map<string, QuoteStatus>();
  }

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((quote) => [quote.id, quote.status as QuoteStatus]));
}

async function selectInvoicesByQuoteIds(quoteIds: string[]) {
  if (!quoteIds.length) {
    return new Map<string, { id: string; invoice_number: string }>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, quote_id, invoice_number")
    .in("quote_id", Array.from(new Set(quoteIds)));

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "invoices",
    query: 'select("id, quote_id, invoice_number").in("quote_id", quoteIds)',
    error
  });

  if (isMissingColumnError(error)) {
    return new Map<string, { id: string; invoice_number: string }>();
  }

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((invoice) => [
      invoice.quote_id,
      {
        id: invoice.id,
        invoice_number: invoice.invoice_number
      }
    ])
  );
}

async function selectInvoicesByCompanyId(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, quote_id, invoice_number, created_at, updated_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "invoices",
    query: 'select("id, quote_id, invoice_number, created_at, updated_at").eq("company_id", companyId).order("created_at")',
    error
  });

  if (isMissingColumnError(error)) {
    return [];
  }

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function selectSessionsWithFallback() {
  const supabase = await createClient();
  const primary = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, status, source_quote_id, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at")
    .order("start_date", { ascending: false });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "training_sessions",
    query: 'select("id, title, start_date, end_date, location, status, source_quote_id, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at").order("start_date")',
    error: primary.error
  });

  if (!isMissingColumnError(primary.error)) {
    return primary;
  }

  const fallbackWithTrainer = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, status, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at")
    .order("start_date", { ascending: false });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "training_sessions",
    query: 'fallback select("id, title, start_date, end_date, location, status, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at").order("start_date")',
    error: fallbackWithTrainer.error
  });

  if (!isMissingColumnError(fallbackWithTrainer.error)) {
    return {
      data: (fallbackWithTrainer.data ?? []).map((session) => ({
        ...session,
        source_quote_id: null
      })),
      error: fallbackWithTrainer.error
    };
  }

  const fallback = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, status, trainer_user_id, created_at")
    .order("start_date", { ascending: false });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "training_sessions",
    query: 'fallback select("id, title, start_date, end_date, location, status, trainer_user_id, created_at").order("start_date")',
    error: fallback.error
  });

  return {
    data: (fallback.data ?? []).map((session) => ({
      ...session,
      source_quote_id: null,
      trainer_id: null,
      trainer_name: null,
      duration_hours: null
    })),
    error: fallback.error
  };
}

async function selectSessionByIdWithFallback(sessionId: string) {
  const supabase = await createClient();
  const primary = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, status, source_quote_id, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at")
    .eq("id", sessionId)
    .maybeSingle<SessionItem>();

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "training_sessions",
    query: 'select("id, title, start_date, end_date, location, status, source_quote_id, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at").eq("id", sessionId).maybeSingle()',
    error: primary.error
  });

  if (!isMissingColumnError(primary.error)) {
    return primary;
  }

  const fallbackWithTrainer = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, status, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at")
    .eq("id", sessionId)
    .maybeSingle<Omit<SessionItem, "source_quote_id">>();

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "training_sessions",
    query: 'fallback select("id, title, start_date, end_date, location, status, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at").eq("id", sessionId).maybeSingle()',
    error: fallbackWithTrainer.error
  });

  if (!isMissingColumnError(fallbackWithTrainer.error)) {
    return {
      data: fallbackWithTrainer.data
        ? {
            ...fallbackWithTrainer.data,
            source_quote_id: null
          }
        : null,
      error: fallbackWithTrainer.error
    };
  }

  const fallback = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, status, trainer_user_id, created_at")
    .eq("id", sessionId)
    .maybeSingle<Omit<SessionItem, "source_quote_id" | "trainer_id" | "trainer_name" | "duration_hours">>();

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "training_sessions",
    query: 'fallback select("id, title, start_date, end_date, location, status, trainer_user_id, created_at").eq("id", sessionId).maybeSingle()',
    error: fallback.error
  });

  return {
    data: fallback.data
      ? {
          ...fallback.data,
          source_quote_id: null,
          trainer_id: null,
          trainer_name: null,
          duration_hours: null
        }
      : null,
    error: fallback.error
  };
}

export async function getTrainerOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainers")
    .select("id, first_name, last_name, email, phone")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "trainers",
    query: 'select("id, first_name, last_name, email, phone").order("last_name").order("first_name")',
    error
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as TrainerOption[];
}

type SessionSourceQuoteRow = {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  company_id: string;
  title: string;
  client_companies:
    | {
        company_name: string;
      }
    | {
        company_name: string;
      }[]
    | null;
};

async function selectSessionSourceQuote(sourceQuoteId: string): Promise<SessionSourceQuote | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(`
      id,
      quote_number,
      status,
      company_id,
      title,
      client_companies (
        company_name
      )
    `)
    .eq("id", sourceQuoteId)
    .maybeSingle<SessionSourceQuoteRow>();

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "quotes -> client_companies",
    query: 'select("id, quote_number, status, company_id, title, client_companies(company_name)").eq("id", sourceQuoteId).maybeSingle()',
    error
  });

  if (error || !data) {
    return null;
  }

  const companyName = Array.isArray(data.client_companies)
    ? data.client_companies[0]?.company_name
    : data.client_companies?.company_name;

  if (!companyName) {
    return null;
  }

  return {
    id: data.id,
    quote_number: data.quote_number,
    status: data.status,
    company_id: data.company_id,
    company_name: companyName,
    title: data.title
  };
}

type CandidateSignatureParts = {
  first_name: string;
  last_name: string;
  email: string | null;
};

function buildCandidateSignature({ first_name, last_name, email }: CandidateSignatureParts) {
  return [first_name.trim().toLowerCase(), last_name.trim().toLowerCase(), (email ?? "").trim().toLowerCase()].join("::");
}

async function countAvailableCompanyCandidatesForSession(companyId: string, sessionCandidates: SessionCandidate[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("first_name, last_name, email")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "candidates",
    query: 'select("first_name, last_name, email").eq("company_id", companyId).order("created_at")',
    error
  });

  if (error) {
    throw error;
  }

  const existingSignatures = new Set(
    sessionCandidates.map((candidateSession) =>
      buildCandidateSignature({
        first_name: candidateSession.candidate.first_name,
        last_name: candidateSession.candidate.last_name,
        email: candidateSession.candidate.email
      })
    )
  );

  return (data ?? []).filter((candidate) => !existingSignatures.has(buildCandidateSignature(candidate))).length;
}

async function selectCandidatesBySessionIdWithFallback(sessionId: string) {
  const supabase = await createClient();
  const primary = await supabase
    .from("candidates")
    .select(`
      id,
      session_id,
      company_id,
      first_name,
      last_name,
      email,
      company,
      phone,
      job_title,
      address,
      postal_code,
      city,
      validation_status,
      validated_at,
      created_at,
      client_companies (
        company_name
      )
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "candidates",
    query: 'select("id, session_id, company_id, first_name, last_name, email, company, phone, job_title, address, postal_code, city, validation_status, validated_at, created_at, client_companies(company_name)").eq("session_id", sessionId).order("created_at")',
    error: primary.error
  });
  return primary;
}

async function selectSessionModulesBySessionIdWithFallback(sessionId: string) {
  const supabase = await createClient();
  const primary = await supabase
    .from("session_module_progress")
    .select(`
      is_completed,
      completed_at,
      training_modules!inner (
        id,
        title,
        summary,
        module_order,
        estimated_minutes,
        content_text,
        video_url,
        pdf_url,
        trainer_guidance,
        parent_module_id,
        module_type,
        is_active
      )
    `)
    .eq("session_id", sessionId)
    .eq("training_modules.is_active", true);

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "session_module_progress -> training_modules",
    query: 'select("is_completed, completed_at, training_modules!inner(id, title, summary, module_order, estimated_minutes, content_text, video_url, pdf_url, trainer_guidance, parent_module_id, module_type, is_active)").eq("session_id", sessionId).eq("training_modules.is_active", true)',
    error: primary.error
  });

  if (!isMissingColumnError(primary.error)) {
    return primary;
  }

  const fallback = await supabase
    .from("session_module_progress")
    .select(`
      is_completed,
      completed_at,
      training_modules (
        id,
        title,
        summary,
        module_order,
        estimated_minutes,
        content_text,
        video_url,
        pdf_url,
        parent_module_id,
        module_type,
        is_active
      )
    `)
    .eq("session_id", sessionId);

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "session_module_progress -> training_modules",
    query: 'fallback select("is_completed, completed_at, training_modules(id, title, summary, module_order, estimated_minutes, content_text, video_url, pdf_url, parent_module_id, module_type, is_active)").eq("session_id", sessionId)',
    error: fallback.error
  });

  return {
    data: ((fallback.data ?? []).map((row) => ({
      ...row,
      training_modules: Array.isArray(row.training_modules)
          ? row.training_modules.map((module) => ({
              ...module,
              trainer_guidance: null,
              parent_module_id: "parent_module_id" in module ? module.parent_module_id : null,
              module_type: "module_type" in module && module.module_type === "parent" ? "parent" : "child",
              is_active: "is_active" in module ? Boolean(module.is_active) : true
            }))
        : row.training_modules
          ? {
              ...(row.training_modules as Record<string, unknown>),
              trainer_guidance: null,
              parent_module_id:
                "parent_module_id" in (row.training_modules as Record<string, unknown>)
                  ? ((row.training_modules as Record<string, unknown>).parent_module_id as string | null)
                  : null,
              module_type:
                "module_type" in (row.training_modules as Record<string, unknown>) &&
                (row.training_modules as Record<string, unknown>).module_type === "parent"
                  ? "parent"
                  : "child",
              is_active:
                "is_active" in (row.training_modules as Record<string, unknown>)
                  ? Boolean((row.training_modules as Record<string, unknown>).is_active)
                  : true
            }
          : row.training_modules
    })) as SessionModuleRow[]),
    error: fallback.error
  };
}

export async function getSessions() {
  const { data, error } = await selectSessionsWithFallback();

  if (error) {
    if (isRecoverableSessionQueryError(error)) {
      logRecoverableSessionFallback({
        scope: "getSessions",
        error
      });
      throw new RecoverableSessionQueryError("Impossible de charger les sessions.");
    }

    throw error;
  }
  return (data ?? []) as SessionItem[];
}

export async function getSessionById(sessionId: string) {
  const { data: session, error: sessionError } = await selectSessionByIdWithFallback(sessionId);

  if (sessionError) {
    if (isRecoverableSessionQueryError(sessionError)) {
      logRecoverableSessionFallback({
        scope: "getSessionById",
        error: sessionError
      });
      throw new RecoverableSessionQueryError("Impossible de charger cette session.");
    }

    throw sessionError;
  }
  if (!session) throw new SessionNotFoundError(sessionId);

  await initializeSessionModuleProgress(sessionId);

  const { data: candidates, error: candidatesError } = await selectCandidatesBySessionIdWithFallback(sessionId);

  if (candidatesError) throw candidatesError;

  const normalizedCandidates = (candidates ?? []).map((candidate) => ({
    id: candidate.id,
    session_id: candidate.session_id,
    global_progress: 0,
    candidate: {
      id: candidate.id,
      session_id: candidate.session_id,
      company_id: candidate.company_id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      company:
        candidate.company ||
        (
          Array.isArray(candidate.client_companies)
            ? (candidate.client_companies[0] as { company_name?: string } | undefined)?.company_name
            : (candidate.client_companies as { company_name?: string } | null)?.company_name
        ) ||
        null,
      phone: candidate.phone,
      job_title: candidate.job_title,
      address: candidate.address,
      postal_code: candidate.postal_code,
      city: candidate.city,
      validation_status: candidate.validation_status,
      validated_at: candidate.validated_at
    }
  })) as SessionCandidate[];

  const { data: moduleRows, error: modulesError } = await selectSessionModulesBySessionIdWithFallback(sessionId);

  if (modulesError) throw modulesError;

  const normalizedModules = (moduleRows ?? [])
    .map((row) => {
      const trainingModule = Array.isArray(row.training_modules)
        ? row.training_modules[0]
        : row.training_modules;

      if (!trainingModule) {
        return null;
      }

      return {
        id: trainingModule.id,
        title: trainingModule.title,
        summary: trainingModule.summary,
        module_order: trainingModule.module_order,
        estimated_minutes: trainingModule.estimated_minutes,
        content_text: trainingModule.content_text,
        video_url: trainingModule.video_url,
        pdf_url: trainingModule.pdf_url,
        trainer_guidance: trainingModule.trainer_guidance,
        parent_module_id: trainingModule.parent_module_id,
        module_type: trainingModule.module_type,
        is_active: trainingModule.is_active,
        is_completed: row.is_completed,
        completed_at: row.completed_at
      };
    })
    .filter((module): module is SessionModule => module !== null && module.is_active)
    .sort((a, b) => {
      if (a.module_order !== b.module_order) {
        return a.module_order - b.module_order;
      }

      return a.title.localeCompare(b.title);
    });

  const completedModules = normalizedModules.filter((module) => module.is_completed).length;
  const globalProgress = normalizedModules.length
    ? Math.round((completedModules / normalizedModules.length) * 100)
    : 0;
  const sourceQuote = session.source_quote_id ? await selectSessionSourceQuote(session.source_quote_id) : null;
  const availableCompanyCandidateCount = sourceQuote
    ? await countAvailableCompanyCandidatesForSession(sourceQuote.company_id, normalizedCandidates)
    : 0;

  return {
    session,
    candidates: normalizedCandidates,
    modules: normalizedModules,
    globalProgress,
    sourceQuote,
    availableCompanyCandidateCount
  };
}

export async function getTrainingQuizzesByModuleId(moduleId: string) {
  if (!moduleId?.trim()) {
    console.error("[training-quizzes] missing module id", {
      file: "lib/queries.ts",
      fn: "getTrainingQuizzesByModuleId",
      moduleId
    });

    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_quizzes")
    .select("id, module_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation")
    .eq("module_id", moduleId)
    .order("id", { ascending: true });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "training_quizzes",
    query:
      'select("id, module_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation").eq("module_id", moduleId).order("id")',
    error
  });

  if (error) {
    console.error("[training-quizzes] query failed", {
      file: "lib/queries.ts",
      fn: "getTrainingQuizzesByModuleId",
      table: "training_quizzes",
      column: "module_id",
      moduleId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });

    return [];
  }

  return (data ?? []) as TrainingQuiz[];
}

export async function getDashboardStats() {
  const sessions = await getSessions();
  const supabase = await createClient();
  const { count } = await supabase.from("candidates").select("*", { count: "exact", head: true });

  const stats: DashboardStats = {
    totalSessions: sessions.length,
    inProgressSessions: sessions.filter((session) => session.status === "in_progress").length,
    totalCandidates: count ?? 0,
    completedSessions: sessions.filter((session) => session.status === "completed").length
  };

  return stats;
}

export async function getClientCompanies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_companies")
    .select("id, company_name, siret, address, postal_code, city, country, contact_first_name, contact_last_name, contact_email, contact_phone, notes, created_at, updated_at")
    .order("company_name", { ascending: true });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "client_companies",
    query: 'select("id, company_name, siret, address, postal_code, city, country, contact_first_name, contact_last_name, contact_email, contact_phone, notes, created_at, updated_at").order("company_name")',
    error
  });

  if (error) throw error;
  return (data ?? []) as unknown as ClientCompany[];
}

export async function getCompanyOptions() {
  const companies = await getClientCompanies();
  return companies.map((company) => ({
    id: company.id,
    company_name: company.company_name
  })) satisfies CompanyOption[];
}

export async function getClientCompanyById(companyId: string) {
  const supabase = await createClient();
  const { data: company, error: companyError } = await supabase
    .from("client_companies")
    .select("id, company_name, siret, address, postal_code, city, country, contact_first_name, contact_last_name, contact_email, contact_phone, notes, created_at, updated_at")
    .eq("id", companyId)
    .maybeSingle();

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "client_companies",
    query: 'select("id, company_name, siret, address, postal_code, city, country, contact_first_name, contact_last_name, contact_email, contact_phone, notes, created_at, updated_at").eq("id", companyId).maybeSingle()',
    error: companyError
  });

  if (companyError) throw companyError;
  if (!company) throw new CompanyNotFoundError(companyId);

  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select(`
      id,
      session_id,
      company_id,
      first_name,
      last_name,
      email,
      company,
      phone,
      job_title,
      address,
      postal_code,
      city,
      validation_status,
      validated_at,
      created_at,
      training_sessions (
        id,
        title,
        start_date
      )
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  logSupabaseQueryError({
    file: "lib/queries.ts",
    table: "candidates",
    query: 'select("id, session_id, company_id, first_name, last_name, email, company, phone, job_title, address, postal_code, city, validation_status, validated_at, created_at, training_sessions(id, title, start_date)").eq("company_id", companyId).order("created_at")',
    error: candidatesError
  });

  if (candidatesError) throw candidatesError;
  const documents = await getDocumentsByCompanyId(companyId);

  return {
    company: company as unknown as ClientCompany,
    candidates: candidates ?? [],
    documents
  };
}

export async function getDocumentsByCompanyId(companyId: string) {
  return selectGeneratedDocumentsByForeignKey("company_id", companyId);
}

export async function getDocumentsByCandidateId(candidateId: string) {
  return selectGeneratedDocumentsByForeignKey("candidate_id", candidateId);
}

export async function getDocumentsBySessionId(sessionId: string) {
  return selectGeneratedDocumentsByForeignKey("session_id", sessionId);
}
