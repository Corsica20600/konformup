export function getGeneratedDocumentLabel(type: string) {
  if (type === "quote") return "Devis";
  if (type === "invoice") return "Facture";
  if (type === "training_agreement") return "Convention de formation";
  if (type === "programme") return "Programme";
  if (type === "aide_memoire") return "Aide memoire sauveteur secouriste du travail";
  if (type === "welcome_pack") return "Livret d'accueil + reglement interieur";
  if (type === "attestation" || type === "certificat") return "Attestation interne de fin de formation";
  if (type === "certificat_realisation") return "Certificat de realisation";
  if (type === "bilan_session") return "Bilan session";
  if (type === "synthese_societe") return "Synthese societe";
  if (type === "convocation") return "Convocation";
  if (type === "feuille_presence") return "Feuille de presence";
  return type;
}

export type DocumentPhase = "before" | "during" | "after" | "other";

export const DOCUMENT_PHASE_LABELS: Record<DocumentPhase, string> = {
  before: "Avant formation",
  during: "Pendant formation",
  after: "Fin de formation",
  other: "Autres documents"
};

export function getDocumentPhase(type: string): DocumentPhase {
  if (["quote", "programme", "training_agreement", "convocation", "welcome_pack", "aide_memoire"].includes(type)) {
    return "before";
  }

  if (["feuille_presence", "emargement"].includes(type)) {
    return "during";
  }

  if (["attestation", "certificat", "certificat_realisation", "bilan_session", "synthese_societe"].includes(type)) {
    return "after";
  }

  return "other";
}
