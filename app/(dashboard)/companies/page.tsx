import type { Metadata } from "next";
import { CompanyDirectory } from "@/components/companies/company-directory";
import { getClientCompanyDirectory } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sociétés clientes"
};

export default async function CompaniesPage() {
  const companies = await getClientCompanyDirectory();

  return (
    <main>
      <CompanyDirectory companies={companies} />
    </main>
  );
}
