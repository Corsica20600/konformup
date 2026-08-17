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
