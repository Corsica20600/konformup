import { describe, expect, it } from "vitest";
import { getDuePreTrainingDeliveryKinds } from "@/lib/pre-training-document-deliveries";

describe("envois automatiques avant formation", () => {
  it("envoie le dossier à J-5 et le rappel à J-2", () => {
    expect(getDuePreTrainingDeliveryKinds("2026-09-20", "2026-09-15")).toEqual(["documents_j5"]);
    expect(getDuePreTrainingDeliveryKinds("2026-09-20", "2026-09-18")).toEqual(["documents_j5", "reminder_j2"]);
  });

  it("ne programme aucun envoi le jour même ou après la session", () => {
    expect(getDuePreTrainingDeliveryKinds("2026-09-20", "2026-09-20")).toEqual([]);
    expect(getDuePreTrainingDeliveryKinds("2026-09-20", "2026-09-21")).toEqual([]);
  });
});
