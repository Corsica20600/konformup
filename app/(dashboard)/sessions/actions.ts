"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createDocument,
  getOrCreateDocument,
  getLatestGeneratedDocumentByType,
  regenerateGeneratedDocument,
  type SupportedGeneratedDocumentType
} from "@/lib/generated-documents";
import { closeAttendanceSlot, sendAttendanceSlotRequests } from "@/lib/attendance";
import { buildParisDateTimeIso, isValidAttendanceTimeRange } from "@/lib/attendance-schedule";
import { sendCandidateDocumentEmail, sendCandidateSessionDocumentsEmail } from "@/lib/candidate-document-email";
import { sendTrainingAgreementEmail } from "@/lib/training-agreement-email";
import { sendAttestationToSessionCompany } from "@/lib/company-attestation-email";
import { createQuote, duplicateQuote, getQuoteForEdit, updateQuoteStatus } from "@/lib/quotes";
import { isQuoteStatus, QUOTE_STATUS_LABELS } from "@/lib/quote-status";
import { createTrainingAgreementDocumentForQuote } from "@/lib/training-agreements";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  deriveCandidateValidationStatus,
  deriveEvaluationStatusFromResult,
  shouldSyncCandidateStatus
} from "@/lib/evaluations";
import {
  calculateSessionClosureSummary,
  getForprevStatusForCandidate,
  getSessionClosureReadiness
} from "@/lib/session-closure";
import { initializeSessionModuleProgress } from "@/lib/session-modules";
import { getSessionById } from "@/lib/queries";
import { createOrGetSessionArchive } from "@/lib/session-archives";
import { getTrainingDocumentTitle } from "@/lib/training-programs";
import {
  createCandidateSchema,
  createQuoteSchema,
  createSessionSchema,
  updateCandidateSchema,
  updateSessionSchema,
  updateSessionClosureSchema,
  upsertCandidateEvaluationSchema
} from "@/lib/validation";
import {
  ensureCandidateAideMemoireDocument,
  ensureCandidatePreTrainingDocuments
} from "@/lib/candidate-pre-training-documents";

export type ActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
  documentResults?: Array<{ candidateName: string; status: "generated" | "existing" }>;
};

export async function prepareMissingSessionDocumentsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const sessionId = formData.get("sessionId")?.toString().trim();
  if (!sessionId) return { error: "Session manquante." };
  try {
    const sessionData = await getSessionById(sessionId);
    let failures = 0;
    for (const candidate of sessionData.candidates) {
      try {
        await ensureCandidatePreTrainingDocuments({ sessionId, candidateId: candidate.candidate.id, trainingType: sessionData.session.training_type });
      } catch (error) {
        failures += 1;
        console.error("[prepare-session-documents] candidate preparation failed", { sessionId, candidateId: candidate.candidate.id, message: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    revalidatePath(`/sessions/${sessionId}`);
    return { success: failures ? `Préparation terminée avec ${failures} erreur(s).` : "Les documents avant formation manquants ont été préparés." };
  } catch {
    return { error: "Impossible de préparer les documents avant formation." };
  }
}

export async function sendMissingSessionDocumentsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const sessionId = formData.get("sessionId")?.toString().trim();
  const confirmed = formData.get("confirmed")?.toString() === "true";
  if (!sessionId || !confirmed) return { error: "Une confirmation explicite est nécessaire avant l’envoi." };
  try {
    const sessionData = await getSessionById(sessionId);
    const selectedCandidateIds = new Set(formData.getAll("candidateId").map((value) => value.toString()));
    let sent = 0;
    let skipped = 0;
    let failures = 0;
    for (const candidate of sessionData.candidates) {
      if (!selectedCandidateIds.has(candidate.candidate.id)) continue;
      if (!candidate.candidate.email) { skipped += 1; continue; }
      try {
        const result = await sendCandidateSessionDocumentsEmail(candidate.candidate.id, sessionId, { onlyUnsent: true });
        if (result.skipped) skipped += 1; else sent += 1;
      } catch (error) {
        failures += 1;
        console.error("[send-session-documents] candidate email failed", { sessionId, candidateId: candidate.candidate.id, message: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    revalidatePath(`/sessions/${sessionId}`);
    return { success: `${sent} envoi(s) effectué(s), ${skipped} ignoré(s) et ${failures} erreur(s).` };
  } catch {
    return { error: "Impossible de préparer l’envoi des documents avant formation." };
  }
}

function buildCandidateSignature({
  first_name,
  last_name,
  email
}: {
  first_name: string;
  last_name: string;
  email: string | null;
}) {
  return [first_name.trim().toLowerCase(), last_name.trim().toLowerCase(), (email ?? "").trim().toLowerCase()].join("::");
}

async function resolveCandidateCompanyLabel(companyId: string | null, fallbackLabel: string | null) {
  if (!companyId) {
    return fallbackLabel;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_companies")
    .select("company_name")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    return fallbackLabel;
  }

  return data?.company_name ?? fallbackLabel;
}

async function resolveTrainerDisplayName(trainerId: string | null) {
  if (!trainerId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trainers")
    .select("first_name, last_name")
    .eq("id", trainerId)
    .maybeSingle<{ first_name: string; last_name: string }>();

  if (error || !data) {
    throw new Error("Formateur introuvable.");
  }

  return `${data.first_name} ${data.last_name}`.trim();
}

export async function createSessionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = createSessionSchema.safeParse({
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    trainerId: formData.get("trainerId"),
    durationHours: formData.get("durationHours") || undefined,
    trainingType: formData.get("trainingType"),
    prerequisites: formData.get("prerequisites"),
    objectives: formData.get("objectives"),
    programmeOutline: formData.get("programmeOutline"),
    accessibilityDetails: formData.get("accessibilityDetails"),
    macPreviousCertificateDate: formData.get("macPreviousCertificateDate"),
    macPreviousCertificateRef: formData.get("macPreviousCertificateRef"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const { profile } = await requireUser();
  const supabase = await createClient();
  const trainerId = parsed.data.trainerId.trim() || null;
  let trainerName: string | null = null;

  try {
    trainerName = await resolveTrainerDisplayName(trainerId);
  } catch {
    return { error: "Le formateur sélectionné est introuvable." };
  }

  const { data: session, error } = await supabase
    .from("training_sessions")
    .insert({
      title: getTrainingDocumentTitle(parsed.data.trainingType, parsed.data.title),
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      location: parsed.data.location,
      status: parsed.data.status,
      training_type: parsed.data.trainingType,
      training_family: parsed.data.trainingType === "hygiene" ? "hygiene" : "sst",
      trainer_user_id: profile.id,
      trainer_id: trainerId,
      trainer_name: trainerName,
      duration_hours: parsed.data.durationHours ?? null,
      prerequisites: parsed.data.prerequisites.trim() || null,
      objectives: parsed.data.objectives.trim() || null,
      programme_outline: parsed.data.programmeOutline.trim() || null,
      accessibility_details: parsed.data.accessibilityDetails.trim() || null,
      mac_previous_certificate_date:
        parsed.data.trainingType === "mac_sst" ? parsed.data.macPreviousCertificateDate.trim() || null : null,
      mac_previous_certificate_ref:
        parsed.data.trainingType === "mac_sst" ? parsed.data.macPreviousCertificateRef.trim() || null : null
    })
    .select("id")
    .single();

  if (error || !session) {
    return { error: "Impossible de créer la session." };
  }

  try {
    await initializeSessionModuleProgress(session.id);
  } catch {
    return { error: "Session créée, mais la progression des modules n'a pas pu être initialisée." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  return { success: "Session créée." };
}

export async function updateSessionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const parsed = updateSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    durationHours: formData.get("durationHours"),
    trainingType: formData.get("trainingType"),
    prerequisites: formData.get("prerequisites"),
    objectives: formData.get("objectives"),
    programmeOutline: formData.get("programmeOutline"),
    accessibilityDetails: formData.get("accessibilityDetails"),
    macPreviousCertificateDate: formData.get("macPreviousCertificateDate"),
    macPreviousCertificateRef: formData.get("macPreviousCertificateRef"),
    trainerId: formData.get("trainerId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  try {
    const trainerId = parsed.data.trainerId?.trim() || null;
    const trainerName = await resolveTrainerDisplayName(trainerId);
    const supabase = await createClient();
    const { data: session, error } = await supabase
      .from("training_sessions")
      .update({
        title: getTrainingDocumentTitle(parsed.data.trainingType, parsed.data.title),
        start_date: parsed.data.startDate,
        end_date: parsed.data.endDate,
        location: parsed.data.location,
        training_type: parsed.data.trainingType,
        training_family: parsed.data.trainingType === "hygiene" ? "hygiene" : "sst",
        duration_hours:
          parsed.data.durationHours === "" || typeof parsed.data.durationHours === "undefined"
            ? null
            : parsed.data.durationHours,
        prerequisites: parsed.data.prerequisites.trim() || null,
        objectives: parsed.data.objectives.trim() || null,
        programme_outline: parsed.data.programmeOutline.trim() || null,
        accessibility_details: parsed.data.accessibilityDetails.trim() || null,
        ...(parsed.data.trainingType === "mac_sst"
          ? {
              mac_previous_certificate_date: parsed.data.macPreviousCertificateDate.trim() || null,
              mac_previous_certificate_ref: parsed.data.macPreviousCertificateRef.trim() || null
            }
          : {}),
        trainer_id: trainerId,
        trainer_name: trainerName,
        status: parsed.data.status
      })
      .eq("id", parsed.data.sessionId)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error || !session) {
      return { error: "Impossible de mettre à jour la session." };
    }

    revalidatePath(`/sessions/${session.id}`);
    revalidatePath(`/sessions/${session.id}/edit`);
    revalidatePath("/sessions");
    revalidatePath("/dashboard");

    return { success: "Session mise a jour." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de mettre à jour la session." };
  }
}

export async function createCandidateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const parsed = createCandidateSchema.safeParse({
    sessionId: formData.get("sessionId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    company: formData.get("company"),
    companyId: formData.get("companyId"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    validationStatus: formData.get("validationStatus")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const companyLabel = await resolveCandidateCompanyLabel(parsed.data.companyId || null, parsed.data.company || null);

  const { data: candidate, error: candidateInsertError } = await supabase
    .from("candidates")
    .insert({
      session_id: parsed.data.sessionId || null,
      company_id: parsed.data.companyId || null,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email || null,
      company: companyLabel,
      phone: parsed.data.phone || null,
      job_title: parsed.data.jobTitle || null,
      address: parsed.data.address || null,
      postal_code: parsed.data.postalCode || null,
      city: parsed.data.city || null,
      validation_status: parsed.data.validationStatus,
      validated_at: parsed.data.validationStatus === "validated" ? new Date().toISOString() : null
    })
    .select("id, session_id")
    .maybeSingle<{ id: string; session_id: string | null }>();

  if (candidateInsertError) {
    return { error: "Impossible d'ajouter le candidat à la session." };
  }

  let documentPreparationWarning = false;
  if (candidate?.id && candidate.session_id) {
    try {
      const sessionData = await getSessionById(candidate.session_id);
      await ensureCandidatePreTrainingDocuments({
        sessionId: candidate.session_id,
        candidateId: candidate.id,
        trainingType: sessionData.session.training_type
      });
    } catch (error) {
      documentPreparationWarning = true;
      console.error("[candidate-welcome-pack-error]", {
        candidateId: candidate.id,
        sessionId: candidate.session_id,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  if (parsed.data.sessionId) {
    revalidatePath(`/sessions/${parsed.data.sessionId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  return {
    success: documentPreparationWarning
      ? "Candidat ajouté. Son dossier avant formation n'a pas pu être préparé automatiquement ; vous pourrez le compléter depuis la session."
      : "Candidat ajouté."
  };
}

export async function updateCandidateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const parsed = updateCandidateSchema.safeParse({
    candidateId: formData.get("candidateId"),
    sessionId: formData.get("sessionId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    company: formData.get("company"),
    companyId: formData.get("companyId"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    validationStatus: formData.get("validationStatus")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const companyLabel = await resolveCandidateCompanyLabel(parsed.data.companyId || null, parsed.data.company || null);
  const { error } = await supabase
    .from("candidates")
    .update({
      company_id: parsed.data.companyId || null,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email || null,
      company: companyLabel,
      phone: parsed.data.phone || null,
      job_title: parsed.data.jobTitle || null,
      address: parsed.data.address || null,
      postal_code: parsed.data.postalCode || null,
      city: parsed.data.city || null,
      validation_status: parsed.data.validationStatus,
      validated_at: parsed.data.validationStatus === "validated" ? new Date().toISOString() : null
    })
    .eq("id", parsed.data.candidateId);

  if (error) {
    return { error: "Impossible de mettre à jour le candidat." };
  }

  if (parsed.data.sessionId) {
    revalidatePath(`/sessions/${parsed.data.sessionId}`);
  }
  revalidatePath(`/candidates/${parsed.data.candidateId}`);
  revalidatePath("/sessions");
  revalidatePath("/candidates");

  if (parsed.data.sessionId) {
    redirect(`/sessions/${parsed.data.sessionId}?candidateUpdated=1#candidats-session`);
  }

  return { success: "Candidat mis à jour." };
}

export async function upsertCandidateEvaluationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireUser();

  const parsed = upsertCandidateEvaluationSchema.safeParse({
    sessionId: formData.get("sessionId"),
    candidateId: formData.get("candidateId"),
    evaluationType: formData.get("evaluationType"),
    status: formData.get("status"),
    result: formData.get("result"),
    trainerNotes: formData.get("trainerNotes"),
    evaluatedAt: formData.get("evaluatedAt")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, session_id")
    .eq("id", parsed.data.candidateId)
    .eq("session_id", parsed.data.sessionId)
    .maybeSingle<{ id: string; session_id: string | null }>();

  if (candidateError || !candidate) {
    return { error: "Impossible de rattacher cette évaluation au candidat." };
  }

  const result = parsed.data.result;
  const status = deriveEvaluationStatusFromResult(result, parsed.data.status);
  const evaluatedAt = parsed.data.evaluatedAt
    ? new Date(`${parsed.data.evaluatedAt}T12:00:00.000Z`).toISOString()
    : new Date().toISOString();
  const validationStatus = deriveCandidateValidationStatus(result);

  const { error: evaluationError } = await supabase
    .from("candidate_evaluations")
    .upsert(
      {
        session_id: parsed.data.sessionId,
        candidate_id: parsed.data.candidateId,
        evaluation_type: parsed.data.evaluationType,
        status,
        result,
        trainer_notes: parsed.data.trainerNotes.trim() || null,
        evaluated_at: evaluatedAt,
        evaluated_by: profile.id,
        updated_at: new Date().toISOString()
      },
      { onConflict: "candidate_id,session_id,evaluation_type" }
    );

  if (evaluationError) {
    return { error: "Impossible d'enregistrer l'évaluation." };
  }

  if (shouldSyncCandidateStatus(parsed.data.evaluationType)) {
    const { error: candidateUpdateError } = await supabase
      .from("candidates")
      .update({
        validation_status: validationStatus,
        validated_at: validationStatus === "validated" ? evaluatedAt : null
      })
      .eq("id", parsed.data.candidateId)
      .eq("session_id", parsed.data.sessionId);

    if (candidateUpdateError) {
      return { error: "Évaluation enregistrée, mais le statut candidat n'a pas pu être synchronisé." };
    }
  }

  revalidatePath(`/sessions/${parsed.data.sessionId}`);
  revalidatePath(`/candidates/${parsed.data.candidateId}`);
  revalidatePath("/sessions");
  revalidatePath("/candidates");

  return { success: "Évaluation enregistrée." };
}

export async function updateSessionClosureAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireUser();
  const parsed = updateSessionClosureSchema.safeParse({
    sessionId: formData.get("sessionId"),
    closureStatus: formData.get("closureStatus"),
    trainerReport: formData.get("trainerReport"),
    administrativeObservations: formData.get("administrativeObservations")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const sessionData = await getSessionById(parsed.data.sessionId);
  const summary = calculateSessionClosureSummary(sessionData.candidates);
  const readiness = getSessionClosureReadiness(sessionData.candidates);
  const closureStatus = parsed.data.closureStatus;

  if (closureStatus === "closed" && !readiness.canClose) {
    return {
      error: `Clôture impossible : ${readiness.missingGlobalEvaluationCount} candidat(s) sans résultat global renseigné.`
    };
  }

  const supabase = await createClient();
  let archiveId: string | null = null;
  if (closureStatus === "closed") {
    // Attendance is a separate, optional migration in older environments. When
    // it is available, all its slots and responses must be settled before the
    // session can be closed; manual decisions remain valid evidence.
    const { data: slots, error: slotsError } = await supabase
      .from("attendance_slots")
      .select("id, status")
      .eq("session_id", parsed.data.sessionId);

    if (!slotsError && (slots ?? []).length) {
      const openSlotCount = (slots ?? []).filter((slot) => slot.status !== "closed").length;
      if (openSlotCount) {
        return { error: `Clôture impossible : ${openSlotCount} créneau(x) d’émargement ne sont pas clôturés.` };
      }
      const slotIds = (slots ?? []).map((slot) => slot.id);
      const { data: responses, error: responsesError } = await supabase
        .from("attendance_responses")
        .select("response_status, trainer_override_status")
        .in("attendance_slot_id", slotIds);
      if (!responsesError) {
        const unresolvedCount = (responses ?? []).filter(
          (response) => (response.trainer_override_status ?? response.response_status) === "pending"
        ).length;
        if (unresolvedCount) {
          return { error: `Clôture impossible : ${unresolvedCount} statut(s) d’émargement restent à renseigner.` };
        }
      }
    }
    const archive = await createOrGetSessionArchive({ sessionId: parsed.data.sessionId, archivedBy: profile.id, trainerReport: parsed.data.trainerReport.trim() || null, administrativeObservations: parsed.data.administrativeObservations.trim() || null });
    if (!archive.ok) {
      const blockers = archive.blockers;
      const details = [
        blockers.openSlots ? `${blockers.openSlots} créneau(x) ouvert(s)` : null,
        blockers.pendingAttendance ? `${blockers.pendingAttendance} émargement(s) en attente` : null,
        blockers.incompleteEvaluations ? `${blockers.incompleteEvaluations} évaluation(s) obligatoire(s) incomplète(s)` : null,
        ...blockers.missingDocuments
      ].filter(Boolean);
      return { error: `Clôture impossible : ${details.join(" ; ") || "archive indisponible"}.` };
    }
    archiveId = archive.archiveId;
  }
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("training_sessions")
    .update({
      closure_status: closureStatus === "closed" ? "archived" : closureStatus,
      status: closureStatus === "closed" ? "completed" : sessionData.session.status,
      closed_at: closureStatus === "closed" ? now : sessionData.session.closed_at,
      closed_by: closureStatus === "closed" ? profile.id : sessionData.session.closed_by,
      trainer_report: parsed.data.trainerReport.trim() || null,
      administrative_observations: parsed.data.administrativeObservations.trim() || null,
      final_registered_count: summary.registeredCount,
      final_present_count: summary.presentCount,
      final_admitted_count: summary.admittedCount,
      final_not_admitted_count: summary.notAdmittedCount,
      final_absent_count: summary.absentCount,
      archive_status: closureStatus === "closed" ? "complete" : sessionData.session.archive_status ?? "none",
      archived_at: closureStatus === "closed" ? now : sessionData.session.archived_at ?? null,
      archived_by: closureStatus === "closed" ? profile.id : sessionData.session.archived_by ?? null,
      current_archive_id: closureStatus === "closed" ? archiveId : sessionData.session.current_archive_id ?? null
    })
    .eq("id", parsed.data.sessionId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return { error: "Impossible de mettre à jour la clôture de session." };
  }

  await Promise.all(
    sessionData.candidates.map((candidate) =>
      supabase
        .from("candidates")
        .update({
          forprev_registration_status: getForprevStatusForCandidate(sessionData.session.training_type, candidate)
        })
        .eq("id", candidate.candidate.id)
        .eq("session_id", parsed.data.sessionId)
    )
  );

  revalidatePath(`/sessions/${parsed.data.sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/dashboard");

  return {
    success: closureStatus === "closed" ? "Session clôturée." : "Session marquée prête à clôturer."
  };
}

export async function toggleSessionModuleAction(formData: FormData) {
  await requireUser();

  const sessionId = formData.get("sessionId")?.toString();
  const moduleId = formData.get("moduleId")?.toString();

  if (!sessionId || !moduleId) {
    throw new Error("Paramètres manquants.");
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("session_module_progress")
    .select("is_completed")
    .eq("session_id", sessionId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (currentError) {
    throw new Error("Impossible de charger l'état du module.");
  }

  const nextValue = !(current?.is_completed ?? false);

  const { error: updateError } = await supabase
    .from("session_module_progress")
    .upsert(
      {
        session_id: sessionId,
        module_id: moduleId,
        is_completed: nextValue,
        completed_at: nextValue ? new Date().toISOString() : null
      },
      { onConflict: "session_id,module_id" }
    );

  if (updateError) {
    throw new Error("Impossible de mettre à jour le module.");
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/formation`);
}

export async function generateDocumentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const sessionId = formData.get("sessionId")?.toString();
  const candidateId = formData.get("candidateId")?.toString();
  const type = formData.get("type")?.toString();

  if (!sessionId || !type) {
    return { error: "Paramètres de génération manquants." };
  }

  try {
    if (type === "aide_memoire") {
      if (!candidateId) {
        return { error: "Le candidat est requis pour attacher l'aide memoire." };
      }

      const sessionData = await getSessionById(sessionId);

      if (sessionData.session.training_type === "hygiene") {
        return { error: "L'aide memoire SST n'est pas applicable aux formations Hygiene." };
      }

      const document = await ensureCandidateAideMemoireDocument(sessionId, candidateId);

      revalidatePath(`/sessions/${sessionId}`);

      return {
        success: "Aide memoire attache au candidat.",
        fileUrl: document.file_url ?? undefined
      };
    }

    // A new document is created only when no document of the same type is
    // already attached to this candidate/session. Explicit regeneration keeps
    // using regenerateGeneratedDocument, so this entry point cannot create a
    // second livret or convocation through repeated clicks.
    const document = await getOrCreateDocument({
      sessionId,
      candidateId: candidateId || null,
      type: type as SupportedGeneratedDocumentType
    });

    let deliveryWarning = "";
    if (type === "attestation") {
      try {
        await sendAttestationToSessionCompany(document.id);
      } catch (emailError) {
        deliveryWarning = emailError instanceof Error ? ` Attestation générée, mais l'envoi à l'entreprise a échoué : ${emailError.message}` : " Attestation générée, mais l'envoi à l'entreprise a échoué.";
      }
    }

    revalidatePath(`/sessions/${sessionId}`);

    return {
      success: `${type[0].toUpperCase()}${type.slice(1)} généré.${deliveryWarning}`,
      fileUrl: document.file_url ?? undefined
    };
  } catch (error) {
    console.error("[generateDocumentAction] document generation failed", {
      sessionId,
      candidateId,
      type,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de générer le document." };
  }
}

export async function generateMissingCandidateAttestationsAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();

  const sessionId = formData.get("sessionId")?.toString();
  if (!sessionId) return { error: "Session introuvable." };

  try {
    const { candidates } = await getSessionById(sessionId);
    const admittedCandidates = candidates.filter((candidate) =>
      candidate.evaluations?.some(
        (evaluation) => evaluation.evaluation_type === "globale" && evaluation.result === "admis"
      )
    );

    if (admittedCandidates.length === 0) {
      return { error: "Aucun candidat admis ne nécessite une attestation." };
    }

    const documentResults: NonNullable<ActionState["documentResults"]> = [];
    for (const candidate of admittedCandidates) {
      const existing = await getLatestGeneratedDocumentByType({
        sessionId,
        candidateId: candidate.candidate.id,
        type: "attestation"
      });
      if (!existing) {
        await createDocument({ sessionId, candidateId: candidate.candidate.id, type: "attestation" });
      }
      documentResults.push({
        candidateName: `${candidate.candidate.first_name} ${candidate.candidate.last_name}`.trim(),
        status: existing ? "existing" : "generated"
      });
    }

    const generatedCount = documentResults.filter((result) => result.status === "generated").length;
    const existingCount = documentResults.length - generatedCount;
    revalidatePath(`/sessions/${sessionId}`);

    return {
      success: `${generatedCount} attestation(s) générée(s)${existingCount ? `, ${existingCount} déjà disponible(s)` : ""}. Aucun email n'a été envoyé.`,
      documentResults
    };
  } catch (error) {
    console.error("[generateMissingCandidateAttestationsAction] generation failed", {
      sessionId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return { error: error instanceof Error ? error.message : "Impossible de générer les attestations." };
  }
}

export async function sendAttendanceSlotRequestsFormAction(formData: FormData) {
  await requireUser();

  const slotId = formData.get("slotId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!slotId || !sessionId) {
    return;
  }

  try {
    await sendAttendanceSlotRequests(slotId);
    revalidatePath(`/sessions/${sessionId}`);
  } catch (error) {
    console.error("[attendance] send slot requests failed", {
      slotId,
      sessionId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    redirect(`/sessions/${sessionId}?attendanceError=1&attendanceSlot=${encodeURIComponent(slotId)}`);
  }

  redirect(`/sessions/${sessionId}?attendanceSuccess=1&attendanceSlot=${encodeURIComponent(slotId)}`);
}

export async function sendMissingAttendanceRequestsFormAction(formData: FormData) {
  await requireUser();
  const sessionId = formData.get("sessionId")?.toString().trim();
  if (!sessionId) return;
  const supabase = await createClient();
  const { data: slots, error } = await supabase
    .from("attendance_slots")
    .select("id")
    .eq("session_id", sessionId)
    .neq("status", "closed");
  if (error) redirect(`/sessions/${sessionId}?tab=attendance&attendanceError=1`);
  for (const slot of slots ?? []) {
    try { await sendAttendanceSlotRequests(slot.id, { pendingOnly: true }); } catch (error) {
      console.error("[attendance] batch missing requests failed", { sessionId, slotId: slot.id, message: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}?tab=attendance&attendanceSuccess=1`);
}

export async function sendPendingAttendanceRemindersFormAction(formData: FormData) {
  await requireUser();
  const sessionId = formData.get("sessionId")?.toString().trim();
  if (!sessionId) return;
  const supabase = await createClient();
  const { data: slots, error } = await supabase.from("attendance_slots").select("id").eq("session_id", sessionId).eq("status", "open");
  if (error) redirect(`/sessions/${sessionId}?tab=attendance&attendanceError=1`);
  for (const slot of slots ?? []) {
    try { await sendAttendanceSlotRequests(slot.id, { pendingOnly: true, reminder: true, minimumHoursSinceLastSend: 4, requireOpenSlot: true }); } catch (error) {
      console.error("[attendance] batch reminders failed", { sessionId, slotId: slot.id, message: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}?tab=attendance&attendanceSuccess=1`);
}

export async function closeCompleteAttendanceSlotsFormAction(formData: FormData) {
  await requireUser();
  const sessionId = formData.get("sessionId")?.toString().trim();
  if (!sessionId) return;
  const supabase = await createClient();
  const { data: slots, error } = await supabase.from("attendance_slots").select("id").eq("session_id", sessionId).neq("status", "closed");
  if (error) redirect(`/sessions/${sessionId}?tab=attendance&attendanceError=1`);
  for (const slot of slots ?? []) {
    const { data: responses, error: responsesError } = await supabase
      .from("attendance_responses")
      .select("response_status, trainer_override_status")
      .eq("attendance_slot_id", slot.id);
    if (responsesError || (responses ?? []).some((response) => (response.trainer_override_status ?? response.response_status) === "pending")) continue;
    try { await closeAttendanceSlot(slot.id); } catch (closeError) {
      console.error("[attendance] batch close failed", { sessionId, slotId: slot.id, message: closeError instanceof Error ? closeError.message : "Unknown error" });
    }
  }
  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}?tab=attendance&attendanceSuccess=1`);
}

export async function updateAttendanceSlotScheduleFormAction(formData: FormData) {
  await requireUser();

  const slotId = formData.get("slotId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();
  const startTime = formData.get("startTime")?.toString().trim() ?? "";
  const endTime = formData.get("endTime")?.toString().trim() ?? "";

  if (!slotId || !sessionId || !isValidAttendanceTimeRange(startTime, endTime)) {
    redirect(`/sessions/${sessionId || ""}?attendanceScheduleError=invalid#emargement-session`);
  }

  const supabase = await createClient();
  const { data: slot, error: slotError } = await supabase
    .from("attendance_slots")
    .select("id, slot_date")
    .eq("id", slotId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (slotError || !slot) {
    redirect(`/sessions/${sessionId}?attendanceScheduleError=save#emargement-session`);
  }

  const { data: updatedSlot, error: updateError } = await supabase
    .from("attendance_slots")
    .update({
      starts_at: buildParisDateTimeIso(slot.slot_date, startTime),
      ends_at: buildParisDateTimeIso(slot.slot_date, endTime),
      updated_at: new Date().toISOString()
    })
    .eq("id", slotId)
    .eq("session_id", sessionId)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedSlot) {
    redirect(`/sessions/${sessionId}?attendanceScheduleError=save#emargement-session`);
  }

  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}?attendanceScheduleUpdated=1#emargement-session`);
}

export async function sendAttendanceSlotReminderFormAction(formData: FormData) {
  await requireUser();

  const slotId = formData.get("slotId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!slotId || !sessionId) {
    return;
  }

  try {
    await sendAttendanceSlotRequests(slotId, {
      pendingOnly: true,
      reminder: true,
      minimumHoursSinceLastSend: 4
    });
    revalidatePath(`/sessions/${sessionId}`);
  } catch (error) {
    console.error("[attendance] manual reminder failed", {
      slotId,
      sessionId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    redirect(`/sessions/${sessionId}?attendanceError=1&attendanceSlot=${encodeURIComponent(slotId)}`);
  }

  redirect(`/sessions/${sessionId}?attendanceSuccess=1&attendanceSlot=${encodeURIComponent(slotId)}`);
}

export async function closeAttendanceSlotFormAction(formData: FormData) {
  await requireUser();

  const slotId = formData.get("slotId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!slotId || !sessionId) {
    return;
  }

  try {
    await closeAttendanceSlot(slotId);
    revalidatePath(`/sessions/${sessionId}`);
  } catch (error) {
    console.error("[attendance] close slot failed", {
      slotId,
      sessionId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    redirect(`/sessions/${sessionId}?attendanceError=1&attendanceSlot=${encodeURIComponent(slotId)}`);
  }

  redirect(`/sessions/${sessionId}?attendanceClosed=1&attendanceSlot=${encodeURIComponent(slotId)}`);
}

export async function setAttendanceResponseOverrideFormAction(formData: FormData) {
  await requireUser();

  const responseId = formData.get("responseId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();
  const overrideStatus = formData.get("overrideStatus")?.toString().trim() ?? "";

  if (!responseId || !sessionId) {
    return;
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const payload =
    overrideStatus === ""
      ? {
          trainer_override_status: null,
          trainer_overridden_at: null,
          trainer_override_note: null,
          updated_at: now
        }
      : {
          trainer_override_status: overrideStatus,
          trainer_overridden_at: now,
          trainer_override_note: "Validation manuelle formateur",
          updated_at: now
        };

  const { error } = await supabase.from("attendance_responses").update(payload).eq("id", responseId);

  if (error) {
    console.error("[attendance] override failed", {
      responseId,
      sessionId,
      overrideStatus,
      code: error.code,
      message: error.message
    });
    redirect(`/sessions/${sessionId}?attendanceError=1&attendanceSlot=manual`);
  }

  revalidatePath(`/sessions/${sessionId}`);
  redirect(`/sessions/${sessionId}`);
}

export async function createQuoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const parsed = createQuoteSchema.safeParse({
    sessionId: formData.get("sessionId"),
    companyId: formData.get("companyId"),
    title: formData.get("title"),
    description: formData.get("description"),
    trainingType: formData.get("trainingType"),
    durationHours: formData.get("durationHours") || undefined,
    prerequisites: formData.get("prerequisites"),
    objectives: formData.get("objectives"),
    programmeOutline: formData.get("programmeOutline"),
    accessibilityDetails: formData.get("accessibilityDetails"),
    macPreviousCertificateDate: formData.get("macPreviousCertificateDate"),
    macPreviousCertificateRef: formData.get("macPreviousCertificateRef"),
    candidateCount: formData.get("candidateCount"),
    sessionStartDate: formData.get("sessionStartDate"),
    sessionEndDate: formData.get("sessionEndDate"),
    location: formData.get("location"),
    trainerId: formData.get("trainerId"),
    priceHt: formData.get("priceHt"),
    vatRate: formData.get("vatRate"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  try {
    const { fileUrl } = await createQuote({
      sessionId: parsed.data.sessionId,
      companyId: parsed.data.companyId,
      title: getTrainingDocumentTitle(parsed.data.trainingType, parsed.data.title),
      description: parsed.data.description,
      trainingType: parsed.data.trainingType,
      durationHours: parsed.data.durationHours ?? null,
      prerequisites: parsed.data.prerequisites,
      objectives: parsed.data.objectives,
      programmeOutline: parsed.data.programmeOutline,
      accessibilityDetails: parsed.data.accessibilityDetails,
      macPreviousCertificateDate: parsed.data.macPreviousCertificateDate,
      macPreviousCertificateRef: parsed.data.macPreviousCertificateRef,
      candidateCount: parsed.data.candidateCount,
      sessionStartDate: parsed.data.sessionStartDate,
      sessionEndDate: parsed.data.sessionEndDate,
      location: parsed.data.location,
      trainerId: parsed.data.trainerId,
      priceHt: parsed.data.priceHt,
      vatRate: parsed.data.vatRate,
      notes: parsed.data.notes
    });

    if (parsed.data.sessionId) {
      revalidatePath(`/sessions/${parsed.data.sessionId}`);
    }
    revalidatePath("/sessions");
    revalidatePath(`/companies/${parsed.data.companyId}`);
    revalidatePath("/dashboard");

    return {
      success: "Devis généré.",
      fileUrl
    };
  } catch (error) {
    console.error("[createQuoteAction] quote creation failed", {
      sessionId: parsed.data.sessionId,
      companyId: parsed.data.companyId,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de créer le devis." };
  }
}

export async function regenerateGeneratedDocumentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const documentId = formData.get("documentId")?.toString();

  if (!documentId) {
    return { error: "Document manquant." };
  }

  try {
    const document = await regenerateGeneratedDocument(documentId);

    if (document.session_id) {
      revalidatePath(`/sessions/${document.session_id}`);
    }
    if (document.company_id) {
      revalidatePath(`/companies/${document.company_id}`);
    }
    revalidatePath("/sessions");
    revalidatePath("/companies");

    return {
      success: "Document régénéré.",
      fileUrl: document.file_url ?? undefined
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de régénérer le document." };
  }
}

export async function sendCandidateDocumentEmailAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const documentId = formData.get("documentId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!documentId) {
    return { error: "Document manquant." };
  }

  try {
    const result = await sendCandidateDocumentEmail(documentId);

    if (sessionId) {
      revalidatePath(`/sessions/${sessionId}`);
    }
    revalidatePath("/sessions");

    return {
      success: "Document envoye par email.",
      fileUrl: result.fileUrl
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible d'envoyer le document par email." };
  }
}

export async function sendCandidateSessionDocumentsEmailAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const candidateId = formData.get("candidateId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!candidateId || !sessionId) {
    return { error: "Parametres d'envoi manquants." };
  }

  try {
    const result = await sendCandidateSessionDocumentsEmail(candidateId, sessionId);

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath("/sessions");

    return {
      success: "Les documents avant formation ont ete prepares et envoyes.",
      fileUrl: result.fileUrl ?? undefined
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible d'envoyer les documents du candidat." };
  }
}

export async function prepareCandidatePreTrainingDocumentsAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();

  const candidateId = formData.get("candidateId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!candidateId || !sessionId) {
    return { error: "Parametres de preparation manquants." };
  }

  try {
    const sessionData = await getSessionById(sessionId);
    await ensureCandidatePreTrainingDocuments({
      candidateId,
      sessionId,
      trainingType: sessionData.session.training_type
    });

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath("/sessions");

    return { success: "Le dossier avant formation est complet." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de preparer les documents avant formation." };
  }
}

export async function updateQuoteStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const quoteId = formData.get("quoteId")?.toString().trim();
  const statusValue = formData.get("status")?.toString().trim();

  if (!quoteId || !statusValue || !isQuoteStatus(statusValue)) {
    return { error: "Statut de devis invalide." };
  }

  try {
    const currentQuote = await getQuoteForEdit(quoteId);
    const quote = await updateQuoteStatus(quoteId, statusValue);
    let agreementWarning: string | null = null;

    if (statusValue === "accepted" && currentQuote.status !== "accepted") {
      try {
        await createTrainingAgreementDocumentForQuote(quoteId);
        await sendTrainingAgreementEmail(currentQuote);
      } catch (error) {
        agreementWarning =
          error instanceof Error
            ? ` Statut accepte enregistre, mais la convention n'a pas pu etre envoyee automatiquement : ${error.message}`
            : " Statut accepte enregistre, mais la convention n'a pas pu etre envoyee automatiquement.";
      }
    }

    if (quote.session_id) {
      revalidatePath(`/sessions/${quote.session_id}`);
    }
    revalidatePath(`/quotes/${quote.id}`);
    revalidatePath("/sessions");
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${quote.company_id}`);

    return {
      success: `Statut mis a jour : ${QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS]}.${statusValue === "accepted" && currentQuote.status !== "accepted" && !agreementWarning ? " Convention envoyee par email." : ""}${agreementWarning ?? ""}`
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de mettre a jour le statut du devis." };
  }
}

export async function duplicateQuoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const quoteId = formData.get("quoteId")?.toString().trim();

  if (!quoteId) {
    return { error: "Devis manquant." };
  }

  try {
    const { quote } = await duplicateQuote(quoteId);

    revalidatePath("/sessions");
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${quote.company_id}`);
    redirect(`/quotes/${quote.id}`);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de dupliquer le devis." };
  }
}

export async function prefillSessionCandidatesFromQuoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!sessionId) {
    return { error: "Session manquante." };
  }

  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, title, source_quote_id, training_type")
    .eq("id", sessionId)
    .maybeSingle<{ id: string; title: string; source_quote_id: string | null; training_type: "sst_initial" | "mac_sst" | "hygiene" }>();

  if (sessionError || !session) {
    return { error: "Session introuvable." };
  }

  if (!session.source_quote_id) {
    return { error: "Aucun devis source n'est lie a cette session." };
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, company_id")
    .eq("id", session.source_quote_id)
    .maybeSingle<{ id: string; company_id: string }>();

  if (quoteError || !quote) {
    return { error: "Impossible de retrouver le devis source." };
  }

  const { data: company, error: companyError } = await supabase
    .from("client_companies")
    .select("id, company_name")
    .eq("id", quote.company_id)
    .maybeSingle<{ id: string; company_name: string }>();

  if (companyError || !company) {
    return { error: "Impossible de retrouver la societe du devis." };
  }

  const { data: companyCandidates, error: companyCandidatesError } = await supabase
    .from("candidates")
    .select("first_name, last_name, email, phone, job_title, address, postal_code, city, validation_status")
    .eq("company_id", company.id)
    .order("created_at", { ascending: true });

  if (companyCandidatesError) {
    return { error: "Impossible de charger les candidats de la societe." };
  }

  const { data: existingSessionCandidates, error: existingSessionCandidatesError } = await supabase
    .from("candidates")
    .select("first_name, last_name, email")
    .eq("session_id", session.id);

  if (existingSessionCandidatesError) {
    return { error: "Impossible de charger les candidats deja rattaches a la session." };
  }

  const existingSignatures = new Set(
    (existingSessionCandidates ?? []).map((candidate) => buildCandidateSignature(candidate))
  );

  const candidatesToInsert = (companyCandidates ?? [])
    .filter((candidate) => !existingSignatures.has(buildCandidateSignature(candidate)))
    .map((candidate) => ({
      session_id: session.id,
      company_id: company.id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      company: company.company_name,
      phone: candidate.phone,
      job_title: candidate.job_title,
      address: candidate.address,
      postal_code: candidate.postal_code,
      city: candidate.city,
      validation_status: candidate.validation_status,
      validated_at: candidate.validation_status === "validated" ? new Date().toISOString() : null
    }));

  if (!candidatesToInsert.length) {
    return { success: "Tous les candidats de la societe sont deja rattaches a cette session." };
  }

  const { data: insertedCandidates, error: insertError } = await supabase
    .from("candidates")
    .insert(candidatesToInsert)
    .select("id, session_id");

  if (insertError) {
    return { error: "Impossible de pre-remplir les candidats de la societe." };
  }

  await Promise.all(
    (insertedCandidates ?? []).map((candidate) =>
      candidate.session_id
        ? ensureCandidatePreTrainingDocuments({
            sessionId: candidate.session_id,
            candidateId: candidate.id,
            trainingType: session.training_type
          })
        : Promise.resolve(null)
    )
  );

  revalidatePath(`/sessions/${session.id}`);
  revalidatePath(`/quotes/${quote.id}`);
  revalidatePath(`/companies/${company.id}`);
  revalidatePath("/sessions");
  revalidatePath("/companies");
  revalidatePath("/dashboard");

  return {
    success: `${candidatesToInsert.length} candidat(s) ajoute(s) a la session.`
  };
}
