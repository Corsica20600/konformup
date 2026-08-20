import { notFound } from "next/navigation";
import Link from "next/link";
import { DocumentList } from "@/components/documents/document-list";
import { EditCandidateForm } from "@/components/sessions/edit-candidate-form";
import { GenerateDocumentsMenu } from "@/components/sessions/generate-documents-menu";
import { SendCandidateSessionDocumentsButton } from "@/components/sessions/send-candidate-session-documents-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCandidateById, getCandidateSatisfactionSurveys, getCompanyOptions } from "@/lib/queries";
import type { SessionCandidate } from "@/lib/types";
import { formatDate, initials } from "@/lib/utils";
import { deduplicateCandidateDocuments } from "@/lib/pre-training-documents";
import { getMacSstReminderStatusForCandidate } from "@/lib/mac-sst-reminders";
import { getActiveMacIdentitiesForAdmin, getMacIdentityForCandidate } from "@/lib/mac-identities";
import { requireAuthenticatedUser } from "@/lib/auth";
import { MacIdentityPanel } from "@/components/candidates/mac-identity-panel";

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
  const auth = await requireAuthenticatedUser();
  const isAdmin = auth.profile.role === "admin";
  const [candidateDashboard, companies, surveys, macStatus, macIdentity, availableIdentities] = await Promise.all([
    getCandidateById(candidateId), getCompanyOptions(), getCandidateSatisfactionSurveys(candidateId), getMacSstReminderStatusForCandidate(candidateId), getMacIdentityForCandidate(candidateId), isAdmin ? getActiveMacIdentitiesForAdmin() : Promise.resolve([])
  ]);

  if (!candidateDashboard) {
    notFound();
  }

  const { candidate, session, documents } = candidateDashboard;
  const visibleDocuments = deduplicateCandidateDocuments(documents);
  const welcomePack = visibleDocuments.find((document) => document.document_type === "welcome_pack") ?? null;
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
                  candidateName={`${candidate.first_name} ${candidate.last_name}`}
                  candidateEmail={candidate.email}
                  documents={visibleDocuments}
                  trainingType={session.training_type}
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
                <p className="mt-2 text-2xl font-bold">{visibleDocuments.length}</p>
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
            documents={visibleDocuments}
            emptyMessage="Aucun document n’est encore enregistré pour ce candidat."
          />
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Satisfaction</p>
          <h3 className="mt-2 text-2xl font-bold">Questionnaire candidat</h3>
          {surveys.length ? surveys.map((survey) => <div key={survey.id} className="mt-4 rounded-2xl border border-ink/10 bg-canvas/60 p-4 text-sm"><p className="font-semibold text-pine">Répondu le {formatDate(survey.submitted_at)}</p><p className="mt-2">Satisfaction : {survey.answers.satisfaction_globale || "Non renseignée"} · Recommandation : {survey.answers.recommandation || "—"}/10</p>{survey.answers.remarques ? <p className="mt-2 text-ink/65">{survey.answers.remarques}</p> : null}</div>) : <p className="mt-4 text-sm text-ink/65">Aucun questionnaire retourné.</p>}
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Identité MAC SST</p>
          <h3 className="mt-2 text-2xl font-bold">Suivi de la personne</h3>
          <div className="mt-4"><MacIdentityPanel candidateId={candidate.id} candidateName={`${candidate.first_name} ${candidate.last_name}`.trim()} candidateEmail={candidate.email} identity={macIdentity} availableIdentities={availableIdentities} isAdmin={isAdmin} /></div>
        </Card>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">MAC SST</p>
          <h3 className="mt-2 text-2xl font-bold">Rappels de renouvellement</h3>
          <p className="mt-2 text-sm text-ink/65">Les rappels à 22 et 23 mois sont adressés uniquement à l’email renseigné du candidat. Aucun contact société n’est substitué automatiquement.</p>
          {macStatus.error ? <p className="mt-4 text-sm text-accent">{macStatus.error}</p> : null}
          {!macStatus.error && !macStatus.reminders.length ? <p className="mt-4 text-sm text-ink/65">Aucun rappel MAC SST programmé pour ce candidat.</p> : null}
          {macStatus.reminders.map((reminder) => <div key={reminder.id} className="mt-3 rounded-2xl border border-ink/10 bg-canvas/60 p-4 text-sm"><p className="font-semibold">Échéance : {formatDate(reminder.mac_due_date)}</p><p className="mt-1 text-ink/65">Rappel {reminder.reminder_kind === "month_22" ? "22 mois" : "23 mois"} · {reminder.status === "sent" ? "Envoyé" : reminder.status === "error" ? "Erreur" : reminder.status === "pending" ? "À envoyer" : "Ignoré"}</p>{reminder.sent_at ? <p className="mt-1 text-ink/55">Envoyé le {formatDate(reminder.sent_at)}</p> : null}{reminder.technical_error ? <p className="mt-1 text-accent">Envoi à vérifier.</p> : null}</div>)}
        </Card>
      </section>
    </main>
  );
}
