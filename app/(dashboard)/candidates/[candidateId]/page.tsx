import { notFound } from "next/navigation";
import Link from "next/link";
import { DocumentList } from "@/components/documents/document-list";
import { EditCandidateForm } from "@/components/sessions/edit-candidate-form";
import { GenerateDocumentsMenu } from "@/components/sessions/generate-documents-menu";
import { SendCandidateSessionDocumentsButton } from "@/components/sessions/send-candidate-session-documents-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCandidateById, getCompanyOptions } from "@/lib/queries";
import type { SessionCandidate } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const validationLabel = {
  pending: "En attente",
  validated: "Valide",
  not_validated: "Non valide"
} as const;

export default async function CandidateDetailPage({
  params
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const [candidateDashboard, companies] = await Promise.all([getCandidateById(candidateId), getCompanyOptions()]);

  if (!candidateDashboard) {
    notFound();
  }

  const { candidate, session, documents } = candidateDashboard;
  const welcomePack = documents.find((document) => document.document_type === "welcome_pack") ?? null;
  const candidateSession: SessionCandidate = {
    id: candidate.id,
    session_id: candidate.session_id ?? "",
    global_progress: 0,
    candidate
  };

  return (
    <main className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-pine text-base font-bold text-white">
              {initials(candidate.first_name, candidate.last_name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Candidat</p>
                <Badge tone={candidate.validation_status === "validated" ? "success" : candidate.validation_status === "pending" ? "warning" : "neutral"}>
                  {validationLabel[candidate.validation_status as keyof typeof validationLabel]}
                </Badge>
              </div>
              <h1 className="mt-2 text-3xl font-bold">
                {candidate.first_name} {candidate.last_name}
              </h1>
              <p className="mt-3 text-sm text-ink/65">
                {candidate.company || "Sans societe"}
                {candidate.email ? ` • ${candidate.email}` : ""}
                {candidate.phone ? ` • ${candidate.phone}` : ""}
              </p>
              {candidate.job_title ? <p className="mt-1 text-sm text-ink/55">Fonction : {candidate.job_title}</p> : null}
              {session ? (
                <p className="mt-2 text-sm text-ink/55">
                  Session :{" "}
                  <Link href={`/sessions/${session.id}`} className="font-semibold text-ink">
                    {session.title}
                  </Link>
                  {` • ${formatDate(session.start_date)}`}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {session ? (
              <>
                {welcomePack?.file_url ? (
                  <>
                    <Link
                      href={welcomePack.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
                    >
                      Voir livret
                    </Link>
                    <Link
                      href={`/api/documents/generated/${welcomePack.id}?download=1`}
                      className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
                    >
                      Télécharger
                    </Link>
                  </>
                ) : null}
                <SendCandidateSessionDocumentsButton
                  candidateId={candidate.id}
                  sessionId={session.id}
                  disabled={!documents.length}
                />
                <GenerateDocumentsMenu sessionId={session.id} candidateId={candidate.id} />
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <section className="grid gap-4">
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Dossier</p>
            <h2 className="mt-2 text-2xl font-bold">Informations principales</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
                <p className="text-sm font-semibold text-ink">Societe</p>
                <p className="mt-2 text-base font-semibold text-ink">{candidate.company || "Non renseignee"}</p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
                <p className="text-sm font-semibold text-ink">Session</p>
                <p className="mt-2 text-base font-semibold text-ink">{session?.title || "Aucune session"}</p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
                <p className="text-sm font-semibold text-ink">Documents</p>
                <p className="mt-2 text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Edition</p>
            <h2 className="mt-2 text-2xl font-bold">Modifier le candidat</h2>
            <div className="mt-6">
              <EditCandidateForm candidateSession={candidateSession} companies={companies} />
            </div>
          </Card>
        </section>

        <Card>
          <DocumentList
            title="Documents du candidat"
            documents={documents}
            emptyMessage="Aucun document n’est encore enregistré pour ce candidat."
          />
        </Card>
      </section>
    </main>
  );
}
