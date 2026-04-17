import { notFound } from "next/navigation";
import Link from "next/link";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { InvoiceComplaintForm } from "@/components/invoices/invoice-complaint-form";
import { Card } from "@/components/ui/card";
import { getInvoiceById, InvoiceError } from "@/lib/invoices";
import { getInvoiceComplaintByInvoiceId } from "@/lib/invoice-complaints";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;

  try {
    const [invoice, complaint] = await Promise.all([
      getInvoiceById(invoiceId),
      getInvoiceComplaintByInvoiceId(invoiceId)
    ]);
    const statusLabel = invoice.status === "sent" ? "Emise" : invoice.status === "draft" ? "En preparation" : invoice.status;

    return (
      <main className="grid gap-4">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Facture</p>
              <h2 className="mt-2 text-3xl font-bold">{invoice.invoice_number}</h2>
              <p className="mt-2 text-sm text-ink/65">
                Societe : {invoice.company.company_name} • Creee le {formatDate(invoice.created_at)}
              </p>
            </div>
            <InvoiceActions invoiceId={invoiceId} quoteId={invoice.quote.id} />
          </div>

          <div className="mt-6 grid gap-3 text-sm text-ink/75 md:grid-cols-2">
            <p>Reference devis : {invoice.quote.quote_number}</p>
            <p>Objet : {invoice.quote.title}</p>
            <p>Statut : {statusLabel}</p>
            <p>Montant HT : {formatCurrency(invoice.subtotal)}</p>
            <p>TVA : {invoice.tax_rate.toFixed(2)} %</p>
            <p>Montant TVA : {formatCurrency(invoice.tax_amount)}</p>
            <p className="md:col-span-2">Montant TTC : {formatCurrency(invoice.total_ttc)}</p>
          </div>
        </Card>

        <Card>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Suivi client</p>
              <h3 className="mt-2 text-2xl font-bold">Reclamation et mesures correctives</h3>
              <p className="mt-2 text-sm text-ink/65">
                Envoie une fiche vierge avec la facture, puis complete ici le retour client et le traitement interne.
              </p>
            </div>
            <Link
              href={`/api/pdf/complaint/${invoice.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
            >
              Ouvrir la fiche PDF
            </Link>
          </div>

          <InvoiceComplaintForm invoiceId={invoice.id} complaint={complaint} />
        </Card>
      </main>
    );
  } catch (error) {
    if (error instanceof InvoiceError && error.message === "Facture introuvable.") {
      notFound();
    }

    throw error;
  }
}
