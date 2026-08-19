"use client";

import { useActionState, useState } from "react";
import { submitCompanySatisfactionAction, type CompanySatisfactionActionState } from "@/app/satisfaction-entreprise/[token]/actions";
import { Button } from "@/components/ui/button";

const initialState: CompanySatisfactionActionState = {};
const questions = [
  ["overallRating", "Satisfaction globale"],
  ["organizationRating", "Organisation et communication"],
  ["needsRating", "Adéquation de la formation à vos besoins"]
] as const;

export function CompanySatisfactionSurveyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(submitCompanySatisfactionAction, initialState);
  const [consent, setConsent] = useState(false);
  if (state.completed) return <p className="rounded-2xl bg-pine/10 p-4 text-pine">{state.success}</p>;
  return <form action={action} className="grid gap-6" aria-live="polite">
    <input type="hidden" name="token" value={token} />
    {questions.map(([name, label]) => <fieldset key={name}><legend className="font-semibold">{label}</legend><div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map((rating) => <label key={rating} className="rounded-full border border-ink/20 px-3 py-2"><input required type="radio" name={name} value={rating} /> {rating}</label>)}</div></fieldset>)}
    <label className="grid gap-2 font-semibold">Votre commentaire <textarea name="comment" maxLength={2000} className="min-h-28 rounded-xl border border-ink/20 p-3 font-normal" /></label>
    <label className="flex gap-2"><input type="hidden" name="publicationConsent" value="false" /><input type="checkbox" name="publicationConsent" value="true" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> J’accepte que mon avis soit publié sur le futur site Konform’up</label>
    {consent ? <fieldset><legend className="font-semibold">Afficher mon avis sous</legend><label><input required type="radio" name="publicIdentity" value="company_name" /> Nom de la société</label><label className="ml-3"><input type="radio" name="publicIdentity" value="first_name_initial" /> Prénom et initiale</label><label className="ml-3"><input type="radio" name="publicIdentity" value="anonymous" /> Anonyme</label></fieldset> : null}
    {state.error ? <p className="text-accent" role="alert">{state.error}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? "Envoi…" : "Envoyer mon avis"}</Button>
  </form>;
}
