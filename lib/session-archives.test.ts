import { describe, expect, it } from "vitest";
import { buildSessionArchiveObjectPath, canCreateFinalArchive } from "@/lib/session-archives";
import { hasClearGlobalEvaluation } from "@/lib/session-closure";

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
  it("requires an explicit global result, not separate theory and practice entries", () => {
    expect(hasClearGlobalEvaluation([
      { evaluation_type: "globale", result: "admis", evaluated_at: "2026-09-21T12:00:00Z" }
    ])).toBe(true);
    expect(hasClearGlobalEvaluation([
      { evaluation_type: "globale", result: "admis", evaluated_at: "2026-09-21T12:00:00Z" },
      { evaluation_type: "globale", result: "non_renseigne", evaluated_at: "2026-09-22T12:00:00Z" }
    ])).toBe(false);
    expect(hasClearGlobalEvaluation([
      { evaluation_type: "theorique", result: "admis", evaluated_at: "2026-09-21T12:00:00Z" },
      { evaluation_type: "pratique", result: "admis", evaluated_at: "2026-09-21T12:00:00Z" }
    ])).toBe(false);
  });
  it("uses versioned private paths with internal identifiers only", () => {
    expect(buildSessionArchiveObjectPath("session-id", 2, { id: "document-id", type: "attestation", mimeType: "application/pdf" })).toBe("sessions/session-id/archives/v2/documents/document-id.pdf");
    expect(buildSessionArchiveObjectPath("session-id", 2, { id: "attachment-id", type: "complaint_attachment", mimeType: "image/png" })).toBe("sessions/session-id/archives/v2/attachments/attachment-id.png");
  });
});
