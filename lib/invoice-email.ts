import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { getInvoiceById, type InvoiceDetail } from "@/lib/invoices";
import { getInvoiceComplaintByInvoiceId, markInvoiceComplaintSentWithInvoice } from "@/lib/invoice-complaints";
import { getOrCreateCompanySatisfactionSurveyForInvoice, markCompanySatisfactionDelivery } from "@/lib/company-satisfaction";
import { getTrainingDocumentTitle } from "@/lib/training-programs";

function buildInvoiceEmailSubject(invoiceNumber: string) {
  return `Envoi de votre facture ${invoiceNumber}`;
}

type PdfPayload = {
  buffer: ArrayBuffer;
  contentType: string | null;
};

function buildPdfAttachment(name: string, pdf: PdfPayload) {
  if (pdf.buffer.byteLength === 0 || !pdf.contentType?.toLowerCase().includes("application/pdf")) {
    throw new Error("Le PDF à joindre à la facture est invalide.");
  }

  return {
    name,
    content: Buffer.from(pdf.buffer).toString("base64")
  };
}

function buildInvoiceEmailBody(invoice: InvoiceDetail, signatureLines: string[]) {
  return [
    "Bonjour,",
    "",
    `Veuillez trouver ci-joint votre facture ${invoice.invoice_number} relative a la formation ${invoice.quote.quote_number}.`,
    "",
    `Objet : ${getTrainingDocumentTitle(invoice.quote.training_type, invoice.quote.title)}.`,
    "",
    "Nous restons a votre disposition pour toute question concernant cette facture.",
    "",
    ...signatureLines
  ].join("\n");
}

export async function sendInvoiceEmail(invoiceOrId: InvoiceDetail | string) {
  const invoice = typeof invoiceOrId === "string" ? await getInvoiceById(invoiceOrId) : invoiceOrId;

  if (!invoice.company.contact_email) {
    throw new Error("Aucune adresse email de contact n'est renseignee pour cette societe.");
  }

  const emailContext = await getTransactionalEmailContext();
  const pdfPath = `/api/pdf/invoice/${invoice.id}`;
  const pdf = await fetchExistingPdf(pdfPath);
  const complaint = await getInvoiceComplaintByInvoiceId(invoice.id);
  const complaintPdfPath = complaint?.send_with_invoice ? `/api/pdf/complaint/${invoice.id}` : null;
  const complaintPdf = complaintPdfPath ? await fetchExistingPdf(complaintPdfPath) : null;
  const satisfaction = invoice.send_company_satisfaction ? await getOrCreateCompanySatisfactionSurveyForInvoice(invoice.id) : null;
  const satisfactionIncluded = Boolean(satisfaction && !satisfaction.submittedAt);
  const body = buildInvoiceEmailBody(invoice, emailContext.signatureLines);
  const bodyWithComplaintNote =
    complaint?.send_with_invoice
      ? `${body}\n\nUne fiche de reclamation / insatisfaction vierge est jointe a cet envoi pour etre completee en cas de retour client.`
      : body;
  const invoiceAttachment = buildPdfAttachment(`facture-${invoice.invoice_number ?? invoice.id}.pdf`, pdf);
  const complaintAttachment = complaintPdf
    ? buildPdfAttachment(`fiche-reclamation-${invoice.invoice_number ?? invoice.id}.pdf`, complaintPdf)
    : null;

  try {
    await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [
      {
        email: invoice.company.contact_email,
        name: invoice.company.company_name
      }
    ],
      subject: buildInvoiceEmailSubject(invoice.invoice_number ?? `FACT-${invoice.id}`),
      textContent: `${bodyWithComplaintNote}${satisfactionIncluded && satisfaction ? `\n\nVotre avis compte\nCe questionnaire facultatif dure moins d'une minute : ${satisfaction.url}` : ""}`,
      htmlContent:
        satisfactionIncluded && satisfaction
          ? `<p>${bodyWithComplaintNote.replace(/\n/g, "<br>")}</p><section><h2>Votre avis compte</h2><p>Ce questionnaire facultatif dure moins d’une minute.</p><p><a href="${satisfaction.url}">Donner mon avis</a></p></section>`
          : undefined,
    attachment: [invoiceAttachment, ...(complaintAttachment ? [complaintAttachment] : [])],
      errorLabel: "l'envoi de la facture"
    });
  } catch (error) {
    if (satisfactionIncluded && satisfaction) {
      await markCompanySatisfactionDelivery(satisfaction.surveyId, false).catch(() => undefined);
    }
    throw error;
  }

  if (complaintAttachment) {
    await markInvoiceComplaintSentWithInvoice(invoice.id);
  }

  let trackingWarning: string | undefined;
  if (satisfactionIncluded && satisfaction) {
    try {
      await markCompanySatisfactionDelivery(satisfaction.surveyId, true);
    } catch {
      trackingWarning = "La facture a été envoyée, mais la traçabilité du questionnaire doit être vérifiée.";
    }
  }

  return {
    fileUrl: pdfPath,
    complaintAttached: Boolean(complaintAttachment),
    satisfactionIncluded,
    trackingWarning
  };
}
