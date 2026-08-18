"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CandidateEvaluationForm } from "@/components/sessions/candidate-evaluation-form";
import { GenerateDocumentsMenu } from "@/components/sessions/generate-documents-menu";
import { SendCandidateSessionDocumentsButton } from "@/components/sessions/send-candidate-session-documents-button";
import { getEvaluationByType, resolveCandidateWorkflowLabel } from "@/lib/evaluations";
import type { TrainingType } from "@/lib/database.types";
import type { GeneratedDocumentItem, SessionCandidate } from "@/lib/types";
import { initials } from "@/lib/utils";
import { deduplicateCandidateDocuments } from "@/lib/pre-training-documents";

const validationLabel = {
  pending: "En attente",
  validated: "Valide",
  not_validated: "Non valide"
} as const;

export function SessionCandidateBanner({
  candidateSession,
  documents,
  trainingType
}: {
  candidateSession: SessionCandidate;
  documents: GeneratedDocumentItem[];
  trainingType: TrainingType;
}) {
  const { candidate } = candidateSession;
  const evaluation = getEvaluationByType(candidateSession.evaluations, "globale");
  const workflowLabel = resolveCandidateWorkflowLabel({
    validationStatus: candidate.validation_status,
    evaluationStatus: evaluation?.status,
    result: evaluation?.result
  });
  const visibleDocuments = deduplicateCandidateDocuments(documents);
  const sentDocumentCount = visibleDocuments.filter((document) => document.status === "sent").length;

  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pine text-sm font-bold text-white">
            {initials(candidate.first_name, candidate.last_name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-ink">
                {candidate.first_name} {candidate.last_name}
              </h3>
              <Badge tone={candidate.validation_status === "validated" ? "success" : candidate.validation_status === "pending" ? "warning" : "neutral"}>
                {validationLabel[candidate.validation_status]}
              </Badge>
              <Badge tone={evaluation?.result === "admis" ? "success" : evaluation?.result === "non_admis" || evaluation?.result === "absent" ? "neutral" : "warning"}>
                {workflowLabel}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-ink/65">
              {candidate.company || "Sans societe"}
              {candidate.email ? ` • ${candidate.email}` : ""}
              {candidate.phone ? ` • ${candidate.phone}` : ""}
            </p>
            {candidate.job_title ? <p className="mt-1 text-sm text-ink/55">{candidate.job_title}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/55">
              <span>{visibleDocuments.length} document(s) disponible(s)</span>
              {sentDocumentCount > 0 ? <Badge tone="success">{sentDocumentCount} envoyé(s)</Badge> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/candidates/${candidate.id}`}
            className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
          >
            Ouvrir le dossier
          </Link>
          <SendCandidateSessionDocumentsButton
            candidateId={candidate.id}
            sessionId={candidateSession.session_id}
            candidateName={`${candidate.first_name} ${candidate.last_name}`}
            candidateEmail={candidate.email}
            documents={visibleDocuments}
            trainingType={trainingType}
          />
          <GenerateDocumentsMenu sessionId={candidateSession.session_id} candidateId={candidate.id} />
        </div>
      </div>

      <CandidateEvaluationForm candidateSession={candidateSession} />
    </Card>
  );
}
