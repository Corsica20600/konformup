"use client";

import { useActionState } from "react";
import { createCompanyAction, type CompanyActionState } from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: CompanyActionState = {};

export function CreateCompanyForm({ onCancel }: { onCancel?: () => void }) {
  const [state, formAction, pending] = useActionState(createCompanyAction, initialState);

  return (
    <form action={formAction} className="grid gap-7">
      <fieldset className="grid gap-4 border-t border-ink/10 pt-5 md:grid-cols-2">
        <legend className="mb-1 pr-4 text-base font-bold text-ink">1. Identité</legend>
        <Input label="Nom commercial" name="companyName" required />
        <Input label="Numéro SIRET" name="siret" inputMode="numeric" />
      </fieldset>

      <fieldset className="grid gap-4 border-t border-ink/10 pt-5 md:grid-cols-2">
        <legend className="mb-1 pr-4 text-base font-bold text-ink">2. Contact principal</legend>
        <Input label="Prénom du contact" name="contactFirstName" autoComplete="given-name" />
        <Input label="Nom du contact" name="contactLastName" autoComplete="family-name" />
        <Input label="Adresse email" name="contactEmail" type="email" autoComplete="email" />
        <Input label="Téléphone" name="contactPhone" type="tel" autoComplete="tel" />
      </fieldset>

      <fieldset className="grid gap-4 border-t border-ink/10 pt-5 md:grid-cols-2">
        <legend className="mb-1 pr-4 text-base font-bold text-ink">3. Adresse</legend>
        <div className="md:col-span-2">
          <Input label="Adresse postale" name="address" autoComplete="street-address" />
        </div>
        <Input label="Code postal" name="postalCode" autoComplete="postal-code" />
        <Input label="Ville" name="city" autoComplete="address-level2" />
        <Input label="Pays" name="country" autoComplete="country-name" />
      </fieldset>

      <fieldset className="grid gap-4 border-t border-ink/10 pt-5">
        <legend className="mb-1 pr-4 text-base font-bold text-ink">4. Notes</legend>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Notes internes</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Informations utiles pour le suivi de cette société"
            className="rounded-[8px] border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/15"
          />
        </label>
      </fieldset>

      {state.error ? <p className="text-sm font-medium text-accent">{state.error}</p> : null}
      {state.success ? <p className="text-sm font-medium text-pine">{state.success}</p> : null}
      <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer la société"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
