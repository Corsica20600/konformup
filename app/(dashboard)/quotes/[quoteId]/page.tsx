import { notFound } from "next/navigation";
import { EditQuoteForm } from "@/components/quotes/edit-quote-form";
import { Card } from "@/components/ui/card";
import { getInvoiceByQuoteId } from "@/lib/invoices";
import { getProgrammeDocumentByQuoteId, getQuoteForEdit, QuoteError } from "@/lib/quotes";
import { getTrainingAgreementDocumentByQuoteId } from "@/lib/training-agreements";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;

  try {
    const [quote, invoice, programme, trainingAgreement] = await Promise.all([
      getQuoteForEdit(quoteId),
      getInvoiceByQuoteId(quoteId),
      getProgrammeDocumentByQuoteId(quoteId),
      getTrainingAgreementDocumentByQuoteId(quoteId)
    ]);

    return (
      <main className="grid gap-4">
        <Card>
          <EditQuoteForm
            quote={quote}
            invoice={invoice}
            programmeFileUrl={programme?.fileUrl ?? null}
            trainingAgreement={
              trainingAgreement
                ? {
                    id: trainingAgreement.id,
                    fileUrl: trainingAgreement.file_url,
                    documentRef: trainingAgreement.document_ref,
                    version: trainingAgreement.version,
                    missingFields:
                      typeof trainingAgreement.metadata === "object" &&
                      trainingAgreement.metadata !== null &&
                      "missing_fields" in trainingAgreement.metadata &&
                      Array.isArray((trainingAgreement.metadata as { missing_fields?: unknown }).missing_fields)
                        ? ((trainingAgreement.metadata as { missing_fields?: unknown[] }).missing_fields ?? []).filter(
                            (field): field is string => typeof field === "string"
                          )
                        : []
                  }
                : null
            }
          />
        </Card>
      </main>
    );
  } catch (error) {
    if (error instanceof QuoteError && error.message === "Devis introuvable.") {
      notFound();
    }

    throw error;
  }
}
