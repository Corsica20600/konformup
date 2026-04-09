import { CreateCompanyForm } from "@/components/companies/create-company-form";
import { CompanyList } from "@/components/companies/company-list";
import { Card } from "@/components/ui/card";
import { getClientCompanies } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await getClientCompanies();

  return (
    <main className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Nouvelle société</p>
        <h2 className="mt-2 text-2xl font-bold">Créer une société cliente</h2>
        <p className="mt-2 text-sm text-ink/65">
          Prépare le socle commercial et documentaire pour les futurs devis et conventions.
        </p>
        <div className="mt-6">
          <CreateCompanyForm />
        </div>
      </Card>

      <section className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Sociétés</p>
          <h2 className="mt-2 text-2xl font-bold">Liste des sociétés clientes</h2>
        </div>
        <CompanyList companies={companies} />
      </section>
    </main>
  );
}
