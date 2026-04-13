"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createInvoiceFromQuoteAction,
  createSessionFromQuoteAction,
  generateProgrammePdfAction,
  regenerateQuotePdfAction,
  sendQuoteEmailAction,
  type QuoteEditorActionState,
  updateQuoteAction
} from "@/app/(dashboard)/quotes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuoteEditData } from "@/lib/quotes";
import type { Database } from "@/lib/database.types";

const initialState: QuoteEditorActionState = {};

type InvoiceSummary = Pick<Database["public"]["Tables"]["invoices"]["Row"], "id" | "invoice_number"> | null;

export function EditQuoteForm({
  quote,
  invoice,
  programmeFileUrl
}: {
  quote: QuoteEditData;
  invoice: InvoiceSummary;
  programmeFileUrl: string | null;
}) {
  const [saveState, saveAction, savePending] = useActionState(updateQuoteAction, initialState);
  const [createSessionState, createSessionAction, createSessionPending] = useActionState(
    createSessionFromQuoteAction,
    initialState
  );
  const [createInvoiceState, createInvoiceAction, createInvoicePending] = useActionState(
    createInvoiceFromQuoteAction,
    initialState
  );
  const [programmeState, programmeAction, programmePending] = useActionState(generateProgrammePdfAction, initialState);
  const [pdfState, pdfAction, pdfPending] = useActionState(regenerateQuotePdfAction, initialState);
  const [sendState, sendAction, sendPending] = useActionState(sendQuoteEmailAction, initialState);
  const canCreateSession = quote.status === "accepted" && !quote.session_id;
  const canCreateInvoice = quote.status === "accepted" && !invoice;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Devis</p>
          <h2 className="mt-2 text-3xl font-bold">{quote.title}</h2>
          <p className="mt-2 text-sm text-ink/65">
            Reference : {quote.quote_number} • Societe : {quote.company.company_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateSession ? (
            <form action={createSessionAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <Button type="submit" variant="secondary" disabled={createSessionPending}>
                {createSessionPending ? "Creation..." : "Creer la session"}
              </Button>
            </form>
          ) : null}
          {invoice ? (
            <>
              <Link
                href={`/invoices/${invoice.id}`}
                className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Voir la facture
              </Link>
              <Link
                href={`/api/pdf/invoice/${invoice.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                PDF facture
              </Link>
            </>
          ) : null}
          {canCreateInvoice ? (
            <form action={createInvoiceAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <Button type="submit" variant="secondary" disabled={createInvoicePending}>
                {createInvoicePending ? "Creation..." : "Creer la facture"}
              </Button>
            </form>
          ) : null}
          <form action={sendAction}>
            <input type="hidden" name="quoteId" value={quote.id} />
            <Button type="submit" variant="secondary" disabled={sendPending}>
              {sendPending ? "Envoi..." : "Envoyer"}
            </Button>
          </form>
          <form action={programmeAction}>
            <input type="hidden" name="quoteId" value={quote.id} />
            <Button type="submit" variant="secondary" disabled={programmePending}>
              {programmePending ? "Generation..." : "Programme SST"}
            </Button>
          </form>
          {programmeFileUrl ? (
            <Link
              href={programmeFileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
            >
              Ouvrir programme
            </Link>
          ) : null}
          <Link
            href={`/api/pdf/quote/${quote.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
          >
            Ouvrir le PDF
          </Link>
          <details className="relative">
            <summary className="list-none rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-ink hover:bg-white/60 cursor-pointer">
              Plus
            </summary>
            <div className="absolute right-0 z-10 mt-2 min-w-44 rounded-2xl border border-ink/10 bg-white p-2 shadow-panel">
              {quote.session_id ? (
                <Link
                  href={`/sessions/${quote.session_id}`}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-ink transition hover:bg-sand"
                >
                  Ouvrir la session
                </Link>
              ) : null}
              <form action={pdfAction}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <button
                  type="submit"
                  disabled={pdfPending}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-sand disabled:opacity-60"
                >
                  {pdfPending ? "Regeneration..." : "Regenerer PDF"}
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>

      <form action={saveAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="quoteId" value={quote.id} />

        <div className="md:col-span-2">
          <Input label="Intitule" name="title" defaultValue={quote.title} required />
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Description</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={quote.description ?? ""}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>

        <Input
          label="Nombre de candidats"
          name="candidateCount"
          type="number"
          min="0"
          step="1"
          defaultValue={String(quote.candidate_count)}
          required
        />
        <Input label="Lieu" name="location" defaultValue={quote.location ?? ""} />
        <Input label="Date de debut" name="sessionStartDate" type="date" defaultValue={quote.session_start_date ?? ""} />
        <Input label="Date de fin" name="sessionEndDate" type="date" defaultValue={quote.session_end_date ?? ""} />
        <Input
          label="Prix HT"
          name="priceHt"
          type="number"
          min="0"
          step="0.01"
          defaultValue={String(quote.price_ht)}
          required
        />
        <Input
          label="Taux de TVA"
          name="vatRate"
          type="number"
          min="0"
          step="0.01"
          defaultValue={String(quote.vat_rate)}
          required
        />

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Notes</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={quote.notes ?? ""}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>

        {saveState.error ? <p className="text-sm text-accent md:col-span-2">{saveState.error}</p> : null}
        {saveState.success ? <p className="text-sm text-pine md:col-span-2">{saveState.success}</p> : null}

        <div className="md:col-span-2">
          <Button type="submit" disabled={savePending}>
            {savePending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>

      {pdfState.error ? <p className="text-sm text-accent">{pdfState.error}</p> : null}
      {pdfState.success ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{pdfState.success}</p>
          {pdfState.fileUrl ? (
            <Link href={pdfState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
      {programmeState.error ? <p className="text-sm text-accent">{programmeState.error}</p> : null}
      {programmeState.success ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{programmeState.success}</p>
          {programmeState.fileUrl ? (
            <Link href={programmeState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
      {sendState.error ? <p className="text-sm text-accent">{sendState.error}</p> : null}
      {sendState.success ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{sendState.success}</p>
          {sendState.fileUrl ? (
            <Link href={sendState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
      {createSessionState.error ? <p className="text-sm text-accent">{createSessionState.error}</p> : null}
      {createInvoiceState.error ? <p className="text-sm text-accent">{createInvoiceState.error}</p> : null}
    </div>
  );
}
