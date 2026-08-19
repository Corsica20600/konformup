import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormationModuleContent } from "@/components/sessions/formation-module-content";
import { FormationFullscreenButton } from "@/components/sessions/formation-fullscreen-button";
import { getFormationNavigation } from "@/lib/formation-navigation";
import {
  getSessionById,
  getTrainingQuizzesByModuleId,
  RecoverableSessionQueryError,
  SessionNotFoundError
} from "@/lib/queries";
import { getTrainingTypeLabel } from "@/lib/training-programs";
import type { TrainingQuiz } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mode formation"
};

export default async function FormationModePage({
  params,
  searchParams
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const { sessionId } = await params;
  const { module: selectedModuleId } = await searchParams;
  let data;

  try {
    data = await getSessionById(sessionId);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      notFound();
    }

    if (error instanceof RecoverableSessionQueryError) {
      return (
        <main className="grid min-h-screen place-items-center bg-canvas px-6 py-12">
          <section className="max-w-xl rounded-[8px] bg-white p-8 text-center shadow-panel">
            <h1 className="text-2xl font-bold">Mode formation indisponible</h1>
            <p className="mt-3 text-ink/65">Recharge la page ou retourne à la session pour réessayer.</p>
            <Link href={`/sessions/${sessionId}`} className="mt-6 inline-flex rounded-full bg-pine px-5 py-2 font-semibold text-white">
              Retour à la session
            </Link>
          </section>
        </main>
      );
    }

    throw error;
  }

  const { session, modules, globalProgress } = data;
  const navigation = getFormationNavigation(modules, selectedModuleId);
  let quizzes: TrainingQuiz[] = [];
  let quizError: string | null = null;

  if (navigation.current?.module_type === "child") {
    try {
      quizzes = await getTrainingQuizzesByModuleId(navigation.current.id);
    } catch {
      quizError = "Quiz indisponible";
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pine">Mode formation</p>
            <p className="mt-1 truncate text-lg font-bold">{session.title}</p>
            <p className="text-sm text-ink/55">{getTrainingTypeLabel(session.training_type)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-ink/65">Progression {globalProgress}%</span>
            <FormationFullscreenButton />
            <Link href={`/sessions/${session.id}`} className="rounded-full bg-sand px-4 py-2 text-sm font-semibold transition hover:bg-[#d8ceb9]">
              Retour à la session
            </Link>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-sand" aria-label={`Progression ${globalProgress}%`}>
            <div className="h-full rounded-full bg-pine transition-all" style={{ width: `${globalProgress}%` }} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:px-8 md:py-12">
        {navigation.current ? (
          <>
            <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6" aria-label="Navigation pédagogique">
              <div className="flex flex-wrap gap-3 text-sm font-semibold text-ink/60">
                <span>Étape {navigation.stepIndex} / {navigation.stepCount}</span>
                <span>Module {navigation.moduleIndex} / {navigation.moduleCount}</span>
                {navigation.submoduleIndex ? (
                  <span>Sous-module {navigation.submoduleIndex} / {navigation.submoduleCount}</span>
                ) : null}
              </div>
              {navigation.parent ? <p className="text-sm text-ink/55">Dans : {navigation.parent.title}</p> : null}
            </nav>

            <FormationModuleContent
              sessionId={session.id}
              module={navigation.current}
              quizzes={quizzes}
              quizError={quizError}
            />

            <nav className="flex items-center justify-between gap-4 border-t border-ink/10 pt-8" aria-label="Changer d'étape">
              {navigation.previous ? (
                <Link
                  href={`/sessions/${session.id}/formation?module=${navigation.previous.id}`}
                  className="rounded-full bg-sand px-5 py-3 text-sm font-semibold transition hover:bg-[#d8ceb9]"
                >
                  Précédent
                </Link>
              ) : <span />}
              {navigation.next ? (
                <Link
                  href={`/sessions/${session.id}/formation?module=${navigation.next.id}`}
                  className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink"
                >
                  Suivant
                </Link>
              ) : (
                <Link href={`/sessions/${session.id}`} className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
                  Terminer le mode formation
                </Link>
              )}
            </nav>
          </>
        ) : (
          <section className="rounded-[8px] border border-ink/10 bg-white p-8 text-center">
            <h1 className="text-3xl font-bold">Aucun module disponible</h1>
            <p className="mt-3 text-lg text-ink/65">Cette session ne contient pas encore de déroulé pédagogique.</p>
          </section>
        )}
      </div>
    </main>
  );
}
