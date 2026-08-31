import { notFound } from "next/navigation";
import Link from "next/link";
import { CompanyQuoteList } from "@/components/companies/company-quote-list";
import { CreateCompanyCandidateForm } from "@/components/companies/create-company-candidate-form";
import { DocumentList } from "@/components/documents/document-list";
import { EditCompanyForm } from "@/components/companies/edit-company-form";
import { CreateQuoteForm } from "@/components/sessions/create-quote-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CompanyNotFoundError, getClientCompanyById, getSessions, getTrainerOptions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { listTrainingNeedsAnalysesForCompany } from "@/lib/training-needs/internal";
import { TrainingNeedsSummaryCard } from "@/components/training-needs/internal-summary";
import { createPreQuoteTrainingNeedsAction } from "@/app/(dashboard)/training-needs/actions";
import { getCompanyQuality } from "@/lib/company-quality";
import { ComplaintAttachmentOpenButton } from "@/components/invoices/complaint-attachment-open-button";
import { moderateCompanySatisfaction } from "./satisfaction-actions";
import { companySatisfactionCommentLabel, companySatisfactionPublicationConsentLabel, companySatisfactionPublicIdentityLabel, companySatisfactionQuestions } from "@/lib/company-satisfaction-questions";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ analysisId?: string }>;
}) {
  const { companyId } = await params;
  const { analysisId } = await searchParams;
  const viewer = await requireUser();
  const complaintStatusTone = {
    open: "warning",
    in_progress: "warning",
    resolved: "success",
    closed: "neutral"
  } as const;
  const complaintSeverityTone = {
    low: "neutral",
    medium: "warning",
    high: "warning"
  } as const;

  try {
    const [{ company, candidates, documents, candidateDocuments, sessions: companySessions, quotes, invoices, complaints }, sessions, trainers, analyses, quality] = await Promise.all([
      getClientCompanyById(companyId),
      getSessions(),
      getTrainerOptions(),
      listTrainingNeedsAnalysesForCompany(companyId), getCompanyQuality(companyId)
    ]);
    const normalizedCompany = company as unknown as {
      id: string;
      company_name: string;
      siret: string | null;
      address: string | null;
      postal_code: string | null;
      city: string | null;
      country: string | null;
      contact_first_name: string | null;
      contact_last_name: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    };
    const companyContentDocuments = documents.filter(
      (document) => document.document_type !== "quote" && document.document_type !== "invoice"
    );
    const companyDocumentCount = companyContentDocuments.length;
    const candidateDocumentCount = candidateDocuments.length;
    const openComplaintCount = complaints.filter((complaint) => complaint.status === "open" || complaint.status === "in_progress").length;

    return (
      <main className="grid gap-4">
        <Card>
          <EditCompanyForm company={normalizedCompany} />
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Vue d&apos;ensemble</p>
            <p className="mt-2 text-3xl font-bold">{candidates.length}</p>
            <p className="mt-2 text-sm text-ink/65">Candidat(s) rattache(s) a la societe</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Sessions</p>
            <p className="mt-2 text-3xl font-bold">{companySessions.length}</p>
            <p className="mt-2 text-sm text-ink/65">Session(s) ou la societe est presente via ses candidats</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Facturation</p>
            <p className="mt-2 text-3xl font-bold">{invoices.length}</p>
            <p className="mt-2 text-sm text-ink/65">{quotes.length} devis • {invoices.length} facture(s)</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Qualite</p>
            <p className="mt-2 text-3xl font-bold">{openComplaintCount}</p>
            <p className="mt-2 text-sm text-ink/65">Fiche(s) ouverte(s) ou en cours</p>
          </Card>
        </section>

        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Synthese dossier</p>
          <h3 className="mt-2 text-2xl font-bold">Activite de la societe</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
              <p className="text-sm font-semibold text-ink">Documents societe</p>
              <p className="mt-2 text-2xl font-bold">{companyDocumentCount}</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
              <p className="text-sm font-semibold text-ink">Documents candidats</p>
              <p className="mt-2 text-2xl font-bold">{candidateDocumentCount}</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
              <p className="text-sm font-semibold text-ink">Derniere facture</p>
              <p className="mt-2 text-base font-semibold text-ink">
                {invoices[0]?.invoice_number || "Aucune"}
              </p>
              <p className="mt-1 text-sm text-ink/65">
                {invoices[0] ? formatDate(invoices[0].created_at) : "Pas encore de facturation"}
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4">
              <p className="text-sm font-semibold text-ink">Derniere session</p>
              <p className="mt-2 text-base font-semibold text-ink">
                {companySessions[0]?.session.title || "Aucune"}
              </p>
              <p className="mt-1 text-sm text-ink/65">
                {companySessions[0] ? formatDate(companySessions[0].session.start_date) : "Aucune presence session"}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Analyses des besoins</p>
          <h3 className="mt-2 text-2xl font-bold">Analyse à réaliser avant le devis</h3>
          <p className="mt-2 text-sm text-ink/65">Créez l’analyse, renseignez ou corrigez les réponses, puis finalisez-la avant d’établir le devis.</p>
          <form action={createPreQuoteTrainingNeedsAction} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-canvas/60 p-4">
            <input type="hidden" name="companyId" value={normalizedCompany.id} />
            <label className="grid gap-2 text-sm font-medium text-ink/80"><span>Formation concernée</span><select name="trainingType" defaultValue="sst_initial" className="min-h-10 rounded-xl border border-ink/10 bg-white px-3"><option value="sst_initial">SST initial</option><option value="mac_sst">MAC SST</option><option value="hygiene">Hygiène</option></select></label>
            <button type="submit" className="min-h-10 rounded-full bg-pine px-4 text-sm font-semibold text-white">Commencer l’analyse</button>
          </form>
          <div className="mt-5 grid gap-3">{analyses.length ? analyses.map((analysis) => <TrainingNeedsSummaryCard key={analysis.id} analysis={analysis} />) : <p className="text-sm text-ink/65">Aucune analyse n’est encore créée pour cette société.</p>}</div>
        </Card>

        <Card id="devis">
          <CreateQuoteForm
            trainingNeedsAnalysisId={analysisId ?? null}
            initialTrainingType={analyses.find((analysis) => analysis.id === analysisId && analysis.status === "completed" && !analysis.quote_id)?.training_type}
            companies={[
              {
                id: normalizedCompany.id,
                company_name: normalizedCompany.company_name,
                candidateCount: candidates.length
              }
            ]}
            trainers={trainers}
          />
        </Card>

        <Card id="sessions">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Sessions</p>
          <h3 className="mt-2 text-2xl font-bold">Sessions de la societe</h3>
          <p className="mt-2 text-sm text-ink/65">
            Une session peut contenir plusieurs societes. Ici, on liste celles ou au moins un candidat de cette societe est inscrit.
          </p>
          <div className="mt-6 grid gap-3">
            {companySessions.length ? (
              companySessions.map(({ session, company_candidate_count, total_candidate_count }) => (
                <Link key={session.id} href={`/sessions/${session.id}`}>
                  <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4 transition hover:bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{session.title}</p>
                        <p className="mt-1 text-sm text-ink/65">
                          {formatDate(session.start_date)} au {formatDate(session.end_date)} • {session.location}
                        </p>
                        <p className="mt-2 text-sm text-ink/55">
                          {company_candidate_count} candidat(s) de cette societe sur {total_candidate_count} participant(s)
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={session.status === "completed" ? "success" : session.status === "in_progress" ? "warning" : "neutral"}>
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-ink/65">Aucune session ne reference encore de candidat de cette societe.</p>
            )}
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Facturation</p>
          <h3 className="mt-2 text-2xl font-bold">Devis et factures</h3>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-ink">Devis</p>
              <div className="mt-3">
                <CompanyQuoteList quotes={quotes} invoices={invoices} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Factures</p>
              <div className="mt-3 grid gap-3">
                {invoices.length ? (
                  invoices.map((invoice) => (
                    <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                      <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4 transition hover:bg-white">
                        <p className="font-semibold text-ink">{invoice.invoice_number || "Facture sans numero"}</p>
                        <p className="mt-1 text-sm text-ink/65">
                          {invoice.quote_number ? `${invoice.quote_number} • ` : ""}{invoice.quote_title || "Sans objet detaille"}
                        </p>
                        <p className="mt-2 text-sm text-ink/55">
                          Creee le {formatDate(invoice.created_at)}
                          {invoice.due_date ? ` • Echeance ${formatDate(invoice.due_date)}` : ""}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-ink/65">Aucune facture pour cette societe.</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Qualite</p>
          <h3 className="mt-2 text-2xl font-bold">Reclamations et insatisfactions</h3>
          <div className="mt-4 grid gap-2 text-sm md:grid-cols-4"><p>Ouvertes : {quality.complaints?.filter((item) => item.status === "open").length ?? "—"}</p><p>En cours : {quality.complaints?.filter((item) => item.status === "in_progress").length ?? "—"}</p><p>Clôturées : {quality.complaints?.filter((item) => item.status === "closed" || item.status === "resolved").length ?? "—"}</p><p>Niveau max : {quality.complaints?.some((item) => item.severity === "high") ? "Haut" : quality.complaints?.some((item) => item.severity === "medium") ? "Moyen" : quality.complaints?.length ? "Faible" : "—"}</p><p>Satisfactions envoyées : {quality.satisfaction?.filter((item) => item.status === "sent" || item.status === "pending").length ?? "—"}</p><p>Complétées : {quality.satisfaction?.filter((item) => item.status === "completed").length ?? "—"}</p><p>Moyenne : {(() => { const values = quality.satisfaction?.filter((item) => item.status === "completed" && item.overall_rating != null).map((item) => item.overall_rating as number) ?? []; return values.length ? (values.reduce((a,b)=>a+b,0)/values.length).toFixed(1) : "—"; })()}</p><p>Consentements : {quality.satisfaction?.filter((item) => item.publication_consent).length ?? "—"}</p></div>
          {quality.complaintsError ? <p className="mt-3 text-sm text-accent">{quality.complaintsError}</p> : null}
          {quality.complaints?.map((complaint) => <details key={complaint.id} className="mt-3 rounded-xl border border-ink/10 p-3"><summary className="cursor-pointer">{complaint.dissatisfaction_summary || "Réclamation"} · {complaint.attachments.length} pièce(s)</summary>{complaint.attachments.map((attachment) => <div key={attachment.id} className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span>{attachment.original_filename} · {attachment.mime_type} · {Math.ceil(attachment.size_bytes / 1024)} Ko · {formatDate(attachment.created_at)}</span><ComplaintAttachmentOpenButton attachmentId={attachment.id} /></div>)}</details>)}
          <div className="mt-6 grid gap-3">
            {complaints.length ? (
              complaints.map((complaint) => (
                <Link key={complaint.id} href={`/invoices/${complaint.invoice_id}`}>
                  <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4 transition hover:bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">
                          {complaint.invoice_number || "Facture sans numero"}
                        </p>
                        <p className="mt-1 text-sm text-ink/65">
                          {complaint.dissatisfaction_summary || "Fiche de reclamation / insatisfaction"}
                        </p>
                        <p className="mt-2 text-sm text-ink/55">
                          Mise a jour le {formatDate(complaint.updated_at)}
                          {complaint.resolved_at ? ` • Resolue le ${formatDate(complaint.resolved_at)}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={complaintStatusTone[complaint.status as keyof typeof complaintStatusTone] ?? "neutral"}>
                          {complaint.status}
                        </Badge>
                        <Badge tone={complaintSeverityTone[complaint.severity as keyof typeof complaintSeverityTone] ?? "neutral"}>
                          {complaint.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-ink/65">Aucune fiche qualite n&apos;est encore enregistree pour cette societe.</p>
            )}
          </div>
          <div className="mt-6 border-t border-ink/10 pt-5"><h4 className="font-semibold">Satisfaction entreprise</h4>{quality.satisfactionError ? <p className="mt-2 text-sm text-accent">{quality.satisfactionError}</p> : quality.satisfaction?.length ? <div className="mt-3 grid gap-3">{quality.satisfaction.map((survey) => <div key={survey.id} className="rounded-2xl border border-ink/10 bg-canvas/60 p-4"><p className="font-medium">{survey.status} · {survey.submitted_at ? `Répondu le ${formatDate(survey.submitted_at)}` : "En attente"}</p>{survey.status === "completed" ? <dl className="mt-4 grid gap-3 text-sm">{companySatisfactionQuestions.map(({ key, label }) => { const value = key === "overallRating" ? survey.overall_rating : key === "organizationRating" ? survey.organization_rating : survey.needs_rating; return <div key={key} className="grid gap-1 border-b border-ink/10 pb-3"><dt className="font-medium text-ink/70">{label}</dt><dd className="font-semibold text-ink">{value ?? "Non renseignée"}/5</dd></div>; })}<div className="grid gap-1 border-b border-ink/10 pb-3"><dt className="font-medium text-ink/70">{companySatisfactionCommentLabel}</dt><dd className="whitespace-pre-wrap font-semibold text-ink">{survey.comment || "Non renseigné"}</dd></div><div className="grid gap-1 border-b border-ink/10 pb-3"><dt className="font-medium text-ink/70">{companySatisfactionPublicationConsentLabel}</dt><dd className="font-semibold text-ink">{survey.publication_consent ? "Oui" : "Non"}</dd></div><div className="grid gap-1"><dt className="font-medium text-ink/70">{companySatisfactionPublicIdentityLabel}</dt><dd className="font-semibold text-ink">{survey.public_identity === "company_name" ? "Nom de la société" : survey.public_identity === "first_name_initial" ? "Prénom et initiale" : survey.public_identity === "anonymous" ? "Anonyme" : "Non renseigné"}</dd></div></dl> : null}<p className="mt-4 text-xs text-ink/55">Modération : {survey.moderation_status}</p></div>)}</div> : <p className="mt-2 text-sm text-ink/65">Aucune satisfaction entreprise.</p>}</div>
        </Card>

        {viewer.profile.role === "admin" && quality.satisfaction?.some((survey) => survey.status === "completed" && survey.publication_consent && survey.moderation_status === "pending") ? <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Publication des avis</p>
          <h3 className="mt-2 text-2xl font-bold">Avis en attente de modération</h3>
          <p className="mt-2 text-sm text-ink/65">L’approbation publie l’avis sur le site Konform’up ; le rejet le maintient privé.</p>
          <div className="mt-5 grid gap-3">
            {quality.satisfaction.filter((survey) => survey.status === "completed" && survey.publication_consent && survey.moderation_status === "pending").map((survey) => <div key={survey.id} className="rounded-2xl border border-ink/10 bg-canvas/60 p-4"><p className="font-medium">Note globale : {survey.overall_rating ?? "—"}/5</p>{survey.comment ? <p className="mt-2 whitespace-pre-wrap text-sm">{survey.comment}</p> : null}<form action={moderateCompanySatisfaction} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="surveyId" value={survey.id}/><input type="hidden" name="companyId" value={companyId}/><button className="rounded-xl bg-pine px-4 py-2 text-sm font-semibold text-white" type="submit" name="decision" value="approved">Approuver et publier</button><button className="rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold" type="submit" name="decision" value="rejected">Rejeter</button></form></div>)}
          </div>
        </Card> : null}

        <Card>
          <DocumentList
            title="Documents de la société"
            documents={companyContentDocuments}
            emptyMessage="Aucun document hors devis et factures n’est encore enregistré pour cette société."
            allowQuoteDuplication
          />
        </Card>

        <Card>
          <DocumentList
            title="Documents des candidats de la societe"
            documents={candidateDocuments}
            emptyMessage="Aucun document candidat n’est encore disponible pour cette societe."
          />
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Candidats</p>
          <h3 className="mt-2 text-2xl font-bold">Ajouter un candidat</h3>
          <p className="mt-2 text-sm text-ink/65">
            Tu peux rattacher un candidat à la société dès maintenant, avec ou sans session.
          </p>
          <div className="mt-6">
            <CreateCompanyCandidateForm
              companyId={normalizedCompany.id}
              sessions={sessions.map((session) => ({
                id: session.id,
                title: session.title,
                start_date: formatDate(session.start_date)
              }))}
            />
          </div>
        </Card>

        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Candidats liés</p>
          <h3 className="mt-2 text-2xl font-bold">{candidates.length} candidat(s)</h3>
          <div className="mt-6 grid gap-3">
            {candidates.length ? (
              candidates.map((candidate) => {
                const session = Array.isArray(candidate.training_sessions)
                  ? candidate.training_sessions[0]
                  : candidate.training_sessions;

                return (
                  <div key={candidate.id} className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-3">
                    <p className="font-semibold text-ink">
                      {candidate.first_name} {candidate.last_name}
                    </p>
                    <p className="mt-1 text-sm text-ink/65">
                      {candidate.email || candidate.phone || candidate.job_title || "Aucune information complémentaire"}
                    </p>
                    {session ? (
                      <p className="mt-1 text-sm text-ink/55">
                        Session : {session.title} • {formatDate(session.start_date)}
                      </p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-ink/65">Aucun candidat n’est encore rattaché à cette société.</p>
            )}
          </div>
        </Card>
      </main>
    );
  } catch (error) {
    if (error instanceof CompanyNotFoundError) {
      notFound();
    }

    throw error;
  }
}
