import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { EVALUATION_RESULT_LABELS, EVALUATION_STATUS_LABELS, getGlobalEvaluation } from "@/lib/evaluations";
import {
  calculateSessionClosureSummary,
  getForprevStatusForCandidate,
  isSstTrainingType,
  getSstCertificateNotice,
  getTrainingCompletionWording
} from "@/lib/session-closure";
import { getTrainingTypeLabel } from "@/lib/training-programs";
import type { OrganizationBranding, SessionCandidate, SessionItem } from "@/lib/types";
import { formatDateRange, formatDurationHours } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 34,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1d2a24",
    backgroundColor: "#fffdf8"
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#d7d0c2",
    paddingBottom: 14,
    marginBottom: 18
  },
  kicker: {
    fontSize: 9,
    color: "#5b655f",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#174734"
  },
  subtitle: {
    marginTop: 8,
    fontSize: 11,
    color: "#4d5751",
    lineHeight: 1.5
  },
  section: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
    color: "#285943"
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da",
    paddingVertical: 6
  },
  lastRow: {
    borderBottomWidth: 0
  },
  label: {
    width: 155,
    color: "#5b655f"
  },
  value: {
    flex: 1,
    fontWeight: 700
  },
  grid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 10
  },
  statLabel: {
    fontSize: 8.5,
    color: "#5b655f",
    textTransform: "uppercase"
  },
  statValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 700,
    color: "#174734"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#285943",
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ece6da",
    paddingVertical: 7,
    paddingHorizontal: 8
  },
  colName: {
    width: "30%"
  },
  colCompany: {
    width: "22%"
  },
  colResult: {
    width: "18%"
  },
  colNotes: {
    width: "30%"
  },
  small: {
    fontSize: 8.8,
    color: "#5b655f",
    lineHeight: 1.4
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1d2a24"
  },
  footer: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#d7d0c2",
    paddingTop: 10,
    fontSize: 8.5,
    color: "#5b655f"
  }
});

function DetailRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={isLast ? [styles.row, styles.lastRow] : styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function evaluationLine(candidateSession: SessionCandidate) {
  const evaluation = getGlobalEvaluation(candidateSession.evaluations);
  if (!evaluation) {
    return {
      status: "Non evalue",
      result: "Non renseigne",
      notes: ""
    };
  }

  return {
    status: EVALUATION_STATUS_LABELS[evaluation.status],
    result: EVALUATION_RESULT_LABELS[evaluation.result],
    notes: evaluation.trainer_notes ?? ""
  };
}

function Header({ title, session }: { title: string; session: SessionItem }) {
  return (
    <View style={styles.header}>
      <Text style={styles.kicker}>Konform'up - document de fin de formation</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {session.title} - {getTrainingTypeLabel(session.training_type)} - {formatDateRange(session.start_date, session.end_date)}
      </Text>
    </View>
  );
}

export function TrainingCompletionCertificateDocument({
  session,
  candidateSession,
  organizationSettings,
  documentRef
}: {
  session: SessionItem;
  candidateSession: SessionCandidate;
  organizationSettings: OrganizationBranding;
  documentRef?: string | null;
}) {
  const candidateFullName = `${candidateSession.candidate.first_name} ${candidateSession.candidate.last_name}`;
  const wording = getTrainingCompletionWording(session.training_type);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Certificat de realisation" session={session} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participant</Text>
          <DetailRow label="Nom" value={candidateFullName} />
          <DetailRow label="Societe" value={candidateSession.candidate.company || "Non renseignee"} />
          <DetailRow label="Reference document" value={documentRef || "A attribuer"} isLast />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action realisee</Text>
          <DetailRow label="Formation" value={getTrainingTypeLabel(session.training_type)} />
          <DetailRow label="Dates" value={formatDateRange(session.start_date, session.end_date)} />
          <DetailRow label="Duree" value={formatDurationHours(session.duration_hours)} />
          <DetailRow label="Lieu" value={session.location} />
          <DetailRow label="Formateur" value={session.trainer_name || "Non renseigne"} isLast />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objet du document</Text>
          <Text style={styles.paragraph}>{wording}</Text>
        </View>
        <Text style={styles.footer}>
          {organizationSettings.organization_name} - certificat de realisation distinct de l'attestation interne
          {isSstTrainingType(session.training_type) ? " et du certificat SST officiel." : "."}
        </Text>
      </Page>
    </Document>
  );
}

export function SessionReportDocument({
  session,
  candidates,
  organizationSettings
}: {
  session: SessionItem;
  candidates: SessionCandidate[];
  organizationSettings: OrganizationBranding;
}) {
  const summary = calculateSessionClosureSummary(candidates);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Bilan session" session={session} />
        <View style={styles.grid}>
          {[
            ["Inscrits", summary.registeredCount],
            ["Presents", summary.presentCount],
            ["Admis", summary.admittedCount],
            ["Non admis", summary.notAdmittedCount],
            ["Absents", summary.absentCount]
          ].map(([label, value]) => (
            <View key={label} style={styles.stat}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bilan formateur</Text>
          <Text style={styles.paragraph}>{session.trainer_report || "Non renseigne."}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observations administratives</Text>
          <Text style={styles.paragraph}>{session.administrative_observations || "Non renseignees."}</Text>
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Candidat</Text>
          <Text style={styles.colCompany}>Societe</Text>
          <Text style={styles.colResult}>Resultat</Text>
          <Text style={styles.colNotes}>Notes</Text>
        </View>
        {candidates.map((candidate) => {
          const evaluation = evaluationLine(candidate);
          const candidateName = `${candidate.candidate.first_name} ${candidate.candidate.last_name}`;
          return (
            <View key={candidate.id} style={styles.tableRow}>
              <Text style={styles.colName}>{candidateName}</Text>
              <Text style={styles.colCompany}>{candidate.candidate.company || "-"}</Text>
              <Text style={styles.colResult}>{evaluation.result}</Text>
              <Text style={styles.colNotes}>{evaluation.notes || evaluation.status}</Text>
            </View>
          );
        })}
        <Text style={styles.footer}>{organizationSettings.organization_name} - bilan interne de session.</Text>
      </Page>
    </Document>
  );
}

export function CompanyFinalSummaryDocument({
  session,
  candidates,
  organizationSettings
}: {
  session: SessionItem;
  candidates: SessionCandidate[];
  organizationSettings: OrganizationBranding;
}) {
  const companyNames = Array.from(new Set(candidates.map((candidate) => candidate.candidate.company || "Sans societe")));
  const isSstTraining = isSstTrainingType(session.training_type);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header title="Synthese societe - dossier final" session={session} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Societes concernees</Text>
          <Text style={styles.paragraph}>{companyNames.join(", ")}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents finaux a reunir</Text>
          <Text style={styles.paragraph}>Attestations internes, certificats de realisation, feuille de presence, bilan session.</Text>
          {isSstTraining ? (
            <Text style={[styles.paragraph, { marginTop: 6 }]}>{getSstCertificateNotice(session.training_type)}</Text>
          ) : null}
        </View>
        <View style={styles.tableHeader}>
          <Text style={styles.colName}>Candidat</Text>
          <Text style={styles.colCompany}>Societe</Text>
          <Text style={styles.colResult}>{isSstTraining ? "FORPREV" : "Resultat"}</Text>
          <Text style={styles.colNotes}>{isSstTraining ? "Reference SST" : "Observation"}</Text>
        </View>
        {candidates.map((candidate) => (
          <View key={candidate.id} style={styles.tableRow}>
            <Text style={styles.colName}>{candidate.candidate.first_name} {candidate.candidate.last_name}</Text>
            <Text style={styles.colCompany}>{candidate.candidate.company || "-"}</Text>
            <Text style={styles.colResult}>
              {isSstTraining
                ? getForprevStatusForCandidate(session.training_type, candidate)
                : evaluationLine(candidate).result}
            </Text>
            <Text style={styles.colNotes}>
              {isSstTraining ? candidate.candidate.sst_certificate_ref || "-" : evaluationLine(candidate).status}
            </Text>
          </View>
        ))}
        <Text style={styles.footer}>
          {organizationSettings.organization_name} - synthese de fin de formation.
        </Text>
      </Page>
    </Document>
  );
}
