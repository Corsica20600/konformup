import { describe, expect, it } from "vitest";
import { buildDefaultSlotDefinitions } from "@/lib/attendance";
import type { SessionItem } from "@/lib/types";

const session = { id: "session", start_date: "2026-09-21", end_date: "2026-09-21", duration_hours: 2 } as unknown as SessionItem;

describe("créneaux d'émargement", () => {
  it("calcule exactement la durée contractualisée", () => {
    const slots = buildDefaultSlotDefinitions(session);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ slot_label: "Jour 1 - matin" });
  });

  it("répartit 14 heures sur deux journées de 7 heures", () => {
    const slots = buildDefaultSlotDefinitions({ ...session, end_date: "2026-09-22", duration_hours: 14 });
    expect(slots).toHaveLength(4);
  });
});
