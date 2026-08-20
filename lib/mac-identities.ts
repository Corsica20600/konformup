import "server-only";

import { AuthorizationError, assertCanAccessCandidate, requireAuthenticatedUser } from "@/lib/auth";
import { calculateMacDates } from "@/lib/mac-sst-reminders";
import type { MacIdentityOption } from "@/lib/mac-identity-presentation";

type IdentitySessionRow = { id: string; session_id: string | null; training_sessions: { id: string; title: string; end_date: string; training_type: string } | { id: string; title: string; end_date: string; training_type: string }[] | null };

export type MacIdentitySummary = {
  id: string;
  status: "active" | "merged";
  mergedIntoIdentityId: string | null;
  verifiedAt: string | null;
  candidateCount: number;
  candidateIds: string[];
  operations: Array<{ id: string; operationType: string; reason: string | null; createdAt: string }>;
  sessions: Array<{ id: string; title: string; endDate: string; trainingType: string }>;
  macDueDate: string | null;
};

export async function getMacIdentityForCandidate(candidateId: string): Promise<MacIdentitySummary | null> {
  const { supabase } = await assertCanAccessCandidate(candidateId);
  const { data: candidate } = await supabase.from("candidates").select("mac_identity_id").eq("id", candidateId).maybeSingle();
  if (!candidate?.mac_identity_id) return null;
  const { data: identity, error } = await supabase
    .from("candidate_mac_identities")
    .select("id, status, merged_into_identity_id, verified_at")
    .eq("id", candidate.mac_identity_id)
    .maybeSingle();
  if (error || !identity) return null;
  const [{ data: candidates }, { data: operations }] = await Promise.all([
    supabase.from("candidates").select("id, session_id, training_sessions(id, title, end_date, training_type)").eq("mac_identity_id", identity.id),
    supabase.from("candidate_mac_identity_operations").select("id, operation_type, reason, created_at").or(`source_identity_id.eq.${identity.id},target_identity_id.eq.${identity.id}`).order("created_at", { ascending: false })
  ]);
  const sessions = ((candidates ?? []) as unknown as IdentitySessionRow[])
    .map((item) => Array.isArray(item.training_sessions) ? item.training_sessions[0] ?? null : item.training_sessions)
    .filter((item): item is { id: string; title: string; end_date: string; training_type: string } => Boolean(item))
    .sort((left, right) => right.end_date.localeCompare(left.end_date));
  const latestSst = sessions.find((item) => item.training_type === "sst_initial" || item.training_type === "mac_sst") ?? null;
  return {
    id: identity.id,
    status: identity.status === "merged" ? "merged" : "active",
    mergedIntoIdentityId: identity.merged_into_identity_id,
    verifiedAt: identity.verified_at,
    candidateCount: candidates?.length ?? 0,
    candidateIds: (candidates ?? []).map((item) => item.id),
    operations: (operations ?? []).map((item) => ({ id: item.id, operationType: item.operation_type, reason: item.reason, createdAt: item.created_at })),
    sessions: sessions.map((item) => ({ id: item.id, title: item.title, endDate: item.end_date, trainingType: item.training_type })),
    macDueDate: latestSst ? calculateMacDates(latestSst.end_date).expiryDate : null
  };
}

type IdentityOptionCandidateRow = {
  id: string;
  mac_identity_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  training_sessions: { title: string; end_date: string; training_type: string } | { title: string; end_date: string; training_type: string }[] | null;
};

export async function getActiveMacIdentitiesForAdmin(): Promise<MacIdentityOption[]> {
  const { profile, supabase } = await requireAuthenticatedUser();
  if (profile.role !== "admin") throw new AuthorizationError();
  const { data: identities, error } = await supabase
    .from("candidate_mac_identities")
    .select("id, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Les identités MAC sont temporairement indisponibles.");
  const identityIds = (identities ?? []).map((identity) => identity.id);
  if (!identityIds.length) return [];
  const { data: rows, error: candidatesError } = await supabase
    .from("candidates")
    .select("id, mac_identity_id, first_name, last_name, email, company, training_sessions(title, end_date, training_type)")
    .in("mac_identity_id", identityIds);
  if (candidatesError) throw new Error("Les identités MAC sont temporairement indisponibles.");
  const candidatesByIdentity = new Map<string, IdentityOptionCandidateRow[]>();
  for (const row of (rows ?? []) as unknown as IdentityOptionCandidateRow[]) {
    if (!row.mac_identity_id) continue;
    candidatesByIdentity.set(row.mac_identity_id, [...(candidatesByIdentity.get(row.mac_identity_id) ?? []), row]);
  }
  return identityIds.map((id) => {
    const candidates = candidatesByIdentity.get(id) ?? [];
    const sessions = candidates
      .map((candidate) => Array.isArray(candidate.training_sessions) ? candidate.training_sessions[0] ?? null : candidate.training_sessions)
      .filter((session): session is { title: string; end_date: string; training_type: string } => Boolean(session))
      .sort((left, right) => (right.end_date ?? "").localeCompare(left.end_date ?? ""));
    const representative = candidates[0] ?? null;
    const latestSession = sessions[0] ?? null;
    return {
      id,
      status: "active",
      candidateNames: candidates.map((candidate) => `${candidate.first_name} ${candidate.last_name}`.trim()).filter(Boolean),
      candidateEmail: representative?.email ?? null,
      company: representative?.company ?? null,
      latestSession: latestSession ? { title: latestSession.title, endDate: latestSession.end_date, trainingType: latestSession.training_type } : null,
      candidateCount: candidates.length
    };
  });
}

export async function linkCandidateToMacIdentity(candidateId: string, identityId: string, reason: string) {
  const { profile, supabase } = await requireAuthenticatedUser();
  if (profile.role !== "admin") throw new AuthorizationError();
  const { data, error } = await supabase.rpc("link_candidate_mac_identity", { p_candidate_id: candidateId, p_identity_id: identityId, p_reason: reason });
  if (error || !data) throw new Error("Impossible de rattacher le dossier à cette identité MAC.");
  return data;
}

export async function mergeMacIdentities(canonicalIdentityId: string, secondaryIdentityId: string, reason: string) {
  const { profile, supabase } = await requireAuthenticatedUser();
  if (profile.role !== "admin") throw new AuthorizationError();
  const { data, error } = await supabase.rpc("merge_candidate_mac_identities", { p_canonical_identity_id: canonicalIdentityId, p_secondary_identity_id: secondaryIdentityId, p_reason: reason });
  if (error || !data) throw new Error("Impossible de regrouper les identités MAC.");
  return data;
}
