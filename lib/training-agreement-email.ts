import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { createTrainingAgreementDocumentForQuote } from "@/lib/training-agreements";
import type { QuoteEditData } from "@/lib/quotes";

export async function sendTrainingAgreementEmail(quote: QuoteEditData) {
  if (!quote.company.contact_email) {
    throw new Error("Aucune adresse email de contact n'est renseignee pour cette societe.");
  }

  const agreement = await createTrainingAgreementDocumentForQuote(quote.id);
  const pdf = await fetchExistingPdf(agreement.fileUrl ?? `/api/pdf/training-agreement/${quote.id}`);
  const emailContext = await getTransactionalEmailContext();

  await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [{ email: quote.company.contact_email, name: quote.company.contact_name || quote.company.company_name }],
    subject: `Convention de formation - devis ${quote.quote_number}`,
    textContent: [
      "Bonjour,",
      "",
      `Suite à l'acceptation du devis ${quote.quote_number}, veuillez trouver ci-joint votre convention de formation.`,
      "",
      ...emailContext.signatureLines
    ].join("\n"),
    attachment: [{ name: `convention-${quote.quote_number}.pdf`, content: Buffer.from(pdf.buffer).toString("base64") }],
    errorLabel: "l'envoi de la convention de formation"
  });
}
