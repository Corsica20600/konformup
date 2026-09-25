import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260925140000_ai_participant_guide_delivery.sql", "utf8");

describe("livret IA - journal de livraison", () => {
  it("réutilise le journal existant et sépare les renvois manuels des clés automatiques", () => {
    expect(migration).toContain("public.pre_training_document_deliveries");
    expect(migration).toContain("livret_ia_manual");
    expect(migration).toContain("where delivery_kind in ('documents_j5', 'reminder_j2')");
    expect(migration).toContain("on conflict (idempotency_key) do nothing");
    expect(migration).toContain("and status = 'pending'");
  });

  it("revalide les droits, la formation IA, le candidat, son email et sa présence dans le RPC", () => {
    expect(migration).toContain("auth.uid() is null or not public.can_access_session(p_session_id)");
    expect(migration).toContain("session.training_type = 'ai'");
    expect(migration).toContain("candidate.id = p_candidate_id");
    expect(migration).toContain("lower(btrim(candidate.email)) = lower(btrim(p_recipient_email))");
    expect(migration).toContain("coalesce(response.trainer_override_status, response.response_status) = 'present'");
    expect(migration).toContain("grant execute on function public.claim_ai_participant_guide_delivery");
    expect(migration).toContain("grant execute on function public.finish_ai_participant_guide_delivery");
  });
});
