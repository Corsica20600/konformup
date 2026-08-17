"use client";

import { useActionState, useState } from "react";
import { upsertCandidateEvaluationAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import {
  EVALUATION_RESULT_LABELS,
  EVALUATION_STATUS_LABELS,
  EVALUATION_TYPE_LABELS,
  getEvaluationByType,
  resolveCandidateWorkflowLabel
} from "@/lib/evaluations";
import type { CandidateEvaluationType } from "@/lib/database.types";
import type { SessionCandidate } from "@/lib/types";

const initialState: ActionState = {};

export function CandidateEvaluationForm({ candidateSession }: { candidateSession: SessionCandidate }) {
  const [selectedType, setSelectedType] = useState<CandidateEvaluationType>("globale");
  const globalEvaluation = getEvaluationByType(candidateSession.evaluations, "globale");
  const workflowLabel = resolveCandidateWorkflowLabel({
    validationStatus: candidateSession.candidate.validation_status,
    evaluationStatus: globalEvaluation?.status,
    result: globalEvaluation?.result
  });

  return (
    <div className="grid gap-3 rounded-[20px] border border-ink/10 bg-canvas/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/45">Evaluation</p>
          <p className="mt-1 text-sm font-semibold text-pine">Resultat global : {workflowLabel}</p>
        </div>
        <p className="text-xs text-ink/55">L'evaluation globale conditionne la cloture.</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Parties de l'evaluation">
        {(["globale", "theorique", "pratique"] as const).map((type) => {
          const part = getEvaluationByType(candidateSession.evaluations, type);
          const isSelected = selectedType === type;

          return (
            <button
              key={type}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedType(type)}
              className={`min-h-16 rounded-2xl border px-4 py-3 text-left transition ${
                isSelected ? "border-pine bg-pine text-white" : "border-ink/10 bg-white text-ink hover:border-pine/40"
              }`}
            >
              <span className="block text-sm font-semibold">{EVALUATION_TYPE_LABELS[type]}</span>
              <span className={`mt-1 block text-xs ${isSelected ? "text-white/80" : "text-ink/55"}`}>
                {part && part.result !== "non_renseigne" ? EVALUATION_RESULT_LABELS[part.result] : "A renseigner"}
              </span>
            </button>
          );
        })}
      </div>

      <EvaluationPartForm
        key={selectedType}
        candidateSession={candidateSession}
        evaluationType={selectedType}
      />
    </div>
  );
}

function EvaluationPartForm({
  candidateSession,
  evaluationType
}: {
  candidateSession: SessionCandidate;
  evaluationType: CandidateEvaluationType;
}) {
  const [state, formAction, pending] = useActionState(upsertCandidateEvaluationAction, initialState);
  const evaluation = getEvaluationByType(candidateSession.evaluations, evaluationType);
  const evaluatedDate = evaluation?.evaluated_at ? evaluation.evaluated_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="sessionId" value={candidateSession.session_id} />
      <input type="hidden" name="candidateId" value={candidateSession.candidate.id} />
      <input type="hidden" name="evaluationType" value={evaluationType} />

      <div className="grid gap-3 md:grid-cols-3">
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
          {pending ? "Enregistrement..." : `Enregistrer la partie ${EVALUATION_TYPE_LABELS[evaluationType].toLowerCase()}`}
        </Button>
      </div>
    </form>
  );
}
