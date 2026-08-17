export const PRIMARY_BRAND_LOGO_PATH = "/brand/konformup-logo.png";

const LEGACY_LOGO_PATHS = new Set(["/logo-organisme.png", "/logo.jpg", "/konformup-app-logo.png"]);

export function normalizeOrganizationLogoPath(value: string | null | undefined) {
  const normalized = value?.trim();
  return !normalized || LEGACY_LOGO_PATHS.has(normalized) ? PRIMARY_BRAND_LOGO_PATH : normalized;
}
