"use client";

import { useActionState } from "react";
import { generateDocumentAction, generateMissingCandidateAttestationsAction, updateSessionClosureAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  calculateSessionClosureSummary,
  getFinalDocumentSet,
  getSessionClosureReadiness,
  getSstCertificateNotice
} from "@/lib/session-closure";
import type { SessionCandidate, SessionItem } from "@/lib/types";

const initialState: ActionState = {};

export function SessionClosurePanel({
  session,
  candidates
}: {
  session: SessionItem;
  candidates: SessionCandidate[];
}) {
  const summary = calculateSessionClosureSummary(candidates);
  const readiness = getSessionClosureReadiness(candidates);
  const documents = getFinalDocumentSet(session.training_type);
  const [closureState, closureFormAction, closurePending] = useActionState(updateSessionClosureAction, initialState);
  const [attestationState, attestationFormAction, attestationPending] = useActionState(generateMissingCandidateAttestationsAction, initialState);
  const [documentState, documentFormAction, documentPending] = useActionState(generateDocumentAction, initialState);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Clôture</p>
          <h3 className="mt-2 text-2xl font-bold">Fin de formation</h3>
          <p className="mt-2 text-sm text-ink/65">{getSstCertificateNotice(session.training_type)}</p>
        </div>
        <Badge tone={session.closure_status === "closed" || session.closure_status === "archived" ? "success" : session.closure_status === "ready" ? "warning" : "neutral"}>
          {session.closure_status === "archived" ? "Archivée" : session.closure_status === "closed" ? "Clôturée" : session.closure_status === "ready" ? "Prête" : "Ouverte"}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {[
          ["Inscrits", summary.registeredCount],
          ["Présents", summary.presentCount],
          ["Admis", summary.admittedCount],
          ["Non admis", summary.notAdmittedCount],
          ["Absents", summary.absentCount]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-ink/45">{label}</p>
            <p className="mt-2 text-2xl font-bold text-pine">{value}</p>
          </div>
        ))}
      </div>

      <form action={closureFormAction} className="grid gap-3">
        <input type="hidden" name="sessionId" value={session.id} />
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Bilan formateur</span>
          <textarea
            name="trainerReport"
            defaultValue={session.trainer_report ?? ""}
            rows={3}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
            disabled={session.closure_status === "archived"}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Observations administratives</span>
          <textarea
            name="administrativeObservations"
            defaultValue={session.administrative_observations ?? ""}
            rows={2}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
            disabled={session.closure_status === "archived"}
          />
        </label>
        {!readiness.canClose ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            Clôture impossible : {readiness.missingGlobalEvaluationCount} candidat(s) n&apos;ont pas de résultat global
            renseigné parmi admis, non admis, absent ou partiel. La session peut être marquée prête, mais pas clôturée.
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="closureStatus" value="ready" variant="secondary" disabled={closurePending || session.closure_status === "archived"}>
            Marquer prête
          </Button>
          <Button
            type="submit"
            name="closureStatus"
            value="closed"
            disabled={closurePending || !readiness.canClose || session.closure_status === "archived"}
            title={!readiness.canClose ? "Renseignez les évaluations globales manquantes avant de clôturer." : undefined}
          >
            Clôturer
          </Button>
        </div>
        {closureState.error ? <p className="text-sm text-accent">{closureState.error}</p> : null}
        {closureState.success ? <p className="text-sm text-pine">{closureState.success}</p> : null}
      </form>

      <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4">
        <p className="text-sm font-semibold text-ink">Documents finaux attendus</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {documents.map((document) => (
            <Badge key={document} tone="neutral">{document}</Badge>
          ))}
        </div>
        <form action={documentFormAction} className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="sessionId" value={session.id} />
          <Button type="submit" name="type" value="bilan_session" variant="secondary" disabled={documentPending}>
            Générer le bilan
          </Button>
        </form>
        <form action={attestationFormAction} className="mt-3">
          <input type="hidden" name="sessionId" value={session.id} />
          <Button type="submit" disabled={attestationPending}>
            {attestationPending ? "Génération des attestations..." : "Générer les attestations manquantes"}
          </Button>
        </form>
        {attestationState.error ? <p className="mt-2 text-sm text-accent">{attestationState.error}</p> : null}
        {attestationState.success ? <p className="mt-2 text-sm text-pine">{attestationState.success}</p> : null}
        {attestationState.documentResults?.length ? (
          <ul className="mt-2 text-sm text-ink/65">
            {attestationState.documentResults.map((result) => (
              <li key={result.candidateName}>{result.candidateName} : {result.status === "generated" ? "générée" : "déjà disponible"}</li>
            ))}
          </ul>
        ) : null}
        {documentState.error ? <p className="mt-2 text-sm text-accent">{documentState.error}</p> : null}
      </div>
    </div>
  );
}
