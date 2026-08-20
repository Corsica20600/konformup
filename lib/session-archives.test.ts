import { describe, expect, it } from "vitest";
import { canCreateFinalArchive } from "@/lib/session-archives";

describe("session archive closure gates", () => {
  it("allows a complete archive only when all control points are settled", () => {
    expect(canCreateFinalArchive({ openSlots: 0, pendingAttendance: 0, incompleteEvaluations: 0, missingDocuments: [] })).toBe(true);
  });
  it("blocks open attendance, pending signatures, evaluations and mandatory documents", () => {
    expect(canCreateFinalArchive({ openSlots: 1, pendingAttendance: 0, incompleteEvaluations: 0, missingDocuments: [] })).toBe(false);
    expect(canCreateFinalArchive({ openSlots: 0, pendingAttendance: 1, incompleteEvaluations: 0, missingDocuments: [] })).toBe(false);
    expect(canCreateFinalArchive({ openSlots: 0, pendingAttendance: 0, incompleteEvaluations: 1, missingDocuments: [] })).toBe(false);
    expect(canCreateFinalArchive({ openSlots: 0, pendingAttendance: 0, incompleteEvaluations: 0, missingDocuments: ["Bilan"] })).toBe(false);
  });
});
