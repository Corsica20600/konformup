import { notFound } from "next/navigation";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { Card } from "@/components/ui/card";
import { getInvoiceById, InvoiceError } from "@/lib/invoices";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;

  try {
    const invoice = await getInvoiceById(invoiceId);

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
            <p>Montant HT : {invoice.subtotal.toFixed(2)} EUR</p>
            <p>TVA : {invoice.tax_rate.toFixed(2)} %</p>
            <p>Montant TVA : {invoice.tax_amount.toFixed(2)} EUR</p>
            <p className="md:col-span-2">Montant TTC : {invoice.total_ttc.toFixed(2)} EUR</p>
          </div>
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
