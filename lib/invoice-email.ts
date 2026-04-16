import { fetchExistingPdf } from "@/lib/generated-documents";
import { getInvoiceById, type InvoiceDetail } from "@/lib/invoices";
import { getInvoiceComplaintByInvoiceId, markInvoiceComplaintSentWithInvoice } from "@/lib/invoice-complaints";
import { getOrganizationSettings } from "@/lib/organization";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise pour envoyer une facture par email.`);
  }

  return value;
}

function buildInvoiceEmailSubject(invoiceNumber: string) {
  return `Envoi de votre facture ${invoiceNumber}`;
}

async function buildInvoiceEmailBody(invoice: InvoiceDetail) {
  const organization = await getOrganizationSettings();
  const signatoryName = organization.certificate_signatory_name || organization.organization_name;
  const organizationEmail = process.env.ORGANIZATION_EMAIL?.trim() || process.env.BREVO_SENDER_EMAIL?.trim() || "";
  const organizationPhone = process.env.ORGANIZATION_PHONE?.trim() || "";

  return [
    "Bonjour,",
    "",
    `Veuillez trouver ci-joint votre facture ${invoice.invoice_number} relative a la formation ${invoice.quote.quote_number}.`,
    "",
    `Objet : ${invoice.quote.title}.`,
    "",
    "Nous restons a votre disposition pour toute question concernant cette facture.",
    "",
    "Cordialement,",
    organization.organization_name,
    signatoryName,
    organizationEmail,
    organizationPhone
  ].join("\n");
}

export async function sendInvoiceEmail(invoiceOrId: InvoiceDetail | string) {
  const invoice = typeof invoiceOrId === "string" ? await getInvoiceById(invoiceOrId) : invoiceOrId;

  if (!invoice.company.contact_email) {
    throw new Error("Aucune adresse email de contact n'est renseignee pour cette societe.");
  }

  const apiKey = requireEnv("BREVO_API_KEY");
  const fromEmail = requireEnv("BREVO_SENDER_EMAIL");
  const fromName = process.env.BREVO_SENDER_NAME?.trim() || (await getOrganizationSettings()).organization_name;
  const pdfPath = `/api/pdf/invoice/${invoice.id}`;
  const pdf = await fetchExistingPdf(pdfPath);
  const complaint = await getInvoiceComplaintByInvoiceId(invoice.id);
  const complaintPdfPath = complaint?.send_with_invoice ? `/api/pdf/complaint/${invoice.id}` : null;
  const complaintPdf = complaintPdfPath ? await fetchExistingPdf(complaintPdfPath) : null;
  const body = await buildInvoiceEmailBody(invoice);
  const bodyWithComplaintNote =
    complaint?.send_with_invoice
      ? `${body}\n\nUne fiche de reclamation / insatisfaction est jointe a cet envoi pour le suivi qualite.`
      : body;
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
          email: invoice.company.contact_email,
          name: invoice.company.company_name
        }
      ],
      subject: buildInvoiceEmailSubject(invoice.invoice_number ?? `FACT-${invoice.id}`),
      textContent: bodyWithComplaintNote,
      attachment: [
        {
          name: `facture-${invoice.invoice_number ?? invoice.id}.pdf`,
          content: Buffer.from(pdf.buffer).toString("base64")
        },
        ...(complaintPdf
          ? [
              {
                name: `fiche-reclamation-${invoice.invoice_number ?? invoice.id}.pdf`,
                content: Buffer.from(complaintPdf.buffer).toString("base64")
              }
            ]
          : [])
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Brevo a refuse l'envoi de la facture. ${errorText}`.trim());
  }

  if (complaint?.send_with_invoice) {
    await markInvoiceComplaintSentWithInvoice(invoice.id);
  }

  return {
    fileUrl: pdfPath
  };
}
