import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export class AuthenticationError extends Error {
  constructor(message = "Authentification requise.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Acces refuse.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message = "Ressource introuvable.") {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

function buildProfile(user: User) {
  return {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email ?? "Utilisateur",
    role: "trainer" as const
  };
}

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError();
  }

  return { user, profile: buildProfile(user), supabase };
}

export async function requireUser() {
  try {
    return await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }

    throw error;
  }
}

async function assertReadableRecord(table: string, id: string) {
  if (!id) {
    throw new ResourceNotFoundError();
  }

  const context = await requireAuthenticatedUser();
  const { data, error } = await context.supabase.from(table).select("id").eq("id", id).maybeSingle<{ id: string }>();

  if (error) {
    throw new AuthorizationError();
  }

  if (!data) {
    throw new ResourceNotFoundError();
  }

  return context;
}

export async function assertCanAccessQuote(quoteId: string) {
  return assertReadableRecord("quotes", quoteId);
}

export async function assertCanAccessInvoice(invoiceId: string) {
  return assertReadableRecord("invoices", invoiceId);
}

export async function assertCanAccessSession(sessionId: string) {
  return assertReadableRecord("training_sessions", sessionId);
}

export async function assertCanAccessCandidate(candidateId: string) {
  return assertReadableRecord("candidates", candidateId);
}

export async function assertCanAccessGeneratedDocument(documentId: string) {
  return assertReadableRecord("generated_documents", documentId);
}
