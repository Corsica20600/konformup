"use client";

import { useActionState, useState } from "react";
import { updateCompanyAction, type CompanyActionState } from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClientCompanyRecord = {
  id: string;
  company_name: string;
  siret: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const initialState: CompanyActionState = {};

export function EditCompanyForm({ company }: { company: ClientCompanyRecord }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateCompanyAction, initialState);

  return isEditing ? (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="companyId" value={company.id} />

      <div className="md:col-span-2 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Société</p>
          <h2 className="mt-2 text-3xl font-bold">Modifier la société</h2>
        </div>
        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={pending}>
          Annuler
        </Button>
      </div>

      <div className="md:col-span-2">
        <Input label="Nom commercial" name="companyName" defaultValue={company.company_name} required />
      </div>
      <Input label="Prénom contact" name="contactFirstName" defaultValue={company.contact_first_name ?? ""} />
      <Input label="Nom contact" name="contactLastName" defaultValue={company.contact_last_name ?? ""} />
      <Input label="Email" name="contactEmail" type="email" defaultValue={company.contact_email ?? ""} />
      <Input label="Téléphone" name="contactPhone" defaultValue={company.contact_phone ?? ""} />
      <Input label="SIRET" name="siret" defaultValue={company.siret ?? ""} />
      <div className="md:col-span-2">
        <Input label="Adresse" name="address" defaultValue={company.address ?? ""} />
      </div>
      <Input label="Code postal" name="postalCode" defaultValue={company.postal_code ?? ""} />
      <Input label="Ville" name="city" defaultValue={company.city ?? ""} />
      <Input label="Pays" name="country" defaultValue={company.country ?? ""} />
      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Notes</span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={company.notes ?? ""}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine md:col-span-2">{state.success}</p> : null}

      <div className="md:col-span-2 flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={pending}>
          Annuler
        </Button>
      </div>
    </form>
  ) : (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Société</p>
          <h2 className="mt-2 text-3xl font-bold">{company.company_name}</h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
          Modifier
        </Button>
      </div>

      <div className="mt-4 space-y-2 text-sm text-ink/65">
        {company.siret ? <p>SIRET : {company.siret}</p> : null}
        <p>Adresse : {[company.address, company.postal_code, company.city, company.country].filter(Boolean).join(", ") || "Non renseignée"}</p>
        <p>
          Contact : {[company.contact_first_name, company.contact_last_name].filter(Boolean).join(" ") || "Non renseigné"}
        </p>
        <p>Email : {company.contact_email || "Non renseigné"}</p>
        <p>Téléphone : {company.contact_phone || "Non renseigné"}</p>
        {company.notes ? <p>Notes : {company.notes}</p> : null}
      </div>
    </div>
  );
}
