import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type VerifyPageProps = {
  searchParams: Promise<{
    ref?: string;
  }>;
};

function getCandidateName(document: {
  candidate: { first_name: string | null; last_name: string | null }[] | null;
  metadata: unknown;
}) {
  const linkedCandidate = Array.isArray(document.candidate) ? document.candidate[0] : null;

  if (linkedCandidate) {
    return [linkedCandidate.first_name, linkedCandidate.last_name].filter(Boolean).join(" ") || "-";
  }

  if (document.metadata && typeof document.metadata === "object" && "candidate" in document.metadata) {
    const candidate = (document.metadata as { candidate?: { first_name?: string | null; last_name?: string | null } })
      .candidate;
    return [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") || "-";
  }

  return "-";
}

export default async function VerifyDocumentPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const ref = params.ref?.trim() || "";
  const supabase = await createClient();

  const { data: document } = ref
    ? await supabase
        .from("generated_documents")
        .select("document_ref, status, created_at, metadata, candidate:candidates(first_name, last_name)")
        .eq("document_ref", ref)
        .maybeSingle()
    : { data: null };

  const candidateName = document ? getCandidateName(document) : null;

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Verification documentaire</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Attestation SST</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Controle de reference d&apos;une attestation interne de fin de formation.
          </p>
        </div>

        <section className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_rgba(28,35,32,0.08)]">
          {document ? (
            <div className="space-y-5">
              <div className="inline-flex rounded-full bg-emerald-900 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white">
                Document verifie
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Candidat</p>
                  <p className="mt-2 text-xl font-semibold text-stone-900">{candidateName}</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Statut</p>
                  <p className="mt-2 text-xl font-semibold capitalize text-stone-900">{document.status}</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Reference</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{document.document_ref}</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Date</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{formatDate(document.created_at)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-red-700">Verification</p>
              <h2 className="mt-2 text-2xl font-semibold text-red-950">Document introuvable</h2>
              <p className="mt-3 text-sm leading-6 text-red-900/80">
                Aucune attestation ne correspond a cette reference dans le registre documentaire.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
