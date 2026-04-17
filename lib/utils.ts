import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateRange(startDate: string | null | undefined, endDate: string | null | undefined) {
  if (!startDate && !endDate) return "-";
  if (!startDate) return formatDate(endDate);
  if (!endDate) return formatDate(startDate);

  return `${formatDate(startDate)} au ${formatDate(endDate)}`;
}

export function formatDurationHours(value: number | null | undefined) {
  if (!value) return "Non renseignee";

  const normalized = Number.isInteger(value) ? value.toString() : value.toString().replace(".", ",");
  return `${normalized} heure${value > 1 ? "s" : ""}`;
}

export function formatCurrency(value: number | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  })
    .format(amount)
    .replace(/[\u00A0\u202F]/g, " ");
}

export function formatDateShort(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export function formatPercent(value: number | null | undefined) {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

export function initials(firstName?: string | null, lastName?: string | null) {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
}

function cleanAddressPart(value: string | null | undefined) {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed : null;
}

function toDisplayCase(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s'-])(\p{L})/gu, (_, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase("fr-FR")}`);
}

function normalizeCountry(value: string | null | undefined) {
  const country = cleanAddressPart(value);

  if (!country) {
    return null;
  }

  const normalized = country.toLocaleLowerCase("fr-FR");

  if (normalized === "fr" || normalized === "france") {
    return "France";
  }

  return toDisplayCase(country);
}

function normalizeCity(value: string | null | undefined) {
  const city = cleanAddressPart(value);
  return city ? toDisplayCase(city) : null;
}

function isFrenchAddress(postalCode: string | null, country: string | null) {
  if (country === "France") {
    return true;
  }

  if (!country && postalCode && /^\d{5}$/.test(postalCode)) {
    return true;
  }

  return false;
}

export function formatAddressLines({
  address,
  postalCode,
  city,
  country
}: {
  address: string | null | undefined;
  postalCode?: string | null | undefined;
  city?: string | null | undefined;
  country?: string | null | undefined;
}) {
  const streetLine = cleanAddressPart(address);
  const normalizedPostalCode = cleanAddressPart(postalCode);
  const normalizedCity = normalizeCity(city);
  const normalizedCountry = normalizeCountry(country);
  const frenchAddress = isFrenchAddress(normalizedPostalCode, normalizedCountry);

  const localityLine = [
    normalizedPostalCode,
    normalizedCity ? normalizedCity : null
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!streetLine && !localityLine && !normalizedCountry) {
    return [];
  }

  const lines = [streetLine].filter((line): line is string => Boolean(line));

  if (frenchAddress) {
    if (localityLine) {
      lines.push(localityLine);
    }

    lines.push("France");
    return Array.from(new Set(lines));
  }

  const foreignLocality = [localityLine || null, normalizedCountry || null].filter(Boolean).join(" - ").trim();

  if (foreignLocality) {
    lines.push(foreignLocality);
  } else if (normalizedCountry) {
    lines.push(normalizedCountry);
  }

  return lines;
}
