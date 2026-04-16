"use client";

import { useActionState } from "react";
import { saveInvoiceComplaintAction, type InvoiceComplaintActionState } from "@/app/(dashboard)/invoices/actions";
import {
  INVOICE_COMPLAINT_SEVERITY_OPTIONS,
  INVOICE_COMPLAINT_STATUS_OPTIONS
} from "@/lib/invoice-complaint-config";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";

const initialState: InvoiceComplaintActionState = {};
type InvoiceComplaint = Database["public"]["Tables"]["invoice_complaints"]["Row"];

const statusLabels = {
  open: "Ouverte",
  in_progress: "En cours",
  resolved: "Resolue",
  closed: "Cloturee"
} as const;

const severityLabels = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute"
} as const;

export function InvoiceComplaintForm({
  invoiceId,
  complaint
}: {
  invoiceId: string;
  complaint: InvoiceComplaint | null;
}) {
  const [state, formAction, pending] = useActionState(saveInvoiceComplaintAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div className="md:col-span-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Qualite</p>
          <h3 className="mt-2 text-2xl font-bold">Fiche de reclamation et insatisfaction</h3>
          <p className="mt-2 text-sm text-ink/65">
            Suivi du probleme, analyse des causes et plan d&apos;actions correctives/preventives.
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
        <span>Statut</span>
        <select
          name="status"
          defaultValue={complaint?.status ?? "open"}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        >
          {INVOICE_COMPLAINT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
        <span>Niveau</span>
        <select
          name="severity"
          defaultValue={complaint?.severity ?? "medium"}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        >
          {INVOICE_COMPLAINT_SEVERITY_OPTIONS.map((severity) => (
            <option key={severity} value={severity}>
              {severityLabels[severity]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Synthese de l&apos;insatisfaction</span>
        <textarea
          name="dissatisfactionSummary"
          rows={3}
          defaultValue={complaint?.dissatisfaction_summary ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Reclamation detaillee</span>
        <textarea
          name="complaintDetails"
          rows={4}
          defaultValue={complaint?.complaint_details ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Attente du client</span>
        <textarea
          name="customerExpectation"
          rows={3}
          defaultValue={complaint?.customer_expectation ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Analyse / cause racine</span>
        <textarea
          name="rootCause"
          rows={4}
          defaultValue={complaint?.root_cause ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Mesures correctives</span>
        <textarea
          name="correctiveActions"
          rows={4}
          defaultValue={complaint?.corrective_actions ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Mesures preventives</span>
        <textarea
          name="preventiveActions"
          rows={4}
          defaultValue={complaint?.preventive_actions ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Suivi / verification d&apos;efficacite</span>
        <textarea
          name="followUpActions"
          rows={3}
          defaultValue={complaint?.follow_up_actions ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Notes internes</span>
        <textarea
          name="internalNotes"
          rows={3}
          defaultValue={complaint?.internal_notes ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink/80">
        <input
          type="checkbox"
          name="sendWithInvoice"
          defaultChecked={complaint?.send_with_invoice ?? false}
          className="h-4 w-4 rounded border border-ink/20"
        />
        Envoyer cette fiche avec la facture
      </label>

      {complaint?.sent_with_invoice_at ? (
        <p className="text-sm text-ink/60 md:col-span-2">
          Dernier envoi avec la facture : {new Date(complaint.sent_with_invoice_at).toLocaleString("fr-FR")}
        </p>
      ) : null}

      {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer la fiche"}
        </Button>
      </div>
    </form>
  );
}
