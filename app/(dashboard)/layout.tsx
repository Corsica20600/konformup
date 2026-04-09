import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MissingEnvCard } from "@/components/system/missing-env-card";
import { getSupabaseEnvMessage } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import { getOrganizationBranding } from "@/lib/organization";

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
  const organization = await getOrganizationBranding();

  return (
    <DashboardShell profile={profile} organization={organization}>
      {children}
    </DashboardShell>
  );
}
