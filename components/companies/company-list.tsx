import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ClientCompany } from "@/lib/types";

export function CompanyList({ companies }: { companies: ClientCompany[] }) {
  if (!companies.length) {
    return (
      <Card>
        <h3 className="text-lg font-bold">Aucune société</h3>
        <p className="mt-2 text-sm text-ink/65">Crée une première société cliente pour préparer les documents commerciaux.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {companies.map((company) => (
        <Link key={company.id} href={`/companies/${company.id}`}>
          <Card className="transition hover:-translate-y-0.5 hover:bg-white">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold">{company.company_name}</h3>
              <p className="text-sm text-ink/65">
                {company.city ? `${company.city}` : "Ville non renseignée"}
                {company.contact_name ? ` • ${company.contact_name}` : ""}
              </p>
              <p className="text-sm text-ink/55">
                {company.contact_email || company.contact_phone || company.siret || "Aucun contact renseigné"}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
