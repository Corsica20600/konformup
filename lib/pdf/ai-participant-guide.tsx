/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OrganizationBranding, SessionItem } from "@/lib/types";
import { PUBLIC_SITE_ORIGIN } from "@/lib/public-config";
import { AI_GUIDE_COMMON_SECTIONS, AI_GUIDE_PROMPTS, getAiGuideSessionFocus } from "@/lib/ai-participant-guide-content";

const styles = StyleSheet.create({
  page: { paddingTop: 38, paddingRight: 44, paddingBottom: 48, paddingLeft: 44, backgroundColor: "#fffdf8", fontFamily: "Helvetica", fontSize: 10, color: "#1d2a24" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#285943", paddingBottom: 10, marginBottom: 20 },
  logo: { width: 68, height: 38, objectFit: "contain" },
  headerText: { fontSize: 8, color: "#60736a", textAlign: "right", maxWidth: 300 },
  hero: { backgroundColor: "#285943", borderRadius: 14, padding: 24, marginBottom: 18 },
  kicker: { color: "#d8e7df", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 },
  title: { color: "#ffffff", fontSize: 25, lineHeight: 1.2, fontWeight: 700, marginBottom: 10 },
  subtitle: { color: "#f4f1e8", fontSize: 11, lineHeight: 1.45 },
  participant: { marginTop: 15, color: "#ffffff", fontSize: 9 },
  section: { marginBottom: 13, padding: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e4dfd4", borderRadius: 9 },
  sectionTitle: { fontSize: 13, color: "#285943", fontWeight: 700, marginBottom: 7 },
  subsectionTitle: { fontSize: 10, fontWeight: 700, color: "#1d2a24", marginBottom: 4 },
  paragraph: { fontSize: 9.5, lineHeight: 1.45, marginBottom: 5, color: "#29372f" },
  bulletRow: { flexDirection: "row", marginBottom: 4, paddingLeft: 2 },
  bullet: { width: 12, color: "#285943", fontSize: 10, fontWeight: 700 },
  bulletText: { flex: 1, fontSize: 9.3, lineHeight: 1.4 },
  promptCard: { borderLeftWidth: 3, borderLeftColor: "#b7a882", backgroundColor: "#f7f4ed", padding: 9, marginBottom: 7, borderRadius: 4 },
  promptTitle: { fontSize: 9.5, fontWeight: 700, color: "#285943", marginBottom: 4 },
  promptText: { fontSize: 8.6, lineHeight: 1.4, color: "#29372f" },
  focusBox: { backgroundColor: "#edf4ef", borderColor: "#cddfd3" },
  warning: { backgroundColor: "#fbf3e3", borderColor: "#e8d6ad" },
  footer: { position: "absolute", bottom: 19, left: 44, right: 44, borderTopWidth: 1, borderTopColor: "#ded8ca", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: "#60736a" },
  pageNumber: { fontSize: 7.5, color: "#60736a" }
});

function Section({ title, paragraphs = [], bullets = [], warning = false }: { title: string; paragraphs?: string[]; bullets?: string[]; warning?: boolean }) {
  return <View style={warning ? [styles.section, styles.warning] : styles.section} wrap={false}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {paragraphs.map((paragraph, index) => <Text key={`${title}-p-${index}`} style={styles.paragraph}>{paragraph}</Text>)}
    {bullets.map((bullet, index) => <View key={`${title}-b-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{bullet}</Text></View>)}
  </View>;
}

export function AIParticipantGuideDocument({ session, participantName, organizationSettings }: { session: SessionItem; participantName: string; organizationSettings: OrganizationBranding }) {
  const focus = getAiGuideSessionFocus(session);
  const contactLine = [organizationSettings.contact_email, PUBLIC_SITE_ORIGIN].filter(Boolean).join(" · ");
  return <Document title={`Livret participant – ${focus.title}`} author={organizationSettings.organization_name}>
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.header}>
        {organizationSettings.resolved_logo_url ? <Image src={organizationSettings.resolved_logo_url} style={styles.logo} /> : <Text style={styles.sectionTitle}>{organizationSettings.organization_name}</Text>}
        <Text style={styles.headerText}>{contactLine}</Text>
      </View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Konform’up · Ressource participant</Text>
        <Text style={styles.title}>Livret participant – {focus.title}</Text>
        <Text style={styles.subtitle}>Un support pratique pour utiliser l’intelligence artificielle avec méthode, esprit critique et prudence.</Text>
        {participantName ? <Text style={styles.participant}>Destiné à : {participantName}</Text> : null}
      </View>

      <Section title={AI_GUIDE_COMMON_SECTIONS[0]!.title} paragraphs={AI_GUIDE_COMMON_SECTIONS[0]!.paragraphs} />
      <Section title={AI_GUIDE_COMMON_SECTIONS[1]!.title} bullets={AI_GUIDE_COMMON_SECTIONS[1]!.bullets} paragraphs={AI_GUIDE_COMMON_SECTIONS[1]!.paragraphs} />
      <Section title={AI_GUIDE_COMMON_SECTIONS[2]!.title} bullets={AI_GUIDE_COMMON_SECTIONS[2]!.bullets} paragraphs={AI_GUIDE_COMMON_SECTIONS[2]!.paragraphs} />
      <Section title={AI_GUIDE_COMMON_SECTIONS[3]!.title} bullets={AI_GUIDE_COMMON_SECTIONS[3]!.bullets} paragraphs={AI_GUIDE_COMMON_SECTIONS[3]!.paragraphs} />

      <View style={[styles.section, styles.focusBox]}>
        <Text style={styles.sectionTitle}>Repères propres à votre session</Text>
        <Text style={styles.subsectionTitle}>{focus.title}</Text>
        {focus.objectives.length ? <>
          <Text style={styles.paragraph}>Objectifs travaillés :</Text>
          {focus.objectives.map((item, index) => <View key={`objective-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{item}</Text></View>)}
        </> : null}
        {focus.practiceThemes.length ? <>
          <Text style={[styles.subsectionTitle, { marginTop: 6 }]}>Thèmes et mises en pratique</Text>
          {focus.practiceThemes.map((item, index) => <View key={`theme-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{item}</Text></View>)}
        </> : null}
        <Text style={[styles.paragraph, { marginTop: 6 }]}>Adaptez les exemples et prompts qui suivent à votre métier, aux règles de votre organisation et aux outils qu’elle autorise.</Text>
      </View>

      <Section title={AI_GUIDE_COMMON_SECTIONS[4]!.title} bullets={AI_GUIDE_COMMON_SECTIONS[4]!.bullets} />
      <Section title={AI_GUIDE_COMMON_SECTIONS[5]!.title} paragraphs={AI_GUIDE_COMMON_SECTIONS[5]!.paragraphs} warning />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bibliothèque de prompts à réutiliser</Text>
        <Text style={styles.paragraph}>Remplacez les variables entre crochets avant d’envoyer votre demande : [CONTEXTE], [OBJECTIF], [PUBLIC], [TON], [CONTRAINTES].</Text>
        {AI_GUIDE_PROMPTS.map((item) => <View key={item.title} style={styles.promptCard} wrap={false}><Text style={styles.promptTitle}>{item.title}</Text><Text style={styles.promptText}>{item.prompt}</Text></View>)}
      </View>

      <Section title={AI_GUIDE_COMMON_SECTIONS[6]!.title} bullets={AI_GUIDE_COMMON_SECTIONS[6]!.bullets} paragraphs={AI_GUIDE_COMMON_SECTIONS[6]!.paragraphs} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Votre prochain essai</Text>
        <Text style={styles.paragraph}>Une tâche à tester : __________________________________________</Text>
        <Text style={styles.paragraph}>Le résultat que je veux obtenir : ________________________________</Text>
        <Text style={styles.paragraph}>Ce que je devrai vérifier : ______________________________________</Text>
        <Text style={styles.paragraph}>Ressources : consultez les consignes de votre organisation, la documentation actuelle des outils utilisés et les recommandations de la CNIL sur la protection des données.</Text>
      </View>
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{[organizationSettings.organization_name, organizationSettings.contact_email, organizationSettings.contact_phone, PUBLIC_SITE_ORIGIN].filter(Boolean).join(" · ")}</Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>;
}
