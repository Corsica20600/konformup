"use client";

import Link from "next/link";
import { type ReactNode, useActionState, useEffect, useRef, useState } from "react";
import {
  createInvoiceFromQuoteAction,
  createSessionFromQuoteAction,
  generateTrainingAgreementAction,
  generateProgrammePdfAction,
  regenerateTrainingAgreementAction,
  regenerateQuotePdfAction,
  sendQuoteEmailAction,
  type QuoteEditorActionState,
  updateQuoteAction
} from "@/app/(dashboard)/quotes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import type { QuoteEditData } from "@/lib/quotes";
import type { Database } from "@/lib/database.types";
import type { TrainingType } from "@/lib/database.types";
import type { TrainerOption } from "@/lib/types";
import {
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_OPTIONS,
  getTrainingProgramDefaults,
  isMacSstTraining
} from "@/lib/training-programs";

const initialState: QuoteEditorActionState = {};

type InvoiceSummary = Pick<Database["public"]["Tables"]["invoices"]["Row"], "id" | "invoice_number"> | null;

export function getLinkedQuoteDocuments(params: {
  invoiceId: string | null;
  programmeFileUrl: string | null;
  trainingAgreementFileUrl: string | null;
}) {
  return [
    params.invoiceId ? { key: "invoice", label: "Ouvrir la facture", href: `/invoices/${params.invoiceId}`, external: false } : null,
    params.programmeFileUrl ? { key: "programme", label: "Ouvrir le programme", href: params.programmeFileUrl, external: true } : null,
    params.trainingAgreementFileUrl
      ? { key: "training-agreement", label: "Ouvrir la convention", href: params.trainingAgreementFileUrl, external: true }
      : null
  ].filter((document): document is { key: string; label: string; href: string; external: boolean } => Boolean(document));
}

function QuoteActionMenu({
  label,
  children,
  emptyMessage
}: {
  label: string;
  children: ReactNode;
  emptyMessage?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {label}
      </Button>
      {isOpen ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 z-10 mt-2 min-w-52 rounded-2xl border border-ink/10 bg-white p-2 shadow-panel"
          onClick={() => setIsOpen(false)}
        >
          {emptyMessage ? <p className="px-3 py-2 text-sm text-ink/60">{emptyMessage}</p> : children}
        </div>
      ) : null}
    </div>
  );
}

export function EditQuoteForm({
  quote,
  invoice,
  programmeFileUrl,
  trainingAgreement,
  trainers
}: {
  quote: QuoteEditData;
  invoice: InvoiceSummary;
  programmeFileUrl: string | null;
  trainers: TrainerOption[];
  trainingAgreement: {
    id: string;
    fileUrl: string | null;
    documentRef: string;
    version: number;
    missingFields: string[];
  } | null;
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
  const [trainingAgreementState, trainingAgreementAction, trainingAgreementPending] = useActionState(
    generateTrainingAgreementAction,
    initialState
  );
  const [regenerateTrainingAgreementState, regenerateTrainingAgreementFormAction, regenerateTrainingAgreementPending] =
    useActionState(regenerateTrainingAgreementAction, initialState);
  const [programmeState, programmeAction, programmePending] = useActionState(generateProgrammePdfAction, initialState);
  const [pdfState, pdfAction, pdfPending] = useActionState(regenerateQuotePdfAction, initialState);
  const [sendState, sendAction, sendPending] = useActionState(sendQuoteEmailAction, initialState);
  const [trainingType, setTrainingType] = useState<TrainingType>(quote.training_type as TrainingType);
  const [macPreviousCertificateDate, setMacPreviousCertificateDate] = useState(
    quote.mac_previous_certificate_date ?? ""
  );
  const [macPreviousCertificateRef, setMacPreviousCertificateRef] = useState(
    quote.mac_previous_certificate_ref ?? ""
  );
  const canCreateSession = quote.status === "accepted" && !quote.session_id;
  const canCreateInvoice = quote.status === "accepted" && !invoice;
  const canGenerateTrainingAgreement = quote.status === "accepted";
  const trainingAgreementFileUrl = trainingAgreement?.fileUrl ?? `/api/pdf/training-agreement/${quote.id}`;
  const linkedDocuments = getLinkedQuoteDocuments({
    invoiceId: invoice?.id ?? null,
    programmeFileUrl,
    trainingAgreementFileUrl: trainingAgreement ? trainingAgreementFileUrl : null
  });
  const trainingDefaults = getTrainingProgramDefaults(trainingType);
  const assignedTrainerId =
    trainers.find(
      (trainer) =>
        `${trainer.first_name} ${trainer.last_name}`.trim().toLocaleLowerCase("fr-FR") ===
        quote.trainer_name?.trim().toLocaleLowerCase("fr-FR")
    )?.id ?? "";

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
        <div className="flex max-w-full flex-wrap justify-end gap-2">
          <Link
            href={`/api/pdf/quote/${quote.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
          >
            Voir le devis
          </Link>
          <form action={sendAction}>
            <input type="hidden" name="quoteId" value={quote.id} />
            <Button type="submit" variant="secondary" disabled={sendPending}>
              {sendPending ? "Envoi..." : "Envoyer le devis"}
            </Button>
          </form>
          {quote.session_id ? (
            <Link
              href={`/sessions/${quote.session_id}`}
              className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
            >
              Ouvrir la session
            </Link>
          ) : null}
          <QuoteActionMenu
            label="Documents liés"
            emptyMessage={linkedDocuments.length === 0 ? "Aucun document lié n’est disponible." : undefined}
          >
            {linkedDocuments.map((document) => (
              <Link
                key={document.key}
                href={document.href}
                target={document.external ? "_blank" : undefined}
                rel={document.external ? "noreferrer" : undefined}
                role="menuitem"
                className="block rounded-xl px-3 py-2 text-sm font-medium text-ink transition hover:bg-sand"
              >
                {document.label}
              </Link>
            ))}
          </QuoteActionMenu>
          <QuoteActionMenu label="Plus">
            <form action={pdfAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <button type="submit" disabled={pdfPending} role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-sand disabled:opacity-60">
                {pdfPending ? "Régénération..." : "Régénérer le PDF du devis"}
              </button>
            </form>
            {canCreateSession ? (
              <form action={createSessionAction}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <button type="submit" disabled={createSessionPending} role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-sand disabled:opacity-60">
                  {createSessionPending ? "Création..." : "Créer la session"}
                </button>
              </form>
            ) : null}
            {canCreateInvoice ? (
              <form action={createInvoiceAction}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <button type="submit" disabled={createInvoicePending} role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-sand disabled:opacity-60">
                  {createInvoicePending ? "Création..." : "Créer la facture"}
                </button>
              </form>
            ) : null}
            {!programmeFileUrl ? (
              <form action={programmeAction}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <button type="submit" disabled={programmePending} role="menuitem" className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-sand disabled:opacity-60">
                  {programmePending ? "Génération..." : "Générer le programme"}
                </button>
              </form>
            ) : null}
          </QuoteActionMenu>
        </div>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-ink/10 bg-white/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Convention de formation</p>
            <h3 className="mt-2 text-2xl font-bold">
              {trainingAgreement ? "Convention generee" : "Convention non generee"}
            </h3>
            <p className="mt-2 text-sm text-ink/65">
              {quote.status === "accepted"
                ? "La convention est rattachee au devis accepte et peut etre visualisee, telechargee ou regeneree."
                : "La convention sera generee automatiquement lorsque le devis passera a l'etat accepte."}
            </p>
          </div>
          {trainingAgreement ? (
            <div className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink">
              {trainingAgreement.documentRef} • v{trainingAgreement.version}
            </div>
          ) : null}
        </div>

        {trainingAgreement?.missingFields.length ? (
          <div className="rounded-2xl border border-[#d9c79b] bg-[#fbf5e6] px-4 py-3 text-sm text-ink/80">
            <p className="font-semibold text-[#6d571f]">Champs a verifier dans la convention :</p>
            <p className="mt-1">{trainingAgreement.missingFields.join(" • ")}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {trainingAgreement ? (
            <>
              <Link
                href={trainingAgreementFileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Ouvrir
              </Link>
              <Link
                href={`${trainingAgreementFileUrl}?download=1`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Telecharger
              </Link>
            </>
          ) : null}
          {canGenerateTrainingAgreement ? (
            <form action={trainingAgreement ? regenerateTrainingAgreementFormAction : trainingAgreementAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <Button
                type="submit"
                variant="secondary"
                disabled={trainingAgreement ? regenerateTrainingAgreementPending : trainingAgreementPending}
              >
                {trainingAgreement
                  ? regenerateTrainingAgreementPending
                    ? "Regeneration..."
                    : "Regenerer"
                  : trainingAgreementPending
                    ? "Generation..."
                    : "Generer"}
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <form action={saveAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="quoteId" value={quote.id} />

        <div className="md:col-span-2">
          <Input label="Intitule" name="title" defaultValue={quote.title} required />
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Type de formation</span>
          <select
            name="trainingType"
            value={trainingType}
            onChange={(event) => setTrainingType(event.target.value as TrainingType)}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            {TRAINING_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TRAINING_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Duree (heures)"
          name="durationHours"
          type="number"
          min="1"
          step="0.5"
          defaultValue={quote.duration_hours ? String(quote.duration_hours) : String(trainingDefaults.durationHours)}
        />

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
        <input type="hidden" name="currentTrainerName" value={quote.trainer_name ?? ""} />
        <SelectField
          label="Formateur"
          name="trainerId"
          defaultValue={assignedTrainerId}
          hint={quote.trainer_name && !assignedTrainerId ? `${quote.trainer_name} est conservé tant qu'aucun autre formateur n'est choisi.` : undefined}
        >
          <option value="">À confirmer</option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.first_name} {trainer.last_name}
            </option>
          ))}
        </SelectField>
        <Input label="Date de debut" name="sessionStartDate" type="date" defaultValue={quote.session_start_date ?? ""} />
        <Input label="Date de fin" name="sessionEndDate" type="date" defaultValue={quote.session_end_date ?? ""} />
        <SelectField label="Format de la session" name="sessionFormat" defaultValue={quote.session_format ?? "intra"}>
          <option value="intra">Intra-entreprise — non publiée</option>
          <option value="inter">Interentreprises — visible dans le planning public</option>
        </SelectField>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Prérequis</span>
          <textarea
            name="prerequisites"
            rows={2}
            defaultValue={quote.prerequisites ?? trainingDefaults.prerequisites}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Objectifs</span>
          <textarea
            name="objectives"
            rows={3}
            defaultValue={quote.objectives ?? trainingDefaults.objectives.join("\n")}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Programme</span>
          <textarea
            name="programmeOutline"
            rows={4}
            defaultValue={quote.programme_outline ?? trainingDefaults.programmeLines.join("\n")}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Accessibilité / adaptation</span>
          <textarea
            name="accessibilityDetails"
            rows={2}
            defaultValue={quote.accessibility_details ?? trainingDefaults.accessibility}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>

        {isMacSstTraining(trainingType) ? (
          <>
            <Input
              label="Date certificat SST précédent"
              name="macPreviousCertificateDate"
              type="date"
              value={macPreviousCertificateDate}
              onChange={(event) => setMacPreviousCertificateDate(event.target.value)}
            />
            <Input
              label="Référence certificat précédent"
              name="macPreviousCertificateRef"
              value={macPreviousCertificateRef}
              onChange={(event) => setMacPreviousCertificateRef(event.target.value)}
            />
          </>
        ) : null}

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
      {trainingAgreementState.error ? <p className="text-sm text-accent">{trainingAgreementState.error}</p> : null}
      {trainingAgreementState.success ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{trainingAgreementState.success}</p>
          {trainingAgreementState.fileUrl ? (
            <Link href={trainingAgreementState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir le PDF
            </Link>
          ) : null}
        </div>
      ) : null}
      {regenerateTrainingAgreementState.error ? (
        <p className="text-sm text-accent">{regenerateTrainingAgreementState.error}</p>
      ) : null}
      {regenerateTrainingAgreementState.success ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-pine">
          <p>{regenerateTrainingAgreementState.success}</p>
          {regenerateTrainingAgreementState.fileUrl ? (
            <Link
              href={regenerateTrainingAgreementState.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-pine"
            >
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
