"use client";

import { useActionState } from "react";
import {
  createCompanyCandidateAction,
  type CompanyCandidateActionState
} from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SessionOption = {
  id: string;
  title: string;
  start_date: string;
};

const initialState: CompanyCandidateActionState = {};

export function CreateCompanyCandidateForm({
  companyId,
  sessions
}: {
  companyId: string;
  sessions: SessionOption[];
}) {
  const [state, formAction, pending] = useActionState(createCompanyCandidateAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="companyId" value={companyId} />

      <Input label="Prénom" name="firstName" required />
      <Input label="Nom" name="lastName" required />
      <Input label="Email" name="email" type="email" />
      <Input label="Téléphone" name="phone" />
      <Input label="Fonction" name="jobTitle" />

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Session facultative</span>
        <select
          name="sessionId"
          defaultValue=""
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        >
          <option value="">Aucune session pour le moment</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title} - {session.start_date}
            </option>
          ))}
        </select>
      </label>

      <div className="md:col-span-2">
        <Input label="Adresse" name="address" />
      </div>
      <Input label="Code postal" name="postalCode" />
      <Input label="Ville" name="city" />

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Statut de validation</span>
        <select
          name="validationStatus"
          defaultValue="pending"
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        >
          <option value="pending">En attente</option>
          <option value="validated">Validé</option>
          <option value="not_validated">Non validé</option>
        </select>
      </label>

      {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Ajout..." : "Ajouter le candidat"}
        </Button>
      </div>
    </form>
  );
}
