import { CreateTrainerForm } from "@/components/trainers/create-trainer-form";
import { TrainerList } from "@/components/trainers/trainer-list";
import { Card } from "@/components/ui/card";
import { getTrainerOptions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const trainers = await getTrainerOptions();

  return (
    <main className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Nouveau formateur</p>
        <h2 className="mt-2 text-2xl font-bold">Ajouter un formateur</h2>
        <p className="mt-2 text-sm text-ink/65">
          Cree une fiche simple pour pouvoir l'assigner rapidement aux sessions.
        </p>
        <div className="mt-6">
          <CreateTrainerForm />
        </div>
      </Card>

      <section className="grid gap-4">
        <div className="px-1">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Formateurs</p>
          <h2 className="mt-2 text-2xl font-bold">Liste des formateurs</h2>
        </div>
        <TrainerList trainers={trainers} />
      </section>
    </main>
  );
}
