export type MacIdentityOption = {
  id: string;
  status: "active" | "merged";
  candidateNames: string[];
  candidateEmail: string | null;
  company: string | null;
  latestSession: { title: string | null; endDate: string | null; trainingType: string | null } | null;
  candidateCount: number;
};

const missing = "Non renseigné";

function trainingTypeLabel(trainingType: string | null) {
  if (trainingType === "sst_initial") return "SST initiale";
  if (trainingType === "mac_sst") return "MAC SST";
  return missing;
}

function dateLabel(value: string | null) {
  if (!value) return missing;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? missing : date.toLocaleDateString("fr-FR");
}

export function macIdentityOptionLabel(identity: MacIdentityOption) {
  const candidate = identity.candidateNames.filter(Boolean).join(", ") || missing;
  const session = identity.latestSession;
  const sessionLabel = session
    ? `${session.title || missing} — ${trainingTypeLabel(session.trainingType)} ${dateLabel(session.endDate)}`
    : missing;
  return `${candidate} — ${identity.candidateEmail || missing} — ${identity.company || missing} — ${sessionLabel} — ${identity.candidateCount} dossier${identity.candidateCount > 1 ? "s" : ""} — …${identity.id.slice(-6)}`;
}

export function matchesMacIdentitySearch(identity: MacIdentityOption, search: string) {
  const normalized = search.trim().toLocaleLowerCase("fr-FR");
  if (!normalized) return true;
  return [
    ...identity.candidateNames,
    identity.candidateEmail,
    identity.company,
    identity.latestSession?.title,
    identity.latestSession?.trainingType === "sst_initial" ? "sst initiale" : identity.latestSession?.trainingType === "mac_sst" ? "mac sst" : identity.latestSession?.trainingType,
    identity.id.slice(-6)
  ].some((value) => value?.toLocaleLowerCase("fr-FR").includes(normalized));
}

export function isMacIdentitySuggestion(identity: MacIdentityOption, candidate: { name: string; email: string | null }) {
  const normalizedEmail = candidate.email?.trim().toLocaleLowerCase("fr-FR");
  const normalizedName = candidate.name.trim().toLocaleLowerCase("fr-FR");
  if (normalizedEmail && identity.candidateEmail?.trim().toLocaleLowerCase("fr-FR") === normalizedEmail) return "Même email : vérification administrative requise";
  if (normalizedName && identity.candidateNames.some((name) => name.trim().toLocaleLowerCase("fr-FR") === normalizedName)) return "Même nom : vérification administrative requise";
  return null;
}

export function selectableMacIdentities(identities: MacIdentityOption[], currentIdentityId: string | null, search: string) {
  return identities.filter((identity) => identity.status === "active" && identity.id !== currentIdentityId && matchesMacIdentitySearch(identity, search));
}
