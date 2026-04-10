/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InvoiceDetail } from "@/lib/invoices";
import type { QuotePdfData } from "@/lib/quotes";
import { computeQuoteVatAmount } from "@/lib/quote-utils";
import { formatCurrency, formatDate, formatDateRange, formatDurationHours, formatPercent } from "@/lib/utils";
import type { OrganizationBranding, SessionCandidate, SessionItem } from "@/lib/types";

const TRAINING_TITLE = "Sauveteur Secouriste du Travail (SST)";

const validationLabel = {
  pending: "En attente de validation",
  validated: "Valide",
  not_validated: "Non valide"
} as const;

const shared = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingRight: 36,
    paddingBottom: 32,
    paddingLeft: 36,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1d2a24"
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    fontWeight: 700
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 18,
    color: "#285943"
  },
  section: {
    marginBottom: 16
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#d9d4cb",
    paddingTop: 8,
    paddingBottom: 8
  },
  label: {
    fontSize: 11,
    color: "#5b655f"
  },
  strong: {
    fontWeight: 700
  },
  badge: {
    fontSize: 10,
    color: "#285943"
  }
});

const certificateStyles = StyleSheet.create({
  page: {
    backgroundColor: "#fffdf8"
  },
  frame: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d7d0c2",
    padding: 24
  },
  topBand: {
    height: 10,
    backgroundColor: "#285943",
    marginBottom: 18
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22
  },
  logo: {
    width: 88,
    height: 88,
    objectFit: "contain"
  },
  organizationBlock: {
    maxWidth: 320,
    textAlign: "right"
  },
  organizationName: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4
  },
  organizationLine: {
    fontSize: 10,
    color: "#47514c",
    marginBottom: 2
  },
  certificateTitle: {
    fontSize: 24,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 6
  },
  certificateSubtitle: {
    fontSize: 11,
    textAlign: "center",
    color: "#5b655f",
    marginBottom: 24
  },
  intro: {
    fontSize: 12,
    lineHeight: 1.55,
    textAlign: "center",
    marginBottom: 16
  },
  candidateName: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    color: "#174734",
    marginBottom: 10
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 24
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 18
  },
  detailRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da",
    paddingTop: 8,
    paddingBottom: 8
  },
  detailRowLast: {
    borderBottomWidth: 0
  },
  detailLabel: {
    width: 150,
    color: "#5b655f",
    fontSize: 10
  },
  detailValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: 700
  },
  validationBox: {
    backgroundColor: "#edf5f0",
    borderWidth: 1,
    borderColor: "#b9d0c2",
    padding: 14,
    marginBottom: 24
  },
  validationTitle: {
    fontSize: 10,
    color: "#4e5f57",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  validationValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#174734",
    marginBottom: 4
  },
  validationDate: {
    fontSize: 10,
    color: "#4e5f57"
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  legalBlock: {
    maxWidth: 300
  },
  legalText: {
    fontSize: 10,
    color: "#47514c",
    marginBottom: 3
  },
  signatureBlock: {
    width: 180,
    alignItems: "center"
  },
  signatureImage: {
    width: 120,
    height: 56,
    objectFit: "contain",
    marginBottom: 8
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: "#9da6a1",
    marginBottom: 8
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center"
  },
  signatureTitle: {
    fontSize: 9,
    color: "#5b655f",
    textAlign: "center",
    marginTop: 2
  },
  qualiopi: {
    marginTop: 14,
    fontSize: 9,
    color: "#5b655f",
    textAlign: "center"
  }
});

const quoteStyles = StyleSheet.create({
  page: {
    backgroundColor: "#fffdf8"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24
  },
  headerLeft: {
    maxWidth: 320
  },
  headerRight: {
    maxWidth: 220,
    alignItems: "flex-end"
  },
  logo: {
    width: 90,
    height: 56,
    objectFit: "contain",
    marginBottom: 12
  },
  overline: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#5b655f",
    letterSpacing: 1.2,
    marginBottom: 8
  },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6
  },
  quoteMeta: {
    fontSize: 10,
    color: "#4e5f57",
    marginBottom: 3
  },
  twoCols: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 18
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14
  },
  infoTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#5b655f",
    marginBottom: 8
  },
  infoLine: {
    fontSize: 11,
    color: "#1d2a24",
    marginBottom: 4
  },
  descriptionCard: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 18
  },
  descriptionText: {
    fontSize: 11,
    lineHeight: 1.5
  },
  priceTable: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    marginBottom: 18
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da"
  },
  priceRowLast: {
    borderBottomWidth: 0,
    backgroundColor: "#edf5f0"
  },
  priceLabel: {
    fontSize: 11,
    color: "#4e5f57"
  },
  priceValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1d2a24"
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#174734"
  },
  notesCard: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 16
  }
});

const invoiceStyles = StyleSheet.create({
  page: {
    backgroundColor: "#fffdf8"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24
  },
  headerLeft: {
    maxWidth: 320
  },
  headerRight: {
    maxWidth: 220,
    alignItems: "flex-end"
  },
  logo: {
    width: 90,
    height: 56,
    objectFit: "contain",
    marginBottom: 12
  },
  overline: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#5b655f",
    letterSpacing: 1.2,
    marginBottom: 8
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6
  },
  invoiceMeta: {
    fontSize: 10,
    color: "#4e5f57",
    marginBottom: 3
  }
});

function DetailRow({
  label,
  value,
  isLast = false
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={isLast ? [certificateStyles.detailRow, certificateStyles.detailRowLast] : certificateStyles.detailRow}>
      <Text style={certificateStyles.detailLabel}>{label}</Text>
      <Text style={certificateStyles.detailValue}>{value}</Text>
    </View>
  );
}

export function AttendanceDocument({
  session,
  candidates,
  organizationSettings
}: {
  session: SessionItem;
  candidates: SessionCandidate[];
  organizationSettings: OrganizationBranding;
}) {
  return (
    <Document>
      <Page size="A4" style={shared.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <View>
            <Text style={shared.title}>Feuille de presence SST</Text>
            <Text style={shared.subtitle}>
              {session.title} • {formatDate(session.start_date)} au {formatDate(session.end_date)} • {session.location}
            </Text>
          </View>
          {organizationSettings.resolved_logo_url ? (
            <Image src={organizationSettings.resolved_logo_url} style={{ width: 70, height: 70, objectFit: "contain" }} />
          ) : null}
        </View>
        <View style={shared.section}>
          {candidates.map((item, index) => (
            <View key={item.id} style={shared.row}>
              <View>
                <Text style={shared.strong}>
                  {index + 1}. {item.candidate.first_name} {item.candidate.last_name}
                </Text>
                <Text style={shared.label}>{item.candidate.company || "Societe non renseignee"}</Text>
              </View>
              <Text style={shared.badge}>Signature : __________________</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export function CertificateDocument({
  session,
  candidateSession,
  organizationSettings
}: {
  session: SessionItem;
  candidateSession: SessionCandidate;
  organizationSettings: OrganizationBranding;
}) {
  const candidateFullName = `${candidateSession.candidate.first_name} ${candidateSession.candidate.last_name}`;
  const validationStatus = validationLabel[candidateSession.candidate.validation_status];
  const validationDate = candidateSession.candidate.validated_at
    ? formatDate(candidateSession.candidate.validated_at)
    : formatDate(new Date().toISOString());

  return (
    <Document>
      <Page size="A4" style={[shared.page, certificateStyles.page]}>
        <View style={certificateStyles.frame}>
          <View style={certificateStyles.topBand} />

          <View style={certificateStyles.header}>
            <View>
              {organizationSettings.resolved_logo_url ? (
                <Image src={organizationSettings.resolved_logo_url} style={certificateStyles.logo} />
              ) : null}
            </View>
            <View style={certificateStyles.organizationBlock}>
              <Text style={certificateStyles.organizationName}>{organizationSettings.organization_name}</Text>
              <Text style={certificateStyles.organizationLine}>{organizationSettings.address}</Text>
              {organizationSettings.siret ? (
                <Text style={certificateStyles.organizationLine}>SIRET : {organizationSettings.siret}</Text>
              ) : null}
              {organizationSettings.training_declaration_number ? (
                <Text style={certificateStyles.organizationLine}>
                  Declaration d&apos;activite : {organizationSettings.training_declaration_number}
                </Text>
              ) : null}
            </View>
          </View>

          <Text style={certificateStyles.certificateTitle}>Attestation de fin de formation</Text>
          <Text style={certificateStyles.certificateSubtitle}>Document etabli pour servir et valoir ce que de droit</Text>

          <Text style={certificateStyles.intro}>Nous attestons que le stagiaire suivant a suivi la formation :</Text>
          <Text style={certificateStyles.candidateName}>{candidateFullName}</Text>
          <Text style={certificateStyles.trainingTitle}>{TRAINING_TITLE}</Text>

          <View style={certificateStyles.detailsCard}>
            <DetailRow label="Dates de session" value={formatDateRange(session.start_date, session.end_date)} />
            <DetailRow label="Lieu" value={session.location} />
            <DetailRow label="Duree" value={formatDurationHours(session.duration_hours)} />
            <DetailRow label="Formateur" value={session.trainer_name || "Non renseigne"} isLast />
          </View>

          <View style={certificateStyles.validationBox}>
            <Text style={certificateStyles.validationTitle}>Statut de validation</Text>
            <Text style={certificateStyles.validationValue}>{validationStatus}</Text>
            <Text style={certificateStyles.validationDate}>Date de delivrance : {validationDate}</Text>
          </View>

          {organizationSettings.qualiopi_mention ? (
            <Text style={certificateStyles.qualiopi}>{organizationSettings.qualiopi_mention}</Text>
          ) : null}

          <View style={certificateStyles.footer}>
            <View style={certificateStyles.legalBlock}>
              <Text style={certificateStyles.legalText}>{organizationSettings.organization_name}</Text>
              <Text style={certificateStyles.legalText}>{organizationSettings.address}</Text>
              <Text style={certificateStyles.legalText}>Formation suivie : {TRAINING_TITLE}</Text>
            </View>

            <View style={certificateStyles.signatureBlock}>
              {organizationSettings.resolved_signature_url ? (
                <Image src={organizationSettings.resolved_signature_url} style={certificateStyles.signatureImage} />
              ) : (
                <View style={certificateStyles.signatureLine} />
              )}
              <Text style={certificateStyles.signatureName}>
                {organizationSettings.certificate_signatory_name || organizationSettings.organization_name}
              </Text>
              {organizationSettings.certificate_signatory_title ? (
                <Text style={certificateStyles.signatureTitle}>{organizationSettings.certificate_signatory_title}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function ConvocationDocument({
  session,
  candidateSession,
  organizationSettings
}: {
  session: SessionItem;
  candidateSession: SessionCandidate;
  organizationSettings: OrganizationBranding;
}) {
  const candidateFullName = `${candidateSession.candidate.first_name} ${candidateSession.candidate.last_name}`;
  const addressLine = [session.location, session.start_date ? formatDateRange(session.start_date, session.end_date) : null]
    .filter(Boolean)
    .join(" • ");

  return (
    <Document>
      <Page size="A4" style={[shared.page, certificateStyles.page]}>
        <View style={certificateStyles.frame}>
          <View style={certificateStyles.topBand} />

          <View style={certificateStyles.header}>
            <View>
              {organizationSettings.resolved_logo_url ? (
                <Image src={organizationSettings.resolved_logo_url} style={certificateStyles.logo} />
              ) : null}
            </View>
            <View style={certificateStyles.organizationBlock}>
              <Text style={certificateStyles.organizationName}>{organizationSettings.organization_name}</Text>
              <Text style={certificateStyles.organizationLine}>{organizationSettings.address}</Text>
              {organizationSettings.siret ? (
                <Text style={certificateStyles.organizationLine}>SIRET : {organizationSettings.siret}</Text>
              ) : null}
              {organizationSettings.training_declaration_number ? (
                <Text style={certificateStyles.organizationLine}>
                  Declaration d&apos;activite : {organizationSettings.training_declaration_number}
                </Text>
              ) : null}
            </View>
          </View>

          <Text style={certificateStyles.certificateTitle}>Convocation a la formation</Text>
          <Text style={certificateStyles.certificateSubtitle}>Participation a la session SST</Text>

          <Text style={certificateStyles.intro}>Nous vous confirmons l&apos;inscription du participant suivant :</Text>
          <Text style={certificateStyles.candidateName}>{candidateFullName}</Text>
          <Text style={certificateStyles.trainingTitle}>{TRAINING_TITLE}</Text>

          <View style={certificateStyles.detailsCard}>
            <DetailRow label="Dates de session" value={formatDateRange(session.start_date, session.end_date)} />
            <DetailRow label="Lieu" value={session.location} />
            <DetailRow label="Duree" value={formatDurationHours(session.duration_hours)} />
            <DetailRow label="Formateur" value={session.trainer_name || "Non renseigne"} isLast />
          </View>

          <View style={certificateStyles.validationBox}>
            <Text style={certificateStyles.validationTitle}>Informations pratiques</Text>
            <Text style={certificateStyles.validationValue}>Presence attendue a l&apos;horaire de convocation</Text>
            <Text style={certificateStyles.validationDate}>{addressLine}</Text>
          </View>

          <View style={certificateStyles.footer}>
            <View style={certificateStyles.legalBlock}>
              <Text style={certificateStyles.legalText}>{organizationSettings.organization_name}</Text>
              <Text style={certificateStyles.legalText}>{organizationSettings.address}</Text>
              <Text style={certificateStyles.legalText}>Formation convoquee : {TRAINING_TITLE}</Text>
            </View>

            <View style={certificateStyles.signatureBlock}>
              {organizationSettings.resolved_signature_url ? (
                <Image src={organizationSettings.resolved_signature_url} style={certificateStyles.signatureImage} />
              ) : (
                <View style={certificateStyles.signatureLine} />
              )}
              <Text style={certificateStyles.signatureName}>
                {organizationSettings.certificate_signatory_name || organizationSettings.organization_name}
              </Text>
              {organizationSettings.certificate_signatory_title ? (
                <Text style={certificateStyles.signatureTitle}>{organizationSettings.certificate_signatory_title}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function QuoteInfoLine({ value }: { value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return <Text style={quoteStyles.infoLine}>{value}</Text>;
}

export function QuoteDocument({
  quote,
  organizationSettings
}: {
  quote: QuotePdfData;
  organizationSettings: OrganizationBranding;
}) {
  const vatAmount = computeQuoteVatAmount(quote.price_ht, quote.vat_rate);
  const companyAddress = [quote.company.billing_address, quote.company.postal_code, quote.company.city]
    .filter(Boolean)
    .join(" ");
  const sessionLabel = quote.session?.title || "Session non planifiee";

  return (
    <Document>
      <Page size="A4" style={[shared.page, quoteStyles.page]}>
        <View style={quoteStyles.header}>
          <View style={quoteStyles.headerLeft}>
            {organizationSettings.resolved_logo_url ? (
              <Image src={organizationSettings.resolved_logo_url} style={quoteStyles.logo} />
            ) : null}
            <Text style={quoteStyles.overline}>Devis de formation</Text>
            <Text style={quoteStyles.quoteTitle}>{quote.title}</Text>
            <Text style={quoteStyles.quoteMeta}>Reference : {quote.quote_number}</Text>
            <Text style={quoteStyles.quoteMeta}>Date d&apos;emission : {formatDate(quote.created_at)}</Text>
          </View>

          <View style={quoteStyles.headerRight}>
            <Text style={certificateStyles.organizationName}>{organizationSettings.organization_name}</Text>
            <Text style={certificateStyles.organizationLine}>{organizationSettings.address}</Text>
            {organizationSettings.siret ? (
              <Text style={certificateStyles.organizationLine}>SIRET : {organizationSettings.siret}</Text>
            ) : null}
            {organizationSettings.training_declaration_number ? (
              <Text style={certificateStyles.organizationLine}>
                Declaration d&apos;activite : {organizationSettings.training_declaration_number}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={quoteStyles.twoCols}>
          <View style={quoteStyles.infoCard}>
            <Text style={quoteStyles.infoTitle}>Client</Text>
            <QuoteInfoLine value={quote.company.legal_name || quote.company.company_name} />
            {quote.company.legal_name && quote.company.legal_name !== quote.company.company_name ? (
              <QuoteInfoLine value={quote.company.company_name} />
            ) : null}
            <QuoteInfoLine value={companyAddress} />
            <QuoteInfoLine value={quote.company.contact_name} />
            <QuoteInfoLine value={quote.company.contact_email} />
            <QuoteInfoLine value={quote.company.contact_phone} />
            <QuoteInfoLine value={quote.company.siret ? `SIRET : ${quote.company.siret}` : null} />
          </View>

          <View style={quoteStyles.infoCard}>
            <Text style={quoteStyles.infoTitle}>Session</Text>
            <QuoteInfoLine value={sessionLabel} />
            <QuoteInfoLine
              value={
                quote.session_start_date || quote.session_end_date
                  ? `Dates : ${formatDateRange(quote.session_start_date, quote.session_end_date)}`
                  : "Dates : a confirmer"
              }
            />
            <QuoteInfoLine value={`Lieu : ${quote.location || "A confirmer"}`} />
            <QuoteInfoLine value={`Participants : ${quote.candidate_count}`} />
          </View>
        </View>

        <View style={quoteStyles.descriptionCard}>
          <Text style={quoteStyles.infoTitle}>Description</Text>
          <Text style={quoteStyles.descriptionText}>{quote.description || "Prestation de formation SST."}</Text>
        </View>

        <View style={quoteStyles.priceTable}>
          <View style={quoteStyles.priceRow}>
            <Text style={quoteStyles.priceLabel}>Prix HT</Text>
            <Text style={quoteStyles.priceValue}>{formatCurrency(quote.price_ht)}</Text>
          </View>
          <View style={quoteStyles.priceRow}>
            <Text style={quoteStyles.priceLabel}>TVA ({formatPercent(quote.vat_rate)})</Text>
            <Text style={quoteStyles.priceValue}>{formatCurrency(vatAmount)}</Text>
          </View>
          <View style={[quoteStyles.priceRow, quoteStyles.priceRowLast]}>
            <Text style={quoteStyles.priceLabel}>Total TTC</Text>
            <Text style={quoteStyles.totalValue}>{formatCurrency(quote.total_ttc)}</Text>
          </View>
        </View>

        {quote.notes ? (
          <View style={quoteStyles.notesCard}>
            <Text style={quoteStyles.infoTitle}>Notes</Text>
            <Text style={quoteStyles.descriptionText}>{quote.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export function InvoiceDocument({
  invoice,
  organizationSettings
}: {
  invoice: InvoiceDetail;
  organizationSettings: OrganizationBranding;
}) {
  const companyAddress = [invoice.company.address, invoice.company.postal_code, invoice.company.city, invoice.company.country]
    .filter(Boolean)
    .join(" ");
  const issueDate = invoice.issue_date || invoice.created_at;

  return (
    <Document>
      <Page size="A4" style={[shared.page, invoiceStyles.page]}>
        <View style={invoiceStyles.header}>
          <View style={invoiceStyles.headerLeft}>
            {organizationSettings.resolved_logo_url ? (
              <Image src={organizationSettings.resolved_logo_url} style={invoiceStyles.logo} />
            ) : null}
            <Text style={invoiceStyles.overline}>Facture</Text>
            <Text style={invoiceStyles.invoiceTitle}>{invoice.invoice_number}</Text>
            <Text style={invoiceStyles.invoiceMeta}>Date d&apos;emission : {formatDate(issueDate)}</Text>
            <Text style={invoiceStyles.invoiceMeta}>Reference devis : {invoice.quote.quote_number}</Text>
          </View>

          <View style={invoiceStyles.headerRight}>
            <Text style={certificateStyles.organizationName}>{organizationSettings.organization_name}</Text>
            <Text style={certificateStyles.organizationLine}>{organizationSettings.address}</Text>
            {organizationSettings.siret ? (
              <Text style={certificateStyles.organizationLine}>SIRET : {organizationSettings.siret}</Text>
            ) : null}
            {organizationSettings.training_declaration_number ? (
              <Text style={certificateStyles.organizationLine}>
                Declaration d&apos;activite : {organizationSettings.training_declaration_number}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={quoteStyles.twoCols}>
          <View style={quoteStyles.infoCard}>
            <Text style={quoteStyles.infoTitle}>Client</Text>
            <QuoteInfoLine value={invoice.company.company_name} />
            <QuoteInfoLine value={companyAddress} />
            <QuoteInfoLine value={invoice.company.contact_email} />
          </View>

          <View style={quoteStyles.infoCard}>
            <Text style={quoteStyles.infoTitle}>Facturation</Text>
            <QuoteInfoLine value={`Statut : ${invoice.status}`} />
            <QuoteInfoLine value={`Objet : ${invoice.quote.title}`} />
            <QuoteInfoLine value={invoice.due_date ? `Echeance : ${formatDate(invoice.due_date)}` : null} />
          </View>
        </View>

        <View style={quoteStyles.priceTable}>
          <View style={quoteStyles.priceRow}>
            <Text style={quoteStyles.priceLabel}>Montant HT</Text>
            <Text style={quoteStyles.priceValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={quoteStyles.priceRow}>
            <Text style={quoteStyles.priceLabel}>TVA ({formatPercent(invoice.tax_rate)})</Text>
            <Text style={quoteStyles.priceValue}>{formatCurrency(invoice.tax_amount)}</Text>
          </View>
          <View style={[quoteStyles.priceRow, quoteStyles.priceRowLast]}>
            <Text style={quoteStyles.priceLabel}>Total TTC</Text>
            <Text style={quoteStyles.totalValue}>{formatCurrency(invoice.total_ttc)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={quoteStyles.notesCard}>
            <Text style={quoteStyles.infoTitle}>Notes</Text>
            <Text style={quoteStyles.descriptionText}>{invoice.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
