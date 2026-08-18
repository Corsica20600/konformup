import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrefillCompanyCandidatesForm } from "@/components/sessions/prefill-company-candidates-form";
import { DocumentList } from "@/components/documents/document-list";
import { AttendancePanel } from "@/components/sessions/attendance-panel";
import { ModuleContent } from "@/components/sessions/module-content";
import { SessionModuleList } from "@/components/sessions/session-module-list";
import { SessionProgressCard } from "@/components/sessions/session-progress-card";
import { SessionCandidateBanner } from "@/components/sessions/session-candidate-banner";
import { SessionClosurePanel } from "@/components/sessions/session-closure-panel";
import { CreateCandidateForm } from "@/components/sessions/create-candidate-form";
import { getOrCreateDocument } from "@/lib/generated-documents";
import {
  getDocumentsBySessionId,
  getCompanyOptions,
  getSessionById,
  getTrainingQuizzesByModuleId,
  RecoverableSessionQueryError,
  SessionNotFoundError
} from "@/lib/queries";
import { getTrainingTypeLabel } from "@/lib/training-programs";
import { getSessionNextAction } from "@/lib/session-next-action";
import { buildSessionModuleGroups, resolveDefaultSelectedModule } from "@/lib/formation-navigation";
import type { SessionCandidate, TrainingQuiz } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Session"
};

const statusLabel = {
  draft: "Brouillon",
  scheduled: "Planifiée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée"
} as const;

type SessionCompanyGroup = {
  companyId: string | null;
  companyName: string;
  candidates: SessionCandidate[];
};

function buildSessionCompanyGroups(candidates: SessionCandidate[]): SessionCompanyGroup[] {
  const groups = new Map<string, SessionCompanyGroup>();

  candidates.forEach((candidateSession) => {
    const companyId = candidateSession.candidate.company_id;
    const companyName = candidateSession.candidate.company?.trim() || "Sans société";
    const key = companyId ?? `unassigned:${companyName.toLowerCase()}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.candidates.push(candidateSession);
      return;
    }

    groups.set(key, {
      companyId,
      companyName,
      candidates: [candidateSession]
    });
  });

  return Array.from(groups.values()).sort((left, right) => {
    if (left.companyId === null && right.companyId !== null) {
      return 1;
    }
    if (left.companyId !== null && right.companyId === null) {
      return -1;
    }
    return left.companyName.localeCompare(right.companyName, "fr", { sensitivity: "base" });
  });
}

export default async function SessionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{
    module?: string;
    attendanceError?: string;
    attendanceSuccess?: string;
    attendanceClosed?: string;
    attendanceSlot?: string;
  }>;
}) {
  const { sessionId } = await params;
  const {
    module: selectedModuleParam,
    attendanceError,
    attendanceSuccess,
    attendanceClosed,
    attendanceSlot
  } = await searchParams;
  let data;

  try {
    data = await getSessionById(sessionId);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      notFound();
    }
    if (error instanceof RecoverableSessionQueryError) {
      return (
        <main className="grid gap-4">
          <Card>
            <h2 className="text-2xl font-bold">Session temporairement indisponible</h2>
            <p className="mt-2 text-sm text-ink/65">
              Les donnees de cette session ne peuvent pas etre chargees pour le moment. Verifie le schema Supabase puis recharge la page.
            </p>
          </Card>
        </main>
      );
    }

    throw error;
  }

  const { session, candidates, modules, globalProgress, sourceQuote, availableCompanyCandidateCount } = data;
  let sessionDocuments = await getDocumentsBySessionId(sessionId);
  let attendanceDocumentUrl =
    sessionDocuments.find((document) => document.document_type === "feuille_presence")?.file_url ?? null;

  if (!attendanceDocumentUrl) {
    try {
      const attendanceDocument = await getOrCreateDocument({
        sessionId,
        type: "feuille_presence"
      });
      attendanceDocumentUrl = attendanceDocument.file_url;
      sessionDocuments = await getDocumentsBySessionId(sessionId);
    } catch (error) {
      console.error("[sessions/page] attendance document bootstrap failed", {
        file: "app/(dashboard)/sessions/[sessionId]/page.tsx",
        sessionId,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  const moduleGroups = buildSessionModuleGroups(modules);
  const defaultSelectedModule = resolveDefaultSelectedModule(moduleGroups);
  const selectedModule =
    modules.find((module) => module.id === selectedModuleParam) ??
    defaultSelectedModule ??
    null;
  let selectedModuleQuizzes: TrainingQuiz[] = [];
  let quizLoadError: string | null = null;

  if (selectedModule?.module_type === "child") {
    try {
      selectedModuleQuizzes = await getTrainingQuizzesByModuleId(selectedModule.id);
    } catch (error) {
      console.error("[sessions/page] quiz load failed", {
        file: "app/(dashboard)/sessions/[sessionId]/page.tsx",
        line: 117,
        sessionId,
        selectedModuleId: selectedModule.id,
        code:
          typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: string }).code
            : undefined,
        message:
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : String(error),
        details:
          typeof error === "object" && error !== null && "details" in error
            ? (error as { details?: string | null }).details
            : undefined,
        hint:
          typeof error === "object" && error !== null && "hint" in error
            ? (error as { hint?: string | null }).hint
            : undefined
      });

      quizLoadError =
        "Les questions de verification n'ont pas pu etre chargees pour ce sous-module. La fiche module reste consultable.";
      selectedModuleQuizzes = [];
    }
  }
  const completedModules = modules.filter((module) => module.is_completed).length;
  const trainingLabel = getTrainingTypeLabel(session.training_type);
  const companyOptions = await getCompanyOptions();
  const companyGroups = buildSessionCompanyGroups(candidates);
  const linkedCompanyGroups = companyGroups.filter((group) => group.companyId !== null);
  const unassignedCandidateCount = companyGroups
    .filter((group) => group.companyId === null)
    .reduce((total, group) => total + group.candidates.length, 0);
  const nextAction = getSessionNextAction({ session, candidates, documents: sessionDocuments, globalProgress });

  return (
    <main className="grid gap-4">
      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-pine/20 bg-pine/10 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">Prochaine action</p>
          <p className="mt-1 text-sm text-ink/70">{nextAction.description}</p>
        </div>
        <a href={nextAction.href} className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink">
          {nextAction.label}
        </a>
      </aside>
      <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="grid gap-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Session</p>
                <Badge tone={session.status === "completed" ? "success" : session.status === "in_progress" ? "warning" : "neutral"}>
                  {statusLabel[session.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/sessions/${session.id}/formation`}
                  className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
                >
                  Lancer le mode formation
                </a>
                <a
                  href={`/sessions/${session.id}/edit`}
                  className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
                >
                  Modifier la session
                </a>
              </div>
            </div>
            <h2 className="mt-3 text-3xl font-bold">{session.title}</h2>
            <div className="mt-4 space-y-2 text-sm text-ink/65">
              <p>
                Dates : {formatDate(session.start_date)} au {formatDate(session.end_date)}
              </p>
              <p>Type : {trainingLabel}</p>
              <p>Lieu : {session.location}</p>
              <p>Formateur : {session.trainer_name || "Non renseigne"}</p>
              <p>Duree : {session.duration_hours ? `${session.duration_hours} h` : "Non renseignee"}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="#candidats-session"
                className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Candidats
              </a>
              <a
                href="#documents-session"
                className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Documents
              </a>
            </div>
          </Card>

          <SessionProgressCard
            value={globalProgress}
            completedCount={completedModules}
            totalCount={modules.length}
          />

          <div id="emargement-session">
            <AttendancePanel
              session={session}
              candidates={candidates}
              documentUrl={attendanceDocumentUrl}
              feedback={{
                success: attendanceSuccess
                  ? "Demandes de presence envoyees."
                  : attendanceClosed
                    ? "Creneau cloture."
                    : null,
                error: attendanceError ? "L'envoi des demandes a echoue. Verifie la configuration email et les donnees des candidats." : null,
                slotId: attendanceSlot ?? null
              }}
            />
          </div>

          <div id="deroule-pedagogique">
            <Card>
              <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Déroulé pédagogique</p>
              <h3 className="mt-2 text-2xl font-bold">Modules {trainingLabel}</h3>
              <p className="mt-2 text-sm text-ink/65">
                Sélectionne un module pour afficher son contenu et piloter l&apos;avancement de la session.
              </p>
              <div className="mt-6">
                <SessionModuleList
                  sessionId={session.id}
                  moduleGroups={moduleGroups}
                  selectedModuleId={selectedModule?.id ?? ""}
                />
              </div>
            </Card>
          </div>

          {sourceQuote ? (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Origine commerciale</p>
                  <h3 className="mt-2 text-2xl font-bold">Devis {sourceQuote.quote_number}</h3>
                  <p className="mt-2 text-sm text-ink/65">
                    {sourceQuote.title} • {sourceQuote.company_name}
                  </p>
                </div>
                <a
                  href={`/quotes/${sourceQuote.id}`}
                  className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
                >
                  Ouvrir le devis
                </a>
              </div>
              <div className="mt-6">
                {availableCompanyCandidateCount > 0 ? (
                  <PrefillCompanyCandidatesForm
                    sessionId={session.id}
                    candidateCount={availableCompanyCandidateCount}
                    companyName={sourceQuote.company_name}
                  />
                ) : (
                  <p className="text-sm text-ink/65">
                    Aucun candidat supplementaire de cette societe n'est a pre-remplir pour le moment.
                  </p>
                )}
              </div>
            </Card>
          ) : null}

          <div id="documents-session">
            <Card>
              <DocumentList
                title="Documents de la session"
                documents={sessionDocuments}
                emptyMessage="Aucun document n’est encore enregistré pour cette session."
                hideCandidateDocuments
              />
            </Card>
          </div>

          <div id="cloture-session">
            <Card>
              <SessionClosurePanel session={session} candidates={candidates} />
            </Card>
          </div>
        </section>

        <section className="grid gap-4">
          {selectedModule ? (
            <ModuleContent
              sessionId={session.id}
              module={selectedModule}
              quizzes={selectedModuleQuizzes}
              quizError={quizLoadError}
            />
          ) : (
            <Card>
              <h3 className="text-lg font-bold">Aucun module</h3>
              <p className="mt-2 text-sm text-ink/65">
                Aucun module n’est encore associé à cette session.
              </p>
            </Card>
          )}
        </section>
      </section>

      <section id="candidats-session" className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Candidats</p>
          <h2 className="mt-2 text-2xl font-bold">{candidates.length} candidat(s)</h2>
        </div>
        <div id="ajouter-candidat">
          <Card>
            <details open={!candidates.length}>
              <summary className="cursor-pointer list-none text-lg font-bold text-ink">Ajouter un candidat</summary>
              <p className="mt-2 text-sm text-ink/65">Le candidat sera ajouté directement à cette session.</p>
              <div className="mt-5">
                <CreateCandidateForm
                  sessionId={session.id}
                  companies={companyOptions}
                  defaultCompanyId={sourceQuote?.company_id ?? ""}
                  compact
                />
              </div>
            </details>
          </Card>
        </div>
        {candidates.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Sociétés présentes</p>
              <p className="mt-3 text-4xl font-bold">{linkedCompanyGroups.length}</p>
              <p className="mt-2 text-sm text-ink/65">
                Société(s) représentée(s) dans cette session via les candidats rattachés.
              </p>
            </Card>
            <Card>
              <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Candidats hors société</p>
              <p className="mt-3 text-4xl font-bold">{unassignedCandidateCount}</p>
              <p className="mt-2 text-sm text-ink/65">
                Participant(s) sans société renseignée ou non rattachée.
              </p>
            </Card>
            <Card>
              <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Répartition</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {companyGroups.map((group) => (
                  <Badge key={`${group.companyId ?? "unassigned"}-${group.companyName}`} tone="neutral">
                    {group.companyName} • {group.candidates.length}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
        {candidates.length ? (
          companyGroups.map((group) => (
            <section key={`${group.companyId ?? "unassigned"}-${group.companyName}`} className="grid gap-4">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Groupe société</p>
                    <h3 className="mt-2 text-2xl font-bold">{group.companyName}</h3>
                    <p className="mt-2 text-sm text-ink/65">
                      {group.candidates.length} candidat(s) dans ce groupe
                      {group.companyId === null
                        ? " sans rattachement société."
                        : ` rattaché(s) à cette société.`}
                    </p>
                  </div>
                  <Badge tone={group.companyId === null ? "warning" : "neutral"}>
                    {group.companyId === null ? "Sans société" : "Société liée"}
                  </Badge>
                </div>
              </Card>
              {group.candidates.map((candidateSession) => (
                <SessionCandidateBanner
                  key={candidateSession.id}
                  candidateSession={candidateSession}
                  trainingType={session.training_type}
                  documents={sessionDocuments.filter((document) => document.candidate_id === candidateSession.candidate.id)}
                />
              ))}
            </section>
          ))
        ) : (
          <Card>
            <h3 className="text-lg font-bold">Aucun candidat</h3>
            <p className="mt-2 text-sm text-ink/65">
              Ajoute un premier candidat pour constituer la liste de session.
            </p>
          </Card>
        )}
      </section>
    </main>
  );
}
