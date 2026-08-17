import { describe, expect, it } from "vitest";
import {
  filterCompanyDirectory,
  getCompanyContactName,
  isLikelyTestCompany,
  sortCompanyDirectory
} from "@/lib/company-directory";
import type { ClientCompanyDirectoryItem } from "@/lib/types";

function company(overrides: Partial<ClientCompanyDirectoryItem>): ClientCompanyDirectoryItem {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    company_name: "Entreprise Exemple",
    contact_first_name: null,
    contact_last_name: null,
    contact_email: null,
    contact_phone: null,
    address: null,
    postal_code: null,
    city: null,
    country: null,
    siret: null,
    notes: null,
    created_at: "2026-08-17T00:00:00.000Z",
    updated_at: "2026-08-17T00:00:00.000Z",
    quote_count: 0,
    session_count: 0,
    ...overrides
  };
}

describe("company directory", () => {
  const companies = [
    company({ company_name: "École Horizon", city: "Ajaccio", contact_email: "contact@horizon.fr" }),
    company({
      id: "00000000-0000-0000-0000-000000000002",
      company_name: "Atelier Santé",
      city: "Bastia",
      siret: "12345678901234",
      contact_first_name: "Camille",
      contact_last_name: "Rossi"
    })
  ];

  it("searches by name, city, email, SIRET and contact without accent sensitivity", () => {
    expect(filterCompanyDirectory(companies, "ecole")).toHaveLength(1);
    expect(filterCompanyDirectory(companies, "bastia")).toHaveLength(1);
    expect(filterCompanyDirectory(companies, "horizon.fr")).toHaveLength(1);
    expect(filterCompanyDirectory(companies, "123456")).toHaveLength(1);
    expect(filterCompanyDirectory(companies, "camille rossi")).toHaveLength(1);
  });

  it("keeps test companies but sorts them after client records", () => {
    const testCompany = company({
      id: "00000000-0000-0000-0000-000000000003",
      company_name: "TEST CONTROLE RLS 2026-08-17"
    });
    const sorted = sortCompanyDirectory([testCompany, ...companies]);

    expect(isLikelyTestCompany(testCompany)).toBe(true);
    expect(sorted.at(-1)?.id).toBe(testCompany.id);
  });

  it("builds the contact name from the structured fields", () => {
    expect(getCompanyContactName(companies[1])).toBe("Camille Rossi");
  });
});
