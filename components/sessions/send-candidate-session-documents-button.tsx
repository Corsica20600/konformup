"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendCandidateSessionDocumentsEmailAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function SendCandidateSessionDocumentsButton({
  candidateId,
  sessionId,
  disabled
}: {
  candidateId: string;
  sessionId: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(sendCandidateSessionDocumentsEmailAction, initialState);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="candidateId" value={candidateId} />
        <input type="hidden" name="sessionId" value={sessionId} />
        <Button type="submit" variant="secondary" disabled={disabled || pending}>
          {pending ? "Envoi..." : "Envoyer tous les documents"}
        </Button>
      </form>

      {state.error ? <p className="max-w-[240px] text-right text-sm text-accent">{state.error}</p> : null}
      {state.success ? (
        <div className="flex flex-col items-end gap-1 text-sm text-pine">
          <p className="max-w-[240px] text-right">{state.success}</p>
          {state.fileUrl ? (
            <Link href={state.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir un document
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
