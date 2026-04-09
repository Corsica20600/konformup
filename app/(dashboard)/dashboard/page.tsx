import { QualiopiReadinessCard } from "@/components/dashboard/qualiopi-readiness-card";
import { Card } from "@/components/ui/card";
import { SessionList } from "@/components/sessions/session-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardStats, getSessions, RecoverableSessionQueryError } from "@/lib/queries";
import { getOrganizationSettings } from "@/lib/organization";
import { getQualiopiReadinessSnapshot } from "@/lib/qualiopi";

export const dynamic = "force-dynamic";

function logDashboardBlockError(
  block: "stats" | "sessions",
  error: unknown
) {
  const logLevel = error instanceof RecoverableSessionQueryError ? console.warn : console.error;

  if (error instanceof Error) {
    logLevel("[dashboard-block-error]", {
      block,
      name: error.name,
      message: error.message
    });
    return;
  }

  logLevel("[dashboard-block-error]", {
    block,
    message: "Unknown error"
  });
}

export default async function DashboardPage() {
  const organizationSettings = await getOrganizationSettings();
  const [statsResult, sessionsResult] = await Promise.allSettled([getDashboardStats(), getSessions()]);

  if (statsResult.status === "rejected" && !(statsResult.reason instanceof RecoverableSessionQueryError)) {
    throw statsResult.reason;
  }

  if (sessionsResult.status === "rejected" && !(sessionsResult.reason instanceof RecoverableSessionQueryError)) {
    throw sessionsResult.reason;
  }

  const stats =
    statsResult.status === "fulfilled"
      ? statsResult.value
      : {
          totalSessions: 0,
          inProgressSessions: 0,
          totalCandidates: 0,
          completedSessions: 0
        };
  const sessions = sessionsResult.status === "fulfilled" ? sessionsResult.value : [];
  const hasSessionsFallback = sessionsResult.status === "rejected";

  if (statsResult.status === "rejected") {
    logDashboardBlockError("stats", statsResult.reason);
  }

  if (sessionsResult.status === "rejected") {
    logDashboardBlockError("sessions", sessionsResult.reason);
  }
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
        {hasSessionsFallback ? (
          <Card>
            <h3 className="text-lg font-bold">Sessions temporairement indisponibles</h3>
            <p className="mt-2 text-sm text-ink/65">
              Les sessions ne peuvent pas etre chargees pour le moment. Verifie le schema Supabase puis recharge la page.
            </p>
          </Card>
        ) : null}
        <SessionList sessions={recentSessions} />
      </section>
    </main>
  );
}
