"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createInvoiceFromQuoteAction,
  createSessionFromQuoteAction,
  type QuoteEditorActionState
} from "@/app/(dashboard)/quotes/actions";
import { updateQuoteStatusAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQuoteStatusTone, QUOTE_STATUS_LABELS, QUOTE_STATUS_MANAGEMENT_OPTIONS } from "@/lib/quote-status";
import type { CompanyInvoiceSummary, CompanyQuoteSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const initialStatusState: ActionState = {};
const initialQuoteState: QuoteEditorActionState = {};

function CompanyQuoteRow({
  quote,
  invoice
}: {
  quote: CompanyQuoteSummary;
  invoice: CompanyInvoiceSummary | null;
}) {
  const [quoteStatusState, quoteStatusFormAction, quoteStatusPending] = useActionState(
    updateQuoteStatusAction,
    initialStatusState
  );
  const [createSessionState, createSessionFormAction, createSessionPending] = useActionState(
    createSessionFromQuoteAction,
    initialQuoteState
  );
  const [createInvoiceState, createInvoiceFormAction, createInvoicePending] = useActionState(
    createInvoiceFromQuoteAction,
    initialQuoteState
  );
  const canCreateSession = quote.status === "accepted" && !quote.session_id;
  const canCreateInvoice = quote.status === "accepted" && !invoice;

  return (
    <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{quote.quote_number}</p>
            <Badge tone={getQuoteStatusTone(quote.status)}>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink/65">{quote.title}</p>
          <p className="mt-2 text-sm text-ink/55">
            Cree le {formatDate(quote.created_at)} - {quote.total_ttc.toFixed(2)} EUR
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink/65">
            <span className="text-ink/55">Statut :</span>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-ink/10 bg-white/80 p-1">
              {QUOTE_STATUS_MANAGEMENT_OPTIONS.map((statusOption) => {
                const isActive = quote.status === statusOption;

                return (
                  <form key={statusOption} action={quoteStatusFormAction}>
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <input type="hidden" name="status" value={statusOption} />
                    <button
                      type="submit"
                      disabled={quoteStatusPending || isActive}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        isActive ? "bg-sand text-ink" : "text-ink/60 hover:bg-sand/70 hover:text-ink"
                      } disabled:cursor-default disabled:opacity-100`}
                    >
                      {QUOTE_STATUS_LABELS[statusOption]}
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/quotes/${quote.id}`}
            className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
          >
            Ouvrir
          </Link>
          {quote.session_id ? (
            <Link
              href={`/sessions/${quote.session_id}`}
              className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
            >
              Session
            </Link>
          ) : canCreateSession ? (
            <form action={createSessionFormAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <Button type="submit" variant="secondary" disabled={createSessionPending}>
                {createSessionPending ? "Creation..." : "Creer la session"}
              </Button>
            </form>
          ) : null}
          {invoice ? (
            <Link
              href={`/invoices/${invoice.id}`}
              className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
            >
              Facture
            </Link>
          ) : canCreateInvoice ? (
            <form action={createInvoiceFormAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <Button type="submit" variant="secondary" disabled={createInvoicePending}>
                {createInvoicePending ? "Creation..." : "Creer la facture"}
              </Button>
            </form>
          ) : null}
        </div>
      </div>
      {quoteStatusState.error ? <p className="mt-2 text-sm text-accent">{quoteStatusState.error}</p> : null}
      {quoteStatusState.success ? <p className="mt-2 text-sm text-pine">{quoteStatusState.success}</p> : null}
      {createSessionState.error ? <p className="mt-2 text-sm text-accent">{createSessionState.error}</p> : null}
      {createInvoiceState.error ? <p className="mt-2 text-sm text-accent">{createInvoiceState.error}</p> : null}
    </div>
  );
}

export function CompanyQuoteList({
  quotes,
  invoices
}: {
  quotes: CompanyQuoteSummary[];
  invoices: CompanyInvoiceSummary[];
}) {
  if (!quotes.length) {
    return <p className="text-sm text-ink/65">Aucun devis pour cette societe.</p>;
  }

  return (
    <div className="grid gap-3">
      {quotes.map((quote) => (
        <CompanyQuoteRow
          key={quote.id}
          quote={quote}
          invoice={invoices.find((invoice) => invoice.quote_id === quote.id) ?? null}
        />
      ))}
    </div>
  );
}
