import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type LegacyInvoiceRow = {
  id: string;
  invoice_number: string | null;
  quote_id: string;
  company_id: string;
  price_ht: number | string;
  vat_rate: number | string;
  total_ttc: number | string;
  created_at: string;
  updated_at: string;
};

type InvoiceBaseRow = Omit<InvoiceRow, "subtotal" | "tax_rate" | "tax_amount" | "total_ttc"> & {
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_ttc: number;
};

type InvoiceCompanyRow = {
  id: string;
  company_name: string;
  contact_email: string | null;
};

type InvoiceQuoteRow = {
  id: string;
  quote_number: string;
  title: string;
  status: QuoteRow["status"];
};

type InvoiceRelations = {
  client_companies: InvoiceCompanyRow | InvoiceCompanyRow[] | null;
  quotes: InvoiceQuoteRow | InvoiceQuoteRow[] | null;
};

export type InvoiceDetail = InvoiceBaseRow & {
  company: InvoiceCompanyRow;
  quote: InvoiceQuoteRow;
};

export class InvoiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceError";
  }
}

function logInvoiceCreate(step: string, details: Record<string, unknown>) {
  const logger = step.includes("error") ? console.error : console.info;
  logger("[invoice-create]", {
    step,
    ...details
  });
}

function formatInsertErrorMessage(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  const parts = [error.message, error.details, error.hint].filter(
    (value): value is string => Boolean(value && value.trim())
  );

  return `Erreur creation facture: ${parts.join(" | ")}`;
}

function normalizeInvoiceRow(row: InvoiceRow): InvoiceBaseRow {
  const legacyRow = row as unknown as Partial<LegacyInvoiceRow>;
  const subtotal = "subtotal" in row && row.subtotal != null ? Number(row.subtotal) : Number(legacyRow.price_ht ?? 0);
  const taxRate = "tax_rate" in row && row.tax_rate != null ? Number(row.tax_rate) : Number(legacyRow.vat_rate ?? 0);
  const totalTtc = Number(row.total_ttc ?? legacyRow.total_ttc ?? 0);
  const taxAmount =
    "tax_amount" in row && row.tax_amount != null ? Number(row.tax_amount) : Number((totalTtc - subtotal).toFixed(2));

  return {
    ...row,
    status: ("status" in row && row.status) || "draft",
    issue_date: ("issue_date" in row ? row.issue_date : null) ?? null,
    due_date: ("due_date" in row ? row.due_date : null) ?? null,
    notes: ("notes" in row ? row.notes : null) ?? null,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total_ttc: totalTtc
  };
}

function isLegacySchemaInsertError(error: { message?: string | null; details?: string | null; hint?: string | null } | null) {
  const haystack = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`.toLowerCase();

  return (
    haystack.includes("subtotal") ||
    haystack.includes("tax_rate") ||
    haystack.includes("tax_amount") ||
    haystack.includes("issue_date") ||
    haystack.includes("due_date") ||
    haystack.includes("status") ||
    haystack.includes("notes")
  );
}

async function selectInvoiceByQuoteId(quoteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle<InvoiceRow>();

  if (error) {
    throw new InvoiceError("Impossible de verifier les factures existantes pour ce devis.");
  }

  return data ? normalizeInvoiceRow(data) : null;
}

async function generateInvoiceNumber() {
  const supabase = await createClient();
  const year = new Date().getUTCFullYear();
  const startOfYear = `${year}-01-01T00:00:00.000Z`;
  const startOfNextYear = `${year + 1}-01-01T00:00:00.000Z`;

  const { count, error } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfYear)
    .lt("created_at", startOfNextYear);

  if (error) {
    throw new InvoiceError("Impossible de generer le numero de facture.");
  }

  return `FAC-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createInvoiceFromQuote(quoteId: string) {
  logInvoiceCreate("received", { quoteId });

  const supabase = await createClient();
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, quote_number, company_id, price_ht, vat_rate, total_ttc, status")
    .eq("id", quoteId)
    .maybeSingle<QuoteRow>();

  if (quoteError || !quote) {
    console.error("[invoice-create]", {
      step: "quote-load-error",
      quoteId,
      code: quoteError?.code,
      message: quoteError?.message,
      details: quoteError?.details,
      hint: quoteError?.hint
    });
    throw new InvoiceError("Devis introuvable.");
  }

  logInvoiceCreate("quote-loaded", {
    quoteId: quote.id,
    quoteNumber: quote.quote_number,
    companyId: quote.company_id,
    status: quote.status,
    priceHt: quote.price_ht,
    vatRate: quote.vat_rate,
    totalTtc: quote.total_ttc
  });

  if (!quote.status || quote.status.toLowerCase().trim() !== "accepted") {
    throw new InvoiceError("Seul un devis accepte peut etre facture.");
  }

  const existingInvoice = await selectInvoiceByQuoteId(quote.id);

  logInvoiceCreate("existing-invoice", {
    quoteId: quote.id,
    existingInvoiceId: existingInvoice?.id ?? null,
    existingInvoiceNumber: existingInvoice?.invoice_number ?? null
  });

  if (existingInvoice) {
    throw new InvoiceError("Une facture existe deja pour ce devis.");
  }

  const invoiceNumber = await generateInvoiceNumber();
  const now = new Date().toISOString();
  const taxAmount = Number((Number(quote.total_ttc) - Number(quote.price_ht)).toFixed(2));
  const payload: InvoiceInsert = {
    invoice_number: invoiceNumber,
    quote_id: quote.id,
    company_id: quote.company_id,
    status: "draft",
    issue_date: now.slice(0, 10),
    due_date: null,
    subtotal: quote.price_ht,
    tax_rate: quote.vat_rate,
    tax_amount: taxAmount,
    total_ttc: quote.total_ttc,
    notes: null,
    created_at: now,
    updated_at: now
  };

  logInvoiceCreate("insert-payload", { quoteId: quote.id, payload });

  let invoice: InvoiceRow | LegacyInvoiceRow | null = null;
  let insertError: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null = null;

  const modernInsert = await supabase.from("invoices").insert(payload).select("*").single();

  invoice = (modernInsert.data as InvoiceRow | null) ?? null;
  insertError = modernInsert.error;

  if (insertError) {
    logInvoiceCreate("insert-error", {
      quoteId: quote.id,
      payload,
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
  }

  if ((!invoice || insertError) && isLegacySchemaInsertError(insertError)) {
    const legacyPayload = {
      invoice_number: invoiceNumber,
      quote_id: quote.id,
      company_id: quote.company_id,
      price_ht: quote.price_ht,
      vat_rate: quote.vat_rate,
      created_at: now,
      updated_at: now
    };

    logInvoiceCreate("insert-payload-legacy", {
      quoteId: quote.id,
      payload: legacyPayload
    });

    const legacyInsert = await supabase.from("invoices").insert(legacyPayload).select("*").single();

    invoice = (legacyInsert.data as LegacyInvoiceRow | null) ?? null;
    insertError = legacyInsert.error;

    if (insertError) {
      logInvoiceCreate("insert-error-legacy", {
        quoteId: quote.id,
        payload: legacyPayload,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    }
  }

  if (insertError?.code === "23505") {
    throw new InvoiceError("Une facture existe deja pour ce devis.");
  }

  if (insertError) {
  throw new InvoiceError(formatInsertErrorMessage(insertError));
}

if (!invoice) {
  throw new InvoiceError(
    "Erreur creation facture | Aucun enregistrement retourne apres insertion."
  );
}

  logInvoiceCreate("insert-success", {
    invoiceId: invoice.id,
    quoteId: invoice.quote_id,
    invoiceNumber: invoice.invoice_number
  });

  return normalizeInvoiceRow(invoice as InvoiceRow);
}

export async function getInvoiceByQuoteId(quoteId: string) {
  return selectInvoiceByQuoteId(quoteId);
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceDetail> {
  const supabase = await createClient();
  const modernSelect = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      quote_id,
      company_id,
      status,
      issue_date,
      due_date,
      subtotal,
      tax_rate,
      tax_amount,
      total_ttc,
      notes,
      created_at,
      updated_at,
      client_companies (
        id,
        company_name,
        contact_email
      ),
      quotes (
        id,
        quote_number,
        title,
        status
      )
    `)
    .eq("id", invoiceId)
    .maybeSingle<
      InvoiceRow & {
        client_companies: InvoiceCompanyRow | InvoiceCompanyRow[] | null;
        quotes: InvoiceQuoteRow | InvoiceQuoteRow[] | null;
      }
    >();

  let data = modernSelect.data as (InvoiceRow & InvoiceRelations) | null;
  let error = modernSelect.error;

  if (error && isLegacySchemaInsertError(error)) {
    const legacySelect = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        quote_id,
        company_id,
        price_ht,
        vat_rate,
        total_ttc,
        created_at,
        updated_at,
        client_companies (
          id,
          company_name,
          contact_email
        ),
        quotes (
          id,
          quote_number,
          title,
          status
        )
      `)
      .eq("id", invoiceId)
      .maybeSingle<LegacyInvoiceRow & InvoiceRelations>();

    data = legacySelect.data as unknown as (InvoiceRow & InvoiceRelations) | null;
    error = legacySelect.error;
  }

  if (error || !data) {
    throw new InvoiceError("Facture introuvable.");
  }

  const company = Array.isArray(data.client_companies) ? data.client_companies[0] : data.client_companies;
  const quote = Array.isArray(data.quotes) ? data.quotes[0] : data.quotes;

  if (!company || !quote) {
    throw new InvoiceError("Facture incomplete.");
  }

  return {
    ...normalizeInvoiceRow(data),
    company,
    quote
  };
}
