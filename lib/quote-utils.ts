import { formatDate } from "@/lib/utils";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeQuoteTotalTtc(priceHt: number, vatRate: number) {
  return roundCurrency(priceHt * (1 + vatRate / 100));
}

export function computeQuoteVatAmount(priceHt: number, vatRate: number) {
  return roundCurrency(computeQuoteTotalTtc(priceHt, vatRate) - priceHt);
}

export function buildDefaultQuoteTitle(sessionTitle: string) {
  return `Formation SST - ${sessionTitle}`;
}

export function buildDefaultQuoteDescription({
  sessionTitle,
  startDate,
  endDate,
  location,
  candidateCount
}: {
  sessionTitle: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  candidateCount: number;
}) {
  const dateRange =
    startDate && endDate
      ? `du ${formatDate(startDate)} au ${formatDate(endDate)}`
      : startDate
        ? `le ${formatDate(startDate)}`
        : "dates à confirmer";
  const place = location?.trim() ? `Lieu : ${location}.` : "Lieu à confirmer.";
  return `${sessionTitle} ${dateRange}. ${candidateCount} candidat(s) prévu(s). ${place}`;
}
