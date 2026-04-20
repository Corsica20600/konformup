/* eslint-disable jsx-a11y/alt-text */
import { Document, Font, Image, Link as PdfLink, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InvoiceDetail } from "@/lib/invoices";
import type { QuotePdfData } from "@/lib/quotes";
import { computeQuoteVatAmount } from "@/lib/quote-utils";
import type { TrainingAgreementPdfData } from "@/lib/training-agreements";
import {
  formatAddressLines,
  formatCurrency,
  formatDate,
  formatDateRange,
  formatDateShort,
  formatDurationHours,
  formatPercent
} from "@/lib/utils";
import type { AttendanceOverview, OrganizationBranding, SessionCandidate, SessionItem } from "@/lib/types";
import type { InvoiceComplaint } from "@/lib/invoice-complaints";

const TRAINING_TITLE = "Sauveteur Secouriste du Travail (SST)";

const validationLabel = {
  pending: "En attente de validation",
  validated: "Valide",
  not_validated: "Non valide"
} as const;

function formatTrainingDeclarationNumber(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^NDA\s*:?\s*/i, "").trim();
}

type SstProgrammeRow = {
  label: string;
  duration: string;
};

type SstProgrammeSection = {
  index?: string;
  title: string;
  totalDuration?: string;
  rows: SstProgrammeRow[];
};

const SST_PROGRAMME_PAGE_1: SstProgrammeSection[] = [
  {
    index: "0",
    title: "Presentation de la formation SST",
    totalDuration: "20 min",
    rows: [{ label: "Ouverture de formation", duration: "20 min" }]
  },
  {
    index: "1",
    title: "Situer le sauveteur secouriste du travail dans la sante et securite au travail",
    totalDuration: "1h15",
    rows: [
      { label: "Les principaux indicateurs de sante au travail", duration: "15 min" },
      { label: "Le role du Sauveteur Secouriste du Travail", duration: "25 min" },
      { label: "Le cadre juridique de l'intervention du SST", duration: "20 min" },
      { label: "Presentation du programme (PREFAS)", duration: "15 min" }
    ]
  },
  {
    index: "2",
    title: "Rechercher les risques persistants pour proteger",
    totalDuration: "1h20",
    rows: [
      { label: "L'alerte aux populations", duration: "08 min" },
      { label: "Analyser une situation d'accident (le mecanisme accidentel)", duration: "30 min" },
      { label: "Proteger face a une situation d'accident (Supprimer un danger)", duration: "18 min" },
      { label: "Proteger face a une situation d'accident (Isoler un danger)", duration: "09 min" },
      { label: "Proteger face a une situation d'accident (Soustraire d'un danger)", duration: "15 min" }
    ]
  },
  {
    index: "3",
    title: 'De "proteger" a "prevenir"',
    totalDuration: "30 min",
    rows: [
      { label: "Les dangers dans une situation de travail", duration: "15 min" },
      { label: "Les principes de base en prevention", duration: "15 min" }
    ]
  },
  {
    index: "4",
    title: "Examiner la victime et faire alerter",
    totalDuration: "50 min",
    rows: [
      { label: "Examiner la ou les victimes", duration: "35 min" },
      {
        label: "Faire alerter ou alerter en fonction de l'organisation des secours de l'entreprise",
        duration: "15 min"
      }
    ]
  },
  {
    index: "5",
    title: 'De "faire alerter" a "informer"',
    totalDuration: "15 min",
    rows: [{ label: "Informer de la situation dangereuse reperee", duration: "15 min" }]
  }
];

const SST_PROGRAMME_PAGE_2: SstProgrammeSection[] = [
  {
    index: "6",
    title: "Secourir face a une situation d'accident",
    totalDuration: "6h20",
    rows: [
      { label: "Secourir une victime qui saigne abondamment", duration: "50 min" },
      { label: "Secourir une victime qui s'etouffe", duration: "45 min" },
      {
        label: "Secourir une victime qui se plaint de sensations penibles et/ou des signes anormaux",
        duration: "30 min"
      },
      { label: "Secourir une victime qui se plaint de brulures", duration: "30 min" },
      { label: "Secourir une victime qui se plaint d'une douleur empechant certains mouvements", duration: "30 min" },
      { label: "Secourir une victime qui se plaint d'une plaie qui ne saigne pas abondamment", duration: "40 min" },
      { label: "Secourir une victime qui ne repond pas, mais qui respire", duration: "50 min" },
      { label: "Secourir une victime qui ne repond pas et ne respire pas (partie 1)", duration: "40 min" },
      { label: "Secourir une victime qui ne repond pas et ne respire pas (partie 2)", duration: "01h05" }
    ]
  },
  {
    title: "Situations inherentes aux risques specifiques",
    rows: [{ label: "Risques specifiques a l'entreprise", duration: "A definir" }]
  },
  {
    index: "7",
    title: "Le dispositif de validation des SST",
    totalDuration: "1h10",
    rows: [
      { label: "Evaluation des acquis des stagiaires (cas concrets de synthese)", duration: "01h00" },
      { label: "Bilan et evaluation de la formation", duration: "10 min" }
    ]
  }
];

Font.registerHyphenationCallback((word) => [word]);

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

const attendanceStyles = StyleSheet.create({
  page: {
    backgroundColor: "#fffdf8"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain"
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: "#d7d0c2",
    backgroundColor: "#faf6ee",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10
  },
  summaryChip: {
    borderWidth: 1,
    borderColor: "#ddd4c4",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    color: "#47514c"
  },
  slotCard: {
    borderWidth: 1,
    borderColor: "#d7d0c2",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: 700
  },
  slotMeta: {
    fontSize: 10,
    color: "#5b655f"
  },
  slotStatus: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: 700,
    color: "#1d2a24",
    backgroundColor: "#ede6d8"
  },
  slotTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd4c4",
    paddingBottom: 6,
    marginBottom: 4
  },
  colCandidate: {
    width: "38%"
  },
  colStatus: {
    width: "18%"
  },
  colTime: {
    width: "24%"
  },
  colChannel: {
    width: "20%"
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#5b655f",
    textTransform: "uppercase"
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#efe8db"
  },
  tableCell: {
    fontSize: 9,
    color: "#1d2a24",
    paddingRight: 6
  },
  footerNote: {
    marginTop: 8,
    fontSize: 9,
    color: "#5b655f",
    lineHeight: 1.5
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
    marginBottom: 16
  },
  identificationGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18
  },
  identificationCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14
  },
  identificationLabel: {
    fontSize: 9.5,
    textTransform: "uppercase",
    color: "#5b655f",
    marginBottom: 4
  },
  identificationValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1d2a24"
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
  validationBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  validationBadge: {
    paddingTop: 7,
    paddingRight: 12,
    paddingBottom: 7,
    paddingLeft: 12,
    borderRadius: 999,
    borderWidth: 1
  },
  validationBadgeValidated: {
    backgroundColor: "#1f5f43",
    borderColor: "#1f5f43"
  },
  validationBadgePending: {
    backgroundColor: "#efe8d1",
    borderColor: "#d9c79b"
  },
  validationBadgeRejected: {
    backgroundColor: "#6c2d26",
    borderColor: "#6c2d26"
  },
  validationBadgeText: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  validationBadgeTextPending: {
    color: "#6d571f"
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
  validationHint: {
    fontSize: 9.5,
    lineHeight: 1.4,
    color: "#4e5f57",
    marginTop: 8
  },
  verificationCard: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    marginTop: 6,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  verificationCopy: {
    flex: 1,
    paddingRight: 8
  },
  verificationTitle: {
    fontSize: 9.5,
    color: "#4e5f57",
    textTransform: "uppercase",
    marginBottom: 3
  },
  verificationLead: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1d2a24",
    marginBottom: 3
  },
  verificationBody: {
    fontSize: 9,
    lineHeight: 1.35,
    color: "#5b655f"
  },
  verificationRef: {
    fontSize: 9,
    color: "#285943",
    marginTop: 4
  },
  qrShell: {
    width: 84,
    height: 84,
    borderWidth: 1,
    borderColor: "#d7d0c2",
    backgroundColor: "#fffdf8",
    alignItems: "center",
    justifyContent: "center",
    padding: 5
  },
  qrImage: {
    width: 72,
    height: 72,
    objectFit: "contain"
  },
  qrFallback: {
    fontSize: 8.5,
    textAlign: "center",
    color: "#5b655f",
    lineHeight: 1.3
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  legalBlock: {
    maxWidth: 300
  },
  legalText: {
    fontSize: 10,
    color: "#47514c",
    marginBottom: 3
  },
  legalFootnote: {
    fontSize: 9,
    lineHeight: 1.35,
    color: "#5b655f",
    marginTop: 8
  },
  signatureBlock: {
    width: 220,
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14
  },
  signatureBlockSlim: {
    width: 180,
    alignItems: "flex-start"
  },
  signatureBlockTransparent: {
    width: 220,
    alignItems: "flex-start"
  },
  signatureLabelSlim: {
    fontSize: 8.5,
    marginBottom: 3
  },
  signatureImageSlim: {
    width: 96,
    height: 40,
    objectFit: "contain",
    marginBottom: 4
  },
  signatureSection: {
    marginBottom: 12
  },
  signatureSectionLast: {
    marginBottom: 0
  },
  signatureLabel: {
    fontSize: 9.5,
    textTransform: "uppercase",
    color: "#5b655f",
    marginBottom: 5
  },
  signatureImage: {
    width: 120,
    height: 56,
    objectFit: "contain",
    marginBottom: 8
  },
  signatureLine: {
    width: 130,
    borderBottomWidth: 1,
    borderBottomColor: "#9da6a1",
    marginBottom: 8
  },
  signatureLineSlim: {
    width: 96,
    marginBottom: 4
  },
  signatureNameSlim: {
    fontSize: 9.2
  },
  signatureTitleSlim: {
    fontSize: 8.2,
    marginTop: 1
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: "left"
  },
  signatureTitle: {
    fontSize: 9,
    color: "#5b655f",
    textAlign: "left",
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
  topBar: {
    height: 10,
    backgroundColor: "#285943",
    marginBottom: 18
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },
  headerLeft: {
    maxWidth: 300
  },
  headerRight: {
    maxWidth: 230,
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
    letterSpacing: 1.4,
    marginBottom: 6
  },
  invoiceTitle: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 8
  },
  invoiceMeta: {
    fontSize: 10,
    color: "#4e5f57",
    marginBottom: 3
  },
  metaCard: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 12
  },
  metaGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  metaCell: {
    minWidth: 110,
    paddingRight: 8
  },
  metaLabel: {
    fontSize: 8.8,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: "#5b655f",
    marginBottom: 4
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1d2a24"
  },
  sectionRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
    marginBottom: 16
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14,
    minHeight: 146
  },
  cardTitle: {
    fontSize: 9.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#5b655f",
    marginBottom: 9
  },
  cardPrimary: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1d2a24",
    marginBottom: 4
  },
  cardLine: {
    fontSize: 10,
    color: "#4e5f57",
    marginBottom: 3,
    lineHeight: 1.35
  },
  itemsTable: {
    borderWidth: 1,
    borderColor: "#d8d0c2",
    backgroundColor: "#ffffff",
    marginBottom: 16
  },
  itemsHeader: {
    flexDirection: "row",
    backgroundColor: "#edf4ef",
    borderBottomWidth: 1,
    borderBottomColor: "#d8d0c2",
    paddingTop: 8,
    paddingBottom: 8
  },
  itemsHeaderText: {
    fontSize: 8.8,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#335746"
  },
  itemRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da",
    minHeight: 44,
    alignItems: "center"
  },
  itemRowLast: {
    borderBottomWidth: 0
  },
  designationCol: {
    width: "48%",
    paddingTop: 9,
    paddingRight: 10,
    paddingBottom: 9,
    paddingLeft: 12
  },
  quantityCol: {
    width: "12%",
    paddingTop: 9,
    paddingRight: 10,
    paddingBottom: 9,
    textAlign: "center"
  },
  unitCol: {
    width: "20%",
    paddingTop: 9,
    paddingRight: 10,
    paddingBottom: 9,
    textAlign: "right"
  },
  totalCol: {
    width: "20%",
    paddingTop: 9,
    paddingRight: 12,
    paddingBottom: 9,
    textAlign: "right"
  },
  itemTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#1d2a24",
    marginBottom: 2
  },
  itemDescription: {
    fontSize: 9.3,
    color: "#5b655f",
    lineHeight: 1.35
  },
  itemValue: {
    fontSize: 10.2,
    color: "#1d2a24"
  },
  totalsWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16
  },
  totalsCard: {
    width: 250,
    borderWidth: 1,
    borderColor: "#d8d0c2",
    backgroundColor: "#ffffff"
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da"
  },
  totalRowLast: {
    borderBottomWidth: 0,
    backgroundColor: "#edf5f0"
  },
  totalLabel: {
    fontSize: 10.2,
    color: "#4e5f57"
  },
  totalValue: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#1d2a24"
  },
  totalValueStrong: {
    fontSize: 14,
    fontWeight: 700,
    color: "#174734"
  },
  notesBlock: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 14
  },
  notesText: {
    fontSize: 10,
    color: "#1d2a24",
    lineHeight: 1.45
  },
  footer: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14
  },
  footerTitle: {
    fontSize: 9.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#5b655f",
    marginBottom: 8
  },
  footerLine: {
    fontSize: 9.3,
    color: "#4e5f57",
    lineHeight: 1.4,
    marginBottom: 4
  }
});

const convocationProgrammeStyles = StyleSheet.create({
  page: {
    backgroundColor: "#fcfaf5"
  },
  heroShell: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d6d0c3",
    backgroundColor: "#ffffff"
  },
  heroBand: {
    backgroundColor: "#1f3028",
    paddingTop: 12,
    paddingRight: 18,
    paddingBottom: 12,
    paddingLeft: 18
  },
  heroKicker: {
    fontSize: 9.2,
    color: "#d8e6dd",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4
  },
  heroTitle: {
    fontSize: 17.2,
    lineHeight: 1.15,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 5
  },
  heroSubtitle: {
    fontSize: 9.4,
    lineHeight: 1.35,
    color: "#d8e6dd"
  },
  metaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#d6d0c3"
  },
  metaCol: {
    flex: 1,
    paddingTop: 7,
    paddingRight: 12,
    paddingBottom: 7,
    paddingLeft: 12,
    borderRightWidth: 1,
    borderRightColor: "#d6d0c3"
  },
  metaColLast: {
    borderRightWidth: 0
  },
  metaLabel: {
    fontSize: 8.5,
    color: "#5e665f",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1d2a24"
  },
  tableShell: {
    borderWidth: 1,
    borderColor: "#d6d0c3",
    backgroundColor: "#ffffff",
    marginBottom: 14
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e5ebe7",
    borderBottomWidth: 1,
    borderBottomColor: "#d6d0c3"
  },
  tableHeaderCell: {
    paddingTop: 7,
    paddingRight: 10,
    paddingBottom: 7,
    paddingLeft: 10,
    fontSize: 8.4,
    fontWeight: 700,
    color: "#274738",
    textTransform: "uppercase"
  },
  numberCol: {
    width: "10%",
    borderRightWidth: 1,
    borderRightColor: "#e4ded2"
  },
  titleCol: {
    width: "72%",
    borderRightWidth: 1,
    borderRightColor: "#e4ded2"
  },
  durationCol: {
    width: "18%"
  },
  sectionRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f2",
    borderBottomWidth: 1,
    borderBottomColor: "#d9e3dc"
  },
  sectionCell: {
    paddingTop: 6,
    paddingRight: 10,
    paddingBottom: 6,
    paddingLeft: 10
  },
  sectionIndex: {
    fontSize: 9.2,
    fontWeight: 700,
    color: "#285943",
    textAlign: "center"
  },
  sectionTitle: {
    fontSize: 9.4,
    fontWeight: 700,
    color: "#1d2a24"
  },
  sectionDuration: {
    fontSize: 9,
    fontWeight: 700,
    color: "#285943",
    textAlign: "right"
  },
  itemRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da",
    backgroundColor: "#ffffff"
  },
  itemRowLast: {
    borderBottomWidth: 0
  },
  itemCell: {
    paddingTop: 6,
    paddingRight: 10,
    paddingBottom: 6,
    paddingLeft: 10
  },
  itemText: {
    fontSize: 9.1,
    lineHeight: 1.3,
    color: "#23312b"
  },
  itemDuration: {
    fontSize: 9.1,
    fontWeight: 700,
    color: "#23312b",
    textAlign: "right"
  },
  note: {
    fontSize: 8.8,
    color: "#4d5751",
    marginTop: 4
  },
  pageFooter: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#d7d0c3"
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  footerOrg: {
    fontSize: 8.8,
    fontWeight: 700,
    color: "#1d2a24"
  },
  footerText: {
    fontSize: 8.1,
    color: "#5b655f",
    marginTop: 2
  },
  footerRight: {
    fontSize: 8.4,
    color: "#5b655f",
    textAlign: "right"
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

function getOrganizationAddressLines(organizationSettings: OrganizationBranding) {
  return formatAddressLines({
    address: organizationSettings.address,
    postalCode: organizationSettings.postal_code,
    city: organizationSettings.city,
    country: organizationSettings.country
  });
}

function OrganizationIdentityBlock({
  organizationSettings,
  align = "right"
}: {
  organizationSettings: OrganizationBranding;
  align?: "right" | "left";
}) {
  const ndaLabel = formatTrainingDeclarationNumber(organizationSettings.training_declaration_number);
  const addressLines = getOrganizationAddressLines(organizationSettings);
  const blockStyle = align === "left" ? [certificateStyles.organizationBlock, { textAlign: "left" as const }] : certificateStyles.organizationBlock;

  return (
    <View style={blockStyle}>
      <Text style={certificateStyles.organizationName}>{organizationSettings.organization_name}</Text>
      {addressLines.map((line) => (
        <Text key={line} style={certificateStyles.organizationLine}>
          {line}
        </Text>
      ))}
      {organizationSettings.siret ? (
        <Text style={certificateStyles.organizationLine}>SIRET : {organizationSettings.siret}</Text>
      ) : null}
      {ndaLabel ? <Text style={certificateStyles.organizationLine}>NDA : {ndaLabel}</Text> : null}
    </View>
  );
}

function ConvocationProgrammeFooter({
  organizationSettings
}: {
  organizationSettings: OrganizationBranding;
}) {
  const addressLines = getOrganizationAddressLines(organizationSettings);
  const ndaLabel = formatTrainingDeclarationNumber(organizationSettings.training_declaration_number);
  const footerBits = [
    ...addressLines,
    organizationSettings.siret ? `SIRET ${organizationSettings.siret}` : null,
    ndaLabel ? `NDA ${ndaLabel}` : null
  ].filter(Boolean);

  return (
    <View style={convocationProgrammeStyles.pageFooter}>
      <View style={convocationProgrammeStyles.footerRow}>
        <View>
          <Text style={convocationProgrammeStyles.footerOrg}>{organizationSettings.organization_name}</Text>
          <Text style={convocationProgrammeStyles.footerText}>{footerBits.join(" • ")}</Text>
        </View>
        <Text style={convocationProgrammeStyles.footerRight}>Programme SST joint a la convocation</Text>
      </View>
    </View>
  );
}

function ConvocationProgrammePage({
  title,
  subtitle,
  session,
  candidateFullName,
  sections,
  organizationSettings,
  note
}: {
  title: string;
  subtitle: string;
  session: SessionItem;
  candidateFullName: string;
  sections: SstProgrammeSection[];
  organizationSettings: OrganizationBranding;
  note?: string;
}) {
  return (
    <Page size="A4" style={[shared.page, convocationProgrammeStyles.page]}>
      <View style={convocationProgrammeStyles.heroShell}>
        <View style={convocationProgrammeStyles.heroBand}>
          <Text style={convocationProgrammeStyles.heroKicker}>Programme pedagogique SST</Text>
          <Text style={convocationProgrammeStyles.heroTitle}>{title}</Text>
          <Text style={convocationProgrammeStyles.heroSubtitle}>{subtitle}</Text>
        </View>
        <View style={convocationProgrammeStyles.metaRow}>
          <View style={convocationProgrammeStyles.metaCol}>
            <Text style={convocationProgrammeStyles.metaLabel}>Participant</Text>
            <Text style={convocationProgrammeStyles.metaValue}>{candidateFullName}</Text>
          </View>
          <View style={convocationProgrammeStyles.metaCol}>
            <Text style={convocationProgrammeStyles.metaLabel}>Session</Text>
            <Text style={convocationProgrammeStyles.metaValue}>{formatDateRange(session.start_date, session.end_date)}</Text>
          </View>
          <View style={[convocationProgrammeStyles.metaCol, convocationProgrammeStyles.metaColLast]}>
            <Text style={convocationProgrammeStyles.metaLabel}>Lieu</Text>
            <Text style={convocationProgrammeStyles.metaValue}>{session.location}</Text>
          </View>
        </View>
      </View>

      <View style={convocationProgrammeStyles.tableShell}>
        <View style={convocationProgrammeStyles.tableHeader}>
          <View style={convocationProgrammeStyles.numberCol}>
            <Text style={convocationProgrammeStyles.tableHeaderCell}>N°</Text>
          </View>
          <View style={convocationProgrammeStyles.titleCol}>
            <Text style={convocationProgrammeStyles.tableHeaderCell}>Programme</Text>
          </View>
          <View style={convocationProgrammeStyles.durationCol}>
            <Text style={convocationProgrammeStyles.tableHeaderCell}>Duree</Text>
          </View>
        </View>

        {sections.map((section, sectionIndex) => (
          <View key={`${section.title}-${sectionIndex}`}>
            <View style={convocationProgrammeStyles.sectionRow}>
              <View style={[convocationProgrammeStyles.numberCol, convocationProgrammeStyles.sectionCell]}>
                <Text style={convocationProgrammeStyles.sectionIndex}>{section.index || ""}</Text>
              </View>
              <View style={[convocationProgrammeStyles.titleCol, convocationProgrammeStyles.sectionCell]}>
                <Text style={convocationProgrammeStyles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={[convocationProgrammeStyles.durationCol, convocationProgrammeStyles.sectionCell]}>
                <Text style={convocationProgrammeStyles.sectionDuration}>{section.totalDuration || ""}</Text>
              </View>
            </View>

            {section.rows.map((row, rowIndex) => {
              const isLastRow = rowIndex === section.rows.length - 1 && sectionIndex === sections.length - 1;

              return (
                <View
                  key={`${section.title}-${row.label}`}
                  style={isLastRow ? [convocationProgrammeStyles.itemRow, convocationProgrammeStyles.itemRowLast] : convocationProgrammeStyles.itemRow}
                >
                  <View style={[convocationProgrammeStyles.numberCol, convocationProgrammeStyles.itemCell]}>
                    <Text style={convocationProgrammeStyles.itemText}></Text>
                  </View>
                  <View style={[convocationProgrammeStyles.titleCol, convocationProgrammeStyles.itemCell]}>
                    <Text style={convocationProgrammeStyles.itemText}>{row.label}</Text>
                  </View>
                  <View style={[convocationProgrammeStyles.durationCol, convocationProgrammeStyles.itemCell]}>
                    <Text style={convocationProgrammeStyles.itemDuration}>{row.duration}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {note ? <Text style={convocationProgrammeStyles.note}>{note}</Text> : null}

      <ConvocationProgrammeFooter organizationSettings={organizationSettings} />
    </Page>
  );
}

export function AttendanceDocument({
  session,
  candidates,
  organizationSettings,
  attendanceOverview = null
}: {
  session: SessionItem;
  candidates: SessionCandidate[];
  organizationSettings: OrganizationBranding;
  attendanceOverview?: AttendanceOverview | null;
}) {
  const slotStatusLabel = {
    draft: "Brouillon",
    sent: "Envoye",
    open: "Ouvert",
    closed: "Cloture"
  } as const;

  return (
    <Document>
      <Page size="A4" style={[shared.page, attendanceStyles.page]}>
        <View style={attendanceStyles.header}>
          <View>
            <Text style={shared.title}>Feuille de presence SST</Text>
            <Text style={shared.subtitle}>
              {session.title} • {formatDate(session.start_date)} au {formatDate(session.end_date)} • {session.location}
            </Text>
          </View>
          {organizationSettings.resolved_logo_url ? (
            <Image src={organizationSettings.resolved_logo_url} style={attendanceStyles.logo} />
          ) : null}
        </View>

        <View style={attendanceStyles.summaryCard}>
          <OrganizationIdentityBlock organizationSettings={organizationSettings} align="left" />
          <View style={attendanceStyles.summaryGrid}>
            <Text style={attendanceStyles.summaryChip}>Formateur : {session.trainer_name || "Non renseigne"}</Text>
            <Text style={attendanceStyles.summaryChip}>Duree : {formatDurationHours(session.duration_hours)}</Text>
            <Text style={attendanceStyles.summaryChip}>Participants : {candidates.length}</Text>
            <Text style={attendanceStyles.summaryChip}>
              Emargement : {attendanceOverview?.enabled ? "numerique" : "manuel / PDF"}
            </Text>
          </View>
        </View>

        {attendanceOverview?.enabled && attendanceOverview.slots.length ? (
          attendanceOverview.slots.map((slot) => (
            <View key={slot.id} style={attendanceStyles.slotCard} wrap={false}>
              <View style={attendanceStyles.slotHeader}>
                <View>
                  <Text style={attendanceStyles.slotTitle}>{slot.slot_label}</Text>
                  <Text style={attendanceStyles.slotMeta}>
                    {formatDate(slot.slot_date)} • {slot.present_count}/{slot.total_candidates} presents confirmes
                  </Text>
                </View>
                <Text style={attendanceStyles.slotStatus}>{slotStatusLabel[slot.status]}</Text>
              </View>

              <View style={attendanceStyles.slotTableHeader}>
                <View style={attendanceStyles.colCandidate}>
                  <Text style={attendanceStyles.tableHeaderText}>Candidat</Text>
                </View>
                <View style={attendanceStyles.colStatus}>
                  <Text style={attendanceStyles.tableHeaderText}>Statut</Text>
                </View>
                <View style={attendanceStyles.colTime}>
                  <Text style={attendanceStyles.tableHeaderText}>Horodatage</Text>
                </View>
                <View style={attendanceStyles.colChannel}>
                  <Text style={attendanceStyles.tableHeaderText}>Envoi</Text>
                </View>
              </View>

              {slot.responses.map((response) => {
                const effectiveStatus = response.trainer_override_status ?? response.response_status;
                const statusLabel =
                  effectiveStatus === "present"
                    ? "Present"
                    : effectiveStatus === "absent"
                      ? "Absent"
                      : effectiveStatus === "issue"
                        ? "Probleme"
                        : "En attente";
                const respondedAt = response.responded_at
                  ? new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short"
                    }).format(new Date(response.responded_at))
                  : "Non confirme";

                return (
                  <View key={response.id} style={attendanceStyles.tableRow}>
                    <Text style={[attendanceStyles.tableCell, attendanceStyles.colCandidate]}>{response.candidate_name}</Text>
                    <Text style={[attendanceStyles.tableCell, attendanceStyles.colStatus]}>{statusLabel}</Text>
                    <Text style={[attendanceStyles.tableCell, attendanceStyles.colTime]}>{respondedAt}</Text>
                    <Text style={[attendanceStyles.tableCell, attendanceStyles.colChannel]}>
                      {response.delivery_status === "sent" ? "Email envoye" : response.delivery_status === "failed" ? "Echec" : "En attente"}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))
        ) : (
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
        )}

        <Text style={attendanceStyles.footerNote}>
          Document interne de suivi de presence. En mode numerique, les confirmations sont horodatees via un lien
          personnel, puis consolidees dans le registre de session.
        </Text>
      </Page>
    </Document>
  );
}

export function ComplaintDocument({
  invoice,
  complaint,
  organizationSettings
}: {
  invoice: InvoiceDetail;
  complaint: InvoiceComplaint | null;
  organizationSettings: OrganizationBranding;
}) {
  const customerSummary = complaint?.dissatisfaction_summary?.trim() ?? "";
  const customerDetails = complaint?.complaint_details?.trim() ?? "";
  const customerExpectation = complaint?.customer_expectation?.trim() ?? "";
  const rootCause = complaint?.root_cause?.trim() ?? "";
  const correctiveActions = complaint?.corrective_actions?.trim() ?? "";
  const preventiveActions = complaint?.preventive_actions?.trim() ?? "";
  const followUpActions = complaint?.follow_up_actions?.trim() ?? "";
  const internalNotes = complaint?.internal_notes?.trim() ?? "";
  const hasInternalFollowUp = Boolean(rootCause || correctiveActions || preventiveActions || followUpActions || internalNotes);
  const lines = [
    ["Facture", invoice.invoice_number ?? `FACT-${invoice.id}`],
    ["Societe", invoice.company.company_name],
    ["Devis", invoice.quote.quote_number],
    ["Statut", complaint?.status ?? "Ouverte / a instruire"],
    ["Niveau", complaint?.severity ?? "Moyenne"],
    ["Envoi avec facture", complaint?.send_with_invoice ? "Oui" : "Non"],
    ["Dernier envoi", complaint?.sent_with_invoice_at ? formatDate(complaint.sent_with_invoice_at) : "Non envoye"],
    ["Date de resolution", complaint?.resolved_at ? formatDate(complaint.resolved_at) : "Non renseignee"]
  ] as const;

  return (
    <Document>
      <Page size="A4" style={shared.page}>
        <View style={attendanceStyles.header}>
          <View>
            <Text style={shared.title}>Fiche de reclamation / insatisfaction</Text>
            <Text style={shared.subtitle}>
              {invoice.quote.title} • {invoice.company.company_name}
            </Text>
          </View>
          {organizationSettings.resolved_logo_url ? (
            <Image src={organizationSettings.resolved_logo_url} style={attendanceStyles.logo} />
          ) : null}
        </View>

        <View style={attendanceStyles.summaryCard}>
          <OrganizationIdentityBlock organizationSettings={organizationSettings} align="left" />
          <View style={attendanceStyles.summaryGrid}>
            {lines.map(([label, value]) => (
              <Text key={label} style={attendanceStyles.summaryChip}>
                {label} : {value}
              </Text>
            ))}
          </View>
        </View>

        <View style={shared.section}>
          <View style={{ marginBottom: 12 }}>
            <Text style={shared.strong}>Cadre a completer par le client</Text>
            <Text style={[shared.label, { marginTop: 4 }]}>
              Si vous constatez une insatisfaction ou souhaitez signaler une reclamation, merci de completer les rubriques
              ci-dessous et de nous retourner cette fiche.
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={shared.strong}>1. Synthese de l&apos;insatisfaction</Text>
            <Text style={[shared.label, { marginTop: 4, color: "#1d2a24", lineHeight: 1.45 }]}>
              {customerSummary || "................................................................................................................"}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={shared.strong}>2. Reclamation detaillee</Text>
            <Text style={[shared.label, { marginTop: 4, color: "#1d2a24", lineHeight: 1.45 }]}>
              {customerDetails || "................................................................................................................"}
            </Text>
            <Text style={[shared.label, { color: "#1d2a24", lineHeight: 1.45 }]}>
              {customerDetails ? "" : "................................................................................................................"}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={shared.strong}>3. Attente du client</Text>
            <Text style={[shared.label, { marginTop: 4, color: "#1d2a24", lineHeight: 1.45 }]}>
              {customerExpectation || "................................................................................................................"}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={shared.strong}>4. Coordonnees du retour</Text>
            <Text style={[shared.label, { marginTop: 4, color: "#1d2a24" }]}>
              Nom / fonction : .............................................................................................
            </Text>
            <Text style={[shared.label, { marginTop: 4, color: "#1d2a24" }]}>
              Date : ........................................ Signature : ..................................................
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={shared.strong}>Traitement interne et mesures correctives</Text>
            <Text style={[shared.label, { marginTop: 4 }]}>
              Partie a renseigner apres retour client par l&apos;organisme de formation.
            </Text>
          </View>

          {[
            ["Analyse / cause racine", rootCause],
            ["Mesures correctives", correctiveActions],
            ["Mesures preventives", preventiveActions],
            ["Suivi / verification d'efficacite", followUpActions],
            ["Notes internes", internalNotes]
          ].map(([title, content]) => (
            <View key={title} style={{ marginBottom: 12 }}>
              <Text style={shared.strong}>{title}</Text>
              <Text style={[shared.label, { marginTop: 4, color: "#1d2a24", lineHeight: 1.45 }]}>
                {content || (hasInternalFollowUp ? "Non renseigne." : "................................................................................................................")}
              </Text>
              {!content && !hasInternalFollowUp ? (
                <Text style={[shared.label, { color: "#1d2a24", lineHeight: 1.45 }]}>
                  ................................................................................................................
                </Text>
              ) : null}
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
  organizationSettings,
  documentRef = null,
  verificationQrCodeDataUrl = null
}: {
  session: SessionItem;
  candidateSession: SessionCandidate;
  organizationSettings: OrganizationBranding;
  documentRef?: string | null;
  verificationQrCodeDataUrl?: string | null;
}) {
  const candidateFullName = `${candidateSession.candidate.first_name} ${candidateSession.candidate.last_name}`;
  const validationStatus = validationLabel[candidateSession.candidate.validation_status];
  const validationDate = candidateSession.candidate.validated_at
    ? formatDate(candidateSession.candidate.validated_at)
    : formatDate(new Date().toISOString());
  const validationBadgeLabel =
    candidateSession.candidate.validation_status === "validated"
      ? "✓ Valide"
      : candidateSession.candidate.validation_status === "not_validated"
        ? "Non valide"
        : "En attente";
  const validationBadgeStyle =
    candidateSession.candidate.validation_status === "validated"
      ? [certificateStyles.validationBadge, certificateStyles.validationBadgeValidated]
      : candidateSession.candidate.validation_status === "not_validated"
        ? [certificateStyles.validationBadge, certificateStyles.validationBadgeRejected]
        : [certificateStyles.validationBadge, certificateStyles.validationBadgePending];
  const validationBadgeTextStyle =
    candidateSession.candidate.validation_status === "pending"
      ? [certificateStyles.validationBadgeText, certificateStyles.validationBadgeTextPending]
      : certificateStyles.validationBadgeText;
  const trainerName = session.trainer_name || "Formateur non renseigne";
  const attestationAuthor = organizationSettings.certificate_signatory_name || organizationSettings.organization_name;
  const attestationAuthorTitle = organizationSettings.certificate_signatory_title || "Organisme de formation";
  const organizationAddressLines = getOrganizationAddressLines(organizationSettings);

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
            <OrganizationIdentityBlock organizationSettings={organizationSettings} />
          </View>

          <Text style={certificateStyles.certificateTitle}>Attestation de fin de formation</Text>
          <Text style={certificateStyles.certificateSubtitle}>Sauveteur Secouriste du Travail (SST)</Text>

          <Text style={certificateStyles.intro}>Nous attestons que le stagiaire suivant a suivi la formation :</Text>
          <Text style={certificateStyles.candidateName}>{candidateFullName}</Text>
          <Text style={certificateStyles.trainingTitle}>{TRAINING_TITLE}</Text>

          <View style={certificateStyles.identificationGrid}>
            <View style={certificateStyles.identificationCard}>
              <Text style={certificateStyles.identificationLabel}>Reference attestation</Text>
              <Text style={certificateStyles.identificationValue}>{documentRef || "A attribuer"}</Text>
            </View>
            <View style={certificateStyles.identificationCard}>
              <Text style={certificateStyles.identificationLabel}>Date de delivrance</Text>
              <Text style={certificateStyles.identificationValue}>{validationDate}</Text>
            </View>
          </View>

          <View style={certificateStyles.detailsCard}>
            <DetailRow label="Dates de session" value={formatDateRange(session.start_date, session.end_date)} />
            <DetailRow label="Lieu" value={session.location} />
            <DetailRow label="Duree" value={formatDurationHours(session.duration_hours)} />
            <DetailRow label="Formateur" value={session.trainer_name || "Non renseigne"} isLast />
          </View>

          <View style={certificateStyles.validationBox}>
            <Text style={certificateStyles.validationTitle}>Validation</Text>
            <View style={certificateStyles.validationBadgeRow}>
              <View style={validationBadgeStyle}>
                <Text style={validationBadgeTextStyle}>{validationBadgeLabel}</Text>
              </View>
            </View>
            <Text style={certificateStyles.validationValue}>{validationStatus}</Text>
            <Text style={certificateStyles.validationDate}>Date de delivrance : {validationDate}</Text>
            {candidateSession.candidate.validation_status === "validated" ? (
              <Text style={certificateStyles.validationHint}>
                Validite indicative : 24 mois, sous reserve d&apos;enregistrement et de delivrance du certificat officiel
                dans le dispositif applicable.
              </Text>
            ) : null}
          </View>

          <View style={certificateStyles.verificationCard} wrap={false}>
            <View style={certificateStyles.verificationCopy}>
              <Text style={certificateStyles.verificationTitle}>Verification</Text>
              <Text style={certificateStyles.verificationLead}>
                {verificationQrCodeDataUrl ? "Scan pour verifier ce document" : "Verification manuelle"}
              </Text>
              <Text style={certificateStyles.verificationBody}>
                Cette verification permet de confirmer l&apos;existence de l&apos;attestation dans le registre
                documentaire interne.
              </Text>
              {documentRef ? (
                <Text style={certificateStyles.verificationRef}>Reference : {documentRef}</Text>
              ) : null}
            </View>

            <View style={certificateStyles.qrShell}>
              {verificationQrCodeDataUrl ? (
                <Image src={verificationQrCodeDataUrl} style={certificateStyles.qrImage} />
              ) : (
                <Text style={certificateStyles.qrFallback}>Verification{"\n"}interne</Text>
              )}
            </View>
          </View>

          {organizationSettings.qualiopi_mention ? (
            <Text style={certificateStyles.qualiopi}>{organizationSettings.qualiopi_mention}</Text>
          ) : null}

          <View style={certificateStyles.footer}>
            <View style={certificateStyles.legalBlock}>
              <Text style={certificateStyles.legalText}>{organizationSettings.organization_name}</Text>
              {organizationAddressLines.map((line) => (
                <Text key={line} style={certificateStyles.legalText}>
                  {line}
                </Text>
              ))}
              <Text style={certificateStyles.legalText}>Formation suivie : {TRAINING_TITLE}</Text>
              <Text style={certificateStyles.legalFootnote}>
                Cette attestation interne de fin de formation ne se substitue pas au certificat officiel delivre dans le
                cadre du dispositif SST / FORPREV lorsque celui-ci est applicable.
              </Text>
            </View>

            <View style={certificateStyles.signatureBlockTransparent}>
              <View style={certificateStyles.signatureSection}>
                <Text style={certificateStyles.signatureLabel}>Formation animee par</Text>
                <Text style={certificateStyles.signatureName}>{trainerName}</Text>
                <Text style={certificateStyles.signatureTitle}>Formateur SST</Text>
              </View>

              <View style={[certificateStyles.signatureSection, certificateStyles.signatureSectionLast]}>
                <Text style={certificateStyles.signatureLabel}>Attestation etablie par</Text>
                {organizationSettings.resolved_signature_url ? (
                  <Image src={organizationSettings.resolved_signature_url} style={certificateStyles.signatureImage} />
                ) : (
                  <View style={certificateStyles.signatureLine} />
                )}
                <Text style={certificateStyles.signatureName}>{attestationAuthor}</Text>
                <Text style={certificateStyles.signatureTitle}>{attestationAuthorTitle}</Text>
              </View>
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
  organizationSettings,
  welcomePackUrl
}: {
  session: SessionItem;
  candidateSession: SessionCandidate;
  organizationSettings: OrganizationBranding;
  welcomePackUrl?: string | null;
}) {
  const candidateFullName = `${candidateSession.candidate.first_name} ${candidateSession.candidate.last_name}`;
  const addressLine = [session.location, session.start_date ? formatDateRange(session.start_date, session.end_date) : null]
    .filter(Boolean)
    .join(" • ");
  const trainerName = session.trainer_name || "Formateur non renseigne";
  const organizationAddressLines = getOrganizationAddressLines(organizationSettings);
  const convocationAuthor = organizationSettings.certificate_signatory_name || organizationSettings.organization_name;
  const convocationAuthorTitle = organizationSettings.certificate_signatory_title || "Organisme de formation";

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
            <OrganizationIdentityBlock organizationSettings={organizationSettings} />
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
            <Text style={[certificateStyles.validationDate, { marginTop: 8 }]}>
              Le programme pedagogique detaille de la formation est joint aux pages suivantes.
            </Text>
            {welcomePackUrl ? (
              <Text style={[certificateStyles.validationDate, { marginTop: 8 }]}>
                Livret d&apos;accueil et reglement interieur :
                {" "}
                <PdfLink src={welcomePackUrl} style={{ color: "#285943", textDecoration: "none" }}>
                  consulter le document
                </PdfLink>
              </Text>
            ) : null}
          </View>

          <View style={certificateStyles.footer}>
            <View style={certificateStyles.legalBlock}>
              <Text style={certificateStyles.legalText}>{organizationSettings.organization_name}</Text>
              {organizationAddressLines.map((line) => (
                <Text key={line} style={certificateStyles.legalText}>
                  {line}
                </Text>
              ))}
              <Text style={certificateStyles.legalText}>Formation convoquee : {TRAINING_TITLE}</Text>
            </View>

            <View style={certificateStyles.signatureBlockSlim}>
              <Text style={[certificateStyles.signatureLabel, certificateStyles.signatureLabelSlim]}>Formation animee par</Text>
              <Text style={[certificateStyles.signatureName, certificateStyles.signatureNameSlim]}>{trainerName}</Text>
              <Text style={[certificateStyles.signatureTitle, certificateStyles.signatureTitleSlim]}>Formateur SST</Text>

              <Text style={[certificateStyles.signatureLabel, certificateStyles.signatureLabelSlim, { marginTop: 8 }]}>
                Convocation etablie par
              </Text>
              {organizationSettings.resolved_signature_url ? (
                <Image src={organizationSettings.resolved_signature_url} style={certificateStyles.signatureImageSlim} />
              ) : (
                <View style={[certificateStyles.signatureLine, certificateStyles.signatureLineSlim]} />
              )}
              <Text style={[certificateStyles.signatureName, certificateStyles.signatureNameSlim]}>{convocationAuthor}</Text>
              <Text style={[certificateStyles.signatureTitle, certificateStyles.signatureTitleSlim]}>{convocationAuthorTitle}</Text>
            </View>
          </View>
        </View>
      </Page>

      <ConvocationProgrammePage
        title="Formation initiale des sauveteurs secouristes du travail"
        subtitle="Deroule pedagogique de la session, presente sous forme de tableau pour accompagner la convocation du participant."
        session={session}
        candidateFullName={candidateFullName}
        sections={SST_PROGRAMME_PAGE_1}
        organizationSettings={organizationSettings}
      />

      <ConvocationProgrammePage
        title="Suite du programme de formation"
        subtitle="Mises en situation, gestes de secours et dispositif de validation du SST."
        session={session}
        candidateFullName={candidateFullName}
        sections={SST_PROGRAMME_PAGE_2}
        organizationSettings={organizationSettings}
        note="*Composition du jury : un formateur SST ayant assure la formation."
      />
    </Document>
  );
}

function QuoteInfoLine({ value }: { value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return <Text style={quoteStyles.infoLine}>{value}</Text>;
}

function InvoiceInfoLine({ value }: { value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return <Text style={invoiceStyles.cardLine}>{value}</Text>;
}

function normalizeMultilineText(value: string | null | undefined) {
  return value
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getClientAddressLines(invoice: InvoiceDetail) {
  return formatAddressLines({
    address: normalizeMultilineText(invoice.company.billing_address),
    postalCode: invoice.company.postal_code,
    city: invoice.company.city
  });
}

function getOrganizationLegalLines(organizationSettings: OrganizationBranding) {
  return [
    organizationSettings.legal_form ? `Forme juridique : ${organizationSettings.legal_form}` : null,
    organizationSettings.share_capital ? `Capital social : ${organizationSettings.share_capital}` : null,
    organizationSettings.siret ? `SIRET : ${organizationSettings.siret}` : null,
    organizationSettings.training_declaration_number
      ? `NDA : ${formatTrainingDeclarationNumber(organizationSettings.training_declaration_number)}`
      : null,
    organizationSettings.vat_number ? `TVA intracommunautaire : ${organizationSettings.vat_number}` : null,
    organizationSettings.contact_email ? `Email : ${organizationSettings.contact_email}` : null,
    organizationSettings.contact_phone ? `Telephone : ${organizationSettings.contact_phone}` : null
  ].filter(Boolean);
}

function getInvoiceStatusLabel(status: string | null | undefined) {
  const normalized = status?.trim().toLowerCase();

  if (normalized === "sent") {
    return "Emise";
  }

  if (normalized === "paid") {
    return "Reglee";
  }

  if (normalized === "overdue") {
    return "En retard";
  }

  return null;
}

function getInvoiceVatNotice(invoice: InvoiceDetail, organizationSettings: OrganizationBranding) {
  const hasVat = Number(invoice.tax_rate) > 0 && Number(invoice.tax_amount) > 0;

  if (hasVat) {
    return `TVA applicable au taux de ${formatPercent(invoice.tax_rate)} sur la presente facture.`;
  }

  if (organizationSettings.vat_exemption_text) {
    return organizationSettings.vat_exemption_text;
  }

  if (organizationSettings.training_declaration_number) {
    return "Exoneration de TVA applicable aux organismes de formation (art. 261-4-4 du CGI).";
  }

  return "TVA non applicable.";
}

export function QuoteDocument({
  quote,
  organizationSettings
}: {
  quote: QuotePdfData;
  organizationSettings: OrganizationBranding;
}) {
  const vatAmount = computeQuoteVatAmount(quote.price_ht, quote.vat_rate);
  const companyAddressLines = formatAddressLines({
    address: quote.company.billing_address,
    postalCode: quote.company.postal_code,
    city: quote.company.city
  });
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
            <OrganizationIdentityBlock organizationSettings={organizationSettings} />
          </View>
        </View>

        <View style={quoteStyles.twoCols}>
          <View style={quoteStyles.infoCard}>
            <Text style={quoteStyles.infoTitle}>Client</Text>
            <QuoteInfoLine value={quote.company.legal_name || quote.company.company_name} />
            {quote.company.legal_name && quote.company.legal_name !== quote.company.company_name ? (
              <QuoteInfoLine value={quote.company.company_name} />
            ) : null}
            {companyAddressLines.map((line) => (
              <QuoteInfoLine key={line} value={line} />
            ))}
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
  const issueDate = invoice.issue_date || invoice.created_at;
  const clientAddressLines = getClientAddressLines(invoice);
  const organizationAddressLines = getOrganizationAddressLines(organizationSettings);
  const organizationLegalLines = getOrganizationLegalLines(organizationSettings);
  const clientName = invoice.company.legal_name || invoice.company.company_name;
  const clientContact = invoice.company.contact_name;
  const designation = invoice.quote.title?.trim() || "Prestation de formation";
  const description = `Facturation liee au devis ${invoice.quote.quote_number}`;
  const statusLabel = getInvoiceStatusLabel(invoice.status);
  const paymentTerms =
    organizationSettings.payment_terms ||
    (invoice.due_date ? `Paiement a echeance au ${formatDateShort(invoice.due_date)}.` : "Paiement comptant a reception de facture.");
  const dueDateLabel = invoice.due_date ? `Date limite de paiement : ${formatDateShort(invoice.due_date)}.` : null;
  const latePenaltyTerms =
    organizationSettings.late_penalty_terms ||
    "Penalites de retard exigibles en cas de paiement apres la date d'echeance, selon le taux applicable en vigueur.";
  const collectionFeeTerms =
    organizationSettings.collection_fee_terms || "Indemnite forfaitaire pour frais de recouvrement : 40,00 €.";
  const vatNotice = getInvoiceVatNotice(invoice, organizationSettings);

  return (
    <Document>
      <Page size="A4" style={[shared.page, invoiceStyles.page]}>
        <View style={invoiceStyles.topBar} />
        <View style={invoiceStyles.header}>
          <View style={invoiceStyles.headerLeft}>
            {organizationSettings.resolved_logo_url ? (
              <Image src={organizationSettings.resolved_logo_url} style={invoiceStyles.logo} />
            ) : null}
            <Text style={invoiceStyles.overline}>Facture</Text>
            <Text style={invoiceStyles.invoiceTitle}>FACTURE</Text>
            <Text style={invoiceStyles.invoiceMeta}>Document client</Text>
          </View>

          <View style={invoiceStyles.headerRight}>
            <OrganizationIdentityBlock organizationSettings={organizationSettings} />
          </View>
        </View>

        <View style={invoiceStyles.metaCard}>
          <View style={invoiceStyles.metaGrid}>
            <View style={invoiceStyles.metaCell}>
              <Text style={invoiceStyles.metaLabel}>Numero</Text>
              <Text style={invoiceStyles.metaValue}>{invoice.invoice_number || "Facture"}</Text>
            </View>
            <View style={invoiceStyles.metaCell}>
              <Text style={invoiceStyles.metaLabel}>Date d'emission</Text>
              <Text style={invoiceStyles.metaValue}>{formatDateShort(issueDate)}</Text>
            </View>
            <View style={invoiceStyles.metaCell}>
              <Text style={invoiceStyles.metaLabel}>Reference devis</Text>
              <Text style={invoiceStyles.metaValue}>{invoice.quote.quote_number}</Text>
            </View>
            {statusLabel ? (
              <View style={invoiceStyles.metaCell}>
                <Text style={invoiceStyles.metaLabel}>Statut</Text>
                <Text style={invoiceStyles.metaValue}>{statusLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={invoiceStyles.sectionRow}>
          <View style={invoiceStyles.card}>
            <Text style={invoiceStyles.cardTitle}>Emetteur</Text>
            <Text style={invoiceStyles.cardPrimary}>{organizationSettings.organization_name}</Text>
            {organizationAddressLines.map((line) => (
              <InvoiceInfoLine key={line} value={line} />
            ))}
            {organizationLegalLines.map((line) => (
              <InvoiceInfoLine key={line} value={line} />
            ))}
          </View>

          <View style={invoiceStyles.card}>
            <Text style={invoiceStyles.cardTitle}>Client</Text>
            <Text style={invoiceStyles.cardPrimary}>{clientName}</Text>
            {invoice.company.legal_name && invoice.company.legal_name !== invoice.company.company_name ? (
              <InvoiceInfoLine value={invoice.company.company_name} />
            ) : null}
            {clientAddressLines.map((line) => (
              <InvoiceInfoLine key={line} value={line} />
            ))}
            <InvoiceInfoLine value={clientContact ? `Contact : ${clientContact}` : null} />
            <InvoiceInfoLine value={invoice.company.contact_email ? `Email : ${invoice.company.contact_email}` : null} />
            <InvoiceInfoLine value={invoice.company.contact_phone ? `Telephone : ${invoice.company.contact_phone}` : null} />
            <InvoiceInfoLine value={invoice.company.siret ? `SIRET : ${invoice.company.siret}` : null} />
          </View>
        </View>

        <View style={invoiceStyles.itemsTable}>
          <View style={invoiceStyles.itemsHeader}>
            <Text style={[invoiceStyles.itemsHeaderText, invoiceStyles.designationCol]}>Designation</Text>
            <Text style={[invoiceStyles.itemsHeaderText, invoiceStyles.quantityCol]}>Quantite</Text>
            <Text style={[invoiceStyles.itemsHeaderText, invoiceStyles.unitCol]}>Prix unitaire HT</Text>
            <Text style={[invoiceStyles.itemsHeaderText, invoiceStyles.totalCol]}>Total HT</Text>
          </View>

          <View style={[invoiceStyles.itemRow, invoiceStyles.itemRowLast]}>
            <View style={invoiceStyles.designationCol}>
              <Text style={invoiceStyles.itemTitle}>{designation}</Text>
              <Text style={invoiceStyles.itemDescription}>{description}</Text>
            </View>
            <Text style={[invoiceStyles.itemValue, invoiceStyles.quantityCol]}>1</Text>
            <Text style={[invoiceStyles.itemValue, invoiceStyles.unitCol]}>{formatCurrency(invoice.subtotal)}</Text>
            <Text style={[invoiceStyles.itemValue, invoiceStyles.totalCol]}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
        </View>

        <View style={invoiceStyles.totalsWrap}>
          <View style={invoiceStyles.totalsCard}>
            <View style={invoiceStyles.totalRow}>
              <Text style={invoiceStyles.totalLabel}>Total HT</Text>
              <Text style={invoiceStyles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={invoiceStyles.totalRow}>
              <Text style={invoiceStyles.totalLabel}>
                {Number(invoice.tax_rate) > 0 ? `TVA (${formatPercent(invoice.tax_rate)})` : "TVA"}
              </Text>
              <Text style={invoiceStyles.totalValue}>{formatCurrency(invoice.tax_amount)}</Text>
            </View>
            <View style={[invoiceStyles.totalRow, invoiceStyles.totalRowLast]}>
              <Text style={invoiceStyles.totalLabel}>Total TTC</Text>
              <Text style={invoiceStyles.totalValueStrong}>{formatCurrency(invoice.total_ttc)}</Text>
            </View>
          </View>
        </View>

        {invoice.notes ? (
          <View style={invoiceStyles.notesBlock}>
            <Text style={invoiceStyles.footerTitle}>Notes</Text>
            <Text style={invoiceStyles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        <View style={invoiceStyles.footer}>
          <Text style={invoiceStyles.footerTitle}>Mentions legales et reglement</Text>
          <Text style={invoiceStyles.footerLine}>{paymentTerms}</Text>
          {dueDateLabel ? <Text style={invoiceStyles.footerLine}>{dueDateLabel}</Text> : null}
          <Text style={invoiceStyles.footerLine}>{latePenaltyTerms}</Text>
          <Text style={invoiceStyles.footerLine}>{collectionFeeTerms}</Text>
          <Text style={invoiceStyles.footerLine}>{vatNotice}</Text>
        </View>
      </Page>
    </Document>
  );
}

const programmeStyles = StyleSheet.create({
  page: {
    backgroundColor: "#fcfaf5"
  },
  heroShell: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d6d0c3",
    backgroundColor: "#ffffff"
  },
  heroBand: {
    backgroundColor: "#1f3028",
    paddingTop: 14,
    paddingRight: 16,
    paddingBottom: 14,
    paddingLeft: 16
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  heroMain: {
    width: "60%"
  },
  heroBrand: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },
  heroSquare: {
    width: 12,
    height: 12,
    backgroundColor: "#a8c957",
    marginRight: 8
  },
  heroKicker: {
    fontSize: 10,
    color: "#d8e6dd",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  heroTitle: {
    maxWidth: 320,
    fontSize: 19.8,
    lineHeight: 1.14,
    fontWeight: 700,
    color: "#ffffff"
  },
  heroSubtitle: {
    marginTop: 8,
    maxWidth: 325,
    fontSize: 10.1,
    lineHeight: 1.42,
    color: "#d8e6dd"
  },
  heroAside: {
    width: "34%",
    alignItems: "flex-end"
  },
  logo: {
    width: 82,
    height: 48,
    objectFit: "contain",
    marginBottom: 14
  },
  orgBlock: {
    width: "100%"
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metaChip: {
    width: "31.5%",
    minHeight: 64,
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    borderWidth: 1,
    borderColor: "#4a5f55",
    backgroundColor: "#24372f"
  },
  metaChipLabel: {
    fontSize: 7.6,
    color: "#d8e6dd",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6
  },
  metaChipValue: {
    fontSize: 11.7,
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#ffffff"
  },
  heroMetaValue: {
    fontSize: 17
  },
  heroMetaLabel: {
    fontSize: 9.5
  },
  heroFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#d6d0c3"
  },
  heroFooterCol: {
    flex: 1,
    paddingTop: 10,
    paddingRight: 14,
    paddingBottom: 10,
    paddingLeft: 14,
    borderRightWidth: 1,
    borderRightColor: "#d6d0c3"
  },
  heroFooterColLast: {
    borderRightWidth: 0
  },
  heroFooterLabel: {
    fontSize: 9,
    color: "#5e665f",
    textTransform: "uppercase",
    marginBottom: 3,
    letterSpacing: 1
  },
  heroFooterValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1d2a24"
  },
  firstPageColumns: {
    flexDirection: "row",
    marginBottom: 6
  },
  firstLeft: {
    width: "57%",
    paddingRight: 8
  },
  firstRight: {
    width: "43%",
    paddingLeft: 6
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 8,
    marginBottom: 6
  },
  cardEmphasis: {
    backgroundColor: "#f2f6f3",
    borderColor: "#bfd1c4"
  },
  cardTitle: {
    fontSize: 8.2,
    textTransform: "uppercase",
    color: "#285943",
    marginBottom: 4,
    letterSpacing: 0.6
  },
  sectionLead: {
    fontSize: 14,
    lineHeight: 1.1,
    fontWeight: 700,
    color: "#1d2a24",
    marginBottom: 4
  },
  bodyText: {
    fontSize: 9.2,
    lineHeight: 1.35,
    color: "#1d2a24"
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3
  },
  bulletDot: {
    width: 10,
    fontSize: 10.5,
    color: "#285943"
  },
  bulletText: {
    flex: 1,
    fontSize: 9.4,
    lineHeight: 1.28,
    color: "#1d2a24"
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12
  },
  factTile: {
    width: "48%",
    marginRight: "4%",
    marginBottom: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    minHeight: 46
  },
  factTileEven: {
    marginRight: 0
  },
  factLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#6a716b",
    letterSpacing: 0.8,
    marginBottom: 3
  },
  factValue: {
    fontSize: 10.2,
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#1d2a24"
  },
  twoMiniCols: {
    flexDirection: "row",
    marginBottom: 4
  },
  miniCol: {
    flex: 1,
    marginRight: 6
  },
  miniColLast: {
    marginRight: 0
  },
  sectionBand: {
    paddingTop: 8,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10,
    backgroundColor: "#1f3028",
    marginBottom: 10
  },
  sectionBandKicker: {
    fontSize: 9,
    textTransform: "uppercase",
    color: "#cfe0d7",
    letterSpacing: 1.3,
    marginBottom: 4
  },
  sectionBandTitle: {
    fontSize: 15.4,
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.16
  },
  splitShell: {
    borderWidth: 1,
    borderColor: "#d7d0c3",
    backgroundColor: "#ffffff",
    paddingTop: 8,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10,
    marginBottom: 10
  },
  splitEyebrow: {
    fontSize: 8.4,
    textTransform: "uppercase",
    color: "#6a716b",
    letterSpacing: 0.8,
    marginBottom: 7
  },
  splitBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10
  },
  splitBarTheory: {
    width: "40%",
    backgroundColor: "#285943"
  },
  splitBarPractice: {
    width: "60%",
    backgroundColor: "#a8c957"
  },
  splitHighlight: {
    flexDirection: "row",
    marginBottom: 0
  },
  splitCard: {
    flex: 1,
    paddingTop: 10,
    paddingRight: 14,
    paddingBottom: 10,
    paddingLeft: 14,
    borderWidth: 1,
    borderColor: "#d7d0c3",
    backgroundColor: "#fdfdfb",
    marginRight: 10
  },
  splitCardLast: {
    marginRight: 0
  },
  splitPercent: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4
  },
  splitTheory: {
    color: "#285943"
  },
  splitPractice: {
    color: "#a8c957"
  },
  splitTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5
  },
  splitText: {
    fontSize: 10,
    color: "#4d5751",
    lineHeight: 1.4
  },
  secondPageColumns: {
    flexDirection: "row",
    marginBottom: 6
  },
  secondCol: {
    flex: 1,
    marginRight: 10
  },
  secondColLast: {
    marginRight: 0
  },
  pageFooter: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#d7d0c3"
  },
  footerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2
  },
  footerOrg: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#1d2a24"
  },
  footerMeta: {
    fontSize: 7.8,
    color: "#5b655f",
    textAlign: "right"
  },
  footerNote: {
    fontSize: 7.6,
    color: "#5b655f"
  }
});

function ProgrammeBullet({ children }: { children: string }) {
  return (
    <View style={programmeStyles.bulletRow}>
      <Text style={programmeStyles.bulletDot}>•</Text>
      <Text style={programmeStyles.bulletText}>{children}</Text>
    </View>
  );
}

export function ProgrammeDocument({
  quote,
  organizationSettings
}: {
  quote: QuotePdfData;
  organizationSettings: OrganizationBranding;
}) {
  const cleanFooterItem = (value: string | null | undefined, prefix?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    if (!prefix) {
      return trimmed;
    }

    const normalized = trimmed.toLowerCase();
    const prefixNormalized = prefix.toLowerCase();

    return normalized.startsWith(prefixNormalized) ? trimmed : `${prefix} ${trimmed}`;
  };
  const trainerLabel = quote.session?.trainer_name || "Formateur SST Konformup";
  const dateLabel =
    quote.session_start_date || quote.session_end_date
      ? formatDateRange(quote.session_start_date, quote.session_end_date)
      : "Dates a definir";
  const locationLabel = quote.location || quote.session?.location || "Lieu a confirmer";
  const participantLabel =
    quote.candidate_count > 0
      ? `${quote.candidate_count} participant(s) prevu(s) - 4 mini / 10 maxi`
      : "4 mini / 10 maxi";
  const organizationMeta = [
    organizationSettings.address && organizationSettings.address !== "Adresse a configurer"
      ? organizationSettings.address
      : null,
    cleanFooterItem(organizationSettings.siret, "SIRET"),
    cleanFooterItem(organizationSettings.training_declaration_number, "NDA")
  ].filter(Boolean);

return (
  <Document>
    <Page size="A4" style={[shared.page, programmeStyles.page]}>
      <View style={programmeStyles.heroShell}>
        <View style={programmeStyles.heroBand}>
            <View style={programmeStyles.heroHeader}>
              <View style={programmeStyles.heroMain}>
                <View style={programmeStyles.heroBrand}>
                  <View style={programmeStyles.heroSquare} />
                  <Text style={programmeStyles.heroKicker}>Programme de formation</Text>
              </View>
              <Text style={programmeStyles.heroTitle}>
                Programme SST {"\n"}Sauveteur Secouriste du Travail
              </Text>
              <Text style={programmeStyles.heroSubtitle}>
                Une presentation structurée et operationnelle de la formation, inspiree d&apos;une brochure pedagogique et alignee sur le dispositif SST / INRS.
              </Text>
            </View>
            <View style={programmeStyles.heroAside}>
              {organizationSettings.resolved_logo_url ? (
                <Image src={organizationSettings.resolved_logo_url} style={programmeStyles.logo} />
              ) : null}
              <View style={programmeStyles.orgBlock}>
                <View style={programmeStyles.metaGrid}>
                  <View style={programmeStyles.metaChip}>
                    <Text style={programmeStyles.metaChipLabel}>Duree</Text>
                    <Text style={[programmeStyles.metaChipValue, programmeStyles.heroMetaValue]}>14 h</Text>
                  </View>
                  <View style={programmeStyles.metaChip}>
                    <Text style={programmeStyles.metaChipLabel}>Modalite</Text>
                    <Text style={[programmeStyles.metaChipValue, programmeStyles.heroMetaLabel]}>Presentiel</Text>
                  </View>
                  <View style={programmeStyles.metaChip}>
                    <Text style={programmeStyles.metaChipLabel}>Certificat</Text>
                    <Text style={[programmeStyles.metaChipValue, programmeStyles.heroMetaLabel]}>Valide 24 mois</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={programmeStyles.heroFooter}>
          <View style={programmeStyles.heroFooterCol}>
            <Text style={programmeStyles.heroFooterLabel}>Societe</Text>
            <Text style={programmeStyles.heroFooterValue}>{quote.company.company_name}</Text>
          </View>
          <View style={programmeStyles.heroFooterCol}>
            <Text style={programmeStyles.heroFooterLabel}>Lieu</Text>
            <Text style={programmeStyles.heroFooterValue}>{locationLabel}</Text>
          </View>
          <View style={[programmeStyles.heroFooterCol, programmeStyles.heroFooterColLast]}>
            <Text style={programmeStyles.heroFooterLabel}>Session</Text>
            <Text style={programmeStyles.heroFooterValue}>{dateLabel}</Text>
          </View>
        </View>
      </View>

      <View style={programmeStyles.firstPageColumns}>
        <View style={programmeStyles.firstLeft}>
          <View style={[programmeStyles.card, programmeStyles.cardEmphasis]}>
            <Text style={programmeStyles.cardTitle}>Objectif de la formation</Text>
            <Text style={programmeStyles.sectionLead}>Former des SST capables d&apos;agir vite et juste.</Text>
            <Text style={programmeStyles.bodyText}>
              Intervenir efficacement face a une situation d&apos;accident du travail et contribuer a la prevention des risques professionnels dans l&apos;entreprise.
            </Text>
          </View>
          <View style={programmeStyles.card}>
            <Text style={programmeStyles.cardTitle}>Competences developpees</Text>
            <ProgrammeBullet>Identifier les situations dangereuses et participer a la prevention.</ProgrammeBullet>
            <ProgrammeBullet>Examiner une victime et alerter ou faire alerter les secours.</ProgrammeBullet>
            <ProgrammeBullet>Realiser les gestes de secours adaptes: protection, saignement, etouffement, inconscience, arret cardiaque, malaise, brulure et traumatisme.</ProgrammeBullet>
          </View>
        </View>

        <View style={programmeStyles.firstRight}>
          <View style={programmeStyles.factsGrid}>
            <View style={programmeStyles.factTile}>
              <Text style={programmeStyles.factLabel}>Public</Text>
              <Text style={programmeStyles.factValue}>Tout salarie</Text>
            </View>
            <View style={[programmeStyles.factTile, programmeStyles.factTileEven]}>
              <Text style={programmeStyles.factLabel}>Prerequis</Text>
              <Text style={programmeStyles.factValue}>Aucun</Text>
            </View>
            <View style={programmeStyles.factTile}>
              <Text style={programmeStyles.factLabel}>Duree</Text>
              <Text style={programmeStyles.factValue}>14 h en presentiel</Text>
            </View>
            <View style={[programmeStyles.factTile, programmeStyles.factTileEven]}>
              <Text style={programmeStyles.factLabel}>Effectif</Text>
              <Text style={programmeStyles.factValue}>{participantLabel}</Text>
            </View>
            <View style={programmeStyles.factTile}>
              <Text style={programmeStyles.factLabel}>Intervenant</Text>
              <Text style={programmeStyles.factValue}>{trainerLabel}</Text>
            </View>
          </View>

          <View style={programmeStyles.card}>
            <Text style={programmeStyles.cardTitle}>Cadre certificateur et validite</Text>
            <Text style={programmeStyles.bodyText}>
              Formation preparee selon le referentiel SST de l&apos;INRS. Certificat delivre dans le cadre du dispositif Assurance maladie - Risques professionnels / INRS.
            </Text>
            <Text style={[programmeStyles.bodyText, { marginTop: 5 }]}>
              Validite du certificat: 24 mois. Maintien et actualisation des competences (MAC): 7 h tous les 24 mois.
            </Text>
          </View>
        </View>
      </View>

      <View style={programmeStyles.twoMiniCols}>
        <View style={programmeStyles.miniCol}>
          <View style={programmeStyles.card}>
            <Text style={programmeStyles.cardTitle}>Approche pedagogique</Text>
            <ProgrammeBullet>Alternance d&apos;apports methodologiques, d&apos;echanges diriges et d&apos;etudes de cas.</ProgrammeBullet>
            <ProgrammeBullet>Mises en situation concretes, demonstrations et exercices pratiques sur materiel de secours.</ProgrammeBullet>
            <ProgrammeBullet>Pedagogie active centree sur les risques reels de l&apos;environnement de travail.</ProgrammeBullet>
          </View>
        </View>

        <View style={[programmeStyles.miniCol, programmeStyles.miniColLast]}>
          <View style={programmeStyles.card}>
            <Text style={programmeStyles.cardTitle}>Modalites d&apos;evaluation</Text>
            <ProgrammeBullet>Evaluations formatives tout au long de la formation.</ProgrammeBullet>
            <ProgrammeBullet>Evaluation certificative selon les criteres definis par le dispositif SST.</ProgrammeBullet>
            <ProgrammeBullet>Remise du certificat SST aux participants ayant satisfait aux exigences.</ProgrammeBullet>
          </View>
        </View>
      </View>

      <View style={programmeStyles.pageFooter}>
        <View style={programmeStyles.footerTopRow}>
          <Text style={programmeStyles.footerOrg}>{organizationSettings.organization_name}</Text>
          <Text style={programmeStyles.footerMeta}>Programme SST • Document pedagogique</Text>
        </View>
        <Text style={programmeStyles.footerNote}>{organizationMeta.join(" • ")}</Text>
      </View>
    </Page>

    <Page size="A4" style={[shared.page, programmeStyles.page]}>
      <View style={programmeStyles.sectionBand}>
        <Text style={programmeStyles.sectionBandKicker}>Programme detaille</Text>
        <Text style={programmeStyles.sectionBandTitle}>Une progression equilibree entre theorie et mises en situation</Text>
      </View>

      <View style={programmeStyles.splitShell}>
        <Text style={programmeStyles.splitEyebrow}>Repartition pedagogique</Text>
        <View style={programmeStyles.splitBar}>
          <View style={programmeStyles.splitBarTheory} />
          <View style={programmeStyles.splitBarPractice} />
        </View>
        <View style={programmeStyles.splitHighlight}>
          <View style={programmeStyles.splitCard}>
            <Text style={[programmeStyles.splitPercent, programmeStyles.splitTheory]}>40%</Text>
            <Text style={programmeStyles.splitTitle}>Partie theorique</Text>
            <Text style={programmeStyles.splitText}>
              Cadre d&apos;intervention, principes de prevention, analyse de la situation et logique d&apos;alerte.
            </Text>
          </View>
          <View style={[programmeStyles.splitCard, programmeStyles.splitCardLast]}>
            <Text style={[programmeStyles.splitPercent, programmeStyles.splitPractice]}>60%</Text>
            <Text style={programmeStyles.splitTitle}>Partie pratique</Text>
            <Text style={programmeStyles.splitText}>
              Gestes de secours, ateliers, cas concrets et entrainements sur des situations proches du terrain.
            </Text>
          </View>
        </View>
      </View>

      <View style={programmeStyles.secondPageColumns}>
        <View style={programmeStyles.secondCol}>
          <View style={programmeStyles.card}>
            <Text style={programmeStyles.cardTitle}>Partie theorique</Text>
            <ProgrammeBullet>Role du SST dans l&apos;entreprise et articulation avec la prevention des risques.</ProgrammeBullet>
            <ProgrammeBullet>Cadre juridique de l&apos;intervention et principes generaux de prevention.</ProgrammeBullet>
            <ProgrammeBullet>Recherche des dangers persistants et protection adaptee.</ProgrammeBullet>
            <ProgrammeBullet>Examen de la victime, alerte, organisation des secours et transmission des informations.</ProgrammeBullet>
            <ProgrammeBullet>Conduites a tenir face aux saignements, etouffements, malaises, brulures, traumatismes et pertes de connaissance.</ProgrammeBullet>
            <ProgrammeBullet>Principes de la reanimation cardio-pulmonaire et usage du defibrillateur.</ProgrammeBullet>
          </View>
        </View>

        <View style={[programmeStyles.secondCol, programmeStyles.secondColLast]}>
          <View style={[programmeStyles.card, programmeStyles.cardEmphasis]}>
            <Text style={programmeStyles.cardTitle}>Partie pratique</Text>
            <ProgrammeBullet>Exercices de protection, degagement d&apos;urgence et mise en securite.</ProgrammeBullet>
            <ProgrammeBullet>Mises en situation d&apos;accidents du travail contextualisees.</ProgrammeBullet>
            <ProgrammeBullet>Ateliers gestes d&apos;urgence: compression, PLS, RCP adulte et utilisation du DEA.</ProgrammeBullet>
            <ProgrammeBullet>Jeux de role sur l&apos;alerte et la coordination avec les secours externes.</ProgrammeBullet>
            <ProgrammeBullet>Analyse de situations de travail pour reperer les actions de prevention a proposer.</ProgrammeBullet>
          </View>
        </View>
      </View>

      <View style={programmeStyles.card}>
        <Text style={programmeStyles.cardTitle}>Synthese de la session</Text>
        <View style={programmeStyles.factsGrid}>
          <View style={programmeStyles.factTile}>
            <Text style={programmeStyles.factLabel}>Intitule du devis</Text>
            <Text style={programmeStyles.factValue}>{quote.title}</Text>
          </View>
          <View style={[programmeStyles.factTile, programmeStyles.factTileEven]}>
            <Text style={programmeStyles.factLabel}>Reference devis</Text>
            <Text style={programmeStyles.factValue}>{quote.quote_number}</Text>
          </View>
          <View style={programmeStyles.factTile}>
            <Text style={programmeStyles.factLabel}>Societe</Text>
            <Text style={programmeStyles.factValue}>{quote.company.company_name}</Text>
          </View>
          <View style={[programmeStyles.factTile, programmeStyles.factTileEven]}>
            <Text style={programmeStyles.factLabel}>Lieu / dates</Text>
            <Text style={programmeStyles.factValue}>{`${locationLabel} - ${dateLabel}`}</Text>
          </View>
        </View>
      </View>

      <View style={programmeStyles.pageFooter}>
        <View style={programmeStyles.footerTopRow}>
          <Text style={programmeStyles.footerOrg}>{organizationSettings.organization_name}</Text>
          <Text style={programmeStyles.footerMeta}>Programme SST • Document pedagogique</Text>
        </View>
        <Text style={programmeStyles.footerNote}>{organizationMeta.join(" • ")}</Text>
      </View>
    </Page>
  </Document>
  );
}

const trainingAgreementStyles = StyleSheet.create({
  page: {
    backgroundColor: "#fffdf8"
  },
  topBar: {
    height: 10,
    backgroundColor: "#285943",
    marginBottom: 18
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18
  },
  headerLeft: {
    maxWidth: 320
  },
  headerRight: {
    maxWidth: 220,
    alignItems: "flex-end"
  },
  title: {
    fontSize: 21,
    fontWeight: 700,
    marginBottom: 5
  },
  subtitle: {
    fontSize: 10.5,
    color: "#4e5f57",
    marginBottom: 3
  },
  continuationHeader: {
    marginBottom: 16
  },
  continuationTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#1d2a24",
    marginBottom: 4
  },
  continuationSubtitle: {
    fontSize: 10,
    color: "#5b655f"
  },
  block: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 14
  },
  split: {
    flexDirection: "row",
    marginBottom: 14
  },
  splitCol: {
    flex: 1
  },
  splitColFirst: {
    marginRight: 7
  },
  splitColLast: {
    marginLeft: 7
  },
  blockTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#5b655f",
    marginBottom: 8,
    letterSpacing: 1
  },
  line: {
    fontSize: 10.5,
    color: "#1d2a24",
    marginBottom: 4,
    lineHeight: 1.35
  },
  lineStrong: {
    fontWeight: 700
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4
  },
  bulletDot: {
    width: 10,
    fontSize: 10.5,
    color: "#285943"
  },
  bulletText: {
    flex: 1,
    fontSize: 10.3,
    color: "#1d2a24",
    lineHeight: 1.35
  },
  clauseTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1d2a24",
    marginBottom: 5
  },
  clauseText: {
    fontSize: 10.2,
    color: "#1d2a24",
    lineHeight: 1.42
  },
  financialTable: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    marginBottom: 14
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da"
  },
  financialRowLast: {
    borderBottomWidth: 0,
    backgroundColor: "#edf5f0"
  },
  financialLabel: {
    fontSize: 10.5,
    color: "#4e5f57"
  },
  financialValue: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#1d2a24"
  },
  financialTotal: {
    fontSize: 13,
    fontWeight: 700,
    color: "#174734"
  },
  participantItem: {
    fontSize: 10.2,
    color: "#1d2a24",
    marginBottom: 3
  },
  warningBox: {
    borderWidth: 1,
    borderColor: "#d9c79b",
    backgroundColor: "#fbf5e6",
    padding: 12,
    marginBottom: 14
  },
  warningTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#6d571f",
    marginBottom: 6,
    fontWeight: 700
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 6
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14,
    minHeight: 120
  },
  signatureBoxFirst: {
    marginRight: 7
  },
  signatureBoxLast: {
    marginLeft: 7
  },
  signatureTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#5b655f",
    marginBottom: 8
  },
  signatureName: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#1d2a24",
    marginBottom: 2
  },
  signatureRole: {
    fontSize: 9.5,
    color: "#4e5f57",
    marginBottom: 16
  },
  signatureLine: {
    marginTop: 34,
    borderTopWidth: 1,
    borderTopColor: "#9da6a1",
    paddingTop: 6
  },
  footer: {
    marginTop: 14,
    fontSize: 9,
    color: "#5b655f",
    textAlign: "center"
  }
});

function AgreementBullet({ children }: { children: string }) {
  return (
    <View style={trainingAgreementStyles.bulletRow}>
      <Text style={trainingAgreementStyles.bulletDot}>•</Text>
      <Text style={trainingAgreementStyles.bulletText}>{children}</Text>
    </View>
  );
}

function TrainingAgreementContinuationHeader({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <View style={trainingAgreementStyles.topBar} />
      <View style={trainingAgreementStyles.continuationHeader}>
        <Text style={trainingAgreementStyles.continuationTitle}>{title}</Text>
        <Text style={trainingAgreementStyles.continuationSubtitle}>{subtitle}</Text>
      </View>
    </>
  );
}

export function TrainingAgreementDocument({
  agreement,
  organizationSettings
}: {
  agreement: TrainingAgreementPdfData;
  organizationSettings: OrganizationBranding;
}) {
  const companyAddressLines = formatAddressLines({
    address: agreement.client.address,
    postalCode: agreement.client.postalCode,
    city: agreement.client.city
  });
  const organizationAddressLines = formatAddressLines({
    address: agreement.organization.address,
    postalCode: agreement.organization.postalCode,
    city: agreement.organization.city
  });
  const generatedDate = formatDate(agreement.generatedAt);
  const participantNames = agreement.training.participants.map((participant) =>
    `${participant.first_name} ${participant.last_name}`.trim()
  );

  return (
    <Document>
      <Page size="A4" style={[shared.page, trainingAgreementStyles.page]}>
        <View style={trainingAgreementStyles.topBar} />
        <View style={trainingAgreementStyles.header}>
          <View style={trainingAgreementStyles.headerLeft}>
            <Text style={trainingAgreementStyles.title}>Convention de formation professionnelle</Text>
            <Text style={trainingAgreementStyles.subtitle}>Reference : {agreement.agreementRef}</Text>
            <Text style={trainingAgreementStyles.subtitle}>Date d'edition : {generatedDate}</Text>
          </View>
          <View style={trainingAgreementStyles.headerRight}>
            {organizationSettings.resolved_logo_url ? (
              <Image src={organizationSettings.resolved_logo_url} style={quoteStyles.logo} />
            ) : null}
            <OrganizationIdentityBlock organizationSettings={organizationSettings} />
          </View>
        </View>

        {agreement.missingFields.length ? (
          <View style={trainingAgreementStyles.warningBox}>
            <Text style={trainingAgreementStyles.warningTitle}>Champs a completer / verifier</Text>
            {agreement.missingFields.map((field) => (
              <AgreementBullet key={field}>{field}</AgreementBullet>
            ))}
          </View>
        ) : null}

        <View style={trainingAgreementStyles.split}>
          <View
            style={[
              trainingAgreementStyles.block,
              trainingAgreementStyles.splitCol,
              trainingAgreementStyles.splitColFirst
            ]}
          >
            <Text style={trainingAgreementStyles.blockTitle}>Organisme de formation</Text>
            <Text style={[trainingAgreementStyles.line, trainingAgreementStyles.lineStrong]}>{agreement.organization.name}</Text>
            {organizationAddressLines.map((line) => (
              <Text key={line} style={trainingAgreementStyles.line}>
                {line}
              </Text>
            ))}
            <Text style={trainingAgreementStyles.line}>Email : {agreement.organization.email || "A renseigner"}</Text>
            <Text style={trainingAgreementStyles.line}>Telephone : {agreement.organization.phone || "A renseigner"}</Text>
            <Text style={trainingAgreementStyles.line}>SIRET : {agreement.organization.siret || "Non renseigne"}</Text>
            <Text style={trainingAgreementStyles.line}>
              NDA : {agreement.organization.declarationNumber || "Non renseigne"}
            </Text>
            <Text style={trainingAgreementStyles.line}>
              Representant : {agreement.organization.representativeName || "A confirmer"}
            </Text>
          </View>

          <View
            style={[
              trainingAgreementStyles.block,
              trainingAgreementStyles.splitCol,
              trainingAgreementStyles.splitColLast
            ]}
          >
            <Text style={trainingAgreementStyles.blockTitle}>Entreprise cliente</Text>
            <Text style={[trainingAgreementStyles.line, trainingAgreementStyles.lineStrong]}>
              {agreement.client.legalName || agreement.client.companyName}
            </Text>
            {agreement.client.legalName && agreement.client.legalName !== agreement.client.companyName ? (
              <Text style={trainingAgreementStyles.line}>{agreement.client.companyName}</Text>
            ) : null}
            {companyAddressLines.length ? (
              companyAddressLines.map((line) => (
                <Text key={line} style={trainingAgreementStyles.line}>
                  {line}
                </Text>
              ))
            ) : (
              <Text style={trainingAgreementStyles.line}>Adresse a renseigner</Text>
            )}
            <Text style={trainingAgreementStyles.line}>Contact : {agreement.client.contactName || "A confirmer"}</Text>
            <Text style={trainingAgreementStyles.line}>Email : {agreement.client.contactEmail || "A renseigner"}</Text>
            <Text style={trainingAgreementStyles.line}>Telephone : {agreement.client.contactPhone || "A renseigner"}</Text>
            <Text style={trainingAgreementStyles.line}>SIRET : {agreement.client.siret || "Non renseigne"}</Text>
          </View>
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>1. Objet de la convention</Text>
          <Text style={trainingAgreementStyles.clauseText}>{agreement.clauses.purpose}</Text>
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.blockTitle}>Action de formation</Text>
          <Text style={[trainingAgreementStyles.line, trainingAgreementStyles.lineStrong]}>{agreement.training.title}</Text>
          <Text style={trainingAgreementStyles.line}>Dates : {agreement.training.dateRangeLabel}</Text>
          <Text style={trainingAgreementStyles.line}>Lieu : {agreement.training.locationLabel}</Text>
          <Text style={trainingAgreementStyles.line}>Modalites : {agreement.training.modality}</Text>
          <Text style={trainingAgreementStyles.line}>Duree : {agreement.training.durationLabel}</Text>
          <Text style={trainingAgreementStyles.line}>Formateur : {agreement.training.trainerName}</Text>
          <Text style={trainingAgreementStyles.line}>Effectif : {agreement.training.participantLabel}</Text>
          <Text style={trainingAgreementStyles.line}>Prerequis : {agreement.training.prerequisites}</Text>
        </View>
      </Page>

      <Page size="A4" style={[shared.page, trainingAgreementStyles.page]}>
        <TrainingAgreementContinuationHeader
          title="Convention de formation professionnelle"
          subtitle={`Suite - ${agreement.agreementRef}`}
        />

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>2. Objectifs de la formation</Text>
          {agreement.training.objectives.map((objective) => (
            <AgreementBullet key={objective}>{objective}</AgreementBullet>
          ))}
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>3. Programme / contenu</Text>
          {agreement.training.programmeLines.map((line) => (
            <AgreementBullet key={line}>{line}</AgreementBullet>
          ))}
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>4. Organisation de l'action de formation</Text>
          <Text style={trainingAgreementStyles.clauseText}>{agreement.clauses.organization}</Text>
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>5. Moyens pedagogiques et techniques</Text>
          <Text style={trainingAgreementStyles.clauseText}>{agreement.clauses.pedagogicalMeans}</Text>
          <View style={{ marginTop: 8 }}>
            {agreement.training.pedagogicalMeans.map((line) => (
              <AgreementBullet key={line}>{line}</AgreementBullet>
            ))}
          </View>
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>6. Suivi et evaluation</Text>
          <Text style={trainingAgreementStyles.clauseText}>{agreement.clauses.followUp}</Text>
          <View style={{ marginTop: 8 }}>
            {agreement.training.evaluationMethods.map((line) => (
              <AgreementBullet key={line}>{line}</AgreementBullet>
            ))}
          </View>
        </View>
      </Page>

      <Page size="A4" style={[shared.page, trainingAgreementStyles.page]}>
        <TrainingAgreementContinuationHeader
          title="Conditions financieres et participants"
          subtitle={`Reference - ${agreement.agreementRef}`}
        />

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.blockTitle}>Participants concernes</Text>
          {participantNames.length ? (
            participantNames.map((participant) => (
              <Text key={participant} style={trainingAgreementStyles.participantItem}>
                - {participant}
              </Text>
            ))
          ) : (
            <Text style={trainingAgreementStyles.line}>Liste des participants a confirmer.</Text>
          )}
        </View>

        <View style={trainingAgreementStyles.financialTable}>
          <View style={trainingAgreementStyles.financialRow}>
            <Text style={trainingAgreementStyles.financialLabel}>Prix HT</Text>
            <Text style={trainingAgreementStyles.financialValue}>{formatCurrency(agreement.financial.priceHt)}</Text>
          </View>
          <View style={trainingAgreementStyles.financialRow}>
            <Text style={trainingAgreementStyles.financialLabel}>TVA ({formatPercent(agreement.financial.vatRate)})</Text>
            <Text style={trainingAgreementStyles.financialValue}>
              {formatCurrency(agreement.financial.totalTtc - agreement.financial.priceHt)}
            </Text>
          </View>
          <View style={[trainingAgreementStyles.financialRow, trainingAgreementStyles.financialRowLast]}>
            <Text style={trainingAgreementStyles.financialLabel}>Prix TTC</Text>
            <Text style={trainingAgreementStyles.financialTotal}>{formatCurrency(agreement.financial.totalTtc)}</Text>
          </View>
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>7. Modalites financieres</Text>
          <Text style={trainingAgreementStyles.clauseText}>{agreement.clauses.financialTerms}</Text>
          <Text style={[trainingAgreementStyles.clauseText, { marginTop: 8 }]}>
            Modalites de reglement : {agreement.financial.paymentTerms}
          </Text>
          {agreement.financial.depositTerms ? (
            <Text style={[trainingAgreementStyles.clauseText, { marginTop: 6 }]}>
              Acompte / mention particuliere : {agreement.financial.depositTerms}
            </Text>
          ) : null}
        </View>

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>8. Conditions d'annulation / report</Text>
          <Text style={trainingAgreementStyles.clauseText}>{agreement.clauses.cancellation}</Text>
        </View>
      </Page>

      <Page size="A4" style={[shared.page, trainingAgreementStyles.page]}>
        <TrainingAgreementContinuationHeader
          title="Validation et signatures"
          subtitle={`Reference - ${agreement.agreementRef}`}
        />

        <View style={trainingAgreementStyles.block}>
          <Text style={trainingAgreementStyles.clauseTitle}>9. Obligations respectives</Text>
          <Text style={trainingAgreementStyles.clauseText}>{agreement.clauses.obligations}</Text>
        </View>

        <View style={trainingAgreementStyles.signatureRow} wrap={false}>
          <View style={[trainingAgreementStyles.signatureBox, trainingAgreementStyles.signatureBoxFirst]}>
            <Text style={trainingAgreementStyles.signatureTitle}>Pour l'organisme de formation</Text>
            <Text style={trainingAgreementStyles.signatureName}>
              {agreement.organization.representativeName || agreement.organization.name}
            </Text>
            <Text style={trainingAgreementStyles.signatureRole}>
              {agreement.organization.representativeTitle || "Representant de l'organisme"}
            </Text>
            <View style={trainingAgreementStyles.signatureLine}>
              <Text style={trainingAgreementStyles.line}>Signature et cachet</Text>
            </View>
          </View>

          <View style={[trainingAgreementStyles.signatureBox, trainingAgreementStyles.signatureBoxLast]}>
            <Text style={trainingAgreementStyles.signatureTitle}>Pour l'entreprise cliente</Text>
            <Text style={trainingAgreementStyles.signatureName}>
              {agreement.client.contactName || agreement.client.companyName}
            </Text>
            <Text style={trainingAgreementStyles.signatureRole}>Nom, qualite, signature et cachet</Text>
            <View style={trainingAgreementStyles.signatureLine}>
              <Text style={trainingAgreementStyles.line}>Bon pour accord</Text>
            </View>
          </View>
        </View>

        <Text style={trainingAgreementStyles.footer}>
          Convention etablie entre {agreement.organization.name} et {agreement.client.companyName}.
        </Text>
      </Page>
    </Document>
  );
}
