import type { QuoteStatus } from "@/lib/database.types";

export const QUOTE_STATUS_OPTIONS: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "archived"];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoye",
  accepted: "Accepte",
  rejected: "Refuse",
  archived: "Archive"
};

export function getQuoteStatusTone(status: QuoteStatus): "neutral" | "success" | "warning" {
  if (status === "accepted") {
    return "success";
  }

  if (status === "sent" || status === "rejected") {
    return "warning";
  }

  return "neutral";
}

export function isQuoteStatus(value: string): value is QuoteStatus {
  return QUOTE_STATUS_OPTIONS.includes(value as QuoteStatus);
}

export function getQuoteStatusAfterSend(status: QuoteStatus): QuoteStatus {
  if (status === "draft") {
    return "sent";
  }

  return status;
}
