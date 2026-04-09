import nodemailer from "nodemailer";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { getOrganizationSettings } from "@/lib/organization";
import type { QuoteEditData } from "@/lib/quotes";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise pour envoyer un devis par email.`);
  }

  return value;
}

function createMailerTransport() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
}

function buildQuoteEmailSubject(quoteNumber: string) {
  return `Envoi de votre devis ${quoteNumber}`;
}

async function buildQuoteEmailBody(quote: QuoteEditData) {
  const organization = await getOrganizationSettings();
  const signatoryName = organization.certificate_signatory_name || organization.organization_name;
  const organizationEmail = process.env.ORGANIZATION_EMAIL?.trim() || process.env.SMTP_FROM_EMAIL?.trim() || "";
  const organizationPhone = process.env.ORGANIZATION_PHONE?.trim() || "";

  return [
    "Bonjour,",
    "",
    `Veuillez trouver ci-joint notre devis ${quote.quote_number} relatif a votre demande de formation.`,
    "",
    `Ce devis concerne : ${quote.title}.`,
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

  const transport = createMailerTransport();
  const fromEmail = requireEnv("SMTP_FROM_EMAIL");
  const fromName = process.env.SMTP_FROM_NAME?.trim() || (await getOrganizationSettings()).organization_name;
  const pdfPath = `/api/pdf/quote/${quote.id}`;
  const pdf = await fetchExistingPdf(pdfPath);
  const body = await buildQuoteEmailBody(quote);

  await transport.sendMail({
    from: `"${fromName.replace(/"/g, "")}" <${fromEmail}>`,
    to: quote.company.contact_email,
    subject: buildQuoteEmailSubject(quote.quote_number),
    text: body,
    attachments: [
      {
        filename: `devis-${quote.quote_number}.pdf`,
        content: Buffer.from(pdf.buffer),
        contentType: "application/pdf"
      }
    ]
  });

  return {
    fileUrl: pdfPath
  };
}
