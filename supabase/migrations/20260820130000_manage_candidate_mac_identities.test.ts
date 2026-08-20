import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260820130000_manage_candidate_mac_identities.sql"), "utf8");

describe("candidate MAC identity administration contract", () => {
  it("backfills every historical candidate independently without an email or name match", () => {
    expect(migration).toContain("backfill_candidate_mac_identities");
    expect(migration).toContain("where mac_identity_id is null");
    expect(migration).toContain("sans rapprochement automatique");
    expect(migration).not.toMatch(/join\s+public\.candidates[^;]*(email|first_name|last_name)/i);
  });

  it("creates identities in the candidate insertion transaction and preserves explicit reuse", () => {
    expect(migration).toContain("before insert on public.candidates");
    expect(migration).toContain("assign_candidate_mac_identity");
    expect(migration).toContain("if new.mac_identity_id is null");
  });

  it("keeps a secondary identity, requires an admin reason and prevents cycles", () => {
    expect(migration).toContain("status in ('active', 'merged')");
    expect(migration).toContain("merged_into_identity_id");
    expect(migration).toContain("Motif administratif requis");
    expect(migration).toContain("Seules deux identités MAC actives");
    expect(migration).toContain("candidate_mac_identity_operations");
  });

  it("limits merge and link mutations to admins while allowing controlled reads", () => {
    expect(migration).toContain("public.current_app_role()::text <> 'admin'");
    expect(migration).toContain("candidate_mac_identities_read");
    expect(migration).toContain("public.can_access_candidate(candidate.id)");
    expect(migration).toContain("revoke all on table public.candidate_mac_identities from anon");
  });
});
