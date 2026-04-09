import { QualiopiReadinessCard } from "@/components/dashboard/qualiopi-readiness-card";
import { Card } from "@/components/ui/card";
import { SessionList } from "@/components/sessions/session-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardStats, getSessions } from "@/lib/queries";
import { getOrganizationSettings } from "@/lib/organization";
import { getQualiopiReadinessSnapshot } from "@/lib/qualiopi";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, sessions, organizationSettings] = await Promise.all([
    getDashboardStats(),
    getSessions(),
    getOrganizationSettings()
  ]);
  const recentSessions = sessions.slice(0, 5);
  const qualiopiSnapshot = getQualiopiReadinessSnapshot({
    organization: organizationSettings,
    sessions
  });

  return (
    <main className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions totales" value={stats.totalSessions} />
        <StatCard label="Sessions en cours" value={stats.inProgressSessions} />
        <StatCard label="Candidats" value={stats.totalCandidates} />
        <StatCard label="Sessions terminées" value={stats.completedSessions} />
      </section>

      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Vue d'ensemble</p>
        <h2 className="mt-2 text-2xl font-bold">Tableau de bord</h2>
        <p className="mt-2 text-sm text-ink/65">
          Accès rapide aux sessions récentes et aux volumes clés de la formation SST.
        </p>
      </Card>

      <QualiopiReadinessCard snapshot={qualiopiSnapshot} />

      <section className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Sessions récentes</p>
          <h2 className="mt-2 text-2xl font-bold">Les 5 dernières sessions</h2>
        </div>
        <SessionList sessions={recentSessions} />
      </section>
    </main>
  );
}
