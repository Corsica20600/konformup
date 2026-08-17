import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSessionListAction } from "@/lib/session-list-action";
import { getTrainingDocumentTitle, getTrainingTypeLabel } from "@/lib/training-programs";
import { formatDate } from "@/lib/utils";
import type { SessionItem } from "@/lib/types";

const statusLabel: Record<
  SessionItem["status"],
  { label: string; tone: "neutral" | "success" | "warning" }
> = {
  draft: { label: "Brouillon", tone: "neutral" },
  scheduled: { label: "Planifiée", tone: "warning" },
  in_progress: { label: "En cours", tone: "warning" },
  completed: { label: "Terminée", tone: "success" },
  cancelled: { label: "Annulée", tone: "neutral" }
};

export function SessionList({ sessions }: { sessions: SessionItem[] }) {
  if (!sessions.length) {
    return (
      <Card>
        <h3 className="text-lg font-bold">Aucune session</h3>
        <p className="mt-2 text-sm text-ink/65">Crée une première session pour démarrer le suivi.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {sessions.map((session) => (
        <Link key={session.id} href={`/sessions/${session.id}`} className="group block">
          <Card className="border border-transparent transition group-hover:-translate-y-0.5 group-hover:border-pine/15 group-hover:bg-white">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{getTrainingTypeLabel(session.training_type)}</Badge>
                  <Badge tone={statusLabel[session.status].tone}>{statusLabel[session.status].label}</Badge>
                </div>
                <h3 className="mt-3 text-xl font-bold">
                  {getTrainingDocumentTitle(session.training_type, session.title)}
                </h3>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/65">
                  <span>{formatDate(session.start_date)} au {formatDate(session.end_date)}</span>
                  <span>{session.location}</span>
                  {session.trainer_name ? <span>Formateur : {session.trainer_name}</span> : null}
                </div>
              </div>
              <div className="shrink-0 rounded-[8px] bg-canvas px-4 py-3 md:max-w-64">
                <p className="text-xs font-semibold uppercase text-ink/45">Prochaine action</p>
                <p className="mt-1 text-sm font-semibold text-pine">{getSessionListAction(session)}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
