import { PUBLIC_SITE_ORIGIN } from "@/lib/public-config";
import type { OrganizationBranding } from "@/lib/types";

export function getPdfOrganizationContactItems(organization: OrganizationBranding) {
  return [
    organization.contact_email,
    organization.contact_phone,
    PUBLIC_SITE_ORIGIN
  ].filter((item): item is string => Boolean(item?.trim()));
}

export function getPdfOrganizationFooterLine(organization: OrganizationBranding) {
  return [organization.organization_name, ...getPdfOrganizationContactItems(organization)].join(" - ");
}
