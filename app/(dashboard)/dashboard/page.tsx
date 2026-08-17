import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SessionList } from "@/components/sessions/session-list";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getDashboardQuoteStatuses,
  getDashboardStats,
  getDashboardWorkflowSnapshot,
  getSessions,
  RecoverableSessionQueryError
} from "@/lib/queries";
import { APP_BRANDING } from "@/lib/branding";
import { getDashboardActions } from "@/lib/dashboard-actions";
import type { DashboardWorkflowSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

function logDashboardBlockError(
  block: "stats" | "sessions" | "quotes" | "workflow",
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
  const [statsResult, sessionsResult, quoteStatusesResult, workflowResult] = await Promise.allSettled([
    getDashboardStats(),
    getSessions(),
    getDashboardQuoteStatuses(),
    getDashboardWorkflowSnapshot()
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
  const workflow: DashboardWorkflowSnapshot | undefined =
    workflowResult.status === "fulfilled" ? workflowResult.value : undefined;
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
  if (workflowResult.status === "rejected") {
    logDashboardBlockError("workflow", workflowResult.reason);
  }
  const recentSessions = sessions.slice(0, 5);
  const dashboardActions = getDashboardActions(sessions, quoteStatuses, workflow);

  return (
    <main className="grid gap-8">
      <Card className="border border-pine/10 bg-white p-7 md:p-9">
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">{APP_BRANDING.name}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{APP_BRANDING.dashboardTitle}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70">{APP_BRANDING.dashboardDescription}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/companies" className="rounded-[8px] bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
            Nouvelle société
          </Link>
          <Link href="/companies" className="rounded-[8px] bg-sand px-5 py-3 text-sm font-semibold transition hover:bg-[#d8ceb9]">
            Nouveau devis
          </Link>
          <Link href="/sessions" className="rounded-[8px] bg-sand px-5 py-3 text-sm font-semibold transition hover:bg-[#d8ceb9]">
            Créer une session
          </Link>
          <Link href="/sessions" className="rounded-[8px] border border-ink/10 bg-white px-5 py-3 text-sm font-semibold transition hover:border-pine/30 hover:text-pine">
            Voir les sessions
          </Link>
        </div>
      </Card>

      <section className="grid gap-5">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">À faire maintenant</p>
          <h2 className="mt-2 text-3xl font-bold">Prochaines actions</h2>
          <p className="mt-2 text-base text-ink/65">Les dossiers qui demandent votre attention, dans l’ordre du parcours formation.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboardActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`rounded-[8px] border bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-pine/40 ${
                action.count > 0 ? "border-pine/20" : "border-ink/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold leading-6">{action.label}</h3>
                <span
                  className={`grid h-10 min-w-10 place-items-center rounded-full px-2 text-base font-bold ${
                    action.count > 0 ? "bg-pine text-white" : "bg-canvas text-ink/45"
                  }`}
                >
                  {action.count}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/70">{action.description}</p>
              <p className={`mt-4 text-sm font-semibold ${action.count > 0 ? "text-pine" : "text-ink/45"}`}>
                {action.count > 0 ? "Ouvrir les dossiers" : "À jour"}
              </p>
            </Link>
          ))}
        </div>
        {workflowResult.status === "rejected" ? (
          <p className="rounded-[8px] border border-ink/10 bg-white px-4 py-3 text-sm text-ink/65">
            Certains compteurs détaillés sont temporairement indisponibles. Les accès aux dossiers restent actifs.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Activité formation</p>
          <h2 className="mt-2 text-3xl font-bold">Sessions récentes et à venir</h2>
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

      <section className="grid gap-5">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Vue d'ensemble</p>
          <h2 className="mt-2 text-2xl font-bold">Indicateurs</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Sessions totales" value={stats.totalSessions} />
          <StatCard label="Sessions en cours" value={stats.inProgressSessions} />
          <StatCard label="Candidats" value={stats.totalCandidates} />
          <StatCard label="Sessions terminées" value={stats.completedSessions} />
        </div>
      </section>
    </main>
  );
}
