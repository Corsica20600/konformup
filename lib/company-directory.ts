import type { ClientCompanyDirectoryItem } from "@/lib/types";

function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

export function getCompanyContactName(company: ClientCompanyDirectoryItem) {
  return [company.contact_first_name, company.contact_last_name].filter(Boolean).join(" ").trim();
}

export function isLikelyTestCompany(company: ClientCompanyDirectoryItem) {
  return /(?:^|\s)(test|controle rls|demo)(?:\s|$)/i.test(normalizeSearchValue(company.company_name));
}

export function filterCompanyDirectory(companies: ClientCompanyDirectoryItem[], searchTerm: string) {
  const normalizedTerm = normalizeSearchValue(searchTerm);

  if (!normalizedTerm) {
    return companies;
  }

  return companies.filter((company) =>
    [
      company.company_name,
      company.city,
      company.contact_email,
      company.siret,
      getCompanyContactName(company)
    ].some((value) => normalizeSearchValue(value).includes(normalizedTerm))
  );
}

export function sortCompanyDirectory(companies: ClientCompanyDirectoryItem[]) {
  return [...companies].sort((left, right) => {
    const testDifference = Number(isLikelyTestCompany(left)) - Number(isLikelyTestCompany(right));

    if (testDifference !== 0) {
      return testDifference;
    }

    return left.company_name.localeCompare(right.company_name, "fr", { sensitivity: "base" });
  });
}
