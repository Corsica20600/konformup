"use client";

import { useActionState, useState } from "react";
import { createCandidateAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanyOption } from "@/lib/types";

const initialState: ActionState = {};

export function CreateCandidateForm({
  sessionId,
  companies,
  defaultCompanyId = "",
  compact = false,
  existingCandidates = []
}: {
  sessionId: string;
  companies: CompanyOption[];
  defaultCompanyId?: string;
  compact?: boolean;
  existingCandidates?: Array<{ id: string; first_name: string; last_name: string; email: string | null; session: { title: string } | null }>;
}) {
  const [state, formAction, pending] = useActionState(createCandidateAction, initialState);
  const [existingCandidateId, setExistingCandidateId] = useState("");
  const reusingExistingCandidate = Boolean(existingCandidateId);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      {existingCandidates.length ? <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2"><span>Réutiliser un dossier candidat existant (facultatif)</span><select name="existingCandidateId" value={existingCandidateId} onChange={(event) => setExistingCandidateId(event.target.value)} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"><option value="">Créer une nouvelle personne et une nouvelle identité MAC</option>{existingCandidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.first_name} {candidate.last_name}{candidate.email ? ` — ${candidate.email}` : ""}{candidate.session ? ` (${candidate.session.title})` : ""}</option>)}</select><span className="font-normal text-ink/55">Le choix réutilise explicitement l’identité MAC existante ; aucun rapprochement par nom ou email n’est effectué.</span></label> : <input type="hidden" name="existingCandidateId" value="" />}
      <Input label="Prénom" name="firstName" required={!reusingExistingCandidate} />
      <Input label="Nom" name="lastName" required={!reusingExistingCandidate} />
      <Input label="Date de naissance" name="birthDate" type="date" disabled={reusingExistingCandidate} />
      <Input label="Email" name="email" type="email" />
      <Input label="Téléphone" name="phone" />
      <Input label="Fonction" name="jobTitle" />
      {!compact ? <Input label="Société" name="company" /> : null}
      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
        <span>Société cliente</span>
        <select
          name="companyId"
          defaultValue={defaultCompanyId}
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
      {!compact ? (
        <>
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
        </>
      ) : (
        <input type="hidden" name="validationStatus" value="pending" />
      )}
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
