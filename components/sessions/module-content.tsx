import { toggleSessionModuleAction } from "@/app/(dashboard)/sessions/actions";
import { ModuleQuiz } from "@/components/sessions/module-quiz";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SessionModule, TrainingQuiz } from "@/lib/types";

export function ModuleContent({
  sessionId,
  module,
  quizzes,
  quizError
}: {
  sessionId: string;
  module: SessionModule;
  quizzes: TrainingQuiz[];
  quizError?: string | null;
}) {
  const moduleLabel = module.module_type === "parent" ? "Module parent" : "Sous-module";

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">
              {moduleLabel} {module.module_order}
            </p>
            <h3 className="mt-2 text-2xl font-bold">{module.title}</h3>
            {module.summary ? <p className="mt-3 text-sm leading-6 text-ink/70">{module.summary}</p> : null}
          </div>
          <form action={toggleSessionModuleAction}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="moduleId" value={module.id} />
            <Button type="submit" variant={module.is_completed ? "secondary" : "primary"}>
              {module.is_completed ? "Module terminé" : "Marquer terminé"}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Contenu</p>
        <h4 className="mt-2 text-xl font-bold">Présentation du module</h4>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-ink/75">
          {module.content_text ?? "Aucun contenu texte renseigné pour ce module."}
        </p>
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Zone vidéo</p>
        {module.video_url ? (
          <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-sand">
            <iframe
              className="h-full w-full"
              src={module.video_url.replace("watch?v=", "embed/")}
              title={module.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink/65">Aucune vidéo disponible pour ce module.</p>
        )}
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">PDF</p>
        {module.pdf_url ? (
          <div className="mt-4 grid gap-4">
            <a
              href={module.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-pine"
            >
              Ouvrir le PDF
            </a>
            <iframe
              className="min-h-[420px] w-full rounded-2xl border border-ink/10 bg-white"
              src={module.pdf_url}
              title={module.title}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink/65">Aucun PDF disponible pour ce module.</p>
        )}
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Consignes formateur</p>
        <div className="mt-4 rounded-2xl bg-canvas/70 px-4 py-3 text-sm leading-6 text-ink/75">
          {module.trainer_guidance ?? "Aucune consigne formateur renseignée pour ce module."}
        </div>
      </Card>

      {module.module_type === "child" ? (
        quizError ? (
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Quiz</p>
            <h4 className="mt-2 text-xl font-bold">Chargement indisponible</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{quizError}</p>
          </Card>
        ) : quizzes.length ? (
          <ModuleQuiz quizzes={quizzes} moduleTitle={module.title} />
        ) : (
          <Card>
            <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Quiz</p>
            <h4 className="mt-2 text-xl font-bold">Aucun quiz disponible</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Aucun quiz n&apos;est encore rattaché à ce sous-module.
            </p>
          </Card>
        )
      ) : null}
    </div>
  );
}
