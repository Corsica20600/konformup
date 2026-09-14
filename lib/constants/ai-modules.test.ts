import { describe, expect, it } from "vitest";
import { AI_MODULES, AI_QUIZZES, getAiModuleTotalMinutes } from "@/lib/constants/ai-modules";

describe("programme IA de deux heures", () => {
  it("contient onze séquences totalisant exactement 120 minutes", () => {
    expect(AI_MODULES).toHaveLength(11);
    expect(getAiModuleTotalMinutes()).toBe(120);
  });

  it("prévoit un diagnostic non noté et un quiz final de dix questions", () => {
    expect(AI_QUIZZES.filter((quiz) => quiz.moduleKey === "ai-02-diagnostic")).toHaveLength(6);
    expect(AI_QUIZZES.filter((quiz) => quiz.moduleKey === "ai-10-final-quiz")).toHaveLength(10);
    expect(AI_QUIZZES.every((quiz) => ["A", "B", "C", "D"].includes(quiz.correctAnswer))).toBe(true);
  });
});
