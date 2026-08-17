export const PUBLIC_ORGANIZATION_NAME = "Konform’up";
export const PUBLIC_CONTACT_EMAIL = "contact@konformup.com";
export const PUBLIC_SITE_ORIGIN = "https://www.konformup.com";
export const PRIVATE_APP_ORIGIN = "https://app.konformup.com";

export type PublicUrlEnvironment = {
  [key: string]: string | undefined;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  APP_URL?: string;
  VERCEL_URL?: string;
};

export function normalizeHttpOrigin(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

export function resolveConfiguredPrivateAppOrigin(environment: PublicUrlEnvironment = process.env) {
  return (
    normalizeHttpOrigin(environment.NEXT_PUBLIC_APP_URL) ||
    normalizeHttpOrigin(environment.APP_URL) ||
    normalizeHttpOrigin(environment.VERCEL_URL)
  );
}

export function resolvePrivateAppOrigin(environment: PublicUrlEnvironment = process.env) {
  return resolveConfiguredPrivateAppOrigin(environment) || PRIVATE_APP_ORIGIN;
}

export function resolvePublicSiteOrigin(environment: PublicUrlEnvironment = process.env) {
  return normalizeHttpOrigin(environment.NEXT_PUBLIC_SITE_URL) || PUBLIC_SITE_ORIGIN;
}

export function buildPrivateAppUrl(pathname: string, environment: PublicUrlEnvironment = process.env) {
  return new URL(pathname, resolvePrivateAppOrigin(environment));
}
