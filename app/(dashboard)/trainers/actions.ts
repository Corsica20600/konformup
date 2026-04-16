"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendTrainerResourceEmail } from "@/lib/trainer-resource-email";
import { getTrainerResourceBySlug } from "@/lib/trainer-resources";
import { createTrainerSchema } from "@/lib/validation";

export type TrainerActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
};

export async function createTrainerAction(
  _: TrainerActionState,
  formData: FormData
): Promise<TrainerActionState> {
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

export async function sendTrainerResourceEmailAction(
  _: TrainerActionState,
  formData: FormData
): Promise<TrainerActionState> {
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
