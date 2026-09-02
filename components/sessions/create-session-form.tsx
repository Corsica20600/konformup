"use client";

import { useActionState, useRef, useState } from "react";
import { createSessionAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import type { TrainingType } from "@/lib/database.types";
import { getDefaultSessionTitle, getDefaultTrainerId } from "@/lib/session-form";
import {
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_OPTIONS,
  getTrainingProgramDefaults,
  isMacSstTraining
} from "@/lib/training-programs";
import type { TrainerOption } from "@/lib/types";

const initialState: ActionState = {};

export function CreateSessionForm({ trainers }: { trainers: TrainerOption[] }) {
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);
  const [trainingType, setTrainingType] = useState<TrainingType>("sst_initial");
  const trainingDefaults = getTrainingProgramDefaults(trainingType);
  const [title, setTitle] = useState(getDefaultSessionTitle("sst_initial"));
  const [durationHours, setDurationHours] = useState(String(trainingDefaults.durationHours));
  const [prerequisites, setPrerequisites] = useState(trainingDefaults.prerequisites);
  const [objectives, setObjectives] = useState(trainingDefaults.objectives.join("\n"));
  const [programmeOutline, setProgrammeOutline] = useState(trainingDefaults.programmeLines.join("\n"));
  const [accessibilityDetails, setAccessibilityDetails] = useState(trainingDefaults.accessibility);
  const [macPreviousCertificateDate, setMacPreviousCertificateDate] = useState("");
  const [macPreviousCertificateRef, setMacPreviousCertificateRef] = useState("");
  const customized = useRef({
    title: false,
    duration: false,
    prerequisites: false,
    objectives: false,
    programme: false,
    accessibility: false
  });

  const handleTrainingTypeChange = (nextTrainingType: TrainingType) => {
    const nextDefaults = getTrainingProgramDefaults(nextTrainingType);
    setTrainingType(nextTrainingType);

    if (!customized.current.title) setTitle(getDefaultSessionTitle(nextTrainingType));
    if (!customized.current.duration) setDurationHours(String(nextDefaults.durationHours));
    if (!customized.current.prerequisites) setPrerequisites(nextDefaults.prerequisites);
    if (!customized.current.objectives) setObjectives(nextDefaults.objectives.join("\n"));
    if (!customized.current.programme) setProgrammeOutline(nextDefaults.programmeLines.join("\n"));
    if (!customized.current.accessibility) setAccessibilityDetails(nextDefaults.accessibility);
  };

  return (
    <form action={formAction} className="grid gap-8">
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-4 w-full border-b border-ink/10 pb-3 text-base font-bold">1. Informations principales</legend>
        <div className="md:col-span-2">
          <Input
            label="Titre de session"
            name="title"
            value={title}
            onChange={(event) => {
              customized.current.title = true;
              setTitle(event.target.value);
            }}
            required
          />
        </div>
        <SelectField label="Type de formation" name="trainingType" value={trainingType} onChange={(event) => handleTrainingTypeChange(event.target.value as TrainingType)}>
          {TRAINING_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{TRAINING_TYPE_LABELS[option]}</option>)}
        </SelectField>
        <SelectField label="Format de la session" name="sessionFormat" defaultValue="intra" hint="Seules les sessions interentreprises sont publiées dans le planning.">
          <option value="intra">Intra-entreprise — non publiée</option>
          <option value="inter">Interentreprises — planning public</option>
        </SelectField>
        <Input label="Date de début" name="startDate" type="date" required />
        <Input label="Date de fin" name="endDate" type="date" required />
        <div className="md:col-span-2">
          <Input label="Lieu" name="location" placeholder="Centre de formation, entreprise cliente..." required />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 border-t border-ink/10 pt-6 md:grid-cols-3">
        <legend className="mb-4 w-full pb-3 text-base font-bold">2. Organisation</legend>
        {trainers.length ? (
          <SelectField label="Formateur" name="trainerId" defaultValue={getDefaultTrainerId(trainers)} hint="Le premier formateur est proposé automatiquement.">
            {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.first_name} {trainer.last_name}</option>)}
          </SelectField>
        ) : (
          <>
            <input type="hidden" name="trainerId" value="" />
            <SelectField label="Formateur" disabled hint="Ajoutez d'abord un formateur depuis la page Formateurs.">
              <option>Aucun formateur enregistré</option>
            </SelectField>
          </>
        )}
        <Input
          label="Durée (heures)"
          name="durationHours"
          type="number"
          min="1"
          step="0.5"
          value={durationHours}
          onChange={(event) => {
            customized.current.duration = true;
            setDurationHours(event.target.value);
          }}
        />
        <SelectField label="Statut" name="status" defaultValue="draft">
          <option value="draft">Brouillon</option>
          <option value="scheduled">Planifiée</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </SelectField>
        {isMacSstTraining(trainingType) ? (
          <>
            <Input label="Date certificat SST précédent" name="macPreviousCertificateDate" type="date" value={macPreviousCertificateDate} onChange={(event) => setMacPreviousCertificateDate(event.target.value)} />
            <Input label="Référence certificat précédent" name="macPreviousCertificateRef" value={macPreviousCertificateRef} onChange={(event) => setMacPreviousCertificateRef(event.target.value)} />
          </>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-4 border-t border-ink/10 pt-6 md:grid-cols-2">
        <legend className="mb-4 w-full pb-3 text-base font-bold">3. Programme</legend>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Prérequis</span>
          <textarea name="prerequisites" rows={2} value={prerequisites} onChange={(event) => { customized.current.prerequisites = true; setPrerequisites(event.target.value); }} className="rounded-[8px] border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine focus:ring-2 focus:ring-pine/10" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Objectifs</span>
          <textarea name="objectives" rows={3} value={objectives} onChange={(event) => { customized.current.objectives = true; setObjectives(event.target.value); }} className="rounded-[8px] border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine focus:ring-2 focus:ring-pine/10" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Programme</span>
          <textarea name="programmeOutline" rows={5} value={programmeOutline} onChange={(event) => { customized.current.programme = true; setProgrammeOutline(event.target.value); }} className="rounded-[8px] border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine focus:ring-2 focus:ring-pine/10" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Accessibilité / adaptation</span>
          <textarea name="accessibilityDetails" rows={2} value={accessibilityDetails} onChange={(event) => { customized.current.accessibility = true; setAccessibilityDetails(event.target.value); }} className="rounded-[8px] border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine focus:ring-2 focus:ring-pine/10" />
        </label>
      </fieldset>

      {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}
      <div className="flex justify-end border-t border-ink/10 pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer la session"}
        </Button>
      </div>
    </form>
  );
}
