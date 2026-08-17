"use client";

import { useActionState } from "react";
import { upsertCandidateEvaluationAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import {
  EVALUATION_RESULT_LABELS,
  EVALUATION_STATUS_LABELS,
  EVALUATION_TYPE_LABELS,
  getGlobalEvaluation,
  resolveCandidateWorkflowLabel
} from "@/lib/evaluations";
import type { SessionCandidate } from "@/lib/types";

const initialState: ActionState = {};

export function CandidateEvaluationForm({ candidateSession }: { candidateSession: SessionCandidate }) {
  const [state, formAction, pending] = useActionState(upsertCandidateEvaluationAction, initialState);
  const evaluation = getGlobalEvaluation(candidateSession.evaluations);
  const workflowLabel = resolveCandidateWorkflowLabel({
    validationStatus: candidateSession.candidate.validation_status,
    evaluationStatus: evaluation?.status,
    result: evaluation?.result
  });
  const evaluatedDate = evaluation?.evaluated_at ? evaluation.evaluated_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid gap-3 rounded-[20px] border border-ink/10 bg-canvas/60 p-4">
      <input type="hidden" name="sessionId" value={candidateSession.session_id} />
      <input type="hidden" name="candidateId" value={candidateSession.candidate.id} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Evaluation</p>
          <p className="mt-1 text-sm font-semibold text-pine">{workflowLabel}</p>
        </div>
        {evaluation?.evaluated_at ? (
          <p className="text-xs text-ink/55">
            Derniere saisie : {new Intl.DateTimeFormat("fr-FR").format(new Date(evaluation.evaluated_at))}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Partie</span>
          <select
            name="evaluationType"
            defaultValue={evaluation?.evaluation_type ?? "globale"}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            {Object.entries(EVALUATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Etat</span>
          <select
            name="status"
            defaultValue={evaluation?.status ?? "non_evalue"}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            {Object.entries(EVALUATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Résultat</span>
          <select
            name="result"
            defaultValue={evaluation?.result ?? "non_renseigne"}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          >
            {Object.entries(EVALUATION_RESULT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
          <span>Date</span>
          <input
            type="date"
            name="evaluatedAt"
            defaultValue={evaluatedDate}
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
        <span>Notes formateur</span>
        <textarea
          name="trainerNotes"
          defaultValue={evaluation?.trainer_notes ?? ""}
          rows={3}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
        />
      </label>

      {state.error ? <p className="text-sm text-accent">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-pine">{state.success}</p> : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer l'évaluation"}
        </Button>
      </div>
    </form>
  );
}
