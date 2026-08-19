"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getInvoiceStatusAfterSend, getInvoiceById, setInvoiceCompanySatisfaction, updateInvoiceStatus } from "@/lib/invoices";
import { sendInvoiceEmail } from "@/lib/invoice-email";
import { setInvoiceComplaintSendWithInvoice, upsertInvoiceComplaint } from "@/lib/invoice-complaints";
import { upsertInvoiceComplaintSchema } from "@/lib/validation";

export type InvoiceActionState = {
  error?: string;
  success?: string;
  warning?: string;
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
  await requireUser();

  const invoiceId = formData.get("invoiceId")?.toString().trim();
  // Some existing entry points (the document list) do not expose this option.
  // Only persist it when the sending form explicitly provided a value.
  const sendWithInvoiceValues = formData.getAll("sendWithInvoice").map((value) => value.toString());
  const sendWithInvoice =
    sendWithInvoiceValues.length > 0 ? sendWithInvoiceValues.at(-1) === "true" : undefined;
  const companySatisfactionValues = formData.getAll("sendCompanySatisfaction").map((value) => value.toString());
  const sendCompanySatisfaction =
    companySatisfactionValues.length > 0 ? companySatisfactionValues.at(-1) === "true" : undefined;

  if (!invoiceId) {
    return { error: "Facture manquante." };
  }

  try {
    const invoice = await getInvoiceById(invoiceId);
    if (sendWithInvoice !== undefined) {
      await setInvoiceComplaintSendWithInvoice(invoice, sendWithInvoice);
    }
    if (sendCompanySatisfaction !== undefined) {
      await setInvoiceCompanySatisfaction(invoice.id, sendCompanySatisfaction);
      invoice.send_company_satisfaction = sendCompanySatisfaction;
    }
    const { fileUrl, complaintAttached, satisfactionIncluded, trackingWarning } = await sendInvoiceEmail(invoice);
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
      success:
        nextStatus === "sent"
          ? complaintAttached
            ? "Facture et fiche de réclamation envoyées."
            : satisfactionIncluded
              ? "Facture envoyée avec le questionnaire de satisfaction."
              : "Facture envoyée."
          : "Email envoyé.",
      fileUrl,
      ...(trackingWarning ? { warning: trackingWarning } : {})
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
  await requireUser();

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
