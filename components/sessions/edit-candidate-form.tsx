"use client";

import { useActionState, useState } from "react";
import { updateCandidateAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanyOption, SessionCandidate } from "@/lib/types";

const initialState: ActionState = {};

export function EditCandidateForm({
  candidateSession,
  companies
}: {
  candidateSession: SessionCandidate;
  companies: CompanyOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateCandidateAction, initialState);
  const { candidate } = candidateSession;

  return (
    <div className="grid gap-2">
      <Button type="button" variant="ghost" onClick={() => setIsOpen((open) => !open)} disabled={pending}>
        {isOpen ? "Fermer l’édition" : "Modifier"}
      </Button>

      {isOpen ? (
        <form action={formAction} className="grid gap-4 rounded-[24px] border border-ink/10 bg-canvas/60 p-4 md:grid-cols-2">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <input type="hidden" name="sessionId" value={candidateSession.session_id} />
          <Input label="Prénom" name="firstName" defaultValue={candidate.first_name} required />
          <Input label="Nom" name="lastName" defaultValue={candidate.last_name} required />
          <Input label="Email" name="email" type="email" defaultValue={candidate.email ?? ""} />
          <Input label="Téléphone" name="phone" defaultValue={candidate.phone ?? ""} />
          <Input label="Fonction" name="jobTitle" defaultValue={candidate.job_title ?? ""} />
          <Input label="Société (texte libre)" name="company" defaultValue={candidate.company ?? ""} />
          <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
            <span>Société cliente</span>
            <select
              name="companyId"
              defaultValue={candidate.company_id ?? ""}
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
            <Input label="Adresse" name="address" defaultValue={candidate.address ?? ""} />
          </div>
          <Input label="Code postal" name="postalCode" defaultValue={candidate.postal_code ?? ""} />
          <Input label="Ville" name="city" defaultValue={candidate.city ?? ""} />
          <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
            <span>Statut de validation</span>
            <select
              name="validationStatus"
              defaultValue={candidate.validation_status}
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
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
