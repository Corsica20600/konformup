"use client";

import { useActionState } from "react";
import { prefillSessionCandidatesFromQuoteAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function PrefillCompanyCandidatesForm({
  sessionId,
  candidateCount,
  companyName
}: {
  sessionId: string;
  candidateCount: number;
  companyName: string;
}) {
  const [state, formAction, pending] = useActionState(prefillSessionCandidatesFromQuoteAction, initialState);

  return (
    <div className="grid gap-3">
      <form action={formAction}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Pre-remplissage..." : `Pre-remplir avec ${candidateCount} candidat(s) de ${companyName}`}
        </Button>
      </form>
      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine">{state.success}</p> : null}
    </div>
  );
}
