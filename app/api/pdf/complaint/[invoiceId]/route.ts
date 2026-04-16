import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceById, InvoiceError } from "@/lib/invoices";
import { getOrganizationBranding } from "@/lib/organization";
import { getInvoiceComplaintByInvoiceId } from "@/lib/invoice-complaints";
import { ComplaintDocument } from "@/lib/pdf/documents";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await context.params;

  try {
    const invoice = await getInvoiceById(invoiceId);
    const complaint = await getInvoiceComplaintByInvoiceId(invoiceId);

    const organizationSettings = await getOrganizationBranding(new URL(request.url).origin);
    const document = createElement(ComplaintDocument as never, {
      invoice,
      complaint,
      organizationSettings
    });
    const buffer = await renderToBuffer(document as never);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fiche-reclamation-${invoice.invoice_number ?? invoice.id}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Facture introuvable." ? 404 : 500 });
    }

    throw error;
  }
}
