"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendTrainerResourceEmail } from "@/lib/trainer-resource-email";
import { getTrainerResourceBySlug } from "@/lib/trainer-resources";
import { createTrainerSchema, updateTrainerSchema } from "@/lib/validation";

export type TrainerActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
};

export async function createTrainerAction(
  _: TrainerActionState,
  formData: FormData
): Promise<TrainerActionState> {
  await requireUser();

  const parsed = createTrainerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("trainers").insert({
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    created_at: now,
    updated_at: now
  });

  if (error) {
    return { error: "Impossible de creer le formateur." };
  }

  revalidatePath("/trainers");
  revalidatePath("/sessions");
  return { success: "Formateur cree." };
}

export async function updateTrainerAction(
  _: TrainerActionState,
  formData: FormData
): Promise<TrainerActionState> {
  await requireUser();

  const parsed = updateTrainerSchema.safeParse({
    trainerId: formData.get("trainerId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone")
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("trainers")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.trainerId);

  if (error) return { error: "Impossible de mettre à jour le formateur." };

  revalidatePath("/trainers");
  revalidatePath("/sessions");
  return { success: "Fiche formateur mise à jour." };
}

const MAX_TRAINER_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TRAINER_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document";
}

export async function uploadTrainerDocumentAction(
  _: TrainerActionState,
  formData: FormData
): Promise<TrainerActionState> {
  await requireUser();

  const trainerId = formData.get("trainerId")?.toString().trim() ?? "";
  const label = formData.get("label")?.toString().trim() ?? "";
  const file = formData.get("file");

  if (!updateTrainerSchema.shape.trainerId.safeParse(trainerId).success) {
    return { error: "Le formateur est introuvable." };
  }
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez un document à envoyer." };
  if (file.size > MAX_TRAINER_DOCUMENT_SIZE) return { error: "Le document ne doit pas dépasser 10 Mo." };
  if (!ACCEPTED_TRAINER_DOCUMENT_TYPES.has(file.type)) {
    return { error: "Seuls les fichiers PDF, DOC et DOCX sont acceptés." };
  }

  const supabase = await createClient();
  const { data: trainer, error: trainerError } = await supabase
    .from("trainers")
    .select("id")
    .eq("id", trainerId)
    .maybeSingle();

  if (trainerError || !trainer) return { error: "Le formateur est introuvable." };

  const fileName = sanitizeFileName(file.name);
  const storagePath = `trainers/${trainerId}/${crypto.randomUUID()}-${fileName}`;
  const upload = await supabase.storage.from("trainer-documents").upload(storagePath, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false
  });

  if (upload.error) return { error: "Impossible d'envoyer le document." };

  const { error: insertError } = await supabase.from("trainer_documents").insert({
    trainer_id: trainerId,
    label: label || file.name.replace(/\.[^.]+$/, ""),
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    file_size: file.size
  });

  if (insertError) {
    await supabase.storage.from("trainer-documents").remove([storagePath]);
    return { error: "Le document a été envoyé mais son enregistrement a échoué." };
  }

  revalidatePath("/trainers");
  return { success: "Document ajouté au dossier du formateur." };
}

export async function sendTrainerResourceEmailAction(
  _: TrainerActionState,
  formData: FormData
): Promise<TrainerActionState> {
  await requireUser();

  const trainerId = formData.get("trainerId")?.toString().trim();
  const resourceSlug = formData.get("resourceSlug")?.toString().trim();

  if (!trainerId || !resourceSlug) {
    return { error: "Ressource formateur manquante." };
  }

  const resource = getTrainerResourceBySlug(resourceSlug);

  if (!resource) {
    return { error: "Ressource formateur introuvable." };
  }

  try {
    const result = await sendTrainerResourceEmail(trainerId, resource.slug);
    return {
      success: "Support formateur envoye par email.",
      fileUrl: result.fileUrl
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible d'envoyer le support formateur."
    };
  }
}
