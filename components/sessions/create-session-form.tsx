"use client";

import { useActionState, useEffect, useState } from "react";
import { createSessionAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TrainingType } from "@/lib/database.types";
import {
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_OPTIONS,
  getTrainingProgramDefaults,
  isMacSstTraining
} from "@/lib/training-programs";

const initialState: ActionState = {};

export function CreateSessionForm() {
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);
  const [trainingType, setTrainingType] = useState<TrainingType>("sst_initial");
  const trainingDefaults = getTrainingProgramDefaults(trainingType);
  const [durationHours, setDurationHours] = useState(String(trainingDefaults.durationHours));
  const [prerequisites, setPrerequisites] = useState(trainingDefaults.prerequisites);
  const [objectives, setObjectives] = useState(trainingDefaults.objectives.join("\n"));
  const [programmeOutline, setProgrammeOutline] = useState(trainingDefaults.programmeLines.join("\n"));
  const [accessibilityDetails, setAccessibilityDetails] = useState(trainingDefaults.accessibility);
  const [macPreviousCertificateDate, setMacPreviousCertificateDate] = useState("");
  const [macPreviousCertificateRef, setMacPreviousCertificateRef] = useState("");

  useEffect(() => {
    setDurationHours(String(trainingDefaults.durationHours));
    setPrerequisites(trainingDefaults.prerequisites);
    setObjectives(trainingDefaults.objectives.join("\n"));
    setProgrammeOutline(trainingDefaults.programmeLines.join("\n"));
    setAccessibilityDetails(trainingDefaults.accessibility);
  }, [trainingDefaults]);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Input label="Titre de session" name="title" placeholder="SST initiale - Avril 2026" required />
      </div>
      <Input label="Date de début" name="startDate" type="date" required />
      <Input label="Date de fin" name="endDate" type="date" required />
      <div className="md:col-span-2">
        <Input label="Lieu" name="location" placeholder="Centre de formation - Lyon" required />
      </div>
      <Input label="Formateur" name="trainerName" placeholder="Camille Rousseau" />
      <Input
        label="Durée (heures)"
        name="durationHours"
        type="number"
        min="1"
        step="0.5"
        value={durationHours}
        onChange={(event) => setDurationHours(event.target.value)}
      />
      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
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
      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Statut</span>
        <select
          name="status"
          defaultValue="draft"
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        >
          <option value="draft">Brouillon</option>
          <option value="scheduled">Planifiée</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </label>
      {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer la session"}
        </Button>
      </div>
    </form>
  );
}
