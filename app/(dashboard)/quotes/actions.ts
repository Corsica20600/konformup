"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createInvoiceFromQuote, InvoiceError } from "@/lib/invoices";
import { sendQuoteEmail } from "@/lib/quote-email";
import { getQuoteStatusAfterSend } from "@/lib/quote-status";
import { createSessionFromQuote, getQuoteForEdit, regenerateQuotePdf, updateQuote, updateQuoteStatus } from "@/lib/quotes";
import { updateQuoteSchema } from "@/lib/validation";

export type QuoteEditorActionState = {
  error?: string;
  success?: string;
  fileUrl?: string;
};

export async function updateQuoteAction(
  _: QuoteEditorActionState,
  formData: FormData
): Promise<QuoteEditorActionState> {
  const parsed = updateQuoteSchema.safeParse({
    quoteId: formData.get("quoteId"),
    title: formData.get("title"),
    description: formData.get("description"),
    candidateCount: formData.get("candidateCount"),
    sessionStartDate: formData.get("sessionStartDate"),
    sessionEndDate: formData.get("sessionEndDate"),
    location: formData.get("location"),
    priceHt: formData.get("priceHt"),
    vatRate: formData.get("vatRate"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  try {
    const quote = await updateQuote(parsed.data);

    revalidatePath(`/quotes/${quote.id}`);
    revalidatePath("/sessions");
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${quote.company_id}`);

    return {
      success: "Devis enregistre."
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de mettre a jour le devis." };
  }
}

export async function regenerateQuotePdfAction(
  _: QuoteEditorActionState,
  formData: FormData
): Promise<QuoteEditorActionState> {
  const quoteId = formData.get("quoteId")?.toString().trim();

  if (!quoteId) {
    return { error: "Devis manquant." };
  }

  try {
    const { quote, fileUrl } = await regenerateQuotePdf(quoteId);

    revalidatePath(`/quotes/${quote.id}`);
    revalidatePath("/sessions");
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${quote.company_id}`);

    return {
      success: "PDF regenere.",
      fileUrl
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de regenerer le PDF du devis." };
  }
}

export async function sendQuoteEmailAction(
  _: QuoteEditorActionState,
  formData: FormData
): Promise<QuoteEditorActionState> {
  const quoteId = formData.get("quoteId")?.toString().trim();

  if (!quoteId) {
    return { error: "Devis manquant." };
  }

  try {
    const quote = await getQuoteForEdit(quoteId);
    const { fileUrl } = await sendQuoteEmail(quote);
    const nextStatus = getQuoteStatusAfterSend(quote.status);

    if (nextStatus !== quote.status) {
      await updateQuoteStatus(quote.id, nextStatus);
    }

    revalidatePath(`/quotes/${quote.id}`);
    revalidatePath("/sessions");
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${quote.company_id}`);

    return {
      success: nextStatus === "sent" ? "Devis envoye." : "Email envoye.",
      fileUrl
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de preparer l'envoi du devis." };
  }
}

export async function createSessionFromQuoteAction(
  _: QuoteEditorActionState,
  formData: FormData
): Promise<QuoteEditorActionState> {
  const quoteId = formData.get("quoteId")?.toString().trim();

  if (!quoteId) {
    return { error: "Devis manquant." };
  }

  try {
    const { profile } = await requireUser();
    const { quote, session } = await createSessionFromQuote(quoteId, profile.id);

    revalidatePath(`/quotes/${quote.id}`);
    revalidatePath(`/sessions/${session.id}`);
    revalidatePath("/sessions");
    revalidatePath("/dashboard");
    revalidatePath("/companies");
    revalidatePath(`/companies/${quote.company_id}`);

    redirect(`/sessions/${session.id}`);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Impossible de creer la session depuis le devis." };
  }
}

export async function createInvoiceFromQuoteAction(
  _: QuoteEditorActionState,
  formData: FormData
): Promise<QuoteEditorActionState> {
  const quoteId = formData.get("quoteId")?.toString().trim();

  console.info("[create-invoice-action]", {
    step: "received",
    quoteId: quoteId ?? null
  });

  if (!quoteId) {
    return { error: "Devis manquant." };
  }

  let invoiceId: string | null = null;

  try {
    console.info("[create-invoice-action]", {
      step: "before-createInvoiceFromQuote",
      quoteId
    });

    const invoice = await createInvoiceFromQuote(quoteId);
    invoiceId = invoice.id;

    console.info("[create-invoice-action]", {
      step: "after-createInvoiceFromQuote",
      quoteId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number ?? null
    });

    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/companies");
  } catch (error) {
    console.error("[create-invoice-action]", {
      step: "error",
      quoteId,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof InvoiceError) {
      return { error: error.message };
    }

    return { error: "Impossible de creer la facture depuis ce devis." };
  }

  console.info("[create-invoice-action]", {
    step: "success",
    quoteId,
    invoiceId
  });

  redirect(`/invoices/${invoiceId}`);
}
