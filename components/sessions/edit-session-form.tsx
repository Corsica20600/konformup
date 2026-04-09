"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateSessionAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionItem, TrainerOption } from "@/lib/types";

const initialState: ActionState = {};

export function EditSessionForm({
  session,
  trainers
}: {
  session: SessionItem;
  trainers: TrainerOption[];
}) {
  const [state, formAction, pending] = useActionState(updateSessionAction, initialState);

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
          <span>Formateur</span>
          <select
            name="trainerId"
            defaultValue={session.trainer_id ?? ""}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <option value="">Aucun formateur selectionne</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.first_name} {trainer.last_name}
                {trainer.email ? ` - ${trainer.email}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
          <span>Statut</span>
          <select
            name="status"
            defaultValue={session.status}
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
