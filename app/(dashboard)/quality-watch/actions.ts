"use server";

import { revalidatePath } from "next/cache";
import { createQualiopiWatchEntry, QualiopiWatchError, updateQualiopiWatchEntryStatus } from "@/lib/qualiopi-watch";

export type QualiopiWatchActionState = { success?: string; error?: string };
const text = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const state = (error: unknown) => ({ error: error instanceof QualiopiWatchError ? error.message : "Cette action n’a pas pu être enregistrée." });
export async function createQualiopiWatchEntryAction(_: QualiopiWatchActionState, data: FormData): Promise<QualiopiWatchActionState> { try { await createQualiopiWatchEntry({ indicator: text(data, "indicator"), topic: text(data, "topic"), sourceName: text(data, "sourceName"), sourceUrl: text(data, "sourceUrl"), consultedOn: text(data, "consultedOn"), summary: text(data, "summary"), impact: text(data, "impact"), decision: text(data, "decision"), evidenceUrl: text(data, "evidenceUrl"), nextReviewOn: text(data, "nextReviewOn"), status: text(data, "status") }); revalidatePath("/quality-watch"); return { success: "Veille enregistrée et horodatée." }; } catch (error) { return state(error); } }
export async function updateQualiopiWatchEntryAction(_: QualiopiWatchActionState, data: FormData): Promise<QualiopiWatchActionState> { try { await updateQualiopiWatchEntryStatus(text(data, "id"), text(data, "status"), text(data, "evidenceUrl")); revalidatePath("/quality-watch"); return { success: "Statut et preuve mis à jour." }; } catch (error) { return state(error); } }
