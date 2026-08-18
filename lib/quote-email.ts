import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { createProgrammeDocumentForQuote, getProgrammeDocumentByQuoteId, type QuoteEditData } from "@/lib/quotes";
import { createTrainingAgreementDocumentForQuote } from "@/lib/training-agreements";
import { getTrainingDocumentTitle } from "@/lib/training-programs";
import { confirmTrainingNeedsEmailRotation, getOrCreateActiveTrainingNeedsAnalysisForQuote, rollbackTrainingNeedsEmailRotation, rotateTrainingNeedsPublicAccessForEmail } from "@/lib/training-needs/internal";

function buildQuoteEmailSubject(quoteNumber: string) {
  return `Envoi de votre devis ${quoteNumber}`;
}

export function buildQuoteEmailBody(quote: QuoteEditData, signatureLines: string[], analysisUrl: string) {
  const agreementNote =
    quote.status === "accepted"
      ? "Vous trouverez egalement la convention de formation professionnelle pre-remplie correspondant a ce devis."
      : null;

  return [
    "Bonjour,",
    "",
    `Veuillez trouver ci-joint notre devis ${quote.quote_number} relatif a votre demande de formation.`,
    "",
    `Ce devis concerne : ${getTrainingDocumentTitle(quote.training_type, quote.title)}.`,
    agreementNote,
    "",
    "Analyse de vos besoins",
    "Afin d'adapter la formation a votre activite, a vos salaries et aux risques de votre entreprise, merci de completer notre fiche d'analyse des besoins. Vous pourrez enregistrer vos reponses et reprendre le formulaire avant sa validation definitive.",
    "",
    "Completer l'analyse des besoins :",
    analysisUrl,
    `Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : ${analysisUrl}`,
    "",
    "Nous restons a votre disposition pour toute question ou pour convenir des prochaines etapes.",
    "",
    ...signatureLines
  ].join("\n");
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character); }
export function buildQuoteEmailHtml(quote: QuoteEditData, analysisUrl: string) { const title = escapeHtml(getTrainingDocumentTitle(quote.training_type, quote.title)); const url = escapeHtml(analysisUrl); return `<p>Bonjour,</p><p>Veuillez trouver ci-joint notre devis <strong>${escapeHtml(quote.quote_number)}</strong> relatif a votre demande de formation.</p><p>Ce devis concerne : ${title}.</p><section style="margin:24px 0;padding:20px;border:1px solid #e5dccb;border-radius:16px"><h2 style="margin:0 0 12px;color:#285943">Analyse de vos besoins</h2><p>Afin d'adapter la formation a votre activite, a vos salaries et aux risques de votre entreprise, merci de completer notre fiche d'analyse des besoins. Vous pourrez enregistrer vos reponses et reprendre le formulaire avant sa validation definitive.</p><p><a href="${url}" style="display:inline-block;background:#285943;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Completer l'analyse des besoins</a></p><p style="font-size:12px;word-break:break-all">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : ${url}</p></section>`; }

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
  const analysis = await getOrCreateActiveTrainingNeedsAnalysisForQuote(quote.id);
  const rotation = await rotateTrainingNeedsPublicAccessForEmail(analysis.id);
  const body = buildQuoteEmailBody(quote, emailContext.signatureLines, rotation.url);
  try { await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [
      {
        email: quote.company.contact_email,
        name: quote.company.contact_name || quote.company.company_name
      }
    ],
    subject: buildQuoteEmailSubject(quote.quote_number),
    textContent: body,
    htmlContent: buildQuoteEmailHtml(quote, rotation.url),
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
  }); } catch (error) { try { await rollbackTrainingNeedsEmailRotation(rotation); } catch { console.error("[quote-email] analysis token rollback failed", { analysisId: analysis.id }); } throw error; }
  try { if (!await confirmTrainingNeedsEmailRotation(rotation)) console.error("[quote-email] analysis delivery status update skipped", { analysisId: analysis.id }); } catch { console.error("[quote-email] analysis delivery status update failed", { analysisId: analysis.id }); }

  return {
    fileUrl: pdfPath
  };
}
