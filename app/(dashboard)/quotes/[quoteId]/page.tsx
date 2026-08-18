import { notFound } from "next/navigation";
import { EditQuoteForm } from "@/components/quotes/edit-quote-form";
import { Card } from "@/components/ui/card";
import { getInvoiceByQuoteId } from "@/lib/invoices";
import { getProgrammeDocumentByQuoteId, getQuoteForEdit, QuoteError } from "@/lib/quotes";
import { getTrainingAgreementDocumentByQuoteId } from "@/lib/training-agreements";
import { getTrainerOptions } from "@/lib/queries";
import { getLatestTrainingNeedsAnalysisForQuote } from "@/lib/training-needs/internal";
import { TrainingNeedsSummaryCard } from "@/components/training-needs/internal-summary";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;

  try {
    const [quote, invoice, programme, trainingAgreement, trainers, analysis] = await Promise.all([
      getQuoteForEdit(quoteId),
      getInvoiceByQuoteId(quoteId),
      getProgrammeDocumentByQuoteId(quoteId),
      getTrainingAgreementDocumentByQuoteId(quoteId),
      getTrainerOptions(),
      getLatestTrainingNeedsAnalysisForQuote(quoteId)
    ]);

    return (
      <main className="grid gap-4">
        <Card>
          <EditQuoteForm
            quote={quote}
            invoice={invoice}
            programmeFileUrl={programme?.fileUrl ?? null}
            trainers={trainers}
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
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Analyse des besoins</p>
          <h2 className="mt-2 text-2xl font-bold">Analyse des besoins</h2>
          <div className="mt-4">{analysis ? <TrainingNeedsSummaryCard analysis={analysis} /> : <p className="text-sm text-ink/65">L’analyse des besoins sera créée et envoyée avec le devis.</p>}</div>
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
