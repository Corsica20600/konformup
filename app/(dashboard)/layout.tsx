import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MissingEnvCard } from "@/components/system/missing-env-card";
import { getSupabaseEnvMessage } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import { getUnreadSharedTrainingResourceNotificationsCount } from "@/lib/shared-training-resources";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const envMessage = getSupabaseEnvMessage();

  if (envMessage) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-12">
        <MissingEnvCard message={envMessage} />
      </main>
    );
  }

  const { profile } = await requireUser();
  const sharedResourceUnreadCount = profile.role === "admin" || profile.role === "lead_trainer" ? await getUnreadSharedTrainingResourceNotificationsCount() : 0;

  return (
    <DashboardShell profile={profile} sharedResourceUnreadCount={sharedResourceUnreadCount}>
      {children}
    </DashboardShell>
  );
}
