"use client";

import { useActionState } from "react";
import { createSessionAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionState = {};

export function CreateSessionForm() {
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);

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
      <Input label="Durée (heures)" name="durationHours" type="number" min="1" step="0.5" placeholder="14" />
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
