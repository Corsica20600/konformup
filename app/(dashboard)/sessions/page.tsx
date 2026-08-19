import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { CreateSessionForm } from "@/components/sessions/create-session-form";
import { SessionList } from "@/components/sessions/session-list";
import { getSessions, getTrainerOptions, RecoverableSessionQueryError } from "@/lib/queries";
import type { SessionItem, TrainerOption } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sessions" };

function SessionSection({ eyebrow, title, sessions, emptyMessage }: { eyebrow: string; title: string; sessions: SessionItem[]; emptyMessage: string }) {
  return <section className="grid gap-4"><div className="px-1"><p className="text-sm uppercase tracking-[0.25em] text-ink/45">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold">{title}</h2></div>{sessions.length ? <SessionList sessions={sessions} /> : <Card><p className="text-sm text-ink/65">{emptyMessage}</p></Card>}</section>;
}

export default async function SessionsPage() {
  let sessions: SessionItem[] = [];
  let trainers: TrainerOption[] = [];
  let hasRecoverableError = false;
  let hasTrainerError = false;
  try { sessions = await getSessions(); } catch (error) { if (error instanceof RecoverableSessionQueryError) hasRecoverableError = true; else throw error; }
  try { trainers = await getTrainerOptions(); } catch { hasTrainerError = true; }

  const activeSessions = sessions.filter((session) => session.status === "in_progress");
  const completedSessions = sessions.filter((session) => session.status === "completed").sort((left, right) => right.end_date.localeCompare(left.end_date));
  const featuredSessions = activeSessions.length ? activeSessions : completedSessions.slice(0, 1);
  const upcomingSessions = sessions.filter((session) => session.status === "draft" || session.status === "scheduled");
  const historySessions = sessions.filter((session) => session.status === "cancelled" || (session.status === "completed" && !featuredSessions.some((featured) => featured.id === session.id)));

  return <main className="grid gap-8">
    {hasRecoverableError ? <Card><h2 className="text-lg font-bold">Sessions temporairement indisponibles</h2><p className="mt-2 text-sm text-ink/65">Les sessions ne peuvent pas être chargées pour le moment. Vérifiez le schéma Supabase puis rechargez la page.</p></Card> : <>
      <SessionSection eyebrow={activeSessions.length ? "À suivre maintenant" : "Dernière clôture"} title={activeSessions.length ? "Session en cours" : "Dernière session terminée"} sessions={featuredSessions} emptyMessage="Aucune session en cours ou terminée pour le moment." />
      <SessionSection eyebrow="À préparer" title="Sessions à venir" sessions={upcomingSessions} emptyMessage="Aucune session à préparer." />
      <SessionSection eyebrow="Historique" title="Sessions terminées et annulées" sessions={historySessions} emptyMessage="Aucune autre session dans l’historique." />
    </>}
    <details className="rounded-[28px] border border-ink/10 bg-white/90 p-6 shadow-panel"><summary className="cursor-pointer list-none text-lg font-bold text-ink">Créer une session sans devis</summary><p className="mt-3 text-sm text-ink/65">Utilisez cette option uniquement pour un cas exceptionnel. Pour une formation vendue, créez la session depuis le devis accepté afin de reprendre automatiquement les informations de formation.</p><Link href="/companies" className="mt-3 inline-flex text-sm font-semibold text-pine underline underline-offset-4">Accéder aux sociétés et devis</Link>{hasTrainerError ? <p className="mt-3 text-sm text-accent">La liste des formateurs est temporairement indisponible. Rechargez la page avant de créer la session.</p> : null}<div className="mt-6"><CreateSessionForm trainers={trainers} /></div></details>
  </main>;
}
