import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { createProgrammeDocumentForQuote, getProgrammeDocumentByQuoteId, type QuoteEditData } from "@/lib/quotes";
import { createTrainingAgreementDocumentForQuote } from "@/lib/training-agreements";

function buildQuoteEmailSubject(quoteNumber: string) {
  return `Envoi de votre devis ${quoteNumber}`;
}

function buildQuoteEmailBody(quote: QuoteEditData, signatureLines: string[]) {
  const agreementNote =
    quote.status === "accepted"
      ? "Vous trouverez egalement la convention de formation professionnelle pre-remplie correspondant a ce devis."
      : null;

  return [
    "Bonjour,",
    "",
    `Veuillez trouver ci-joint notre devis ${quote.quote_number} relatif a votre demande de formation.`,
    "",
    `Ce devis concerne : ${quote.title}.`,
    agreementNote,
    "",
    "Nous restons a votre disposition pour toute question ou pour convenir des prochaines etapes.",
    "",
    ...signatureLines
  ].join("\n");
}

export async function sendQuoteEmail(quote: QuoteEditData) {
  if (!quote.company.contact_email) {
    throw new Error("Aucune adresse email de contact n'est renseignee pour cette societe.");
  }

  const emailContext = await getTransactionalEmailContext();
  const pdfPath = `/api/pdf/quote/${quote.id}`;
  const pdf = await fetchExistingPdf(pdfPath);
  const existingProgramme = await getProgrammeDocumentByQuoteId(quote.id);
  const programmeDocument = existingProgramme ?? (await createProgrammeDocumentForQuote(quote.id));
  const programmePdf = await fetchExistingPdf(programmeDocument.fileUrl ?? `/api/pdf/programme/${quote.id}`);
  const agreementDocument =
    quote.status === "accepted" ? await createTrainingAgreementDocumentForQuote(quote.id) : null;
  const agreementPdf =
    agreementDocument ? await fetchExistingPdf(agreementDocument.fileUrl ?? `/api/pdf/training-agreement/${quote.id}`) : null;
  const body = buildQuoteEmailBody(quote, emailContext.signatureLines);
  await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [
      {
        email: quote.company.contact_email,
        name: quote.company.contact_name || quote.company.company_name
      }
    ],
    subject: buildQuoteEmailSubject(quote.quote_number),
    textContent: body,
    attachment: [
        {
          name: `devis-${quote.quote_number}.pdf`,
          content: Buffer.from(pdf.buffer).toString("base64")
        },
        {
          name: `programme-${quote.training_type.replace("_", "-")}.pdf`,
          content: Buffer.from(programmePdf.buffer).toString("base64")
        },
        ...(agreementPdf
          ? [
              {
                name: `convention-${quote.quote_number}.pdf`,
                content: Buffer.from(agreementPdf.buffer).toString("base64")
              }
            ]
          : [])
      ],
    errorLabel: "l'envoi du devis"
  });

  return {
    fileUrl: pdfPath
  };
}
