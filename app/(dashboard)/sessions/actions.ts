"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createDocument,
  generateUniqueDocumentRef,
  insertGeneratedDocumentRecord,
  regenerateGeneratedDocument,
  type SupportedGeneratedDocumentType
} from "@/lib/generated-documents";
import { closeAttendanceSlot, sendAttendanceSlotRequests } from "@/lib/attendance";
import { sendCandidateDocumentEmail, sendCandidateSessionDocumentsEmail } from "@/lib/candidate-document-email";
import { createQuote, duplicateQuote, updateQuoteStatus } from "@/lib/quotes";
import { isQuoteStatus, QUOTE_STATUS_LABELS } from "@/lib/quote-status";
import { createTrainingAgreementDocumentForQuote } from "@/lib/training-agreements";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { initializeSessionModuleProgress } from "@/lib/session-modules";
import { createCandidateSchema, createQuoteSchema, createSessionSchema, updateCandidateSchema, updateSessionSchema } from "@/lib/validation";

export type ActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
};

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
    trainerName: formData.get("trainerName"),
    durationHours: formData.get("durationHours") || undefined,
    status: formData.get("status")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("training_sessions")
    .insert({
      title: parsed.data.title,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      location: parsed.data.location,
      status: parsed.data.status,
      trainer_user_id: profile.id,
      trainer_name: parsed.data.trainerName || null,
      duration_hours: parsed.data.durationHours ?? null
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
  const parsed = updateSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    durationHours: formData.get("durationHours"),
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
        title: parsed.data.title,
        start_date: parsed.data.startDate,
        end_date: parsed.data.endDate,
        location: parsed.data.location,
        duration_hours:
          parsed.data.durationHours === "" || typeof parsed.data.durationHours === "undefined"
            ? null
            : parsed.data.durationHours,
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

  const { error: candidateInsertError } = await supabase.from("candidates").insert({
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
  });

  if (candidateInsertError) {
    return { error: "Impossible d'ajouter le candidat à la session." };
  }

  if (parsed.data.sessionId) {
    revalidatePath(`/sessions/${parsed.data.sessionId}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/sessions");
  return { success: "Candidat ajouté." };
}

export async function updateCandidateAction(_: ActionState, formData: FormData): Promise<ActionState> {
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

  revalidatePath(`/sessions/${parsed.data.sessionId}`);
  revalidatePath("/sessions");

  return { success: "Candidat mis à jour." };
}

export async function toggleSessionModuleAction(formData: FormData) {
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
}

export async function generateDocumentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const sessionId = formData.get("sessionId")?.toString();
  const candidateId = formData.get("candidateId")?.toString();
  const type = formData.get("type")?.toString();

  if (!sessionId || !candidateId || !type) {
    return { error: "Paramètres de génération manquants." };
  }

  try {
    if (type === "aide_memoire") {
      const supabase = await createClient();
      const existingDocument = await supabase
        .from("generated_documents")
        .select("id, file_url")
        .eq("session_id", sessionId)
        .eq("candidate_id", candidateId)
        .eq("document_type", "aide_memoire")
        .maybeSingle();

      if (existingDocument.data?.file_url) {
        revalidatePath(`/sessions/${sessionId}`);

        return {
          success: "Aide memoire deja attache.",
          fileUrl: existingDocument.data.file_url
        };
      }

      const documentRef = await generateUniqueDocumentRef("attestation");
      const fileUrl = "/aide-memoire-sauveteur-secouriste-du-travail.pdf";

      await insertGeneratedDocumentRecord({
        sessionId,
        candidateId,
        documentType: "aide_memoire",
        documentRef: `AIDE-${documentRef}`,
        status: "generated",
        fileUrl,
        metadata: {
          title: "Aide memoire sauveteur secouriste du travail",
          static_asset: true
        }
      });

      revalidatePath(`/sessions/${sessionId}`);

      return {
        success: "Aide memoire attache au candidat.",
        fileUrl
      };
    }

    const document = await createDocument({
      sessionId,
      candidateId,
      type: type as SupportedGeneratedDocumentType
    });

    revalidatePath(`/sessions/${sessionId}`);

    return {
      success: `${type[0].toUpperCase()}${type.slice(1)} généré.`,
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

export async function sendAttendanceSlotRequestsFormAction(formData: FormData) {
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

export async function sendAttendanceSlotReminderFormAction(formData: FormData) {
  const slotId = formData.get("slotId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!slotId || !sessionId) {
    return;
  }

  try {
    await sendAttendanceSlotRequests(slotId, {
      pendingOnly: true,
      reminder: true
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
  const parsed = createQuoteSchema.safeParse({
    sessionId: formData.get("sessionId"),
    companyId: formData.get("companyId"),
    title: formData.get("title"),
    description: formData.get("description"),
    candidateCount: formData.get("candidateCount"),
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
      title: parsed.data.title,
      description: parsed.data.description,
      candidateCount: parsed.data.candidateCount,
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
  const candidateId = formData.get("candidateId")?.toString().trim();
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!candidateId || !sessionId) {
    return { error: "Parametres d'envoi manquants." };
  }

  try {
    const result = await sendCandidateSessionDocumentsEmail(candidateId, sessionId);

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath("/sessions");

    return {
      success: "Tous les documents du candidat ont ete envoyes.",
      fileUrl: result.fileUrl ?? undefined
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible d'envoyer les documents du candidat." };
  }
}

export async function updateQuoteStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const quoteId = formData.get("quoteId")?.toString().trim();
  const statusValue = formData.get("status")?.toString().trim();

  if (!quoteId || !statusValue || !isQuoteStatus(statusValue)) {
    return { error: "Statut de devis invalide." };
  }

  try {
    const quote = await updateQuoteStatus(quoteId, statusValue);
    let agreementWarning: string | null = null;

    if (statusValue === "accepted") {
      try {
        await createTrainingAgreementDocumentForQuote(quoteId);
      } catch (error) {
        agreementWarning =
          error instanceof Error
            ? ` Statut accepte enregistre, mais la convention n'a pas pu etre generee automatiquement : ${error.message}`
            : " Statut accepte enregistre, mais la convention n'a pas pu etre generee automatiquement.";
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
      success: `Statut mis a jour : ${QUOTE_STATUS_LABELS[quote.status]}.${agreementWarning ?? ""}`
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de mettre a jour le statut du devis." };
  }
}

export async function duplicateQuoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
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
  const sessionId = formData.get("sessionId")?.toString().trim();

  if (!sessionId) {
    return { error: "Session manquante." };
  }

  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, title, source_quote_id")
    .eq("id", sessionId)
    .maybeSingle<{ id: string; title: string; source_quote_id: string | null }>();

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

  const { error: insertError } = await supabase.from("candidates").insert(candidatesToInsert);

  if (insertError) {
    return { error: "Impossible de pre-remplir les candidats de la societe." };
  }

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
