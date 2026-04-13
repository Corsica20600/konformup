import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getOrganizationBranding } from "@/lib/organization";
import { ProgrammeDocument } from "@/lib/pdf/documents";
import { getQuoteById, QuoteError } from "@/lib/quotes";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await context.params;

  try {
    const quote = await getQuoteById(quoteId);
    const organizationSettings = await getOrganizationBranding(new URL(request.url).origin);
    const document = createElement(ProgrammeDocument as never, { quote, organizationSettings });
    const buffer = await renderToBuffer(document as never);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="programme-sst-${quote.quote_number}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof QuoteError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    throw error;
  }
}
