"use server";

import { revalidatePath } from "next/cache";
import { getInvoiceStatusAfterSend, getInvoiceById, updateInvoiceStatus } from "@/lib/invoices";
import { sendInvoiceEmail } from "@/lib/invoice-email";
import { upsertInvoiceComplaint } from "@/lib/invoice-complaints";
import { upsertInvoiceComplaintSchema } from "@/lib/validation";

export type InvoiceActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
};

export type InvoiceComplaintActionState = {
  error?: string;
  success?: string;
};

export async function sendInvoiceEmailAction(
  _: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  const invoiceId = formData.get("invoiceId")?.toString().trim();

  if (!invoiceId) {
    return { error: "Facture manquante." };
  }

  try {
    const invoice = await getInvoiceById(invoiceId);
    const { fileUrl } = await sendInvoiceEmail(invoice);
    const nextStatus = getInvoiceStatusAfterSend(invoice.status);

    if (nextStatus !== invoice.status) {
      await updateInvoiceStatus(invoice.id, nextStatus);
    }

    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath(`/quotes/${invoice.quote.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${invoice.company.id}`);

    return {
      success: nextStatus === "sent" ? "Facture envoyee." : "Email envoye.",
      fileUrl
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de preparer l'envoi de la facture." };
  }
}

export async function saveInvoiceComplaintAction(
  _: InvoiceComplaintActionState,
  formData: FormData
): Promise<InvoiceComplaintActionState> {
  const parsed = upsertInvoiceComplaintSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    status: formData.get("status"),
    severity: formData.get("severity"),
    dissatisfactionSummary: formData.get("dissatisfactionSummary"),
    complaintDetails: formData.get("complaintDetails"),
    customerExpectation: formData.get("customerExpectation"),
    rootCause: formData.get("rootCause"),
    correctiveActions: formData.get("correctiveActions"),
    preventiveActions: formData.get("preventiveActions"),
    followUpActions: formData.get("followUpActions"),
    internalNotes: formData.get("internalNotes"),
    sendWithInvoice: formData.get("sendWithInvoice") === "on"
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    const invoice = await getInvoiceById(parsed.data.invoiceId);
    await upsertInvoiceComplaint(invoice, parsed.data);

    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath(`/quotes/${invoice.quote.id}`);
    revalidatePath(`/companies/${invoice.company.id}`);

    return { success: "Fiche de reclamation enregistree." };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible d'enregistrer la fiche de reclamation." };
  }
}
