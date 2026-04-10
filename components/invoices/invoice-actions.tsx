"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendInvoiceEmailAction, type InvoiceActionState } from "@/app/(dashboard)/invoices/actions";
import { Button } from "@/components/ui/button";

const initialState: InvoiceActionState = {};

export function InvoiceActions({
  invoiceId,
  quoteId
}: {
  invoiceId: string;
  quoteId: string;
}) {
  const [sendState, sendAction, sendPending] = useActionState(sendInvoiceEmailAction, initialState);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <form action={sendAction}>
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <Button type="submit" variant="secondary" disabled={sendPending}>
            {sendPending ? "Envoi..." : "Envoyer"}
          </Button>
        </form>
        <Link
          href={`/api/pdf/invoice/${invoiceId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
        >
          Ouvrir le PDF
        </Link>
        <Link
          href={`/quotes/${quoteId}`}
          className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
        >
          Ouvrir le devis
        </Link>
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
    </div>
  );
}
