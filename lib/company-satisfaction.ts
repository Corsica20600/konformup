import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getInvoiceById, type InvoiceDetail } from "@/lib/invoices";
import { buildPrivateAppUrl } from "@/lib/public-config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

const TOKEN_PREFIX = "cs1";
const TOKEN_PATTERN = /^cs1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/;
const PUBLIC_IDENTITIES = ["company_name", "first_name_initial", "anonymous"] as const;

export type CompanySatisfactionStatus = "pending" | "sent" | "completed" | "delivery_error";
export type CompanySatisfactionPublicIdentity = (typeof PUBLIC_IDENTITIES)[number];
export type CompanySatisfactionSurvey = Database["public"]["Tables"]["company_satisfaction_surveys"]["Row"];

export const companySatisfactionSubmissionSchema = z
  .object({
    overallRating: z.number().int().min(1).max(5),
    organizationRating: z.number().int().min(1).max(5),
    needsRating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional().nullable(),
    publicationConsent: z.boolean(),
    publicIdentity: z.enum(PUBLIC_IDENTITIES).optional().nullable()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.publicIdentity && !value.publicationConsent) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "L'identité publique requiert le consentement." });
    }
  });

export type CompanySatisfactionSubmission = z.infer<typeof companySatisfactionSubmissionSchema>;

function tokenSecret() {
  const secret = process.env.COMPANY_SATISFACTION_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Configuration du lien de satisfaction entreprise incomplète.");
  }
  return secret;
}

/** Raw tokens are never stored. A server-only HMAC permits reconstructing the same link for an invoice resend. */
export function buildCompanySatisfactionToken(invoiceId: string, secret = tokenSecret()) {
  const signature = createHmac("sha256", secret).update(`${TOKEN_PREFIX}:${invoiceId}`, "utf8").digest("base64url");
  return `${TOKEN_PREFIX}.${invoiceId}.${signature}`;
}

export function hashCompanySatisfactionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isCompanySatisfactionTokenFormat(token: string) {
  return TOKEN_PATTERN.test(token);
}

export function matchesCompanySatisfactionToken(token: string, hash: string) {
  const expected = Buffer.from(hash, "utf8");
  const actual = Buffer.from(hashCompanySatisfactionToken(token), "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function buildCompanySatisfactionPublicUrl(token: string) {
  return buildPrivateAppUrl(`/satisfaction-entreprise/${encodeURIComponent(token)}`).toString();
}

function surveyTokenForInvoice(invoiceId: string) {
  const token = buildCompanySatisfactionToken(invoiceId);
  return { token, tokenHash: hashCompanySatisfactionToken(token) };
}

export async function getOrCreateCompanySatisfactionSurveyForInvoice(invoiceId: string) {
  const invoice = await getInvoiceById(invoiceId);
  const initialToken = surveyTokenForInvoice(invoice.id);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_or_get_company_satisfaction_survey", {
    p_company_id: invoice.company.id,
    p_invoice_id: invoice.id,
    p_quote_id: invoice.quote.id,
    p_session_id: invoice.quote.session_id,
    p_token_hash: initialToken.tokenHash
  });

  if (error || !data?.[0]) throw new Error("Impossible de préparer la satisfaction entreprise.");

  const survey = data[0];
  const token = buildCompanySatisfactionToken(survey.invoice_id);
  if (!matchesCompanySatisfactionToken(token, survey.token_hash)) {
    throw new Error("Impossible de préparer la satisfaction entreprise.");
  }

  return {
    surveyId: survey.id,
    status: survey.status as CompanySatisfactionStatus,
    submittedAt: survey.submitted_at,
    token,
    url: buildCompanySatisfactionPublicUrl(token)
  };
}

export async function markCompanySatisfactionDelivery(surveyId: string, success: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_company_satisfaction_delivery", {
    p_survey_id: surveyId,
    p_success: success
  });
  if (error || !data) throw new Error("Impossible de mettre à jour l'envoi de satisfaction entreprise.");
  return data;
}

export async function getCompanySatisfactionPublicContext(token: string) {
  if (!isCompanySatisfactionTokenFormat(token)) return { state: "unavailable" as const };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_company_satisfaction_context", { p_token: token });
  const context = data?.[0];
  if (error || !context) return { state: "unavailable" as const };
  return context.completed
    ? { state: "already_completed" as const }
    : { state: "available" as const, companyName: context.company_name, trainingTitle: context.training_title };
}

export async function submitCompanySatisfaction(token: string, input: CompanySatisfactionSubmission) {
  if (!isCompanySatisfactionTokenFormat(token)) return "invalid" as const;
  const parsed = companySatisfactionSubmissionSchema.safeParse(input);
  if (!parsed.success) return "invalid" as const;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_company_satisfaction_survey", {
    p_token: token,
    p_overall_rating: parsed.data.overallRating,
    p_organization_rating: parsed.data.organizationRating,
    p_needs_rating: parsed.data.needsRating,
    p_comment: parsed.data.comment?.trim() || null,
    p_publication_consent: parsed.data.publicationConsent,
    p_public_identity: parsed.data.publicationConsent ? parsed.data.publicIdentity ?? null : null
  });
  return error || (data !== "submitted" && data !== "already_completed") ? ("invalid" as const) : data;
}

export async function getAuthorizedCompanySatisfactionSurveys(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_satisfaction_surveys")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Impossible de charger les satisfactions entreprise.");
  return data;
}

export function getCompanySatisfactionInvoiceScope(invoice: Pick<InvoiceDetail, "id" | "company" | "quote">) {
  return { companyId: invoice.company.id, invoiceId: invoice.id, quoteId: invoice.quote.id, sessionId: invoice.quote.session_id };
}
