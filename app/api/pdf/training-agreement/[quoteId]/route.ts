import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getOrganizationBranding } from "@/lib/organization";
import { TrainingAgreementDocument } from "@/lib/pdf/documents";
import { QuoteError } from "@/lib/quotes";
import { buildTrainingAgreementPdfData, getTrainingAgreementDocumentByQuoteId } from "@/lib/training-agreements";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await context.params;

  try {
    const [existingDocument, organizationSettings] = await Promise.all([
      getTrainingAgreementDocumentByQuoteId(quoteId),
      getOrganizationBranding(new URL(request.url).origin)
    ]);
    const agreement = await buildTrainingAgreementPdfData(quoteId, existingDocument?.document_ref ?? undefined);
    const document = createElement(TrainingAgreementDocument as never, { agreement, organizationSettings });
    const buffer = await renderToBuffer(document as never);
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="convention-${agreement.quote.quote_number}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    throw error;
  }
}
