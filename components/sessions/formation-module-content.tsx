import { toggleSessionModuleAction } from "@/app/(dashboard)/sessions/actions";
import { ProjectionQuiz } from "@/components/sessions/projection-quiz";
import { Button } from "@/components/ui/button";
import { getVideoEmbedUrl } from "@/lib/formation-media";
import type { SessionModule, TrainingQuiz } from "@/lib/types";

export function FormationModuleContent({
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
  return (
    <div className="grid gap-10">
      <section className="grid gap-6 border-b border-ink/10 pb-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine">
              {module.module_type === "child" ? "Sous-module" : "Module"} {module.module_order}
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">{module.title}</h1>
            {module.summary ? <p className="mt-5 text-xl leading-8 text-ink/70">{module.summary}</p> : null}
          </div>
          <form action={toggleSessionModuleAction}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="moduleId" value={module.id} />
            <Button type="submit" variant={module.is_completed ? "secondary" : "primary"} className="min-h-11 px-5">
              {module.is_completed ? "Module terminé" : "Marquer terminé"}
            </Button>
          </form>
        </div>

        {module.content_text ? (
          <div className="max-w-5xl whitespace-pre-line text-xl leading-9 text-ink/85">{module.content_text}</div>
        ) : (
          <p className="text-lg text-ink/55">Aucun contenu texte n'est renseigné pour cette étape.</p>
        )}
      </section>

      {module.video_url ? (
        <section className="grid gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine">Vidéo</p>
          <div className="aspect-video overflow-hidden rounded-[8px] bg-ink">
            <iframe
              className="h-full w-full"
              src={getVideoEmbedUrl(module.video_url)}
              title={module.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      {module.pdf_url ? (
        <section className="flex flex-wrap items-center justify-between gap-4 border-y border-ink/10 py-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine">Support PDF</p>
            <p className="mt-2 text-lg text-ink/70">Ouvre le support dans un nouvel onglet pour le projeter.</p>
          </div>
          <a
            href={module.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-pine"
          >
            Ouvrir le support
          </a>
        </section>
      ) : null}

      {quizError ? (
        <section className="rounded-[8px] border border-accent/20 bg-accent/10 px-5 py-4 text-base text-accent">
          Les questions de cette étape ne sont pas disponibles pour le moment.
        </section>
      ) : quizzes.length ? (
        <ProjectionQuiz quizzes={quizzes} />
      ) : null}
    </div>
  );
}
