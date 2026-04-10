"use server";

import { revalidatePath } from "next/cache";
import { getInvoiceStatusAfterSend, getInvoiceById, updateInvoiceStatus } from "@/lib/invoices";
import { sendInvoiceEmail } from "@/lib/invoice-email";

export type InvoiceActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
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
