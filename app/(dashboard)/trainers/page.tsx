import { CreateTrainerForm } from "@/components/trainers/create-trainer-form";
import { TrainerList } from "@/components/trainers/trainer-list";
import { Card } from "@/components/ui/card";
import { getTrainerOptions } from "@/lib/queries";
import { TRAINER_PEDAGOGICAL_RESOURCE } from "@/lib/trainer-resources";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const trainers = await getTrainerOptions();

  return (
    <main className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
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

        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Ressource formateur</p>
          <h2 className="mt-2 text-2xl font-bold">{TRAINER_PEDAGOGICAL_RESOURCE.title}</h2>
          <p className="mt-2 text-sm text-ink/65">
            Support pedagogique rebrande Konformup, disponible dans l'espace formateur et envoyable par email.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={TRAINER_PEDAGOGICAL_RESOURCE.apiPath}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink"
            >
              Ouvrir le PDF
            </a>
          </div>
        </Card>
      </section>

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
