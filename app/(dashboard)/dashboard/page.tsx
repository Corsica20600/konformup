import Link from "next/link";
import { QualiopiReadinessCard } from "@/components/dashboard/qualiopi-readiness-card";
import { Card } from "@/components/ui/card";
import { SessionList } from "@/components/sessions/session-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardQuoteStatuses, getDashboardStats, getSessions, RecoverableSessionQueryError } from "@/lib/queries";
import { getOrganizationSettings } from "@/lib/organization";
import { getQualiopiReadinessSnapshot } from "@/lib/qualiopi";
import { APP_BRANDING } from "@/lib/branding";
import { getDashboardActions } from "@/lib/dashboard-actions";

export const dynamic = "force-dynamic";

function logDashboardBlockError(
  block: "stats" | "sessions" | "quotes",
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
  const [statsResult, sessionsResult, quoteStatusesResult] = await Promise.allSettled([
    getDashboardStats(),
    getSessions(),
    getDashboardQuoteStatuses()
  ]);

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
  const quoteStatuses = quoteStatusesResult.status === "fulfilled" ? quoteStatusesResult.value : [];
  const hasSessionsFallback = sessionsResult.status === "rejected";

  if (statsResult.status === "rejected") {
    logDashboardBlockError("stats", statsResult.reason);
  }

  if (sessionsResult.status === "rejected") {
    logDashboardBlockError("sessions", sessionsResult.reason);
  }
  if (quoteStatusesResult.status === "rejected") {
    logDashboardBlockError("quotes", quoteStatusesResult.reason);
  }
  const recentSessions = sessions.slice(0, 5);
  const dashboardActions = getDashboardActions(sessions, quoteStatuses);
  const qualiopiSnapshot = getQualiopiReadinessSnapshot({
    organization: organizationSettings,
    sessions
  });

  return (
    <main className="grid gap-4">
      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">{APP_BRANDING.name}</p>
        <h2 className="mt-2 text-2xl font-bold">{APP_BRANDING.dashboardTitle}</h2>
        <p className="mt-2 text-sm text-ink/65">{APP_BRANDING.dashboardDescription}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/companies" className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink">
            Nouvelle société
          </Link>
          <Link href="/companies" className="rounded-full bg-sand px-4 py-2 text-sm font-semibold transition hover:bg-[#d8ceb9]">
            Nouveau devis
          </Link>
          <Link href="/sessions" className="rounded-full bg-sand px-4 py-2 text-sm font-semibold transition hover:bg-[#d8ceb9]">
            Voir les sessions
          </Link>
          <Link href="/sessions" className="rounded-full bg-sand px-4 py-2 text-sm font-semibold transition hover:bg-[#d8ceb9]">
            Sessions à préparer
          </Link>
        </div>
      </Card>

      <section className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">À faire maintenant</p>
          <h2 className="mt-2 text-2xl font-bold">Prochaines actions</h2>
        </div>
        {dashboardActions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardActions.map((action) => (
              <Link key={action.label} href={action.href} className="rounded-[8px] border border-ink/10 bg-white p-5 shadow-panel transition hover:border-pine/30">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold">{action.label}</h3>
                  <span className="grid h-8 min-w-8 place-items-center rounded-full bg-pine px-2 text-sm font-bold text-white">{action.count}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/65">{action.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-pine/20 bg-pine/10 px-5 py-4 text-sm text-pine">
            Aucune action urgente détectée. Les dossiers visibles sont à jour.
          </div>
        )}
      </section>

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions totales" value={stats.totalSessions} />
        <StatCard label="Sessions en cours" value={stats.inProgressSessions} />
        <StatCard label="Candidats" value={stats.totalCandidates} />
        <StatCard label="Sessions terminées" value={stats.completedSessions} />
      </section>

      <QualiopiReadinessCard snapshot={qualiopiSnapshot} />
    </main>
  );
}
