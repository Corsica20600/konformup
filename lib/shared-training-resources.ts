import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { AuthenticationError, AuthorizationError, requireAuthenticatedUser } from "@/lib/auth";
import { validateSharedTrainingResourceFile, validateSharedTrainingResourceUrl } from "@/lib/shared-training-resource-validation";

const BUCKET = "shared-training-resources";
const SIGNED_URL_SECONDS = 300;
type ResourceStatus = "to_review" | "approved" | "integrated" | "rejected" | "obsolete";
type ResourceCategory = "support" | "video" | "regulation" | "exercise" | "quiz" | "administrative" | "other";
type ResourcePriority = "normal" | "important" | "urgent";
export class SharedTrainingResourceError extends Error { constructor(public readonly code: "unauthenticated" | "unauthorized" | "invalid" | "not_found" | "upload_failed" | "registry_failed", message: string) { super(message); this.name = "SharedTrainingResourceError"; } }

async function managerContext(adminOnly = false) {
  try {
    const context = await requireAuthenticatedUser();
    if (context.profile.role === "trainer" || (adminOnly && context.profile.role !== "admin")) throw new AuthorizationError();
    return context;
  } catch (error) {
    if (error instanceof AuthenticationError) throw new SharedTrainingResourceError("unauthenticated", "Authentification requise.");
    if (error instanceof AuthorizationError) throw new SharedTrainingResourceError("unauthorized", "Accès réservé à l’administrateur et à la formatrice principale.");
    throw error;
  }
}

async function notify(context: Awaited<ReturnType<typeof managerContext>>, resourceId: string, eventType: "new_resource" | "new_version" | "new_comment" | "status_changed", eventId: string) {
  const { data: recipients } = await context.supabase.from("profiles").select("id, role").in("role", ["admin", "lead_trainer"]);
  const rows = (recipients ?? []).filter((recipient) => recipient.id !== context.user.id).map((recipient) => ({ resource_id: resourceId, recipient_id: recipient.id, event_type: eventType, dedupe_key: `${eventType}:${eventId}:${recipient.id}` }));
  if (rows.length) await context.supabase.from("shared_training_resource_notifications").upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true });
}

async function audit(context: Awaited<ReturnType<typeof managerContext>>, resourceId: string, eventType: "created" | "version_added" | "commented" | "status_changed" | "metadata_updated" | "marked_integrated", details: Record<string, string | number | boolean | null> = {}) {
  await context.supabase.from("shared_training_resource_audit").insert({ resource_id: resourceId, event_type: eventType, details, performed_by: context.user.id });
}

function cleanText(value: string, label: string) { const text = value.trim(); if (!text) throw new SharedTrainingResourceError("invalid", `${label} requis.`); return text; }

export async function createSharedTrainingResource(input: { title: string; description?: string; category: ResourceCategory; priority: ResourcePriority; requestedChange?: string; trainingModuleId?: string | null; file?: File | null; externalUrl?: string | null }) {
  const context = await managerContext();
  const title = cleanText(input.title, "Titre");
  const resourceType = input.file ? "file" : "link";
  if (resourceType === "link" && !input.externalUrl) throw new SharedTrainingResourceError("invalid", "Lien HTTPS requis.");
  const resourceId = randomUUID();
  const { data: resource, error } = await context.supabase.from("shared_training_resources").insert({ id: resourceId, resource_type: resourceType, title, description: input.description?.trim() || null, category: input.category, priority: input.priority, requested_change: input.requestedChange?.trim() || null, training_module_id: input.trainingModuleId || null, created_by: context.user.id }).select("*").maybeSingle();
  if (error || !resource) throw new SharedTrainingResourceError("registry_failed", "Impossible d’enregistrer la ressource.");
  try {
    await addSharedTrainingResourceVersion(resourceId, { file: input.file, externalUrl: input.externalUrl }, false);
    await audit(context, resourceId, "created");
    await notify(context, resourceId, "new_resource", resourceId);
    return resource;
  } catch (cause) {
    throw cause;
  }
}

export async function addSharedTrainingResourceVersion(resourceId: string, input: { file?: File | null; externalUrl?: string | null }, notifyRecipients = true) {
  const context = await managerContext();
  const { data: resource } = await context.supabase.from("shared_training_resources").select("id, resource_type, created_by").eq("id", resourceId).maybeSingle();
  if (!resource) throw new SharedTrainingResourceError("not_found", "Ressource introuvable.");
  if (context.profile.role === "lead_trainer" && resource.created_by !== context.user.id) throw new SharedTrainingResourceError("unauthorized", "Seule l’administratrice peut versionner ce dépôt.");
  const { data: latest } = await context.supabase.from("shared_training_resource_versions").select("version_number").eq("resource_id", resourceId).order("version_number", { ascending: false }).limit(1).maybeSingle();
  const versionNumber = (latest?.version_number ?? 0) + 1;
  const versionId = randomUUID();
  let payload: Record<string, string | number | null>;
  let uploadedPath: string | null = null;
  if (resource.resource_type === "file") {
    if (!input.file) throw new SharedTrainingResourceError("invalid", "Fichier requis.");
    const bytes = new Uint8Array(await input.file.arrayBuffer());
    let valid; try { valid = validateSharedTrainingResourceFile({ name: input.file.name, type: input.file.type, size: input.file.size, bytes }); } catch (error) { throw new SharedTrainingResourceError("invalid", error instanceof Error ? error.message : "Fichier invalide."); }
    uploadedPath = `resources/${resourceId}/versions/${versionId}.${valid.extension}`;
    const { error: uploadError } = await context.supabase.storage.from(BUCKET).upload(uploadedPath, bytes, { contentType: valid.mime, upsert: false });
    if (uploadError) throw new SharedTrainingResourceError("upload_failed", "Impossible de téléverser le fichier.");
    payload = { id: versionId, resource_id: resourceId, version_number: versionNumber, resource_type: "file", storage_bucket: BUCKET, storage_path: uploadedPath, original_filename: valid.filename, mime_type: valid.mime, size_bytes: valid.size, sha256: createHash("sha256").update(bytes).digest("hex"), created_by: context.user.id };
  } else {
    const url = validateSharedTrainingResourceUrl(input.externalUrl || "");
    payload = { id: versionId, resource_id: resourceId, version_number: versionNumber, resource_type: "link", external_url: url.toString(), created_by: context.user.id };
  }
  const { data: version, error } = await context.supabase.from("shared_training_resource_versions").insert(payload).select("*").maybeSingle();
  if (error || !version) {
    if (uploadedPath) await context.supabase.storage.from(BUCKET).remove([uploadedPath]);
    throw new SharedTrainingResourceError("registry_failed", "La version n’a pas pu être enregistrée.");
  }
  await context.supabase.from("shared_training_resources").update({ updated_at: new Date().toISOString(), last_activity_at: new Date().toISOString() }).eq("id", resourceId);
  await audit(context, resourceId, "version_added", { version: versionNumber });
  if (notifyRecipients) await notify(context, resourceId, "new_version", versionId);
  return version;
}

export async function changeSharedTrainingResourceStatus(resourceId: string, status: ResourceStatus, integratedNote?: string) {
  const context = await managerContext(true);
  if (status === "integrated" && !cleanText(integratedNote || "", "Note d’intégration")) throw new SharedTrainingResourceError("invalid", "Note d’intégration requise.");
  const update = { status, integrated_note: status === "integrated" ? integratedNote!.trim() : null, integrated_at: status === "integrated" ? new Date().toISOString() : null, integrated_by: status === "integrated" ? context.user.id : null, updated_at: new Date().toISOString(), last_activity_at: new Date().toISOString() };
  const { data, error } = await context.supabase.from("shared_training_resources").update(update).eq("id", resourceId).select("id").maybeSingle();
  if (error || !data) throw new SharedTrainingResourceError("not_found", "Ressource introuvable.");
  await audit(context, resourceId, status === "integrated" ? "marked_integrated" : "status_changed", { status });
  await notify(context, resourceId, "status_changed", `${resourceId}:${status}:${Date.now()}`);
}

export async function addSharedTrainingResourceComment(resourceId: string, body: string) {
  const context = await managerContext();
  const { data, error } = await context.supabase.from("shared_training_resource_comments").insert({ resource_id: resourceId, body: cleanText(body, "Commentaire"), created_by: context.user.id }).select("id").maybeSingle();
  if (error || !data) throw new SharedTrainingResourceError("not_found", "Impossible d’enregistrer le commentaire.");
  await audit(context, resourceId, "commented"); await notify(context, resourceId, "new_comment", data.id); return data;
}

export async function updateSharedTrainingResourceMetadata(resourceId: string, input: { title: string; description?: string; category: ResourceCategory; priority: ResourcePriority; requestedChange?: string; trainingModuleId?: string | null }) {
  const context = await managerContext();
  const { data: existing } = await context.supabase.from("shared_training_resources").select("created_by, status").eq("id", resourceId).maybeSingle();
  if (!existing) throw new SharedTrainingResourceError("not_found", "Ressource introuvable.");
  if (context.profile.role === "lead_trainer" && (existing.created_by !== context.user.id || existing.status !== "to_review")) throw new SharedTrainingResourceError("unauthorized", "Ce dépôt ne peut plus être modifié par la formatrice principale.");
  const now = new Date().toISOString();
  const { error } = await context.supabase.from("shared_training_resources").update({ title: cleanText(input.title, "Titre"), description: input.description?.trim() || null, category: input.category, priority: input.priority, requested_change: input.requestedChange?.trim() || null, training_module_id: input.trainingModuleId || null, updated_at: now, last_activity_at: now }).eq("id", resourceId);
  if (error) throw new SharedTrainingResourceError("registry_failed", "Impossible de modifier la ressource.");
  await audit(context, resourceId, "metadata_updated");
}

export async function getSharedTrainingResources() {
  const context = await managerContext();
  const { data: resources, error } = await context.supabase.from("shared_training_resources").select("id, resource_type, title, description, category, priority, requested_change, status, training_module_id, integrated_note, integrated_at, created_by, created_at, updated_at, last_activity_at, profiles!shared_training_resources_created_by_fkey(full_name), training_modules(title)").order("last_activity_at", { ascending: false });
  if (error) throw new SharedTrainingResourceError("unauthorized", "Ressources temporairement indisponibles.");
  const ids = (resources ?? []).map((resource) => resource.id);
  const [versions, comments, audit] = await Promise.all([
    ids.length ? context.supabase.from("shared_training_resource_versions").select("id, resource_id, version_number, resource_type, external_url, original_filename, mime_type, size_bytes, created_at").in("resource_id", ids).order("version_number", { ascending: false }) : Promise.resolve({ data: [] }),
    ids.length ? context.supabase.from("shared_training_resource_comments").select("id, resource_id, body, created_at, profiles!shared_training_resource_comments_created_by_fkey(full_name)").in("resource_id", ids).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ids.length ? context.supabase.from("shared_training_resource_audit").select("id, resource_id, event_type, created_at").in("resource_id", ids).order("created_at", { ascending: false }) : Promise.resolve({ data: [] })
  ]);
  return { resources: resources ?? [], versions: versions.data ?? [], comments: comments.data ?? [], audit: audit.data ?? [], role: context.profile.role, userId: context.user.id };
}

export async function getSharedTrainingResourceModules() { const context = await managerContext(); const { data, error } = await context.supabase.from("training_modules").select("id, title").eq("is_active", true).order("module_order", { ascending: true }); if (error) throw new SharedTrainingResourceError("unauthorized", "Modules indisponibles."); return data ?? []; }
export async function createSharedTrainingResourceSignedUrl(versionId: string) { const context = await managerContext(); const { data, error } = await context.supabase.from("shared_training_resource_versions").select("storage_bucket, storage_path").eq("id", versionId).maybeSingle(); if (error || !data?.storage_bucket || !data.storage_path) throw new SharedTrainingResourceError("not_found", "Fichier introuvable."); const { data: signed, error: signedError } = await context.supabase.storage.from(data.storage_bucket).createSignedUrl(data.storage_path, SIGNED_URL_SECONDS); if (signedError || !signed?.signedUrl) throw new SharedTrainingResourceError("not_found", "Impossible d’ouvrir le fichier."); return { url: signed.signedUrl, expiresIn: SIGNED_URL_SECONDS }; }
export async function getUnreadSharedTrainingResourceNotificationsCount() { const context = await managerContext(); const { count } = await context.supabase.from("shared_training_resource_notifications").select("id", { count: "exact", head: true }).is("read_at", null); return count ?? 0; }
export async function markSharedTrainingResourceNotificationsRead() { const context = await managerContext(); await context.supabase.from("shared_training_resource_notifications").update({ read_at: new Date().toISOString() }).is("read_at", null); }
