import { Card } from "@/components/ui/card";
import type { TrainerOption } from "@/lib/types";

export function TrainerList({ trainers }: { trainers: TrainerOption[] }) {
  if (!trainers.length) {
    return (
      <Card>
        <h3 className="text-lg font-bold">Aucun formateur</h3>
        <p className="mt-2 text-sm text-ink/65">
          Cree un premier formateur pour pouvoir le rattacher aux sessions.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {trainers.map((trainer) => (
        <Card key={trainer.id} className="transition hover:-translate-y-0.5 hover:bg-white">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold">
              {trainer.first_name} {trainer.last_name}
            </h3>
            <p className="text-sm text-ink/65">{trainer.email || "Email non renseigne"}</p>
            <p className="text-sm text-ink/55">{trainer.phone || "Telephone non renseigne"}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
