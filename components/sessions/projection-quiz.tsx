"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export function ProjectionQuiz({ quizzes }: { quizzes: TrainingQuiz[] }) {
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(() => new Set());

  const toggleAnswer = (quizId: string) => {
    setRevealedAnswers((current) => {
      const next = new Set(current);
      if (next.has(quizId)) {
        next.delete(quizId);
      } else {
        next.add(quizId);
      }
      return next;
    });
  };

  return (
    <section className="grid gap-8 border-t border-ink/10 pt-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pine">Quiz</p>
        <h2 className="mt-2 text-3xl font-bold">Questions de vérification</h2>
      </div>

      {quizzes.map((quiz, index) => {
        const isRevealed = revealedAnswers.has(quiz.id);

        return (
          <article key={quiz.id} className="grid gap-6 rounded-[8px] border border-ink/10 bg-white p-6 md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/45">Question {index + 1}</p>
              <h3 className="mt-3 text-2xl font-bold leading-9">{quiz.question}</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {buildOptions(quiz).map((option) => {
                const isCorrect = option.key === quiz.correct_answer;

                return (
                  <div
                    key={option.key}
                    className={cn(
                      "flex min-h-20 items-start gap-4 rounded-[8px] border px-5 py-4",
                      isRevealed && isCorrect ? "border-pine bg-pine/10" : "border-ink/10 bg-canvas/50"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                        isRevealed && isCorrect ? "bg-pine text-white" : "bg-sand text-ink"
                      )}
                    >
                      {ANSWER_LABELS[option.key]}
                    </span>
                    <p className="pt-1 text-lg leading-7">{option.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <Button type="button" variant={isRevealed ? "secondary" : "primary"} onClick={() => toggleAnswer(quiz.id)}>
                {isRevealed ? "Masquer la réponse" : "Afficher la réponse"}
              </Button>
              {isRevealed ? (
                <div className="max-w-2xl rounded-[8px] border border-pine/20 bg-pine/10 px-5 py-4 text-base leading-7">
                  <p className="font-semibold text-pine">Bonne réponse : {quiz.correct_answer}</p>
                  <p className="mt-1 text-ink/75">
                    {quiz.explanation ?? "Aucune explication complémentaire renseignée."}
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}
