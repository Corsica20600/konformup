"use client";

import { useActionState } from "react";
import { sendPreQuoteTrainingNeedsEmailAction, type InternalTrainingNeedsActionState } from "@/app/(dashboard)/training-needs/actions";
import { Button } from "@/components/ui/button";

const initialState: InternalTrainingNeedsActionState = {};

export function SendPreQuoteAnalysisButton({ analysisId, recipientEmail }: { analysisId: string; recipientEmail: string | null }) {
  const [state, formAction, pending] = useActionState(sendPreQuoteTrainingNeedsEmailAction, initialState);
  return <div className="grid gap-1"><form action={formAction}><input type="hidden" name="analysisId" value={analysisId} /><Button type="submit" disabled={pending || !recipientEmail}>{pending ? "Envoi..." : "Envoyer au client"}</Button></form>{!recipientEmail ? <p className="text-sm text-accent">Ajoutez l’email du contact de la société avant l’envoi.</p> : null}{state.error ? <p role="alert" className="text-sm text-accent">{state.error}</p> : null}{state.success ? <p role="status" className="text-sm text-pine">{state.success}</p> : null}</div>;
}
