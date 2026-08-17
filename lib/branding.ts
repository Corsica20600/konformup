import { PUBLIC_ORGANIZATION_NAME } from "@/lib/public-config";
import { PRIMARY_BRAND_LOGO_PATH } from "@/lib/brand-assets";

export const APP_BRANDING = {
  name: PUBLIC_ORGANIZATION_NAME,
  baseline: "Formations SST & Hygiène",
  dashboardTitle: "Tableau de bord",
  dashboardDescription: "Pilotez vos formations, sessions, candidats et documents depuis un seul espace.",
  logoPath: PRIMARY_BRAND_LOGO_PATH
} as const;
