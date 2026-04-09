"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createQuoteAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildDefaultQuoteDescription, buildDefaultQuoteTitle, computeQuoteTotalTtc } from "@/lib/quote-utils";
import { formatCurrency, formatDateRange } from "@/lib/utils";

type QuoteCompanyOption = {
  id: string;
  company_name: string;
  candidateCount: number;
};

const initialState: ActionState = {};

export function CreateQuoteForm({
  sessionId,
  sessionTitle,
  startDate,
  endDate,
  location,
  companies
}: {
  sessionId?: string | null;
  sessionTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  companies: QuoteCompanyOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createQuoteAction, initialState);
  const defaultCompanyId = companies.find((company) => company.candidateCount > 0)?.id ?? companies[0]?.id ?? "";
  const initialCandidateCount = companies.find((company) => company.id === defaultCompanyId)?.candidateCount ?? 0;
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultCompanyId);
  const [title, setTitle] = useState(buildDefaultQuoteTitle(sessionTitle || "Nouvelle prestation"));
  const [description, setDescription] = useState(
    buildDefaultQuoteDescription({
      sessionTitle: sessionTitle || "Prestation de formation",
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      location: location ?? null,
      candidateCount: initialCandidateCount
    })
  );
  const [candidateCount, setCandidateCount] = useState(String(initialCandidateCount));
  const [priceHt, setPriceHt] = useState("");
  const [vatRate, setVatRate] = useState("20");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state.success]);

  const totalTtc = computeQuoteTotalTtc(Number(priceHt || 0), Number(vatRate || 0));

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const nextCount = companies.find((company) => company.id === companyId)?.candidateCount ?? 0;
    setCandidateCount(String(nextCount));
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Devis</p>
          <p className="mt-1 text-sm text-ink/65">Créer un devis PDF lié à une société, avec ou sans session.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIsOpen((open) => !open)}>
          {isOpen ? "Masquer le formulaire" : "Créer un devis"}
        </Button>
      </div>

      {isOpen ? (
        companies.length ? (
          <form action={formAction} className="grid gap-4 rounded-[24px] border border-ink/10 bg-canvas/60 p-4 md:grid-cols-2">
            <input type="hidden" name="sessionId" value={sessionId ?? ""} />

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
              <span>Société</span>
              <select
                name="companyId"
                value={selectedCompanyId}
                onChange={(event) => handleCompanyChange(event.target.value)}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm"
                required
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </label>

            {sessionTitle ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
                <span>Session</span>
                <input
                  value={sessionTitle}
                  disabled
                  className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm disabled:text-ink"
                />
              </label>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/10 bg-white px-4 py-3 text-sm text-ink/65">
                Devis sans session planifiée
              </div>
            )}

            <Input
              label="Nombre de candidats"
              name="candidateCount"
              type="number"
              min="0"
              step="1"
              value={candidateCount}
              onChange={(event) => setCandidateCount(event.target.value)}
              required
            />

            {sessionTitle ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-ink/80">
                <span>Dates / lieu</span>
                <input
                  value={`${formatDateRange(startDate ?? null, endDate ?? null)} • ${location || "Lieu à confirmer"}`}
                  disabled
                  className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm disabled:text-ink"
                />
              </label>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink/10 bg-white px-4 py-3 text-sm text-ink/65">
                Les dates et le lieu pourront être renseignés plus tard.
              </div>
            )}

            <div className="md:col-span-2">
              <Input label="Intitulé" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Description</span>
              <textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
              />
            </label>

            <Input
              label="Prix HT"
              name="priceHt"
              type="number"
              min="0"
              step="0.01"
              placeholder="1200"
              value={priceHt}
              onChange={(event) => setPriceHt(event.target.value)}
              required
            />

            <Input
              label="Taux de TVA"
              name="vatRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="20"
              value={vatRate}
              onChange={(event) => setVatRate(event.target.value)}
              required
            />

            <label className="flex flex-col gap-2 text-sm font-medium text-ink/80 md:col-span-2">
              <span>Notes</span>
              <textarea
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-pine"
              />
            </label>

            <div className="rounded-2xl border border-pine/15 bg-white px-4 py-3 md:col-span-2">
              <p className="text-sm font-semibold text-ink">Total TTC estimé</p>
              <p className="mt-1 text-xl font-bold text-pine">{formatCurrency(totalTtc)}</p>
            </div>

            {state.error ? <p className="text-sm text-accent md:col-span-2">{state.error}</p> : null}
            {state.success ? (
              <div className="flex flex-wrap items-center gap-3 text-sm text-pine md:col-span-2">
                <p>{state.success}</p>
                {state.fileUrl ? (
                  <Link href={state.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-pine">
                    Ouvrir le PDF
                  </Link>
                ) : null}
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Génération..." : "Générer le devis PDF"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-[24px] border border-ink/10 bg-canvas/60 p-4 text-sm text-ink/65">
            Aucune société cliente n’est disponible pour créer un devis.
          </div>
        )
      ) : null}
    </div>
  );
}
