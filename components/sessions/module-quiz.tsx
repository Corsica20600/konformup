import { Card } from "@/components/ui/card";
import type { TrainingQuiz, TrainingQuizAnswer } from "@/lib/types";
import { cn } from "@/lib/utils";

const ANSWER_LABELS: Record<TrainingQuizAnswer, string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D"
};

function buildOptions(quiz: TrainingQuiz) {
  return [
    { key: "A" as const, text: quiz.option_a },
    { key: "B" as const, text: quiz.option_b },
    { key: "C" as const, text: quiz.option_c },
    { key: "D" as const, text: quiz.option_d }
  ];
}

export function ModuleQuiz({
  quizzes,
  moduleTitle
}: {
  quizzes: TrainingQuiz[];
  moduleTitle: string;
}) {
  return (
    <div className="grid gap-4">
      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Questions de verification</p>
        <h4 className="mt-2 text-xl font-bold">{moduleTitle}</h4>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Support d&apos;animation pour le formateur : chaque question affiche directement les propositions, la bonne
          reponse et l&apos;explication associee.
        </p>
      </Card>

      {quizzes.map((quiz, index) => (
        <Card key={quiz.id}>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Question {index + 1}</p>
          <h5 className="mt-2 text-lg font-bold">{quiz.question}</h5>

          <div className="mt-5 grid gap-3">
            {buildOptions(quiz).map((option) => {
              const isCorrect = option.key === quiz.correct_answer;

              return (
                <div
                  key={option.key}
                  className={cn(
                    "rounded-2xl border px-4 py-4",
                    isCorrect ? "border-pine bg-pine/5" : "border-ink/10 bg-canvas/60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isCorrect ? "bg-pine text-white" : "bg-sand text-ink/70"
                      )}
                    >
                      {ANSWER_LABELS[option.key]}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm leading-6 text-ink/80">{option.text}</p>
                      {isCorrect ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
                          Bonne reponse
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-canvas/70 px-4 py-4 text-sm leading-6 text-ink/75">
            <p className="font-semibold text-ink">Explication</p>
            <p className="mt-2">{quiz.explanation ?? "Aucune explication complementaire renseignee."}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
