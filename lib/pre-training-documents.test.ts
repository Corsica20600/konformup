import { describe, expect, it } from "vitest";
import {
  deduplicateCandidateDocuments,
  deduplicateDocumentsByType,
  getRequiredPreTrainingDocumentTypes
} from "@/lib/pre-training-documents";

describe("documents avant formation", () => {
  it("adapte les pièces au type de formation", () => {
    expect(getRequiredPreTrainingDocumentTypes("sst_initial")).toEqual([
      "convocation",
      "welcome_pack",
      "aide_memoire"
    ]);
    expect(getRequiredPreTrainingDocumentTypes("mac_sst")).toEqual([
      "convocation",
      "welcome_pack",
      "aide_memoire"
    ]);
    expect(getRequiredPreTrainingDocumentTypes("hygiene")).toEqual(["convocation", "welcome_pack"]);
  });

  it("conserve une seule pièce récente par type lors de l'envoi", () => {
    const documents = [
      { document_type: "convocation", created_at: "2026-08-18T08:00:00Z", id: "old" },
      { document_type: "convocation", created_at: "2026-08-18T09:00:00Z", id: "new" },
      { document_type: "welcome_pack", created_at: "2026-08-18T08:30:00Z", id: "pack" }
    ];

    expect(deduplicateDocumentsByType(documents).map((document) => document.id)).toEqual(["new", "pack"]);
  });

  it("ne fusionne pas les documents de deux candidats différents", () => {
    const base = { session_id: "session", document_type: "convocation" };
    const documents = [
      { ...base, id: "candidate-a-old", candidate_id: "a", created_at: "2026-08-18T08:00:00Z" },
      { ...base, id: "candidate-a-new", candidate_id: "a", created_at: "2026-08-18T09:00:00Z" },
      { ...base, id: "candidate-b", candidate_id: "b", created_at: "2026-08-18T08:30:00Z" }
    ];

    expect(deduplicateCandidateDocuments(documents).map((document) => document.id)).toEqual([
      "candidate-a-new",
      "candidate-b"
    ]);
  });
});
