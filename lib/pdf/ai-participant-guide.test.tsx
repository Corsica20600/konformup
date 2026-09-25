import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { OrganizationBranding, SessionItem } from "@/lib/types";
import { AIParticipantGuideDocument } from "@/lib/pdf/ai-participant-guide";

describe("livret participant IA PDF", () => {
  it("produit un PDF paginé et personnalisé pour le module de la session", async () => {
    const session = {
      id: "session-test",
      title: "Initiation et découverte à l’Intelligence Artificielle",
      training_type: "ai",
      objectives: "Découvrir les usages de l’IA générative\nConstruire et améliorer des prompts",
      programme_outline: "Fondamentaux\nChatGPT au travail\nExercices pratiques",
      duration_hours: 7
    } as SessionItem;
    const organization = {
      organization_name: "Konform’up",
      contact_email: "contact@example.test",
      contact_phone: null,
      resolved_logo_url: null,
      resolved_signature_url: null
    } as OrganizationBranding;

    const buffer = await renderToBuffer(createElement(AIParticipantGuideDocument, {
      session,
      participantName: "Candidat Test",
      organizationSettings: organization
    }) as never);
    const pdf = await PDFDocument.load(buffer);

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.getTitle()).toContain("Initiation et découverte");
    expect(pdf.getAuthor()).toBe("Konform’up");
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(3);
  }, 30000);
});
