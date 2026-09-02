"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createQuoteAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import type { TrainingType } from "@/lib/database.types";
import { buildDefaultQuoteDescription, buildDefaultQuoteTitle, computeQuoteTotalTtc } from "@/lib/quote-utils";
import { getDefaultTrainerId } from "@/lib/session-form";
import {
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_OPTIONS,
  getTrainingDocumentTitle,
  getTrainingProgramDefaults,
  isMacSstTraining
} from "@/lib/training-programs";
import type { TrainerOption } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type QuoteCompanyOption = {
  id: string;
  company_name: string;
  candidateCount: number;
};

const initialState: ActionState = {};

export function CreateQuoteForm({
  sessionId,
  sessionTitle,
  startDate,
  endDate,
  location,
  trainingNeedsAnalysisId,
  initialTrainingType,
  companies,
  trainers
}: {
  sessionId?: string | null;
  sessionTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  trainingNeedsAnalysisId?: string | null;
  initialTrainingType?: TrainingType;
  companies: QuoteCompanyOption[];
  trainers: TrainerOption[];
}) {
  const [isOpen, setIsOpen] = useState(Boolean(trainingNeedsAnalysisId));
  const [state, formAction, pending] = useActionState(createQuoteAction, initialState);
  const defaultCompanyId = companies.find((company) => company.candidateCount > 0)?.id ?? companies[0]?.id ?? "";
  const initialCandidateCount = companies.find((company) => company.id === defaultCompanyId)?.candidateCount ?? 0;
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultCompanyId);
  const [title, setTitle] = useState(buildDefaultQuoteTitle(sessionTitle || "Nouvelle prestation", initialTrainingType ?? "sst_initial"));
  const [description, setDescription] = useState(
    buildDefaultQuoteDescription({
      sessionTitle: sessionTitle || "Prestation de formation",
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      location: location ?? null,
      candidateCount: initialCandidateCount
    })
  );
  const [trainingType, setTrainingType] = useState<TrainingType>(initialTrainingType ?? "sst_initial");
  const trainingDefaults = getTrainingProgramDefaults(trainingType);
  const [durationHours, setDurationHours] = useState(String(trainingDefaults.durationHours));
  const [prerequisites, setPrerequisites] = useState(trainingDefaults.prerequisites);
  const [objectives, setObjectives] = useState(trainingDefaults.objectives.join("\n"));
  const [programmeOutline, setProgrammeOutline] = useState(trainingDefaults.programmeLines.join("\n"));
  const [accessibilityDetails, setAccessibilityDetails] = useState(trainingDefaults.accessibility);
  const [candidateCount, setCandidateCount] = useState(String(initialCandidateCount));
  const [priceHt, setPriceHt] = useState("");
  const [vatRate, setVatRate] = useState("20");
  const [notes, setNotes] = useState("");
  const [macPreviousCertificateDate, setMacPreviousCertificateDate] = useState("");
  const [macPreviousCertificateRef, setMacPreviousCertificateRef] = useState("");
  const [sessionStartDate, setSessionStartDate] = useState(startDate ?? "");
  const [sessionEndDate, setSessionEndDate] = useState(endDate ?? "");
  const [trainingLocation, setTrainingLocation] = useState(location ?? "");
  const [sessionFormat, setSessionFormat] = useState("intra");

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state.success]);

  useEffect(() => {
    setDurationHours(String(trainingDefaults.durationHours));
    setPrerequisites(trainingDefaults.prerequisites);
    setObjectives(trainingDefaults.objectives.join("\n"));
    setProgrammeOutline(trainingDefaults.programmeLines.join("\n"));
    setAccessibilityDetails(trainingDefaults.accessibility);
  }, [trainingDefaults]);

  const totalTtc = computeQuoteTotalTtc(Number(priceHt || 0), Number(vatRate || 0));

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const nextCount = companies.find((company) => company.id === companyId)?.candidateCount ?? 0;
    setCandidateCount(String(nextCount));
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Devis</p>
          <p className="mt-1 text-sm text-ink/65">{trainingNeedsAnalysisId ? "Devis préparé à partir de l’analyse des besoins finalisée." : "Créer un devis PDF lié à une société, avec ou sans session."}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIsOpen((open) => !open)}>
          {isOpen ? "Masquer le formulaire" : "Créer un devis"}
        </Button>
      </div>

      {isOpen ? (
        companies.length ? (
          <form action={formAction} className="grid gap-4 rounded-[24px] border border-ink/10 bg-canvas/60 p-4 md:grid-cols-2">
            <input type="hidden" name="sessionId" value={sessionId ?? ""} />
            <input type="hidden" name="trainingNeedsAnalysisId" value={trainingNeedsAnalysisId ?? ""} />

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
              <span>Société</span>
              <select
                name="companyId"
                value={selectedCompanyId}
                onChange={(event) => handleCompanyChange(event.target.value)}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
                required
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </label>

            {sessionTitle ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
                <span>Session</span>
                <input
                  value={sessionTitle}
                  disabled
                  className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm disabled:text-ink"
                />
              </label>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/10 bg-white px-4 py-3 text-sm text-ink/65">
                Devis sans session planifiée
              </div>
            )}

            <Input
              label="Nombre de candidats"
              name="candidateCount"
              type="number"
              min="0"
              step="1"
              value={candidateCount}
              onChange={(event) => setCandidateCount(event.target.value)}
              required
            />

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
              <span>Type de formation</span>
              <select
                name="trainingType"
                value={trainingType}
                onChange={(event) => {
                  const nextTrainingType = event.target.value as TrainingType;
                  setTrainingType(nextTrainingType);
                  setTitle((currentTitle) => getTrainingDocumentTitle(nextTrainingType, currentTitle));
                }}
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
              label="Durée (heures)"
              name="durationHours"
              type="number"
              min="1"
              step="0.5"
              value={durationHours}
              onChange={(event) => setDurationHours(event.target.value)}
            />

            <Input
              label="Date de début de formation"
              name="sessionStartDate"
              type="date"
              value={sessionStartDate}
              onChange={(event) => setSessionStartDate(event.target.value)}
              disabled={Boolean(sessionId)}
            />
            <Input
              label="Date de fin de formation"
              name="sessionEndDate"
              type="date"
              value={sessionEndDate}
              onChange={(event) => setSessionEndDate(event.target.value)}
              disabled={Boolean(sessionId)}
            />
            <Input
              label="Lieu de formation"
              name="location"
              value={trainingLocation}
              onChange={(event) => setTrainingLocation(event.target.value)}
              disabled={Boolean(sessionId)}
              placeholder="À confirmer"
            />
            <SelectField
              label="Format de la session"
              name="sessionFormat"
              value={sessionFormat}
              onChange={(event) => setSessionFormat(event.target.value)}
              disabled={Boolean(sessionId)}
              hint="Seules les sessions interentreprises sont affichées dans le planning public."
            >
              <option value="intra">Intra-entreprise — non publiée</option>
              <option value="inter">Interentreprises — planning public</option>
            </SelectField>
            {trainers.length ? (
              <SelectField
                label="Formateur"
                name="trainerId"
                defaultValue={getDefaultTrainerId(trainers)}
                disabled={Boolean(sessionId)}
              >
                <option value="">À confirmer</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.first_name} {trainer.last_name}
                  </option>
                ))}
              </SelectField>
            ) : (
              <SelectField label="Formateur" name="trainerId" disabled hint="Aucun formateur enregistré.">
                <option value="">À confirmer</option>
              </SelectField>
            )}

            <div className="md:col-span-2">
              <Input label="Intitulé" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Description</span>
              <textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Prérequis</span>
              <textarea
                name="prerequisites"
                rows={2}
                value={prerequisites}
                onChange={(event) => setPrerequisites(event.target.value)}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Objectifs</span>
              <textarea
                name="objectives"
                rows={3}
                value={objectives}
                onChange={(event) => setObjectives(event.target.value)}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Programme</span>
              <textarea
                name="programmeOutline"
                rows={4}
                value={programmeOutline}
                onChange={(event) => setProgrammeOutline(event.target.value)}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Accessibilité / adaptation</span>
              <textarea
                name="accessibilityDetails"
                rows={2}
                value={accessibilityDetails}
                onChange={(event) => setAccessibilityDetails(event.target.value)}
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
              placeholder="1200"
              value={priceHt}
              onChange={(event) => setPriceHt(event.target.value)}
              required
            />

            <Input
              label="Taux de TVA"
              name="vatRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="20"
              value={vatRate}
              onChange={(event) => setVatRate(event.target.value)}
              required
            />

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Notes</span>
              <textarea
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
              />
            </label>

            <div className="rounded-2xl border border-pine/15 bg-white px-4 py-3 md:col-span-2">
              <p className="text-sm font-semibold text-ink">Total TTC estimé</p>
              <p className="mt-1 text-xl font-bold text-pine">{formatCurrency(totalTtc)}</p>
            </div>

            {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
            {state.success ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-pine md:col-span-2">
                <p>{state.success}</p>
                {state.fileUrl ? (
                  <Link href={state.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
                    Ouvrir le PDF
                  </Link>
                ) : null}
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Génération..." : "Générer le devis PDF"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4 text-sm text-ink/65">
            Aucune société cliente n’est disponible pour créer un devis.
          </div>
        )
      ) : null}
    </div>
  );
}
