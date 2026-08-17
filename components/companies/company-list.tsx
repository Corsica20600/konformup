import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getCompanyContactName, isLikelyTestCompany } from "@/lib/company-directory";
import type { ClientCompanyDirectoryItem } from "@/lib/types";

export function CompanyList({
  companies,
  emptyMessage
}: {
  companies: ClientCompanyDirectoryItem[];
  emptyMessage?: string;
}) {
  if (!companies.length) {
    return (
      <Card className="border border-dashed border-ink/15 text-center shadow-none">
        <h3 className="text-lg font-bold">Aucune société</h3>
        <p className="mt-2 text-sm text-ink/65">
          {emptyMessage ?? "Créez une première société cliente pour préparer les documents commerciaux."}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {companies.map((company) => {
        const contactName = getCompanyContactName(company);
        const isTestCompany = isLikelyTestCompany(company);

        return (
          <Card
            key={company.id}
            className={`flex h-full flex-col justify-between border transition hover:border-pine/25 hover:bg-white ${
              isTestCompany ? "border-dashed border-ink/10 bg-white/55 shadow-none" : "border-transparent"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-xl font-bold text-ink">{company.company_name}</h3>
                  <p className="mt-1 text-sm font-medium text-ink/65">
                    {company.city || "Ville non renseignée"}
                  </p>
                </div>
                {isTestCompany ? (
                  <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/50">
                    Donnée de test
                  </span>
                ) : null}
              </div>

              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-ink/55">Contact principal</dt>
                  <dd className="mt-1 break-words text-ink">{contactName || "Non renseigné"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink/55">Email</dt>
                  <dd className="mt-1 break-all text-ink">{company.contact_email || "Non renseigné"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink/55">SIRET</dt>
                  <dd className="mt-1 text-ink">{company.siret || "Non renseigné"}</dd>
                </div>
                <div className="flex gap-5">
                  <div>
                    <dt className="font-semibold text-ink/55">Devis</dt>
                    <dd className="mt-1 text-lg font-bold text-ink">{company.quote_count}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink/55">Sessions</dt>
                    <dd className="mt-1 text-lg font-bold text-ink">{company.session_count}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
              <Link
                href={`/companies/${company.id}`}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
              >
                Voir la fiche
              </Link>
              <Link
                href={`/companies/${company.id}#devis`}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
              >
                Nouveau devis
              </Link>
              <Link
                href={`/companies/${company.id}#sessions`}
                className="inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-canvas"
              >
                Voir les sessions
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
