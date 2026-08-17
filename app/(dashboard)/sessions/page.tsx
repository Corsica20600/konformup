import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { CreateSessionForm } from "@/components/sessions/create-session-form";
import { SessionList } from "@/components/sessions/session-list";
import { getSessions, getTrainerOptions, RecoverableSessionQueryError } from "@/lib/queries";
import type { SessionItem, TrainerOption } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sessions | Konform’up"
};

export default async function SessionsPage() {
  let sessions: SessionItem[] = [];
  let trainers: TrainerOption[] = [];
  let hasRecoverableError = false;
  let hasTrainerError = false;

  try {
    sessions = await getSessions();
  } catch (error) {
    if (error instanceof RecoverableSessionQueryError) {
      hasRecoverableError = true;
    } else {
      throw error;
    }
  }

  try {
    trainers = await getTrainerOptions();
  } catch {
    hasTrainerError = true;
  }

  return (
    <main className="grid gap-6">
      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Nouvelle session</p>
        <h2 className="mt-2 text-2xl font-bold">Créer une session</h2>
        <p className="mt-2 text-sm text-ink/65">
          Renseignez les informations utiles pour préparer et animer la formation.
        </p>
        <p className="mt-3 rounded-[8px] bg-canvas px-4 py-3 text-sm text-ink/70">
          Pour une formation vendue, créez de préférence la session depuis le devis accepté.
        </p>
        {hasTrainerError ? (
          <p className="mt-3 text-sm text-accent">
            La liste des formateurs est temporairement indisponible. Rechargez la page avant de créer la session.
          </p>
        ) : null}
        <div className="mt-6">
          <CreateSessionForm trainers={trainers} />
        </div>
      </Card>

      <section className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Sessions</p>
          <h2 className="mt-2 text-2xl font-bold">Liste des sessions</h2>
        </div>
        {hasRecoverableError ? (
          <Card>
            <h3 className="text-lg font-bold">Sessions temporairement indisponibles</h3>
            <p className="mt-2 text-sm text-ink/65">
              Les sessions ne peuvent pas etre chargees pour le moment. Verifie le schema Supabase puis recharge la page.
            </p>
          </Card>
        ) : null}
        <SessionList sessions={sessions} />
      </section>
    </main>
  );
}
