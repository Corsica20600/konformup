"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createInvoiceFromQuoteAction,
  createSessionFromQuoteAction,
  sendQuoteEmailAction,
  type QuoteEditorActionState
} from "@/app/(dashboard)/quotes/actions";
import { sendInvoiceEmailAction, type InvoiceActionState } from "@/app/(dashboard)/invoices/actions";
import { duplicateQuoteAction, type ActionState, updateQuoteStatusAction } from "@/app/(dashboard)/sessions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQuoteStatusTone, QUOTE_STATUS_LABELS } from "@/lib/quote-status";
import type { QuoteStatus } from "@/lib/database.types";
import type { GeneratedDocumentItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const initialQuoteMailState: QuoteEditorActionState = {};
const initialInvoiceMailState: InvoiceActionState = {};
const initialStatusState: ActionState = {};
const DOCUMENT_QUOTE_STATUS_OPTIONS: QuoteStatus[] = ["draft", "sent", "accepted"];

function documentLabel(type: string) {
  if (type === "quote") return "Devis";
  if (type === "invoice") return "Facture";
  if (type === "programme") return "Programme";
  if (type === "aide_memoire") return "Aide memoire sauveteur secouriste du travail";
  if (type === "attestation") return "Attestation";
  if (type === "certificat") return "Certificat";
  if (type === "convocation") return "Convocation";
  if (type === "feuille_presence") return "Feuille de présence";
  return type;
}

function DocumentRow({
  document,
  allowQuoteDuplication
}: {
  document: GeneratedDocumentItem;
  allowQuoteDuplication: boolean;
}) {
  const [duplicateState, duplicateFormAction, duplicatePending] = useActionState(duplicateQuoteAction, initialQuoteMailState);
  const [createSessionState, createSessionFormAction, createSessionPending] = useActionState(
    createSessionFromQuoteAction,
    initialQuoteMailState
  );
  const [createInvoiceState, createInvoiceFormAction, createInvoicePending] = useActionState(
    createInvoiceFromQuoteAction,
    initialQuoteMailState
  );
  const [sendState, sendFormAction, sendPending] = useActionState(sendQuoteEmailAction, initialQuoteMailState);
  const [sendInvoiceState, sendInvoiceFormAction, sendInvoicePending] = useActionState(
    sendInvoiceEmailAction,
    initialInvoiceMailState
  );
  const [quoteStatusState, quoteStatusFormAction, quoteStatusPending] = useActionState(
    updateQuoteStatusAction,
    initialStatusState
  );
  const isQuote = document.document_type === "quote" && !!document.quote_id && !!document.quote_status;
  const canCreateSession = isQuote && document.quote_status === "accepted" && !document.session_id;
  const canCreateInvoice = isQuote && document.quote_status === "accepted" && !document.invoice_id;
  const quoteStatus = document.quote_status ?? "draft";

  return (
    <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            {documentLabel(document.document_type)} - {document.document_ref}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/65">
            {isQuote ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-ink/55">Statut du devis :</span>
                <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-ink/10 bg-white/80 p-1">
                  {DOCUMENT_QUOTE_STATUS_OPTIONS.map((statusOption) => {
                    const isActive = quoteStatus === statusOption;

                    return (
                      <form key={statusOption} action={quoteStatusFormAction}>
                        <input type="hidden" name="quoteId" value={document.quote_id ?? ""} />
                        <input type="hidden" name="status" value={statusOption} />
                        <button
                          type="submit"
                          disabled={quoteStatusPending || isActive}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            isActive
                              ? "bg-sand text-ink"
                              : "text-ink/60 hover:bg-sand/70 hover:text-ink"
                          } disabled:cursor-default disabled:opacity-100`}
                        >
                          {QUOTE_STATUS_LABELS[statusOption]}
                        </button>
                      </form>
                    );
                  })}
                </div>
                <Badge tone={getQuoteStatusTone(quoteStatus)}>{QUOTE_STATUS_LABELS[quoteStatus]}</Badge>
              </div>
            ) : (
              <span>Statut : {document.status}</span>
            )}
            <span>Crée le {formatDate(document.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isQuote ? (
            <>
              {(quoteStatus === "draft" || quoteStatus === "sent") ? (
                <>
                  <Link
                    href={`/quotes/${document.quote_id}`}
                    className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
                  >
                    Modifier
                  </Link>
                  <form action={sendFormAction}>
                    <input type="hidden" name="quoteId" value={document.quote_id ?? ""} />
                    <Button type="submit" variant="secondary" disabled={sendPending}>
                      {sendPending ? "Envoi..." : "Envoyer"}
                    </Button>
                  </form>
                </>
              ) : null}
              {quoteStatus === "accepted" ? (
                <>
                  {document.invoice_id ? (
                    <Link
                      href={`/invoices/${document.invoice_id}`}
                      className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
                    >
                      Voir la facture
                    </Link>
                  ) : canCreateInvoice ? (
                    <form action={createInvoiceFormAction}>
                      <input type="hidden" name="quoteId" value={document.quote_id ?? ""} />
                      <Button type="submit" variant="secondary" disabled={createInvoicePending}>
                        {createInvoicePending ? "Creation..." : "Creer la facture"}
                      </Button>
                    </form>
                  ) : null}
                  {canCreateSession ? (
                    <form action={createSessionFormAction}>
                      <input type="hidden" name="quoteId" value={document.quote_id ?? ""} />
                      <Button type="submit" variant="secondary" disabled={createSessionPending}>
                        {createSessionPending ? "Creation..." : "Creer la session"}
                      </Button>
                    </form>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          {document.document_type === "invoice" && document.invoice_id ? (
            <form action={sendInvoiceFormAction}>
              <input type="hidden" name="invoiceId" value={document.invoice_id} />
              <Button type="submit" variant="secondary" disabled={sendInvoicePending}>
                {sendInvoicePending ? "Envoi..." : "Envoyer"}
              </Button>
            </form>
          ) : null}
          {document.file_url ? (
            <Link
              href={document.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
            >
              Ouvrir
            </Link>
          ) : null}
        </div>
      </div>
      {isQuote && document.invoice_id && document.invoice_number ? (
        <div className="mt-3 rounded-2xl border border-ink/10 bg-white/70 px-3 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                Facture liée : {document.invoice_number}
              </p>
              <p className="mt-1 text-sm text-ink/55">Document lié au devis concerné.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/invoices/${document.invoice_id}`}
                className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Ouvrir
              </Link>
              <form action={sendInvoiceFormAction}>
                <input type="hidden" name="invoiceId" value={document.invoice_id} />
                <Button type="submit" variant="secondary" disabled={sendInvoicePending}>
                  {sendInvoicePending ? "Envoi..." : "Envoyer"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      {sendState.error ? <p className="mt-2 text-sm text-accent">{sendState.error}</p> : null}
      {sendState.success ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{sendState.success}</p>
          {sendState.fileUrl ? (
            <Link href={sendState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
      {sendInvoiceState.error ? <p className="mt-2 text-sm text-accent">{sendInvoiceState.error}</p> : null}
      {sendInvoiceState.success ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{sendInvoiceState.success}</p>
          {sendInvoiceState.fileUrl ? (
            <Link href={sendInvoiceState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
      {quoteStatusState.error ? <p className="mt-2 text-sm text-accent">{quoteStatusState.error}</p> : null}
      {quoteStatusState.success ? <p className="mt-2 text-sm text-pine">{quoteStatusState.success}</p> : null}
      {createInvoiceState.error ? <p className="mt-2 text-sm text-accent">{createInvoiceState.error}</p> : null}
      {createSessionState.error ? <p className="mt-2 text-sm text-accent">{createSessionState.error}</p> : null}
      {isQuote && allowQuoteDuplication ? (
        <div className="mt-2">
          <form action={duplicateFormAction}>
            <input type="hidden" name="quoteId" value={document.quote_id ?? ""} />
            <button
              type="submit"
              disabled={duplicatePending}
              className="text-sm font-medium text-ink/65 transition hover:text-ink disabled:opacity-60"
            >
              {duplicatePending ? "Duplication..." : "Dupliquer le devis"}
            </button>
          </form>
        </div>
      ) : null}
      {duplicateState.error ? <p className="mt-2 text-sm text-accent">{duplicateState.error}</p> : null}
      {duplicateState.success ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{duplicateState.success}</p>
          {duplicateState.fileUrl ? (
            <Link href={duplicateState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function DocumentList({
  title,
  documents,
  emptyMessage,
  allowQuoteDuplication = false
}: {
  title: string;
  documents: GeneratedDocumentItem[];
  emptyMessage: string;
  allowQuoteDuplication?: boolean;
}) {
  const visibleDocuments = documents.filter((document) => document.document_type !== "invoice");

  return (
    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Documents</p>
      <h3 className="mt-2 text-2xl font-bold">{title}</h3>
      <div className="mt-6 grid gap-3">
        {visibleDocuments.length ? (
          visibleDocuments.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              allowQuoteDuplication={allowQuoteDuplication}
            />
          ))
        ) : (
          <p className="text-sm text-ink/65">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
