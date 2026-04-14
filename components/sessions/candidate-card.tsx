import { DocumentList } from "@/components/documents/document-list";
import type { SessionCandidate } from "@/lib/types";
import { initials } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EditCandidateForm } from "@/components/sessions/edit-candidate-form";
import { GenerateDocumentsMenu } from "@/components/sessions/generate-documents-menu";
import { SendCandidateSessionDocumentsButton } from "@/components/sessions/send-candidate-session-documents-button";
import type { CompanyOption, GeneratedDocumentItem } from "@/lib/types";

const validationLabel = {
  pending: "En attente",
  validated: "Validé",
  not_validated: "Non validé"
} as const;

export function CandidateCard({
  candidateSession,
  companies,
  documents
}: {
  candidateSession: SessionCandidate;
  companies: CompanyOption[];
  documents: GeneratedDocumentItem[];
}) {
  const { candidate } = candidateSession;

  return (
    <Card className="grid gap-4">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pine text-sm font-bold text-white">
          {initials(candidate.first_name, candidate.last_name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold">
            {candidate.first_name} {candidate.last_name}
          </h3>
          <p className="mt-2 text-sm text-ink/65">
            {candidate.company || "Société non renseignée"}
            {candidate.email ? ` • ${candidate.email}` : ""}
          </p>
          {candidate.phone ? <p className="mt-1 text-sm text-ink/55">{candidate.phone}</p> : null}
          <p className="mt-2 text-sm font-medium text-pine">
            Statut de validation : {validationLabel[candidate.validation_status]}
          </p>
          {candidate.job_title ? <p className="mt-1 text-sm text-ink/55">Fonction : {candidate.job_title}</p> : null}
          {candidate.address || candidate.city || candidate.postal_code ? (
            <p className="mt-1 text-sm text-ink/55">
              {[candidate.address, candidate.postal_code, candidate.city].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SendCandidateSessionDocumentsButton
            candidateId={candidateSession.candidate.id}
            sessionId={candidateSession.session_id}
            disabled={!documents.length}
          />
          <GenerateDocumentsMenu
            sessionId={candidateSession.session_id}
            candidateId={candidateSession.candidate.id}
          />
        </div>
      </div>
      <EditCandidateForm candidateSession={candidateSession} companies={companies} />
      <DocumentList
        title="Documents du candidat"
        documents={documents}
        emptyMessage="Aucun document n’est encore enregistré pour ce candidat."
      />
    </Card>
  );
}
