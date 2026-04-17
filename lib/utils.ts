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
