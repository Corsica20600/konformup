import { Card } from "@/components/ui/card";
import { CreateSessionForm } from "@/components/sessions/create-session-form";
import { SessionList } from "@/components/sessions/session-list";
import { getSessions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <main className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Nouvelle session</p>
        <h2 className="mt-2 text-2xl font-bold">Créer une session</h2>
        <p className="mt-2 text-sm text-ink/65">
          Renseigne le titre, les dates, le lieu et le statut initial.
        </p>
        <div className="mt-6">
          <CreateSessionForm />
        </div>
      </Card>

      <section className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Sessions</p>
          <h2 className="mt-2 text-2xl font-bold">Liste des sessions</h2>
        </div>
        <SessionList sessions={sessions} />
      </section>
    </main>
  );
}
