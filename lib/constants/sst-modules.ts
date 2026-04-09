export type SstModule = {
  key: string;
  order: number;
  title: string;
  description: string;
  textContent: string;
  videoUrl: string;
  pdfUrl: string;
};

export const SST_MODULES: SstModule[] = [
  {
    key: "sst-01",
    order: 1,
    title: "Cadre du SST",
    description: "Positionner le sauveteur secouriste au travail dans l'organisation des secours.",
    textContent:
      "Le SST agit rapidement, protège son environnement immédiat et participe à la prévention des risques professionnels dans l'entreprise.",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    key: "sst-02",
    order: 2,
    title: "Protéger",
    description: "Supprimer ou isoler le danger afin d'éviter le suraccident.",
    textContent:
      "Le formateur rappelle l'analyse rapide d'une situation dangereuse, la sécurisation de la zone et la protection adaptée des personnes exposées.",
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    key: "sst-03",
    order: 3,
    title: "Examiner",
    description: "Identifier les signes qui indiquent une urgence vitale.",
    textContent:
      "Le candidat apprend à rechercher une hémorragie, un étouffement, une perte de conscience ou un arrêt cardiaque selon un ordre d'examen constant.",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    key: "sst-04",
    order: 4,
    title: "Faire alerter ou alerter",
    description: "Transmettre une alerte claire, concise et utile.",
    textContent:
      "Le message d'alerte doit contenir l'identité de l'appelant, le lieu précis, la nature de l'accident, le nombre de victimes et les gestes déjà réalisés.",
    videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    key: "sst-05",
    order: 5,
    title: "Secourir",
    description: "Réaliser le geste adapté à la situation observée.",
    textContent:
      "Cette séquence couvre les conduites à tenir face à un saignement abondant, un étouffement, un malaise, une brûlure, un traumatisme ou un arrêt cardio-respiratoire.",
    videoUrl: "https://www.youtube.com/watch?v=ZXsQAXx_ao0",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  {
    key: "sst-06",
    order: 6,
    title: "Prévention et risques spécifiques",
    description: "Relier les gestes de secours à la prévention quotidienne.",
    textContent:
      "Le candidat identifie les situations à risque dans son environnement de travail et participe à la remontée d'informations de prévention.",
    videoUrl: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  }
];
