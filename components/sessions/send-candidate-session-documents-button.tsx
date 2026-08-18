"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  prepareCandidatePreTrainingDocumentsAction,
  sendCandidateSessionDocumentsEmailAction,
  type ActionState
} from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { getGeneratedDocumentLabel } from "@/lib/document-labels";
import type { TrainingType } from "@/lib/database.types";
import { getRequiredPreTrainingDocumentTypes } from "@/lib/pre-training-documents";
import type { GeneratedDocumentItem } from "@/lib/types";

const initialState: ActionState = {};

export function SendCandidateSessionDocumentsButton({
  candidateId,
  sessionId,
  candidateName,
  candidateEmail,
  documents,
  trainingType,
  disabled
}: {
  candidateId: string;
  sessionId: string;
  candidateName: string;
  candidateEmail: string | null;
  documents: GeneratedDocumentItem[];
  trainingType: TrainingType;
  disabled?: boolean;
}) {
  const [sendState, sendFormAction, sendPending] = useActionState(
    sendCandidateSessionDocumentsEmailAction,
    initialState
  );
  const [prepareState, prepareFormAction, preparePending] = useActionState(
    prepareCandidatePreTrainingDocumentsAction,
    initialState
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const requiredTypes = getRequiredPreTrainingDocumentTypes(trainingType);
  const availableTypes = new Set(documents.map((document) => document.document_type));
  const preparedCount = requiredTypes.filter((type) => availableTypes.has(type)).length;
  const documentLabels = requiredTypes.map((type) => getGeneratedDocumentLabel(type));

  return (
    <div className="flex flex-col items-end gap-1">
      {isConfirming ? (
        <div className="grid max-w-sm gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-left shadow-sm">
          <div className="text-sm text-ink/70">
            <p className="font-semibold text-ink">Documents avant formation</p>
            <p className="mt-1">Candidat : {candidateName}</p>
            <p className="mt-1">Documents : {documentLabels.join(", ")}</p>
            {preparedCount < requiredTypes.length ? (
              <p className="mt-2 text-ink/55">
                {preparedCount}/{requiredTypes.length} pièce(s) prête(s). Les pièces manquantes seront ajoutées au dossier.
              </p>
            ) : (
              <p className="mt-2 font-semibold text-pine">Dossier complet : {preparedCount}/{requiredTypes.length}</p>
            )}
            {!candidateEmail ? <p className="mt-2 text-accent">Ajoutez un email au candidat pour activer l'envoi.</p> : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirming(false)}
              disabled={preparePending || sendPending}
            >
              Annuler
            </Button>
            <form action={prepareFormAction}>
              <input type="hidden" name="candidateId" value={candidateId} />
              <input type="hidden" name="sessionId" value={sessionId} />
              <Button type="submit" variant="secondary" disabled={disabled || preparePending || preparedCount === requiredTypes.length}>
                {preparePending ? "Préparation..." : preparedCount === requiredTypes.length ? "Dossier prêt" : "Préparer les documents"}
              </Button>
            </form>
            <form action={sendFormAction}>
              <input type="hidden" name="candidateId" value={candidateId} />
              <input type="hidden" name="sessionId" value={sessionId} />
              <Button type="submit" disabled={disabled || sendPending || !candidateEmail}>
                {sendPending ? "Préparation et envoi..." : "Envoyer par email"}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || preparePending || sendPending}
          onClick={() => setIsConfirming(true)}
        >
          Documents avant formation
        </Button>
      )}

      {prepareState.error ? <p className="max-w-[240px] text-right text-sm text-accent">{prepareState.error}</p> : null}
      {prepareState.success ? <p className="max-w-[240px] text-right text-sm text-pine">{prepareState.success}</p> : null}
      {sendState.error ? <p className="max-w-[240px] text-right text-sm text-accent">{sendState.error}</p> : null}
      {sendState.success ? (
        <div className="flex flex-col items-end gap-1 text-sm text-pine">
          <p className="max-w-[240px] text-right">{sendState.success}</p>
          {sendState.fileUrl ? (
            <Link href={sendState.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
              Ouvrir un document
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
