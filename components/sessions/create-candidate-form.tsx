"use client";

import { useActionState } from "react";
import { createCandidateAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanyOption } from "@/lib/types";

const initialState: ActionState = {};

export function CreateCandidateForm({
  sessionId,
  companies
}: {
  sessionId: string;
  companies: CompanyOption[];
}) {
  const [state, formAction, pending] = useActionState(createCandidateAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <Input label="Prénom" name="firstName" required />
      <Input label="Nom" name="lastName" required />
      <Input label="Email" name="email" type="email" />
      <Input label="Téléphone" name="phone" />
      <Input label="Fonction" name="jobTitle" />
      <Input label="Société" name="company" />
      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Société cliente</span>
        <select
          name="companyId"
          defaultValue=""
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        >
          <option value="">Aucune société rattachée</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.company_name}
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
