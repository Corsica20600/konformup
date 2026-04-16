"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GenerateDocumentsMenu } from "@/components/sessions/generate-documents-menu";
import { SendCandidateSessionDocumentsButton } from "@/components/sessions/send-candidate-session-documents-button";
import type { GeneratedDocumentItem, SessionCandidate } from "@/lib/types";
import { initials } from "@/lib/utils";

const validationLabel = {
  pending: "En attente",
  validated: "Valide",
  not_validated: "Non valide"
} as const;

export function SessionCandidateBanner({
  candidateSession,
  documents
}: {
  candidateSession: SessionCandidate;
  documents: GeneratedDocumentItem[];
}) {
  const { candidate } = candidateSession;

  return (
    <Card className="flex flex-wrap items-start justify-between gap-4">
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
          </div>
          <p className="mt-2 text-sm text-ink/65">
            {candidate.company || "Sans societe"}
            {candidate.email ? ` • ${candidate.email}` : ""}
            {candidate.phone ? ` • ${candidate.phone}` : ""}
          </p>
          {candidate.job_title ? <p className="mt-1 text-sm text-ink/55">{candidate.job_title}</p> : null}
          <p className="mt-2 text-sm text-ink/55">{documents.length} document(s) disponible(s)</p>
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
          disabled={!documents.length}
        />
        <GenerateDocumentsMenu sessionId={candidateSession.session_id} candidateId={candidate.id} />
      </div>
    </Card>
  );
}
