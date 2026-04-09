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

export async function getOrganizationSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_settings")
    .select(
      "id, organization_name, address, siret, training_declaration_number:nda, qualiopi_mention:qualiopi_label, logo_url, signature_url, certificate_signatory_name:legal_representative, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  logSupabaseQueryError({
    file: "lib/organization.ts",
    table: "organization_settings",
    query: 'select("id, organization_name, address, siret, training_declaration_number:nda, qualiopi_mention:qualiopi_label, logo_url, signature_url, certificate_signatory_name:legal_representative, created_at").order("created_at").limit(1).maybeSingle()',
    error
  });

  if (error || !data) {
    return defaultOrganizationSettings;
  }

  return {
    ...defaultOrganizationSettings,
    ...data,
    logo_url: normalizeConfiguredAssetUrl(data.logo_url) ?? defaultOrganizationSettings.logo_url,
    signature_url: normalizeConfiguredAssetUrl(data.signature_url) ?? defaultOrganizationSettings.signature_url
  } as OrganizationSettings;
}

export async function getOrganizationBranding(origin?: string) {
  const settings = await getOrganizationSettings();
  return withResolvedBranding(settings, origin);
}
