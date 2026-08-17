"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendCandidateSessionDocumentsEmailAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { getGeneratedDocumentLabel } from "@/lib/document-labels";
import type { GeneratedDocumentItem } from "@/lib/types";

const initialState: ActionState = {};

export function SendCandidateSessionDocumentsButton({
  candidateId,
  sessionId,
  candidateName,
  candidateEmail,
  documents,
  disabled
}: {
  candidateId: string;
  sessionId: string;
  candidateName: string;
  candidateEmail: string | null;
  documents: GeneratedDocumentItem[];
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(sendCandidateSessionDocumentsEmailAction, initialState);
  const [isConfirming, setIsConfirming] = useState(false);
  const documentLabels = Array.from(new Set(documents.map((document) => getGeneratedDocumentLabel(document.document_type))));

  return (
    <div className="flex flex-col items-end gap-1">
      {isConfirming ? (
        <form action={formAction} className="grid max-w-sm gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-left shadow-sm">
          <input type="hidden" name="candidateId" value={candidateId} />
          <input type="hidden" name="sessionId" value={sessionId} />
          <div className="text-sm text-ink/70">
            <p className="font-semibold text-ink">Confirmer l'envoi des documents</p>
            <p className="mt-1">Destinataire : {candidateName} ({candidateEmail || "email manquant"})</p>
            <p className="mt-1">Documents : {documentLabels.join(", ") || "aucun"}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsConfirming(false)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={disabled || pending || !candidateEmail}>
              {pending ? "Envoi..." : "Confirmer l'envoi"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || pending || !candidateEmail}
          onClick={() => setIsConfirming(true)}
        >
          Préparer l'envoi
        </Button>
      )}

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
