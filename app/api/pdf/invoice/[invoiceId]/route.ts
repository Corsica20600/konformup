import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { accessErrorResponse } from "@/lib/api-errors";
import { assertCanAccessInvoice } from "@/lib/auth";
import { InvoiceError, getInvoiceById } from "@/lib/invoices";
import { getOrganizationBranding } from "@/lib/organization";
import { InvoiceDocument } from "@/lib/pdf/documents";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await context.params;

  try {
    await assertCanAccessInvoice(invoiceId);
    const invoice = await getInvoiceById(invoiceId);
    const organizationSettings = await getOrganizationBranding(new URL(request.url).origin);
    const document = createElement(InvoiceDocument as never, { invoice, organizationSettings });
    const buffer = await renderToBuffer(document as never);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${invoice.invoice_number}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
    }

    const accessResponse = accessErrorResponse(error);
    if (accessResponse) {
      return accessResponse;
    }

    throw error;
  }
}
