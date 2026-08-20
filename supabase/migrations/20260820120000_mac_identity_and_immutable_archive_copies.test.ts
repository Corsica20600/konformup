import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260820120000_mac_identity_and_immutable_archive_copies.sql"), "utf8");

describe("MAC identity and immutable archive copy contract", () => {
  it("uses an explicit identity rather than email matching", () => {
    expect(migration).toContain("candidate_mac_identities");
    expect(migration).toContain("mac_identity_id uuid");
    expect(migration).toContain("never inferred from email, name or company");
  });
  it("keeps archive storage private and versioned", () => {
    expect(migration).toContain("session-archives");
    expect(migration).toContain("session_archives_storage_delete_building");
    expect(migration).toContain("can_delete_building_session_archive");
  });
});
