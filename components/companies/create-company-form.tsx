"use client";

import { useActionState } from "react";
import { createCompanyAction, type CompanyActionState } from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CompanyActionState = {};

export function CreateCompanyForm() {
  const [state, formAction, pending] = useActionState(createCompanyAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Input label="Nom commercial" name="companyName" required />
      </div>
      <Input label="Prénom contact" name="contactFirstName" />
      <Input label="Nom contact" name="contactLastName" />
      <Input label="Email" name="contactEmail" type="email" />
      <Input label="Téléphone" name="contactPhone" />
      <Input label="SIRET" name="siret" />
      <div className="md:col-span-2">
        <Input label="Adresse" name="address" />
      </div>
      <Input label="Code postal" name="postalCode" />
      <Input label="Ville" name="city" />
      <Input label="Pays" name="country" />
      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Notes</span>
        <textarea
          name="notes"
          rows={4}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>
      {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer la société"}
        </Button>
      </div>
    </form>
  );
}
