import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { accessErrorResponse } from "@/lib/api-errors";
import { assertCanAccessQuote } from "@/lib/auth";
import { getOrganizationBranding } from "@/lib/organization";
import { TrainingAgreementDocument } from "@/lib/pdf/documents";
import { resolveKarineTrainerSignature } from "@/lib/document-signatures";
import { QuoteError } from "@/lib/quotes";
import { buildTrainingAgreementPdfData, getTrainingAgreementDocumentByQuoteId } from "@/lib/training-agreements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request, context: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await context.params;

  try {
    await assertCanAccessQuote(quoteId);
    const [existingDocument, organizationSettings] = await Promise.all([
      getTrainingAgreementDocumentByQuoteId(quoteId),
      getOrganizationBranding(new URL(request.url).origin)
    ]);
    const agreement = await buildTrainingAgreementPdfData(quoteId, existingDocument?.document_ref ?? undefined);
    const trainerSignature = await resolveKarineTrainerSignature(agreement.training.trainerProfileId);
    const document = createElement(TrainingAgreementDocument as never, {
      agreement,
      organizationSettings,
      trainerSignatureUrl: trainerSignature.signature?.src ?? null
    });
    const buffer = await renderToBuffer(document as never);
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="convention-${agreement.quote.quote_number}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache"
      }
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
    }

    const accessResponse = accessErrorResponse(error);
    if (accessResponse) {
      return accessResponse;
    }

    throw error;
  }
}
