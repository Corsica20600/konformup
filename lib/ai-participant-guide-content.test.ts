import { describe, expect, it } from "vitest";
import { AI_GUIDE_COMMON_SECTIONS, AI_GUIDE_PROMPTS, getAiGuideSessionFocus, isAIGuideRecipientEligible } from "@/lib/ai-participant-guide-content";

describe("contenu du livret participant IA", () => {
  it("contient le socle commun, les vigilances et la bibliothèque de prompts", () => {
    const allCommonText = AI_GUIDE_COMMON_SECTIONS.flatMap((section) => [section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? [])]).join(" ");
    expect(allCommonText).toContain("IA générative");
    expect(allCommonText).toContain("Hallucinations");
    expect(allCommonText).toContain("mots de passe");
    expect(AI_GUIDE_PROMPTS).toHaveLength(9);
    expect(AI_GUIDE_PROMPTS.some(({ prompt }) => prompt.includes("[CONTEXTE]") && prompt.includes("[OBJECTIF]") && prompt.includes("[PUBLIC]") && prompt.includes("[TON]") && prompt.includes("[CONTRAINTES]"))).toBe(true);
  });

  it("adapte le support aux objectifs et au programme de chaque module", () => {
    expect(getAiGuideSessionFocus({ title: "IA commerciale", objectives: "Préparer les rendez-vous\nStructurer des relances", programme_outline: "Qualification\nArgumentaires\nProspection" })).toMatchObject({
      title: "IA commerciale",
      objectives: ["Préparer les rendez-vous", "Structurer des relances"],
      practiceThemes: ["Qualification", "Argumentaires", "Prospection"]
    });
  });

  it("n’autorise que les candidats présents, joignables et avec un PDF", () => {
    expect(isAIGuideRecipientEligible({ email: "candidate@example.test", attendance: "present", hasDocument: true })).toBe(true);
    for (const attendance of ["absent", "partial", "issue", "pending", "unknown"] as const) {
      expect(isAIGuideRecipientEligible({ email: "candidate@example.test", attendance, hasDocument: true })).toBe(false);
    }
    expect(isAIGuideRecipientEligible({ email: " ", attendance: "present", hasDocument: true })).toBe(false);
    expect(isAIGuideRecipientEligible({ email: "candidate@example.test", attendance: "present", hasDocument: false })).toBe(false);
  });
});
