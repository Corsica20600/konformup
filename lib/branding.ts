import { PUBLIC_ORGANIZATION_NAME } from "@/lib/public-config";

export const APP_BRANDING = {
  name: PUBLIC_ORGANIZATION_NAME,
  baseline: "Formations SST & Hygiène",
  dashboardTitle: "Tableau de bord",
  dashboardDescription: "Pilotez vos formations, sessions, candidats et documents depuis un seul espace.",
  logoPath: "/konformup-app-logo.png"
} as const;
