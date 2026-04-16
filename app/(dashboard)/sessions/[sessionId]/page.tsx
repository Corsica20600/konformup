import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CandidateCard } from "@/components/sessions/candidate-card";
import { CreateCandidateForm } from "@/components/sessions/create-candidate-form";
import { PrefillCompanyCandidatesForm } from "@/components/sessions/prefill-company-candidates-form";
import { DocumentList } from "@/components/documents/document-list";
import { AttendancePanel } from "@/components/sessions/attendance-panel";
import { ModuleContent } from "@/components/sessions/module-content";
import { SessionModuleList } from "@/components/sessions/session-module-list";
import { SessionProgressCard } from "@/components/sessions/session-progress-card";
import {
  getCompanyOptions,
  getDocumentsBySessionId,
  getSessionById,
  getTrainingQuizzesByModuleId,
  RecoverableSessionQueryError,
  SessionNotFoundError
} from "@/lib/queries";
import type { SessionCandidate, SessionModule, SessionModuleGroup, TrainingQuiz } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

function buildModuleGroups(modules: SessionModule[]): SessionModuleGroup[] {
  const parents = modules
    .filter((module) => module.module_type === "parent")
    .sort((a, b) => a.module_order - b.module_order);
  const children = modules
    .filter((module) => module.module_type === "child")
    .sort((a, b) => a.module_order - b.module_order);
  const childIds = new Set(children.map((module) => module.id));

  const parentGroups = parents.map((parent) => ({
    parent,
    children: children
      .filter((child) => child.parent_module_id === parent.id)
      .sort((a, b) => a.module_order - b.module_order)
  }));

  const orphanStandaloneGroups = modules
    .filter((module) => !childIds.has(module.id) && module.module_type !== "parent")
    .sort((a, b) => a.module_order - b.module_order)
    .map((module) => ({
      parent: module,
      children: []
    }));

  return [...parentGroups, ...orphanStandaloneGroups];
}

function resolveDefaultSelectedModule(moduleGroups: SessionModuleGroup[]) {
  const firstGroup = moduleGroups[0];
  if (!firstGroup) {
    return null;
  }

  return firstGroup.children[0] ?? firstGroup.parent;
}

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
  const companies = await getCompanyOptions();
  const sessionDocuments = await getDocumentsBySessionId(sessionId);

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
  const moduleGroups = buildModuleGroups(modules);
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
  const companyGroups = buildSessionCompanyGroups(candidates);
  const linkedCompanyGroups = companyGroups.filter((group) => group.companyId !== null);
  const unassignedCandidateCount = companyGroups
    .filter((group) => group.companyId === null)
    .reduce((total, group) => total + group.candidates.length, 0);

  return (
    <main className="grid gap-4">
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
              <a
                href={`/sessions/${session.id}/edit`}
                className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Modifier la session
              </a>
            </div>
            <h2 className="mt-3 text-3xl font-bold">{session.title}</h2>
            <div className="mt-4 space-y-2 text-sm text-ink/65">
              <p>
                Dates : {formatDate(session.start_date)} au {formatDate(session.end_date)}
              </p>
              <p>Lieu : {session.location}</p>
              <p>Formateur : {session.trainer_name || "Non renseigne"}</p>
              <p>Duree : {session.duration_hours ? `${session.duration_hours} h` : "Non renseignee"}</p>
            </div>
          </Card>

          <SessionProgressCard
            value={globalProgress}
            completedCount={completedModules}
            totalCount={modules.length}
          />

          <AttendancePanel
            session={session}
            candidates={candidates}
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

          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Déroulé pédagogique</p>
            <h3 className="mt-2 text-2xl font-bold">Modules SST</h3>
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

          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Ajout manuel</p>
            <h3 className="mt-2 text-2xl font-bold">Ajouter un candidat</h3>
            <p className="mt-2 text-sm text-ink/65">
              Saisie simple pour rattacher un candidat à cette session.
            </p>
            <div className="mt-6">
              <CreateCandidateForm
                sessionId={session.id}
                companies={companies}
                defaultCompanyId={sourceQuote?.company_id ?? ""}
              />
            </div>
          </Card>

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

          <Card>
            <DocumentList
              title="Documents de la session"
              documents={sessionDocuments}
              emptyMessage="Aucun document n’est encore enregistré pour cette session."
            />
          </Card>
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

      <section className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Candidats</p>
          <h2 className="mt-2 text-2xl font-bold">{candidates.length} candidat(s)</h2>
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
                <CandidateCard
                  key={candidateSession.id}
                  candidateSession={candidateSession}
                  companies={companies}
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
