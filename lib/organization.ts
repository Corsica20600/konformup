import type { OrganizationBranding, OrganizationSettings } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LOGO_PATH = "/logo-organisme.png";
const DEFAULT_SIGNATURE_PATH = "/signature.png";

function logSupabaseQueryError({
  file,
  table,
  query,
  error
}: {
  file: string;
  table: string;
  query: string;
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
}) {
  if (!error) {
    return;
  }

  const hasUsefulDetails = Boolean(error.code || error.message || error.details || error.hint);

  if (!hasUsefulDetails) {
    return;
  }

  console.error("[supabase-query-error]", {
    file,
    table,
    query,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}

export const defaultOrganizationSettings: OrganizationSettings = {
  organization_name: "Organisme de formation",
  address: "Adresse a configurer",
  postal_code: null,
  city: null,
  siret: null,
  training_declaration_number: null,
  qualiopi_mention: null,
  logo_url: DEFAULT_LOGO_PATH,
  signature_url: DEFAULT_SIGNATURE_PATH,
  certificate_signatory_name: null,
  certificate_signatory_title: null
};

function normalizeConfiguredAssetUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveAssetUrl(assetUrl: string | null, origin?: string) {
  if (!assetUrl) {
    return null;
  }

  if (assetUrl.startsWith("http://") || assetUrl.startsWith("https://")) {
    return assetUrl;
  }

  if (assetUrl.startsWith("/")) {
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
    return baseUrl ? new URL(assetUrl, baseUrl).toString() : assetUrl;
  }

  return assetUrl;
}

function withResolvedBranding(settings: OrganizationSettings, origin?: string): OrganizationBranding {
  return {
    ...settings,
    resolved_logo_url: resolveAssetUrl(settings.logo_url, origin),
    resolved_signature_url: resolveAssetUrl(settings.signature_url, origin)
  };
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    error.message?.toLowerCase().includes("column") === true
  );
}

function shouldLogOrganizationQueryError(error: { code?: string; message?: string; details?: string; hint?: string } | null) {
  if (!error) {
    return false;
  }

  if (isMissingColumnError(error)) {
    return false;
  }

  return Boolean(error.code || error.message || error.details || error.hint);
}

async function fetchOrganizationSettingsRecord() {
  const supabase = await createClient();
  const result = await supabase
    .from("organization_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shouldLogOrganizationQueryError(result.error)) {
    logSupabaseQueryError({
      file: "lib/organization.ts",
      table: "organization_settings",
      query: 'select("*").order("created_at").limit(1).maybeSingle()',
      error: result.error
    });
  }

  return result;
}

export async function getOrganizationSettings() {
  const { data, error } = await fetchOrganizationSettingsRecord();

  if (error || !data) {
    return defaultOrganizationSettings;
  }

  return {
    ...defaultOrganizationSettings,
    id: typeof data.id === "string" ? data.id : undefined,
    organization_name:
      (typeof data.organization_name === "string" && data.organization_name.trim()) ||
      defaultOrganizationSettings.organization_name,
    address: (typeof data.address === "string" && data.address.trim()) || defaultOrganizationSettings.address,
    postal_code:
      (typeof data.postal_code === "string" && data.postal_code.trim()) ||
      (typeof data.zip_code === "string" && data.zip_code.trim()) ||
      (typeof data.postcode === "string" && data.postcode.trim()) ||
      null,
    city:
      (typeof data.city === "string" && data.city.trim()) ||
      (typeof data.town === "string" && data.town.trim()) ||
      (typeof data.locality === "string" && data.locality.trim()) ||
      null,
    siret: (typeof data.siret === "string" && data.siret.trim()) || null,
    training_declaration_number:
      (typeof data.training_declaration_number === "string" && data.training_declaration_number.trim()
        ? data.training_declaration_number
        : typeof data.nda === "string" && data.nda.trim()
          ? data.nda
          : null)?.replace(/^NDA\s*:?\s*/i, "").trim() || null,
    qualiopi_mention:
      (typeof data.qualiopi_mention === "string" && data.qualiopi_mention.trim()) ||
      (typeof data.qualiopi_label === "string" && data.qualiopi_label.trim()) ||
      null,
    logo_url: normalizeConfiguredAssetUrl(data.logo_url) ?? defaultOrganizationSettings.logo_url,
    signature_url: normalizeConfiguredAssetUrl(data.signature_url) ?? defaultOrganizationSettings.signature_url,
    certificate_signatory_name:
      (typeof data.certificate_signatory_name === "string" && data.certificate_signatory_name.trim()) ||
      (typeof data.legal_representative === "string" && data.legal_representative.trim()) ||
      null,
    certificate_signatory_title:
      (typeof data.certificate_signatory_title === "string" && data.certificate_signatory_title.trim()) || null
  } as OrganizationSettings;
}

export async function getOrganizationBranding(origin?: string) {
  const settings = await getOrganizationSettings();
  return withResolvedBranding(settings, origin);
}
