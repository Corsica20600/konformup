"use client";

import { useMemo, useState } from "react";
import { CompanyList } from "@/components/companies/company-list";
import { CreateCompanyForm } from "@/components/companies/create-company-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { filterCompanyDirectory, sortCompanyDirectory } from "@/lib/company-directory";
import type { ClientCompanyDirectoryItem } from "@/lib/types";

export function CompanyDirectory({ companies }: { companies: ClientCompanyDirectoryItem[] }) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredCompanies = useMemo(
    () => filterCompanyDirectory(sortCompanyDirectory(companies), searchTerm),
    [companies, searchTerm]
  );

  return (
    <div className="grid gap-8">
      <header className="flex flex-col gap-5 border-b border-ink/10 pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine">Fichier clients</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Sociétés clientes</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink/70">
            Gérez les entreprises clientes utilisées pour les devis, sessions et documents.
          </p>
        </div>
        <Button
          type="button"
          className="min-h-11 self-start px-5 md:self-auto"
          aria-expanded={isCreateFormOpen}
          aria-controls="new-company-form"
          onClick={() => setIsCreateFormOpen((isOpen) => !isOpen)}
        >
          {isCreateFormOpen ? "Fermer le formulaire" : "Nouvelle société"}
        </Button>
      </header>

      {isCreateFormOpen ? (
        <Card className="border border-ink/10">
          <div id="new-company-form">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine">Nouvelle société</p>
            <h2 className="mt-2 text-2xl font-bold">Créer une société cliente</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Renseignez uniquement les informations disponibles. Elles pourront être complétées depuis la fiche société.
            </p>
            <div className="mt-6">
              <CreateCompanyForm onCancel={() => setIsCreateFormOpen(false)} />
            </div>
          </div>
        </Card>
      ) : null}

      <section aria-labelledby="company-list-title" className="grid gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="company-list-title" className="text-2xl font-bold text-ink">Votre fichier clients</h2>
            <p className="mt-1 text-sm text-ink/65">
              {companies.length} société{companies.length === 1 ? "" : "s"} enregistrée{companies.length === 1 ? "" : "s"}
            </p>
          </div>
          <label className="flex w-full max-w-md flex-col gap-2 text-sm font-semibold text-ink/80">
            <span>Rechercher une société</span>
            <div className="flex gap-2">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nom, ville, email ou SIRET"
                className="min-w-0 flex-1 rounded-[8px] border border-ink/15 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/15"
              />
              {searchTerm ? (
                <Button type="button" variant="secondary" onClick={() => setSearchTerm("")}>
                  Effacer
                </Button>
              ) : null}
            </div>
          </label>
        </div>

        <CompanyList
          companies={filteredCompanies}
          emptyMessage={searchTerm ? `Aucune société ne correspond à « ${searchTerm} ».` : undefined}
        />
      </section>
    </div>
  );
}
