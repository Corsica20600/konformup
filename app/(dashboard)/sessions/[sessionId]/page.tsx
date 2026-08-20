import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrefillCompanyCandidatesForm } from "@/components/sessions/prefill-company-candidates-form";
import { DocumentList } from "@/components/documents/document-list";
import { AttendancePanel } from "@/components/sessions/attendance-panel";
import { SessionCandidateBanner } from "@/components/sessions/session-candidate-banner";
import { SessionClosurePanel } from "@/components/sessions/session-closure-panel";
import { SessionPreparationPanel } from "@/components/sessions/session-preparation-panel";
import { CreateCandidateForm } from "@/components/sessions/create-candidate-form";
import { getCompanyOptions, getDocumentsBySessionId, getSessionById, RecoverableSessionQueryError, SessionNotFoundError } from "@/lib/queries";
import { getTrainingTypeLabel } from "@/lib/training-programs";
import { getRequiredPreTrainingDocumentTypes } from "@/lib/pre-training-documents";
import type { SessionCandidate } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Session" };

const tabs = [
  ["overview", "Vue d’ensemble"], ["candidates", "Candidats"], ["before", "Avant la formation"],
  ["attendance", "Émargement"], ["evaluations", "Évaluations"], ["completion", "Fin de formation"], ["documents", "Documents et archives"]
] as const;
type SessionTab = (typeof tabs)[number][0];
const validTabs = new Set<SessionTab>(tabs.map(([value]) => value));
const statusLabel = { draft: "Brouillon", scheduled: "Planifiée", in_progress: "En cours", completed: "Terminée", cancelled: "Annulée" } as const;

function groupCandidates(candidates: SessionCandidate[]) {
  const groups = new Map<string, { label: string; candidates: SessionCandidate[] }>();
  candidates.forEach((item) => {
    const label = item.candidate.company?.trim() || "Sans société";
    const current = groups.get(label) ?? { label, candidates: [] };
    current.candidates.push(item);
    groups.set(label, current);
  });
  return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label, "fr"));
}

function SessionTabs({ sessionId, activeTab }: { sessionId: string; activeTab: SessionTab }) {
  return <nav className="flex gap-2 overflow-x-auto border-b border-ink/10 pb-3" aria-label="Navigation de la session">{tabs.map(([value, label]) => <Link key={value} href={`/sessions/${sessionId}?tab=${value}`} aria-current={activeTab === value ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeTab === value ? "bg-pine text-white" : "bg-sand text-ink hover:bg-[#d8ceb9]"}`}>{label}</Link>)}</nav>;
}

export default async function SessionDetailPage({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<{ tab?: string; attendanceError?: string; attendanceSuccess?: string; attendanceClosed?: string; attendanceScheduleUpdated?: string; attendanceScheduleError?: string; candidateUpdated?: string }> }) {
  const { sessionId } = await params;
  const query = await searchParams;
  const activeTab: SessionTab = query.tab && validTabs.has(query.tab as SessionTab) ? query.tab as SessionTab : "overview";
  let data;
  try { data = await getSessionById(sessionId); } catch (error) {
    if (error instanceof SessionNotFoundError) notFound();
    if (error instanceof RecoverableSessionQueryError) return <main><Card><h2 className="text-2xl font-bold">Session temporairement indisponible</h2><p className="mt-2 text-sm text-ink/65">Recharge la page après vérification de la configuration.</p></Card></main>;
    throw error;
  }
  const { session, candidates, globalProgress, sourceQuote, availableCompanyCandidateCount } = data;
  const [sessionDocuments, companyOptions] = await Promise.all([getDocumentsBySessionId(sessionId), activeTab === "candidates" ? getCompanyOptions() : Promise.resolve([])]);
  const groups = groupCandidates(candidates);
  const completedEvaluations = candidates.filter((candidate) => (candidate.evaluations ?? []).some((evaluation) => evaluation.evaluation_type === "globale" && evaluation.result !== "non_renseigne")).length;
  const administrativeProgress = candidates.length ? Math.round((completedEvaluations / candidates.length) * 100) : 0;
  const attendanceDocumentUrl = sessionDocuments.find((document) => document.document_type === "feuille_presence")?.file_url ?? null;
  const preTrainingTypes = getRequiredPreTrainingDocumentTypes(session.training_type);
  const preparationRecipients = candidates.map((candidate) => {
    const documents = sessionDocuments.filter((document) => document.candidate_id === candidate.candidate.id && preTrainingTypes.includes(document.document_type as typeof preTrainingTypes[number]));
    const latestByType = new Map(documents.map((document) => [document.document_type, document]));
    const availableDocuments = preTrainingTypes.map((type) => latestByType.get(type)).filter(Boolean);
    const status: "missing" | "ready" | "sent" = availableDocuments.length !== preTrainingTypes.length ? "missing" : availableDocuments.every((document) => document?.status === "sent") ? "sent" : "ready";
    return { id: candidate.candidate.id, name: `${candidate.candidate.first_name} ${candidate.candidate.last_name}`.trim(), email: candidate.candidate.email, status };
  });

  return <main className="grid gap-5">
    <section className="rounded-[24px] border border-pine/20 bg-pine/10 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><p className="text-sm uppercase tracking-[0.25em] text-ink/45">Session</p><Badge tone={session.status === "completed" ? "success" : session.status === "in_progress" ? "warning" : "neutral"}>{statusLabel[session.status]}</Badge></div><h2 className="mt-2 text-3xl font-bold">{session.title}</h2><p className="mt-2 text-sm text-ink/65">{formatDate(session.start_date)} au {formatDate(session.end_date)} · {getTrainingTypeLabel(session.training_type)} · {session.trainer_name || "Formateur non renseigné"}</p></div><div className="flex flex-wrap gap-2"><Link href={`/sessions/${session.id}/formation`} className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Lancer le mode formation</Link>{session.closure_status !== "archived" ? <><Link href={`/sessions/${session.id}?tab=before`} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-pine">Préparer la formation</Link><Link href={`/sessions/${session.id}?tab=completion`} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Clôturer la formation</Link></> : null}{session.current_archive_id ? <Link href={`/api/session-archives/${session.current_archive_id}`} className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink">Ouvrir l’archive</Link> : null}{session.closure_status !== "archived" ? <Link href={`/sessions/${session.id}/edit`} className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink">Modifier</Link> : null}</div></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5"><p><strong>{candidates.length}</strong><br />candidat(s)</p><p><strong>{administrativeProgress}%</strong><br />évaluations globales</p><p><strong>{globalProgress}%</strong><br />progression pédagogique</p><p><strong>{session.closure_status === "archived" ? "Archivée" : session.closure_status === "closed" ? "Clôturée" : "À contrôler"}</strong><br />clôture</p><p><strong>{sourceQuote?.company_name || "—"}</strong><br />société</p></div></section>
    <SessionTabs sessionId={session.id} activeTab={activeTab} />
    {activeTab === "overview" ? <section className="grid gap-4 lg:grid-cols-2"><Card><p className="text-sm uppercase tracking-[0.25em] text-ink/45">Pilotage administratif</p><h3 className="mt-2 text-2xl font-bold">À suivre</h3><ul className="mt-4 grid gap-2 text-sm text-ink/70"><li>• Candidats : {candidates.length}</li><li>• Évaluations globales renseignées : {completedEvaluations}/{candidates.length}</li><li>• Documents enregistrés : {sessionDocuments.length}</li><li>• Émargement et documents restent dans leurs onglets dédiés.</li></ul></Card><Card><p className="text-sm uppercase tracking-[0.25em] text-ink/45">Origine commerciale</p>{sourceQuote ? <><h3 className="mt-2 text-2xl font-bold">Devis {sourceQuote.quote_number}</h3><p className="mt-2 text-sm text-ink/65">{sourceQuote.title} · {sourceQuote.company_name}</p><Link href={`/quotes/${sourceQuote.id}`} className="mt-5 inline-flex rounded-full bg-sand px-4 py-2 text-sm font-semibold">Ouvrir le devis</Link></> : <p className="mt-2 text-sm text-ink/65">Aucun devis d’origine relié à cette session.</p>}</Card></section> : null}
    {activeTab === "candidates" ? <section className="grid gap-4"><Card><details open={!candidates.length}><summary className="cursor-pointer text-lg font-bold">Ajouter un candidat</summary><p className="mt-2 text-sm text-ink/65">Le candidat reste rattaché à cette session.</p><div className="mt-5"><CreateCandidateForm sessionId={session.id} companies={companyOptions} defaultCompanyId={sourceQuote?.company_id ?? ""} compact /></div></details></Card>{groups.map((group) => <section key={group.label} className="grid gap-3"><p className="px-1 text-sm font-semibold text-ink/65">{group.label} · {group.candidates.length} candidat(s)</p>{group.candidates.map((candidate) => <SessionCandidateBanner key={candidate.id} candidateSession={candidate} trainingType={session.training_type} documents={sessionDocuments.filter((document) => document.candidate_id === candidate.candidate.id)} />)}</section>)}{!candidates.length ? <Card><p>Aucun candidat n’est encore inscrit.</p></Card> : null}</section> : null}
    {activeTab === "before" ? <section className="grid gap-4"><Card><p className="text-sm uppercase tracking-[0.25em] text-ink/45">Préparer la formation</p><h3 className="mt-2 text-2xl font-bold">Contrôle avant formation</h3><p className="mt-2 text-sm text-ink/65">Les documents existants sont conservés. L’envoi groupé exige une confirmation et exclut les documents déjà envoyés.</p><div className="mt-5"><SessionPreparationPanel sessionId={session.id} recipients={preparationRecipients} preparedDocumentCount={sessionDocuments.filter((document) => preTrainingTypes.includes(document.document_type as typeof preTrainingTypes[number])).length} /></div></Card>{sourceQuote && availableCompanyCandidateCount > 0 ? <Card><PrefillCompanyCandidatesForm sessionId={session.id} candidateCount={availableCompanyCandidateCount} companyName={sourceQuote.company_name} /></Card> : null}</section> : null}
    {activeTab === "attendance" ? <AttendancePanel session={session} candidates={candidates} documentUrl={attendanceDocumentUrl} feedback={{ success: query.attendanceSuccess ? "Demandes d’émargement traitées." : query.attendanceScheduleUpdated ? "Horaires enregistrés." : query.attendanceClosed ? "Créneau clôturé." : null, error: query.attendanceScheduleError ? "Les horaires n’ont pas pu être enregistrés." : query.attendanceError ? "L’action d’émargement a échoué." : null }} /> : null}
    {activeTab === "evaluations" ? <section className="grid gap-4">{candidates.length ? candidates.map((candidate) => <SessionCandidateBanner key={candidate.id} candidateSession={candidate} trainingType={session.training_type} documents={sessionDocuments.filter((document) => document.candidate_id === candidate.candidate.id)} />) : <Card>Aucun candidat à évaluer.</Card>}</section> : null}
    {activeTab === "completion" ? <Card><SessionClosurePanel session={session} candidates={candidates} /></Card> : null}
    {activeTab === "documents" ? <section className="grid gap-4"><Card><DocumentList title="Documents de la session" documents={sessionDocuments} emptyMessage="Aucun document n’est encore enregistré pour cette session." /></Card></section> : null}
  </main>;
}
