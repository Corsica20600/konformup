import { fetchExistingPdf } from "@/lib/generated-documents";
import { getOrganizationSettings } from "@/lib/organization";
import { createProgrammeDocumentForQuote, getProgrammeDocumentByQuoteId, type QuoteEditData } from "@/lib/quotes";
import { createTrainingAgreementDocumentForQuote } from "@/lib/training-agreements";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise pour envoyer un devis par email.`);
  }

  return value;
}

function buildQuoteEmailSubject(quoteNumber: string) {
  return `Envoi de votre devis ${quoteNumber}`;
}

async function buildQuoteEmailBody(quote: QuoteEditData) {
  const organization = await getOrganizationSettings();
  const signatoryName = organization.certificate_signatory_name || organization.organization_name;
  const organizationEmail = process.env.ORGANIZATION_EMAIL?.trim() || process.env.BREVO_SENDER_EMAIL?.trim() || "";
  const organizationPhone = process.env.ORGANIZATION_PHONE?.trim() || "";
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
    "Cordialement,",
    organization.organization_name,
    signatoryName,
    organizationEmail,
    organizationPhone
  ].join("\n");
}

export async function sendQuoteEmail(quote: QuoteEditData) {
  if (!quote.company.contact_email) {
    throw new Error("Aucune adresse email de contact n'est renseignee pour cette societe.");
  }

  const apiKey = requireEnv("BREVO_API_KEY");
  const fromEmail = requireEnv("BREVO_SENDER_EMAIL");
  const fromName = process.env.BREVO_SENDER_NAME?.trim() || (await getOrganizationSettings()).organization_name;
  const pdfPath = `/api/pdf/quote/${quote.id}`;
  const pdf = await fetchExistingPdf(pdfPath);
  const existingProgramme = await getProgrammeDocumentByQuoteId(quote.id);
  const programmeDocument = existingProgramme ?? (await createProgrammeDocumentForQuote(quote.id));
  const programmePdf = await fetchExistingPdf(programmeDocument.fileUrl ?? `/api/pdf/programme/${quote.id}`);
  const agreementDocument =
    quote.status === "accepted" ? await createTrainingAgreementDocumentForQuote(quote.id) : null;
  const agreementPdf =
    agreementDocument ? await fetchExistingPdf(agreementDocument.fileUrl ?? `/api/pdf/training-agreement/${quote.id}`) : null;
  const body = await buildQuoteEmailBody(quote);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: fromEmail,
        name: fromName
      },
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
          name: "programme-sst.pdf",
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
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Brevo a refuse l'envoi du devis. ${errorText}`.trim());
  }

  return {
    fileUrl: pdfPath
  };
}
