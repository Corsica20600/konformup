import { SharedResourcesWorkspace } from "@/components/shared-resources/shared-resources-workspace";
import { requireUser } from "@/lib/auth";
import { getSharedTrainingResourceModules, getSharedTrainingResources, markSharedTrainingResourceNotificationsRead } from "@/lib/shared-training-resources";

export const dynamic = "force-dynamic";

export default async function SharedResourcesPage() {
  // Layouts and pages may render concurrently. Authenticate before invoking the
  // resource service so an anonymous request follows the normal login redirect
  // instead of logging an expected authorization error.
  await requireUser();
  const [workspace, modules] = await Promise.all([getSharedTrainingResources(), getSharedTrainingResourceModules()]);
  await markSharedTrainingResourceNotificationsRead();
  const resources = workspace.resources.map((resource) => {
    const row = resource as typeof resource & { profiles?: { full_name?: string | null } | null; training_modules?: { title?: string | null } | null };
    return { id: row.id, createdBy: row.created_by, resourceType: row.resource_type as "file" | "link", title: row.title, description: row.description, category: row.category, priority: row.priority, requestedChange: row.requested_change, status: row.status, trainingModuleId: row.training_module_id, moduleTitle: row.training_modules?.title ?? null, author: row.profiles?.full_name ?? null, createdAt: row.created_at, lastActivityAt: row.last_activity_at, integratedNote: row.integrated_note };
  });
  const versions = workspace.versions.map((version) => ({ id: version.id, resourceId: version.resource_id, number: version.version_number, type: version.resource_type as "file" | "link", url: version.external_url, filename: version.original_filename, mime: version.mime_type, size: version.size_bytes, createdAt: version.created_at }));
  const comments = workspace.comments.map((comment) => { const row = comment as typeof comment & { profiles?: { full_name?: string | null } | null }; return { id: row.id, resourceId: row.resource_id, body: row.body, author: row.profiles?.full_name ?? null, createdAt: row.created_at }; });
  const audit = workspace.audit.map((entry) => ({ id: entry.id, resourceId: entry.resource_id, event: entry.event_type, createdAt: entry.created_at }));
  return <SharedResourcesWorkspace resources={resources} versions={versions} comments={comments} audit={audit} modules={modules} isAdmin={workspace.role === "admin"} viewerId={workspace.userId} />;
}
