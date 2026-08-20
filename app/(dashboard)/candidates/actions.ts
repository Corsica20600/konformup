"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/lib/auth";
import { linkCandidateToMacIdentity, mergeMacIdentities } from "@/lib/mac-identities";

export type MacIdentityActionState = { success?: string; error?: string };

function formUuid(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stringValue) ? stringValue : null;
}

export async function linkCandidateMacIdentityAction(_: MacIdentityActionState, formData: FormData): Promise<MacIdentityActionState> {
  const candidateId = formUuid(formData.get("candidateId"));
  const identityId = formUuid(formData.get("identityId"));
  const reason = typeof formData.get("reason") === "string" ? String(formData.get("reason")).trim() : "";
  const confirmed = formData.get("confirmed") === "true";
  if (!candidateId || !identityId || !reason || !confirmed) return { error: "Identité, motif administratif et confirmation requis." };
  try {
    await linkCandidateToMacIdentity(candidateId, identityId, reason);
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath("/candidates");
    return { success: "Dossier rattaché à l’identité MAC sélectionnée." };
  } catch (error) {
    return { error: error instanceof AuthorizationError ? "Seul un administrateur peut rattacher une identité MAC." : "Le rattachement n’a pas pu être enregistré." };
  }
}

export async function mergeMacIdentitiesAction(_: MacIdentityActionState, formData: FormData): Promise<MacIdentityActionState> {
  const canonicalIdentityId = formUuid(formData.get("canonicalIdentityId"));
  const secondaryIdentityId = formUuid(formData.get("secondaryIdentityId"));
  const candidateId = formUuid(formData.get("candidateId"));
  const reason = typeof formData.get("reason") === "string" ? String(formData.get("reason")).trim() : "";
  const confirmed = formData.get("confirmed") === "true";
  if (!canonicalIdentityId || !secondaryIdentityId || !candidateId || !reason || !confirmed) return { error: "Identités, motif administratif et confirmation requis." };
  try {
    await mergeMacIdentities(canonicalIdentityId, secondaryIdentityId, reason);
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath("/candidates");
    return { success: "Identités MAC regroupées. L’historique est conservé." };
  } catch (error) {
    return { error: error instanceof AuthorizationError ? "Seul un administrateur peut regrouper des identités MAC." : "Le regroupement n’a pas pu être enregistré." };
  }
}
