import { describe, expect, it } from "vitest";
import { buildSessionArchiveObjectPath, canCreateFinalArchive } from "@/lib/session-archives";
import { hasCompleteSessionEvaluation } from "@/lib/session-closure";

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
  it("uses the global evaluation for AI while preserving detailed evaluation gates for SST", () => {
    const global = { evaluation_type: "globale", result: "admis", status: "acquis", evaluated_at: "2026-09-21T12:00:00Z" };
    expect(hasCompleteSessionEvaluation("ai", [global])).toBe(true);
    expect(hasCompleteSessionEvaluation("sst_initial", [global])).toBe(false);
    expect(hasCompleteSessionEvaluation("sst_initial", [
      global,
      { evaluation_type: "theorique", result: "admis", status: "acquis", evaluated_at: "2026-09-21T12:00:00Z" },
      { evaluation_type: "pratique", result: "admis", status: "acquis", evaluated_at: "2026-09-21T12:00:00Z" }
    ])).toBe(true);
    expect(hasCompleteSessionEvaluation("ai", [
      { evaluation_type: "globale", result: "admis", status: "acquis", evaluated_at: "2026-09-21T12:00:00Z" },
      { evaluation_type: "globale", result: "non_renseigne", status: "non_evalue", evaluated_at: "2026-09-22T12:00:00Z" }
    ])).toBe(false);
    expect(hasCompleteSessionEvaluation("ai", [
      { evaluation_type: "theorique", result: "admis", status: "acquis", evaluated_at: "2026-09-21T12:00:00Z" },
      { evaluation_type: "pratique", result: "admis", status: "acquis", evaluated_at: "2026-09-21T12:00:00Z" }
    ])).toBe(false);
  });
  it("uses versioned private paths with internal identifiers only", () => {
    expect(buildSessionArchiveObjectPath("session-id", 2, { id: "document-id", type: "attestation", mimeType: "application/pdf" })).toBe("sessions/session-id/archives/v2/documents/document-id.pdf");
    expect(buildSessionArchiveObjectPath("session-id", 2, { id: "attachment-id", type: "complaint_attachment", mimeType: "image/png" })).toBe("sessions/session-id/archives/v2/attachments/attachment-id.png");
  });
});
