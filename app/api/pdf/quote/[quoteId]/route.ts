import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getOrganizationBranding } from "@/lib/organization";
import { QuoteError, getQuoteById } from "@/lib/quotes";
import { QuoteDocument } from "@/lib/pdf/documents";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await context.params;

  try {
    const quote = await getQuoteById(quoteId);
    const organizationSettings = await getOrganizationBranding(new URL(request.url).origin);
    const document = createElement(QuoteDocument as never, { quote, organizationSettings });
    const buffer = await renderToBuffer(document as never);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="devis-${quote.quote_number}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    throw error;
  }
}
