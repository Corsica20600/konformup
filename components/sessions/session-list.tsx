import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
        <Link key={session.id} href={`/sessions/${session.id}`}>
          <Card className="transition hover:-translate-y-0.5 hover:bg-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold">{session.title}</h3>
                  <Badge tone={statusLabel[session.status].tone}>{statusLabel[session.status].label}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink/70">
                  {formatDate(session.start_date)} au {formatDate(session.end_date)}
                </p>
                <p className="mt-1 text-sm text-ink/55">{session.location}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
