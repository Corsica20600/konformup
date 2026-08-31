import "server-only";

import { z } from "zod";
import { AuthenticationError, AuthorizationError, requireAuthenticatedUser } from "@/lib/auth";

const indicators = [23, 24, 25, 26] as const;
const statuses = ["to_review", "action_required", "applied", "not_retained"] as const;
export type QualiopiWatchStatus = (typeof statuses)[number];
export class QualiopiWatchError extends Error { constructor(message: string) { super(message); this.name = "QualiopiWatchError"; } }

const entrySchema = z.object({ indicator: z.coerce.number().refine((value): value is (typeof indicators)[number] => indicators.includes(value as (typeof indicators)[number])), topic: z.string().trim().min(3).max(180), sourceName: z.string().trim().min(2).max(180), sourceUrl: z.string().url().startsWith("https://"), consultedOn: z.string().date(), summary: z.string().trim().min(10).max(5000), impact: z.string().trim().min(10).max(5000), decision: z.string().trim().min(10).max(5000), evidenceUrl: z.union([z.literal(""), z.string().url().startsWith("https://")]), nextReviewOn: z.union([z.literal(""), z.string().date()]), status: z.enum(statuses) });

async function context() {
  try { const value = await requireAuthenticatedUser(); if (value.profile.role === "trainer") throw new AuthorizationError(); return value; }
  catch (error) { if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new QualiopiWatchError("Accès réservé à l’administrateur et à la formatrice principale."); throw error; }
}

export async function getQualiopiWatchEntries() { const value = await context(); const { data, error } = await value.supabase.from("qualiopi_watch_entries").select("*").order("consulted_on", { ascending: false }); if (error) throw new QualiopiWatchError("Le registre de veille est indisponible."); return data ?? []; }

export async function createQualiopiWatchEntry(input: unknown) { const parsed = entrySchema.safeParse(input); if (!parsed.success) throw new QualiopiWatchError("Renseignez les champs obligatoires avec des liens HTTPS valides."); const value = await context(); const entry = parsed.data; const { error } = await value.supabase.from("qualiopi_watch_entries").insert({ indicator: entry.indicator, topic: entry.topic, source_name: entry.sourceName, source_url: entry.sourceUrl, consulted_on: entry.consultedOn, summary: entry.summary, impact: entry.impact, decision: entry.decision, evidence_url: entry.evidenceUrl || null, next_review_on: entry.nextReviewOn || null, status: entry.status, created_by: value.user.id }); if (error) throw new QualiopiWatchError("Impossible d’enregistrer cette veille."); }

export async function updateQualiopiWatchEntry(id: string, input: unknown) { if (!z.string().uuid().safeParse(id).success) throw new QualiopiWatchError("Veille introuvable."); const parsed = entrySchema.safeParse(input); if (!parsed.success) throw new QualiopiWatchError("Renseignez les champs obligatoires avec des liens HTTPS valides."); const value = await context(); const entry = parsed.data; const { error } = await value.supabase.from("qualiopi_watch_entries").update({ indicator: entry.indicator, topic: entry.topic, source_name: entry.sourceName, source_url: entry.sourceUrl, consulted_on: entry.consultedOn, summary: entry.summary, impact: entry.impact, decision: entry.decision, evidence_url: entry.evidenceUrl || null, next_review_on: entry.nextReviewOn || null, status: entry.status }).eq("id", id); if (error) throw new QualiopiWatchError("Impossible de modifier cette veille."); }
