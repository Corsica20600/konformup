import { notFound } from "next/navigation";
import Link from "next/link";
import { CreateCompanyCandidateForm } from "@/components/companies/create-company-candidate-form";
import { DocumentList } from "@/components/documents/document-list";
import { EditCompanyForm } from "@/components/companies/edit-company-form";
import { CreateQuoteForm } from "@/components/sessions/create-quote-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CompanyNotFoundError, getClientCompanyById, getSessions } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
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
    const [{ company, candidates, documents, candidateDocuments, sessions: companySessions, quotes, invoices, complaints }, sessions] = await Promise.all([
      getClientCompanyById(companyId),
      getSessions()
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
    const companyDocumentCount = documents.length;
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
          <CreateQuoteForm
            companies={[
              {
                id: normalizedCompany.id,
                company_name: normalizedCompany.company_name,
                candidateCount: candidates.length
              }
            ]}
          />
        </Card>

        <Card>
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
              <div className="mt-3 grid gap-3">
                {quotes.length ? (
                  quotes.map((quote) => (
                    <Link key={quote.id} href={`/quotes/${quote.id}`}>
                      <div className="rounded-2xl border border-ink/10 bg-canvas/60 px-4 py-4 transition hover:bg-white">
                        <p className="font-semibold text-ink">{quote.quote_number}</p>
                        <p className="mt-1 text-sm text-ink/65">{quote.title}</p>
                        <p className="mt-2 text-sm text-ink/55">
                          Cree le {formatDate(quote.created_at)} • {quote.total_ttc.toFixed(2)} EUR
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-ink/65">Aucun devis pour cette societe.</p>
                )}
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
        </Card>

        <Card>
          <DocumentList
            title="Documents de la société"
            documents={documents}
            emptyMessage="Aucun document n’est encore enregistré pour cette société."
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
