"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createDocument,
  regenerateGeneratedDocument,
  type SupportedGeneratedDocumentType
} from "@/lib/generated-documents";
import { createQuote, duplicateQuote, updateQuoteStatus } from "@/lib/quotes";
import { isQuoteStatus, QUOTE_STATUS_LABELS } from "@/lib/quote-status";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { initializeSessionModuleProgress } from "@/lib/session-modules";
import { createCandidateSchema, createQuoteSchema, createSessionSchema, updateCandidateSchema } from "@/lib/validation";

export type ActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
};

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
  const type = formData.get("type")?.toString() as SupportedGeneratedDocumentType | undefined;

  if (!sessionId || !candidateId || !type) {
    return { error: "Paramètres de génération manquants." };
  }

  try {
    const document = await createDocument({
      sessionId,
      candidateId,
      type
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

export async function updateQuoteStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const quoteId = formData.get("quoteId")?.toString().trim();
  const statusValue = formData.get("status")?.toString().trim();

  if (!quoteId || !statusValue || !isQuoteStatus(statusValue)) {
    return { error: "Statut de devis invalide." };
  }

  try {
    const quote = await updateQuoteStatus(quoteId, statusValue);

    if (quote.session_id) {
      revalidatePath(`/sessions/${quote.session_id}`);
    }
    revalidatePath("/sessions");
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${quote.company_id}`);

    return {
      success: `Statut mis a jour : ${QUOTE_STATUS_LABELS[quote.status]}.`
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
