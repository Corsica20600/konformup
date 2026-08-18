"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { updateSessionAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_OPTIONS,
  getTrainingProgramDefaults,
  isMacSstTraining
} from "@/lib/training-programs";
import type { SessionItem, TrainerOption } from "@/lib/types";
import type { TrainingType } from "@/lib/database.types";
import { getAssignedTrainerFallback } from "@/lib/session-form";

const initialState: ActionState = {};

export function EditSessionForm({
  session,
  trainers
}: {
  session: SessionItem;
  trainers: TrainerOption[];
}) {
  const [state, formAction, pending] = useActionState(updateSessionAction, initialState);
  const [trainingType, setTrainingType] = useState<TrainingType>(session.training_type);
  const [trainerId, setTrainerId] = useState(session.trainer_id ?? "");
  const [status, setStatus] = useState<SessionItem["status"]>(session.status);
  const [macPreviousCertificateDate, setMacPreviousCertificateDate] = useState(
    session.mac_previous_certificate_date ?? ""
  );
  const [macPreviousCertificateRef, setMacPreviousCertificateRef] = useState(
    session.mac_previous_certificate_ref ?? ""
  );
  const trainingDefaults = getTrainingProgramDefaults(trainingType);
  const assignedTrainerFallback = getAssignedTrainerFallback(
    session.trainer_id,
    session.trainer_name,
    trainers
  );

  useEffect(() => {
    setTrainerId(session.trainer_id ?? "");
    setStatus(session.status);
  }, [session.status, session.trainer_id]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Session</p>
          <h2 className="mt-2 text-3xl font-bold">{session.title}</h2>
          <p className="mt-2 text-sm text-ink/65">Modifie les informations principales de la session.</p>
        </div>
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
        >
          Retour a la session
        </Link>
      </div>

      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="sessionId" value={session.id} />

        <div className="md:col-span-2">
          <Input label="Titre de session" name="title" defaultValue={session.title} required />
        </div>
        <Input label="Date de debut" name="startDate" type="date" defaultValue={session.start_date} required />
        <Input label="Date de fin" name="endDate" type="date" defaultValue={session.end_date} required />
        <div className="md:col-span-2">
          <Input label="Lieu" name="location" defaultValue={session.location} required />
        </div>
        <Input
          label="Duree (heures)"
          name="durationHours"
          type="number"
          min="1"
          step="0.5"
          defaultValue={session.duration_hours ? String(session.duration_hours) : ""}
        />
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
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Formateur</span>
          <select
            name="trainerId"
            value={trainerId}
            onChange={(event) => setTrainerId(event.target.value)}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <option value="">Aucun formateur selectionne</option>
            {assignedTrainerFallback ? (
              <option value={assignedTrainerFallback.id}>{assignedTrainerFallback.label}</option>
            ) : null}
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.first_name} {trainer.last_name}
                {trainer.email ? ` - ${trainer.email}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Prérequis</span>
          <textarea
            name="prerequisites"
            rows={2}
            defaultValue={session.prerequisites ?? trainingDefaults.prerequisites}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Objectifs</span>
          <textarea
            name="objectives"
            rows={3}
            defaultValue={session.objectives ?? trainingDefaults.objectives.join("\n")}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Programme</span>
          <textarea
            name="programmeOutline"
            rows={4}
            defaultValue={session.programme_outline ?? trainingDefaults.programmeLines.join("\n")}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Accessibilité / adaptation</span>
          <textarea
            name="accessibilityDetails"
            rows={2}
            defaultValue={session.accessibility_details ?? trainingDefaults.accessibility}
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
            value={status}
            onChange={(event) => setStatus(event.target.value as SessionItem["status"])}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <option value="draft">Brouillon</option>
            <option value="scheduled">Planifiee</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminee</option>
            <option value="cancelled">Annulee</option>
          </select>
        </label>

        {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}

        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
