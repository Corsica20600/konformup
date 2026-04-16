import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import {
  type InvoiceComplaintSeverity,
  type InvoiceComplaintStatus
} from "@/lib/invoice-complaint-config";
import type { InvoiceDetail } from "@/lib/invoices";

type InvoiceComplaintRow = Database["public"]["Tables"]["invoice_complaints"]["Row"];
type InvoiceComplaintInsert = Database["public"]["Tables"]["invoice_complaints"]["Insert"];

export type InvoiceComplaint = InvoiceComplaintRow;

export class InvoiceComplaintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceComplaintError";
  }
}

function isMissingInvoiceComplaintError(error: { code?: string; message?: string; details?: string } | null) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return error?.code === "42P01" || error?.code === "PGRST202" || text.includes("invoice_complaints");
}

export function normalizeInvoiceComplaint(row: InvoiceComplaintRow | null): InvoiceComplaint | null {
  return row;
}

export async function getInvoiceComplaintByInvoiceId(invoiceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice_complaints")
    .select("*")
    .eq("invoice_id", invoiceId)
    .maybeSingle<InvoiceComplaintRow>();

  if (error) {
    if (isMissingInvoiceComplaintError(error)) {
      return null;
    }

    throw new InvoiceComplaintError("Impossible de charger la fiche de reclamation.");
  }

  return normalizeInvoiceComplaint(data);
}

export async function upsertInvoiceComplaint(
  invoice: Pick<InvoiceDetail, "id" | "company" | "quote">,
  input: {
    status: InvoiceComplaintStatus;
    severity: InvoiceComplaintSeverity;
    dissatisfactionSummary: string;
    complaintDetails: string;
    customerExpectation: string;
    rootCause: string;
    correctiveActions: string;
    preventiveActions: string;
    followUpActions: string;
    internalNotes: string;
    sendWithInvoice: boolean;
  }
) {
  const supabase = await createClient();
  const existingComplaint = await getInvoiceComplaintByInvoiceId(invoice.id);
  const now = new Date().toISOString();

  const payload: InvoiceComplaintInsert = {
    invoice_id: invoice.id,
    company_id: invoice.company.id,
    quote_id: invoice.quote.id,
    status: input.status,
    severity: input.severity,
    dissatisfaction_summary: input.dissatisfactionSummary,
    complaint_details: input.complaintDetails,
    customer_expectation: input.customerExpectation,
    root_cause: input.rootCause,
    corrective_actions: input.correctiveActions,
    preventive_actions: input.preventiveActions,
    follow_up_actions: input.followUpActions,
    internal_notes: input.internalNotes,
    send_with_invoice: input.sendWithInvoice,
    resolved_at: input.status === "resolved" || input.status === "closed" ? now : null,
    sent_with_invoice_at:
      existingComplaint?.send_with_invoice === input.sendWithInvoice ? existingComplaint.sent_with_invoice_at : null
  };

  const { data, error } = await supabase
    .from("invoice_complaints")
    .upsert(payload, { onConflict: "invoice_id" })
    .select("*")
    .single<InvoiceComplaintRow>();

  if (error) {
    if (isMissingInvoiceComplaintError(error)) {
      throw new InvoiceComplaintError(
        "La table invoice_complaints est absente. Applique d'abord la migration Supabase de reclamations."
      );
    }

    throw new InvoiceComplaintError("Impossible d'enregistrer la fiche de reclamation.");
  }

  return data;
}

export async function markInvoiceComplaintSentWithInvoice(invoiceId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("invoice_complaints")
    .update({
      sent_with_invoice_at: now
    })
    .eq("invoice_id", invoiceId)
    .eq("send_with_invoice", true);

  if (error) {
    if (isMissingInvoiceComplaintError(error)) {
      return;
    }

    throw new InvoiceComplaintError("La fiche de reclamation n'a pas pu etre marquee comme envoyee.");
  }
}
