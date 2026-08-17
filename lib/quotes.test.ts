import { describe, expect, it } from "vitest";
import { buildSessionPayloadFromQuote } from "@/lib/quotes";

describe("quote to session mapping", () => {
  it("preserves Lot 3A documentary fields when creating a session from a quote", () => {
    const payload = buildSessionPayloadFromQuote(
      {
        id: "quote-1",
        quote_number: "DEVIS-2026-001",
        status: "accepted",
        training_type: "mac_sst",
        training_family: "sst",
        session_id: null,
        company_id: "company-1",
        title: "MAC SST",
        description: "Maintien et actualisation",
        candidate_count: 8,
        session_start_date: "2026-09-01",
        session_end_date: "2026-09-01",
        location: "Lyon",
        trainer_name: "Camille Rousseau",
        duration_hours: 7,
        prerequisites: "Certificat SST requis.",
        objectives: "Actualiser les compétences SST.",
        programme_outline: "Retour d'expérience\nMises en situation",
        accessibility_details: "Adaptation sur demande.",
        mac_previous_certificate_date: "2024-09-01",
        mac_previous_certificate_ref: "SST-2024-001",
        price_ht: 900,
        vat_rate: 20,
        total_ttc: 1080,
        notes: null,
        created_at: "2026-08-17T00:00:00.000Z",
        updated_at: "2026-08-17T00:00:00.000Z"
      },
      "trainer-user-1"
    );

    expect(payload.training_type).toBe("mac_sst");
    expect(payload.duration_hours).toBe(7);
    expect(payload.programme_outline).toContain("Mises en situation");
    expect(payload.mac_previous_certificate_ref).toBe("SST-2024-001");
    expect(payload.trainer_user_id).toBe("trainer-user-1");
  });
});
