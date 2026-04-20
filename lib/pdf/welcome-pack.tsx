/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OrganizationBranding, SessionCandidate, SessionItem } from "@/lib/types";
import { formatDateRange, formatDurationHours } from "@/lib/utils";

const TRAINING_TITLE = "Sauveteur Secouriste du Travail (SST)";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingRight: 34,
    paddingBottom: 32,
    paddingLeft: 34,
    backgroundColor: "#fffdf8",
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: "#1d2a24"
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
    marginBottom: 18
  },
  headerLeft: {
    maxWidth: 320
  },
  headerRight: {
    maxWidth: 220,
    alignItems: "flex-end"
  },
  logo: {
    width: 92,
    height: 56,
    objectFit: "contain",
    marginBottom: 10
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 11,
    color: "#4e5f57",
    marginBottom: 3
  },
  organizationName: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
    textAlign: "right"
  },
  organizationLine: {
    fontSize: 9.5,
    color: "#4e5f57",
    marginBottom: 2,
    textAlign: "right"
  },
  introCard: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 14
  },
  introTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5
  },
  introText: {
    fontSize: 10.3,
    lineHeight: 1.45,
    color: "#1d2a24"
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14
  },
  factCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 12,
    marginBottom: 10
  },
  factCardOdd: {
    marginRight: "4%"
  },
  factLabel: {
    fontSize: 8.8,
    textTransform: "uppercase",
    color: "#5b655f",
    marginBottom: 4
  },
  factValue: {
    fontSize: 10.5,
    fontWeight: 700
  },
  section: {
    borderWidth: 1,
    borderColor: "#ddd6c8",
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    color: "#5b655f",
    marginBottom: 8,
    letterSpacing: 0.8
  },
  paragraph: {
    fontSize: 10.2,
    lineHeight: 1.45,
    color: "#1d2a24"
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4
  },
  bulletDot: {
    width: 10,
    fontSize: 10.2,
    color: "#285943"
  },
  bulletText: {
    flex: 1,
    fontSize: 10.2,
    lineHeight: 1.4,
    color: "#1d2a24"
  },
  noteBox: {
    borderWidth: 1,
    borderColor: "#d9c79b",
    backgroundColor: "#fbf5e6",
    padding: 12,
    marginTop: 6
  },
  noteTitle: {
    fontSize: 9.3,
    textTransform: "uppercase",
    color: "#6d571f",
    marginBottom: 5,
    fontWeight: 700
  },
  noteText: {
    fontSize: 9.5,
    lineHeight: 1.4,
    color: "#6d571f"
  },
  footer: {
    marginTop: "auto",
    fontSize: 9,
    color: "#5b655f",
    textAlign: "center"
  },
  link: {
    color: "#285943",
    textDecoration: "underline"
  }
});

function formatAddressLines(organizationSettings: OrganizationBranding) {
  return [
    organizationSettings.address,
    [organizationSettings.postal_code, organizationSettings.city].filter(Boolean).join(" ").trim() || null,
    organizationSettings.country
  ].filter((line): line is string => Boolean(line && line.trim()));
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function WelcomePackDocument({
  session,
  candidateSession,
  organizationSettings,
  programmeLines
}: {
  session: SessionItem;
  candidateSession: SessionCandidate;
  organizationSettings: OrganizationBranding;
  programmeLines: string[];
}) {
  const candidateFullName = `${candidateSession.candidate.first_name} ${candidateSession.candidate.last_name}`.trim();
  const organizationLines = formatAddressLines(organizationSettings);
  const objectives = [
    "Situer le role du sauveteur secouriste du travail dans l'entreprise et dans l'organisation des secours.",
    "Adopter les bons reflexes face a une situation d'accident du travail et proteger les personnes exposees.",
    "Mettre en oeuvre les gestes de premiers secours adaptes et contribuer a la prevention des risques professionnels."
  ];
  const pedagogicalMeans = [
    "Apports theoriques, demonstrations commentees et echanges avec le formateur.",
    "Exercices pratiques, mises en situation et materiel adapte a la formation SST.",
    "Support remis aux participants et documents de reference transmis avec la convocation."
  ];
  const evaluationMethods = [
    "Evaluation formative continue pendant les ateliers et les mises en situation.",
    "Evaluation certificative selon le referentiel SST en vigueur.",
    "Traçabilite via emargements, supports remis et documents remis au stagiaire."
  ];
  const practicalInfo = [
    `Participant concerne : ${candidateFullName || "Stagiaire inscrit"}`,
    `Session : ${session.title}`,
    `Dates : ${formatDateRange(session.start_date, session.end_date)}`,
    `Lieu : ${session.location}`,
    `Formateur : ${session.trainer_name || "Formateur communique sur convocation"}`,
    `Duree indicative : ${formatDurationHours(session.duration_hours)}`
  ];
  const accessibility = [
    "L'organisme etudie toute situation de handicap ou besoin specifique afin d'adapter l'accueil, le rythme ou les supports.",
    organizationSettings.contact_email
      ? `Contact accessibilite : ${organizationSettings.contact_email}`
      : "Contact accessibilite : a demander a l'organisme avant l'entree en formation."
  ];
  const internalRules = {
    discipline: [
      "Le stagiaire respecte les horaires communiques, les consignes du formateur et les modalites d'emargement.",
      "Toute absence, retard ou depart anticipe doit etre signale sans delai a l'organisme ou au commanditaire."
    ],
    hygieneSafety: [
      "Chaque participant applique les consignes d'hygiene, de securite et d'evacuation du lieu de formation.",
      "Le materiel pedagogique est utilise conformement aux instructions donnees pendant les exercices."
    ],
    prohibitions: [
      "Il est interdit d'introduire ou de consommer alcool, substances illicites ou tout produit dangereux pendant la formation.",
      "Toute utilisation d'equipements ou de materiels a des fins non pedagogiques est proscrite."
    ],
    sanctions: [
      "Tout manquement au present reglement peut faire l'objet d'un rappel oral, d'un avertissement ou d'une exclusion de la session.",
      "Les decisions sont prises dans le respect du contradictoire et, si besoin, en lien avec l'entreprise cliente."
    ],
    accidents: [
      "Tout incident ou accident survenu pendant la formation doit etre signale immediatement au formateur ou a l'organisme.",
      "Les procedures internes et les obligations legales de declaration seront appliquees sans delai."
    ]
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Livret d&apos;accueil</Text>
            <Text style={styles.subtitle}>{TRAINING_TITLE}</Text>
            <Text style={styles.subtitle}>Document remis avec la convocation du stagiaire</Text>
          </View>
          <View style={styles.headerRight}>
            {organizationSettings.resolved_logo_url ? (
              <Image src={organizationSettings.resolved_logo_url} style={styles.logo} />
            ) : null}
            <Text style={styles.organizationName}>{organizationSettings.organization_name}</Text>
            {organizationLines.map((line) => (
              <Text key={line} style={styles.organizationLine}>
                {line}
              </Text>
            ))}
            {organizationSettings.contact_phone ? (
              <Text style={styles.organizationLine}>Telephone : {organizationSettings.contact_phone}</Text>
            ) : null}
            {organizationSettings.contact_email ? (
              <Text style={styles.organizationLine}>Email : {organizationSettings.contact_email}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Bienvenue en formation SST</Text>
          <Text style={styles.introText}>
            Ce livret d&apos;accueil rassemble les informations essentielles pour preparer votre entree en formation, comprendre le deroulement pedagogique de la session et connaitre les regles applicables pendant votre presence.
          </Text>
        </View>

        <View style={styles.factsGrid}>
          <View style={[styles.factCard, styles.factCardOdd]}>
            <Text style={styles.factLabel}>Participant</Text>
            <Text style={styles.factValue}>{candidateFullName}</Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Session</Text>
            <Text style={styles.factValue}>{session.title}</Text>
          </View>
          <View style={[styles.factCard, styles.factCardOdd]}>
            <Text style={styles.factLabel}>Dates</Text>
            <Text style={styles.factValue}>{formatDateRange(session.start_date, session.end_date)}</Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Lieu</Text>
            <Text style={styles.factValue}>{session.location}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objectifs</Text>
          <BulletList items={objectives} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programme</Text>
          <BulletList items={programmeLines} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moyens pedagogiques</Text>
          <BulletList items={pedagogicalMeans} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation</Text>
          <BulletList items={evaluationMethods} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibilite et informations pratiques</Text>
          <BulletList items={[...accessibility, ...practicalInfo]} />
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Besoin d&apos;un amenagement ?</Text>
            <Text style={styles.noteText}>
              Merci de contacter l&apos;organisme au plus tot afin d&apos;anticiper toute adaptation necessaire a votre accueil ou a votre participation.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document d&apos;accueil remis par {organizationSettings.organization_name}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Reglement interieur</Text>
            <Text style={styles.subtitle}>{TRAINING_TITLE}</Text>
            <Text style={styles.subtitle}>Regles applicables pendant l&apos;action de formation</Text>
          </View>
          <View style={styles.headerRight}>
            {organizationSettings.resolved_logo_url ? (
              <Image src={organizationSettings.resolved_logo_url} style={styles.logo} />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discipline</Text>
          <BulletList items={internalRules.discipline} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hygiene et securite</Text>
          <BulletList items={internalRules.hygieneSafety} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interdictions</Text>
          <BulletList items={internalRules.prohibitions} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sanctions</Text>
          <BulletList items={internalRules.sanctions} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accidents</Text>
          <BulletList items={internalRules.accidents} />
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Conservation du document</Text>
          <Text style={styles.noteText}>
            Ce document doit etre conserve par le participant. Toute question complementaire peut etre adressee a l&apos;organisme de formation.
          </Text>
          {organizationSettings.contact_email ? (
            <Text style={[styles.noteText, { marginTop: 6 }]}>
              Contact : <Link src={`mailto:${organizationSettings.contact_email}`} style={styles.link}>{organizationSettings.contact_email}</Link>
            </Text>
          ) : null}
        </View>

        <Text style={styles.footer}>
          Livret d&apos;accueil et reglement interieur - {organizationSettings.organization_name}
        </Text>
      </Page>
    </Document>
  );
}
