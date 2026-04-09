import { notFound } from "next/navigation";
import { EditQuoteForm } from "@/components/quotes/edit-quote-form";
import { Card } from "@/components/ui/card";
import { getQuoteForEdit, QuoteError } from "@/lib/quotes";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;

  try {
    const quote = await getQuoteForEdit(quoteId);

    return (
      <main className="grid gap-4">
        <Card>
          <EditQuoteForm quote={quote} />
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
