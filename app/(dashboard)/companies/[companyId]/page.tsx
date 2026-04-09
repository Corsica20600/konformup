import { notFound } from "next/navigation";
import { CreateCompanyCandidateForm } from "@/components/companies/create-company-candidate-form";
import { DocumentList } from "@/components/documents/document-list";
import { EditCompanyForm } from "@/components/companies/edit-company-form";
import { CreateQuoteForm } from "@/components/sessions/create-quote-form";
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

  try {
    const [{ company, candidates, documents }, sessions] = await Promise.all([getClientCompanyById(companyId), getSessions()]);
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

    return (
      <main className="grid gap-4">
        <Card>
          <EditCompanyForm company={normalizedCompany} />
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
          <DocumentList
            title="Documents de la société"
            documents={documents}
            emptyMessage="Aucun document n’est encore enregistré pour cette société."
            allowQuoteDuplication
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
