import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";

export type MacReminderKind = "month_22" | "month_23";

export type MacReminderCandidate = {
  candidateId: string;
  macIdentityId: string | null;
  email: string | null;
  validationStatus: string | null;
  sessionId: string;
  trainingType: string;
  sessionStatus: string;
  closureStatus: string;
  endDate: string;
  globalResult: string | null;
};

export type MacReminderEligibility = {
  eligible: boolean;
  reason?: "identity_unverified" | "no_email" | "not_admitted" | "session_incomplete" | "not_sst" | "not_due";
  dueDate?: string;
  kinds: MacReminderKind[];
};

export function normalizeReminderEmail(email: string | null | undefined) {
  return email?.trim().toLocaleLowerCase("fr-FR") || null;
}

export function hasAmbiguousMacReminderEmail(identityId: string, email: string | null | undefined, activeIdentityEmails: Map<string, Set<string>>) {
  const normalized = normalizeReminderEmail(email);
  if (!normalized) return false;
  const identities = activeIdentityEmails.get(normalized);
  return Boolean(identities && identities.size > 1 && identities.has(identityId));
}

const monthDate = (isoDate: string, months: number) => {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const targetMonthIndex = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  return `${targetYear.toString().padStart(4, "0")}-${String(targetMonthIndex + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
};

export function calculateMacDates(certificateEndDate: string) {
  return {
    firstReminderDate: monthDate(certificateEndDate, 22),
    secondReminderDate: monthDate(certificateEndDate, 23),
    expiryDate: monthDate(certificateEndDate, 24)
  };
}

export function getMacReminderEligibility(candidate: MacReminderCandidate, today = new Date().toISOString().slice(0, 10)): MacReminderEligibility {
  if (candidate.trainingType !== "sst_initial" && candidate.trainingType !== "mac_sst") return { eligible: false, reason: "not_sst", kinds: [] };
  if (candidate.sessionStatus === "cancelled" || !["closed", "archived"].includes(candidate.closureStatus) || !candidate.endDate) return { eligible: false, reason: "session_incomplete", kinds: [] };
  if (candidate.validationStatus !== "validated" || candidate.globalResult !== "admis") return { eligible: false, reason: "not_admitted", kinds: [] };
  if (!candidate.macIdentityId) return { eligible: false, reason: "identity_unverified", kinds: [] };
  if (!candidate.email?.trim()) return { eligible: false, reason: "no_email", kinds: [] };
  const dates = calculateMacDates(candidate.endDate);
  if (!dates.firstReminderDate || !dates.secondReminderDate || !dates.expiryDate) return { eligible: false, reason: "session_incomplete", kinds: [] };
  const kinds: MacReminderKind[] = [];
  if (today >= dates.firstReminderDate && today < dates.secondReminderDate) kinds.push("month_22");
  if (today >= dates.secondReminderDate && today < dates.expiryDate) kinds.push("month_23");
  return kinds.length ? { eligible: true, dueDate: dates.expiryDate, kinds } : { eligible: false, reason: "not_due", dueDate: dates.expiryDate, kinds: [] };
}

function reminderKey(identityId: string, sessionId: string, kind: MacReminderKind) {
  return createHash("sha256").update(`${identityId}:${sessionId}:${kind}`).digest("hex");
}

function cleanTechnicalError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 240) : "Échec de livraison";
}

export async function runMacSstReminderCron(today = new Date().toISOString().slice(0, 10)) {
  const supabase = createAdminClient();
  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("id, training_type, status, closure_status, end_date")
    .in("training_type", ["sst_initial", "mac_sst"])
    .in("closure_status", ["closed", "archived"])
    .neq("status", "cancelled");
  if (error) throw new Error("Impossible de préparer les rappels MAC.");

  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: candidates } = sessionIds.length
    ? await supabase.from("candidates").select("id, session_id, email, validation_status, mac_identity_id").in("session_id", sessionIds)
    : { data: [] as Array<{ id: string; session_id: string | null; email: string | null; validation_status: string | null; mac_identity_id: string | null }> };
  const { data: identities } = await supabase
    .from("candidate_mac_identities")
    .select("id, status, merged_into_identity_id");
  const activeIdentityIds = new Set((identities ?? []).filter((identity) => identity.status === "active").map((identity) => identity.id));
  const canonicalIdentityId = (identityId: string | null) => {
    if (!identityId) return null;
    const identity = (identities ?? []).find((item) => item.id === identityId);
    return identity?.status === "merged" ? identity.merged_into_identity_id : identityId;
  };
  const { data: allCandidateEmails } = await supabase
    .from("candidates")
    .select("email, mac_identity_id");
  const activeIdentityEmails = new Map<string, Set<string>>();
  for (const item of allCandidateEmails ?? []) {
    if (!item.mac_identity_id || !activeIdentityIds.has(item.mac_identity_id)) continue;
    const email = normalizeReminderEmail(item.email);
    if (!email) continue;
    const values = activeIdentityEmails.get(email) ?? new Set<string>();
    values.add(item.mac_identity_id);
    activeIdentityEmails.set(email, values);
  }
  const { data: historicalReminders } = await supabase
    .from("mac_sst_reminders")
    .select("mac_identity_id, reference_session_id, reminder_kind, status");
  const candidateIds = (candidates ?? []).map((candidate) => candidate.id);
  const { data: evaluations } = candidateIds.length
    ? await supabase.from("candidate_evaluations").select("candidate_id, result, evaluated_at, session_id").eq("evaluation_type", "globale").in("candidate_id", candidateIds)
    : { data: [] as Array<{ candidate_id: string; result: string; evaluated_at: string | null; session_id: string }> };
  const sessionById = new Map((sessions ?? []).map((session) => [session.id, session]));
  const latestByIdentity = new Map<string, string>();
  for (const candidate of candidates ?? []) {
    const session = candidate.session_id ? sessionById.get(candidate.session_id) : null;
    if (!candidate.mac_identity_id || !session || !activeIdentityIds.has(candidate.mac_identity_id)) continue;
    const result = [...(evaluations ?? [])]
      .filter((evaluation) => evaluation.candidate_id === candidate.id && evaluation.session_id === session.id)
      .sort((a, b) => (b.evaluated_at ?? "").localeCompare(a.evaluated_at ?? ""))[0]?.result;
    // Only a completed and admitted SST session renews the legal reference date.
    if (candidate.validation_status !== "validated" || result !== "admis" || session.status === "cancelled" || !["closed", "archived"].includes(session.closure_status)) continue;
    const current = latestByIdentity.get(candidate.mac_identity_id);
    if (!current || (sessionById.get(current)?.end_date ?? "") < session.end_date) latestByIdentity.set(candidate.mac_identity_id, session.id);
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  for (const candidate of candidates ?? []) {
      const session = candidate.session_id ? sessionById.get(candidate.session_id) : null;
      if (!session) { skipped += 1; continue; }
      // A later validated initial/MAC SST for the same known recipient supersedes the prior certificate.
      if (candidate.mac_identity_id && latestByIdentity.get(candidate.mac_identity_id) !== session.id) { skipped += 1; continue; }
      const globalResult = [...(evaluations ?? [])].filter((evaluation) => evaluation.candidate_id === candidate.id && evaluation.session_id === session.id).sort((a, b) => (b.evaluated_at ?? "").localeCompare(a.evaluated_at ?? ""))[0]?.result ?? null;
      const eligibility = getMacReminderEligibility({ candidateId: candidate.id, macIdentityId: candidate.mac_identity_id, email: candidate.email, validationStatus: candidate.validation_status, sessionId: session.id, trainingType: session.training_type, sessionStatus: session.status, closureStatus: session.closure_status, endDate: session.end_date, globalResult }, today);
      if (!eligibility.eligible || !eligibility.dueDate) {
        if (eligibility.reason === "identity_unverified") {
          const key = reminderKey(candidate.id, session.id, "month_22");
          await supabase.from("mac_sst_reminders").upsert({ candidate_id: candidate.id, mac_identity_id: null, reference_session_id: session.id, certificate_end_date: session.end_date, mac_due_date: calculateMacDates(session.end_date).expiryDate ?? session.end_date, reminder_kind: "month_22", recipient_email: candidate.email?.trim() || null, status: "skipped", idempotency_key: key, technical_error: "Vérification administrative requise : identité MAC non reliée." }, { onConflict: "idempotency_key", ignoreDuplicates: true });
        }
        skipped += 1; continue;
      }
      if (hasAmbiguousMacReminderEmail(candidate.mac_identity_id!, candidate.email, activeIdentityEmails)) {
        for (const kind of eligibility.kinds) {
          const key = reminderKey(candidate.mac_identity_id!, session.id, kind);
          await supabase.from("mac_sst_reminders").upsert({ candidate_id: candidate.id, mac_identity_id: candidate.mac_identity_id, reference_session_id: session.id, certificate_end_date: session.end_date, mac_due_date: eligibility.dueDate, reminder_kind: kind, recipient_email: normalizeReminderEmail(candidate.email), status: "skipped", idempotency_key: key, technical_error: "Plusieurs identités utilisent cette adresse — vérification administrative requise." }, { onConflict: "idempotency_key", ignoreDuplicates: true });
        }
        skipped += 1;
        continue;
      }
      for (const kind of eligibility.kinds) {
        const recipient = normalizeReminderEmail(candidate.email)!;
        const key = reminderKey(candidate.mac_identity_id!, session.id, kind);
        const canonicalIdentity = canonicalIdentityId(candidate.mac_identity_id);
        const alreadySentForMergedIdentity = (historicalReminders ?? []).some((item) => item.status === "sent" && item.reference_session_id === session.id && item.reminder_kind === kind && canonicalIdentityId(item.mac_identity_id) === canonicalIdentity);
        if (alreadySentForMergedIdentity) { skipped += 1; continue; }
        const { data: reminder } = await supabase.from("mac_sst_reminders").upsert({ candidate_id: candidate.id, mac_identity_id: candidate.mac_identity_id, reference_session_id: session.id, certificate_end_date: session.end_date, mac_due_date: eligibility.dueDate, reminder_kind: kind, recipient_email: recipient, idempotency_key: key }, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("id, status").maybeSingle();
        const { data: existing } = reminder?.id ? { data: reminder } : await supabase.from("mac_sst_reminders").select("id, status").eq("idempotency_key", key).maybeSingle();
        if (!existing || existing.status === "sent") { skipped += 1; continue; }
        const { data: claimed } = await supabase.rpc("claim_mac_sst_reminder", { p_id: existing.id });
        if (!claimed) { skipped += 1; continue; }
        try {
          const context = await getTransactionalEmailContext();
          await sendBrevoTransactionalEmail({ context, to: [{ email: recipient }], subject: "Rappel : renouvellement de votre certificat SST", textContent: `Votre certificat SST arrive à échéance le ${eligibility.dueDate}. Contactez Konform’up pour organiser votre MAC SST.`, errorLabel: "le rappel MAC SST" });
          await supabase.from("mac_sst_reminders").update({ status: "sent", sent_at: new Date().toISOString(), technical_error: null }).eq("id", existing.id);
          await supabase.from("mac_sst_reminder_attempts").insert({ reminder_id: existing.id, status: "sent", sent_at: new Date().toISOString() });
          sent += 1;
        } catch (sendError) {
          const technicalError = cleanTechnicalError(sendError);
          await supabase.from("mac_sst_reminders").update({ status: "error", technical_error: technicalError }).eq("id", existing.id);
          await supabase.from("mac_sst_reminder_attempts").insert({ reminder_id: existing.id, status: "error", technical_error: technicalError });
          errors += 1;
        }
      }
  }
  return { sent, skipped, errors };
}

export async function getMacSstReminderStatusForCandidate(candidateId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mac_sst_reminders")
    .select("id, reference_session_id, mac_due_date, reminder_kind, status, last_attempt_at, sent_at, technical_error")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });
  if (error) return { reminders: [], error: "Les rappels MAC sont temporairement indisponibles." };
  return { reminders: data ?? [], error: null };
}
