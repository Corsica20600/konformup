"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCompanyCandidateSchema, createCompanySchema, updateCompanySchema } from "@/lib/validation";

export type CompanyActionState = {
  error?: string;
  success?: string;
};

export type CompanyCandidateActionState = {
  error?: string;
  success?: string;
};

export async function createCompanyAction(
  _: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const parsed = createCompanySchema.safeParse({
    companyName: formData.get("companyName"),
    contactFirstName: formData.get("contactFirstName"),
    contactLastName: formData.get("contactLastName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    country: formData.get("country"),
    siret: formData.get("siret"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  let { error } = await supabase.from("client_companies").insert({
    company_name: parsed.data.companyName,
    contact_first_name: parsed.data.contactFirstName || null,
    contact_last_name: parsed.data.contactLastName || null,
    contact_email: parsed.data.contactEmail || null,
    contact_phone: parsed.data.contactPhone || null,
    address: parsed.data.address || null,
    postal_code: parsed.data.postalCode || null,
    city: parsed.data.city || null,
    country: parsed.data.country || null,
    siret: parsed.data.siret || null,
    notes: parsed.data.notes || null,
    created_at: now,
    updated_at: now
  });

  if (error?.code === "42703") {
    error = (
      await supabase.from("client_companies").insert({
        company_name: parsed.data.companyName,
        contact_name: [parsed.data.contactFirstName, parsed.data.contactLastName].filter(Boolean).join(" ") || null,
        contact_email: parsed.data.contactEmail || null,
        contact_phone: parsed.data.contactPhone || null,
        billing_address: parsed.data.address || null,
        postal_code: parsed.data.postalCode || null,
        city: parsed.data.city || null,
        siret: parsed.data.siret || null,
        notes: parsed.data.notes || null,
        created_at: now,
        updated_at: now
      })
    ).error;
  }

  if (error) {
    console.error("[createCompanyAction] insert client_companies failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return { error: "Impossible de créer la société." };
  }

  revalidatePath("/companies");
  return { success: "Société créée." };
}

export async function updateCompanyAction(
  _: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const parsed = updateCompanySchema.safeParse({
    companyId: formData.get("companyId"),
    companyName: formData.get("companyName"),
    contactFirstName: formData.get("contactFirstName"),
    contactLastName: formData.get("contactLastName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    country: formData.get("country"),
    siret: formData.get("siret"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  let { error } = await supabase
    .from("client_companies")
    .update({
      company_name: parsed.data.companyName,
      contact_first_name: parsed.data.contactFirstName || null,
      contact_last_name: parsed.data.contactLastName || null,
      contact_email: parsed.data.contactEmail || null,
      contact_phone: parsed.data.contactPhone || null,
      address: parsed.data.address || null,
      postal_code: parsed.data.postalCode || null,
      city: parsed.data.city || null,
      country: parsed.data.country || null,
      siret: parsed.data.siret || null,
      notes: parsed.data.notes || null,
      updated_at: now
    })
    .eq("id", parsed.data.companyId);

  if (error?.code === "42703") {
    error = (
      await supabase
        .from("client_companies")
        .update({
          company_name: parsed.data.companyName,
          contact_name: [parsed.data.contactFirstName, parsed.data.contactLastName].filter(Boolean).join(" ") || null,
          contact_email: parsed.data.contactEmail || null,
          contact_phone: parsed.data.contactPhone || null,
          billing_address: parsed.data.address || null,
          postal_code: parsed.data.postalCode || null,
          city: parsed.data.city || null,
          siret: parsed.data.siret || null,
          notes: parsed.data.notes || null,
          updated_at: now
        })
        .eq("id", parsed.data.companyId)
    ).error;
  }

  if (error) {
    console.error("[updateCompanyAction] update client_companies failed", {
      companyId: parsed.data.companyId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return { error: "Impossible de mettre à jour la société." };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${parsed.data.companyId}`);
  return { success: "Société mise à jour." };
}

export async function createCompanyCandidateAction(
  _: CompanyCandidateActionState,
  formData: FormData
): Promise<CompanyCandidateActionState> {
  const parsed = createCompanyCandidateSchema.safeParse({
    companyId: formData.get("companyId"),
    sessionId: formData.get("sessionId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
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
  const { data: company, error: companyError } = await supabase
    .from("client_companies")
    .select("company_name")
    .eq("id", parsed.data.companyId)
    .maybeSingle();

  if (companyError || !company) {
    return { error: "Société introuvable." };
  }

  const { error } = await supabase.from("candidates").insert({
    session_id: parsed.data.sessionId || null,
    company_id: parsed.data.companyId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    email: parsed.data.email || null,
    company: company.company_name,
    phone: parsed.data.phone || null,
    job_title: parsed.data.jobTitle || null,
    address: parsed.data.address || null,
    postal_code: parsed.data.postalCode || null,
    city: parsed.data.city || null,
    validation_status: parsed.data.validationStatus,
    validated_at: parsed.data.validationStatus === "validated" ? new Date().toISOString() : null
  });

  if (error) {
    console.error("[createCompanyCandidateAction] insert candidates failed", {
      companyId: parsed.data.companyId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return { error: "Impossible d'ajouter le candidat." };
  }

  revalidatePath(`/companies/${parsed.data.companyId}`);
  revalidatePath("/companies");
  if (parsed.data.sessionId) {
    revalidatePath(`/sessions/${parsed.data.sessionId}`);
  }

  return { success: "Candidat ajouté." };
}
