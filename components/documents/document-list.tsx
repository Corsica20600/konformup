"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  sendQuoteEmailAction,
  type QuoteEditorActionState
} from "@/app/(dashboard)/quotes/actions";
import { duplicateQuoteAction } from "@/app/(dashboard)/sessions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQuoteStatusTone, QUOTE_STATUS_LABELS } from "@/lib/quote-status";
import type { GeneratedDocumentItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const initialQuoteMailState: QuoteEditorActionState = {};

function documentLabel(type: string) {
  if (type === "quote") return "Devis";
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
  const [sendState, sendFormAction, sendPending] = useActionState(sendQuoteEmailAction, initialQuoteMailState);
  const isQuote = document.document_type === "quote" && !!document.quote_id && !!document.quote_status;

  return (
    <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            {documentLabel(document.document_type)} - {document.document_ref}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/65">
            {isQuote ? (
              (() => {
                const quoteStatus = document.quote_status!;

                return (
                  <Badge tone={getQuoteStatusTone(quoteStatus)}>
                    {QUOTE_STATUS_LABELS[quoteStatus]}
                  </Badge>
                );
              })()
            ) : (
              <span>Statut : {document.status}</span>
            )}
            <span>Crée le {formatDate(document.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isQuote ? (
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
              {allowQuoteDuplication ? (
                <details className="relative">
                  <summary className="list-none rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-ink hover:bg-white/60 cursor-pointer">
                    Plus
                  </summary>
                  <div className="absolute right-0 z-10 mt-2 min-w-36 rounded-2xl border border-ink/10 bg-white p-2 shadow-panel">
                    <form action={duplicateFormAction}>
                      <input type="hidden" name="quoteId" value={document.quote_id ?? ""} />
                      <button
                        type="submit"
                        disabled={duplicatePending}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-sand disabled:opacity-60"
                      >
                        {duplicatePending ? "Duplication..." : "Dupliquer"}
                      </button>
                    </form>
                  </div>
                </details>
              ) : null}
            </>
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
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Documents</p>
      <h3 className="mt-2 text-2xl font-bold">{title}</h3>
      <div className="mt-6 grid gap-3">
        {documents.length ? (
          documents.map((document) => (
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
