import { describe, expect, it } from "vitest";
import {
  calculateSessionClosureSummary,
  getFinalDocumentSet,
  getRequiredFinalDocumentTypes,
  getForprevStatusForCandidate,
  getSessionClosureReadiness
} from "@/lib/session-closure";
import { getGeneratedDocumentLabel } from "@/lib/document-labels";
import type { SessionCandidate } from "@/lib/types";

function buildCandidate(overrides: Partial<SessionCandidate>): SessionCandidate {
  return {
    id: "candidate-session-id",
    session_id: "session-id",
    global_progress: 0,
    candidate: {
      id: "candidate-id",
      session_id: "session-id",
      company_id: null,
      first_name: "Ada",
      last_name: "Lovelace",
      email: null,
      company: null,
      phone: null,
      job_title: null,
      address: null,
      postal_code: null,
      city: null,
      validation_status: "pending",
      validated_at: null,
      sst_certificate_ref: null,
      sst_certificate_obtained_at: null,
      sst_certificate_expires_at: null,
      forprev_registration_status: "non_applicable"
    },
    evaluations: [],
    ...overrides
  };
}

describe("session closure", () => {
  it("calculates session final counts from candidate evaluations", () => {
    const summary = calculateSessionClosureSummary([
      buildCandidate({
        candidate: { ...buildCandidate({}).candidate, id: "admitted", validation_status: "validated" },
        evaluations: [{ id: "e1", session_id: "session-id", candidate_id: "admitted", evaluation_type: "globale", status: "acquis", result: "admis", trainer_notes: null, evaluated_at: null, evaluated_by: null, metadata: {}, created_at: "", updated_at: "" }]
      }),
      buildCandidate({
        candidate: { ...buildCandidate({}).candidate, id: "not-admitted", validation_status: "not_validated" },
        evaluations: [{ id: "e2", session_id: "session-id", candidate_id: "not-admitted", evaluation_type: "globale", status: "non_acquis", result: "non_admis", trainer_notes: null, evaluated_at: null, evaluated_by: null, metadata: {}, created_at: "", updated_at: "" }]
      }),
      buildCandidate({
        candidate: { ...buildCandidate({}).candidate, id: "absent", validation_status: "not_validated" },
        evaluations: [{ id: "e3", session_id: "session-id", candidate_id: "absent", evaluation_type: "globale", status: "absent", result: "absent", trainer_notes: null, evaluated_at: null, evaluated_by: null, metadata: {}, created_at: "", updated_at: "" }]
      })
    ]);

    expect(summary).toEqual({
      registeredCount: 3,
      presentCount: 2,
      admittedCount: 1,
      notAdmittedCount: 1,
      absentCount: 1
    });
  });

  it("keeps FORPREV non applicable for Hygiene", () => {
    expect(getForprevStatusForCandidate("hygiene", buildCandidate({}))).toBe("non_applicable");
    expect(getFinalDocumentSet("hygiene").join(" ")).not.toMatch(/SST|FORPREV/i);
  });

  it("lists only the retained final documents", () => {
    expect(getFinalDocumentSet("sst_initial")).not.toContain("Certificat de realisation");
  });

  it("does not treat external FORPREV administration as a generated final document", () => {
    for (const type of ["sst_initial", "mac_sst", "hygiene"] as const) {
      expect(getRequiredFinalDocumentTypes(type)).toEqual(["bilan_session", "attestation"]);
      expect(getFinalDocumentSet(type).join(" ")).not.toMatch(/FORPREV/i);
    }
  });

  it("labels the historical certificat type as an internal attestation", () => {
    expect(getGeneratedDocumentLabel("certificat")).toBe("Attestation interne de fin de formation");
    expect(getGeneratedDocumentLabel("certificat")).not.toMatch(/SST|FORPREV/i);
  });

  it("refuses closure when a global evaluation is missing", () => {
    expect(getSessionClosureReadiness([buildCandidate({ evaluations: [] })])).toEqual({
      canClose: false,
      missingGlobalEvaluationCount: 1
    });

    expect(getSessionClosureReadiness([
      buildCandidate({
        evaluations: [{
          id: "evaluation-unset",
          session_id: "session-id",
          candidate_id: "candidate-id",
          evaluation_type: "globale",
          status: "non_evalue",
          result: "non_renseigne",
          trainer_notes: null,
          evaluated_at: null,
          evaluated_by: null,
          metadata: {},
          created_at: "",
          updated_at: ""
        }]
      })
    ])).toEqual({
      canClose: false,
      missingGlobalEvaluationCount: 1
    });
  });

  it("allows closure when every candidate has a clear global result", () => {
    const results = ["admis", "non_admis", "absent", "partiel"] as const;
    const candidates = results.map((result, index) =>
      buildCandidate({
        id: `candidate-session-${index}`,
        candidate: { ...buildCandidate({}).candidate, id: `candidate-${index}` },
        evaluations: [{
          id: `evaluation-${index}`,
          session_id: "session-id",
          candidate_id: `candidate-${index}`,
          evaluation_type: "globale",
          status: result === "admis" ? "acquis" : result === "absent" ? "absent" : "non_acquis",
          result,
          trainer_notes: null,
          evaluated_at: "2026-08-17T10:00:00.000Z",
          evaluated_by: null,
          metadata: {},
          created_at: "",
          updated_at: ""
        }]
      })
    );

    expect(getSessionClosureReadiness(candidates)).toEqual({
      canClose: true,
      missingGlobalEvaluationCount: 0
    });
  });
});
