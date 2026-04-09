import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];

type InvoiceBaseRow = Omit<InvoiceRow, "price_ht" | "vat_rate" | "total_ttc"> & {
  price_ht: number;
  vat_rate: number;
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

function normalizeInvoiceRow(row: InvoiceRow): InvoiceBaseRow {
  return {
    ...row,
    price_ht: Number(row.price_ht),
    vat_rate: Number(row.vat_rate),
    total_ttc: Number(row.total_ttc)
  };
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
  const supabase = await createClient();
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, quote_number, company_id, price_ht, vat_rate, total_ttc, status")
    .eq("id", quoteId)
    .maybeSingle<QuoteRow>();

  if (quoteError || !quote) {
    throw new InvoiceError("Devis introuvable.");
  }

  if (quote.status !== "accepted") {
    throw new InvoiceError("Seul un devis accepte peut etre facture.");
  }

  const existingInvoice = await selectInvoiceByQuoteId(quote.id);

  if (existingInvoice) {
    throw new InvoiceError("Une facture existe deja pour ce devis.");
  }

  const invoiceNumber = await generateInvoiceNumber();
  const now = new Date().toISOString();
  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      quote_id: quote.id,
      company_id: quote.company_id,
      price_ht: quote.price_ht,
      vat_rate: quote.vat_rate,
      created_at: now,
      updated_at: now
    })
    .select("*")
    .single<InvoiceRow>();

  if (insertError || !invoice) {
    throw new InvoiceError("Impossible de creer la facture depuis ce devis.");
  }

  return normalizeInvoiceRow(invoice);
}

export async function getInvoiceByQuoteId(quoteId: string) {
  return selectInvoiceByQuoteId(quoteId);
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceDetail> {
  const supabase = await createClient();
  const { data, error } = await supabase
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
    .maybeSingle<
      InvoiceRow & {
        client_companies: InvoiceCompanyRow | InvoiceCompanyRow[] | null;
        quotes: InvoiceQuoteRow | InvoiceQuoteRow[] | null;
      }
    >();

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
